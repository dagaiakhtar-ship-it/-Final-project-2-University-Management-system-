import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStudentSchema } from '../../validators/student.validators';
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
  Phone,
  BookOpen,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  CreditCard,
  Briefcase,
  HeartPulse,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LookupOptions {
  departments: Array<{ id: number; name: string; code: string }>;
  programs: Array<{ id: number; name: string; code: string; departmentId: number }>;
  semesters: Array<{ id: number; name: string; programId: number }>;
  sections: Array<{ id: number; name: string; semesterId: number }>;
  academicYears: Array<{ id: number; name: string; status: string }>;
  eligibleUsers: Array<{ id: number; uuid: string; email: string; firstName: string; lastName: string }>;
}

export const StudentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lookups, setLookups] = useState<LookupOptions>({
    departments: [],
    programs: [],
    semesters: [],
    sections: [],
    academicYears: [],
    eligibleUsers: [],
  });

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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      userId: 0,
      registrationNumber: '',
      rollNumber: '',
      idCardNumber: '',
      departmentId: 0,
      programId: 0,
      semesterId: 0,
      sectionId: null,
      academicYearId: 0,
      admissionSession: '',
      admissionDate: '',
      status: 'ACTIVE' as const,
      enrollmentStatus: 'Pending',
      
      fullName: '',
      fatherName: '',
      motherName: '',
      guardianRelationship: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      nationality: 'Pakistani',
      cnic: '',
      
      email: '',
      mobileNumber: '',
      emergencyContact: '',
      permanentAddress: '',
      currentAddress: '',
      city: '',
      province: '',
      country: 'Pakistan',
      postalCode: '',
      
      previousInstitution: '',
      previousQualification: '',
      previousCgpa: 0,
      admissionMeritNumber: 1,
      
      scholarshipStatus: 'None',
      hostelStatus: 'No',
      transportStatus: 'No',
      medicalNotes: '',
      studentPhoto: '',
      signatureImage: '',
    },
  });

  // Watch fields for cascading triggers
  const watchedDeptId = watch('departmentId');
  const watchedProgId = watch('programId');
  const watchedSemId = watch('semesterId');

  useEffect(() => {
    if (watchedDeptId) {
      setSelectedDeptId(Number(watchedDeptId));
      // Reset dependent cascading dropdowns
      setValue('programId', 0);
      setValue('semesterId', 0);
      setValue('sectionId', null);
    }
  }, [watchedDeptId, setValue]);

  useEffect(() => {
    if (watchedProgId) {
      setSelectedProgId(Number(watchedProgId));
      setValue('semesterId', 0);
      setValue('sectionId', null);
    }
  }, [watchedProgId, setValue]);

  useEffect(() => {
    if (watchedSemId) {
      setSelectedSemId(Number(watchedSemId));
      setValue('sectionId', null);
    }
  }, [watchedSemId, setValue]);

  // Load Lookups on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const response = await apiClient.get('/students/lookup-options');
        if (response.data?.status === 'success') {
          setLookups(response.data.data);
        }
      } catch (err) {
        console.error('[StudentCreate] Fetch lookup error:', err);
        toast.error('Failed to load option parameters');
      }
    };
    fetchLookups();
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        userId: Number(data.userId),
        departmentId: Number(data.departmentId),
        programId: Number(data.programId),
        semesterId: Number(data.semesterId),
        sectionId: data.sectionId ? Number(data.sectionId) : null,
        academicYearId: Number(data.academicYearId),
        previousCgpa: data.previousCgpa ? Number(data.previousCgpa) : null,
        admissionMeritNumber: data.admissionMeritNumber ? Number(data.admissionMeritNumber) : null,
        admissionDate: data.admissionDate ? new Date(data.admissionDate).toISOString() : null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
        
        // Clean up empty strings to null for optional DB values
        idCardNumber: data.idCardNumber || null,
        admissionSession: data.admissionSession || null,
        enrollmentStatus: data.enrollmentStatus || null,
        fullName: data.fullName || null,
        fatherName: data.fatherName || null,
        motherName: data.motherName || null,
        guardianRelationship: data.guardianRelationship || null,
        gender: data.gender || null,
        bloodGroup: data.bloodGroup || null,
        nationality: data.nationality || null,
        cnic: data.cnic || null,
        email: data.email || null,
        mobileNumber: data.mobileNumber || null,
        emergencyContact: data.emergencyContact || null,
        permanentAddress: data.permanentAddress || null,
        currentAddress: data.currentAddress || null,
        city: data.city || null,
        province: data.province || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        previousInstitution: data.previousInstitution || null,
        previousQualification: data.previousQualification || null,
        scholarshipStatus: data.scholarshipStatus || null,
        hostelStatus: data.hostelStatus || null,
        transportStatus: data.transportStatus || null,
        medicalNotes: data.medicalNotes || null,
        studentPhoto: data.studentPhoto || null,
        signatureImage: data.signatureImage || null,
      };

      const response = await apiClient.post('/students', payload);
      if (response.data?.status === 'success') {
        toast.success('Student profile created successfully!');
        navigate(ROUTES.STUDENTS);
      }
    } catch (err: any) {
      console.error('[StudentCreate] Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to create student profile');
    } finally {
      setLoading(false);
    }
  };

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
      title="Create Student Profile"
      description="Create a comprehensive student record and configure their academic alignment."
    >
      <div className="mb-4">
        <Link to={ROUTES.STUDENTS} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl" id="create-student-form">
        {/* Section 1: Core Credentials & Academic Track */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <User className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Account & Core Credentials</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Account Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="userId">
                Eligible User Account <span className="text-rose-500">*</span>
              </label>
              <select
                id="userId"
                {...register('userId')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
                  errors.userId ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                }`}
              >
                <option value={0}>-- Select User Account --</option>
                {lookups.eligibleUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
              {errors.userId && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.userId.message}</span>
              )}
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="registrationNumber">
                Registration Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="registrationNumber"
                type="text"
                placeholder="e.g. REG-2026-CS-401"
                {...register('registrationNumber')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.registrationNumber ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                }`}
              />
              {errors.registrationNumber && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.registrationNumber.message}</span>
              )}
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="rollNumber">
                Roll Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="rollNumber"
                type="text"
                placeholder="e.g. CS-2026-085"
                {...register('rollNumber')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.rollNumber ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                }`}
              />
              {errors.rollNumber && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.rollNumber.message}</span>
              )}
            </div>

            {/* ID Card Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="idCardNumber">
                RFID / ID Card Number
              </label>
              <input
                id="idCardNumber"
                type="text"
                placeholder="e.g. RFID-9821-CS"
                {...register('idCardNumber')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="academicYearId">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                id="academicYearId"
                {...register('academicYearId')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
                  errors.academicYearId ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                }`}
              >
                <option value={0}>-- Select Academic Year --</option>
                {lookups.academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} ({ay.status})
                  </option>
                ))}
              </select>
              {errors.academicYearId && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.academicYearId.message}</span>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="status">
                Academic Status
              </label>
              <select
                id="status"
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

          {/* Cascading Program Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-50">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="departmentId">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="departmentId"
                {...register('departmentId')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
                  errors.departmentId ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                }`}
              >
                <option value={0}>-- Select Department --</option>
                {lookups.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.departmentId.message}</span>
              )}
            </div>

            {/* Program (cascaded by Department) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="programId">
                Program <span className="text-rose-500">*</span>
              </label>
              <select
                id="programId"
                disabled={!selectedDeptId}
                {...register('programId')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
                  errors.programId ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                } disabled:opacity-50`}
              >
                <option value={0}>
                  {!selectedDeptId ? 'Select Department first' : '-- Select Program --'}
                </option>
                {filteredPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
              {errors.programId && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.programId.message}</span>
              )}
            </div>

            {/* Semester (cascaded by Program) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="semesterId">
                Semester <span className="text-rose-500">*</span>
              </label>
              <select
                id="semesterId"
                disabled={!selectedProgId}
                {...register('semesterId')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
                  errors.semesterId ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                } disabled:opacity-50`}
              >
                <option value={0}>
                  {!selectedProgId ? 'Select Program first' : '-- Select Semester --'}
                </option>
                {filteredSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.semesterId && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.semesterId.message}</span>
              )}
            </div>

            {/* Section (cascaded by Semester) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="sectionId">
                Section
              </label>
              <select
                id="sectionId"
                disabled={!selectedSemId}
                {...register('sectionId')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:opacity-50"
              >
                <option value="">
                  {!selectedSemId ? 'Select Semester first' : '-- Select Section --'}
                </option>
                {filteredSections.map((sect) => (
                  <option key={sect.id} value={sect.id}>
                    {sect.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Personal Info & Contact Info */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <User className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Personal Details & Family Information</h2>
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
                placeholder="e.g. Father, Uncle, Mother"
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

            {/* CNIC / B-Form */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cnic">
                CNIC / B-Form Number
              </label>
              <input
                id="cnic"
                type="text"
                placeholder="e.g. 37405-1234567-1"
                {...register('cnic')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50">
            {/* Secondary Contact Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="email">
                Contact Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="e.g. personal.email@gmail.com"
                {...register('email')}
                className={`w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.email ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                }`}
              />
              {errors.email && (
                <span className="text-[10px] text-rose-500 mt-1 block font-medium">{errors.email.message}</span>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="mobileNumber">
                Mobile Number
              </label>
              <input
                id="mobileNumber"
                type="tel"
                placeholder="+923001234567"
                {...register('mobileNumber')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="emergencyContact">
                Emergency Contact (Name & Number)
              </label>
              <input
                id="emergencyContact"
                type="text"
                placeholder="e.g. Ali Khan (+923001112233)"
                {...register('emergencyContact')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
            {/* Current Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="currentAddress">
                Current Address
              </label>
              <textarea
                id="currentAddress"
                rows={2}
                placeholder="Street address, Apartment, etc."
                {...register('currentAddress')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Permanent Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="permanentAddress">
                Permanent Address
              </label>
              <textarea
                id="permanentAddress"
                rows={2}
                placeholder="Permanent home address"
                {...register('permanentAddress')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* City & Province & Country & Postal Code */}
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="e.g. Rawalpindi"
                  {...register('city')}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="province">
                  Province / State
                </label>
                <input
                  id="province"
                  type="text"
                  placeholder="e.g. Punjab"
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
                  placeholder="e.g. Pakistan"
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
                  placeholder="e.g. 46000"
                  {...register('postalCode')}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Academic Background & Admission Metrics */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Academic History & Merit Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Previous Institution */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="previousInstitution">
                Previous Institution
              </label>
              <input
                id="previousInstitution"
                type="text"
                placeholder="School/College previously attended"
                {...register('previousInstitution')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Previous Qualification */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="previousQualification">
                Previous Qualification
              </label>
              <input
                id="previousQualification"
                type="text"
                placeholder="e.g. HSSC / F.Sc / A-Levels"
                {...register('previousQualification')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Previous CGPA */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="previousCgpa">
                Previous CGPA / Marks %
              </label>
              <input
                id="previousCgpa"
                type="number"
                step="0.01"
                placeholder="e.g. 3.85"
                {...register('previousCgpa')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Admission Session */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="admissionSession">
                Admission Session
              </label>
              <input
                id="admissionSession"
                type="text"
                placeholder="e.g. Fall 2026"
                {...register('admissionSession')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="admissionDate">
                Admission Date
              </label>
              <input
                id="admissionDate"
                type="date"
                {...register('admissionDate')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Merit Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="admissionMeritNumber">
                Admission Merit Rank
              </label>
              <input
                id="admissionMeritNumber"
                type="number"
                placeholder="e.g. 152"
                {...register('admissionMeritNumber')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Enrollment Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="enrollmentStatus">
                Enrollment Status
              </label>
              <select
                id="enrollmentStatus"
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

        {/* Section 4: Preferences, Medical, and Media URLs */}
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
            <HeartPulse className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Preferences, Facilities & Medical Context</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scholarship Status */}
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

            {/* Hostel Status */}
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

            {/* Transport Subscription */}
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

            {/* Medical Notes */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="medicalNotes">
                Medical Conditions / Allergies / Notes
              </label>
              <textarea
                id="medicalNotes"
                rows={2}
                placeholder="State any specific medical alert or accommodation guidelines if necessary."
                {...register('medicalNotes')}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Photo Avatar URL */}
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

            {/* Signature Image URL */}
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
          <Link to={ROUTES.STUDENTS}>
            <Button id="cancel-student-btn" type="button" variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
          </Link>
          <Button id="save-student-btn" type="submit" variant="primary" size="sm" disabled={loading} className="flex items-center gap-1.5 shadow-sm">
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Creating Student...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default StudentCreatePage;
