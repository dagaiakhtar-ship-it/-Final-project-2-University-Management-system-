import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEnrollmentSchema } from '../../validators/enrollment.validators';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { ArrowLeft, Save, ShieldAlert, CheckCircle, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StudentOption {
  id: number;
  fullName: string;
  rollNumber: string;
  registrationNumber: string;
  userId: number;
}

interface CourseOfferingOption {
  id: number;
  courseCode: string;
  academicYear: string;
  session: string;
  maxStudents: number;
  currentEnrollment: number;
  subject: { name: string; code: string };
  teacher: { user: { firstName: string; lastName: string } };
}

export const EnrollmentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOfferingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLookups, setFetchingLookups] = useState(true);

  // Default values
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createEnrollmentSchema),
    defaultValues: {
      studentId: undefined as any,
      courseOfferingId: undefined as any,
      academicYear: '2026-2027',
      session: 'Fall' as 'Spring' | 'Summer' | 'Fall' | 'Winter',
      enrollmentType: 'Regular' as 'Regular' | 'Repeat' | 'Improvement' | 'Audit',
      creditsRegistered: 3,
      tuitionStatus: 'Pending' as 'Pending' | 'Paid' | 'Scholarship',
      advisorApproval: false,
      registrarApproval: false,
      status: 'Pending' as 'Pending' | 'Approved' | 'Enrolled' | 'Dropped' | 'Withdrawn' | 'Completed',
      remarks: '',
    },
  });

  const watchedCourseOfferingId = watch('courseOfferingId');

  // Load available students and course offerings
  useEffect(() => {
    const loadLookups = async () => {
      setFetchingLookups(true);
      try {
        const [studRes, coRes] = await Promise.all([
          apiClient.get('/students'),
          apiClient.get('/course-offerings'),
        ]);

        const studentList = studRes.data?.data?.data || studRes.data?.data || [];
        const offeringList = coRes.data?.data?.data || coRes.data?.data || [];

        setStudents(studentList);
        setCourseOfferings(offeringList);

        // If STUDENT role, pre-select their student profile ID
        if (isStudent && user) {
          const myProfile = studentList.find((s: StudentOption) => s.userId === user.id);
          if (myProfile) {
            setValue('studentId', myProfile.id);
          }
        }
      } catch (err) {
        console.error('Failed to load form lookup data', err);
        toast.error('Failed to load students or course offerings lists.');
      } finally {
        setFetchingLookups(false);
      }
    };

    loadLookups();
  }, [isStudent, user, setValue]);

  // Sync session & academic year based on selected course offering (Convenience)
  useEffect(() => {
    if (watchedCourseOfferingId) {
      const selected = courseOfferings.find((o) => o.id === Number(watchedCourseOfferingId));
      if (selected) {
        setValue('session', selected.session as any);
        setValue('academicYear', selected.academicYear);
      }
    }
  }, [watchedCourseOfferingId, courseOfferings, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        studentId: Number(data.studentId),
        courseOfferingId: Number(data.courseOfferingId),
        creditsRegistered: Number(data.creditsRegistered),
      };

      const response = await apiClient.post('/enrollments', payload);
      if (response.data?.status === 'success') {
        toast.success(
          isStudent
            ? 'Course registration request submitted successfully!'
            : 'Enrollment record generated successfully!'
        );
        navigate(ROUTES.ENROLLMENTS);
      }
    } catch (err: any) {
      console.error('Enrollment registration error', err);
      const errMsg = err.response?.data?.message || 'Failed to submit registration request.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingLookups) {
    return (
      <PageContainer>
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-sm text-gray-500">Loading academic directories...</p>
        </div>
      </PageContainer>
    );
  }

  // Find selected offering details for rendering summary
  const selectedOffering = courseOfferings.find((o) => o.id === Number(watchedCourseOfferingId));

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Link to={ROUTES.ENROLLMENTS}>
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {isStudent ? 'Register for a Course' : 'Create Student Enrollment'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isStudent ? 'Add a class offering to your academic portfolio.' : 'Assign a student to a class and verify credits/capacity.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Student Picker */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Student Profile <span className="text-red-500">*</span>
                </label>
                {isStudent ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {students.find((s) => s.userId === user?.id)?.fullName || `${user?.firstName} ${user?.lastName}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Roll No: {students.find((s) => s.userId === user?.id)?.rollNumber || 'Active Self'}
                      </div>
                    </div>
                    {/* Hidden Input to register value */}
                    <input type="hidden" {...register('studentId')} />
                  </div>
                ) : (
                  <select
                    {...register('studentId')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.rollNumber})
                      </option>
                    ))}
                  </select>
                )}
                {errors.studentId && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> {errors.studentId.message as string}
                  </p>
                )}
              </div>

              {/* Course Offering Picker */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Select Course Offering <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('courseOfferingId')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="">-- Choose Course Offering --</option>
                  {courseOfferings.map((co) => (
                    <option key={co.id} value={co.id}>
                      {co.subject?.name} [{co.courseCode}] &bull; {co.session} {co.academicYear} &bull; ({co.currentEnrollment}/{co.maxStudents} filled)
                    </option>
                  ))}
                </select>
                {errors.courseOfferingId && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> {errors.courseOfferingId.message as string}
                  </p>
                )}
              </div>

              {/* Academic Term (Read-only auto-synced convenience) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-lg p-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    {...register('academicYear')}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 2026-2027"
                  />
                  {errors.academicYear && (
                    <p className="text-xs text-red-600 mt-1">{errors.academicYear.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">
                    Session Semester
                  </label>
                  <select
                    {...register('session')}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                    <option value="Winter">Winter</option>
                  </select>
                  {errors.session && (
                    <p className="text-xs text-red-600 mt-1">{errors.session.message as string}</p>
                  )}
                </div>
              </div>

              {/* Detail fields: Credits & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    Credits Registered <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    {...register('creditsRegistered', { valueAsNumber: true })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                  {errors.creditsRegistered && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> {errors.creditsRegistered.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    Enrollment Type
                  </label>
                  <select
                    {...register('enrollmentType')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Repeat">Repeat</option>
                    <option value="Improvement">Improvement</option>
                    <option value="Audit">Audit</option>
                  </select>
                  {errors.enrollmentType && (
                    <p className="text-xs text-red-600 mt-1">{errors.enrollmentType.message as string}</p>
                  )}
                </div>
              </div>

              {/* Admin-only properties */}
              {isAdmin && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">Administrative Clearances</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1.5">Tuition Fees Status</label>
                      <select
                        {...register('tuitionStatus')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Scholarship">Scholarship</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1.5">Enrollment Status</label>
                      <select
                        {...register('status')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Enrolled">Enrolled</option>
                        <option value="Dropped">Dropped</option>
                        <option value="Withdrawn">Withdrawn</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-indigo-50/50 border border-indigo-100/30 p-3.5 rounded-lg">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        {...register('advisorApproval')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      Advisor Approval
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        {...register('registrarApproval')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      Registrar Activation
                    </label>
                  </div>
                </div>
              )}

              {/* Remarks Textarea */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  {...register('remarks')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Provide registration details, repeat semesters, special circumstances..."
                />
                {errors.remarks && (
                  <p className="text-xs text-red-600 mt-1">{errors.remarks.message as string}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link to={ROUTES.ENROLLMENTS}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="primary" disabled={loading} className="inline-flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? 'Submitting...' : isStudent ? 'Submit Registration' : 'Register Student'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Side summary panel */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900 text-white">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Offering Summary</h3>
            {selectedOffering ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Class Subject</span>
                  <div className="text-sm font-semibold mt-0.5">{selectedOffering.subject?.name}</div>
                  <div className="text-xs text-indigo-300 font-mono mt-0.5">{selectedOffering.courseCode}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Assigned Teacher</span>
                  <div className="text-xs mt-0.5">{selectedOffering.teacher?.user?.firstName} {selectedOffering.teacher?.user?.lastName}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Class Term</span>
                    <span className="text-xs font-medium">{selectedOffering.session}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Year</span>
                    <span className="text-xs font-medium">{selectedOffering.academicYear}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Roster Capacity</span>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (selectedOffering.currentEnrollment / selectedOffering.maxStudents) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>{selectedOffering.currentEnrollment} filled</span>
                    <span>{selectedOffering.maxStudents} max</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center italic">
                Choose a Course Offering to review class schedules, lecture rosters, and teacher summaries.
              </div>
            )}
          </Card>

          <Card className="p-4 border border-indigo-100 bg-indigo-50/20">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Enrollment Policies
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Each course registration defaults to <strong>3 credit hours (CH)</strong>.</li>
              <li>A student is permitted to enroll in a maximum of <strong>6 classes (18 Credit Hours)</strong> per semester.</li>
              <li>Course duplicate enrollments in the same term are strictly blocked by schema indexes.</li>
              <li>Approval tracks are processed by Department Advisors and Registrar boards dynamically.</li>
            </ul>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
