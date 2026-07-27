import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTeacherSchema } from '../../validators/teacher.validators';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  ArrowLeft,
  Save,
  Building,
  GraduationCap,
  Calendar,
  User,
  Briefcase,
  Phone,
  AlertCircle,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Department {
  id: number;
  name: string;
  code: string;
}

export const TeacherEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teacherName, setTeacherName] = useState('');

  // Is user a teacher editing their own profile?
  const isTeacherSelfEdit = user?.role === 'TEACHER';

  // Setup form validation with Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateTeacherSchema),
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

  // Load departments and teacher profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptResponse, teacherResponse] = await Promise.all([
          apiClient.get('/teachers/lookup-options'),
          apiClient.get(`/teachers/${id}`),
        ]);

        if (deptResponse.data?.status === 'success') {
          setDepartments(deptResponse.data.data.departments || []);
        }

        if (teacherResponse.data?.status === 'success') {
          const profile = teacherResponse.data.data;
          setTeacherName(`${profile.user?.firstName || ''} ${profile.user?.lastName || ''}`);

          // Prep dates
          let jDate = '';
          if (profile.joiningDate) {
            jDate = new Date(profile.joiningDate).toISOString().split('T')[0];
          }

          reset({
            userId: profile.userId,
            employeeId: profile.employeeId,
            departmentId: profile.departmentId,
            designation: profile.designation || '',
            employmentType: profile.employmentType,
            qualification: profile.qualification || '',
            specialization: profile.specialization || '',
            experience: profile.experience || 0,
            joiningDate: jDate as any,
            officeLocation: profile.officeLocation || '',
            officePhone: profile.officePhone || '',
            profilePhoto: profile.profilePhoto || '',
            cnic: profile.cnic || '',
            emergencyContact: profile.emergencyContact || '',
            biography: profile.biography || '',
            status: profile.status,
          });
        }
      } catch (err) {
        console.error('[TeacherEdit] Fetch data error:', err);
        toast.error('Failed to load teacher profile details');
        navigate(ROUTES.TEACHERS);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id, reset, navigate]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Clean up values: convert numbers or empty strings to appropriate forms
      const payload: any = {
        experience: data.experience ? Number(data.experience) : null,
        designation: data.designation || null,
        qualification: data.qualification || null,
        specialization: data.specialization || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : null,
        officeLocation: data.officeLocation || null,
        officePhone: data.officePhone || null,
        profilePhoto: data.profilePhoto || null,
        emergencyContact: data.emergencyContact || null,
        biography: data.biography || null,
      };

      // Only include administrative fields if user is Super Admin or Admin
      if (!isTeacherSelfEdit) {
        payload.departmentId = Number(data.departmentId);
        payload.employmentType = data.employmentType;
        payload.status = data.status;
        payload.cnic = data.cnic || null;
      }

      const response = await apiClient.put(`/teachers/${id}`, payload);
      if (response.data?.status === 'success') {
        toast.success('Teacher profile updated successfully!');
        if (isTeacherSelfEdit) {
          navigate(`/teachers/${id}`);
        } else {
          navigate(ROUTES.TEACHERS);
        }
      }
    } catch (err: any) {
      console.error('[TeacherEdit] Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to update teacher profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <PageContainer title="Edit Teacher Profile">
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Retrieving profile...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Edit Profile: ${teacherName}`}
      description={
        isTeacherSelfEdit
          ? 'Update your personal details, biography, research interests, and office metadata.'
          : 'Modify institutional, HR, or status options for this faculty member.'
      }
    >
      <div className="mb-4">
        <Link
          to={isTeacherSelfEdit ? `/teachers/${id}` : ROUTES.TEACHERS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {isTeacherSelfEdit ? 'Profile' : 'Directory'}</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl" id="edit-teacher-form">
        {isTeacherSelfEdit && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-xs flex items-start gap-2" id="teacher-warning">
            <Lock className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-semibold">Personal Access Mode</span>: As a teacher, institutional parameters (such as Department, Designation, Employee ID, and Status) are locked for security. To modify those fields, please contact the Academic Registrar or your system administrator.
            </div>
          </div>
        )}

        {/* Account & Core Credentials */}
        <Card className="p-6 border border-gray-100 shadow-sm relative">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <User className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Account & Core Credentials</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee ID (Always Locked on Edit) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="employeeId">
                Employee ID <span className="text-xs text-gray-400 font-normal">(Immutable)</span>
              </label>
              <div className="relative">
                <input
                  id="employeeId"
                  type="text"
                  disabled
                  className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
                  {...register('employeeId')}
                />
                <Lock className="w-3.5 h-3.5 absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="departmentId">
                Department {isTeacherSelfEdit && <span className="text-xs text-gray-400 font-normal">(Locked)</span>}
              </label>
              <div className="relative">
                <select
                  id="departmentId"
                  disabled={isTeacherSelfEdit}
                  className={`w-full text-xs py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isTeacherSelfEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  {...register('departmentId')}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {isTeacherSelfEdit && <Lock className="w-3.5 h-3.5 absolute right-6 top-2.5 text-gray-400" />}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="status">
                Profile Status {isTeacherSelfEdit && <span className="text-xs text-gray-400 font-normal">(Locked)</span>}
              </label>
              <div className="relative">
                <select
                  id="status"
                  disabled={isTeacherSelfEdit}
                  className={`w-full text-xs py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isTeacherSelfEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  {...register('status')}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Retired">Retired</option>
                  <option value="Suspended">Suspended</option>
                </select>
                {isTeacherSelfEdit && <Lock className="w-3.5 h-3.5 absolute right-6 top-2.5 text-gray-400" />}
              </div>
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
                Designation {isTeacherSelfEdit && <span className="text-xs text-gray-400 font-normal">(Locked)</span>}
              </label>
              <div className="relative">
                <input
                  id="designation"
                  type="text"
                  disabled={isTeacherSelfEdit}
                  placeholder="e.g. Associate Professor, Lecturer"
                  className={`w-full text-xs py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isTeacherSelfEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  {...register('designation')}
                />
                {isTeacherSelfEdit && <Lock className="w-3.5 h-3.5 absolute right-3 top-2.5 text-gray-400" />}
              </div>
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="employmentType">
                Employment Type {isTeacherSelfEdit && <span className="text-xs text-gray-400 font-normal">(Locked)</span>}
              </label>
              <div className="relative">
                <select
                  id="employmentType"
                  disabled={isTeacherSelfEdit}
                  className={`w-full text-xs py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isTeacherSelfEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  {...register('employmentType')}
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Visiting">Visiting</option>
                </select>
                {isTeacherSelfEdit && <Lock className="w-3.5 h-3.5 absolute right-6 top-2.5 text-gray-400" />}
              </div>
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
                placeholder="e.g. Natural Language Processing"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('specialization')}
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="experience">
                Experience (Years) {isTeacherSelfEdit && <span className="text-xs text-gray-400 font-normal">(Locked)</span>}
              </label>
              <div className="relative">
                <input
                  id="experience"
                  type="number"
                  disabled={isTeacherSelfEdit}
                  placeholder="In Years"
                  className={`w-full text-xs py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isTeacherSelfEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  {...register('experience')}
                />
                {isTeacherSelfEdit && <Lock className="w-3.5 h-3.5 absolute right-3 top-2.5 text-gray-400" />}
              </div>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="joiningDate">
                Joining Date {isTeacherSelfEdit && <span className="text-xs text-gray-400 font-normal">(Locked)</span>}
              </label>
              <div className="relative">
                <input
                  id="joiningDate"
                  type="date"
                  disabled={isTeacherSelfEdit}
                  className={`w-full text-xs py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isTeacherSelfEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  {...register('joiningDate')}
                />
                {isTeacherSelfEdit && <Lock className="w-3.5 h-3.5 absolute right-3 top-2.5 text-gray-400" />}
              </div>
            </div>
          </div>
        </Card>

        {/* Office & Contact details */}
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
            </div>

            {/* CNIC / National ID */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="cnic">
                National ID / CNIC {isTeacherSelfEdit && <span className="text-xs text-gray-400 font-normal">(Locked)</span>}
              </label>
              <div className="relative">
                <input
                  id="cnic"
                  type="text"
                  disabled={isTeacherSelfEdit}
                  placeholder="e.g. 42101-1234567-1"
                  className={`w-full text-xs py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isTeacherSelfEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  {...register('cnic')}
                />
                {isTeacherSelfEdit && <Lock className="w-3.5 h-3.5 absolute right-3 top-2.5 text-gray-400" />}
              </div>
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
            </div>

            {/* Profile Photo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="profilePhoto">
                Profile Photo URL
              </label>
              <input
                id="profilePhoto"
                type="text"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('profilePhoto')}
              />
            </div>

            {/* Biography */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="biography">
                Biography / Research Statement
              </label>
              <textarea
                id="biography"
                rows={4}
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                {...register('biography')}
              />
            </div>
          </div>
        </Card>

        {/* Actions Row */}
        <div className="flex justify-end gap-3 pt-2">
          <Link to={isTeacherSelfEdit ? `/teachers/${id}` : ROUTES.TEACHERS} id="btn-cancel">
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
            <span>Update Profile</span>
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default TeacherEditPage;
