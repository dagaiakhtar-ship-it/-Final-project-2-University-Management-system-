import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateStudentSchema } from '../../validators/student.validators';
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
  Phone,
  BookOpen,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  CreditCard,
  Briefcase,
  HeartPulse,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LookupOptions {
  departments: Array<{ id: number; name: string; code: string }>;
  programs: Array<{ id: number; name: string; code: string; departmentId: number }>;
  semesters: Array<{ id: number; name: string; programId: number }>;
  sections: Array<{ id: number; name: string; semesterId: number }>;
  academicYears: Array<{ id: number; name: string; status: string }>;
}

export const StudentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [lookups, setLookups] = useState<LookupOptions>({
    departments: [],
    programs: [],
    semesters: [],
    sections: [],
    academicYears: [],
  });

  // Role permissions
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isStudentSelf = user?.role === 'STUDENT';

  // Keep track of current selected IDs for cascading dropdowns
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedProgId, setSelectedProgId] = useState<number | null>(null);
  const [selectedSemId, setSelectedSemId] = useState<number | null>(null);

  // Setup form validation with Zod
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateStudentSchema),
  });

  // Watch fields for cascading triggers
  const watchedDeptId = watch('departmentId');
  const watchedProgId = watch('programId');
  const watchedSemId = watch('semesterId');

  useEffect(() => {
    if (watchedDeptId) {
      setSelectedDeptId(Number(watchedDeptId));
    }
  }, [watchedDeptId]);

  useEffect(() => {
    if (watchedProgId) {
      setSelectedProgId(Number(watchedProgId));
    }
  }, [watchedProgId]);

  useEffect(() => {
    if (watchedSemId) {
      setSelectedSemId(Number(watchedSemId));
    }
  }, [watchedSemId]);

  // Load student profile & lookups on mount
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        // Fetch lookups
        const lookupsResponse = await apiClient.get('/students/lookup-options');
        if (lookupsResponse.data?.status === 'success') {
          setLookups(lookupsResponse.data.data);
        }

        // Fetch existing student profile
        const profileResponse = await apiClient.get(`/students/${id}`);
        if (profileResponse.data?.status === 'success') {
          const s = profileResponse.data.data;
          
          // Double check: If student user, they must be editing their own profile
          if (user?.role === 'STUDENT' && s.userId !== user.id) {
            toast.error('You are not authorized to edit this student profile.');
            navigate(ROUTES.DASHBOARD);
            return;
          }

          // Cascading selections
          setSelectedDeptId(s.departmentId);
          setSelectedProgId(s.programId);
          setSelectedSemId(s.semesterId);

          // Format dates for HTML date input: YYYY-MM-DD
          const formattedAdmissionDate = s.admissionDate ? s.admissionDate.split('T')[0] : '';
          const formattedDob = s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '';

          reset({
            userId: s.userId,
            registrationNumber: s.registrationNumber,
            rollNumber: s.rollNumber,
            idCardNumber: s.idCardNumber || '',
            departmentId: s.departmentId,
            programId: s.programId,
            semesterId: s.semesterId,
            sectionId: s.sectionId || '',
            academicYearId: s.academicYearId,
            admissionSession: s.admissionSession || '',
            admissionDate: formattedAdmissionDate,
            status: s.status,
            enrollmentStatus: s.enrollmentStatus || 'Pending',
            
            fullName: s.fullName || '',
            fatherName: s.fatherName || '',
            motherName: s.motherName || '',
            guardianRelationship: s.guardianRelationship || '',
            dateOfBirth: formattedDob,
            gender: s.gender || '',
            bloodGroup: s.bloodGroup || '',
            nationality: s.nationality || '',
            cnic: s.cnic || '',
            
            email: s.email || '',
            mobileNumber: s.mobileNumber || '',
            emergencyContact: s.emergencyContact || '',
            permanentAddress: s.permanentAddress || '',
            currentAddress: s.currentAddress || '',
            city: s.city || '',
            province: s.province || '',
            country: s.country || '',
            postalCode: s.postalCode || '',
            
            previousInstitution: s.previousInstitution || '',
            previousQualification: s.previousQualification || '',
            previousCgpa: s.previousCgpa || 0,
            admissionMeritNumber: s.admissionMeritNumber || 1,
            
            scholarshipStatus: s.scholarshipStatus || 'None',
            hostelStatus: s.hostelStatus || 'No',
            transportStatus: s.transportStatus || 'No',
            medicalNotes: s.medicalNotes || '',
            studentPhoto: s.studentPhoto || '',
            signatureImage: s.signatureImage || '',
          });
        }
      } catch (err: any) {
        console.error('[StudentEdit] Fetch profile or lookups error:', err);
        toast.error(err.response?.data?.message || 'Failed to load student profile');
        if (user?.role === 'STUDENT') {
          navigate(ROUTES.DASHBOARD);
        } else {
          navigate(ROUTES.STUDENTS);
        }
      } finally {
        setPageLoading(false);
      }
    };
    if (id) {
      loadData();
    }
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload: Record<string, any> = { ...data };

      // Filter payload for Students edit limits
      if (isStudentSelf) {
        // Clear out non-editable academic values to avoid validation or database modifications
        delete payload.userId;
        delete payload.registrationNumber;
        delete payload.rollNumber;
        delete payload.idCardNumber;
        delete payload.departmentId;
        delete payload.programId;
        delete payload.semesterId;
        delete payload.sectionId;
        delete payload.academicYearId;
        delete payload.admissionSession;
        delete payload.admissionDate;
        delete payload.status;
        delete payload.enrollmentStatus;
        delete payload.previousInstitution;
        delete payload.previousQualification;
        delete payload.previousCgpa;
        delete payload.admissionMeritNumber;
      } else {
        // Admin edits: cast numbers correctly
        payload.userId = Number(data.userId);
        payload.departmentId = Number(data.departmentId);
        payload.programId = Number(data.programId);
        payload.semesterId = Number(data.semesterId);
        payload.sectionId = data.sectionId ? Number(data.sectionId) : null;
        payload.academicYearId = Number(data.academicYearId);
        payload.previousCgpa = data.previousCgpa ? Number(data.previousCgpa) : null;
        payload.admissionMeritNumber = data.admissionMeritNumber ? Number(data.admissionMeritNumber) : null;
      }

      // Convert optional strings & dates safely
      if (payload.admissionDate) {
        payload.admissionDate = new Date(payload.admissionDate).toISOString();
      }
      if (payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
      }

      const response = await apiClient.put(`/students/${id}`, payload);
      if (response.data?.status === 'success') {
        toast.success('Student profile updated successfully!');
        if (isStudentSelf) {
          navigate(ROUTES.DASHBOARD);
        } else {
          navigate(ROUTES.STUDENTS);
        }
      }
    } catch (err: any) {
      console.error('[StudentEdit] Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to update student profile');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <PageContainer title="Edit Student Profile">
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <span className="text-sm font-medium text-slate-500">Retrieving academic and profile metadata...</span>
        </div>
      </PageContainer>
    );
  }

  // Filter lists based on selected parent IDs (cascaded)
  const filteredPrograms = selectedDeptId
    ? lookups.programs.filter((p) => p.departmentId === selectedDeptId)
    : lookups.programs;

  const filteredSemesters = selectedProgId
    ? lookups.semesters.filter((s) => s.programId === selectedProgId)
    : lookups.semesters;

  const filteredSections = selectedSemId
    ? lookups.sections.filter((s) => s.semesterId === selectedSemId)
    : lookups.sections;

  return (
    <PageContainer
      title="Edit Student Profile"
      description={
        isStudentSelf
          ? "Update your personal credentials, contact points, and emergency preferences safely."
          : "Modify academic alignments, registrations, and demographic records."
      }
    >
      <div className="mb-4">
        <Link to={isStudentSelf ? ROUTES.DASHBOARD : ROUTES.STUDENTS} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isStudentSelf ? 'Back to Dashboard' : 'Back to Directory'}</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl" id="edit-student-form">
        {/* Section 1: Academic Track (Hidden/Read-only for Students, fully editable for Admin) */}
        <Card className="p-6 border border-gray-100 shadow-sm relative">
          {isStudentSelf && (
            <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[0.5px] rounded-lg z-10 flex items-center justify-center">
              <div className="bg-white border border-slate-100 px-4 py-2 rounded-lg shadow-sm text-xs font-semibold text-slate-500 flex items-center space-x-2">
                <Lock className="h-3.5 w-3.5 text-indigo-500" />
                <span>Academic details are locked. Contact Admin to modify.</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <GraduationCap className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Academic Track & Registration Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="registrationNumber">
                Registration Number
              </label>
              <input
                id="registrationNumber"
                type="text"
                disabled={isStudentSelf}
                {...register('registrationNumber')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="rollNumber">
                Roll Number
              </label>
              <input
                id="rollNumber"
                type="text"
                disabled={isStudentSelf}
                {...register('rollNumber')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            {/* RFID Card Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="idCardNumber">
                RFID / ID Card Number
              </label>
              <input
                id="idCardNumber"
                type="text"
                disabled={isStudentSelf}
                {...register('idCardNumber')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="academicYearId">
                Academic Year
              </label>
              <select
                id="academicYearId"
                disabled={isStudentSelf}
                {...register('academicYearId')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value={0}>-- Select Academic Year --</option>
                {lookups.academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} ({ay.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="status">
                Academic Status
              </label>
              <select
                id="status"
                disabled={isStudentSelf}
                {...register('status')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="GRADUATED">Graduated</option>
                <option value="APPLIED">Applied</option>
                <option value="WITHDRAWN">Withdrawn</option>
                <option value="ALUMNI">Alumni</option>
              </select>
            </div>
          </div>

          {/* Department, Program, Semester, Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-50">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="departmentId">
                Department
              </label>
              <select
                id="departmentId"
                disabled={isStudentSelf}
                {...register('departmentId')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value={0}>-- Select Department --</option>
                {lookups.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="programId">
                Program
              </label>
              <select
                id="programId"
                disabled={isStudentSelf}
                {...register('programId')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value={0}>-- Select Program --</option>
                {filteredPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="semesterId">
                Semester
              </label>
              <select
                id="semesterId"
                disabled={isStudentSelf}
                {...register('semesterId')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value={0}>-- Select Semester --</option>
                {filteredSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="sectionId">
                Section
              </label>
              <select
                id="sectionId"
                disabled={isStudentSelf}
                {...register('sectionId')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Select Section --</option>
                {filteredSections.map((sect) => (
                  <option key={sect.id} value={sect.id}>
                    {sect.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Personal Details & contact info (Editable by both self & admin) */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <User className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Personal & Demographic Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Student's Legal Full Name"
                {...register('fullName')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Father's Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="fatherName">
                Father's Name
              </label>
              <input
                id="fatherName"
                type="text"
                placeholder="Father's Name"
                {...register('fatherName')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Mother's Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="motherName">
                Mother's Name
              </label>
              <input
                id="motherName"
                type="text"
                placeholder="Mother's Name"
                {...register('motherName')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Guardian Relationship */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="guardianRelationship">
                Guardian Relationship
              </label>
              <input
                id="guardianRelationship"
                type="text"
                placeholder="e.g. Father, Uncle"
                {...register('guardianRelationship')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                {...register('gender')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="bloodGroup">
                Blood Group
              </label>
              <select
                id="bloodGroup"
                {...register('bloodGroup')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Select Blood Group --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* CNIC */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cnic">
                CNIC / B-Form Number
              </label>
              <input
                id="cnic"
                type="text"
                placeholder="CNIC Number"
                {...register('cnic')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Contact coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50">
            {/* Contact Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="email">
                Contact Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Personal email"
                {...register('email')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="mobileNumber">
                Mobile Number
              </label>
              <input
                id="mobileNumber"
                type="tel"
                placeholder="Mobile phone"
                {...register('mobileNumber')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="emergencyContact">
                Emergency Contact
              </label>
              <input
                id="emergencyContact"
                type="text"
                placeholder="Emergency Contact"
                {...register('emergencyContact')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="currentAddress">
                Current Address
              </label>
              <textarea
                id="currentAddress"
                rows={2}
                {...register('currentAddress')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="permanentAddress">
                Permanent Address
              </label>
              <textarea
                id="permanentAddress"
                rows={2}
                {...register('permanentAddress')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* City Province Country */}
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city')}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="province">
                  Province
                </label>
                <input
                  id="province"
                  type="text"
                  {...register('province')}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="country">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  {...register('country')}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="postalCode">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  type="text"
                  {...register('postalCode')}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Academic Background (Hidden/Locked for Students) */}
        <Card className="p-6 border border-gray-100 shadow-sm relative">
          {isStudentSelf && (
            <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[0.5px] rounded-lg z-10 flex items-center justify-center">
              <div className="bg-white border border-slate-100 px-4 py-2 rounded-lg shadow-sm text-xs font-semibold text-slate-500 flex items-center space-x-2">
                <Lock className="h-3.5 w-3.5 text-indigo-500" />
                <span>Academic history is locked. Contact Admin to modify.</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Academic History & Merit Metrics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="previousInstitution">
                Previous Institution
              </label>
              <input
                id="previousInstitution"
                type="text"
                placeholder="Previous School/College"
                disabled={isStudentSelf}
                {...register('previousInstitution')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="previousQualification">
                Previous Qualification
              </label>
              <input
                id="previousQualification"
                type="text"
                disabled={isStudentSelf}
                {...register('previousQualification')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="previousCgpa">
                Previous CGPA
              </label>
              <input
                id="previousCgpa"
                type="number"
                step="0.01"
                disabled={isStudentSelf}
                {...register('previousCgpa')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="admissionSession">
                Admission Session
              </label>
              <input
                id="admissionSession"
                type="text"
                disabled={isStudentSelf}
                {...register('admissionSession')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="admissionDate">
                Admission Date
              </label>
              <input
                id="admissionDate"
                type="date"
                disabled={isStudentSelf}
                {...register('admissionDate')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="admissionMeritNumber">
                Admission Merit Number
              </label>
              <input
                id="admissionMeritNumber"
                type="number"
                disabled={isStudentSelf}
                {...register('admissionMeritNumber')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="enrollmentStatus">
                Enrollment Status
              </label>
              <select
                id="enrollmentStatus"
                disabled={isStudentSelf}
                {...register('enrollmentStatus')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="Enrolled">Enrolled</option>
                <option value="Deferred">Deferred</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Section 4: Preferences & Media URLs */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <HeartPulse className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Preferences, Facilities & Media URLs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="scholarshipStatus">
                Scholarship Category
              </label>
              <select
                id="scholarshipStatus"
                {...register('scholarshipStatus')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="None">No Scholarship</option>
                <option value="Need Based">Need Based</option>
                <option value="Merit Based">Merit Based</option>
                <option value="HEC Scholarship">HEC Scholarship</option>
                <option value="Partial Waiver">Partial Waiver</option>
                <option value="Full Waiver">Full Waiver</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="hostelStatus">
                Hostel Boarding
              </label>
              <select
                id="hostelStatus"
                {...register('hostelStatus')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="No">No (Day Scholar)</option>
                <option value="Yes">Yes (Residing)</option>
                <option value="Waitlisted">Waitlisted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="transportStatus">
                Transport Bus Route
              </label>
              <select
                id="transportStatus"
                {...register('transportStatus')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="No">No Transport</option>
                <option value="Yes">Yes (Subscribed)</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="medicalNotes">
                Medical Notes
              </label>
              <textarea
                id="medicalNotes"
                rows={2}
                placeholder="State any specific medical alert if necessary."
                {...register('medicalNotes')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Photo Avatar */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="studentPhoto">
                Student Photo Avatar URL
              </label>
              <input
                id="studentPhoto"
                type="text"
                placeholder="https://example.com/photos/student.jpg"
                {...register('studentPhoto')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.studentPhoto ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                }`}
              />
              {errors.studentPhoto && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.studentPhoto.message}</span>
              )}
            </div>

            {/* Signature */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="signatureImage">
                Signature Image URL
              </label>
              <input
                id="signatureImage"
                type="text"
                placeholder="https://example.com/signatures/sign.jpg"
                {...register('signatureImage')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.signatureImage ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                }`}
              />
              {errors.signatureImage && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.signatureImage.message}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to={isStudentSelf ? ROUTES.DASHBOARD : ROUTES.STUDENTS}>
            <Button id="cancel-edit-student-btn" type="button" variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
          </Link>
          <Button id="save-edit-student-btn" type="submit" variant="primary" size="sm" disabled={loading} className="flex items-center gap-1.5 shadow-sm">
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default StudentEditPage;
