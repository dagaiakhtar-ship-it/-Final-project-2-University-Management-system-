import React, { useState, useEffect } from 'react';
import { 
  Award, LayoutDashboard, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, Users, FileSpreadsheet, Plus, Edit3, Trash2, Search, 
  Check, Eye, RefreshCw, Layers, Calendar, ClipboardCheck, ArrowUpRight, 
  BookOpen, FolderOpen, Sliders, ChevronRight, HelpCircle, FileText
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, PieChart as RechartPie, 
  Pie, Cell, LineChart, Line, RadialBarChart, RadialBar
} from 'recharts';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';

// Static fallbacks for rich simulation of CQI & Audit logs when no database records exist
const STATIC_AUDITS = [
  { id: 1, type: 'Internal', program: 'BS Computer Science', date: '2026-08-10', auditor: 'Dr. Sarah Jenkins', status: 'Scheduled', findings: 'Pending' },
  { id: 2, type: 'External', program: 'BS Electrical Engineering', date: '2026-09-15', auditor: 'ABET Review Committee', status: 'Planned', findings: 'None' },
  { id: 3, type: 'Internal', program: 'BS Business Administration', date: '2026-06-20', auditor: 'Prof. Marcus Aurelius', status: 'Completed', findings: 'Minor alignment improvements needed for CLO-4.' }
];

const STATIC_CQI_ACTIONS = [
  { id: 1, action: 'Refactor CLO-3 mapping with modern web framework modules', type: 'Corrective', responsible: 'Dr. Alan Turing', deadline: '2026-09-01', status: 'In Progress' },
  { id: 2, action: 'Upgrade Database Lab infrastructure to support parallel query testing', type: 'Preventive', responsible: 'Prof. Linda Wood', deadline: '2026-10-15', status: 'Assigned' },
  { id: 3, action: 'Incorporate ethical AI discussion in CS-402 curriculum', type: 'Corrective', responsible: 'Dr. Sarah Jenkins', deadline: '2026-07-20', status: 'Completed' }
];

const STATIC_EVIDENCE_FILES = [
  { id: 1, name: 'CS_402_Syllabus_v2.pdf', category: 'Syllabus', size: '2.4 MB', uploadedBy: 'Dr. Alan Turing', date: '2026-07-02' },
  { id: 2, name: 'Midterm_Grade_Distribution_EE.xlsx', category: 'Assessment', size: '1.1 MB', uploadedBy: 'Prof. Linda Wood', date: '2026-07-05' },
  { id: 3, name: 'Alumni_Survey_Report_2025.pdf', category: 'Feedback', size: '4.8 MB', uploadedBy: 'Admin Assistant', date: '2026-06-18' }
];

