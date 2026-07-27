import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSubjectSchema } from '../../validators/subject.validators';
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
  HelpCircle,
  FileText
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

export const SubjectCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Dropdown option lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [prereqs, setPrereqs] = useState<PrereqSubject[]>([]);

  // Filtered lists for dependent dropdowns
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>([]);

  // Setup form validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      code: '',
      name: '',
      shortName: '',
      departmentId: 0,
      programId: 0,
      semesterId: 0,
      creditHours: 3,
      theoryHours: 3,
      labHours: 0,
      subjectType: 'Theory' as 'Theory' | 'Lab' | 'Mixed',
      category: 'Core' as 'Core' | 'Elective' | 'General',
      prerequisiteId: null as number | null,
      description: '',
      status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    },
  });

  // Watch fields for dependent changes & dynamic checks
  const watchedDeptId = Number(watch('departmentId') || 0);
  const watchedProgId = Number(watch('programId') || 0);
  const watchedTheoryHours = Number(watch('theoryHours') || 0);
  const watchedLabHours = Number(watch('labHours') || 0);
  const watchedCreditHours = Number(watch('creditHours') || 0);

  // Load dropdown lists from APIs
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [deptRes, progRes, semRes, prereqRes] = await Promise.all([
          apiClient.get('/departments?limit=100'),
          apiClient.get('/programs?limit=100'),
          apiClient.get('/semesters?limit=100'),
          apiClient.get('/subjects/prerequisites'),
        ]);

        if (deptRes.data?.status === 'success') {
          const depts = Array.isArray(deptRes.data.data)
            ? deptRes.data.data
            : deptRes.data.data?.departments || [];
          setDepartments(depts);
        }
        if (progRes.data?.status === 'success') {
          const progs = Array.isArray(progRes.data.data)
            ? progRes.data.data
            : progRes.data.data?.programs || [];
          setPrograms(progs);
        }
        if (semRes.data?.status === 'success') {
          const sems = Array.isArray(semRes.data.data)
            ? semRes.data.data
            : semRes.data.data?.semesters || [];
          setSemesters(sems);
        }
        if (prereqRes.data?.status === 'success') {
          setPrereqs(prereqRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load metadata dropdowns:', err);
        toast.error('Failed to load form setup selections.');
      }
    };
    loadMetadata();
  }, []);

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

  // Dynamic automatic calculation of credit hours: Theory + Lab = Credit hours
  useEffect(() => {
    setValue('creditHours', watchedTheoryHours + watchedLabHours);
  }, [watchedTheoryHours, watchedLabHours, setValue]);

  // Handle form submission
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

      const res = await apiClient.post('/subjects', payload);
      if (res.data?.status === 'success') {
        toast.success('Subject created successfully!');
        navigate(ROUTES.SUBJECTS);
      }
    } catch (err: any) {
      console.error('Create subject failed:', err);
      toast.error(err.response?.data?.message || 'Failed to create subject. Please verify your fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          to={ROUTES.SUBJECTS}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Subjects</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mt-2">Create New Subject</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add a brand-new academic subject to the curriculum catalog.
        </p>
      </div>

      <form id="create-subject-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main settings card */}
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
                    placeholder="e.g., CS-301"
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
                    placeholder="e.g., Data Structures"
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
                    placeholder="e.g., DSA"
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-200`}
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
                  placeholder="Provide a summary of the subject contents, syllabus highlights, or learning objectives..."
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

              {/* Program Dropdown (Dependent) */}
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

              {/* Semester Dropdown (Dependent) */}
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

            {/* Actions card */}
            <Card id="subject-actions-card" className="p-4 flex items-center justify-end gap-3">
              <Link to={ROUTES.SUBJECTS}>
                <Button id="btn-cancel-create" variant="outline" type="button">
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
                <span>{loading ? 'Creating...' : 'Save Subject'}</span>
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </PageContainer>
  );
};
