import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { ArrowLeft, Save, AlertCircle, Building, Users, Calendar, HelpCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Self-contained zod validation matching backend rules
const formSchema = z.object({
  courseOfferingId: z.number().int().positive('Course Offering is required'),
  teacherId: z.number().int().positive('Teacher is required'),
  subjectId: z.number().int().positive('Subject is required'),
  sectionId: z.number().int().positive('Section is required'),
  roomId: z.number().int().positive('Room is required'),
  timeSlotId: z.number().int().positive('Time Slot is required'),
  academicYear: z.string().min(4, 'Academic year is required (e.g. 2025-2026)'),
  session: z.string().min(2, 'Session is required (e.g. Fall, Winter)'),
  weeklyRepeat: z.boolean().default(true),
  effectiveFrom: z.string().min(10, 'Valid effective from date is required (YYYY-MM-DD)'),
  effectiveTo: z.string().min(10, 'Valid effective to date is required (YYYY-MM-DD)'),
  status: z.enum(['Active', 'Suspended', 'Cancelled']).default('Active'),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export const TimetableCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Cascading Selector States
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<any[]>([]);
  
  // Selection Values
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedProg, setSelectedProg] = useState<string>('');
  const [selectedSem, setSelectedSem] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<string>('');

  // Resource Lookups
  const [teachers, setTeachers] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // UI Filtering States
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [roomWarnings, setRoomWarnings] = useState<{ capacity?: string; lab?: string }>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weeklyRepeat: true,
      status: 'Active',
      notes: '',
    },
  });

  const watchCourseOfferingId = watch('courseOfferingId');
  const watchRoomId = watch('roomId');

  // Load basic lists
  useEffect(() => {
    const loadInitialOptions = async () => {
      try {
        const [deptsRes, teachsRes, bldgsRes, slotsRes, subjsRes] = await Promise.all([
          apiClient.get('/departments'),
          apiClient.get('/teachers'),
          apiClient.get('/buildings'),
          apiClient.get('/timeslots'),
          apiClient.get('/subjects'),
        ]);

        const extractList = (res: any, key?: string, altKey?: string) => {
          const payload = res?.data?.data || res?.data;
          if (Array.isArray(payload)) return payload;
          if (key && Array.isArray(payload?.[key])) return payload[key];
          if (altKey && Array.isArray(payload?.[altKey])) return payload[altKey];
          return [];
        };

        setDepartments(extractList(deptsRes, 'departments'));
        setTeachers(extractList(teachsRes, 'teachers'));
        setBuildings(extractList(bldgsRes, 'buildings'));
        setTimeSlots(extractList(slotsRes, 'timeSlots', 'timeslots'));
        setSubjects(extractList(subjsRes, 'subjects'));
      } catch (err) {
        console.error('Failed to load initial scheduling helpers', err);
        toast.error('Failed to load dropdown options');
      }
    };
    loadInitialOptions();
  }, []);

  // Cascade Programs when Department changes
  useEffect(() => {
    if (!selectedDept) {
      setPrograms([]);
      return;
    }
    const loadPrograms = async () => {
      try {
        const res = await apiClient.get('/programs', { params: { departmentId: parseInt(selectedDept) } });
        setPrograms(res.data.data?.programs || res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadPrograms();
  }, [selectedDept]);

  // Cascade Semesters when Program changes
  useEffect(() => {
    if (!selectedProg) {
      setSemesters([]);
      return;
    }
    const loadSemesters = async () => {
      try {
        const res = await apiClient.get('/semesters', { params: { programId: parseInt(selectedProg) } });
        setSemesters(res.data.data?.semesters || res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadSemesters();
  }, [selectedProg]);

  // Cascade Sections when Semester changes
  useEffect(() => {
    if (!selectedSem) {
      setSections([]);
      return;
    }
    const loadSections = async () => {
      try {
        const res = await apiClient.get('/sections', { params: { semesterId: parseInt(selectedSem) } });
        setSections(res.data.data?.sections || res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadSections();
  }, [selectedSem]);

  // Cascade Course Offerings when Section changes
  useEffect(() => {
    if (!selectedSection) {
      setCourseOfferings([]);
      return;
    }
    const loadCourseOfferings = async () => {
      try {
        const res = await apiClient.get('/course-offerings', { params: { sectionId: parseInt(selectedSection) } });
        setCourseOfferings(res.data.data?.courseOfferings || res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadCourseOfferings();
  }, [selectedSection]);

  // Cascade Rooms when Building changes
  useEffect(() => {
    if (!selectedBuilding) {
      setRooms([]);
      return;
    }
    const loadRooms = async () => {
      try {
        const res = await apiClient.get('/rooms', { params: { buildingId: parseInt(selectedBuilding) } });
        setRooms(res.data.data?.rooms || res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadRooms();
  }, [selectedBuilding]);

  // Handle Course Offering Selection (Auto-Prefill values)
  const handleCourseOfferingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCourseOffering(val);
    
    if (!val) {
      setValue('courseOfferingId', 0);
      setValue('teacherId', 0);
      setValue('subjectId', 0);
      setValue('sectionId', 0);
      setValue('academicYear', '');
      setValue('session', '');
      return;
    }

    const coId = parseInt(val);
    const co = courseOfferings.find(c => c.id === coId);
    
    if (co) {
      setValue('courseOfferingId', co.id);
      setValue('teacherId', co.teacherId || 0);
      setValue('subjectId', co.subjectId || 0);
      setValue('sectionId', co.sectionId || parseInt(selectedSection));
      setValue('academicYear', co.academicYear || '');
      setValue('session', co.session || '');
      
      // Auto-populate default effective dates if blank (e.g. current semester start/end)
      const now = new Date();
      const end = new Date();
      end.setMonth(now.getMonth() + 4);
      setValue('effectiveFrom', now.toISOString().split('T')[0]);
      setValue('effectiveTo', end.toISOString().split('T')[0]);

      toast.success(`Loaded settings for Course Offering ${co.courseCode}`, { icon: '⚙️' });
    }
  };

  // Perform room safety warning validation
  useEffect(() => {
    if (!watchRoomId || !watchCourseOfferingId) {
      setRoomWarnings({});
      return;
    }

    const co = courseOfferings.find(c => c.id === watchCourseOfferingId);
    const rm = rooms.find(r => r.id === watchRoomId);

    if (co && rm) {
      const warnings: { capacity?: string; lab?: string } = {};
      
      // Capacity check
      const studentsCount = Math.max(co.currentEnrollment || 0, co.section?.currentStrength || 0);
      if (rm.capacity < studentsCount) {
        warnings.capacity = `Warning: Room capacity (${rm.capacity}) is smaller than student group size (${studentsCount}).`;
      }

      // Lab check
      const isLab = co.subject?.subjectType === 'Lab' || (co.subject?.labHours && co.subject.labHours > 0);
      if (isLab && rm.roomType !== 'Laboratory') {
        warnings.lab = `Warning: This course requires a Laboratory, but the selected space is a ${rm.roomType}.`;
      }

      setRoomWarnings(warnings);
    } else {
      setRoomWarnings({});
    }
  }, [watchRoomId, watchCourseOfferingId, rooms, courseOfferings]);

  // Submit handler
  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await apiClient.post('/timetable', data);
      toast.success('Lecture session scheduled successfully!');
      navigate(ROUTES.TIMETABLE);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Conflict or server error';
      toast.error(`Schedule Conflict: ${msg}`, { duration: 6000 });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create Class Schedule"
      description="Select program structures dynamically to map a course offering to a validated space, supervisor, and period."
    >
      <div className="flex flex-col gap-6" id="timetable-create-viewport">
        {/* Back Link */}
        <div className="flex">
          <Link to={ROUTES.TIMETABLE} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Timetable Directory
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Step 1: Cascading Dynamic Filter */}
            <Card title="1. Select Program Location" description="Filter down to find academic course offerings.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setSelectedProg('');
                      setSelectedSem('');
                      setSelectedSection('');
                      setSelectedCourseOffering('');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Program */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Academic Program</label>
                  <select
                    value={selectedProg}
                    disabled={!selectedDept}
                    onChange={(e) => {
                      setSelectedProg(e.target.value);
                      setSelectedSem('');
                      setSelectedSection('');
                      setSelectedCourseOffering('');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                  >
                    <option value="">Select Program</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Semester */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Academic Semester</label>
                  <select
                    value={selectedSem}
                    disabled={!selectedProg}
                    onChange={(e) => {
                      setSelectedSem(e.target.value);
                      setSelectedSection('');
                      setSelectedCourseOffering('');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Section */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Student Section / Batch</label>
                  <select
                    value={selectedSection}
                    disabled={!selectedSem}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedCourseOffering('');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                  >
                    <option value="">Select Section</option>
                    {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name} ({sec.code})</option>)}
                  </select>
                </div>
              </div>
            </Card>

            {/* Step 2: Course Offering Linkage */}
            <Card title="2. Select Associated Course Offering" description="Prefills syllabus, instructor, and schedule.">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Course Offering</label>
                  <select
                    value={selectedCourseOffering}
                    disabled={!selectedSection}
                    onChange={handleCourseOfferingChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                  >
                    <option value="">Choose Course Offering</option>
                    {courseOfferings.map(co => (
                      <option key={co.id} value={co.id}>
                        {co.courseCode} - {co.subject?.name} (Prof. {co.teacher?.user?.firstName} {co.teacher?.user?.lastName})
                      </option>
                    ))}
                  </select>
                  {errors.courseOfferingId && <p className="text-xs text-red-600 font-semibold">{String(errors.courseOfferingId.message)}</p>}
                </div>

                {/* Displays automated pre-fills */}
                {selectedCourseOffering && (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Syllabus Subject</span>
                      <span className="text-sm font-bold text-slate-800">
                        {subjects.find(s => s.id === watch('subjectId'))?.name || 'Loading...'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Assigned Instructor</span>
                      <span className="text-sm font-bold text-slate-800">
                        {teachers.find(t => t.id === watch('teacherId'))
                          ? `Prof. ${teachers.find(t => t.id === watch('teacherId'))?.user.firstName} ${teachers.find(t => t.id === watch('teacherId'))?.user.lastName}`
                          : 'Loading...'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Academic Year</span>
                      <span className="text-sm font-bold text-slate-800">{watch('academicYear')}</span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Semester Session</span>
                      <span className="text-sm font-bold text-slate-800">{watch('session')}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Step 3: Logistics and Constraints (Building, Room, Time) */}
            <Card title="3. Space & Time Slot Coordinates" description="Formulate physical allocation parameters.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Building */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Building</label>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      setValue('roomId', 0);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">Select Building</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>

                {/* Room */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Classroom or Laboratory</label>
                  <select
                    {...register('roomId', { valueAsNumber: true })}
                    disabled={!selectedBuilding}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                  >
                    <option value="">Select Room</option>
                    {rooms.map(rm => (
                      <option key={rm.id} value={rm.id}>
                        Room {rm.roomNumber} ({rm.roomType} - Capacity {rm.capacity})
                      </option>
                    ))}
                  </select>
                  {errors.roomId && <p className="text-xs text-red-600 font-semibold">{String(errors.roomId.message)}</p>}
                </div>

                {/* Warnings regarding space constraints */}
                {(roomWarnings.capacity || roomWarnings.lab) && (
                  <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col gap-1">
                    {roomWarnings.capacity && (
                      <span className="text-xs text-amber-800 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        {roomWarnings.capacity}
                      </span>
                    )}
                    {roomWarnings.lab && (
                      <span className="text-xs text-amber-800 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        {roomWarnings.lab}
                      </span>
                    )}
                  </div>
                )}

                {/* Time Slot */}
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Lecture Period / Time Slot</label>
                  <select
                    {...register('timeSlotId', { valueAsNumber: true })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">Select Period Slot</option>
                    {timeSlots.map(ts => (
                      <option key={ts.id} value={ts.id}>
                        {ts.dayOfWeek} - Period {ts.periodNumber} ({ts.startTime} - {ts.endTime})
                      </option>
                    ))}
                  </select>
                  {errors.timeSlotId && <p className="text-xs text-red-600 font-semibold">{String(errors.timeSlotId.message)}</p>}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Metadata Fields */}
          <div className="flex flex-col gap-6">
            <Card title="Effective Range & Settings">
              <div className="flex flex-col gap-4">
                {/* Effective From */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Effective From Date</label>
                  <input
                    type="date"
                    {...register('effectiveFrom')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  {errors.effectiveFrom && <p className="text-xs text-red-600 font-semibold">{String(errors.effectiveFrom.message)}</p>}
                </div>

                {/* Effective To */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Effective To Date</label>
                  <input
                    type="date"
                    {...register('effectiveTo')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  {errors.effectiveTo && <p className="text-xs text-red-600 font-semibold">{String(errors.effectiveTo.message)}</p>}
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Initial Status</label>
                  <select
                    {...register('status')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Weekly Repeat */}
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="weeklyRepeat"
                    {...register('weeklyRepeat')}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <label htmlFor="weeklyRepeat" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Repeats Weekly
                  </label>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 font-sans">Additional Directives (Optional)</label>
                  <textarea
                    placeholder="Provide details about laboratory exercises, specialized projection requirements, or student preparations..."
                    rows={4}
                    {...register('notes')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 font-sans"
                  />
                  {errors.notes && <p className="text-xs text-red-600 font-semibold">{String(errors.notes.message)}</p>}
                </div>

                {/* Submit Action Block */}
                <div className="pt-4 flex flex-col gap-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    leftIcon={Save}
                    isLoading={submitting}
                  >
                    Save Allocation
                  </Button>
                  <Link to={ROUTES.TIMETABLE} className="w-full">
                    <Button variant="outline" className="w-full" type="button">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Conflict Resolution Guide */}
            <Card title="Conflict Rulebook" className="bg-slate-50/50">
              <div className="flex flex-col gap-3 text-xs text-slate-500 font-sans">
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>The system runs background checks to guarantee instructors are only scheduled once per period.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Classrooms and labs can only host a single session concurrently.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sections / Student Cohorts are prevented from dual allocation.</span>
                </div>
              </div>
            </Card>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};
export default TimetableCreatePage;
