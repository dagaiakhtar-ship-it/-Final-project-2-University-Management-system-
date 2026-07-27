import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  Ban
} from 'lucide-react';

interface StudentProfile {
  id: number;
  fullName: string;
  registrationNumber: string;
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

export const LeaveDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role || 'STUDENT';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isTeacher = userRole === 'TEACHER';
  const isStudent = userRole === 'STUDENT';

  // Core List State
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState(isTeacher ? 'student' : 'all'); // 'own' or 'student' for teacher
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Rejection Modal State
  const [rejectionModalId, setRejectionModalId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Fetch departments list for filtering
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiClient.get('/departments');
        setDepartments(res.data.data?.departments || res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch Leaves Data
  const loadLeaves = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        leaveType: leaveTypeFilter || undefined,
        applicantType: applicantTypeFilter || undefined,
        departmentId: selectedDepartment || undefined,
      };

      // Set scope parameter for teachers
      if (isTeacher) {
        params.scope = scopeFilter;
      }

      const res = await apiClient.get('/leaves', { params });
      if (res.data.success) {
        setLeaves(res.data.data);
        setTotalItems(res.data.total);

        // Update local metrics summary
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        } else {
          // Fallback simple metrics calc
          const leavesData = res.data.data as LeaveRequest[];
          setMetrics({
            total: res.data.total,
            pending: leavesData.filter(l => l.status === 'PENDING').length,
            approved: leavesData.filter(l => l.status === 'APPROVED').length,
            rejected: leavesData.filter(l => l.status === 'REJECTED').length,
          });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [page, statusFilter, leaveTypeFilter, applicantTypeFilter, selectedDepartment, scopeFilter]);

  // Real-time socket updates
  useEffect(() => {
    const socket = io();
    socket.on('leave:changed', (data: any) => {
      toast.success(`Leave update: Request #${data.leaveNumber} is now ${data.status}`);
      loadLeaves();
    });

    return () => {
      socket.disconnect();
    };
  }, [scopeFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setLeaveTypeFilter('');
    setApplicantTypeFilter('');
    setSelectedDepartment('');
    setPage(1);
    loadLeaves();
  };

  // Quick action: Approve Leave
  const handleApprove = async (id: number) => {
    if (!window.confirm('Are you sure you want to approve this leave request? This will automatically update attendance record status.')) {
      return;
    }
    try {
      const res = await apiClient.patch(`/leaves/${id}/approve`);
      if (res.data.success) {
        toast.success('Leave request approved successfully.');
        loadLeaves();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  // Reject Leave Submission
  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    try {
      const res = await apiClient.patch(`/leaves/${rejectionModalId}/reject`, {
        rejectionReason
      });
      if (res.data.success) {
        toast.success('Leave request rejected.');
        setRejectionModalId(null);
        setRejectionReason('');
        loadLeaves();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    }
  };

  // Quick action: Cancel Leave
  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this leave request? Approved attendance records will be restored to their original state.')) {
      return;
    }
    try {
      const res = await apiClient.patch(`/leaves/${id}/cancel`);
      if (res.data.success) {
        toast.success('Leave request cancelled successfully.');
        loadLeaves();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending
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

  const getApplicantName = (leave: LeaveRequest) => {
    if (leave.applicantType === 'Student' && leave.student) {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{leave.student.fullName}</span>
          <span className="text-xs text-slate-500 font-mono">{leave.student.registrationNumber}</span>
        </div>
      );
    } else if (leave.applicantType === 'Teacher' && leave.teacher) {
      const userObj = leave.teacher.user;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{`Prof. ${userObj?.firstName} ${userObj?.lastName}`}</span>
          <span className="text-xs text-slate-500 font-mono">{leave.teacher.employeeId}</span>
        </div>
      );
    }
    return <span className="text-slate-400">Unknown Applicant</span>;
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return (
    <PageContainer>
      {/* Header and Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Leave Management Workspace
          </h1>
          <p className="text-sm text-slate-500">
            {isStudent
              ? 'Submit, track, and manage your personal leave applications.'
              : 'Process student and faculty leaves with integrated academic schedules.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isTeacher && (
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => {
                  setScopeFilter('student');
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  scopeFilter === 'student'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Approval Queue
              </button>
              <button
                onClick={() => {
                  setScopeFilter('own');
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  scopeFilter === 'own'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                My Leaves
              </button>
            </div>
          )}
          <Button
            onClick={() => navigate(ROUTES.LEAVES_CREATE)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 flex items-center justify-between border border-slate-100 bg-white shadow-sm rounded-xl">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-bold text-slate-850 mt-1">{totalItems}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border border-slate-100 bg-white shadow-sm rounded-xl">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {leaves.filter(l => l.status === 'PENDING').length}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border border-slate-100 bg-white shadow-sm rounded-xl">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {leaves.filter(l => l.status === 'APPROVED').length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border border-slate-100 bg-white shadow-sm rounded-xl">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rejected / Cancelled</p>
            <p className="text-2xl font-bold text-slate-600 mt-1">
              {leaves.filter(l => l.status === 'REJECTED' || l.status === 'CANCELLED').length}
            </p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
            <XCircle className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Advanced Filters Card */}
      <Card className="p-6 mb-8 border border-slate-100 bg-white shadow-sm rounded-xl">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          Filter Leave Workspace
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, Code, Reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && loadLeaves()}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Leave Type Filter */}
          <select
            value={leaveTypeFilter}
            onChange={(e) => {
              setLeaveTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="">All Leave Types</option>
            <option value="Casual">Casual Leave</option>
            <option value="Medical">Medical Leave</option>
            <option value="Annual">Annual Leave</option>
            <option value="Maternity">Maternity Leave</option>
            <option value="Study">Study Leave</option>
            <option value="Other">Other Leave</option>
          </select>

          {/* Department Filter (For Admins and Teachers approving general) */}
          {(isAdmin || (isTeacher && scopeFilter === 'student')) && (
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
          )}

          {/* Applicant Type (For Admins) */}
          {isAdmin && (
            <select
              value={applicantTypeFilter}
              onChange={(e) => {
                setApplicantTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">All Applicants</option>
              <option value="Student">Students</option>
              <option value="Teacher">Teachers</option>
            </select>
          )}

          <div className="flex gap-2 lg:col-span-1">
            <Button
              onClick={loadLeaves}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2 rounded-lg"
            >
              Search
            </Button>
            <Button
              onClick={handleResetFilters}
              variant="outline"
              className="p-2 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table Grid */}
      <Card className="overflow-hidden border border-slate-100 bg-white shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-xs text-slate-500 mt-4 font-mono">Loading leave requests workspace...</p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-base font-bold text-slate-700">No leave requests found</p>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                There are no leave requests matching your current filters or scope.
              </p>
              <Button
                onClick={handleResetFilters}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Leave #</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Type / Dept</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Duration</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Days</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((leave) => {
                  const isOwner =
                    (isStudent && leave.studentId) || (isTeacher && leave.teacherId);
                  const canApproveReject =
                    isAdmin ||
                    (isTeacher &&
                      scopeFilter === 'student' &&
                      leave.applicantType === 'Student');

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-mono font-bold text-indigo-600">
                        {leave.leaveNumber}
                      </td>
                      <td className="py-4 px-6">
                        {getApplicantName(leave)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">
                            {leave.leaveType}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold uppercase">
                            {leave.department.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">
                            {new Date(leave.startDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            to{' '}
                            {new Date(leave.endDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-mono font-bold text-slate-700 text-center">
                        {leave.totalDays}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(leave.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => navigate(`/leaves/${leave.id}`)}
                            variant="outline"
                            className="p-1.5 border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Approval Controls */}
                          {canApproveReject && leave.status === 'PENDING' && (
                            <>
                              <Button
                                onClick={() => handleApprove(leave.id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                                title="Approve Request"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setRejectionModalId(leave.id);
                                  setRejectionReason('');
                                }}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                                title="Reject Request"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {/* Cancellation Controls */}
                          {leave.status === 'PENDING' && (
                            <Button
                              onClick={() => handleCancel(leave.id)}
                              variant="outline"
                              className="p-1.5 border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg"
                              title="Cancel Request"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Toolbar */}
        {!loading && leaves.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50">
            <span className="text-xs font-mono text-slate-500">
              Showing page {page} of {totalPages} ({totalItems} records total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                className="px-3 py-1.5 border-slate-200 hover:bg-white text-xs text-slate-600 rounded-lg"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                className="px-3 py-1.5 border-slate-200 hover:bg-white text-xs text-slate-600 rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Rejection Modal Overlay */}
      {rejectionModalId && (
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
                onClick={() => setRejectionModalId(null)}
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
