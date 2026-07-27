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
import { createProgramSchema } from '../../validators/program.validators';
import { ArrowLeft, Check, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { z } from 'zod';

interface FormData {
  name: string;
  code: string;
  shortName?: string | null;
  degreeLevel: 'Diploma' | 'Associate' | 'BS' | 'MS' | 'MPhil' | 'PhD';
  departmentId: number;
  duration: number;
  totalSemesters: number;
  creditHours: number;
  description?: string | null;
  coordinatorId?: number | null;
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

interface Department {
  id: number;
  name: string;
  code: string;
}

export const ProgramCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createProgramSchema) as any,
    defaultValues: {
      status: 'ACTIVE',
      coordinatorId: null,
      shortName: '',
      description: '',
      duration: 4,
      totalSemesters: 8,
      creditHours: 130,
    },
  });

  // Fetch initial configuration (Potential coordinators and active departments)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [teachersRes, deptsRes] = await Promise.all([
          apiClient.get('/programs/teachers'),
          apiClient.get('/departments', { params: { status: 'ACTIVE', limit: 100 } }),
        ]);

        if (teachersRes.data?.status === 'success') {
          setTeachers(teachersRes.data.data);
        }
        if (deptsRes.data?.status === 'success') {
          setDepartments(deptsRes.data.data.departments || []);
        }
      } catch (err) {
        console.error('Failed to load initial form data:', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      // Clean and map fields to match the validation requirements
      const cleanData = {
        ...data,
        shortName: data.shortName?.trim() || null,
        description: data.description?.trim() || null,
        departmentId: Number(data.departmentId),
        duration: Number(data.duration),
        totalSemesters: Number(data.totalSemesters),
        creditHours: Number(data.creditHours),
        coordinatorId: data.coordinatorId ? Number(data.coordinatorId) : null,
      };

      const response = await apiClient.post('/programs', cleanData);
      if (response.data?.status === 'success') {
        navigate(ROUTES.PROGRAMS);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Failed to create program. Please try again.'
      );
    }
  };

  if (loadingInitial) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-500 font-mono text-sm">Loading options...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Breadcrumbs / Header Header */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between" id="program-create-header-block">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-1">
            <Link to={ROUTES.DASHBOARD} className="hover:text-indigo-600">ERP</Link>
            <span>/</span>
            <Link to={ROUTES.PROGRAMS} className="hover:text-indigo-600">PROGRAMS</Link>
            <span>/</span>
            <span className="text-gray-400">CREATE</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Create Academic Program
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Define a new degree program, assign a coordinator, and configure academic requirements.
          </p>
        </div>
        <div>
          <Link to={ROUTES.PROGRAMS}>
            <Button variant="outline" size="sm" className="flex items-center gap-2 font-mono text-xs">
              <ArrowLeft className="w-4 h-4" /> Back to Programs
            </Button>
          </Link>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3 text-sm animate-fade-in" id="program-create-submit-error">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Creation Failed:</span> {submitError}
          </div>
        </div>
      )}

      {/* Main Creation Card Form */}
      <Card className="p-6 md:p-8 max-w-4xl shadow-sm border border-gray-100" id="program-create-form-card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="departmentId" className="text-xs font-mono font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="departmentId"
                {...register('departmentId', { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.departmentId ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <span className="text-xs text-red-600 font-mono mt-0.5">{errors.departmentId.message}</span>
              )}
            </div>

            {/* Degree Level */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="degreeLevel" className="text-xs font-mono font-medium text-gray-700">
                Degree Level <span className="text-red-500">*</span>
              </label>
              <select
                id="degreeLevel"
                {...register('degreeLevel')}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.degreeLevel ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">-- Select Level --</option>
                <option value="Diploma">Diploma</option>
                <option value="Associate">Associate Degree</option>
                <option value="BS">Bachelor of Science (BS)</option>
                <option value="MS">Master of Science (MS)</option>
                <option value="MPhil">Master of Philosophy (MPhil)</option>
                <option value="PhD">Doctor of Philosophy (PhD)</option>
              </select>
              {errors.degreeLevel && (
                <span className="text-xs text-red-600 font-mono mt-0.5">{errors.degreeLevel.message}</span>
              )}
            </div>

            {/* Program Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-mono font-medium text-gray-700">
                Program Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="e.g. BS Computer Science"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            {/* Program Code */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="text-xs font-mono font-medium text-gray-700">
                Program Code <span className="text-red-500">*</span>
              </label>
              <Input
                id="code"
                placeholder="e.g. BSCS (Strictly Alphanumeric)"
                {...register('code')}
                error={errors.code?.message}
                className="uppercase"
              />
            </div>

            {/* Short Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="shortName" className="text-xs font-mono font-medium text-gray-700">
                Short Name / Acronym
              </label>
              <Input
                id="shortName"
                placeholder="e.g. BS-CS"
                {...register('shortName')}
                error={errors.shortName?.message}
                className="uppercase"
              />
            </div>

            {/* Program Coordinator */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="coordinatorId" className="text-xs font-mono font-medium text-gray-700">
                Program Coordinator
              </label>
              <select
                id="coordinatorId"
                {...register('coordinatorId')}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.coordinatorId ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">-- No Coordinator --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName} ({teacher.user.email})
                  </option>
                ))}
              </select>
              {errors.coordinatorId && (
                <span className="text-xs text-red-600 font-mono mt-0.5">{errors.coordinatorId.message}</span>
              )}
            </div>

            {/* Duration (Years) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="duration" className="text-xs font-mono font-medium text-gray-700">
                Duration (Years) <span className="text-red-500">*</span>
              </label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g. 4"
                {...register('duration', { valueAsNumber: true })}
                error={errors.duration?.message}
              />
            </div>

            {/* Total Semesters */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="totalSemesters" className="text-xs font-mono font-medium text-gray-700">
                Total Semesters <span className="text-red-500">*</span>
              </label>
              <Input
                id="totalSemesters"
                type="number"
                placeholder="e.g. 8"
                {...register('totalSemesters', { valueAsNumber: true })}
                error={errors.totalSemesters?.message}
              />
            </div>

            {/* Credit Hours */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="creditHours" className="text-xs font-mono font-medium text-gray-700">
                Required Credit Hours <span className="text-red-500">*</span>
              </label>
              <Input
                id="creditHours"
                type="number"
                placeholder="e.g. 130"
                {...register('creditHours', { valueAsNumber: true })}
                error={errors.creditHours?.message}
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className="text-xs font-mono font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        {...field}
                        value="ACTIVE"
                        checked={field.value === 'ACTIVE'}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        {...field}
                        value="INACTIVE"
                        checked={field.value === 'INACTIVE'}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300"
                      />
                      Inactive
                    </label>
                  </div>
                )}
              />
              {errors.status && (
                <span className="text-xs text-red-600 font-mono mt-0.5">{errors.status.message}</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-mono font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Provide a description of the program aims, eligibility criteria, scope, and objectives."
              rows={4}
              {...register('description')}
              className={`w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
            />
            <div className="flex justify-between items-center text-2xs text-gray-400 mt-1 font-mono">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Maximum 500 characters
              </span>
            </div>
            {errors.description && (
              <span className="text-xs text-red-600 font-mono mt-0.5">{errors.description.message}</span>
            )}
          </div>

          {/* Buttons Area */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Link to={ROUTES.PROGRAMS}>
              <Button type="button" variant="outline" size="sm" className="font-mono text-xs">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="flex items-center gap-2 font-mono text-xs"
              isLoading={isSubmitting}
            >
              <Check className="w-4 h-4" /> Save Program
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
};
export default ProgramCreatePage;
