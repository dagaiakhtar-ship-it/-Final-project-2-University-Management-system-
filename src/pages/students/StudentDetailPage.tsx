import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  ArrowLeft,
  Edit2,
  Building,
  GraduationCap,
  Calendar,
  User,
  Mail,
  Phone,
  BookOpen,
  MapPin,
  CreditCard,
  HeartPulse,
  Award,
  Layers,
  Home,
  Bus,
  ShieldAlert,
  Signature
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
}

interface Semester {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface Student {
  id: number;
  uuid: string;
  registrationNumber: string;
  rollNumber: string;
  idCardNumber: string | null;
  userId: number;
  fullName: string | null;
  fatherName: string | null;
  motherName: string | null;
  guardianRelationship: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  nationality: string | null;
  cnic: string | null;
  email: string | null;
  mobileNumber: string | null;
  emergencyContact: string | null;
  permanentAddress: string | null;
  currentAddress: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
  previousInstitution: string | null;
  previousQualification: string | null;
  previousCgpa: number | null;
  admissionMeritNumber: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'APPLIED' | 'WITHDRAWN' | 'ALUMNI';
  enrollmentStatus: string | null;
  admissionSession: string | null;
  admissionDate: string | null;
  scholarshipStatus: string | null;
  hostelStatus: string | null;
  transportStatus: string | null;
  medicalNotes: string | null;
  studentPhoto: string | null;
  signatureImage: string | null;
  createdAt: string;
  
