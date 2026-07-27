import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateEnrollmentSchema } from '../../validators/enrollment.validators';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { ArrowLeft, Save, ShieldAlert, CheckCircle, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const EnrollmentEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [loading, setLoading] = useState(false);
  const [fetchingRecord, setFetchingRecord] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateEnrollmentSchema),
    defaultValues: {
      enrollmentType: 'Regular' as 'Regular' | 'Repeat' | 'Improvement' | 'Audit',
      creditsRegistered: 3,
      tuitionStatus: 'Pending' as 'Pending' | 'Paid' | 'Scholarship',
      advisorApproval: false,
      registrarApproval: false,
      status: 'Pending' as 'Pending' | 'Approved' | 'Enrolled' | 'Dropped' | 'Withdrawn' | 'Completed',
      remarks: '',
    },
  });

  // Fetch current enrollment details
  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!id) return;
      setFetchingRecord(true);
      try {
        const response = await apiClient.get(`/enrollments/${id}`);
        if (response.data?.status === 'success') {
          const rec = response.data.data;
          setEnrollment(rec);

          // Populate form fields
          setValue('enrollmentType', rec.enrollmentType);
          setValue('creditsRegistered', rec.creditsRegistered);
          setValue('tuitionStatus', rec.tuitionStatus);
          setValue('advisorApproval', rec.advisorApproval);
          setValue('registrarApproval', rec.registrarApproval);
          setValue('status', rec.status);
          setValue('remarks', rec.remarks || '');
        }
      } catch (err: any) {
        console.error('Failed to retrieve enrollment details', err);
        toast.error(err.response?.data?.message || 'Failed to load enrollment record.');
        navigate(ROUTES.ENROLLMENTS);
      } finally {
        setFetchingRecord(false);
      }
    };

    fetchEnrollment();
  }, [id, setValue, navigate]);

  const onSubmit = async (data: any) => {
    if (!id) return;
    setLoading(true);
    try {
      const payload = {
        ...data,
        creditsRegistered: Number(data.creditsRegistered),
      };

      const response = await apiClient.put(`/enrollments/${id}`, payload);
      if (response.data?.status === 'success') {
        toast.success('Enrollment details updated successfully!');
        navigate(ROUTES.ENROLLMENTS);
      }
    } catch (err: any) {
      console.error('Failed to save enrollment changes', err);
      toast.error(err.response?.data?.message || 'Failed to update enrollment record.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingRecord) {
    return (
      <PageContainer>
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-sm text-gray-500">Loading enrollment ledger...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Link to={ROUTES.ENROLLMENTS}>
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Edit Enrollment Record</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">
            ID Ref: {enrollment?.enrollmentNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Display details */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                  <span className="font-semibold text-gray-500">Student Name</span>
                  <span className="font-bold text-gray-900">{enrollment?.student?.fullName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                  <span className="font-semibold text-gray-500">Student Roll No</span>
                  <span className="font-mono text-gray-900">{enrollment?.student?.rollNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-500">Subject Class</span>
                  <span className="font-semibold text-indigo-600">
                    {enrollment?.courseOffering?.subject?.name} ({enrollment?.courseOffering?.courseCode})
                  </span>
                </div>
              </div>

              {/* Details fields: Credits & Type */}
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

              {/* Admin clearances */}
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

              {/* Remarks/Notes */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  {...register('remarks')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link to={ROUTES.ENROLLMENTS}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="primary" disabled={loading} className="inline-flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Informational Sidebar */}
        <div>
          <Card className="p-4 border border-indigo-100 bg-indigo-50/20 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Ledger Metadata</h4>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <div>
                <span className="font-semibold block text-[10px] uppercase text-gray-400">UUID Tracking ID</span>
                <span className="font-mono text-[11px] text-gray-700 break-all select-all">{enrollment?.uuid}</span>
              </div>
              <div>
                <span className="font-semibold block text-[10px] uppercase text-gray-400">Created By / Email</span>
                <span className="font-medium text-gray-700">{enrollment?.createdBy || 'System Auto'}</span>
              </div>
              <div>
                <span className="font-semibold block text-[10px] uppercase text-gray-400">Created At</span>
                <span className="font-medium text-gray-700">
                  {enrollment?.createdAt ? new Date(enrollment.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-semibold block text-[10px] uppercase text-gray-400">Last Updated At</span>
                <span className="font-medium text-gray-700">
                  {enrollment?.updatedAt ? new Date(enrollment.updatedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
