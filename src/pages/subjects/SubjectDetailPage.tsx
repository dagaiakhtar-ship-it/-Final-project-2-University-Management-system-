import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate as useRouterNavigate, useParams as useRouterParams } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  ArrowLeft,
  Edit2,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  GraduationCap,
  BookOpen,
  Layers,
  History,
  FileText,
  Bookmark
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SubjectDetail {
  id: number;
  uuid: string;
  code: string;
  name: string;
  shortName: string | null;
  creditHours: number;
  theoryHours: number;
  labHours: number;
  subjectType: 'Theory' | 'Lab' | 'Mixed';
  category: 'Core' | 'Elective' | 'General';
  status: 'ACTIVE' | 'INACTIVE';
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  department: {
    id: number;
    name: string;
    code: string;
  };
  program: {
    id: number;
    name: string;
    code: string;
  };
  semester: {
    id: number;
    name: string;
    code: string;
  };
  prerequisite: {
    id: number;
    uuid: string;
    name: string;
    code: string;
  } | null;
}

export const SubjectDetailPage: React.FC = () => {
  const { id } = useRouterParams<{ id: string }>(); // Subject UUID
  const navigate = useRouterNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubject = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/subjects/${id}`);
        if (response.data?.status === 'success') {
          setSubject(response.data.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch subject details:', err);
        toast.error(err.response?.data?.message || 'Failed to fetch subject details.');
        navigate(ROUTES.SUBJECTS);
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [id, navigate]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
          <span className="mt-4 text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
            Loading subject catalog...
          </span>
        </div>
      </PageContainer>
    );
  }

  if (!subject) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Subject Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            The requested subject profile could not be retrieved from the catalog database.
          </p>
          <RouterLink to={ROUTES.SUBJECTS} className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Back to Catalog list
            </Button>
          </RouterLink>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Detail Header navigation */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <RouterLink to={ROUTES.SUBJECTS}>
            <Button id="btn-back-to-list" variant="outline" size="sm" className="p-2 border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </RouterLink>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                {subject.code}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  subject.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {subject.status === 'ACTIVE' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                <span>{subject.status}</span>
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">
              {subject.name}
            </h1>
          </div>
        </div>

        {isWritable && (
          <RouterLink to={`/subjects/${subject.uuid}/edit`}>
            <Button id="btn-edit-subject" className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              <span>Edit Subject</span>
            </Button>
          </RouterLink>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card id="subject-profile-card" className="p-6">
            <h2 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span>Course Syllabus Profile</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Subject Name</span>
                <span className="text-sm font-semibold text-gray-900">{subject.name}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Abbreviation</span>
                <span className="text-sm font-semibold text-gray-900 font-mono">{subject.shortName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Subject Type</span>
                <span className="inline-flex text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full mt-0.5">
                  {subject.subjectType}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Syllabus Category</span>
                <span className="text-sm font-semibold text-gray-900">{subject.category} Subject</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Syllabus Overview</span>
              {subject.description ? (
                <p className="text-sm text-gray-600 leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                  {subject.description}
                </p>
              ) : (
                <div className="text-sm text-gray-400 italic bg-gray-50/50 p-4 rounded-lg border border-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>No description has been formulated for this subject yet.</span>
                </div>
              )}
            </div>
          </Card>

          {/* Prerequisite Section */}
          <Card id="subject-prereq-card" className="p-6">
            <h2 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2 mb-5">
              <Bookmark className="w-5 h-5 text-indigo-500" />
              <span>Prerequisites & Constraints</span>
            </h2>

            {subject.prerequisite ? (
              <div className="flex items-center justify-between p-4 bg-indigo-50/30 border border-indigo-100/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200">
                    {subject.prerequisite.code}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{subject.prerequisite.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Prerequisite Subject</p>
                  </div>
                </div>
                <RouterLink to={`/subjects/${subject.prerequisite.uuid}`}>
                  <Button variant="outline" size="sm" className="text-xs font-medium bg-white hover:bg-slate-50">
                    Inspect Profile
                  </Button>
                </RouterLink>
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/30 flex items-center gap-2.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span>This is a introductory-level subject. It has <strong>no prerequisite</strong> specifications.</span>
              </div>
            )}
          </Card>
        </div>

        {/* Structural Metrics and Audit trail */}
        <div className="space-y-6">
          <Card id="subject-metrics-card" className="p-6 space-y-5">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Credit Allocation Metrics</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                <span className="block text-2xl font-extrabold text-indigo-600">{subject.creditHours}</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Credits</span>
              </div>
              <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-700">{subject.theoryHours}</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Theory Hrs</span>
              </div>
              <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-700">{subject.labHours}</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Lab Hrs</span>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-gray-400 font-medium flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  Department
                </span>
                <span className="font-semibold text-slate-800">{subject.department?.name}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-gray-400 font-medium flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  Program
                </span>
                <span className="font-semibold text-slate-800">{subject.program?.name}</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-gray-400 font-medium flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Semester
                </span>
                <span className="font-semibold text-slate-800">{subject.semester?.name}</span>
              </div>
            </div>
          </Card>

          {/* Audit trail details */}
          <Card id="subject-audit-card" className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Record Traceability</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 font-medium block mb-0.5">Created By</span>
                <span className="font-mono font-semibold text-gray-700">User #{subject.createdBy || 'System'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block mb-0.5">Created At</span>
                <span className="font-mono font-semibold text-gray-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(subject.createdAt).toLocaleString()}
                </span>
              </div>
              {subject.updatedAt !== subject.createdAt && (
                <>
                  <div>
                    <span className="text-gray-400 font-medium block mb-0.5">Modified By</span>
                    <span className="font-mono font-semibold text-gray-700">User #{subject.updatedBy || 'System'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block mb-0.5">Last Updated</span>
                    <span className="font-mono font-semibold text-gray-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(subject.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
