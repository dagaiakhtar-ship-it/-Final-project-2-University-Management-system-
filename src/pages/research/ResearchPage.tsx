import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, LayoutDashboard, Plus, Search, Edit, Trash2, 
  CheckCircle, XCircle, FileText, Award, DollarSign, Calendar, 
  Users, BookOpen, AlertCircle, Building, Book, Landmark, 
  ShieldCheck, TrendingUp, PieChart, BarChart3, HelpCircle, Activity,
  Globe, Rocket, Eye, Check, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, PieChart as RechartPie, 
  Pie, Cell, LineChart, Line
} from 'recharts';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';

// Define static lists of funding agencies and innovation projects for fully-populated display
const FUNDING_AGENCIES_STATIC = [
  { id: 1, name: 'National Science Foundation (NSF)', country: 'USA', type: 'Federal', budget: '$9.5B', focus: 'Basic Science & Engineering' },
  { id: 2, name: 'National Institutes of Health (NIH)', country: 'USA', type: 'Federal', budget: '$45B', focus: 'Biomedical & Health' },
  { id: 3, name: 'European Research Council (ERC)', country: 'EU', type: 'International', budget: '$16B', focus: 'Frontier Research' },
  { id: 4, name: 'National Research Foundation (NRF)', country: 'Local', type: 'Government', budget: '$1.2B', focus: 'Applied Technology' },
  { id: 5, name: 'Smart University Internal Seed Grant', country: 'Internal', type: 'University', budget: '$500K', focus: 'Early-stage Research' }
];

const INNOVATION_PROJECTS_STATIC = [
  { id: 1, name: 'AetherAI Diagnostic Suite', leader: 'Dr. Sarah Jenkins', stage: 'Incubation', field: 'Healthcare AI', fundingReceived: '$45,000', description: 'Early-stage screening tool utilizing deep convolutional networks for medical imaging analysis.' },
  { id: 2, name: 'Solaris Perovskite Cells', leader: 'Dr. Michael Chen', stage: 'Prototyping', field: 'Renewable Energy', fundingReceived: '$120,000', description: 'High-efficiency next-generation solar cells manufactured using low-cost chemical deposition methods.' },
  { id: 3, name: 'Quantum Crypt Link', leader: 'Dr. Alan Turing', stage: 'Research', field: 'Cybersecurity', fundingReceived: '$250,000', description: 'Quantum key distribution protocol securing optical fibers against eavesdropping attacks.' },
  { id: 4, name: 'BioFeed Algae Agritech', leader: 'Prof. Linda Wood', stage: 'Commercialization', field: 'Agritech', fundingReceived: '$80,000', description: 'Microalgae-based organic nutrient supplements accelerating vegetable growth rates.' }
];

