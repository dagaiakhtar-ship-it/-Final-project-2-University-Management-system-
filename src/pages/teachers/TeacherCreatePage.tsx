import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTeacherSchema } from '../../validators/teacher.validators';
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
  User,
  Briefcase,
  Phone,
  BookOpen,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LookupOptions {
  departments: Array<{ id: number; name: string; code: string }>;
  eligibleUsers: Array<{ id: number; uuid: string; email: string; firstName: string; lastName: string }>;
}

export const TeacherCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lookups, setLookups] = useState<LookupOptions>({
    departments: [],
    eligibleUsers: [],
  });

  // Setup form validation with Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      userId: 0,
      employeeId: '',
      departmentId: 0,
      designation: '',
      employmentType: 'Permanent' as 'Permanent' | 'Contract' | 'Visiting',
      qualification: '',
      specialization: '',
      experience: 0,
      joiningDate: '',
      officeLocation: '',
      officePhone: '',
      profilePhoto: '',
      cnic: '',
      emergencyContact: '',
      biography: '',
      status: 'Active' as 'Active' | 'On Leave' | 'Retired' | 'Suspended',
    },
  });

  // Load Lookups on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const response = await apiClient.get('/teachers/lookup-options');
        if (response.data?.status === 'success') {
          setLookups(response.data.data);
        }
      } catch (err) {
        console.error('[TeacherCreate] Fetch lookup error:', err);
        toast.error('Failed to load user and department options');
      }
    };
    fetchLookups();
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Clean up values: convert numbers or empty strings to appropriate forms
      const payload = {
        ...data,
        userId: Number(data.userId),
        departmentId: Number(data.departmentId),
        experience: data.experience ? Number(data.experience) : null,
        designation: data.designation || null,
        qualification: data.qualification || null,
        specialization: data.specialization || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : null,
        officeLocation: data.officeLocation || null,
        officePhone: data.officePhone || null,
        profilePhoto: data.profilePhoto || null,
        cnic: data.cnic || null,
        emergencyContact: data.emergencyContact || null,
        biography: data.biography || null,
      };

      const response = await apiClient.post('/teachers', payload);
      if (response.data?.status === 'success') {
        toast.success('Teacher profile created successfully!');
        navigate(ROUTES.TEACHERS);
      }
    } catch (err: any) {
      console.error('[TeacherCreate] Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to create teacher profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Create Teacher Profile"
      description="Register a new academic faculty member and configure their institutional details."
    >
      <div className="mb-4">
        <Link to={ROUTES.TEACHERS} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl" id="create-teacher-form">
        {/* Step Header / Core Information */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <User className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Account & Core Credentials</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Assignment */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="userId">
                Assign User (with Teacher Role) <span className="text-rose-500">*</span>
              </label>
              <select
                id="userId"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('userId')}
              >
                <option value="">-- Select a User Account --</option>
                {lookups.eligibleUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.userId.message as string}</span>
                </p>
              )}
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="employeeId">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                id="employeeId"
                type="text"
                placeholder="e.g. EMP-2026-042"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('employeeId')}
              />
              {errors.employeeId && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.employeeId.message as string}</span>
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="departmentId">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="departmentId"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('departmentId')}
              >
                <option value="">-- Select a Department --</option>
                {lookups.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.departmentId.message as string}</span>
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="status">
                Initial Profile Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="status"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('status')}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Retired">Retired</option>
                <option value="Suspended">Suspended</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.status.message as string}</span>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* HR & Faculty Specifications */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <Briefcase className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Employment & academic info</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Designation */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="designation">
                Designation
              </label>
              <input
                id="designation"
                type="text"
                placeholder="e.g. Associate Professor, Lecturer"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('designation')}
              />
              {errors.designation && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.designation.message as string}</span>
                </p>
              )}
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="employmentType">
                Employment Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="employmentType"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('employmentType')}
              >
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Visiting">Visiting</option>
              </select>
              {errors.employmentType && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.employmentType.message as string}</span>
                </p>
              )}
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="qualification">
                Qualification
              </label>
              <input
                id="qualification"
                type="text"
                placeholder="e.g. PhD in Computer Science"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('qualification')}
              />
              {errors.qualification && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.qualification.message as string}</span>
                </p>
              )}
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="specialization">
                Specialization / Research Area
              </label>
              <input
                id="specialization"
                type="text"
                placeholder="e.g. Natural Language Processing, Cryptography"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('specialization')}
              />
              {errors.specialization && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.specialization.message as string}</span>
                </p>
              )}
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="experience">
                Experience (Years)
              </label>
              <input
                id="experience"
                type="number"
                placeholder="In Years"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('experience')}
              />
              {errors.experience && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.experience.message as string}</span>
                </p>
              )}
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="joiningDate">
                Joining Date
              </label>
              <input
                id="joiningDate"
                type="date"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('joiningDate')}
              />
              {errors.joiningDate && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.joiningDate.message as string}</span>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Office & Identity details */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <Phone className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Office & Contact Metadata</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Office Location */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="officeLocation">
                Office Location / Room No.
              </label>
              <input
                id="officeLocation"
                type="text"
                placeholder="e.g. Block C, Room 304"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('officeLocation')}
              />
              {errors.officeLocation && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.officeLocation.message as string}</span>
                </p>
              )}
            </div>

            {/* Office Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="officePhone">
                Office Phone Extension
              </label>
              <input
                id="officePhone"
                type="text"
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('officePhone')}
              />
              {errors.officePhone && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.officePhone.message as string}</span>
                </p>
              )}
            </div>

            {/* CNIC / National ID */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="cnic">
                National ID / CNIC (Encrypted)
              </label>
              <input
                id="cnic"
                type="text"
                placeholder="e.g. 42101-1234567-1"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('cnic')}
              />
              {errors.cnic && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.cnic.message as string}</span>
                </p>
              )}
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="emergencyContact">
                Emergency Contact Number
              </label>
              <input
                id="emergencyContact"
                type="text"
                placeholder="e.g. Jane Doe (+1 555-0100)"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('emergencyContact')}
              />
              {errors.emergencyContact && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.emergencyContact.message as string}</span>
                </p>
              )}
            </div>

            {/* Profile Photo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="profilePhoto">
                Profile Photo URL
              </label>
              <input
                id="profilePhoto"
                type="text"
                placeholder="e.g. https://images.unsplash.com/... or cloud storage URL"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('profilePhoto')}
              />
              {errors.profilePhoto && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.profilePhoto.message as string}</span>
                </p>
              )}
            </div>

            {/* Biography */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="biography">
                Biography / Research Statement
              </label>
              <textarea
                id="biography"
                rows={4}
                placeholder="Brief introduction of research interests, educational history, teaching philosophy, and accomplishments."
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                {...register('biography')}
              />
              {errors.biography && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.biography.message as string}</span>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Actions Row */}
        <div className="flex justify-end gap-3 pt-2">
          <Link to={ROUTES.TEACHERS} id="btn-cancel">
            <Button variant="outline" type="button" className="border-gray-200 text-gray-700 px-4 py-2 text-xs">
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            id="btn-save-teacher"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs flex items-center gap-1.5 font-medium"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Profile</span>
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default TeacherCreatePage;
