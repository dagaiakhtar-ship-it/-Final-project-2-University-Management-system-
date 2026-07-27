import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSubjectSchema } from '../../validators/subject.validators';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import {
  ArrowLeft,
  Save,
  Building,
  GraduationCap,
  Calendar,
  BookOpen,
  BookMarked,
  Layers,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
  departmentId: number;
}

interface Semester {
  id: number;
  name: string;
  code: string;
  programId: number;
}

interface PrereqSubject {
  id: number;
  uuid: string;
  name: string;
  code: string;
}

export const SubjectEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Subject UUID

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Dropdown lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [prereqs, setPrereqs] = useState<PrereqSubject[]>([]);

  // Filtered dropdowns
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateSubjectSchema),
  });

  // Watch hours for credit-hours auto-calculation
  const watchedTheoryHours = Number(watch('theoryHours') || 0);
  const watchedLabHours = Number(watch('labHours') || 0);
  const watchedCreditHours = Number(watch('creditHours') || 0);

  // Calculate credits automatically
  useEffect(() => {
    setValue('creditHours', watchedTheoryHours + watchedLabHours);
  }, [watchedTheoryHours, watchedLabHours, setValue]);

  // Load Metadata and Subject details
  useEffect(() => {
    const initializePage = async () => {
      setFetching(true);
      try {
        const [deptRes, progRes, semRes, prereqRes, subjectRes] = await Promise.all([
          apiClient.get('/departments?limit=100'),
          apiClient.get('/programs?limit=100'),
          apiClient.get('/semesters?limit=100'),
          apiClient.get('/subjects/prerequisites'),
          apiClient.get(`/subjects/${id}`),
        ]);

        let deptsList: Department[] = [];
        let progsList: Program[] = [];
        let semsList: Semester[] = [];

        if (deptRes.data?.status === 'success') {
          deptsList = Array.isArray(deptRes.data.data)
            ? deptRes.data.data
            : deptRes.data.data?.departments || [];
          setDepartments(deptsList);
        }
        if (progRes.data?.status === 'success') {
          progsList = Array.isArray(progRes.data.data)
            ? progRes.data.data
            : progRes.data.data?.programs || [];
          setPrograms(progsList);
        }
        if (semRes.data?.status === 'success') {
          semsList = Array.isArray(semRes.data.data)
            ? semRes.data.data
            : semRes.data.data?.semesters || [];
          setSemesters(semsList);
        }
        if (prereqRes.data?.status === 'success') {
          setPrereqs(prereqRes.data.data);
        }

        if (subjectRes.data?.status === 'success') {
          const sub = subjectRes.data.data;
          
          // Pre-populate Form Fields
          reset({
            code: sub.code,
            name: sub.name,
            shortName: sub.shortName || '',
            departmentId: sub.departmentId,
            programId: sub.programId,
            semesterId: sub.semesterId,
            creditHours: sub.creditHours,
            theoryHours: sub.theoryHours,
            labHours: sub.labHours,
            subjectType: sub.subjectType,
            category: sub.category,
            prerequisiteId: sub.prerequisiteId || '',
            description: sub.description || '',
            status: sub.status,
          });

          // Set dependent dropdown lists
          setFilteredPrograms(progsList.filter(p => p.departmentId === sub.departmentId));
          setFilteredSemesters(semsList.filter(s => s.programId === sub.programId));
        }
      } catch (err: any) {
        console.error('Initialization of subject edit page failed:', err);
        toast.error('Could not load subject details or metadata configuration.');
        navigate(ROUTES.SUBJECTS);
      } finally {
        setFetching(false);
      }
    };
    initializePage();
  }, [id, reset, navigate]);

  // Dropdown manual handlers to prevent layout race conditions
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setValue('departmentId', val);
    setValue('programId', 0);
    setValue('semesterId', 0);
    if (val > 0) {
      setFilteredPrograms(programs.filter(p => p.departmentId === val));
    } else {
      setFilteredPrograms([]);
    }
    setFilteredSemesters([]);
  };

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setValue('programId', val);
    setValue('semesterId', 0);
    if (val > 0) {
      setFilteredSemesters(semesters.filter(s => s.programId === val));
    } else {
      setFilteredSemesters([]);
    }
  };

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        departmentId: Number(values.departmentId),
        programId: Number(values.programId),
        semesterId: Number(values.semesterId),
        creditHours: Number(values.creditHours),
        theoryHours: Number(values.theoryHours),
        labHours: Number(values.labHours),
        prerequisiteId: values.prerequisiteId ? Number(values.prerequisiteId) : null,
        shortName: values.shortName || null,
        description: values.description || null,
      };

      const res = await apiClient.put(`/subjects/${id}`, payload);
      if (res.data?.status === 'success') {
        toast.success('Subject details updated successfully!');
        navigate(ROUTES.SUBJECTS);
      }
    } catch (err: any) {
      console.error('Update subject failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update subject records. Verify your fields.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw className="animate-spin text-indigo-600 w-10 h-10" />
          <span className="mt-4 text-xs font-mono text-slate-400 uppercase tracking-widest">
            Loading subject details...
          </span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header and Back navigation */}
      <div className="mb-6">
        <Link
          to={ROUTES.SUBJECTS}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Subjects</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mt-2">Edit Subject details</h1>
        <p className="text-sm text-gray-500 mt-1">
          Modify credentials, descriptions, and structural dependencies for this subject.
        </p>
      </div>

      <form id="edit-subject-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <Card id="subject-basic-card" className="p-6 space-y-5">
              <h2 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-500" />
                <span>Subject Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-subject-code"
                    type="text"
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors uppercase ${
                      errors.code ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    {...register('code')}
                  />
                  {errors.code && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.code.message}</span>
                  )}
                </div>

                {/* Subject Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-subject-name"
                    type="text"
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    {...register('name')}
                  />
                  {errors.name && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>
                  )}
                </div>

                {/* Short Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Name (Abbreviation)
                  </label>
                  <input
                    id="input-subject-short-name"
                    type="text"
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('shortName')}
                  />
                  {errors.shortName && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.shortName.message}</span>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="select-subject-category"
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    {...register('category')}
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="General">General</option>
                  </select>
                  {errors.category && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.category.message}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="textarea-subject-description"
                  rows={4}
                  className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('description')}
                />
                {errors.description && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>
                )}
              </div>
            </Card>

            <Card id="subject-hours-card" className="p-6 space-y-5">
              <h2 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>Credit & Hour Allocations</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Subject Type */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="select-subject-type"
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    {...register('subjectType')}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                  {errors.subjectType && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.subjectType.message}</span>
                  )}
                </div>

                {/* Theory Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theory Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-theory-hours"
                    type="number"
                    min="0"
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('theoryHours', { valueAsNumber: true })}
                  />
                  {errors.theoryHours && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.theoryHours.message}</span>
                  )}
                </div>

                {/* Lab Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-lab-hours"
                    type="number"
                    min="0"
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('labHours', { valueAsNumber: true })}
                  />
                  {errors.labHours && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.labHours.message}</span>
                  )}
                </div>

                {/* Credit Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Credits <span className="text-indigo-500">(Auto-calculated)</span>
                  </label>
                  <input
                    id="input-credit-hours"
                    type="number"
                    readOnly
                    className="w-full py-2 px-3 border border-gray-100 bg-gray-50 rounded-lg text-sm font-semibold text-indigo-700 outline-none"
                    value={watchedCreditHours}
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Calculated: {watchedTheoryHours}T + {watchedLabHours}L
                  </span>
                </div>
              </div>

              {errors.creditHours && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-2.5">
                  <span className="text-xs text-red-600 font-medium">
                    {errors.creditHours.message}
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar configuration card */}
          <div className="space-y-6">
            <Card id="subject-academic-card" className="p-6 space-y-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
                Placement & Structure
              </h3>

              {/* Department Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>Department</span> <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-dept"
                  className={`w-full py-2 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.departmentId ? 'border-red-500' : 'border-gray-200'
                  }`}
                  {...register('departmentId')}
                  onChange={handleDepartmentChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.departmentId.message}</span>
                )}
              </div>

              {/* Program Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>Program</span> <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-program"
                  className={`w-full py-2 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.programId ? 'border-red-500' : 'border-gray-200'
                  }`}
                  {...register('programId')}
                  onChange={handleProgramChange}
                >
                  <option value="">Select Program</option>
                  {filteredPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.programId.message}</span>
                )}
              </div>

              {/* Semester Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Semester</span> <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-semester"
                  className={`w-full py-2 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.semesterId ? 'border-red-500' : 'border-gray-200'
                  }`}
                  {...register('semesterId')}
                >
                  <option value="">Select Semester</option>
                  {filteredSemesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.semesterId && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.semesterId.message}</span>
                )}
              </div>

              {/* Prerequisite Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span>Prerequisite Subject</span>
                </label>
                <select
                  id="select-prereq"
                  className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('prerequisiteId')}
                >
                  <option value="">None (No Prerequisite)</option>
                  {prereqs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                {errors.prerequisiteId && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.prerequisiteId.message}</span>
                )}
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="select-status"
                  className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('status')}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                {errors.status && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.status.message}</span>
                )}
              </div>
            </Card>

            {/* Save Card */}
            <Card id="subject-actions-card" className="p-4 flex items-center justify-end gap-3">
              <Link to={ROUTES.SUBJECTS}>
                <Button id="btn-cancel-edit" variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                id="btn-save-subject"
                type="submit"
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </PageContainer>
  );
};