export const AccreditationPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role || 'STUDENT';

  // State Management
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agencies' | 'programs' | 'obe' | 'indicators' | 'cqi' | 'audits' | 'sar' | 'evidence'>('dashboard');
  const [agencies, setAgencies] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [dbProgramsList, setDbProgramsList] = useState<any[]>([]); // Programs fetched from main database
  
  const [stats, setStats] = useState<any>({
    agenciesCount: 0,
    activeCycles: 0,
    expiringCycles: 0,
    cloCount: 0,
    ploCount: 0,
    peoCount: 0,
    cloAttainment: 84.5,
    ploAttainment: 78.2,
    peoAttainment: 81.0,
    complianceScore: 92.4,
    kpiAchievementRate: 75,
    pendingAudits: 3,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // CRUD Modal States
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Evidence states
  const [evidenceList, setEvidenceList] = useState<any[]>(STATIC_EVIDENCE_FILES);
  const [newEvidence, setNewEvidence] = useState({ name: '', category: 'Syllabus' });

  // Custom CQI local state for interactive addition
  const [cqiList, setCqiList] = useState<any[]>(STATIC_CQI_ACTIONS);
  const [newCqiAction, setNewCqiAction] = useState({ action: '', type: 'Corrective', responsible: '', deadline: '' });

  // Custom Audit local state for interactive scheduling
  const [auditList, setAuditList] = useState<any[]>(STATIC_AUDITS);
  const [newAudit, setNewAudit] = useState({ type: 'Internal', program: '', date: '', auditor: '' });

  // Form States
  const [agencyForm, setAgencyForm] = useState({
    agencyCode: '',
    agencyName: '',
    country: '',
    website: '',
    accreditationType: 'National',
    status: 'Active'
  });

  const [programForm, setProgramForm] = useState({
    agencyId: '',
    departmentId: '',
    programId: '',
    accreditationCycle: '',
    startDate: '',
    expiryDate: '',
    status: 'Planning'
  });

  const [outcomeForm, setOutcomeForm] = useState({
    outcomeType: 'CLO',
    code: '',
    title: '',
    description: '',
    departmentId: '',
    programId: ''
  });

  const [indicatorForm, setIndicatorForm] = useState({
    indicatorName: '',
    targetValue: 0,
    achievedValue: 0,
    measurementFrequency: 'Monthly',
    responsiblePerson: '',
    status: 'On Track'
  });

  const [sarForm, setSarForm] = useState({
    programId: '',
    visionMission: 'To cultivate excellence in software craftsmanship, innovation, and scientific research.',
    strengths: 'Experienced faculty, state-of-the-art laboratory facilities, high placement rate.',
    weaknesses: 'Research seed funding requires expansion, industry advisory collaboration can be strengthened.',
    plan: 'Implement a comprehensive seed funding framework (Step 67) and build industrial advisory councils.'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load Database Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        agencyRes, 
        progRes, 
        outcomeRes, 
        indicatorRes, 
        deptRes, 
        rawProgRes,
        statsRes
      ] = await Promise.all([
        apiClient.get('/accreditation/agencies'),
        apiClient.get('/accreditation/programs'),
        apiClient.get('/obe/outcomes'),
        apiClient.get('/quality/indicators'),
        apiClient.get('/departments'),
        apiClient.get('/programs'),
        apiClient.get('/accreditation/dashboard-stats'),
      ]);

      const extractHelper = (response: any, key: string): any[] => {
        if (!response?.data) return [];
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data[key])) return response.data[key];
        const envelope = response.data.data;
        if (envelope) {
          if (Array.isArray(envelope)) return envelope;
          if (Array.isArray(envelope[key])) return envelope[key];
        }
        return [];
      };

      setAgencies(extractHelper(agencyRes, 'agencies'));
      setPrograms(extractHelper(progRes, 'programs'));
      setOutcomes(extractHelper(outcomeRes, 'outcomes'));
      setIndicators(extractHelper(indicatorRes, 'indicators'));
      setDepartments(extractHelper(deptRes, 'departments'));
      setDbProgramsList(extractHelper(rawProgRes, 'programs'));
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to sync Accreditation datasets:', err);
      showToast('Database synchronization error. Showing mock metrics.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------------------------------------------------
  // 1. Agency Operations
  // ---------------------------------------------------------
  const handleOpenAgencyModal = (agency: any = null) => {
    if (agency) {
      setEditingId(agency.id);
      setAgencyForm({
        agencyCode: agency.agencyCode,
        agencyName: agency.agencyName,
        country: agency.country,
        website: agency.website || '',
        accreditationType: agency.accreditationType,
        status: agency.status
      });
    } else {
      setEditingId(null);
      setAgencyForm({
        agencyCode: '',
        agencyName: '',
        country: '',
        website: '',
        accreditationType: 'National',
        status: 'Active'
      });
    }
    setIsAgencyModalOpen(true);
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/accreditation/agencies/${editingId}`, agencyForm);
        showToast('Accreditation agency updated successfully.');
      } else {
        await apiClient.post('/accreditation/agencies', agencyForm);
        showToast('New accreditation agency cataloged.');
      }
      setIsAgencyModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving agency definition.', 'error');
    }
  };

  const handleDeleteAgency = (id: number) => {
    showConfirm(
      'Delete Accreditation Agency',
      'Are you sure you want to permanently delete this accreditation agency? All linked cycles will be removed.',
      async () => {
        try {
          await apiClient.delete(`/accreditation/agencies/${id}`);
          showToast('Agency deleted successfully.');
          fetchData();
        } catch (err) {
          showToast('Failed to delete agency.', 'error');
        }
      }
    );
  };

  // ---------------------------------------------------------
  // 2. Accreditation Program Operations
  // ---------------------------------------------------------
  const handleOpenProgModal = (cycle: any = null) => {
    if (cycle) {
      setEditingId(cycle.id);
      setProgramForm({
        agencyId: cycle.agencyId.toString(),
        departmentId: cycle.departmentId.toString(),
        programId: cycle.programId.toString(),
        accreditationCycle: cycle.accreditationCycle,
        startDate: new Date(cycle.startDate).toISOString().split('T')[0],
        expiryDate: new Date(cycle.expiryDate).toISOString().split('T')[0],
        status: cycle.status
      });
    } else {
      setEditingId(null);
      setProgramForm({
        agencyId: agencies[0]?.id?.toString() || '',
        departmentId: departments[0]?.id?.toString() || '',
        programId: dbProgramsList[0]?.id?.toString() || '',
        accreditationCycle: '2026-2031',
        startDate: '',
        expiryDate: '',
        status: 'Planning'
      });
    }
    setIsProgModalOpen(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...programForm,
        agencyId: parseInt(programForm.agencyId, 10),
        departmentId: parseInt(programForm.departmentId, 10),
        programId: parseInt(programForm.programId, 10),
      };

      if (editingId) {
        await apiClient.put(`/accreditation/programs/${editingId}`, payload);
        showToast('Accreditation cycle updated successfully.');
      } else {
        await apiClient.post('/accreditation/programs', payload);
        showToast('New accreditation cycle scheduled.');
      }
      setIsProgModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('Error saving accreditation program cycle.', 'error');
    }
  };

  const handleDeleteProgram = (id: number) => {
    showConfirm(
      'Remove Accreditation Cycle',
      'Are you sure you want to delete this program accreditation cycle?',
      async () => {
        try {
          await apiClient.delete(`/accreditation/programs/${id}`);
          showToast('Accreditation cycle removed.');
          fetchData();
        } catch (err) {
          showToast('Failed to delete accreditation cycle.', 'error');
        }
      }
    );
  };

  // ---------------------------------------------------------
  // 3. Learning Outcomes Operations
  // ---------------------------------------------------------
  const handleOpenOutcomeModal = (outcome: any = null) => {
    if (outcome) {
      setEditingId(outcome.id);
      setOutcomeForm({
        outcomeType: outcome.outcomeType,
        code: outcome.code,
        title: outcome.title,
        description: outcome.description,
        departmentId: outcome.departmentId.toString(),
        programId: outcome.programId?.toString() || ''
      });
    } else {
      setEditingId(null);
      setOutcomeForm({
        outcomeType: 'CLO',
        code: '',
        title: '',
        description: '',
        departmentId: departments[0]?.id?.toString() || '',
        programId: dbProgramsList[0]?.id?.toString() || ''
      });
    }
    setIsOutcomeModalOpen(true);
  };

  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...outcomeForm,
        departmentId: parseInt(outcomeForm.departmentId, 10),
        programId: outcomeForm.programId ? parseInt(outcomeForm.programId, 10) : null
      };

      if (editingId) {
        await apiClient.put(`/obe/outcomes/${editingId}`, payload);
        showToast('Learning outcome refactored successfully.');
      } else {
        await apiClient.post('/obe/outcomes', payload);
        showToast('New academic learning outcome defined.');
      }
      setIsOutcomeModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Error saving learning outcome details.', 'error');
    }
  };

  const handleDeleteOutcome = (id: number) => {
    showConfirm(
      'Delete Learning Outcome',
      'Are you sure you want to delete this OBE outcome definition?',
      async () => {
        try {
          await apiClient.delete(`/obe/outcomes/${id}`);
          showToast('Learning outcome removed.');
          fetchData();
        } catch (err) {
          showToast('Failed to delete learning outcome.', 'error');
        }
      }
    );
  };

  // ---------------------------------------------------------
  // 4. Quality Indicator (KPI) Operations
  // ---------------------------------------------------------
  const handleOpenIndicatorModal = (ind: any = null) => {
    if (ind) {
      setEditingId(ind.id);
      setIndicatorForm({
        indicatorName: ind.indicatorName,
        targetValue: ind.targetValue,
        achievedValue: ind.achievedValue || 0,
        measurementFrequency: ind.measurementFrequency,
        responsiblePerson: ind.responsiblePerson,
        status: ind.status
      });
    } else {
      setEditingId(null);
      setIndicatorForm({
        indicatorName: '',
        targetValue: 85,
        achievedValue: 0,
        measurementFrequency: 'Semester-wise',
        responsiblePerson: '',
        status: 'On Track'
      });
    }
    setIsIndicatorModalOpen(true);
  };

  const handleSaveIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/quality/indicators/${editingId}`, indicatorForm);
        showToast('Quality Indicator (KPI) updated successfully.');
      } else {
        await apiClient.post('/quality/indicators', indicatorForm);
        showToast('New Quality Indicator successfully registered.');
      }
      setIsIndicatorModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Error saving Quality Indicator details.', 'error');
    }
  };

  const handleDeleteIndicator = (id: number) => {
    showConfirm(
      'Remove Quality KPI',
      'Are you sure you want to delete this quality assurance KPI indicator?',
      async () => {
        try {
          await apiClient.delete(`/quality/indicators/${id}`);
          showToast('Quality Indicator deleted.');
          fetchData();
        } catch (err) {
          showToast('Failed to delete Quality KPI.', 'error');
        }
      }
    );
  };

  // ---------------------------------------------------------
  // 5. Interactive Mock Operations (CQI, Audits, Evidence)
  // ---------------------------------------------------------
  const handleAddCqiAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCqiAction.action || !newCqiAction.responsible) {
      showToast('Please fill out all CQI fields.', 'error');
      return;
    }
    const payload = {
      id: Date.now(),
      ...newCqiAction,
      status: 'Assigned'
    };
    setCqiList([payload, ...cqiList]);
    setNewCqiAction({ action: '', type: 'Corrective', responsible: '', deadline: '' });
    showToast('CQI Continuous Improvement action successfully assigned.');
  };

  const handleAddAuditSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudit.program || !newAudit.auditor || !newAudit.date) {
      showToast('Please fill out all Audit schedule fields.', 'error');
      return;
    }
    const payload = {
      id: Date.now(),
      ...newAudit,
      status: 'Scheduled',
      findings: 'Pending'
    };
    setAuditList([payload, ...auditList]);
    setNewAudit({ type: 'Internal', program: '', date: '', auditor: '' });
    showToast('Internal/External quality audit successfully scheduled.');
  };

  const handleUploadEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidence.name) {
      showToast('Please provide an evidence document filename.', 'error');
      return;
    }
    const payload = {
      id: Date.now(),
      name: newEvidence.name.endsWith('.pdf') || newEvidence.name.endsWith('.xlsx') ? newEvidence.name : `${newEvidence.name}.pdf`,
      category: newEvidence.category,
      size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      uploadedBy: `${user?.firstName || 'Faculty'} ${user?.lastName || 'Member'}`,
      date: new Date().toISOString().split('T')[0]
    };
    setEvidenceList([payload, ...evidenceList]);
    setNewEvidence({ name: '', category: 'Syllabus' });
    showToast('Evidence dossier successfully uploaded to repository.');
  };

  // Dynamic attainment calculation for Recharts UI
  const outcomeList = Array.isArray(outcomes) ? outcomes : [];
  const outcomeStats = outcomeList.reduce((acc: any, outcome: any) => {
    if (outcome.outcomeType === 'CLO') acc.clo++;
    else if (outcome.outcomeType === 'PLO') acc.plo++;
    else if (outcome.outcomeType === 'PEO') acc.peo++;
    return acc;
  }, { clo: 0, plo: 0, peo: 0 });

  const chartData = [
    { name: 'CLO Attainment', target: 80, achieved: stats.cloAttainment },
    { name: 'PLO Attainment', target: 75, achieved: stats.ploAttainment },
    { name: 'PEO Attainment', target: 70, achieved: stats.peoAttainment },
  ];

  const complianceHistoryData = [
    { year: '2022', score: 86.5 },
    { year: '2023', score: 88.2 },
    { year: '2024', score: 91.0 },
    { year: '2025', score: 92.4 },
  ];

  // Filtering Logic
  const filteredAgencies = agencies.filter(item => {
    const matchesSearch = item.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.agencyCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredPrograms = programs.filter(item => {
    const matchesSearch = item.program?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.agency?.agencyName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const filteredOutcomes = outcomes.filter(item => {
    const matchesSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? item.outcomeType === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12" id="accreditation-container">
      {/* Header section with university-themed branding */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="accreditation-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Accreditation &amp; Quality Assurance</h1>
                <p className="text-xs text-slate-500 font-medium">Outcome-Based Education (OBE), Audit Records &amp; Continuous Quality Improvement (CQI)</p>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2 min-w-[120px]">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <div>
                <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Compliance</div>
                <div className="text-xs font-bold text-indigo-900">{stats.complianceScore}%</div>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-2 min-w-[120px]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">KPI Progress</div>
                <div className="text-xs font-bold text-emerald-900">{stats.kpiAchievementRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector Navrail */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 border-t border-slate-100 overflow-x-auto scrollbar-hide py-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'agencies', label: 'Accreditation Agencies', icon: ShieldCheck },
            { id: 'programs', label: 'Program Cycles', icon: Layers },
            { id: 'obe', label: 'OBE Outcomes (CLO/PLO)', icon: BookOpen },
            { id: 'indicators', label: 'Quality KPIs', icon: Activity },
            { id: 'cqi', label: 'CQI Management', icon: Sliders },
            { id: 'audits', label: 'Audits', icon: ClipboardCheck },
            { id: 'sar', label: 'SAR (Self-Assessment)', icon: FileSpreadsheet },
            { id: 'evidence', label: 'Evidence Repository', icon: FolderOpen },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery('');
                  setStatusFilter('');
                }}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* =========================================================
            DASHBOARD VIEW
            ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6" id="dashboard-view">
            {/* KPI metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Cycle Programs</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.activeCycles || programs.length || 0}</div>
                  <p className="text-[10px] text-slate-400 font-medium">Currently undergoing quality study</p>
                </div>
                <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
                  <Layers className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring Accreditations</div>
                  <div className="text-2xl font-bold text-rose-600">{stats.expiringCycles}</div>
                  <p className="text-[10px] text-rose-500 font-medium">Expiring within 365 days</p>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outcomes Cataloged</div>
                  <div className="text-2xl font-bold text-slate-900">{(stats.cloCount + stats.ploCount + stats.peoCount) || outcomes.length || 0}</div>
                  <p className="text-[10px] text-slate-400 font-medium">{stats.cloCount || 0} CLOs • {stats.ploCount || 0} PLOs • {stats.peoCount || 0} PEOs</p>
                </div>
                <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Quality Audits</div>
                  <div className="text-2xl font-bold text-amber-600">{stats.pendingAudits}</div>
                  <p className="text-[10px] text-amber-500 font-medium">Compliance reviews scheduled</p>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Dashboard Analytics charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* OBE Attainments comparison */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Outcome-Based Education (OBE) Attainment Levels</h3>
                  <p className="text-[11px] text-slate-500">Comparing calculated student outcome attainment averages against target compliance thresholds.</p>
                </div>
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} iconSize={12} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="target" name="Target Threshold (%)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="achieved" name="Achieved Attainment (%)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Compliance score historical progress */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Institutional Compliance Trend</h3>
                  <p className="text-[11px] text-slate-500">Consolidated index tracking general external assessment readiness score across multiple years.</p>
                </div>
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={complianceHistoryData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[80, 100]} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" name="Compliance Index" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Dashboard details and summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Upcoming Quality Audits */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Quality Audits &amp; Compliance Schedule</h3>
                    <p className="text-[11px] text-slate-500">Upcoming internal mock evaluations and international agency site visits.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('audits')}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {auditList.map((audit) => (
                    <div key={audit.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            audit.type === 'External' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-800'
                          }`}>{audit.type} Audit</span>
                          <span className="text-xs font-semibold text-slate-900">{audit.program}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Auditor: {audit.auditor} • Target: {audit.date}</div>
                      </div>
                      <span className={`text-[10px] font-bold ${
                        audit.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>{audit.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CQI Open Corrective Actions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">CQI Preventive &amp; Corrective Actions</h3>
                    <p className="text-[11px] text-slate-500">Continuous Quality Improvement loops assigned to chairs and curriculum coordinators.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('cqi')}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {cqiList.slice(0, 3).map((cqi) => (
                    <div key={cqi.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{cqi.action}</p>
                        <span className={`text-[10px] font-bold ${
                          cqi.status === 'Completed' ? 'text-emerald-600' : 'text-indigo-600'
                        }`}>{cqi.status}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 border-t border-slate-200/60 pt-2 text-[10px] text-slate-500 font-medium">
                        <span>Lead: {cqi.responsible}</span>
                        <span>Deadline: {cqi.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =========================================================
            ACCREDITATION AGENCIES VIEW
            ========================================================= */}
        {activeTab === 'agencies' && (
          <div className="space-y-6" id="agencies-view">
            {/* Search and control bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search agencies by name or code..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
              {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
                <button
                  onClick={() => handleOpenAgencyModal()}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="h-4 w-4" /> Add Accreditation Agency
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Agency / Organization Name</th>
                      <th className="px-6 py-4">Scope Level</th>
                      <th className="px-6 py-4">Country</th>
                      <th className="px-6 py-4">Website</th>
                      <th className="px-6 py-4">Status</th>
                      {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredAgencies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          No accreditation agencies found. Click 'Add Accreditation Agency' to register one.
                        </td>
                      </tr>
                    ) : (
                      filteredAgencies.map((agency) => (
                        <tr key={agency.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-indigo-600">{agency.agencyCode}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{agency.agencyName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-800 text-[10px] px-2.5 py-1 rounded-full font-bold">{agency.accreditationType}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{agency.country}</td>
                          <td className="px-6 py-4">
                            {agency.website ? (
                              <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                Visit Website ↗
                              </a>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold ${
                              agency.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'
                            }`}>{agency.status}</span>
                          </td>
                          {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button 
                                  onClick={() => handleOpenAgencyModal(agency)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteAgency(agency.id)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            ACCREDITATION PROGRAMS VIEW
            ========================================================= */}
        {activeTab === 'programs' && (
          <div className="space-y-6" id="programs-view">
            {/* Search and control bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by program or agency name..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="">All Cycle Statuses</option>
                  <option value="Planning">Planning</option>
                  <option value="Self Study">Self Study</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
                <button
                  onClick={() => handleOpenProgModal()}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="h-4 w-4" /> New Cycle Program
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Academic Program</th>
                      <th className="px-6 py-4">Accreditation Agency</th>
                      <th className="px-6 py-4">Cycle Period</th>
                      <th className="px-6 py-4">Active Date</th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4">Status</th>
                      {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredPrograms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          No accredited academic program cycles found. 
                        </td>
                      </tr>
                    ) : (
                      filteredPrograms.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{item.program?.name || `Program #${item.programId}`}</div>
                            <div className="text-[10px] text-slate-400 font-medium">Dept: {item.department?.name || `Department #${item.departmentId}`}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{item.agency?.agencyName || 'Agency Loading'}</div>
                            <div className="text-[10px] text-indigo-500 font-bold">{item.agency?.agencyCode}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-bold">{item.accreditationCycle}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(item.startDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-600">{new Date(item.expiryDate).toLocaleDateString()}</div>
                            {new Date(item.expiryDate) < new Date() && (
                              <span className="text-[9px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full">EXPIRED</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold ${
                              item.status === 'Approved' ? 'text-emerald-600' :
                              item.status === 'Under Review' ? 'text-amber-600' : 'text-indigo-600'
                            }`}>{item.status}</span>
                          </td>
                          {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button 
                                  onClick={() => handleOpenProgModal(item)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProgram(item.id)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            OBE OUTCOMES VIEW (CLO/PLO/PEO)
            ========================================================= */}
        {activeTab === 'obe' && (
          <div className="space-y-6" id="obe-view">
            {/* Search and control bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code, title or description..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="">All Types (CLO/PLO/PEO)</option>
                  <option value="CLO">Course Learning Outcomes (CLO)</option>
                  <option value="PLO">Program Learning Outcomes (PLO)</option>
                  <option value="PEO">Program Educational Objectives (PEO)</option>
                </select>
              </div>
              {['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole) && (
                <button
                  onClick={() => handleOpenOutcomeModal()}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="h-4 w-4" /> Map Learning Outcome
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Outcome Type</th>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Outcome Statement Description</th>
                      <th className="px-6 py-4">Target Department</th>
                      <th className="px-6 py-4">Course Program Mapping</th>
                      {['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole) && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredOutcomes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          No learning outcomes mapped. Click 'Map Learning Outcome' to catalog one.
                        </td>
                      </tr>
                    ) : (
                      filteredOutcomes.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              item.outcomeType === 'CLO' ? 'bg-indigo-50 text-indigo-700' :
                              item.outcomeType === 'PLO' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                            }`}>{item.outcomeType}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{item.code}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{item.title}</td>
                          <td className="px-6 py-4 max-w-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</td>
                          <td className="px-6 py-4 text-slate-600">{item.department?.name || `Dept #${item.departmentId}`}</td>
                          <td className="px-6 py-4 text-slate-600 font-bold">{item.program?.shortName || item.program?.name || 'All Programs / Inst'}</td>
                          {['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole) && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button 
                                  onClick={() => handleOpenOutcomeModal(item)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteOutcome(item.id)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            QUALITY KPIS VIEW
            ========================================================= */}
        {activeTab === 'indicators' && (
          <div className="space-y-6" id="indicators-view">
            {/* Search and control bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Quality KPI indicators..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
              {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
                <button
                  onClick={() => handleOpenIndicatorModal()}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="h-4 w-4" /> Add Quality Indicator
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Indicator metric Name</th>
                      <th className="px-6 py-4">Target threshold Value</th>
                      <th className="px-6 py-4">Achieved Value</th>
                      <th className="px-6 py-4">Measurement Frequency</th>
                      <th className="px-6 py-4">Responsible administrator</th>
                      <th className="px-6 py-4">Status</th>
                      {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {indicators.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          No Quality Indicators defined. Click 'Add Quality Indicator' to initialize your KPIs.
                        </td>
                      </tr>
                    ) : (
                      indicators.filter(ind => ind.indicatorName.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-900">{item.indicatorName}</td>
                          <td className="px-6 py-4 text-slate-600 font-bold">{item.targetValue}%</td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${
                              item.achievedValue >= item.targetValue ? 'text-emerald-600' : 'text-rose-500'
                            }`}>{item.achievedValue ? `${item.achievedValue}%` : 'Not Measured'}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{item.measurementFrequency}</td>
                          <td className="px-6 py-4 text-slate-700">{item.responsiblePerson}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                              item.status === 'At Risk' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                            }`}>{item.status}</span>
                          </td>
                          {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button 
                                  onClick={() => handleOpenIndicatorModal(item)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteIndicator(item.id)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            CQI MANAGEMENT VIEW
            ========================================================= */}
        {activeTab === 'cqi' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="cqi-view">
            
            {/* Create Action Form Column */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Assign Corrective &amp; Preventive Action (CAPA)</h3>
                <p className="text-[11px] text-slate-500">Initiate Continuous Quality Improvement (CQI) assignments corresponding to course assessment gaps.</p>
              </div>

              <form onSubmit={handleAddCqiAction} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">CQI Action Description</label>
                  <textarea 
                    rows={3}
                    value={newCqiAction.action}
                    onChange={(e) => setNewCqiAction({ ...newCqiAction, action: e.target.value })}
                    placeholder="e.g., Introduce industry guest lectures on quantum cryptography protocols."
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500 transition font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">CAPA Type</label>
                    <select
                      value={newCqiAction.type}
                      onChange={(e) => setNewCqiAction({ ...newCqiAction, type: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="Corrective">Corrective</option>
                      <option value="Preventive">Preventive</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Target Deadline</label>
                    <input 
                      type="date"
                      value={newCqiAction.deadline}
                      onChange={(e) => setNewCqiAction({ ...newCqiAction, deadline: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Responsible QA Administrator</label>
                  <input 
                    type="text"
                    value={newCqiAction.responsible}
                    onChange={(e) => setNewCqiAction({ ...newCqiAction, responsible: e.target.value })}
                    placeholder="Dr. Alan Turing"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 transition font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  Create &amp; Assign CAPA Task
                </button>
              </form>
            </div>

            {/* List Action Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900">CQI Loop Action Items</h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cqiList.length} Active Loops</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {cqiList.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.type === 'Corrective' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>{item.type} Loop</span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 leading-relaxed">{item.action}</h4>
                        </div>
                        <span className={`text-xs font-bold flex items-center gap-1 ${
                          item.status === 'Completed' ? 'text-emerald-600' : 'text-indigo-600'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            item.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'
                          }`} />
                          {item.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>Lead Administrator: <strong className="text-slate-800">{item.responsible}</strong></span>
                        <span>Deadline Target: <strong className="text-slate-800">{item.deadline}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================
            AUDIT VIEW
            ========================================================= */}
        {activeTab === 'audits' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="audits-view">
            
            {/* Create Audit Form Column */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schedule Quality Evaluation / Audit</h3>
                <p className="text-[11px] text-slate-500">Plan and dispatch internal and external panels for academic program audit.</p>
              </div>

              <form onSubmit={handleAddAuditSchedule} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Target Academic Program</label>
                  <select
                    value={newAudit.program}
                    onChange={(e) => setNewAudit({ ...newAudit, program: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="">Select Target Program</option>
                    {dbProgramsList.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    <option value="BS Computer Science">BS Computer Science</option>
                    <option value="BS Electrical Engineering">BS Electrical Engineering</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Audit Level</label>
                    <select
                      value={newAudit.type}
                      onChange={(e) => setNewAudit({ ...newAudit, type: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="Internal">Internal Mock</option>
                      <option value="External">External Agency</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Evaluation Date</label>
                    <input 
                      type="date"
                      value={newAudit.date}
                      onChange={(e) => setNewAudit({ ...newAudit, date: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Assigned Evaluator / Auditor</label>
                  <input 
                    type="text"
                    value={newAudit.auditor}
                    onChange={(e) => setNewAudit({ ...newAudit, auditor: e.target.value })}
                    placeholder="e.g., ABET Review Panel"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 transition font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  Schedule Quality Evaluation
                </button>
              </form>
            </div>

            {/* List Evaluation Schedule Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Accreditation Audit Track</h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{auditList.length} Active Audits</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {auditList.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.type === 'External' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-800'
                          }`}>{item.type} Audit</span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{item.program}</h4>
                        </div>
                        <span className={`text-xs font-semibold ${
                          item.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>{item.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Auditor Panel: {item.auditor} • Target Evaluation Date: {item.date}</p>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-600 leading-relaxed">
                        <strong>Findings:</strong> {item.findings}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================
            SELF ASSESSMENT REPORTS (SAR) VIEW
            ========================================================= */}
        {activeTab === 'sar' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fadeIn" id="sar-view">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Self Assessment Report (SAR) Builder</h3>
              <p className="text-[11px] text-slate-500">Draft institutional Self Study dossiers with internal quality metrics compiled dynamically.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Select Target Academic Program</label>
                  <select
                    value={sarForm.programId}
                    onChange={(e) => setSarForm({ ...sarForm, programId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="">Select Program</option>
                    {dbProgramsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value="CS">BS Computer Science</option>
                    <option value="EE">BS Electrical Engineering</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">1. Program Educational Vision &amp; Mission</label>
                  <textarea 
                    rows={3}
                    value={sarForm.visionMission}
                    onChange={(e) => setSarForm({ ...sarForm, visionMission: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500 transition leading-relaxed font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">2. Program Strengths Identified</label>
                  <textarea 
                    rows={3}
                    value={sarForm.strengths}
                    onChange={(e) => setSarForm({ ...sarForm, strengths: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500 transition leading-relaxed font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">3. Gaps &amp; Weaknesses Identified</label>
                  <textarea 
                    rows={3}
                    value={sarForm.weaknesses}
                    onChange={(e) => setSarForm({ ...sarForm, weaknesses: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500 transition leading-relaxed font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">4. Continuous Improvement Action Plan</label>
                  <textarea 
                    rows={3}
                    value={sarForm.plan}
                    onChange={(e) => setSarForm({ ...sarForm, plan: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500 transition leading-relaxed font-semibold text-slate-700"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      if (!sarForm.programId) {
                        showToast('Please select a target program.', 'error');
                        return;
                      }
                      showToast('SAR Report successfully generated and submitted to Quality Council.');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" /> Finalize &amp; Submit SAR Report
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================
            EVIDENCE DOSSIER REPOSITORY VIEW
            ========================================================= */}
        {activeTab === 'evidence' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="evidence-view">
            
            {/* Upload form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Accreditation Evidence</h3>
                <p className="text-[11px] text-slate-500">Attach syllabus revisions, graded assessment matrices, and student course reports.</p>
              </div>

              <form onSubmit={handleUploadEvidence} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Evidence Document Name</label>
                  <input 
                    type="text"
                    value={newEvidence.name}
                    onChange={(e) => setNewEvidence({ ...newEvidence, name: e.target.value })}
                    placeholder="e.g., CS_402_Syllabus_v2"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 transition font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Assessment Category</label>
                  <select
                    value={newEvidence.category}
                    onChange={(e) => setNewEvidence({ ...newEvidence, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Syllabus">Syllabus Mapping</option>
                    <option value="Assessment">Assessment matrix</option>
                    <option value="Feedback">Student feedback</option>
                    <option value="Compliance">Policy Dossier</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  Upload Evidence Document
                </button>
              </form>
            </div>

            {/* Archive list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Evidence Dossier Archive</h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{evidenceList.length} Files</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {evidenceList.map((item) => (
                    <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{item.category}</span>
                          <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">Uploaded by: {item.uploadedBy} • Date: {item.date} • Size: {item.size}</p>
                      </div>
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          showToast(`Downloading file ${item.name} from cloud storage.`);
                        }}
                        className="text-indigo-600 hover:underline text-xs font-bold"
                      >
                        Download ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* =========================================================
          MODAL DIALOGS
          ========================================================= */}

      {/* 1. AGENCY MODAL */}
      {isAgencyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fadeIn" id="agency-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-950">{editingId ? 'Edit Accreditation Agency' : 'Register Accreditation Agency'}</h3>
              <button onClick={() => setIsAgencyModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition font-bold text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveAgency} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Agency code</label>
                  <input 
                    type="text"
                    required
                    value={agencyForm.agencyCode}
                    onChange={(e) => setAgencyForm({ ...agencyForm, agencyCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., ABET"
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Accreditation Type</label>
                  <select
                    value={agencyForm.accreditationType}
                    onChange={(e) => setAgencyForm({ ...agencyForm, accreditationType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="National">National</option>
                    <option value="International">International</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Agency full name</label>
                <input 
                  type="text"
                  required
                  value={agencyForm.agencyName}
                  onChange={(e) => setAgencyForm({ ...agencyForm, agencyName: e.target.value })}
                  placeholder="e.g., Accreditation Board for Engineering &amp; Tech"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Country</label>
                  <input 
                    type="text"
                    required
                    value={agencyForm.country}
                    onChange={(e) => setAgencyForm({ ...agencyForm, country: e.target.value })}
                    placeholder="e.g., USA"
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                  <select
                    value={agencyForm.status}
                    onChange={(e) => setAgencyForm({ ...agencyForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Website URL</label>
                <input 
                  type="url"
                  value={agencyForm.website}
                  onChange={(e) => setAgencyForm({ ...agencyForm, website: e.target.value })}
                  placeholder="https://www.abet.org"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAgencyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  Save Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PROGRAM MODAL */}
      {isProgModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fadeIn" id="program-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-950">{editingId ? 'Edit Accreditation Program Cycle' : 'Schedule Accreditation Program Cycle'}</h3>
              <button onClick={() => setIsProgModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition font-bold text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveProgram} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Accreditation Agency</label>
                <select
                  required
                  value={programForm.agencyId}
                  onChange={(e) => setProgramForm({ ...programForm, agencyId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                >
                  <option value="">Select Agency</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>{agency.agencyName} ({agency.agencyCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
                  <select
                    required
                    value={programForm.departmentId}
                    onChange={(e) => setProgramForm({ ...programForm, departmentId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Academic Program</label>
                  <select
                    required
                    value={programForm.programId}
                    onChange={(e) => setProgramForm({ ...programForm, programId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="">Select Program</option>
                    {dbProgramsList.map((prog) => (
                      <option key={prog.id} value={prog.id}>{prog.name}</option>
                    ))}
                    <option value="1">BS Computer Science</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Accreditation Cycle Period</label>
                  <input 
                    type="text"
                    required
                    value={programForm.accreditationCycle}
                    onChange={(e) => setProgramForm({ ...programForm, accreditationCycle: e.target.value })}
                    placeholder="e.g., 2026-2031"
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Current status</label>
                  <select
                    value={programForm.status}
                    onChange={(e) => setProgramForm({ ...programForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Self Study">Self Study</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cycle Start Date</label>
                  <input 
                    type="date"
                    required
                    value={programForm.startDate}
                    onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cycle Expiry Date</label>
                  <input 
                    type="date"
                    required
                    value={programForm.expiryDate}
                    onChange={(e) => setProgramForm({ ...programForm, expiryDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsProgModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  Save Cycle Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. OUTCOME MODAL */}
      {isOutcomeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fadeIn" id="outcome-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-950">{editingId ? 'Edit Learning Outcome mapping' : 'Map Learning Outcome (OBE)'}</h3>
              <button onClick={() => setIsOutcomeModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition font-bold text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveOutcome} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Outcome Type</label>
                  <select
                    value={outcomeForm.outcomeType}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, outcomeType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="CLO">Course Learning Outcome (CLO)</option>
                    <option value="PLO">Program Learning Outcome (PLO)</option>
                    <option value="PEO">Program Educational Objective (PEO)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Outcome code</label>
                  <input 
                    type="text"
                    required
                    value={outcomeForm.code}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., CLO-1"
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Outcome Title</label>
                <input 
                  type="text"
                  required
                  value={outcomeForm.title}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, title: e.target.value })}
                  placeholder="e.g., Software Architecture Synthesis"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Outcome Statement Description</label>
                <textarea 
                  rows={3}
                  required
                  value={outcomeForm.description}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, description: e.target.value })}
                  placeholder="Formulate precise objective, e.g., Synthesize design patterns supporting reliable real-time full-stack architectures."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-indigo-500 transition leading-relaxed font-semibold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Target Department</label>
                  <select
                    required
                    value={outcomeForm.departmentId}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, departmentId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Course Program Mapping</label>
                  <select
                    value={outcomeForm.programId}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, programId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="">Institution-Wide / All</option>
                    {dbProgramsList.map((prog) => (
                      <option key={prog.id} value={prog.id}>{prog.name}</option>
                    ))}
                    <option value="1">BS Computer Science</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsOutcomeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  Save Outcome Mappings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. INDICATOR MODAL */}
      {isIndicatorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fadeIn" id="indicator-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-950">{editingId ? 'Edit Quality Indicator' : 'Add Quality Indicator'}</h3>
              <button onClick={() => setIsIndicatorModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition font-bold text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveIndicator} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Indicator Metric Name</label>
                <input 
                  type="text"
                  required
                  value={indicatorForm.indicatorName}
                  onChange={(e) => setIndicatorForm({ ...indicatorForm, indicatorName: e.target.value })}
                  placeholder="e.g., Graduation rate within nominal study duration"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Target threshold Value (%)</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={indicatorForm.targetValue}
                    onChange={(e) => setIndicatorForm({ ...indicatorForm, targetValue: parseFloat(e.target.value) || 0 })}
                    placeholder="85"
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Achieved value (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={indicatorForm.achievedValue}
                    onChange={(e) => setIndicatorForm({ ...indicatorForm, achievedValue: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Measurement Frequency</label>
                  <select
                    value={indicatorForm.measurementFrequency}
                    onChange={(e) => setIndicatorForm({ ...indicatorForm, measurementFrequency: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semester-wise">Semester-wise</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Current KPI Status</label>
                  <select
                    value={indicatorForm.status}
                    onChange={(e) => setIndicatorForm({ ...indicatorForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Responsible Administrator</label>
                <input 
                  type="text"
                  required
                  value={indicatorForm.responsiblePerson}
                  onChange={(e) => setIndicatorForm({ ...indicatorForm, responsiblePerson: e.target.value })}
                  placeholder="e.g., QA Director Marcus"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsIndicatorModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  Save Indicator KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CONFIRMATION MODAL */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-55">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-950 text-sm">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button 
                onClick={() => setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
                }}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-xl transition ${
                  confirmModal.title.toLowerCase().includes('delete') || confirmModal.title.toLowerCase().includes('remove')
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-55 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl max-w-sm border transition-all duration-300 animate-slideUp ${
          toast.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100/40' 
            : toast.type === 'info' 
              ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-blue-100/40' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100/40'
        }`}>
          <div className="flex-grow text-xs font-bold leading-tight">{toast.message}</div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-900 transition font-bold text-sm">✕</button>
        </div>
      )}

    </div>
  );
};
