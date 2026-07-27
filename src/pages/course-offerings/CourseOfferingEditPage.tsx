import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateCourseOfferingSchema } from '../../validators/course-offering.validators';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import {
  ArrowLeft,
  Save,
  Building,
  GraduationCap,
  Calendar,
  BookOpen,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LookupOptions {
  departments: Array<{ id: number; name: string; code: string }>;
  programs: Array<{ id: number; name: string; code: string; departmentId: number }>;
  semesters: Array<{ id: number; name: string; code: string; programId: number }>;
  sections: Array<{ id: number; name: string; code: string; semesterId: number }>;
  subjects: Array<{ id: number; name: string; code: string }>;
  teachers: Array<{
    id: number;
    uuid: string;
    employeeId: string;
    user: { firstName: string; lastName: string };
  }>;
}

export const CourseOfferingEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Lookups and cascade states
  const [lookups, setLookups] = useState<LookupOptions>({
    departments: [],
    programs: [],
    semesters: [],
    sections: [],
    subjects: [],
    teachers: [],
  });

  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);

  // Setup form validation with Zod
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateCourseOfferingSchema),
    defaultValues: {
      departmentId: 0,
      programId: 0,
      semesterId: 0,
      sectionId: 0,
      subjectId: 0,
      teacherId: 0,
      academicYear: '',
      session: 'Fall' as 'Fall' | 'Spring' | 'Summer',
      startDate: '',
      endDate: '',
      weeklyLectureHours: 3,
      weeklyLabHours: 0,
      maxStudents: 50,
      status: 'Upcoming' as 'Upcoming' | 'Active' | 'Completed' | 'Cancelled',
      description: '',
    },
  });

  // Watch variables for cascade triggers
  const watchedDeptId = Number(watch('departmentId') || 0);
  const watchedProgId = Number(watch('programId') || 0);
  const watchedSemId = Number(watch('semesterId') || 0);

  // Helper to format ISO strings to date input value YYYY-MM-DD
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // 1. Load lookups and details on mount
  useEffect(() => {
    const loadAllData = async () => {
      setFetching(true);
      try {
        // Fetch Lookups
        const lookupsRes = await apiClient.get('/course-offerings/lookup-options');
        let loadedLookups: LookupOptions = {
          departments: [],
          programs: [],
          semesters: [],
          sections: [],
          subjects: [],
          teachers: [],
        };

        if (lookupsRes.data?.status === 'success') {
          loadedLookups = lookupsRes.data.data;
          setLookups(loadedLookups);
        }

        // Fetch Course Offering record details
        const offeringRes = await apiClient.get(`/course-offerings/${id}`);
        if (offeringRes.data?.status === 'success') {
          const detail = offeringRes.data.data;

          // Hydrate forms
          reset({
            departmentId: detail.departmentId,
            programId: detail.programId,
            semesterId: detail.semesterId,
            sectionId: detail.sectionId,
            subjectId: detail.subjectId,
            teacherId: detail.teacherId,
            academicYear: detail.academicYear,
            session: detail.session,
            startDate: formatDateForInput(detail.startDate),
            endDate: formatDateForInput(detail.endDate),
            weeklyLectureHours: detail.weeklyLectureHours,
            weeklyLabHours: detail.weeklyLabHours,
            maxStudents: detail.maxStudents,
            status: detail.status,
            description: detail.description || '',
          });

          // Preset cascade lists with actual values from lookups
          if (detail.departmentId) {
            setFilteredPrograms(loadedLookups.programs.filter((p) => p.departmentId === detail.departmentId));
          }
          if (detail.programId) {
            setFilteredSemesters(loadedLookups.semesters.filter((s) => s.programId === detail.programId));
          }
          if (detail.semesterId) {
            setFilteredSections(loadedLookups.sections.filter((s) => s.semesterId === detail.semesterId));
          }
        }
      } catch (err) {
        console.error('[CourseOfferingEdit] Load data error:', err);
        toast.error('Failed to load course offering details');
        navigate(ROUTES.COURSE_OFFERINGS);
      } finally {
        setFetching(false);
      }
    };

    loadAllData();
  }, [id, reset, navigate]);

  // 2. Cascade updating hooks when user manually updates drop-downs
  useEffect(() => {
    if (watchedDeptId > 0 && !fetching) {
      setFilteredPrograms(lookups.programs.filter((p) => p.departmentId === watchedDeptId));
      setValue('programId', 0);
      setValue('semesterId', 0);
      setValue('sectionId', 0);
    }
  }, [watchedDeptId, fetching, lookups.programs, setValue]);

  useEffect(() => {
    if (watchedProgId > 0 && !fetching) {
      setFilteredSemesters(lookups.semesters.filter((s) => s.programId === watchedProgId));
      setValue('semesterId', 0);
      setValue('sectionId', 0);
    }
  }, [watchedProgId, fetching, lookups.semesters, setValue]);

  useEffect(() => {
    if (watchedSemId > 0 && !fetching) {
      setFilteredSections(lookups.sections.filter((s) => s.semesterId === watchedSemId));
      setValue('sectionId', 0);
    }
  }, [watchedSemId, fetching, lookups.sections, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);

    if (new Date(data.startDate) >= new Date(data.endDate)) {
      toast.error('Start Date must be before End Date');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };

      const response = await apiClient.put(`/course-offerings/${id}`, payload);
      if (response.data?.status === 'success') {
        toast.success('Course offering updated successfully!');
        navigate(ROUTES.COURSE_OFFERINGS);
      }
    } catch (err: any) {
      console.error('[CourseOfferingEdit] Error:', err);
      const errMsg = err.response?.data?.message || 'Failed to update course offering';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <PageContainer
        title="Edit Pairing"
      >
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium mt-4">Loading pairing record...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Course Offering Pairing"
      description="Modify scheduling, teacher assignment, load sizes, and active pairing states."
      action={
        <Link to={ROUTES.COURSE_OFFERINGS} id="btn-back-link">
          <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Offerings</span>
          </Button>
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl flex flex-col gap-6" id="course-offering-edit-form">
        {/* Core Pairing Information */}
        <Card id="card-pairing-info" className="p-6 flex flex-col gap-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-500" />
              <span>Academic Pairing Details</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Adjust target program, section, subject or assigned teacher.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department *</label>
              <select
                id="field-departmentId"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.departmentId ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('departmentId', { valueAsNumber: true })}
              >
                <option value={0}>-- Select Department --</option>
                {lookups.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.departmentId.message}</span>
              )}
            </div>

            {/* Program */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Program *</label>
              <select
                id="field-programId"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.programId ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('programId', { valueAsNumber: true })}
                disabled={watchedDeptId === 0}
              >
                <option value={0}>-- Select Program --</option>
                {filteredPrograms.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
              {errors.programId && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.programId.message}</span>
              )}
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Semester *</label>
              <select
                id="field-semesterId"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.semesterId ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('semesterId', { valueAsNumber: true })}
                disabled={watchedProgId === 0}
              >
                <option value={0}>-- Select Semester --</option>
                {filteredSemesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name}
                  </option>
                ))}
              </select>
              {errors.semesterId && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.semesterId.message}</span>
              )}
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Section *</label>
              <select
                id="field-sectionId"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.sectionId ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('sectionId', { valueAsNumber: true })}
                disabled={watchedSemId === 0}
              >
                <option value={0}>-- Select Section --</option>
                {filteredSections.map((sect) => (
                  <option key={sect.id} value={sect.id}>
                    Section {sect.name}
                  </option>
                ))}
              </select>
              {errors.sectionId && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.sectionId.message}</span>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject *</label>
              <select
                id="field-subjectId"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.subjectId ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('subjectId', { valueAsNumber: true })}
              >
                <option value={0}>-- Select Subject --</option>
                {lookups.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.subjectId.message}</span>
              )}
            </div>

            {/* Assigned Teacher */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assigned Teacher *</label>
              <select
                id="field-teacherId"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.teacherId ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('teacherId', { valueAsNumber: true })}
              >
                <option value={0}>-- Select Assigned Teacher --</option>
                {lookups.teachers.map((teach) => (
                  <option key={teach.id} value={teach.id}>
                    Dr. {teach.user.firstName} {teach.user.lastName} ({teach.employeeId})
                  </option>
                ))}
              </select>
              {errors.teacherId && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.teacherId.message}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Schedule & Metadata details */}
        <Card id="card-schedule-info" className="p-6 flex flex-col gap-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <span>Schedule, Sizing & Load Details</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Specify timeline, limits, credit loads, and active states.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Academic Session *</label>
              <select
                id="field-session"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('session')}
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Academic Year *</label>
              <input
                id="field-academicYear"
                type="text"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.academicYear ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                placeholder="e.g. 2026-2027"
                {...register('academicYear')}
              />
              {errors.academicYear && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.academicYear.message}</span>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date *</label>
              <input
                id="field-startDate"
                type="date"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.startDate ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('startDate')}
              />
              {errors.startDate && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.startDate.message}</span>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date *</label>
              <input
                id="field-endDate"
                type="date"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.endDate ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('endDate')}
              />
              {errors.endDate && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.endDate.message}</span>
              )}
            </div>

            {/* Weekly Lecture Hours */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Weekly Lecture Hours *</label>
              <input
                id="field-weeklyLectureHours"
                type="number"
                min={0}
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.weeklyLectureHours ? 'border-rose-300 ring-rose-300' : 'border-gray-200'}`}
                {...register('weeklyLectureHours', { valueAsNumber: true })}
              />
              {errors.weeklyLectureHours && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.weeklyLectureHours.message}</span>
              )}
            </div>

            {/* Weekly Lab Hours */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Weekly Lab Hours *</label>
              <input
                id="field-weeklyLabHours"
                type="number"
                min={0}
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.weeklyLabHours ? 'border-rose-300' : 'border-gray-200'}`}
                {...register('weeklyLabHours', { valueAsNumber: true })}
              />
              {errors.weeklyLabHours && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.weeklyLabHours.message}</span>
              )}
            </div>

            {/* Max Students */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Max Student Seat Capacity *</label>
              <input
                id="field-maxStudents"
                type="number"
                min={1}
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.maxStudents ? 'border-rose-300' : 'border-gray-200'}`}
                {...register('maxStudents', { valueAsNumber: true })}
              />
              {errors.maxStudents && (
                <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.maxStudents.message}</span>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status *</label>
              <select
                id="field-status"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('status')}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Offering Description / Notes</label>
            <textarea
              id="field-description"
              className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
              placeholder="Provide special curriculum details, custom textbook requirements, or exam policy notes..."
              {...register('description')}
            />
          </div>
        </Card>

        {/* Action Panel */}
        <div className="flex gap-3 justify-end items-center">
          <Link to={ROUTES.COURSE_OFFERINGS} id="btn-cancel-link">
            <Button
              id="btn-cancel"
              variant="outline"
              className="border-gray-200 text-gray-700 font-semibold"
              disabled={loading}
            >
              Cancel
            </Button>
          </Link>
          <Button
            id="btn-submit"
            type="submit"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default CourseOfferingEditPage;
