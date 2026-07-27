import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Building,
  GraduationCap,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  Shield,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Semester {
  id: number;
  uuid: string;
  name: string;
  code: string;
  semesterNumber: number;
  semesterType: 'REGULAR' | 'SUMMER' | 'WINTER';
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'ARCHIVED';
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  minCreditHours: number;
  maxCreditHours: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  program: {
    id: number;
    uuid: string;
    name: string;
    code: string;
    degreeLevel: string;
  };
  academicYear: {
    id: number;
    name: string;
  };
}

export const SemesterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Represents semester uuid
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    const fetchSemesterDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/semesters/${id}`);
        if (response.data?.status === 'success') {
          setSemester(response.data.data);
        } else {
          throw new Error('Failed to retrieve semester information');
        }
      } catch (err: any) {
        console.error('Fetch semester detail failed:', err);
        setError(err.response?.data?.message || 'Academic semester details could not be located.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSemesterDetails();
    }
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!semester) return;
    try {
      const res = await apiClient.patch(`/semesters/${semester.uuid}/status`, { status: newStatus });
      if (res.data?.status === 'success') {
        toast.success(`Semester status updated to ${newStatus}`);
        setSemester({ ...semester, status: res.data.data.status });
      }
    } catch (err: any) {
      console.error('Status change on detail page failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Status badge with matching styles
  const getStatusBadge = (status: string) => {
    const maps: Record<string, { bg: string; text: string; border: string; label: string }> = {
      UPCOMING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Upcoming' },
      ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active' },
      COMPLETED: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: 'Completed' },
      SUSPENDED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Suspended' },
      ARCHIVED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Archived' },
    };

    const current = maps[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: status };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-tight ${current.bg} ${current.text} border ${current.border}`}>
        {current.label}
      </span>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-500 font-mono text-sm uppercase tracking-wider">
            Fetching semester specifications...
          </span>
        </div>
      </PageContainer>
    );
  }

  if (error || !semester) {
    return (
      <PageContainer>
        <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center shadow-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-black tracking-tight mb-2">Semester Not Found</h2>
          <p className="text-xs text-red-700 mb-6 font-mono">{error || 'The requested semester record does not exist or has been removed.'}</p>
          <Link to={ROUTES.SEMESTERS}>
            <Button variant="outline" size="sm" className="font-mono text-xs uppercase tracking-wider">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Semesters List
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header and Actions */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" id="semester-detail-header">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase mb-1">
            <Link to={ROUTES.DASHBOARD} className="hover:text-indigo-600">ERP</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link to={ROUTES.SEMESTERS} className="hover:text-indigo-600">SEMESTERS</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-500">{semester.code}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-indigo-600" />
            {semester.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Linked to Program <span className="font-bold text-slate-700">{semester.program.name}</span> • Year <span className="font-bold text-slate-700">{semester.academicYear.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={ROUTES.SEMESTERS}>
            <Button variant="outline" size="sm" className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider py-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          {isWritable && (
            <Link to={`${ROUTES.SEMESTERS}/${semester.uuid}/edit`}>
              <Button variant="primary" size="sm" className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider py-2">
                <Edit2 className="w-4 h-4" /> Edit Semester
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="semester-detail-grid">
        {/* Left column (Main info blocks) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 shadow-xs border border-slate-200 bg-white rounded-2xl" id="semester-specs-card">
            <div className="border-b border-slate-100 pb-4 mb-5 flex justify-between items-center">
              <h2 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-tight">
                Term Parameters
              </h2>
              {getStatusBadge(semester.status)}
            </div>

            {/* Grid of metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-8">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" /> Term Number
                </span>
                <span className="text-base font-black text-slate-900">Semester {semester.semesterNumber}</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Term Type
                </span>
                <span className="text-base font-black text-slate-900">{semester.semesterType}</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Min Credit Bounds
                </span>
                <span className="text-base font-black text-slate-900">{semester.minCreditHours} Hrs</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Max Credit Bounds
                </span>
                <span className="text-base font-black text-slate-900">{semester.maxCreditHours} Hrs</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Unique Code
                </span>
                <span className="text-base font-black text-slate-900 truncate" title={semester.code}>{semester.code}</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Academic Year
                </span>
                <span className="text-base font-black text-slate-900">{semester.academicYear.name}</span>
              </div>
            </div>

            {/* Description segment */}
            <div className="space-y-3 mb-8">
              <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Special Directives & Narrative
              </h3>
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs text-slate-700 leading-relaxed min-h-[100px] font-sans">
                {semester.description ? (
                  semester.description
                ) : (
                  <span className="text-slate-400 italic">No custom description has been added to this academic semester record.</span>
                )}
              </div>
            </div>

            {/* Date Timelines Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1">
                <Clock className="w-4 h-4 text-indigo-500" /> Key Dates & Milestones
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col p-4 border border-slate-100 rounded-xl bg-slate-50/30">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">Classes Duration Period</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">
                    {formatDate(semester.startDate)} — {formatDate(semester.endDate)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">Active class delivery, lecture hours, and academic reviews.</span>
                </div>

                <div className="flex flex-col p-4 border border-slate-100 rounded-xl bg-slate-50/30">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">Course Enrollment Period</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">
                    {formatDate(semester.registrationStartDate)} — {formatDate(semester.registrationEndDate)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">Active registration windows where students must enroll in courses.</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column (System Details & Action Sidebar) */}
        <div className="space-y-6">
          {/* Related Program Info */}
          <Card className="p-6 border border-slate-200 shadow-xs bg-white rounded-2xl" id="semester-affiliation-sidebar">
            <h3 className="text-xs font-mono font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Affiliated Program Control
            </h3>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">Parent Program</span>
                <Link to={`${ROUTES.PROGRAMS}/${semester.program.uuid}`} className="text-sm font-extrabold text-slate-900 hover:text-indigo-600 hover:underline transition">
                  {semester.program.name}
                </Link>
                <span className="text-xs font-mono text-slate-500 mt-0.5">Code: {semester.program.code} • {semester.program.degreeLevel}</span>
              </div>
            </div>
          </Card>

          {/* If isWritable, show Status Actions Quick Panel */}
          {isWritable && (
            <Card className="p-6 border border-slate-200 shadow-xs bg-white rounded-2xl" id="semester-status-change-panel">
              <h3 className="text-xs font-mono font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3.5">
                Quick Status Controller
              </h3>
              <div className="flex flex-col gap-2">
                {['UPCOMING', 'ACTIVE', 'COMPLETED', 'SUSPENDED', 'ARCHIVED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={semester.status === st}
                    className={`w-full py-2 px-3 text-xs font-mono rounded-lg border text-left transition flex items-center justify-between ${
                      semester.status === st
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>{st}</span>
                    {semester.status === st && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* System Audit Information */}
          <Card className="p-6 border border-slate-200 shadow-xs bg-white rounded-2xl" id="semester-registry-sidebar">
            <h3 className="text-xs font-mono font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Registry Information
            </h3>
            <div className="space-y-4 text-xs font-mono text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">UUID Ref:</span>
                <span className="text-slate-900 text-[10px] select-all font-sans bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {semester.uuid}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Published:</span>
                <span className="text-slate-900">
                  {new Date(semester.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Last Modified:</span>
                <span className="text-slate-900">
                  {new Date(semester.updatedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default SemesterDetailPage;
