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
  Calendar,
  Clock,
  User,
  MapPin,
  BookOpen,
  CheckCircle,
  FileText,
  AlertTriangle,
  Edit2,
  Trash2,
  Tag,
  Building,
  Users,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DetailEntry {
  id: number;
  uuid: string;
  courseOfferingId: number;
  teacherId: number;
  subjectId: number;
  sectionId: number;
  roomId: number;
  timeSlotId: number;
  academicYear: string;
  session: string;
  weeklyRepeat: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'Active' | 'Suspended' | 'Cancelled';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  courseOffering: {
    courseCode: string;
    currentEnrollment: number;
  };
  teacher: {
    employeeId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  subject: {
    name: string;
    code: string;
    subjectType: string;
    lectureHours: number;
    labHours: number;
    credits: number;
  };
  section: {
    name: string;
    code: string;
    currentStrength: number;
  };
  room: {
    roomNumber: string;
    roomType: string;
    capacity: number;
    building: {
      name: string;
      code: string;
      campus: string;
    };
  };
  timeSlot: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    periodNumber: number;
  };
}

export const TimetableDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [entry, setEntry] = useState<DetailEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    if (id) {
      fetchDetails(id);
    }
  }, [id]);

  const fetchDetails = async (uuid: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/timetable/${uuid}`);
      if (res.data && res.data.data) {
        setEntry(res.data.data);
      }
    } catch (err) {
      console.error('Failed loading timetable detail view', err);
      toast.error('Failed to load class schedule details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    if (!window.confirm('Are you sure you want to delete this scheduled class session?')) return;
    try {
      await apiClient.delete(`/timetable/${entry.uuid}`);
      toast.success('Scheduled session deleted successfully');
      navigate(ROUTES.TIMETABLE);
    } catch (err) {
      toast.error('Failed to delete scheduled session');
    }
  };

  const handleToggleStatus = async () => {
    if (!entry) return;
    const nextStatus = entry.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await apiClient.patch(`/timetable/${entry.uuid}/status`, { status: nextStatus });
      toast.success(`Schedule status changed to ${nextStatus}`);
      fetchDetails(entry.uuid);
    } catch (err) {
      toast.error('Failed to update schedule status');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <PageContainer title="Class Schedule Allocation Detail">
        <div className="flex items-center justify-center py-20" id="detail-loader">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" />
        </div>
      </PageContainer>
    );
  }

  if (!entry) {
    return (
      <PageContainer title="Class Session Not Found">
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200" id="detail-empty">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Record Not Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
            The requested class scheduling record could not be found or has been archived.
          </p>
          <Link to={ROUTES.TIMETABLE} className="mt-6 inline-block">
            <Button variant="outline">Back to Timetable Directory</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${entry.subject.name} - Allocation Details`}
      description={`Scheduling profile for course code ${entry.courseOffering?.courseCode} on ${entry.timeSlot.dayOfWeek}.`}
    >
      <div className="flex flex-col gap-6" id="timetable-detail-viewport">
        {/* Navigation & Admin Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link to={ROUTES.TIMETABLE} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Timetable Directory
          </Link>

          {isWritable && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
              >
                Mark as {entry.status === 'Active' ? 'Suspended' : 'Active'}
              </Button>
              <Link to={`/timetable/${entry.uuid}/edit`}>
                <Button variant="outline" size="sm" leftIcon={Edit2}>
                  Edit Allocation
                </Button>
              </Link>
              <Button variant="danger" size="sm" leftIcon={Trash2} onClick={handleDelete}>
                Delete Session
              </Button>
            </div>
          )}
        </div>

        {/* Master Details layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main profile */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Header info */}
            <Card title="Subject & Syllabus Blueprint">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 h-12 w-12 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Subject Title</span>
                    <span className="text-base font-extrabold text-slate-900 leading-tight">{entry.subject.name}</span>
                    <span className="text-xs font-mono font-semibold text-slate-500 mt-1 uppercase">
                      Code: {entry.subject.code}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 bg-violet-50 text-violet-700 rounded-xl border border-violet-100 h-12 w-12 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Subject Metrics</span>
                    <span className="text-sm font-bold text-slate-800">
                      Type: {entry.subject.subjectType}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 mt-0.5">
                      Syllabus: {entry.subject.credits} Credits ({entry.subject.lectureHours}h Lecture, {entry.subject.labHours}h Lab)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Space Logistics */}
            <Card title="Space & Location Logistics">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 h-12 w-12 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Assigned Room</span>
                    <span className="text-base font-extrabold text-slate-900 leading-tight">Room {entry.room.roomNumber}</span>
                    <span className="text-xs font-semibold text-slate-500 mt-0.5">
                      Space Type: {entry.room.roomType} (Capacity: {entry.room.capacity} seats)
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 h-12 w-12 flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Campus Building</span>
                    <span className="text-sm font-bold text-slate-800">
                      {entry.room.building.name} ({entry.room.building.code})
                    </span>
                    <span className="text-xs font-semibold text-slate-500 mt-0.5">
                      Campus Zone: {entry.room.building.campus}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notes & directives */}
            <Card title="Schedule Directives" className="h-full">
              <div className="flex flex-col gap-3 font-sans">
                {entry.notes ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-600 italic whitespace-pre-wrap leading-relaxed">
                      "{entry.notes}"
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs italic">
                    No custom scheduling directives have been recorded for this lecture session.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar constraints metadata */}
          <div className="flex flex-col gap-6">
            {/* Class Period Metadata */}
            <Card title="Timing & Schedule Profile">
              <div className="flex flex-col gap-4 font-sans">
                {/* Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Status</span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    entry.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200'
                      : entry.status === 'Suspended'
                      ? 'bg-amber-500/10 text-amber-700 border border-amber-200'
                      : 'bg-red-500/10 text-red-700 border border-red-200'
                  }`}>
                    {entry.status}
                  </span>
                </div>

                {/* Day of week */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Day of Week</span>
                  <span className="text-sm font-black text-slate-800">{entry.timeSlot.dayOfWeek}</span>
                </div>

                {/* Time range */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lecture Hours</span>
                  <span className="text-sm font-mono font-bold text-slate-800">
                    Period {entry.timeSlot.periodNumber} ({entry.timeSlot.startTime} - {entry.timeSlot.endTime})
                  </span>
                </div>

                {/* Weekly Repeat */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repeats Weekly</span>
                  <span className="text-sm font-bold text-slate-800">
                    {entry.weeklyRepeat ? 'Yes, Recurring' : 'No, Single Session'}
                  </span>
                </div>

                {/* Effective Dates */}
                <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Period</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {formatDate(entry.effectiveFrom)} to {formatDate(entry.effectiveTo)}
                  </span>
                </div>

                {/* Section / Student group size */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allocated Student Cohort</span>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">Section {entry.section.name} ({entry.section.code})</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">Course: {entry.courseOffering?.courseCode}</span>
                    </div>
                    <span className="text-xs font-black text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
                      Strength: {entry.section.currentStrength}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Assigned Faculty details */}
            <Card title="Assigned Lecturer">
              <div className="flex items-start gap-3 font-sans">
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-full h-11 w-11 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-extrabold text-slate-900 leading-snug">
                    Prof. {entry.teacher.user.firstName} {entry.teacher.user.lastName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase mt-0.5">
                    Faculty ID: {entry.teacher.employeeId}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 truncate hover:text-clip" title={entry.teacher.user.email}>
                    {entry.teacher.user.email}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
export default TimetableDetailPage;
