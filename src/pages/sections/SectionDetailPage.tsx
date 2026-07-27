import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  Users,
  ArrowLeft,
  Edit2,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
  PieChart,
  User,
  ShieldCheck,
  Briefcase,
  History,
  FileText,
  BookOpen,
  ClipboardCheck,
  Layers,
  BarChart3,
  ExternalLink,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Section {
  id: number;
  uuid: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  capacity: number;
  currentStrength: number;
  shift: 'MORNING' | 'EVENING';
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  semester: {
    id: number;
    name: string;
    code: string;
  };
  program?: {
    id: number;
    name: string;
    code: string;
  } | null;
  department?: {
    id: number;
    name: string;
    code: string;
  } | null;
  classAdvisor?: {
    id: number;
    employeeId: string;
    designation: string | null;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
}

export const SectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Section uuid
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const response = await apiClient.get(`/sections/${id}`);
        if (response.data?.status === 'success') {
          setSection(response.data.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch section details:', err);
        toast.error(err.response?.data?.message || 'Failed to fetch section record details.');
        navigate(ROUTES.SECTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchSection();
  }, [id, navigate]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="mt-4 text-xs font-mono text-slate-400 uppercase tracking-widest">
            Loading section information...
          </span>
        </div>
      </PageContainer>
    );
  }

  if (!section) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Section Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            The specified academic division group could not be located in our systems.
          </p>
          <Link to={ROUTES.SECTIONS} className="mt-4 inline-block">
            <Button variant="outline" size="sm" className="font-mono text-xs uppercase">
              Back to Section List
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const availableSeats = Math.max(section.capacity - section.currentStrength, 0);
  const occupancyPercentage = Math.round((section.currentStrength / section.capacity) * 100);

  return (
    <PageContainer>
      {/* Detail Header navigation */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="section-detail-header">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.SECTIONS}>
            <Button variant="outline" size="sm" className="p-2 border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-950 tracking-tight">
                {section.name}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                section.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-slate-50 text-slate-500 border border-slate-200'
              }`}>
                {section.status}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                section.shift === 'MORNING'
                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}>
                {section.shift}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Unique Section Code: <span className="font-extrabold text-slate-700">{section.code}</span>
            </p>
          </div>
        </div>

        {isWritable && (
          <Link to={`${ROUTES.SECTIONS}/${section.uuid}/edit`}>
            <Button variant="primary" size="sm" className="font-mono text-xs uppercase tracking-wider py-2 px-3.5 flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5" /> Edit Section
            </Button>
          </Link>
        )}
      </div>

      {/* Grid containing Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-xl flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500">
            <Users className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Seats</span>
            <span className="text-lg font-black text-slate-800">{section.capacity}</span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-xl flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
            <span className="text-lg font-black text-slate-800">{section.currentStrength}</span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-xl flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Available Vacancy</span>
            <span className="text-lg font-black text-slate-800">{availableSeats}</span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-xl flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <PieChart className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Occupancy Rate</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-800">{occupancyPercentage}%</span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden max-w-[60px]">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${occupancyPercentage}%` }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Details panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-slate-200 bg-white shadow-xs rounded-2xl" id="section-detail-core-info">
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              Core Characteristics & Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-400 block mb-0.5">Section Code</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{section.code}</span>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-400 block mb-0.5">Section Name</span>
                <span className="font-semibold text-slate-800 text-sm">{section.name}</span>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-400 block mb-0.5">Shift Scheduled</span>
                <span className="font-semibold text-slate-800">{section.shift}</span>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-400 block mb-0.5">Enrollment Limit</span>
                <span className="font-semibold text-slate-800">{section.currentStrength} / {section.capacity} Seats used</span>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-400 block mb-0.5">Created Date</span>
                <span className="font-semibold text-slate-800">{new Date(section.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-400 block mb-0.5">Last Updated</span>
                <span className="font-semibold text-slate-800">{new Date(section.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-5 text-xs">
              <span className="text-slate-400 block mb-1">Description / Notes</span>
              <p className="text-slate-600 bg-slate-50 p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap border border-slate-100">
                {section.description || <span className="italic text-slate-300">No additional remarks or description configured for this class division group.</span>}
              </p>
            </div>
          </Card>

          {/* Academic Connections */}
          <Card className="p-6 border border-slate-200 bg-white shadow-xs rounded-2xl">
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              Academic Structural Relationships
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Semester info */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 flex gap-3.5 items-start">
                <Calendar className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Semester</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{section.semester.name}</span>
                  <span className="font-mono text-[10px] text-slate-400 uppercase">Code: {section.semester.code}</span>
                </div>
              </div>

              {/* Program info */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 flex gap-3.5 items-start">
                <GraduationCap className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Program Group</span>
                  {section.program ? (
                    <>
                      <span className="font-bold text-slate-800 block mt-0.5">{section.program.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">Code: {section.program.code}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic block mt-0.5">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Department info */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 flex gap-3.5 items-start sm:col-span-2">
                <Building className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Administrative Department</span>
                  {section.department ? (
                    <>
                      <span className="font-bold text-slate-800 block mt-0.5">{section.department.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">Code: {section.department.code}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic block mt-0.5">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Info Panels */}
        <div className="lg:col-span-1 space-y-6">
          {/* Class Advisor */}
          <Card className="p-5 border border-slate-200 bg-white shadow-xs rounded-2xl">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-500" />
              Class Advisor
            </h3>

            {section.classAdvisor ? (
              <div className="space-y-4 text-xs">
                <div className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {section.classAdvisor.user?.firstName?.charAt(0) || 'T'}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-slate-800 block truncate">{section.classAdvisor.user.firstName} {section.classAdvisor.user.lastName}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{section.classAdvisor.user.email}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Designation: <strong className="text-slate-800">{section.classAdvisor.designation || 'Lecturer'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Employee ID: <strong className="text-slate-800 font-mono">{section.classAdvisor.employeeId}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[11px] text-slate-400 max-w-[150px] mx-auto leading-relaxed">
                  No teacher is mapped as the class advisor for this section.
                </p>
              </div>
            )}
          </Card>

          {/* Integrated Modules & Future Scope */}
          <Card className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-indigo-600" />
                Integrated Section Modules
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">
                Core Hub
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
              This class section acts as a key structural block. Integrated modules automatically synchronize with section <span className="font-mono font-bold text-slate-900">{section.code}</span> for:
            </p>

            <div className="space-y-2.5">
              {/* 1. Student Course Enrollment Mapping */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors shadow-2xs group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Student Course Enrollment
                        <span className="text-[9px] font-mono text-emerald-600 font-normal">● Active</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Map enrolled students ({section.currentStrength} total) to active course offerings and batch rosters.
                      </p>
                    </div>
                  </div>
                  <Link to={ROUTES.ENROLLMENTS}>
                    <Button variant="ghost" size="sm" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 2. Attendance Registers Tracking */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors shadow-2xs group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0 mt-0.5">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Attendance Registers
                        <span className="text-[9px] font-mono text-emerald-600 font-normal">● Live</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Track daily roll-call, lecture session logs, and biometric attendance per section register.
                      </p>
                    </div>
                  </div>
                  <Link to={ROUTES.ATTENDANCE}>
                    <Button variant="ghost" size="sm" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 3. Schedules & Timetable Blocks */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors shadow-2xs group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Schedules & Timetable
                        <span className="text-[9px] font-mono text-amber-600 font-normal">● {section.shift}</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Manage collision-free weekly class schedules, room allocations, and shift time blocks.
                      </p>
                    </div>
                  </div>
                  <Link to={ROUTES.TIMETABLE}>
                    <Button variant="ghost" size="sm" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 4. Subjects & Exams Scheduling */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors shadow-2xs group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Subjects & Exam Schedules
                        <span className="text-[9px] font-mono text-blue-600 font-normal">● Configured</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Schedule subject syllabi, midterm/final examination seatings, and invigilation rosters.
                      </p>
                    </div>
                  </div>
                  <Link to={ROUTES.SUBJECTS}>
                    <Button variant="ghost" size="sm" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 5. Class Results Analytics */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors shadow-2xs group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600 shrink-0 mt-0.5">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Class Results Analytics
                        <span className="text-[9px] font-mono text-purple-600 font-normal">● Ready</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Analyze section GPA distributions, pass/fail trends, grade curves, and transcript metrics.
                      </p>
                    </div>
                  </div>
                  <Link to={ROUTES.RESULTS}>
                    <Button variant="ghost" size="sm" className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default SectionDetailPage;
