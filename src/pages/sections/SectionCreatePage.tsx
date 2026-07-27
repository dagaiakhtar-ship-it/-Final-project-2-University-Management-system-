import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSectionSchema } from '../../validators/section.validators';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import {
  Users,
  ArrowLeft,
  Save,
  Clock,
  ShieldAlert,
  HelpCircle,
  Building,
  GraduationCap,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Teacher {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Semester {
  id: number;
  name: string;
  code: string;
  program: {
    id: number;
    name: string;
    code: string;
    department: {
      id: number;
      name: string;
      code: string;
    };
  };
  academicYear: {
    id: number;
    name: string;
  };
}

export const SectionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Metadata options
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);

  // Zod form binding
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createSectionSchema),
    defaultValues: {
      code: '',
      name: '',
      semesterId: 0,
      classAdvisorId: null as number | null,
      capacity: 60,
      currentStrength: 0,
      shift: 'MORNING' as 'MORNING' | 'EVENING',
      status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
      description: '',
    },
  });

  const watchedSemesterId = watch('semesterId');
  const watchedCapacity = Number(watch('capacity') || 0);
  const watchedStrength = Number(watch('currentStrength') || 0);

  // Load configuration options
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [semRes, teachRes] = await Promise.all([
          apiClient.get('/semesters'),
          apiClient.get('/sections/teachers'),
        ]);

        if (semRes.data?.status === 'success') {
          setSemesters(semRes.data.data.semesters || []);
        }
        if (teachRes.data?.status === 'success') {
          setTeachers(teachRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load metadata dropdown options:', err);
        toast.error('Failed to load necessary form configurations (Semesters, Teachers)');
      }
    };
    loadMetadata();
  }, []);

  // Update selected semester derived info
  useEffect(() => {
    if (watchedSemesterId) {
      const found = semesters.find((s) => s.id === Number(watchedSemesterId));
      if (found) {
        setSelectedSemester(found);
        // Sync derived program/department values implicitly in backend as well
      } else {
        setSelectedSemester(null);
      }
    } else {
      setSelectedSemester(null);
    }
  }, [watchedSemesterId, semesters]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Parse numbers appropriately
      const payload = {
        ...values,
        semesterId: Number(values.semesterId),
        classAdvisorId: values.classAdvisorId ? Number(values.classAdvisorId) : null,
        capacity: Number(values.capacity),
        currentStrength: Number(values.currentStrength),
      };

      const response = await apiClient.post('/sections', payload);
      if (response.data?.status === 'success') {
        toast.success('Class section created successfully!');
        navigate(ROUTES.SECTIONS);
      }
    } catch (err: any) {
      console.error('Section creation error:', err);
      toast.error(err.response?.data?.message || 'Failed to create section. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3" id="section-create-header">
        <Link to={ROUTES.SECTIONS}>
          <Button variant="outline" size="sm" className="p-2 border-slate-200">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            Create Class Section
          </h1>
          <p className="text-xs text-slate-500">
            Establish a physical class division, map an advisor, and set the capacity bounds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form section */}
        <div className="lg:col-span-2">
          <Card className="p-6 border border-slate-200 bg-white shadow-xs rounded-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="create-section-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Semester dropdown select */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Parent Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('semesterId', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    <option value="">Select a Semester...</option>
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.name} ({sem.code})
                      </option>
                    ))}
                  </select>
                  {errors.semesterId && (
                    <span className="text-[10px] text-red-500 font-medium mt-1">{errors.semesterId.message}</span>
                  )}
                </div>

                {/* Section Code */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Section Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BSCS-1A, SEC-B"
                    {...register('code')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  {errors.code && (
                    <span className="text-[10px] text-red-500 font-medium mt-1">{errors.code.message}</span>
                  )}
                </div>

                {/* Section Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Section Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section A, Evening Group"
                    {...register('name')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  {errors.name && (
                    <span className="text-[10px] text-red-500 font-medium mt-1">{errors.name.message}</span>
                  )}
                </div>

                {/* Class Advisor */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Class Advisor (Teacher)
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue('classAdvisorId', val ? Number(val) : null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    <option value="">No Advisor Assigned</option>
                    {teachers.map((teach) => (
                      <option key={teach.id} value={teach.id}>
                        {teach.user.firstName} {teach.user.lastName} ({teach.user.email})
                      </option>
                    ))}
                  </select>
                  {errors.classAdvisorId && (
                    <span className="text-[10px] text-red-500 font-medium mt-1">{errors.classAdvisorId.message}</span>
                  )}
                </div>

                {/* Capacity */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Maximum Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('capacity', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  {errors.capacity && (
                    <span className="text-[10px] text-red-500 font-medium mt-1">{errors.capacity.message}</span>
                  )}
                </div>

                {/* Current Strength */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Current Student Strength
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('currentStrength', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  {errors.currentStrength && (
                    <span className="text-[10px] text-red-500 font-medium mt-1">{errors.currentStrength.message}</span>
                  )}
                </div>

                {/* Shift */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Shift Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('shift')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                  </select>
                  {errors.shift && (
                    <span className="text-[10px] text-red-500 font-medium mt-1">{errors.shift.message}</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Section Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('status')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  {errors.status && (
                    <span className="text-[10px] text-red-500 font-medium mt-1">{errors.status.message}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Description / Remarks
                </label>
                <textarea
                  placeholder="Provide any additional notes or details on this division group..."
                  rows={4}
                  {...register('description')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                ></textarea>
                {errors.description && (
                  <span className="text-[10px] text-red-500 font-medium mt-1">{errors.description.message}</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Link to={ROUTES.SECTIONS}>
                  <Button variant="outline" size="sm" type="button" className="font-mono text-xs uppercase tracking-wider">
                    Cancel
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={loading}
                  className="font-mono text-xs uppercase tracking-wider py-2 px-4 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Class Section'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Dynamic Context Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 border border-slate-200 bg-indigo-50/20 shadow-xs rounded-2xl">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
              Derived Context
            </h3>

            {selectedSemester ? (
              <div className="space-y-4 text-xs">
                {/* Department Info */}
                <div className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-100">
                  <Building className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      Department
                    </span>
                    <span className="font-semibold text-slate-800">{selectedSemester.program.department.name}</span>
                    <span className="block font-mono text-[10px] text-slate-400 uppercase mt-0.5">
                      Code: {selectedSemester.program.department.code}
                    </span>
                  </div>
                </div>

                {/* Program Info */}
                <div className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-100">
                  <GraduationCap className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      Program
                    </span>
                    <span className="font-semibold text-slate-800">{selectedSemester.program.name}</span>
                    <span className="block font-mono text-[10px] text-slate-400 uppercase mt-0.5">
                      Code: {selectedSemester.program.code}
                    </span>
                  </div>
                </div>

                {/* Academic Year Info */}
                <div className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-100">
                  <Calendar className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      Academic Year
                    </span>
                    <span className="font-semibold text-slate-800">{selectedSemester.academicYear.name}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-[11px] text-slate-400 max-w-[180px] leading-relaxed">
                  Select a Semester to automatically resolve the Department and Program structures.
                </p>
              </div>
            )}
          </Card>

          {/* Warning Checks Card */}
          {watchedStrength > watchedCapacity && (
            <Card className="p-4 border border-red-200 bg-red-50/50 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-800">Capacity Exceeded</h4>
                <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                  Current student strength ({watchedStrength}) must not exceed the specified section capacity limit ({watchedCapacity}). This will cause a database constraint error on submit.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SectionCreatePage;
