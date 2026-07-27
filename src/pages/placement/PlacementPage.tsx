import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';

// Icons
import { 
  Building2, Briefcase, FileText, BarChart2, Calendar, 
  Milestone, ShieldAlert, Users, Award 
} from 'lucide-react';

// Components
import { PlacementOverview } from './components/PlacementOverview';
import { PlacementCompanies } from './components/PlacementCompanies';
import { PlacementJobs } from './components/PlacementJobs';
import { PlacementApplications } from './components/PlacementApplications';
import { PlacementStudentHistory } from './components/PlacementStudentHistory';

export const PlacementPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'jobs' | 'applications' | 'history'>('overview');

  // Unified States
  const [analytics, setAnalytics] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [studentHistory, setStudentHistory] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isHR = ['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER'].includes(userRole);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch base options
      const [deptRes, progRes] = await Promise.all([
        apiClient.get('/departments').catch(() => ({ data: [] })),
        apiClient.get('/programs').catch(() => ({ data: [] })),
      ]);
      setDepartments(deptRes.data || []);
      setPrograms(progRes.data || []);

      // If user is STUDENT, fetch current student record to resolve studentId
      let resolvedStudentId: number | undefined;
      if (userRole === 'STUDENT') {
        const studentRes = await apiClient.get('/students').catch(() => ({ data: [] }));
        const matched = studentRes.data?.find((s: any) => s.userId === user?.id);
        if (matched) {
          resolvedStudentId = matched.id;
          setCurrentStudentId(matched.id);
        }
      }

      // Fetch placement analytics
      const analRes = await apiClient.get('/placement/analytics').catch(() => ({ data: null }));
      setAnalytics(analRes.data);

      // Fetch companies and recruiters
      const [compRes, recRes] = await Promise.all([
        apiClient.get('/companies').catch(() => ({ data: [] })),
        apiClient.get('/recruiters').catch(() => ({ data: [] })),
      ]);
      setCompanies(compRes.data || []);
      setRecruiters(recRes.data || []);

      // Fetch job postings
      const jobRes = await apiClient.get('/jobs').catch(() => ({ data: [] }));
      setJobs(jobRes.data || []);

      // Fetch applications
      const appRes = await apiClient.get('/applications').catch(() => ({ data: [] }));
      setApplications(appRes.data || []);

      // Fetch personal student history if applicable
      if (userRole === 'STUDENT' && resolvedStudentId) {
        const historyRes = await apiClient.get(`/students/${resolvedStudentId}/placements`).catch(() => ({ data: null }));
        setStudentHistory(historyRes.data);
      } else if (userRole === 'STUDENT') {
        setStudentHistory(null);
      }

    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load placement module.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // =========================================================================
  // ACTIONS PROXY
  // =========================================================================

  const handleCreateCompany = async (companyData: any) => {
    await apiClient.post('/companies', companyData);
    await loadData();
  };

  const handleUpdateCompany = async (id: number, companyData: any) => {
    await apiClient.put(`/companies/${id}`, companyData);
    await loadData();
  };

  const handleDeleteCompany = async (id: number) => {
    await apiClient.delete(`/companies/${id}`);
    await loadData();
  };

  const handleVerifyRecruiter = async (id: number, verified: boolean) => {
    await apiClient.patch(`/recruiters/${id}/verify`, { verified });
    await loadData();
  };

  const handleCreateRecruiter = async (recruiterData: any) => {
    await apiClient.post('/recruiters', recruiterData);
    await loadData();
  };

  const handlePostJob = async (jobData: any) => {
    await apiClient.post('/jobs', jobData);
    await loadData();
  };

  const handleApplyJob = async (jobPostingId: number, applicationData: { resumeUrl: string; coverLetter?: string }) => {
    await apiClient.post('/jobs/apply', { jobPostingId, ...applicationData });
    await loadData();
  };

  const handleUpdateApplicationStatus = async (id: number, status: string, additionalFields?: any) => {
    await apiClient.patch(`/applications/${id}/status`, { applicationStatus: status, ...additionalFields });
    await loadData();
  };

  // Determine applied job IDs for student state tracking
  const appliedJobIds = applications
    .filter((app) => userRole !== 'STUDENT' || app.studentId === currentStudentId)
    .map((app) => app.jobPostingId);

  return (
    <PageContainer>
      <div id="placement-module-container">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 flex items-center gap-2.5">
            <Award className="h-8 w-8 text-blue-600" />
            Placement & Career Services
          </h1>
          <p className="text-gray-500 mt-1">
            Browse verified career postings, check academic eligibility, and coordinate interviews with partner firms.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-100 overflow-x-auto pb-px mb-8 scrollbar-none gap-8" id="placement-tabs-nav">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-sm font-bold transition whitespace-nowrap flex items-center gap-2 relative ${
            activeTab === 'overview'
              ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          id="tab-btn-overview"
        >
          <BarChart2 className="h-4 w-4" />
          Dashboard & Analytics
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`pb-4 text-sm font-bold transition whitespace-nowrap flex items-center gap-2 relative ${
            activeTab === 'companies'
              ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          id="tab-btn-companies"
        >
          <Building2 className="h-4 w-4" />
          Partner Companies
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-4 text-sm font-bold transition whitespace-nowrap flex items-center gap-2 relative ${
            activeTab === 'jobs'
              ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          id="tab-btn-jobs"
        >
          <Briefcase className="h-4 w-4" />
          Careers Directory
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-4 text-sm font-bold transition whitespace-nowrap flex items-center gap-2 relative ${
            activeTab === 'applications'
              ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          id="tab-btn-applications"
        >
          <FileText className="h-4 w-4" />
          Applications Pool
        </button>

        {userRole === 'STUDENT' && (
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 text-sm font-bold transition whitespace-nowrap flex items-center gap-2 relative ${
              activeTab === 'history'
                ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            id="tab-btn-history"
          >
            <Milestone className="h-4 w-4" />
            My Career Pipeline
          </button>
        )}
      </div>

      {/* Primary loading / error handles */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-500 text-sm">Synchronizing database and eligibility criteria...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-800">
          <ShieldAlert className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-bold">Initialization Error</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="transition-all duration-300">
          {activeTab === 'overview' && (
            <PlacementOverview
              analytics={analytics}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              userRole={userRole}
            />
          )}

          {activeTab === 'companies' && (
            <PlacementCompanies
              companies={companies}
              recruiters={recruiters}
              userRole={userRole}
              onCreateCompany={handleCreateCompany}
              onUpdateCompany={handleUpdateCompany}
              onDeleteCompany={handleDeleteCompany}
              onVerifyRecruiter={handleVerifyRecruiter}
              onCreateRecruiter={handleCreateRecruiter}
            />
          )}

          {activeTab === 'jobs' && (
            <PlacementJobs
              jobs={jobs}
              userRole={userRole}
              departments={departments}
              programs={programs}
              companies={companies}
              currentStudentId={currentStudentId}
              onPostJob={handlePostJob}
              onApplyJob={handleApplyJob}
              appliedJobIds={appliedJobIds}
            />
          )}

          {activeTab === 'applications' && (
            <PlacementApplications
              applications={applications}
              userRole={userRole}
              onUpdateStatus={handleUpdateApplicationStatus}
            />
          )}

          {activeTab === 'history' && userRole === 'STUDENT' && (
            <PlacementStudentHistory
              studentData={studentHistory}
              onUpdateStatus={handleUpdateApplicationStatus}
            />
          )}
        </div>
      )}
      </div>
    </PageContainer>
  );
};
export default PlacementPage;