  user: UserProfile;
  department: Department;
  program: Program;
  semester: Semester;
  section: Section | null;
  academicYear: AcademicYear;
}

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isStudentSelf = user?.role === 'STUDENT' && student && user.id === student.userId;

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/students/${id}`);
        if (response.data?.status === 'success') {
          const s = response.data.data;
          
          // Double check: If student user, they must be viewing their own profile
          if (user?.role === 'STUDENT' && s.userId !== user.id) {
            toast.error('You are not authorized to view this student profile.');
            navigate(ROUTES.DASHBOARD);
            return;
          }

          setStudent(s);
        }
      } catch (error: any) {
        console.error('Error fetching student details:', error);
        toast.error(error.response?.data?.message || 'Failed to retrieve student profile');
        if (user?.role === 'STUDENT') {
          navigate(ROUTES.DASHBOARD);
        } else {
          navigate(ROUTES.STUDENTS);
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchStudent();
    }
  }, [id, navigate, user]);

  if (loading) {
    return (
      <PageContainer title="Student Academic Record">
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <span className="text-sm font-medium text-slate-500">Retrieving full academic portfolio...</span>
        </div>
      </PageContainer>
    );
  }

  if (!student) {
    return (
      <PageContainer title="Record Not Found">
        <div className="text-center py-12">
          <p className="text-slate-500">The requested student profile could not be recovered.</p>
          <Link to={ROUTES.STUDENTS} className="text-indigo-600 font-semibold hover:underline mt-4 inline-block">
            Back to Directory
          </Link>
        </div>
      </PageContainer>
    );
  }

  const studentName = student.fullName || `${student.user.firstName} ${student.user.lastName}`;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INACTIVE':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'SUSPENDED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'GRADUATED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'APPLIED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'WITHDRAWN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ALUMNI':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <PageContainer
      title="Student Academic Portfolio"
      description="Enterprise-level 360-degree Student Information view."
    >
      <div className="flex flex-col space-y-6">
        {/* Top actions line */}
        <div className="flex items-center justify-between">
          <Link to={ROUTES.STUDENTS} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory</span>
          </Link>

          {(isWritable || isStudentSelf) && (
            <Link to={`/students/${student.uuid}/edit`}>
              <Button id="edit-student-top-btn" variant="outline" size="sm" className="flex items-center space-x-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Header Profile Card */}
        <Card id="student-detail-header-card" className="p-6 border-slate-100 shadow-sm bg-gradient-to-r from-slate-50/50 via-white to-white">
          <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6 gap-4">
            {/* Avatar Photo */}
            <div className="h-28 w-28 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-slate-200 shadow-sm flex-shrink-0">
              {student.studentPhoto ? (
                <img
                  src={student.studentPhoto}
                  alt={studentName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-slate-400" />
              )}
            </div>

            {/* Academic Credentials Headline */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3 gap-2">
                <h1 className="text-xl font-bold text-slate-800 leading-tight">{studentName}</h1>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(student.status)}`}>
                    {student.status}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {student.enrollmentStatus || 'Enrolled'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-mono flex items-center justify-center md:justify-start">
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold mr-2">REG: {student.registrationNumber}</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">ROLL: {student.rollNumber}</span>
              </p>

              {/* Department Track Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-left">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Department</span>
                    <span className="text-xs font-bold text-slate-700">{student.department.code}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Degree Track</span>
                    <span className="text-xs font-bold text-slate-700">{student.program.code}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Semester & Sec</span>
                    <span className="text-xs font-bold text-slate-700">
                      {student.semester.name} ({student.section?.name || 'N/A'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Session</span>
                    <span className="text-xs font-bold text-slate-700">{student.admissionSession || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 & 2: Primary portfolios */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Details */}
            <Card id="personal-bento-card" className="p-6 border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 text-indigo-700">
                <User className="w-5 h-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Demographic Profile</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Father's Name:</span>
                  <span className="text-slate-700 font-bold">{student.fatherName || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Mother's Name:</span>
                  <span className="text-slate-700 font-bold">{student.motherName || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Guardian / Relationship:</span>
                  <span className="text-slate-700 font-bold">{student.guardianRelationship || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Date of Birth:</span>
                  <span className="text-slate-700 font-bold">
                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Gender:</span>
                  <span className="text-slate-700 font-bold">{student.gender || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Blood Group:</span>
                  <span className="text-slate-700 font-bold text-rose-600">{student.bloodGroup || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Nationality:</span>
                  <span className="text-slate-700 font-bold">{student.nationality || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">CNIC / B-Form:</span>
                  <span className="text-slate-700 font-mono font-bold">{student.cnic || 'N/A'}</span>
                </div>
              </div>
            </Card>

            {/* Geographical Addresses */}
            <Card id="geographical-bento-card" className="p-6 border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 text-indigo-700">
                <MapPin className="w-5 h-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Contact & Address Details</h2>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">Current Residence</span>
                    <span className="text-slate-700 font-semibold leading-relaxed">
                      {student.currentAddress || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">Permanent Residence</span>
                    <span className="text-slate-700 font-semibold leading-relaxed">
                      {student.permanentAddress || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">City</span>
                    <span className="text-xs font-bold text-slate-700">{student.city || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Province / State</span>
                    <span className="text-xs font-bold text-slate-700">{student.province || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Country</span>
                    <span className="text-xs font-bold text-slate-700">{student.country || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Postal Code</span>
                    <span className="text-xs font-mono font-bold text-slate-700">{student.postalCode || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Academic History */}
            <Card id="history-bento-card" className="p-6 border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 text-indigo-700">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Prior Academic Qualifications</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Previous Institution:</span>
                  <span className="text-slate-700 font-bold">{student.previousInstitution || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Degree / Qualification:</span>
                  <span className="text-slate-700 font-bold">{student.previousQualification || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Result (CGPA or Marks %):</span>
                  <span className="text-indigo-600 font-bold font-mono">{student.previousCgpa || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">University Admission Merit Rank:</span>
                  <span className="text-slate-700 font-bold">#{student.admissionMeritNumber || 'N/A'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Column 3: Secondary portfolios & Facilities */}
          <div className="space-y-6">
            {/* Contact Connection */}
            <Card id="connection-bento-card" className="p-6 border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 text-indigo-700">
                <Phone className="w-5 h-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Contact points</h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start space-x-2">
                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Core Email</span>
                    <span className="text-slate-700 font-semibold">{student.user.email}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Personal Email</span>
                    <span className="text-slate-700 font-semibold">{student.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Phone className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Mobile Contact</span>
                    <span className="text-slate-700 font-mono font-semibold">{student.mobileNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <ShieldAlert className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Emergency Contact</span>
                    <span className="text-slate-700 font-semibold">{student.emergencyContact || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* University Facilities Cards */}
            <Card id="facilities-bento-card" className="p-6 border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 text-indigo-700">
                <Award className="w-5 h-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Subsidy & Facilities</h2>
              </div>

              <div className="space-y-4 text-xs">
                {/* Scholarship */}
                <div className="flex items-center space-x-3 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/50">
                  <GraduationCap className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Scholarship Category</span>
                    <span className="text-amber-800 font-bold">{student.scholarshipStatus || 'No Scholarship'}</span>
                  </div>
                </div>

                {/* Hostel */}
                <div className="flex items-center space-x-3 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/50">
                  <Home className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Hostel Status</span>
                    <span className="text-blue-800 font-bold">
                      {student.hostelStatus === 'Yes' ? 'Residing Boarder' : student.hostelStatus || 'No Hostel'}
                    </span>
                  </div>
                </div>

                {/* Transport */}
                <div className="flex items-center space-x-3 bg-purple-50/40 p-2.5 rounded-lg border border-purple-100/50">
                  <Bus className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Transport Subscribers</span>
                    <span className="text-purple-800 font-bold">
                      {student.transportStatus === 'Yes' ? 'Subscribed Bus Route' : 'No Transport'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Medical Notes */}
            <Card id="medical-bento-card" className="p-6 border-slate-100 shadow-sm bg-rose-50/10">
              <div className="flex items-center gap-2 mb-3 pb-1 text-rose-700 border-b border-rose-50">
                <HeartPulse className="w-5 h-5 animate-pulse" />
                <h2 className="text-xs font-semibold uppercase tracking-wider">Medical Notes / Context</h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                {student.medicalNotes || 'No registered medical alerts or physical limitations recorded.'}
              </p>
            </Card>

            {/* Signature Block */}
            {student.signatureImage && (
              <Card id="signature-bento-card" className="p-6 border-slate-100 shadow-sm text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">
                  <Signature className="h-3.5 w-3.5" />
                  <span>Student Verified Signature</span>
                </div>
                <div className="border border-dashed border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-center h-20 overflow-hidden">
                  <img
                    src={student.signatureImage}
                    alt="Student Signature"
                    referrerPolicy="no-referrer"
                    className="h-full object-contain mix-blend-multiply"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default StudentDetailPage;
