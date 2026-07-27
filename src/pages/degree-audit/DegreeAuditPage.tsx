import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/api-client';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { 
  GraduationCap, 
  BarChart2, 
  Search, 
  FileText, 
  Sparkles, 
  User, 
  AlertCircle,
  Database,
  CheckCircle,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { AuditSummary } from '../../components/degree-audit/AuditSummary';
import { WhatIfSimulation } from '../../components/degree-audit/WhatIfSimulation';
import { GraduationApplications } from '../../components/degree-audit/GraduationApplications';
import { AdvisorRegistrarReview } from '../../components/degree-audit/AdvisorRegistrarReview';
import { AuditAnalytics } from '../../components/degree-audit/AuditAnalytics';

export const DegreeAuditPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';
  const isStudent = userRole === 'STUDENT';

  // State
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [allAudits, setAllAudits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(isStudent ? 'audit' : 'analytics');
  const [loading, setLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Fetch student profile if user is student, otherwise fetch list of all students
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        if (isStudent) {
          // If student, run the audit directly which fetches their own profile natively!
          const auditRes = await apiClient.get('/degree-audit/0');
          const data = auditRes.data?.data || auditRes.data;
          setAuditData(data);
          setSelectedStudentId(data?.student?.id || 0);
        } else {
          // Fetch student options
          const studRes = await apiClient.get('/students');
          const list = studRes.data?.data || studRes.data || [];
          setStudents(list);
          if (list.length > 0) {
            setSelectedStudentId(list[0].id);
            // Run audit for the first student
            try {
              const firstAudit = await apiClient.get(`/degree-audit/${list[0].id}`);
              setAuditData(firstAudit.data?.data || firstAudit.data);
            } catch (err) {
              console.error('Failed to load first student audit', err);
            }
          }

          // Fetch all audits for analytics
          const allRes = await apiClient.get('/degree-audit');
          setAllAudits(allRes.data?.data || allRes.data || []);
        }
      } catch (err) {
        console.error('Error bootstrapping degree audit module', err);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [isStudent]);

  // Run audit for a specific student (Advisors/Admin triggers)
  const handleRunAudit = async (studentId: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/degree-audit/${studentId}`);
      const data = res.data?.data || res.data;
      setAuditData(data);
      setSelectedStudentId(studentId);
      
      // Refresh global audits if in advisor view
      if (!isStudent) {
        const allRes = await apiClient.get('/degree-audit');
        setAllAudits(allRes.data?.data || allRes.data || []);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to trigger audit execution.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(st => 
    st.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) || 
    st.registrationNumber?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Title Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
              Degree Audit & Graduation Management
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            {isStudent 
              ? 'Evaluate your program requirements compliance, simulate pass parameters, and file for graduation' 
              : 'Monitor advisee academic standings, process graduation filings, and check university graduation indices'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs bar */}
      <div className="flex border-b border-slate-100 gap-1 overflow-x-auto pb-0.5">
        {isStudent ? (
          <>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                activeTab === 'audit' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              My Degree Audit
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'simulation' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sparkles className="h-4 w-4" /> What-If Simulation
            </button>
            <button
              onClick={() => setActiveTab('application')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                activeTab === 'application' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Apply for Graduation
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'analytics' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart2 className="h-4 w-4" /> Executive Analytics
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                activeTab === 'audit' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Audit Console
            </button>
            <button
              onClick={() => setActiveTab('filings')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                activeTab === 'filings' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Graduation Filings
            </button>
          </>
        )}
      </div>

      {/* Tabs Panels Container */}
      <div className="space-y-6">
        
        {/* Advisor console: student selector in Audit tab */}
        {!isStudent && activeTab === 'audit' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Advisee List Search</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2 flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Selected Student</label>
                <select
                  value={selectedStudentId || ''}
                  onChange={e => handleRunAudit(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="" disabled>-- Choose Advisee --</option>
                  {filteredStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.registrationNumber}) - {st.program?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'analytics' && !isStudent && (
          <AuditAnalytics audits={allAudits} />
        )}

        {activeTab === 'audit' && (
          <div className="space-y-8">
            <AuditSummary 
              auditData={auditData} 
              onRefresh={() => selectedStudentId && handleRunAudit(selectedStudentId)} 
              loading={loading}
            />

            {/* Render what-if simulation panel inside Advisor Audit tab as well! Super useful! */}
            {auditData && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">What-If Graduation Simulator</h3>
                <WhatIfSimulation 
                  studentId={selectedStudentId || 0}
                  currentCGPA={auditData.currentCGPA}
                  completedCredits={auditData.completedCredits}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'simulation' && isStudent && auditData && (
          <WhatIfSimulation 
            studentId={selectedStudentId || 0}
            currentCGPA={auditData.currentCGPA}
            completedCredits={auditData.completedCredits}
          />
        )}

        {activeTab === 'application' && isStudent && auditData && (
          <GraduationApplications 
            studentId={selectedStudentId || 0}
            isEligible={auditData.graduationStatus === 'Eligible'}
          />
        )}

        {activeTab === 'filings' && !isStudent && (
          <AdvisorRegistrarReview 
            onSelectStudent={(studentId) => {
              handleRunAudit(studentId);
              setActiveTab('audit');
            }}
          />
        )}
      </div>
    </div>
  );
};
