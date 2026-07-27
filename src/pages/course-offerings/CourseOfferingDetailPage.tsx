import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  ArrowLeft,
  Edit2,
  Building,
  GraduationCap,
  Calendar,
  BookOpen,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Layers,
  FileText,
  Bookmark,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CourseOffering {
  id: number;
  uuid: string;
  courseCode: string;
  academicYear: string;
  session: string;
  startDate: string;
  endDate: string;
  weeklyLectureHours: number;
  weeklyLabHours: number;
  maxStudents: number;
  currentEnrollment: number;
  status: 'ACTIVE' | 'INACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  department: { name: string; code: string };
  program: { name: string; code: string };
  semester: { name: string; code: string };
  section: { name: string; code: string };
  subject: { name: string; code: string; shortName: string | null; creditHours: number; subjectType: string };
  teacher: {
    employeeId: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

export const CourseOfferingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/course-offerings/${id}`);
        if (response.data?.status === 'success') {
          setOffering(response.data.data);
        }
      } catch (err) {
        console.error('[CourseOfferingDetail] Fetch error:', err);
        toast.error('Failed to load course offering details');
        navigate(ROUTES.COURSE_OFFERINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  if (loading) {
    return (
      <PageContainer
        title="Loading Pairing..."
      >
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium mt-4">Loading pairing record...</p>
        </div>
      </PageContainer>
    );
  }

  if (!offering) {
    return (
      <PageContainer
        title="Pairing Not Found"
      >
        <Card className="p-12 text-center text-gray-500 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Record Not Found</h3>
          <p className="text-sm text-gray-500 mb-6">The requested course offering does not exist or has been deleted.</p>
          <Link to={ROUTES.COURSE_OFFERINGS}>
            <Button className="bg-indigo-600 text-white font-medium">Return to List</Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  const getStatusBadgeClass = (statusVal: string) => {
    switch (statusVal) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Upcoming':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <PageContainer
      title={`Pairing Detail: ${offering.courseCode}`}
      description="Detailed schedule pairing, workload breakdown, instructor cards, and audit tracks."
      action={
        <div className="flex gap-2">
          <Link to={ROUTES.COURSE_OFFERINGS} id="btn-back-link">
            <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-700">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to List</span>
            </Button>
          </Link>

          {isWritable && (
            <Button
              id="btn-edit-pairing"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              onClick={() => navigate(`/course-offerings/${offering.uuid}/edit`)}
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Pairing</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300" id="course-offering-detail-grid">
        {/* Left Column: Academic Subject & Section details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-6" id="card-pairing-subject">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg mt-1">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{offering.subject.name}</h3>
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Course Subject</span>
                </div>
              </div>

              <div>
                <span className={`px-3 py-1.5 text-xs font-mono font-bold rounded-full border ${getStatusBadgeClass(offering.status)}`}>
                  {offering.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* College pairing */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">Department</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  {offering.department.name} ({offering.department.code})
                </span>
              </div>

              {/* Program */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">Program</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  {offering.program.name} ({offering.program.code})
                </span>
              </div>

              {/* Semester & Section */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">Target Schedule Slot</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  {offering.semester.name} — Section {offering.section.name}
                </span>
              </div>

              {/* Subject metadata */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">Subject Setup</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  Type: {offering.subject.subjectType}
                </span>
              </div>
            </div>

            {/* Description Notes */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">Course Syllabus / Notes</span>
              <p className="text-sm text-gray-600 bg-gray-50/50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                {offering.description || 'No custom notes or syllabus guidelines provided for this pairing.'}
              </p>
            </div>
          </Card>

          {/* Timeline and Workload */}
          <Card className="p-6 flex flex-col gap-5" id="card-timeline">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Timeline & Workloads
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold uppercase font-mono text-gray-400">Semester Period</span>
                </div>
                <div className="text-sm font-medium pl-6 text-gray-900 flex flex-col gap-1">
                  <span>Start: {formatDate(offering.startDate)}</span>
                  <span>End: {formatDate(offering.endDate)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold uppercase font-mono text-gray-400">Weekly Contact Hours</span>
                </div>
                <div className="text-sm font-medium pl-6 text-gray-900 flex flex-col gap-1 font-mono">
                  <span className="flex justify-between max-w-[160px]">Lecture Hours: <strong>{offering.weeklyLectureHours}h</strong></span>
                  <span className="flex justify-between max-w-[160px]">Lab Hours: <strong>{offering.weeklyLabHours}h</strong></span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Instructor Profile & Capacities */}
        <div className="flex flex-col gap-6">
          {/* Assigned Instructor Card */}
          <Card className="p-6 flex flex-col gap-4" id="card-instructor">
            <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-gray-100 pb-2">
              Assigned Faculty
            </h4>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center rounded-full text-base border border-indigo-100">
                {offering.teacher.user?.firstName?.charAt(0) || 'T'}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-950 text-base">
                  Dr. {offering.teacher.user.firstName} {offering.teacher.user.lastName}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  Employee ID: {offering.teacher.employeeId}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 pt-2 text-xs">
              <span className="text-gray-400 font-mono">Email Address:</span>
              <a href={`mailto:${offering.teacher.user.email}`} className="font-semibold text-indigo-600 hover:underline">
                {offering.teacher.user.email}
              </a>
            </div>
          </Card>

          {/* Seat Capacity Card */}
          <Card className="p-6 flex flex-col gap-4" id="card-capacity">
            <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-gray-100 pb-2">
              Seat Capacity
            </h4>

            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {offering.currentEnrollment} / {offering.maxStudents}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {Math.round((offering.currentEnrollment / offering.maxStudents) * 100)}% Occupied
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${Math.min(100, (offering.currentEnrollment / offering.maxStudents) * 100)}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed mt-1">
              Active student seats will increase as students complete registration for this section and subject.
            </p>
          </Card>

          {/* Audit Logs Trace card */}
          <Card className="p-6 flex flex-col gap-3.5 text-xs text-slate-500" id="card-audit">
            <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-gray-100 pb-2">
              Audit logs metadata
            </h4>

            <div className="flex flex-col gap-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Created At:</span>
                <span className="text-slate-700 font-bold">{formatDate(offering.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Created By:</span>
                <span className="text-slate-700 font-bold">UID {offering.createdBy || 'System'}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-slate-700 font-bold">{formatDate(offering.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated By:</span>
                <span className="text-slate-700 font-bold">UID {offering.updatedBy || 'System'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default CourseOfferingDetailPage;
