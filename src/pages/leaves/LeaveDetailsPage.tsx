import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Paperclip,
  Bookmark,
  Building2,
  FileText,
  Ban,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';

interface StudentProfile {
  id: number;
  fullName: string;
  registrationNumber: string;
  rollNumber: string;
}

interface TeacherProfile {
  id: number;
  employeeId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface LeaveRequest {
  id: number;
  leaveNumber: string;
  applicantType: string;
  studentId: number | null;
  teacherId: number | null;
  departmentId: number;
  courseOfferingId: number | null;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  supportingDocument: string | null;
  status: string;
  approvedBy: string | null;
  approvalDate: string | null;
  rejectionReason: string | null;
  affectsAttendance: boolean;
  remarks: string | null;
  createdAt: string;
  student: StudentProfile | null;
  teacher: TeacherProfile | null;
  department: {
    id: number;
    name: string;
    code: string;
  };
  courseOffering: {
    id: number;
    courseCode: string;
    subject: {
      name: string;
    };
  } | null;
}

export const LeaveDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role || 'STUDENT';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isTeacher = userRole === 'TEACHER';
  const isStudent = userRole === 'STUDENT';

  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Reject Dialog state
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadLeaveDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/leaves/${id}`);
      if (res.data.success) {
        setLeave(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch leave details.');
      navigate(ROUTES.LEAVES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadLeaveDetails();
    }
  }, [id]);

  const handleApprove = async () => {
    if (!leave) return;
    if (!window.confirm('Are you sure you want to approve this leave request? This will update attendance automatically.')) {
      return;
    }
    try {
      const res = await apiClient.patch(`/leaves/${leave.id}/approve`);
      if (res.data.success) {
        toast.success('Leave request approved.');
        loadLeaveDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleRejectSubmit = async () => {
    if (!leave) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    try {
      const res = await apiClient.patch(`/leaves/${leave.id}/reject`, {
        rejectionReason
      });
      if (res.data.success) {
        toast.success('Leave request rejected.');
        setRejecting(false);
        setRejectionReason('');
        loadLeaveDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    }
  };

  const handleCancel = async () => {
    if (!leave) return;
    if (!window.confirm('Are you sure you want to cancel your leave request?')) {
      return;
    }
    try {
      const res = await apiClient.patch(`/leaves/${leave.id}/cancel`);
      if (res.data.success) {
        toast.success('Leave request cancelled successfully.');
        loadLeaveDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-xs text-slate-500 mt-4 font-mono">Loading request details...</p>
        </div>
      </PageContainer>
    );
  }

  if (!leave) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-base font-bold text-slate-700">Leave Request Not Found</p>
          <Button onClick={() => navigate(ROUTES.LEAVES)} className="mt-4">
            Go Back
          </Button>
        </div>
      </PageContainer>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <Ban className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getApplicantCard = () => {
    if (leave.applicantType === 'Student' && leave.student) {
      return (
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Student Applicant</span>
            <h4 className="text-sm font-bold text-slate-800">{leave.student.fullName}</h4>
            <div className="flex gap-4 mt-0.5 text-xs text-slate-500 font-medium">
              <span>Reg #: <strong className="font-semibold">{leave.student.registrationNumber}</strong></span>
              <span>Roll #: <strong className="font-semibold">{leave.student.rollNumber}</strong></span>
            </div>
          </div>
        </div>
      );
    } else if (leave.applicantType === 'Teacher' && leave.teacher) {
      const userObj = leave.teacher.user;
      return (
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Faculty Applicant</span>
            <h4 className="text-sm font-bold text-slate-800">{`Prof. ${userObj?.firstName} ${userObj?.lastName}`}</h4>
            <div className="flex gap-4 mt-0.5 text-xs text-slate-500 font-medium">
              <span>Employee ID: <strong className="font-semibold">{leave.teacher.employeeId}</strong></span>
              <span>Email: <strong className="font-semibold">{userObj?.email}</strong></span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const canApproveReject =
    isAdmin ||
    (isTeacher && leave.applicantType === 'Student'); // Simple elegant check, backend will secure perfectly

  return (
    <PageContainer>
      {/* Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.LEAVES)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaves Workspace
        </button>
        {getStatusBadge(leave.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border border-slate-100 bg-white shadow-sm rounded-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">Request Reference</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5">Leave Application #{leave.leaveNumber}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">SUBMITTED ON</span>
                <span className="text-sm font-semibold text-slate-700">
                  {new Date(leave.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Applicant detail section */}
            <div className="mb-8">{getApplicantCard()}</div>

            {/* Core parameters list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 border border-slate-100 rounded-xl mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Bookmark className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Leave Classification</span>
                    <strong className="font-semibold text-slate-800">{leave.leaveType}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Building2 className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Department</span>
                    <strong className="font-semibold text-slate-800">{leave.department.name} ({leave.department.code})</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CalendarDays className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Date Bounds</span>
                    <strong className="font-semibold text-slate-800">
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Clock className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Exemption Period</span>
                    <strong className="font-semibold text-indigo-700">{leave.totalDays} {leave.totalDays === 1 ? 'Academic Day' : 'Academic Days'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Exemption Link */}
            {leave.courseOffering && (
              <div className="p-4 bg-indigo-50/35 rounded-xl border border-indigo-100/50 mb-8 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-indigo-800 uppercase tracking-wider block">Course Exemption Linked</span>
                  <span className="text-slate-600 mt-0.5">
                    This leave request specifically requests exemption from course <strong>{leave.courseOffering.courseCode}</strong> ({leave.courseOffering.subject.name}).
                  </span>
                </div>
              </div>
            )}

            {/* Explanatory Reason */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Explanatory Statement</h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                {leave.reason}
              </p>
            </div>

            {/* Supporting Document */}
            {leave.supportingDocument && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Supporting Evidence</h3>
                <a
                  href={leave.supportingDocument}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200/50 transition-all"
                >
                  <Paperclip className="w-4 h-4" />
                  Download Supporting Document
                </a>
              </div>
            )}

            {/* Remarks */}
            {leave.remarks && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Applicant Remarks</h3>
                <p className="text-sm text-slate-500 italic">
                  &ldquo;{leave.remarks}&rdquo;
                </p>
              </div>
            )}

            {/* Dynamic Approval history display */}
            {leave.status === 'APPROVED' && (
              <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 mt-8">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4.5 h-4.5" /> Approval Authorization History
                </h4>
                <p className="text-sm text-emerald-700 mt-2 font-medium">
                  This request was reviewed and authorized by <strong className="font-bold">{leave.approvedBy || 'Admin System'}</strong>.
                </p>
                {leave.approvalDate && (
                  <span className="block text-xs text-emerald-500 mt-1 font-mono">
                    Timestamp: {new Date(leave.approvalDate).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Rejection Details */}
            {leave.status === 'REJECTED' && (
              <div className="p-5 bg-rose-50 rounded-xl border border-rose-100 mt-8">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4.5 h-4.5" /> Rejection Log
                </h4>
                <p className="text-sm text-rose-700 mt-2">
                  <strong className="font-semibold block">Reason for rejection:</strong>
                  {leave.rejectionReason || 'No explanatory reason provided.'}
                </p>
              </div>
            )}

            {/* Direct Approval/Rejection Actions for authorities */}
            {leave.status === 'PENDING' && canApproveReject && (
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-8">
                <Button
                  onClick={() => setRejecting(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Reject Request
                </Button>
                <Button
                  onClick={handleApprove}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Approve Leave
                </Button>
              </div>
            )}

            {/* Cancellation option for Owner */}
            {leave.status === 'PENDING' && !canApproveReject && (
              <div className="flex justify-end pt-6 border-t border-slate-100 mt-8">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="px-5 py-2.5 border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-lg"
                >
                  Cancel Request
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Info Sidebar Timeline */}
        <div className="space-y-6">
          <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-xl">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" /> Request Timeline
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 text-xs">
              {/* Submission */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                </div>
                <h4 className="font-bold text-slate-800">Submitted</h4>
                <p className="text-slate-500 mt-0.5">Leave request was generated and logged.</p>
              </div>

              {/* Review */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full border-4 border-white flex items-center justify-center ${
                  leave.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Clock className="w-2.5 h-2.5" />
                </div>
                <h4 className="font-bold text-slate-800">Review</h4>
                <p className="text-slate-500 mt-0.5">Evaluation of schedule overlaps and academic calendar constraints.</p>
              </div>

              {/* Resolution */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full border-4 border-white flex items-center justify-center ${
                  leave.status === 'PENDING'
                    ? 'bg-slate-100 text-slate-400'
                    : leave.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-600'
                    : leave.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  <Bookmark className="w-2.5 h-2.5" />
                </div>
                <h4 className="font-bold text-slate-800">Resolution</h4>
                <p className="text-slate-500 mt-0.5">
                  {leave.status === 'PENDING'
                    ? 'Awaiting authoritative decision.'
                    : `Resolved as ${leave.status}.`}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Modal Overlay */}
      {rejecting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Reject Leave Request
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Please provide a clear reason for rejecting this leave request. This reason will be logged and visible to the applicant.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason here..."
                rows={4}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none"
              ></textarea>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                onClick={() => setRejecting(false)}
                variant="outline"
                className="px-4 py-2 border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
              >
                Submit Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
