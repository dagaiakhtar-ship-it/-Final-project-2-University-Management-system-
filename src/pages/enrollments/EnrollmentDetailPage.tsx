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
  BookOpen,
  User,
  GraduationCap,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Shield,
  CreditCard,
  Edit2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const EnrollmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await apiClient.get(`/enrollments/${id}`);
        if (response.data?.status === 'success') {
          setEnrollment(response.data.data);
        }
      } catch (err: any) {
        console.error('Failed to load enrollment detail', err);
        toast.error(err.response?.data?.message || 'Failed to retrieve enrollment details.');
        navigate(ROUTES.ENROLLMENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!enrollment) return;
    try {
      const res = await apiClient.patch(`/enrollments/${enrollment.id}/status`, { status: newStatus });
      if (res.data?.status === 'success') {
        toast.success(`Enrollment status updated to ${newStatus}`);
        setEnrollment({
          ...enrollment,
          status: newStatus,
          advisorApproval: newStatus === 'Approved' || newStatus === 'Enrolled' ? true : enrollment.advisorApproval,
          registrarApproval: newStatus === 'Approved' || newStatus === 'Enrolled' ? true : enrollment.registrarApproval,
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-sm text-gray-500">Loading enrollment detail sheet...</p>
        </div>
      </PageContainer>
    );
  }

  if (!enrollment) {
    return (
      <PageContainer>
        <div className="py-16 text-center">
          <h3 className="text-lg font-bold text-gray-900">Enrollment Record Not Found</h3>
          <p className="text-sm text-gray-500 mt-1">The requested academic registration does not exist.</p>
          <Link to={ROUTES.ENROLLMENTS} className="mt-4 inline-block">
            <Button size="sm">Back to List</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Helpers
  const getStatusBadge = (status: string) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5';
    switch (status) {
      case 'Approved':
      case 'Enrolled':
        return `${base} bg-green-50 text-green-700 border border-green-200`;
      case 'Pending':
        return `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
      case 'Dropped':
      case 'Withdrawn':
        return `${base} bg-red-50 text-red-700 border border-red-200`;
      case 'Completed':
        return `${base} bg-blue-50 text-blue-700 border border-blue-200`;
      default:
        return `${base} bg-gray-50 text-gray-700 border border-gray-200`;
    }
  };

  const getFeesBadge = (tuitionStatus: string) => {
    const base = 'px-2.5 py-0.5 text-xs font-medium rounded-md';
    switch (tuitionStatus) {
      case 'Paid':
        return `${base} bg-emerald-50 text-emerald-700 border border-emerald-100`;
      case 'Scholarship':
        return `${base} bg-indigo-50 text-indigo-700 border border-indigo-100`;
      default:
        return `${base} bg-rose-50 text-rose-700 border border-rose-100`;
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.ENROLLMENTS}>
            <Button variant="outline" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Enrollment File</h1>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              NID: {enrollment.enrollmentNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action triggers */}
          {isWritable && enrollment.status === 'Pending' && (
            <>
              <Button onClick={() => handleStatusChange('Approved')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Approve
              </Button>
              <Button onClick={() => handleStatusChange('Dropped')} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                Decline
              </Button>
            </>
          )}

          {/* Edit Button */}
          {(isWritable || (user?.role === 'STUDENT' && enrollment.status === 'Pending')) && (
            <Link to={`${ROUTES.ENROLLMENTS}/${enrollment.id}/edit`}>
              <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5 text-indigo-600 border-indigo-200 bg-indigo-50/10">
                <Edit2 className="w-3.5 h-3.5" /> Edit Record
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main profile section */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enrollment Status</div>
                <div className="pt-1">{getStatusBadge(enrollment.status)}</div>
              </div>
              <div className="text-right space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Credits Enrolled</span>
                <span className="text-xl font-black text-gray-950 block">{enrollment.creditsRegistered} Credit Hours</span>
              </div>
            </div>

            {/* Grid particulars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100 text-sm">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-600">
                  <GraduationCap className="w-4 h-4" /> Student Particulars
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Student Name</span>
                    <span className="font-semibold text-gray-900">{enrollment.student?.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Roll Number</span>
                    <span className="font-mono font-semibold text-gray-900">{enrollment.student?.rollNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Reg No</span>
                    <span className="font-mono text-gray-900">{enrollment.student?.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Department</span>
                    <span className="font-semibold text-gray-900">{enrollment.student?.department?.code}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Program Track</span>
                    <span className="font-semibold text-gray-900">{enrollment.student?.program?.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Active Term</span>
                    <span className="font-semibold text-gray-900">{enrollment.student?.semester?.name}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-600">
                  <BookOpen className="w-4 h-4" /> Course Particulars
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Subject Class</span>
                    <span className="font-semibold text-gray-900">{enrollment.courseOffering?.subject?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Course Code</span>
                    <span className="font-mono font-semibold text-gray-900">{enrollment.courseOffering?.courseCode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Semester Period</span>
                    <span className="font-semibold text-gray-900">{enrollment.session} {enrollment.academicYear}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Assigned Teacher</span>
                    <span className="font-semibold text-gray-900">
                      {enrollment.courseOffering?.teacher?.user?.firstName} {enrollment.courseOffering?.teacher?.user?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Tuition Class</span>
                    <span className={getFeesBadge(enrollment.tuitionStatus)}>{enrollment.tuitionStatus}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Class Type</span>
                    <span className="font-semibold text-gray-800">{enrollment.enrollmentType}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Clearances progress tracking */}
          <Card className="p-6">
            <h3 className="font-bold text-xs uppercase text-gray-400 tracking-widest mb-4">Academic Clearance Pipelines</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-lg p-4 flex items-start gap-3">
                {enrollment.advisorApproval ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <Clock className="w-6 h-6 text-yellow-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-gray-900 text-sm">Department Advisor Review</div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Advisor verification of the student's program requirements, prerequisites, and curriculum tracks.
                  </p>
                  <span className="text-[10px] font-bold text-gray-400 font-mono block mt-2 uppercase">
                    Status: {enrollment.advisorApproval ? 'Cleared & Approved' : 'Awaiting Review'}
                  </span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-lg p-4 flex items-start gap-3">
                {enrollment.registrarApproval ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <Clock className="w-6 h-6 text-yellow-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-gray-900 text-sm">Registrar Activation</div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Registrar board validation of class sizes, fee ledgers, tuition clearances, and final block list rosters.
                  </p>
                  <span className="text-[10px] font-bold text-gray-400 font-mono block mt-2 uppercase">
                    Status: {enrollment.registrarApproval ? 'Active & Enrolled' : 'Awaiting Admission Activation'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column - Remarks / Metadata */}
        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-500" /> Remarks & Memo
            </h3>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 leading-relaxed min-h-[100px]">
              {enrollment.remarks || 'No notes or remarks provided on this registration ledger.'}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-gray-500" /> System Tracking Metadata
            </h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <div>
                <span className="font-semibold block text-[10px] uppercase text-gray-400">Ledger Entry ID</span>
                <span className="font-mono text-[11px] text-gray-700 break-all select-all">{enrollment.uuid}</span>
              </div>
              <div>
                <span className="font-semibold block text-[10px] uppercase text-gray-400">Created By</span>
                <span className="font-medium text-indigo-600">{enrollment.createdBy}</span>
              </div>
              <div>
                <span className="font-semibold block text-[10px] uppercase text-gray-400">Last Modified By</span>
                <span className="font-medium text-indigo-600">{enrollment.updatedBy}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <span className="font-semibold block text-[9px] uppercase text-gray-400">Created At</span>
                  <span className="text-[10px] text-gray-700">
                    {new Date(enrollment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold block text-[9px] uppercase text-gray-400">Modified At</span>
                  <span className="text-[10px] text-gray-700">
                    {new Date(enrollment.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
