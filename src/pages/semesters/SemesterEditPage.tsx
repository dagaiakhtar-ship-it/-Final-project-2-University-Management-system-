import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { updateSemesterSchema } from '../../validators/semester.validators';
import { ArrowLeft, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Program {
  id: number;
  name: string;
  code: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

interface FormData {
  name: string;
  code: string;
  semesterNumber: number;
  programId: number;
  academicYearId: number;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  minCreditHours: number;
  maxCreditHours: number;
  semesterType: 'REGULAR' | 'SUMMER' | 'WINTER';
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'ARCHIVED';
  description?: string;
}

export const SemesterEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(updateSemesterSchema) as any,
  });

  const watchedName = watch('name');
  const watchedProgramId = watch('programId');
  const watchedSemNumber = watch('semesterNumber');

  // Convert "2026-07-01T00:00:00.000Z" to "2026-07-01" for input[type="date"]
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Fetch initial data, dropdown arrays, and the actual Semester item
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [progRes, ayRes, semRes] = await Promise.all([
          apiClient.get('/programs', { params: { limit: 100 } }),
          apiClient.get('/semesters/academic-years'),
          apiClient.get(`/semesters/${id}`),
        ]);

        let loadedProgs: Program[] = [];
        if (progRes.data?.status === 'success') {
          setPrograms(progRes.data.data.programs || []);
          loadedProgs = progRes.data.data.programs || [];
        }
        if (ayRes.data?.status === 'success') {
          setAcademicYears(ayRes.data.data || []);
        }

        if (semRes.data?.status === 'success') {
          const sem = semRes.data.data;
          reset({
            name: sem.name,
            code: sem.code,
            semesterNumber: sem.semesterNumber,
            programId: sem.programId,
            academicYearId: sem.academicYearId,
            startDate: formatDateForInput(sem.startDate),
            endDate: formatDateForInput(sem.endDate),
            registrationStartDate: formatDateForInput(sem.registrationStartDate),
            registrationEndDate: formatDateForInput(sem.registrationEndDate),
            minCreditHours: sem.minCreditHours,
            maxCreditHours: sem.maxCreditHours,
            semesterType: sem.semesterType,
            status: sem.status,
            description: sem.description || '',
          });
        }
      } catch (err: any) {
        console.error('Failed to load edit configurations:', err);
        toast.error('Failed to load edit resources');
        navigate(ROUTES.SEMESTERS);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchAllData();
  }, [id, reset, navigate]);

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      const cleanPayload = {
        ...data,
        programId: Number(data.programId),
        academicYearId: Number(data.academicYearId),
        semesterNumber: Number(data.semesterNumber),
        minCreditHours: Number(data.minCreditHours),
        maxCreditHours: Number(data.maxCreditHours),
        description: data.description?.trim() || null,
      };

      const response = await apiClient.put(`/semesters/${id}`, cleanPayload);
      if (response.data?.status === 'success') {
        toast.success('Semester updated successfully');
        navigate(ROUTES.SEMESTERS);
      }
    } catch (err: any) {
      console.error('Submit semester update failed:', err);
      setSubmitError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Failed to save semester changes. Please verify input fields.'
      );
    }
  };

  if (loadingInitial) {
    return (
      <PageContainer>
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
              Retrieving semester specifications...
            </span>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Return Link */}
      <div className="mb-6 flex items-center justify-between" id="semester-edit-title">
        <Link
          to={ROUTES.SEMESTERS}
          className="inline-flex items-center text-xs font-mono font-bold uppercase text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Semester list
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Modify Semester Configuration
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Update timelines, active periods, and credit rules for this specific academic semester
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Error Updating Semester:</span> {submitError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white p-6 rounded-2xl">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight mb-5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> Primary Attributes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Program Selection */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="programId" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Academic Program <span className="text-red-500">*</span>
                </label>
                <select
                  id="programId"
                  {...register('programId')}
                  className="w-full text-xs font-mono rounded-lg border border-slate-250 bg-slate-50/50 p-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
                >
                  <option value="">Select Target Program</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name} ({prog.code})
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <span className="text-[10px] text-red-500 font-mono font-bold">{errors.programId.message}</span>
                )}
              </div>

              {/* Academic Year Selection */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="academicYearId" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  id="academicYearId"
                  {...register('academicYearId')}
                  className="w-full text-xs font-mono rounded-lg border border-slate-250 bg-slate-50/50 p-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                    </option>
                  ))}
                </select>
                {errors.academicYearId && (
                  <span className="text-[10px] text-red-500 font-mono font-bold">{errors.academicYearId.message}</span>
                )}
              </div>

              {/* Semester Number */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="semesterNumber" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Semester Term Number (1-20) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  id="semesterNumber"
                  placeholder="e.g. 1"
                  {...register('semesterNumber', { valueAsNumber: true })}
                  error={errors.semesterNumber?.message}
                  className="bg-slate-50/50 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Semester Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Semester Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="name"
                  placeholder="e.g. Fall 2026"
                  {...register('name')}
                  error={errors.name?.message}
                  className="bg-slate-50/50 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Semester Code */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="code" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Unique Semester Code <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="code"
                  placeholder="e.g. FALL-2026-CS-01"
                  {...register('code')}
                  error={errors.code?.message}
                  className="bg-slate-50/50 font-mono text-xs focus:bg-white"
                />
              </div>

              {/* Semester Type */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="semesterType" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Semester Term Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="semesterType"
                  {...register('semesterType')}
                  className="w-full text-xs font-mono rounded-lg border border-slate-250 bg-slate-50/50 p-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="SUMMER">Summer</option>
                  <option value="WINTER">Winter</option>
                </select>
                {errors.semesterType && (
                  <span className="text-[10px] text-red-500 font-mono font-bold">{errors.semesterType.message}</span>
                )}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="status" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Operational Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full text-xs font-mono rounded-lg border border-slate-250 bg-slate-50/50 p-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                {errors.status && (
                  <span className="text-[10px] text-red-500 font-mono font-bold">{errors.status.message}</span>
                )}
              </div>
            </div>
          </Card>

          {/* Timelines and Credit Bounds */}
          <Card className="border border-slate-200 shadow-sm bg-white p-6 rounded-2xl">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight mb-5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> Timelines & Credit Boundaries
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="startDate" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Classes Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  id="startDate"
                  {...register('startDate')}
                  error={errors.startDate?.message}
                  className="bg-slate-50/50 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="endDate" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Classes End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  id="endDate"
                  {...register('endDate')}
                  error={errors.endDate?.message}
                  className="bg-slate-50/50 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Registration Start Date */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="registrationStartDate" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Course Enrollment Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  id="registrationStartDate"
                  {...register('registrationStartDate')}
                  error={errors.registrationStartDate?.message}
                  className="bg-slate-50/50 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Registration End Date */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="registrationEndDate" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Course Enrollment End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  id="registrationEndDate"
                  {...register('registrationEndDate')}
                  error={errors.registrationEndDate?.message}
                  className="bg-slate-50/50 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Min Credit Hours */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="minCreditHours" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Minimum Credit Bounds <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  id="minCreditHours"
                  placeholder="e.g. 1"
                  {...register('minCreditHours', { valueAsNumber: true })}
                  error={errors.minCreditHours?.message}
                  className="bg-slate-50/50 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Max Credit Hours */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="maxCreditHours" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                  Maximum Credit Bounds <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  id="maxCreditHours"
                  placeholder="e.g. 18"
                  {...register('maxCreditHours', { valueAsNumber: true })}
                  error={errors.maxCreditHours?.message}
                  className="bg-slate-50/50 focus:bg-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 mt-5">
              <label htmlFor="description" className="text-xs font-mono font-bold text-slate-700 uppercase tracking-tight">
                Semester Description / Special Directives
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Write specific guidelines, key dates, or tuition fee structures..."
                {...register('description')}
                className="w-full text-xs font-mono rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
              />
              {errors.description && (
                <span className="text-[10px] text-red-500 font-mono font-bold">{errors.description.message}</span>
              )}
            </div>
          </Card>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3.5 pt-2">
            <Link to={ROUTES.SEMESTERS}>
              <Button
                variant="outline"
                type="button"
                className="font-mono text-xs uppercase tracking-wider py-2.5 px-5"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-mono text-xs uppercase tracking-wider py-2.5 px-6"
            >
              {isSubmitting ? 'Saving modifications...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default SemesterEditPage;
