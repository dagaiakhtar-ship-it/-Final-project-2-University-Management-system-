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
  Mail,
  User,
  Briefcase,
  Phone,
  BookOpen,
  MapPin,
  Clock,
  Shield,
  HeartHandshake,
  AlertCircle,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Department {
  name: string;
  code: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface Teacher {
  id: number;
  uuid: string;
  employeeId: string;
  userId: number;
  designation: string | null;
  employmentType: 'Permanent' | 'Contract' | 'Visiting';
  qualification: string | null;
  specialization: string | null;
  experience: number | null;
  joiningDate: string | null;
  officeLocation: string | null;
  officePhone: string | null;
  profilePhoto: string | null;
  cnic: string | null;
  emergencyContact: string | null;
  biography: string | null;
  status: 'Active' | 'On Leave' | 'Retired' | 'Suspended';
  user: UserProfile;
  department: Department;
}

interface CourseOffering {
  id: number;
  uuid: string;
  courseCode: string;
  academicYear: string;
  session: string;
  status: string;
  subject: { name: string; code: string };
  semester: { name: string; code: string };
  section: { name: string; code: string };
}

export const TeacherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'courses'>('profile');

  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/teachers/${id}`);
        if (response.data?.status === 'success') {
          setTeacher(response.data.data);
          
          // Fetch course offerings taught by this teacher
          fetchTaughtCourses(response.data.data.id);
        }
      } catch (error) {
        console.error('Error fetching teacher details:', error);
        toast.error('Failed to retrieve teacher profile');
        navigate(ROUTES.TEACHERS);
      } finally {
        setLoading(false);
      }
    };

    const fetchTaughtCourses = async (teacherId: number) => {
      setLoadingCourses(true);
      try {
        const response = await apiClient.get(`/teachers/${teacherId}/course-offerings`);
        if (response.data?.status === 'success') {
          setOfferings(response.data.data.offerings || []);
        }
      } catch (error) {
        console.error('Error fetching course offerings:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (id) {
      fetchTeacherDetails();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <PageContainer title="Faculty Profile">
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Retrieving faculty profile...</p>
        </div>
      </PageContainer>
    );
  }

  if (!teacher) {
    return (
      <PageContainer title="Profile Not Found">
        <div className="mb-4">
          <Link to={ROUTES.TEACHERS} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory</span>
          </Link>
        </div>
        <Card className="p-12 text-center text-gray-500 max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">Faculty Record Not Found</h3>
          <p className="text-sm text-gray-400">
            The profile you are trying to view does not exist or has been removed from the server directory.
          </p>
        </Card>
      </PageContainer>
    );
  }

  const name = `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`;
  const image = teacher.profilePhoto || teacher.user?.avatarUrl;
  const canEdit = isWritable || (user?.role === 'TEACHER' && user.id === teacher.userId);

  const getStatusBadgeClass = (statusVal: string) => {
    switch (statusVal) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'On Leave':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Retired':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Suspended':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <PageContainer
      title="Faculty Details"
      description="In-depth academic profile, institutional status, contact extensions, and class load analysis."
    >
      {user?.role !== 'TEACHER' && (
        <div className="mb-4">
          <Link to={ROUTES.TEACHERS} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory</span>
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto" id="teacher-details-grid">
        {/* Left Side: Avatar Panel & High-Level Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 text-center border border-gray-100 shadow-sm relative overflow-hidden" id="left-profile-panel">
            <div className="absolute top-0 left-0 right-0 h-20 bg-indigo-50/50 border-b border-indigo-100"></div>

            <div className="relative mt-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-50 mx-auto border-4 border-white shadow-md flex items-center justify-center">
                {image ? (
                  <img src={image} alt={name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mt-4 leading-tight">{name}</h2>
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mt-1.5">
              {teacher.designation || 'Faculty Member'}
            </p>
            <p className="text-xs text-gray-400 font-mono mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded">
              {teacher.employeeId}
            </p>

            <div className="flex justify-center mt-4">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(teacher.status)}`}>
                {teacher.status}
              </span>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3 text-left text-xs text-gray-500">
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-700">{teacher.department?.name}</div>
                  <div className="text-gray-400">{teacher.department?.code} Department</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{teacher.user?.email}</span>
              </div>

              {teacher.officeLocation && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{teacher.officeLocation}</span>
                </div>
              )}

              {teacher.officePhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{teacher.officePhone}</span>
                </div>
              )}
            </div>

            {canEdit && (
              <div className="mt-6">
                <Link to={`/teachers/${teacher.uuid}/edit`} id="btn-edit-details">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 text-xs py-2 font-medium">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile Details</span>
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Institutional Stats Card */}
          <Card className="p-5 border border-gray-100 shadow-sm space-y-4" id="stats-card">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Institutional Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-50">
                <div className="text-xs text-gray-400 font-medium">Status type</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">{teacher.employmentType}</div>
              </div>

              <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-50">
                <div className="text-xs text-gray-400 font-medium">Experience</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">
                  {teacher.experience ? `${teacher.experience} Years` : 'N/A'}
                </div>
              </div>
            </div>

            {teacher.joiningDate && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-50 text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Joined date</span>
                <span className="font-semibold text-gray-700">
                  {new Date(teacher.joiningDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Tabbed Layout containing Profile specs or Active Taught courses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Navigation Tabs */}
          <div className="flex border-b border-gray-200" id="detail-navigation-tabs">
            <button
              type="button"
              id="tab-profile"
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-6 text-sm font-semibold focus:outline-none transition-all border-b-2 ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Academic Portfolio
            </button>
            <button
              type="button"
              id="tab-courses"
              onClick={() => setActiveTab('courses')}
              className={`pb-3 px-6 text-sm font-semibold focus:outline-none transition-all border-b-2 ${activeTab === 'courses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Taught Courses ({loadingCourses ? '...' : offerings.length})
            </button>
          </div>

          {activeTab === 'profile' ? (
            <div className="space-y-6" id="portfolio-content">
              {/* Academic Highlights */}
              <Card className="p-6 border border-gray-100 shadow-sm" id="academic-card">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
                  <Award className="w-5 h-5" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider">Qualifications & Focus Area</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Academic Qualification</h4>
                    <p className="text-sm font-semibold text-gray-800 bg-indigo-50/20 px-3 py-2 rounded border border-indigo-50/50">
                      {teacher.qualification || 'No specified higher degree credentials registered.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Research Specialization</h4>
                    <p className="text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-2 rounded border border-gray-100">
                      {teacher.specialization || 'General Academic Focus'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Biography Section */}
              <Card className="p-6 border border-gray-100 shadow-sm" id="bio-card">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider">Biography / Professional Statement</h3>
                </div>

                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {teacher.biography || (
                    <p className="italic text-gray-400">
                      No introductory bio or academic statement has been provided by the faculty member yet.
                    </p>
                  )}
                </div>
              </Card>

              {/* Security & Emergency (Only visible if super admin, admin or self teacher) */}
              {(isWritable || user?.id === teacher.userId) && (
                <Card className="p-6 border border-gray-100 shadow-sm" id="security-card">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-indigo-700">
                    <Shield className="w-5 h-5" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Administrative & HR Identity</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">National ID / CNIC</h4>
                      <p className="text-sm font-mono text-gray-800 font-semibold">
                        {teacher.cnic || 'Not registered / Unavailable'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Emergency Contact Extension</h4>
                      <p className="text-sm text-gray-800 font-semibold">
                        {teacher.emergencyContact || 'No emergency details declared.'}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            /* Active Taught Courses Tab */
            <div id="courses-content">
              {loadingCourses ? (
                <div className="py-12 text-center">
                  <div className="inline-block w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-xs text-gray-500 font-medium">Fetching associated class roster...</p>
                </div>
              ) : offerings.length === 0 ? (
                <Card className="p-12 text-center border border-dashed border-gray-200">
                  <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">No Assigned Courses</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    There are no ongoing or upcoming course offering classes associated with this teacher profile.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offerings.map((course) => (
                    <Card key={course.id} className="p-4 border border-gray-100 shadow-sm hover:border-indigo-100 transition-all flex flex-col justify-between" id={`course-card-${course.id}`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            {course.courseCode}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${course.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            {course.status}
                          </span>
                        </div>

                        <h4 className="font-semibold text-gray-900 mt-2 line-clamp-1">{course.subject?.name}</h4>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{course.subject?.code}</p>

                        <div className="grid grid-cols-2 gap-2 mt-3.5 text-xs text-gray-500 border-t border-gray-50 pt-2.5">
                          <div>
                            <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-medium">Semester</span>
                            <span className="font-semibold text-gray-700">{course.semester?.name}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-medium">Section</span>
                            <span className="font-semibold text-gray-700">{course.section?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-gray-50 flex justify-end">
                        <Link to={`/course-offerings/${course.uuid}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
                          <span>View Class Offering</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default TeacherDetailPage;
