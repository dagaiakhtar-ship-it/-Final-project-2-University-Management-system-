import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Building,
  GraduationCap,
  Award,
  BookOpen,
  User,
  Clock,
  Book,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle
} from 'lucide-react';

interface Teacher {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Program {
  id: number;
  uuid: string;
  name: string;
  code: string;
  shortName: string | null;
  degreeLevel: string;
  duration: number;
  totalSemesters: number;
  creditHours: number;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  department: Department;
  coordinator: Teacher | null;
}

export const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Represents the program uuid
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    const fetchProgramDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/programs/${id}`);
        if (response.data?.status === 'success') {
          setProgram(response.data.data);
        } else {
          throw new Error('Failed to fetch details');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Academic program could not be located.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProgramDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-500 font-mono text-sm">Retrieving program parameters...</span>
        </div>
      </PageContainer>
    );
  }

  if (error || !program) {
    return (
      <PageContainer>
        <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold tracking-tight mb-2">Error Loading Program</h2>
          <p className="text-xs text-gray-600 mb-6">{error || 'The requested degree program does not exist or has been deleted.'}</p>
          <Link to={ROUTES.PROGRAMS}>
            <Button variant="outline" size="sm" className="font-mono text-xs">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Programs List
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header and Actions */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" id="program-detail-header-block">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-1">
            <Link to={ROUTES.DASHBOARD} className="hover:text-indigo-600">ERP</Link>
            <span>/</span>
            <Link to={ROUTES.PROGRAMS} className="hover:text-indigo-600">PROGRAMS</Link>
            <span>/</span>
            <span className="text-gray-400">{program.code}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            {program.name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Affiliated to the Department of <span className="font-semibold">{program.department.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={ROUTES.PROGRAMS}>
            <Button variant="outline" size="sm" className="flex items-center gap-2 font-mono text-xs">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          {isWritable && (
            <Link to={`${ROUTES.PROGRAMS}/${program.uuid}/edit`}>
              <Button variant="primary" size="sm" className="flex items-center gap-2 font-mono text-xs">
                <Edit2 className="w-4 h-4" /> Edit Program
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="program-detail-content-grid">
        {/* Left Columns (Details / Info Card) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 shadow-sm border border-gray-100" id="program-detail-main-card">
            <div className="border-b border-gray-100 pb-5 mb-5 flex justify-between items-center">
              <h2 className="text-sm font-mono font-semibold text-gray-900 tracking-tight">
                Program Specifications
              </h2>
              {program.status === 'ACTIVE' ? (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-2xs px-2.5 py-1 rounded-full border border-green-200 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-2xs px-2.5 py-1 rounded-full border border-gray-200 font-mono">
                  <XCircle className="w-3.5 h-3.5" /> INACTIVE
                </span>
              )}
            </div>

            {/* Program specifications metrics block */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50/55 rounded-lg p-4 border border-gray-100/60 flex flex-col gap-1">
                <span className="text-2xs font-mono text-gray-500 uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" /> Degree Level
                </span>
                <span className="text-lg font-bold text-gray-900">{program.degreeLevel}</span>
              </div>

              <div className="bg-gray-50/55 rounded-lg p-4 border border-gray-100/60 flex flex-col gap-1">
                <span className="text-2xs font-mono text-gray-500 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Duration
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {program.duration} {program.duration === 1 ? 'Year' : 'Years'}
                </span>
              </div>

              <div className="bg-gray-50/55 rounded-lg p-4 border border-gray-100/60 flex flex-col gap-1">
                <span className="text-2xs font-mono text-gray-500 uppercase flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Total Semesters
                </span>
                <span className="text-lg font-bold text-gray-900">{program.totalSemesters}</span>
              </div>

              <div className="bg-gray-50/55 rounded-lg p-4 border border-gray-100/60 flex flex-col gap-1">
                <span className="text-2xs font-mono text-gray-500 uppercase flex items-center gap-1">
                  <Book className="w-3.5 h-3.5 text-indigo-500" /> Credit Hours
                </span>
                <span className="text-lg font-bold text-gray-900">{program.creditHours} Hrs</span>
              </div>

              <div className="bg-gray-50/55 rounded-lg p-4 border border-gray-100/60 flex flex-col gap-1">
                <span className="text-2xs font-mono text-gray-500 uppercase flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Program Code
                </span>
                <span className="text-lg font-bold text-gray-900">{program.code}</span>
              </div>

              <div className="bg-gray-50/55 rounded-lg p-4 border border-gray-100/60 flex flex-col gap-1">
                <span className="text-2xs font-mono text-gray-500 uppercase flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Abbreviation
                </span>
                <span className="text-lg font-bold text-gray-900">{program.shortName || 'N/A'}</span>
              </div>
            </div>

            {/* Description Block */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
                Program Description & Scope
              </h3>
              <div className="bg-gray-50/30 border border-gray-100 rounded-lg p-4 text-sm text-gray-700 leading-relaxed min-h-[100px]">
                {program.description ? (
                  program.description
                ) : (
                  <span className="text-gray-400 italic">No description has been provided for this academic program yet.</span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Columns (Affiliations and Metadata Sidebar) */}
        <div className="space-y-6">
          {/* Department Affiliation and Coordinator */}
          <Card className="p-6 shadow-sm border border-gray-100" id="program-detail-meta-sidebar">
            <h3 className="text-xs font-mono font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Academic Control
            </h3>

            {/* Department Info */}
            <div className="flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xs font-mono text-gray-400 uppercase tracking-wider">Department</span>
                <Link to={`/departments/${program.department.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 hover:underline">
                  {program.department.name}
                </Link>
                <span className="text-xs font-mono text-gray-500">Code: {program.department.code}</span>
              </div>
            </div>

            {/* Coordinator Info */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xs font-mono text-gray-400 uppercase tracking-wider">Coordinator</span>
                {program.coordinator ? (
                  <>
                    <span className="text-sm font-semibold text-gray-900">
                      {program.coordinator.user.firstName} {program.coordinator.user.lastName}
                    </span>
                    <span className="text-xs text-gray-500 font-mono break-all">{program.coordinator.user.email}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400 italic mt-0.5">Unassigned</span>
                )}
              </div>
            </div>
          </Card>

          {/* System Audit / Registry Logs */}
          <Card className="p-6 shadow-sm border border-gray-100" id="program-detail-system-card">
            <h3 className="text-xs font-mono font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Registry Information
            </h3>
            <div className="space-y-4 text-xs font-mono text-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">UUID:</span>
                <span className="text-gray-900 text-3xs select-all font-sans bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  {program.uuid}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Created:</span>
                <span className="text-gray-900">
                  {new Date(program.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last Modified:</span>
                <span className="text-gray-900">
                  {new Date(program.updatedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
export default ProgramDetailPage;
