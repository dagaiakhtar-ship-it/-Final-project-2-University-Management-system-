import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { createDepartmentSchema } from '../../validators/department.validators';
import { ArrowLeft, Check, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { z } from 'zod';

interface FormData {
  name: string;
  code: string;
  shortName?: string | null;
  description?: string | null;
  faculty?: string | null;
  officeLocation?: string | null;
  officePhone?: string | null;
  officeEmail?: string | null;
  headOfDepartmentId?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Teacher {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const DepartmentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createDepartmentSchema) as any,
    defaultValues: {
      status: 'ACTIVE',
      headOfDepartmentId: null,
      shortName: '',
      description: '',
      faculty: '',
      officeLocation: '',
      officePhone: '',
      officeEmail: '',
    },
  });

  // Fetch Potential heads of departments
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await apiClient.get('/departments/teachers');
        if (response.data?.status === 'success') {
          setTeachers(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load teachers for HOD select box:', err);
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      // Clean empty string values to null before sending
      const cleanData = {
        ...data,
        shortName: data.shortName?.trim() || null,
        description: data.description?.trim() || null,
        faculty: data.faculty?.trim() || null,
        officeLocation: data.officeLocation?.trim() || null,
        officePhone: data.officePhone?.trim() || null,
        officeEmail: data.officeEmail?.trim() || null,
        headOfDepartmentId: data.headOfDepartmentId ? Number(data.headOfDepartmentId) : null,
      };

      const response = await apiClient.post('/departments', cleanData);
      if (response.data?.status === 'success') {
        navigate(ROUTES.DEPARTMENTS);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to establish new department.'
      );
    }
  };

  return (
    <PageContainer
      title="Create Department"
      description="Register a new academic department, define code clearance, and appoint administrative roles."
      action={
        <Link to={ROUTES.DEPARTMENTS}>
          <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Cancel & Back
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl mx-auto" id="create-department-container">
        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h4 className="font-semibold text-sm font-sans tracking-tight">Department Creation Failed</h4>
              <p className="text-xs text-red-700 mt-1 font-sans">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card
            title="Department Details"
            description="Enter the core parameters, identification code, and operational settings for the department."
            className="border border-slate-200 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department Name */}
              <div className="col-span-1 md:col-span-2">
                <Input
                  label="Department Name *"
                  placeholder="e.g. Department of Computer Science"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>

              {/* Department Code */}
              <div>
                <Input
                  label="Department Code *"
                  placeholder="e.g. COMPSCI"
                  error={errors.code?.message}
                  helperText="Unique uppercase identifier (max 10 chars, alphanumeric/hyphens)."
                  {...register('code')}
                />
              </div>

              {/* Short Name */}
              <div>
                <Input
                  label="Short Name / Abbreviation"
                  placeholder="e.g. CS"
                  error={errors.shortName?.message}
                  {...register('shortName')}
                />
              </div>

              {/* Faculty */}
              <div>
                <Input
                  label="Faculty / School"
                  placeholder="e.g. Faculty of Engineering"
                  error={errors.faculty?.message}
                  {...register('faculty')}
                />
              </div>

              {/* Head of Department */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                  Head of Department (Teacher)
                </label>
                <Controller
                  name="headOfDepartmentId"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all h-[38px]"
                      disabled={loadingTeachers}
                    >
                      <option value="">-- Appoint HOD (Optional) --</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.user.firstName} {teacher.user.lastName} ({teacher.user.email})
                        </option>
                      ))}
                    </select>
                  )}
                />
                {loadingTeachers && (
                  <p className="text-2xs text-slate-400 mt-1 animate-pulse">Loading teachers list...</p>
                )}
              </div>

              {/* Description */}
              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Summarize the department mission statement, course focus, or operational mandate..."
                  rows={4}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all ${
                    errors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
                  }`}
                  {...register('description')}
                />
                {errors.description ? (
                  <p className="text-xs text-red-500 font-medium mt-1">{errors.description.message}</p>
                ) : (
                  <p className="text-2xs text-slate-400 mt-1">Brief summary, maximum 500 characters.</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                  Status
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all h-[38px]"
                    >
                      <option value="ACTIVE">ACTIVE (Receiving Enrollments)</option>
                      <option value="INACTIVE">INACTIVE (Administrative Hold)</option>
                    </select>
                  )}
                />
              </div>
            </div>
          </Card>

          <Card
            title="Operational Contacts"
            description="Office physical location, department-specific support email, and operational phone numbers."
            className="border border-slate-200 mt-6 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Office Location */}
              <div>
                <Input
                  label="Office Location"
                  placeholder="e.g. Block C, Room 402"
                  error={errors.officeLocation?.message}
                  {...register('officeLocation')}
                />
              </div>

              {/* Office Phone */}
              <div>
                <Input
                  label="Office Phone"
                  placeholder="e.g. +1 (555) 019-2834"
                  error={errors.officePhone?.message}
                  {...register('officePhone')}
                />
              </div>

              {/* Office Email */}
              <div className="col-span-1 md:col-span-2">
                <Input
                  label="Office Email"
                  placeholder="e.g. computer.science@smartuniversity.edu"
                  error={errors.officeEmail?.message}
                  {...register('officeEmail')}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end items-center gap-3 mt-6">
            <Link to={ROUTES.DEPARTMENTS}>
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Create Department
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};
export default DepartmentCreatePage;