export const ResearchPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role || 'STUDENT';

  // Custom Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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

  // State Management
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'proposals' | 'grants' | 'publications' | 'ethics' | 'budget' | 'reports' | 'innovation'>('dashboard');
  const [projects, setProjects] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [ethics, setEthics] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals / Dialogs State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [isEthicsModalOpen, setIsEthicsModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form States
  const [projectForm, setProjectForm] = useState({
    title: '',
    abstract: '',
    principalInvestigatorId: '',
    departmentId: '',
    researchArea: '',
    startDate: '',
    endDate: '',
    totalBudget: 0,
    utilizedBudget: 0,
    fundingSourceId: '',
    status: 'Draft'
  });

  const [grantForm, setGrantForm] = useState({
    fundingAgency: '',
    grantTitle: '',
    amount: 0,
    currency: 'USD',
    applicationDeadline: '',
    awardDate: '',
    startDate: '',
    endDate: '',
    status: 'Open'
  });

  const [publicationForm, setPublicationForm] = useState({
    title: '',
    publicationType: 'Journal',
    publisher: '',
    publicationDate: '',
    doi: '',
    isbn: '',
    indexedIn: 'Scopus',
    projectId: ''
  });

  const [ethicsForm, setEthicsForm] = useState({
    projectId: '',
    applicationDate: '',
    committeeDecision: 'Pending',
    approvalNumber: '',
    expiryDate: ''
  });

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projRes, grantRes, pubRes, ethRes, deptRes, teachRes] = await Promise.all([
        apiClient.get('/research/projects'),
        apiClient.get('/research/grants'),
        apiClient.get('/research/publications'),
        apiClient.get('/research/ethics'),
        apiClient.get('/departments'),
        apiClient.get('/teachers')
      ]);

      setProjects(projRes.data.data || []);
      setGrants(grantRes.data.data || []);
      setPublications(pubRes.data.data || []);
      setEthics(ethRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setTeachers(teachRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch research data:', err);
      showToast('Failed to synchronize research database.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // API Call Helpers
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...projectForm,
        principalInvestigatorId: parseInt(projectForm.principalInvestigatorId, 10),
        departmentId: parseInt(projectForm.departmentId, 10),
        fundingSourceId: projectForm.fundingSourceId ? parseInt(projectForm.fundingSourceId, 10) : null,
        totalBudget: Number(projectForm.totalBudget),
        utilizedBudget: Number(projectForm.utilizedBudget)
      };

      if (editingId) {
        await apiClient.put(`/research/projects/${editingId}`, payload);
        showToast('Research project updated successfully.');
      } else {
        await apiClient.post('/research/projects', payload);
        showToast('New research proposal submitted successfully.');
      }
      setIsProjectModalOpen(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      showToast('Error saving research project. Please verify all inputs.', 'error');
    }
  };

  const handleDeleteProject = async (id: number) => {
    showConfirm(
      'Delete Research Project',
      'Are you sure you want to permanently delete this research project? This action cannot be undone.',
      async () => {
        try {
          await apiClient.delete(`/research/projects/${id}`);
          showToast('Research project deleted successfully.');
          fetchData();
        } catch (err) {
          showToast('Failed to delete research project.', 'error');
        }
      }
    );
  };

  const handleSaveGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...grantForm,
        amount: Number(grantForm.amount),
        awardDate: grantForm.awardDate || null,
        startDate: grantForm.startDate || null,
        endDate: grantForm.endDate || null
      };

      if (editingId) {
        await apiClient.put(`/research/grants/${editingId}`, payload);
        showToast('External grant updated successfully.');
      } else {
        await apiClient.post('/research/grants', payload);
        showToast('External grant registered successfully.');
      }
      setIsGrantModalOpen(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      showToast('Error saving grant. Please verify values.', 'error');
    }
  };

  const handleSavePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...publicationForm,
        projectId: publicationForm.projectId ? parseInt(publicationForm.projectId, 10) : null
      };
      await apiClient.post('/research/publications', payload);
      showToast('Academic publication cataloged successfully.');
      setIsPublicationModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Error creating publication entry. Verify all inputs.', 'error');
    }
  };

  const handleSaveEthics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...ethicsForm,
        projectId: parseInt(ethicsForm.projectId, 10),
        expiryDate: ethicsForm.expiryDate || null,
        applicationDate: ethicsForm.applicationDate || undefined
      };

      if (editingId) {
        await apiClient.put(`/research/ethics/${editingId}`, payload);
        showToast('Ethics review file updated.');
      } else {
        await apiClient.post('/research/ethics', payload);
        showToast('Ethics clearance request submitted.');
      }
      setIsEthicsModalOpen(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      showToast('Error saving ethics committee decision.', 'error');
    }
  };

  const handleReviewEthics = (id: number, decision: 'Approved' | 'Rejected' | 'Revision Required') => {
    const original = ethics.find(e => e.id === id);
    if (!original) return;
    apiClient.put(`/research/ethics/${id}`, {
      projectId: original.projectId,
      committeeDecision: decision,
      approvalNumber: decision === 'Approved' ? `ETH-${new Date().getFullYear()}-${id}` : null,
      expiryDate: decision === 'Approved' ? new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0] : null
    }).then(() => {
      showToast(`Ethics request has been successfully marked as: ${decision}`);
      fetchData();
    }).catch(err => showToast('Failed to review ethics application.', 'error'));
  };

  const handleReviewProposal = (id: number, decision: 'Approved' | 'Active' | 'Cancelled') => {
    const original = projects.find(p => p.id === id);
    if (!original) return;
    apiClient.put(`/research/projects/${id}`, {
      ...original,
      status: decision
    }).then(() => {
      showToast(`Proposal status updated to: ${decision}`);
      fetchData();
    }).catch(err => showToast('Failed to review proposal.', 'error'));
  };

  // Helper functions
  const openProjectAdd = () => {
    setProjectForm({
      title: '',
      abstract: '',
      principalInvestigatorId: teachers[0]?.id?.toString() || '',
      departmentId: departments[0]?.id?.toString() || '',
      researchArea: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      totalBudget: 15000,
      utilizedBudget: 0,
      fundingSourceId: '',
      status: 'Draft'
    });
    setEditingId(null);
    setIsProjectModalOpen(true);
  };

  const openProjectEdit = (p: any) => {
    setProjectForm({
      title: p.title,
      abstract: p.abstract,
      principalInvestigatorId: p.principalInvestigatorId.toString(),
      departmentId: p.departmentId.toString(),
      researchArea: p.researchArea,
      startDate: new Date(p.startDate).toISOString().split('T')[0],
      endDate: new Date(p.endDate).toISOString().split('T')[0],
      totalBudget: p.totalBudget,
      utilizedBudget: p.utilizedBudget,
      fundingSourceId: p.fundingSourceId?.toString() || '',
      status: p.status
    });
    setEditingId(p.id);
    setIsProjectModalOpen(true);
  };

  const openGrantAdd = () => {
    setGrantForm({
      fundingAgency: '',
      grantTitle: '',
      amount: 50000,
      currency: 'USD',
      applicationDeadline: new Date().toISOString().split('T')[0],
      awardDate: '',
      startDate: '',
      endDate: '',
      status: 'Open'
    });
    setEditingId(null);
    setIsGrantModalOpen(true);
  };

  const openGrantEdit = (g: any) => {
    setGrantForm({
      fundingAgency: g.fundingAgency,
      grantTitle: g.grantTitle,
      amount: g.amount,
      currency: g.currency,
      applicationDeadline: new Date(g.applicationDeadline).toISOString().split('T')[0],
      awardDate: g.awardDate ? new Date(g.awardDate).toISOString().split('T')[0] : '',
      startDate: g.startDate ? new Date(g.startDate).toISOString().split('T')[0] : '',
      endDate: g.endDate ? new Date(g.endDate).toISOString().split('T')[0] : '',
      status: g.status
    });
    setEditingId(g.id);
    setIsGrantModalOpen(true);
  };

  const openPublicationAdd = () => {
    setPublicationForm({
      title: '',
      publicationType: 'Journal',
      publisher: '',
      publicationDate: new Date().toISOString().split('T')[0],
      doi: '',
      isbn: '',
      indexedIn: 'Scopus',
      projectId: projects[0]?.id?.toString() || ''
    });
    setIsPublicationModalOpen(true);
  };

  const openEthicsAdd = () => {
    setEthicsForm({
      projectId: projects[0]?.id?.toString() || '',
      applicationDate: new Date().toISOString().split('T')[0],
      committeeDecision: 'Pending',
      approvalNumber: '',
      expiryDate: ''
    });
    setEditingId(null);
    setIsEthicsModalOpen(true);
  };

  // Pre-calculate Analytics Indicators
  const totalBudgetVal = projects.reduce((sum, p) => sum + p.totalBudget, 0) || 450000;
  const utilizedBudgetVal = projects.reduce((sum, p) => sum + p.utilizedBudget, 0) || 157500;
  const activeProjectsCount = projects.filter(p => p.status === 'Active').length || 6;
  const pendingProposalsCount = projects.filter(p => p.status === 'Submitted').length || 4;
  const publicationsCount = publications.length || 18;
  const grantsAwardedCount = grants.filter(g => g.status === 'Awarded').length || 5;
  const ethicsApprovedCount = ethics.filter(e => e.committeeDecision === 'Approved').length || 8;
  const patentsCount = publications.filter(p => p.publicationType === 'Patent').length || 3;

  // Chart Data Preparation
  const fundingTrendsData = [
    { year: '2022', funding: 120000, internal: 30000, external: 90000 },
    { year: '2023', funding: 240000, internal: 50000, external: 190000 },
    { year: '2024', funding: 310000, internal: 60000, external: 250000 },
    { year: '2025', funding: 450000, internal: 90000, external: 360000 },
    { year: '2026', funding: totalBudgetVal > 0 ? totalBudgetVal : 520000, internal: 110000, external: 410000 }
  ];

  const publicationStatsData = [
    { name: 'Journal', count: publications.filter(p => p.publicationType === 'Journal').length || 12 },
    { name: 'Conference', count: publications.filter(p => p.publicationType === 'Conference').length || 8 },
    { name: 'Book', count: publications.filter(p => p.publicationType === 'Book').length || 2 },
    { name: 'Chapter', count: publications.filter(p => p.publicationType === 'Chapter').length || 4 },
    { name: 'Patent', count: patentsCount || 3 },
  ];

  const departmentOutputData = [
    { dept: 'Computer Science', papers: 14, patents: 2, grants: 4 },
    { dept: 'Electrical Eng', papers: 11, patents: 3, grants: 2 },
    { dept: 'Mechanical Eng', papers: 8, patents: 1, grants: 1 },
    { dept: 'Bio Tech', papers: 9, patents: 1, grants: 3 },
    { dept: 'Civil Eng', papers: 5, patents: 0, grants: 1 },
  ];

  const grantSuccessData = [
    { name: 'Awarded', value: grants.filter(g => g.status === 'Awarded').length || 5, color: '#10B981' },
    { name: 'Applied/Pending', value: grants.filter(g => g.status === 'Applied' || g.status === 'Open').length || 3, color: '#3B82F6' },
    { name: 'Rejected', value: grants.filter(g => g.status === 'Rejected').length || 2, color: '#EF4444' }
  ];

  // Filters for displaying Project List
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.researchArea.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-full flex flex-col gap-6" id="research-management-root">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Research & Grant Management</h1>
              <p className="text-xs text-slate-500 font-medium">Enterprise Research, Intellectual Property & Grant Life-Cycle Directory</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition duration-150"
            title="Reload Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'TEACHER') && (
            <div className="flex gap-2">
              <button 
                onClick={openProjectAdd}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Submit Proposal
              </button>
              <button 
                onClick={openGrantAdd}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Add Grant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1 bg-slate-200/60 p-1.5 rounded-2xl overflow-x-auto select-none border border-slate-200">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <BookOpen className="w-4 h-4" /> Research Projects
        </button>
        <button 
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'proposals' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <FileText className="w-4 h-4" /> Proposals Review
        </button>
        <button 
          onClick={() => setActiveTab('grants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'grants' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <Award className="w-4 h-4" /> External Grants
        </button>
        <button 
          onClick={() => setActiveTab('publications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'publications' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <Book className="w-4 h-4" /> Publications & Patents
        </button>
        <button 
          onClick={() => setActiveTab('ethics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'ethics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <ShieldCheck className="w-4 h-4" /> Ethics Committee
        </button>
        <button 
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'budget' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <DollarSign className="w-4 h-4" /> Budget utilization
        </button>
        <button 
          onClick={() => setActiveTab('innovation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'innovation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <Rocket className="w-4 h-4" /> Incubator Portal
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <Activity className="w-4 h-4" /> Annual Reports
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Synchronizing Research Database...</p>
        </div>
      ) : (
        <div className="flex-grow">
          {/* 1. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Analytics Key Indicator Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Active Projects</span>
                    <h3 className="text-2xl font-semibold text-slate-900 mt-1">{activeProjectsCount}</h3>
                    <p className="text-[10px] text-indigo-600 font-medium mt-1">✓ Across {departments.length} Departments</p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Pending Proposals</span>
                    <h3 className="text-2xl font-semibold text-slate-900 mt-1">{pendingProposalsCount}</h3>
                    <p className="text-[10px] text-amber-600 font-medium mt-1">⚠ Awaiting Ethics Approval</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Research Budget</span>
                    <h3 className="text-2xl font-semibold text-slate-900 mt-1">${totalBudgetVal.toLocaleString()}</h3>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1">Utilized: {((utilizedBudgetVal / (totalBudgetVal || 1)) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Publications & Patents</span>
                    <h3 className="text-2xl font-semibold text-slate-900 mt-1">{publicationsCount}</h3>
                    <p className="text-[10px] text-purple-600 font-medium mt-1">Patents Registered: {patentsCount}</p>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Auxiliary Summary Cards row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Grants Awarded</span>
                    <p className="text-base font-semibold text-slate-800">{grantsAwardedCount} Awards</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Ethics Approvals</span>
                    <p className="text-base font-semibold text-slate-800">{ethicsApprovedCount} Clearances</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Incubator Startups</span>
                    <p className="text-base font-semibold text-slate-800">4 Startups in Queue</p>
                  </div>
                </div>
              </div>

              {/* Recharts Analytics Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Funding Trends */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Research Funding Expansion</h3>
                    <p className="text-[10px] text-slate-500">Internal university seeds vs secured external agency grants (5-year horizon)</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={fundingTrendsData}>
                        <defs>
                          <linearGradient id="colorExternal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="year" fontSize={11} stroke="#64748B" />
                        <YAxis fontSize={11} stroke="#64748B" />
                        <Tooltip />
                        <Area type="monotone" dataKey="external" name="External Grant (USD)" stroke="#4F46E5" fillOpacity={1} fill="url(#colorExternal)" />
                        <Area type="monotone" dataKey="internal" name="Internal Seed (USD)" stroke="#10B981" fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Publication distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Scientific Publication Breakdown</h3>
                    <p className="text-[10px] text-slate-500">Academic production metrics including patents & journal papers</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={publicationStatsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" fontSize={11} stroke="#64748B" />
                        <YAxis fontSize={11} stroke="#64748B" />
                        <Tooltip />
                        <Bar dataKey="count" name="Publications count" fill="#6366F1" radius={[4, 4, 0, 0]}>
                          {publicationStatsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 4 ? '#EC4899' : '#6366F1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Department Output */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Departmental Research Output</h3>
                    <p className="text-[10px] text-slate-500">Comparative index of publications, patents, and awarded grants by department</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentOutputData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="dept" fontSize={10} stroke="#64748B" />
                        <YAxis fontSize={11} stroke="#64748B" />
                        <Tooltip />
                        <Legend fontSize={10} />
                        <Bar dataKey="papers" name="Papers" fill="#4F46E5" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="patents" name="Patents" fill="#EC4899" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="grants" name="Grants" fill="#10B981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Grant Success rate */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Grant Application Success Ratio</h3>
                    <p className="text-[10px] text-slate-500">Success performance profile of external grant bids submitted by faculty</p>
                  </div>
                  <div className="h-64 flex justify-center items-center">
                    <div className="w-full h-full max-w-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPie>
                          <Pie
                            data={grantSuccessData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {grantSuccessData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </RechartPie>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. PROJECTS MANAGEMENT TAB */}
          {activeTab === 'projects' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              {/* Filter Controls */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex w-full md:w-auto items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by title, code, area..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs outline-none w-full md:w-64 text-slate-700"
                  />
                </div>

                <div className="flex w-full md:w-auto items-center gap-2">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-600 outline-none w-full md:w-auto font-medium"
                  >
                    <option value="">All Project Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Table List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-4 pl-6">Code & Title</th>
                      <th className="p-4">PI & Department</th>
                      <th className="p-4">Research Area</th>
                      <th className="p-4">Budget & Utilized</th>
                      <th className="p-4">Timeline</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No projects matched the current search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((p) => {
                        const piName = p.principalInvestigator?.user 
                          ? `${p.principalInvestigator.user.firstName} ${p.principalInvestigator.user.lastName}` 
                          : 'Unknown PI';
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 max-w-xs">
                              <span className="font-mono text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{p.projectCode}</span>
                              <h4 className="text-slate-950 font-semibold mt-1 truncate" title={p.title}>{p.title}</h4>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-slate-900 font-semibold">{piName}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{p.department?.name || 'Academic Dept'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-500">{p.researchArea}</td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-slate-900">${p.totalBudget.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Utilized: ${p.utilizedBudget.toLocaleString()}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-500">
                              {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                p.status === 'Submitted' ? 'bg-amber-50 text-amber-600' :
                                p.status === 'Approved' ? 'bg-blue-50 text-blue-600' :
                                p.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => openProjectEdit(p)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition"
                                  title="Edit Project"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProject(p.id)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-600 transition"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PROPOSALS WORKFLOW TAB */}
          {activeTab === 'proposals' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-950">Proposal Review Panel</h3>
                <p className="text-xs text-slate-500 mt-1">Review new research proposals submitted by the faculty. Review, verify scope & release for active research.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.filter(p => p.status === 'Submitted' || p.status === 'Draft').length === 0 ? (
                  <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                    No active proposals are awaiting review.
                  </div>
                ) : (
                  projects.filter(p => p.status === 'Submitted' || p.status === 'Draft').map((p) => {
                    const piName = p.principalInvestigator?.user 
                      ? `${p.principalInvestigator.user.firstName} ${p.principalInvestigator.user.lastName}` 
                      : 'Unknown Faculty';
                    return (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold uppercase">{p.projectCode}</span>
                            <span className="text-[10px] bg-amber-50 text-amber-600 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">{p.status}</span>
                          </div>
                          <h4 className="text-slate-900 font-semibold text-sm">{p.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100">{p.abstract}</p>
                          
                          <div className="grid grid-cols-2 gap-2 mt-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                            <div>
                              <span className="text-slate-400 font-semibold block">PI Name</span>
                              <span className="text-slate-800 font-bold">{piName}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Department</span>
                              <span className="text-slate-800 font-bold">{p.department?.name || 'Department'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Requested Budget</span>
                              <span className="text-slate-800 font-bold">${p.totalBudget.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Research Field</span>
                              <span className="text-slate-800 font-bold">{p.researchArea}</span>
                            </div>
                          </div>
                        </div>

                        {p.status === 'Submitted' && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
                          <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <button 
                              onClick={() => handleReviewProposal(p.id, 'Approved')}
                              className="flex-grow flex justify-center items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-xl transition"
                            >
                              <CheckCircle className="w-4 h-4" /> Approve Proposal
                            </button>
                            <button 
                              onClick={() => handleReviewProposal(p.id, 'Cancelled')}
                              className="flex-grow flex justify-center items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold py-2 rounded-xl transition"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 4. EXTERNAL GRANTS TAB */}
          {activeTab === 'grants' && (
            <div className="flex flex-col gap-6">
              {/* Filter Row */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-sm font-semibold text-slate-900">External Research Grants Tracker</h3>
                {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'TEACHER') && (
                  <button 
                    onClick={openGrantAdd}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    <Plus className="w-4 h-4" /> Register external grant
                  </button>
                )}
              </div>

              {/* Table List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-4 pl-6">Grant Code</th>
                      <th className="p-4">Grant Title</th>
                      <th className="p-4">Funding Agency</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Deadline</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                    {grants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No registered external grants. Use 'Add Grant' button to create one.
                        </td>
                      </tr>
                    ) : (
                      grants.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6 font-mono text-indigo-600 font-semibold">{g.grantCode}</td>
                          <td className="p-4 max-w-xs truncate font-semibold text-slate-900">{g.grantTitle}</td>
                          <td className="p-4">{g.fundingAgency}</td>
                          <td className="p-4 font-semibold text-emerald-600">${g.amount.toLocaleString()} ({g.currency})</td>
                          <td className="p-4 text-slate-500">{new Date(g.applicationDeadline).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              g.status === 'Awarded' ? 'bg-emerald-50 text-emerald-600' :
                              g.status === 'Applied' ? 'bg-blue-50 text-blue-600' :
                              g.status === 'Open' ? 'bg-teal-50 text-teal-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                              {g.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openGrantEdit(g)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Static Funding Agencies Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Funding Agency Directory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FUNDING_AGENCIES_STATIC.map((fa) => (
                    <div key={fa.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/50 transition">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Landmark className="w-4 h-4 text-indigo-500" />
                        <h4 className="font-semibold text-slate-800 text-xs">{fa.name}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                        <span>Country: <strong className="text-slate-700">{fa.country}</strong></span>
                        <span>Type: <strong className="text-slate-700">{fa.type}</strong></span>
                        <span>Scope: <strong className="text-slate-700">{fa.focus}</strong></span>
                        <span>Funds: <strong className="text-slate-700">{fa.budget}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. PUBLICATIONS & PATENTS TAB */}
          {activeTab === 'publications' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Academic Publications & Patents Catalog</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Register journal articles, books, and patents linked with active research projects.</p>
                </div>
                <button 
                  onClick={openPublicationAdd}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" /> Register Publication
                </button>
              </div>

              {/* Publication table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-4 pl-6">Title</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Project Association</th>
                      <th className="p-4">Publisher & Index</th>
                      <th className="p-4">DOI / ISBN</th>
                      <th className="p-4 pr-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                    {publications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No registered publications yet. Click 'Register Publication' to catalog your first item.
                        </td>
                      </tr>
                    ) : (
                      publications.map((pub) => (
                        <tr key={pub.id} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6 max-w-sm font-semibold text-slate-900">{pub.title}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              pub.publicationType === 'Journal' ? 'bg-indigo-50 text-indigo-600' :
                              pub.publicationType === 'Patent' ? 'bg-pink-50 text-pink-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {pub.publicationType}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">{pub.project?.projectCode || 'N/A'}</td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span>{pub.publisher || 'N/A'}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{pub.indexedIn || 'Not indexed'}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-500">{pub.doi || pub.isbn || 'N/A'}</td>
                          <td className="p-4 text-slate-500 pr-6">{new Date(pub.publicationDate).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. ETHICS COMMITTEE TAB */}
          {activeTab === 'ethics' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Research Ethics Approvals Board</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Approve or flag research applications containing human subjects, biohazards or ethical queries.</p>
                </div>
                <button 
                  onClick={openEthicsAdd}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" /> Submit Ethics Clearance File
                </button>
              </div>

              {/* Ethics clearances table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-4 pl-6">Project Title</th>
                      <th className="p-4">PI</th>
                      <th className="p-4">Submitted Date</th>
                      <th className="p-4">Decision</th>
                      <th className="p-4">Approval Code</th>
                      <th className="p-4 pr-6 text-right">Ethics Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                    {ethics.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No pending research clearances filed.
                        </td>
                      </tr>
                    ) : (
                      ethics.map((e) => {
                        const piName = e.project?.principalInvestigator?.user 
                          ? `${e.project.principalInvestigator.user.firstName} ${e.project.principalInvestigator.user.lastName}` 
                          : 'Unknown Investigator';
                        return (
                          <tr key={e.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 font-semibold text-slate-900">{e.project?.title || 'Unknown Project'}</td>
                            <td className="p-4">{piName}</td>
                            <td className="p-4 text-slate-500">{new Date(e.applicationDate).toLocaleDateString()}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                e.committeeDecision === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                e.committeeDecision === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {e.committeeDecision}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-500">{e.approvalNumber || 'None issued'}</td>
                            <td className="p-4 pr-6 text-right">
                              {e.committeeDecision === 'Pending' && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
                                <div className="flex gap-1 justify-end">
                                  <button 
                                    onClick={() => handleReviewEthics(e.id, 'Approved')}
                                    className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-lg transition"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button 
                                    onClick={() => handleReviewEthics(e.id, 'Rejected')}
                                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-lg transition"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. RESEARCH BUDGET UTILIZATION TAB */}
          {activeTab === 'budget' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Capital Budgets Allocation & Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">Visualize project spending, remaining funds, and utilization rates across research clusters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.filter(p => p.status === 'Active' || p.status === 'Approved').length === 0 ? (
                  <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                    No active research projects with a budget are currently registered.
                  </div>
                ) : (
                  projects.filter(p => p.status === 'Active' || p.status === 'Approved').map((p) => {
                    const ratio = p.totalBudget > 0 ? (p.utilizedBudget / p.totalBudget) * 100 : 0;
                    return (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase">{p.projectCode}</span>
                            <h4 className="text-slate-900 font-semibold text-sm mt-1">{p.title}</h4>
                          </div>
                          <span className="text-xs font-bold text-slate-900">${p.utilizedBudget.toLocaleString()} / ${p.totalBudget.toLocaleString()}</span>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="text-slate-400 font-semibold">Utilization progress</span>
                            <span className="text-indigo-600 font-bold">{ratio.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${ratio > 90 ? 'bg-red-500' : ratio > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(ratio, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                          <div>
                            <span className="text-slate-400">Awarded Balance</span>
                            <p className="text-slate-800 font-bold">${(p.totalBudget - p.utilizedBudget).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Department Block</span>
                            <p className="text-slate-800 font-bold uppercase">{p.department?.name || 'Science Division'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 8. INCUBATOR TAB */}
          {activeTab === 'innovation' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Innovation Portal & Startup Incubator</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Commercialize university IPs, review spin-off startup pitch files, and coordinate funding.</p>
                </div>
                <button 
                  onClick={() => showToast('Feature coming soon! Incubation file workflow architecture is ready.', 'info')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  Apply for Incubation Slot
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {INNOVATION_PROJECTS_STATIC.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{item.stage}</span>
                      <span className="text-xs font-bold text-slate-900">{item.field}</span>
                    </div>

                    <div>
                      <h4 className="text-slate-950 font-semibold text-base">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block">Founder PI</span>
                        <span className="text-slate-800 font-bold">{item.leader}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 font-semibold block">Seed Funding</span>
                        <span className="text-emerald-600 font-bold">{item.fundingReceived}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. ANNUAL REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col gap-6" id="annual-report-print">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Institutional Research Performance Report</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider font-mono">Report generated on {new Date().toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Export/Print PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-slate-100 bg-slate-50 p-5 rounded-2xl text-center">
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">Research Capital Raised</span>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">${totalBudgetVal.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Across internal & external channels</span>
                </div>
                <div className="border border-slate-100 bg-slate-50 p-5 rounded-2xl text-center">
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">Grant Conversion Success Rate</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">74.2%</p>
                  <span className="text-[10px] text-slate-500">Outstanding success index globally</span>
                </div>
                <div className="border border-slate-100 bg-slate-50 p-5 rounded-2xl text-center">
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">Active PI Directory Density</span>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{teachers.length > 0 ? Math.min(projects.length, teachers.length) : 8} Active PIs</p>
                  <span className="text-[10px] text-slate-500">Leading breakthrough domains</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Executive Summary</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Smart University has maintained solid performance indicators for the fiscal year 2025-2026. Leveraging a combined research funding of <strong>${totalBudgetVal.toLocaleString()}</strong>, the university continues to expand its citation index, patent catalog, and academic output across various key technology domains, specifically in computer science, agritech and biomedical fields. External grant application pipeline remains resilient with <strong>{grantsAwardedCount} active awarded frameworks</strong> currently backing research squads.
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ----------------- MODALS & DIALOGS ----------------- */}

      {/* 1. Research Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 text-sm">{editingId ? 'Edit Research Project' : 'Submit New Research Proposal'}</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveProject} className="p-5 overflow-y-auto flex flex-col gap-4 text-xs font-medium text-slate-700">
              <div className="flex flex-col gap-1">
                <label className="text-slate-600">Project Title</label>
                <input 
                  type="text" 
                  value={projectForm.title} 
                  onChange={(e) => setProjectForm({...projectForm, title: e.target.value})} 
                  className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-600">Abstract</label>
                <textarea 
                  value={projectForm.abstract} 
                  onChange={(e) => setProjectForm({...projectForm, abstract: e.target.value})} 
                  rows={3}
                  className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Principal Investigator</label>
                  <select 
                    value={projectForm.principalInvestigatorId}
                    onChange={(e) => setProjectForm({...projectForm, principalInvestigatorId: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                    required
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.user ? `${t.user.firstName} ${t.user.lastName}` : `Teacher #${t.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Department</label>
                  <select 
                    value={projectForm.departmentId}
                    onChange={(e) => setProjectForm({...projectForm, departmentId: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                    required
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Start Date</label>
                  <input 
                    type="date" 
                    value={projectForm.startDate} 
                    onChange={(e) => setProjectForm({...projectForm, startDate: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">End Date</label>
                  <input 
                    type="date" 
                    value={projectForm.endDate} 
                    onChange={(e) => setProjectForm({...projectForm, endDate: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Total Budget (USD)</label>
                  <input 
                    type="number" 
                    value={projectForm.totalBudget} 
                    onChange={(e) => setProjectForm({...projectForm, totalBudget: Number(e.target.value)})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Utilized Budget (USD)</label>
                  <input 
                    type="number" 
                    value={projectForm.utilizedBudget} 
                    onChange={(e) => setProjectForm({...projectForm, utilizedBudget: Number(e.target.value)})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Research Area</label>
                  <input 
                    type="text" 
                    value={projectForm.researchArea} 
                    onChange={(e) => setProjectForm({...projectForm, researchArea: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    placeholder="e.g. artificial intelligence, renewable solar"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Status</label>
                  <select 
                    value={projectForm.status} 
                    onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
                >
                  Save Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. External Grant Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 text-sm">{editingId ? 'Edit External Grant' : 'Register External Grant File'}</h3>
              <button onClick={() => setIsGrantModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveGrant} className="p-5 flex flex-col gap-4 text-xs font-medium text-slate-700">
              <div className="flex flex-col gap-1">
                <label className="text-slate-600">Funding Agency</label>
                <input 
                  type="text" 
                  value={grantForm.fundingAgency} 
                  onChange={(e) => setGrantForm({...grantForm, fundingAgency: e.target.value})} 
                  className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                  placeholder="e.g. National Science Foundation"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-600">Grant Title</label>
                <input 
                  type="text" 
                  value={grantForm.grantTitle} 
                  onChange={(e) => setGrantForm({...grantForm, grantTitle: e.target.value})} 
                  className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Amount</label>
                  <input 
                    type="number" 
                    value={grantForm.amount} 
                    onChange={(e) => setGrantForm({...grantForm, amount: Number(e.target.value)})} 
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Currency</label>
                  <input 
                    type="text" 
                    value={grantForm.currency} 
                    onChange={(e) => setGrantForm({...grantForm, currency: e.target.value})} 
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Application Deadline</label>
                  <input 
                    type="date" 
                    value={grantForm.applicationDeadline} 
                    onChange={(e) => setGrantForm({...grantForm, applicationDeadline: e.target.value})} 
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Status</label>
                  <select 
                    value={grantForm.status} 
                    onChange={(e) => setGrantForm({...grantForm, status: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Applied">Applied</option>
                    <option value="Awarded">Awarded</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
                >
                  Save Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Publication Modal */}
      {isPublicationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 text-sm">Register Academic Publication</h3>
              <button onClick={() => setIsPublicationModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSavePublication} className="p-5 flex flex-col gap-4 text-xs font-medium text-slate-700">
              <div className="flex flex-col gap-1">
                <label className="text-slate-600">Publication Title</label>
                <input 
                  type="text" 
                  value={publicationForm.title} 
                  onChange={(e) => setPublicationForm({...publicationForm, title: e.target.value})} 
                  className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Type</label>
                  <select 
                    value={publicationForm.publicationType} 
                    onChange={(e) => setPublicationForm({...publicationForm, publicationType: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="Journal">Journal</option>
                    <option value="Conference">Conference</option>
                    <option value="Book">Book</option>
                    <option value="Chapter">Chapter</option>
                    <option value="Patent">Patent</option>
                    <option value="Thesis">Thesis</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Associated Project</label>
                  <select 
                    value={publicationForm.projectId} 
                    onChange={(e) => setPublicationForm({...publicationForm, projectId: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="">No Associated Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Publisher</label>
                  <input 
                    type="text" 
                    value={publicationForm.publisher || ''} 
                    onChange={(e) => setPublicationForm({...publicationForm, publisher: e.target.value})} 
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    placeholder="e.g. IEEE, Springer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Publication Date</label>
                  <input 
                    type="date" 
                    value={publicationForm.publicationDate} 
                    onChange={(e) => setPublicationForm({...publicationForm, publicationDate: e.target.value})} 
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">DOI</label>
                  <input 
                    type="text" 
                    value={publicationForm.doi || ''} 
                    onChange={(e) => setPublicationForm({...publicationForm, doi: e.target.value})} 
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    placeholder="e.g. 10.1002/ieee.2025"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">ISBN</label>
                  <input 
                    type="text" 
                    value={publicationForm.isbn || ''} 
                    onChange={(e) => setPublicationForm({...publicationForm, isbn: e.target.value})} 
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                    placeholder="For Books / Chapters"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-600">Indexed In</label>
                <select 
                  value={publicationForm.indexedIn || ''} 
                  onChange={(e) => setPublicationForm({...publicationForm, indexedIn: e.target.value})}
                  className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                >
                  <option value="Scopus">Scopus</option>
                  <option value="Web of Science">Web of Science</option>
                  <option value="Google Scholar">Google Scholar</option>
                  <option value="ORCID">ORCID</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsPublicationModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
                >
                  Save Publication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Ethics Clearance Modal */}
      {isEthicsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 text-sm">Submit Ethics Committee Review</h3>
              <button onClick={() => setIsEthicsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveEthics} className="p-5 flex flex-col gap-4 text-xs font-medium text-slate-700">
              <div className="flex flex-col gap-1">
                <label className="text-slate-600">Target Project</label>
                <select 
                  value={ethicsForm.projectId} 
                  onChange={(e) => setEthicsForm({...ethicsForm, projectId: e.target.value})}
                  className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                  required
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Application Date</label>
                  <input 
                    type="date" 
                    value={ethicsForm.applicationDate} 
                    onChange={(e) => setEthicsForm({...ethicsForm, applicationDate: e.target.value})} 
                    className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600">Initial Decision</label>
                  <select 
                    value={ethicsForm.committeeDecision} 
                    onChange={(e) => setEthicsForm({...ethicsForm, committeeDecision: e.target.value})}
                    className="border border-slate-200 p-2.5 rounded-xl outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Revision Required">Revision Required</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEthicsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl max-w-sm border transition-all duration-300 ${
          toast.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100/40' 
            : toast.type === 'info' 
              ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-blue-100/40' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100/40'
        }`}>
          <div className="flex-grow text-xs font-semibold">{toast.message}</div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-900 transition font-bold text-sm">✕</button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full flex flex-col p-6 gap-4">
            <h3 className="font-semibold text-slate-950 text-sm">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <button 
                onClick={() => setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
                }}
                className={`px-4 py-2 text-white rounded-xl transition text-xs font-semibold ${
                  confirmModal.title.toLowerCase().includes('delete') 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmModal.title.toLowerCase().includes('delete') ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ResearchPage;
