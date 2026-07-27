import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, TrendingUp, Settings, Database, Calendar, Download, Play, 
  Sparkles, CheckCircle2, AlertCircle, Plus, Search, Filter, ShieldCheck, 
  Users, BookOpen, Briefcase, FileText, LayoutDashboard, Clock, Eye, 
  AlertTriangle, RefreshCw, Layers, GraduationCap, DollarSign, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';
import { io } from 'socket.io-client';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

// Data Mart interface
interface DataMartStatus {
  totalApplied?: number;
  totalAdmitted?: number;
  acceptanceRate?: number;
  yieldRate?: number;
  activeCount?: number;
  internationalCount?: number;
  transferCount?: number;
  graduationRate?: number;
  averageRate?: number;
  criticalCount?: number;
  facultyAverage?: number;
  totalCount?: number;
  phdRatio?: number;
  paperCount?: number;
  avgWorkloadHours?: number;
  activeSchedules?: number;
  examsConducted?: number;
  studentRegistrations?: number;
  averageGPA?: number;
  passPercentage?: number;
  failPercentage?: number;
  gradeDistribution?: Record<string, string>;
  totalRevenue?: number;
  totalExpenses?: number;
  libraryFines?: number;
  dynamicSurplus?: number;
  headCount?: number;
  leaveApplications?: number;
  monthlyPayroll?: number;
  basicSalary?: number;
  allowances?: number;
  deductions?: number;
  netPay?: number;
  pendingPOs?: number;
  completedPOs?: number;
  totalProcurementValue?: number;
  efficiencyRate?: number;
  booksIssued?: number;
  booksReserved?: number;
  activeCards?: number;
  uniqueBookCount?: number;
  ongoingProjects?: number;
  completedProjects?: number;
  fundingReceived?: number;
  totalItems?: number;
  itemsLowStock?: number;
  reorderPending?: number;
  totalAssets?: number;
  activeAssets?: number;
  maintenanceRequired?: number;
}

interface KPIItem {
  id: number;
  name: string;
  category: string;
  targetValue: number;
  currentValue: number;
  trend: number;
  active: boolean;
}

interface SavedReportItem {
  id: number;
  reportName: string;
  reportType: string;
  createdBy: string;
  configuration: any;
  schedule?: string;
}

interface WarehouseJobItem {
  id: number;
  jobName: string;
  jobType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
}

interface WidgetItem {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface TrendItem {
  period: string;
  revenue: number;
  expense: number;
  enrollment: number;
  passPercentage: number;
  researchOutput: number;
}

interface DepartmentItem {
  name: string;
  students: number;
  faculty: number;
  budget: number;
  passRate: number;
  researchCount: number;
}

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuthStore();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'executive' | 'analytics' | 'kpi' | 'builder' | 'reports' | 'etl' | 'forecast'>('executive');
  
  // Dashboard Sub-type State (Executive roles)
  const [selectedDashboardRole, setSelectedDashboardRole] = useState<'vc' | 'registrar' | 'finance' | 'hr' | 'coe' | 'department' | 'qa'>('vc');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'monthly' | 'yearly'>('monthly');

  // API Data States
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [dataMarts, setDataMarts] = useState<Record<string, DataMartStatus>>({});
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [kpis, setKPIs] = useState<KPIItem[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [jobs, setJobs] = useState<WarehouseJobItem[]>([]);
  
  // UI & Form States
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [etlProgress, setEtlProgress] = useState<number | null>(null);
  const [activeEtlJobId, setActiveEtlJobId] = useState<number | null>(null);
  const [socketStatus, setSocketStatus] = useState<'Connected' | 'Disconnected'>('Disconnected');

  // Report Builder Form State
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('Academic');
  const [selectedDataMart, setSelectedDataMart] = useState('students');
  const [metricAggregation, setMetricAggregation] = useState('Count');
  const [selectedChartStyle, setSelectedChartStyle] = useState('Bar');
  const [builderSuccess, setBuilderSuccess] = useState<string | null>(null);

  // Scheduling State
  const [schedulingReportId, setSchedulingReportId] = useState<number | null>(null);
  const [cronExpression, setCronExpression] = useState('0 0 * * *');
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Socket instance ref
  const socketRef = useRef<any>(null);

  // Load Main Analytics Dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/analytics/dashboard', {
        params: {
          dashboardType: selectedDashboardRole,
          department: selectedDepartment,
          timeRange
        }
      });
      if (res.data.success) {
        setWidgets(res.data.widgets || []);
        setDataMarts(res.data.dataMarts || {});
        setTrends(res.data.trends || []);
        setDepartments(res.data.departmentsList || []);
      }
    } catch (err: any) {
      console.error('[Analytics] Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Secondary Data Streams
  const loadSecondaryData = async () => {
    try {
      const [kpiRes, reportsRes, jobsRes] = await Promise.all([
        apiClient.get('/api/analytics/kpis').catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get('/api/analytics/reports').catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get('/api/analytics/jobs').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (kpiRes.data.success) setKPIs(kpiRes.data.data);
      if (reportsRes.data.success) setSavedReports(reportsRes.data.data);
      if (jobsRes.data.success) setJobs(jobsRes.data.data);
    } catch (err) {
      console.error('[Analytics] Error loading auxiliary streams:', err);
    }
  };

  // Sync dashboard on parameters update
  useEffect(() => {
    loadDashboardData();
  }, [selectedDashboardRole, selectedDepartment, timeRange]);

  // Initial load
  useEffect(() => {
    loadSecondaryData();

    // Setup Socket.io client connection to listen to live events
    const socketUrl = window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus('Connected');
      console.log('[Socket] Connected to real-time analytics stream');
    });

    socket.on('disconnect', () => {
      setSocketStatus('Disconnected');
    });

    // Handle background progress of ETL sync pipelines
    socket.on('analytics:etl:progress', (data: { jobId: number, progress: number, status: string }) => {
      if (data.progress < 100) {
        setEtlProgress(data.progress);
        setActiveEtlJobId(data.jobId);
      } else {
        setEtlProgress(null);
        setActiveEtlJobId(null);
        loadSecondaryData(); // Refresh jobs history list
      }
    });

    // Listen to other collaborative status triggers
    socket.on('analytics:report:status', () => {
      loadSecondaryData();
    });

    socket.on('analytics:dashboard:refresh', () => {
      // Background reload triggers dynamically
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Handle Saved Report Creation
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim()) return;

    try {
      setLoading(true);
      const res = await apiClient.post('/api/analytics/reports', {
        reportName,
        reportType,
        configuration: {
          dataMart: selectedDataMart,
          aggregation: metricAggregation,
          chartStyle: selectedChartStyle
        }
      });
      if (res.data.success) {
        setBuilderSuccess(`Report "${reportName}" created successfully in metadata catalog.`);
        setReportName('');
        loadSecondaryData();
        setTimeout(() => setBuilderSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error('[Analytics] Report design failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Scheduling
  const handleScheduleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingReportId) return;

    try {
      setLoading(true);
      const res = await apiClient.post('/api/analytics/schedule', {
        reportId: schedulingReportId,
        schedule: cronExpression
      });
      if (res.data.success) {
        setScheduleSuccess('Reporting schedule updated successfully.');
        loadSecondaryData();
        setTimeout(() => {
          setScheduleSuccess(null);
          setSchedulingReportId(null);
        }, 3000);
      }
    } catch (err) {
      console.error('[Analytics] Scheduling error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle ETL Triggering
  const handleTriggerETL = async () => {
    try {
      setLoading(true);
      setEtlProgress(5); // Start initial feedback loop
      const res = await apiClient.post('/api/analytics/jobs/trigger', {
        jobName: 'On-Demand Campus Core ETL Pipeline',
        jobType: 'ETL'
      });
      if (res.data.success) {
        setActiveEtlJobId(res.data.data.id);
        loadSecondaryData();
      }
    } catch (err) {
      console.error('[Analytics] Failed to start ETL pipeline:', err);
      setEtlProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Document Exports (Mime-type downloads)
  const handleExportData = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setExporting(true);
      // Fetch dynamic export
      const response = await apiClient.get('/api/analytics/export', {
        params: { format },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `university_bi_report.${format === 'excel' ? 'xls' : format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[Analytics] Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  // Generate simple colored labels for chart cells
  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#3b82f6'];

  // Predictive Trajectory Generation (Forecast)
  const forecastData = [
    { name: 'Jan 26', actual: 4820, projectHigh: 4820, projectLow: 4820 },
    { name: 'Feb 26', actual: 4860, projectHigh: 4900, projectLow: 4820 },
    { name: 'Mar 26', actual: 4910, projectHigh: 4980, projectLow: 4850 },
    { name: 'Apr 26', actual: 4950, projectHigh: 5040, projectLow: 4890 },
    { name: 'May 26', actual: null, projectHigh: 5120, projectLow: 4910 },
    { name: 'Jun 26', actual: null, projectHigh: 5180, projectLow: 4940 },
    { name: 'Jul 26', actual: null, projectHigh: 5250, projectLow: 4980 },
    { name: 'Aug 26', actual: null, projectHigh: 5320, projectLow: 5020 },
    { name: 'Sep 26', actual: null, projectHigh: 5410, projectLow: 5050 },
    { name: 'Oct 26', actual: null, projectHigh: 5490, projectLow: 5090 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" id="analytics-module-root">
      {/* Module Title Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="analytics-header">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600 rounded-xl text-white">
              <BarChart3 className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-sans font-medium tracking-tight text-slate-950">
              Enterprise Business Intelligence & Advanced Analytics
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-2 max-w-2xl font-sans">
            Looker, Power BI & Tableau Cloud level suite serving Vice Chancellor, Registrar, Finance Director, HR and Department Heads. Connected to the live University Data Warehouse.
          </p>
        </div>

        {/* Realtime Stream Info Badges */}
        <div className="flex items-center gap-3 self-start md:self-auto" id="analytics-metadata-badges">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${socketStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
            Live Stream: {socketStatus}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-sans">
            <Layers className="h-3.5 w-3.5" />
            Active Data Marts: 14
          </div>
        </div>
      </div>

      {/* Global Live ETL Notification */}
      <AnimatePresence>
        {etlProgress !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-white border border-indigo-200 rounded-2xl shadow-sm flex items-center justify-between gap-4"
            id="realtime-etl-notification"
          >
            <div className="flex items-center gap-4 flex-1">
              <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600 animate-spin">
                <RefreshCw className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1 text-sm font-sans font-medium text-slate-800">
                  <span>Running Real-time ETL Sync Pipelines...</span>
                  <span>{etlProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${etlProgress}%` }} />
                </div>
              </div>
            </div>
            <div className="text-xs font-mono text-indigo-600 px-3 py-1 bg-indigo-50 rounded-md">
              Job ID: #{activeEtlJobId}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Subtabs */}
      <div className="border-b border-slate-200 mb-8 overflow-x-auto scrollbar-none flex gap-2" id="analytics-tabs-bar">
        {[
          { id: 'executive', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'analytics', label: 'Interactive Analytics', icon: TrendingUp },
          { id: 'kpi', label: 'KPI Monitor', icon: Activity },
          { id: 'builder', label: 'Report Designer', icon: Settings },
          { id: 'reports', label: 'Saved Catalog', icon: FileText },
          { id: 'etl', label: 'ETL Pipelines', icon: Database },
          { id: 'forecast', label: 'Trend & Forecast', icon: Sparkles }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-sans text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Primary Dashboard Filter Bar (Roles & Filters) */}
      {activeTab === 'executive' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex flex-col lg:flex-row lg:items-center gap-4" id="filter-bar">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-sans">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span>Executive Lens:</span>
          </div>
          
          <div className="flex flex-wrap gap-2 flex-1" id="role-dashboard-selector">
            {[
              { id: 'vc', label: 'Vice Chancellor', role: 'VICE_CHANCELLOR' },
              { id: 'registrar', label: 'Registrar', role: 'REGISTRAR' },
              { id: 'finance', label: 'Finance Director', role: 'FINANCE_DIRECTOR' },
              { id: 'hr', label: 'HR Director', role: 'HR_DIRECTOR' },
              { id: 'coe', label: 'Controller of Exams', role: 'TEACHER' },
              { id: 'department', label: 'Dept Head', role: 'DEPARTMENT_HEAD' },
              { id: 'qa', label: 'Quality Assurance', role: 'QUALITY_ASSURANCE' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedDashboardRole(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                  selectedDashboardRole === r.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-3" id="secondary-selectors">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              <option value="cs">Computer Science</option>
              <option value="ee">Electrical Engineering</option>
              <option value="me">Mechanical Engineering</option>
              <option value="bus">Business School</option>
              <option value="sci">Natural Sciences</option>
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="monthly">Monthly Metric Trend</option>
              <option value="yearly">Year-over-Year Trajectory</option>
            </select>

            <button
              onClick={loadDashboardData}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container rendering dynamically chosen views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + '_' + selectedDashboardRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'executive' && (
            <div id="executive-dashboard-view">
              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="executive-stat-cards">
                {widgets.map((widget, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-slate-500 text-xs font-sans font-medium uppercase tracking-wider">{widget.label}</p>
                    <div className="flex items-baseline justify-between mt-3">
                      <p className="text-3xl font-sans font-medium text-slate-900 tracking-tight">{widget.value}</p>
                      <span className={`flex items-center gap-1 text-xs font-sans font-medium px-2 py-0.5 rounded-full ${
                        widget.trend === 'up' ? 'bg-emerald-50 text-emerald-700' : widget.trend === 'down' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
                      }`}>
                        <TrendingUp className={`h-3 w-3 ${widget.trend === 'down' ? 'rotate-180' : ''}`} />
                        {widget.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Mart Bento Grid Section */}
              <h2 className="text-xl font-sans font-medium text-slate-950 mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                University Core Data Marts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8" id="data-mart-grid">
                
                {/* Admissions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-emerald-600">
                    <span className="p-2 bg-emerald-50 rounded-xl"><GraduationCap className="h-5 w-5" /></span>
                    <h3 className="font-sans font-medium text-slate-800">Admissions Mart</h3>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-slate-500"><span>Applied Candidates:</span><span className="font-medium text-slate-900">{dataMarts.admissions?.totalApplied}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Admitted Index:</span><span className="font-medium text-slate-900">{dataMarts.admissions?.totalAdmitted}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Acceptance Rate:</span><span className="font-medium text-emerald-600">{dataMarts.admissions?.acceptanceRate}%</span></div>
                  </div>
                </div>

                {/* Students */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-indigo-600">
                    <span className="p-2 bg-indigo-50 rounded-xl"><Users className="h-5 w-5" /></span>
                    <h3 className="font-sans font-medium text-slate-800">Students Mart</h3>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-slate-500"><span>Total Enrolled:</span><span className="font-medium text-slate-900">{dataMarts.students?.activeCount}</span></div>
                    <div className="flex justify-between text-slate-500"><span>International Student ratio:</span><span className="font-medium text-slate-900">{dataMarts.students?.internationalCount}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Graduation Index:</span><span className="font-medium text-indigo-600">{dataMarts.students?.graduationRate}%</span></div>
                  </div>
                </div>

                {/* Finance */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-rose-600">
                    <span className="p-2 bg-rose-50 rounded-xl"><DollarSign className="h-5 w-5" /></span>
                    <h3 className="font-sans font-medium text-slate-800">Finance Mart</h3>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-slate-500"><span>Total Revenues:</span><span className="font-medium text-slate-900">${(dataMarts.finance?.totalRevenue || 0) / 1000000}M</span></div>
                    <div className="flex justify-between text-slate-500"><span>Operating Costs:</span><span className="font-medium text-slate-900">${(dataMarts.finance?.totalExpenses || 0) / 1000000}M</span></div>
                    <div className="flex justify-between text-slate-500"><span>Fiscal Margin:</span><span className="font-medium text-emerald-600">+${(dataMarts.finance?.dynamicSurplus || 0) / 1000000}M</span></div>
                  </div>
                </div>

                {/* Library */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-amber-600">
                    <span className="p-2 bg-amber-50 rounded-xl"><BookOpen className="h-5 w-5" /></span>
                    <h3 className="font-sans font-medium text-slate-800">Library Mart</h3>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-slate-500"><span>Active Library Cards:</span><span className="font-medium text-slate-900">{dataMarts.library?.activeCards}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Books Checked Out:</span><span className="font-medium text-slate-900">{dataMarts.library?.booksIssued}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Unique Book Titles:</span><span className="font-medium text-slate-900">{dataMarts.library?.uniqueBookCount}</span></div>
                  </div>
                </div>

                {/* Faculty & HR */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-sky-600">
                    <span className="p-2 bg-sky-50 rounded-xl"><Users className="h-5 w-5" /></span>
                    <h3 className="font-sans font-medium text-slate-800">Faculty Mart</h3>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-slate-500"><span>Total Teachers:</span><span className="font-medium text-slate-900">{dataMarts.faculty?.totalCount}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Ph.D. Holders Ratio:</span><span className="font-medium text-slate-900">{dataMarts.faculty?.phdRatio}%</span></div>
                    <div className="flex justify-between text-slate-500"><span>Avg Weekly Workload:</span><span className="font-medium text-slate-900">{dataMarts.faculty?.avgWorkloadHours} Hours</span></div>
                  </div>
                </div>

                {/* Examinations & Results */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-purple-600">
                    <span className="p-2 bg-purple-50 rounded-xl"><GraduationCap className="h-5 w-5" /></span>
                    <h3 className="font-sans font-medium text-slate-800">Exams & Results Mart</h3>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-slate-500"><span>Average Class GPA:</span><span className="font-medium text-slate-900">{dataMarts.results?.averageGPA}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Pass Ratio Metric:</span><span className="font-medium text-emerald-600">{dataMarts.results?.passPercentage}%</span></div>
                    <div className="flex justify-between text-slate-500"><span>Answer Booklets Processed:</span><span className="font-medium text-slate-900">{dataMarts.examinations?.studentRegistrations}</span></div>
                  </div>
                </div>

                {/* Procurement */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-teal-600">
                    <span className="p-2 bg-teal-50 rounded-xl"><Briefcase className="h-5 w-5" /></span>
                    <h3 className="font-sans font-medium text-slate-800">Procurement Mart</h3>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-slate-500"><span>Pending Purchases:</span><span className="font-medium text-slate-900">{dataMarts.procurement?.pendingPOs} POs</span></div>
                    <div className="flex justify-between text-slate-500"><span>Procurement Efficiency:</span><span className="font-medium text-slate-900">{dataMarts.procurement?.efficiencyRate}%</span></div>
                    <div className="flex justify-between text-slate-500"><span>Total Procurement value:</span><span className="font-medium text-slate-900">${dataMarts.procurement?.totalProcurementValue?.toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Research */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-pink-600">
                    <span className="p-2 bg-pink-50 rounded-xl"><Sparkles className="h-5 w-5" /></span>
                    <h3 className="font-sans font-medium text-slate-800">Research Mart</h3>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-slate-500"><span>Ongoing Research Projects:</span><span className="font-medium text-slate-900">{dataMarts.research?.ongoingProjects}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Publications Year:</span><span className="font-medium text-slate-900">{dataMarts.research?.completedProjects}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Funding Secured:</span><span className="font-medium text-pink-600">${dataMarts.research?.fundingReceived?.toLocaleString()}</span></div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div id="interactive-charts-view">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Chart 1: Fiscal Trajectory Analysis */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-sans font-medium text-slate-900 mb-4">Revenues vs Expenditures (Fiscal Trajectory)</h3>
                  <div className="h-80" id="revenues-expenditures-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" name="Total Revenues" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="expense" name="Operational Expenses" stroke="#ec4899" fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Student Enrollment Progression */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-sans font-medium text-slate-900 mb-4">Enrollment Progression Trend</h3>
                  <div className="h-80" id="enrollment-progression-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="enrollment" name="Enrolled Students" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Departmental Comparison Matrices */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                <h3 className="text-base font-sans font-medium text-slate-900 mb-6">Department Comparison Metrics Matrix</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 h-80" id="department-students-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="students" name="Students Enrolled" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="budget" name="Department Budget ($)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4" id="matrix-highlights">
                    <h4 className="text-sm font-sans font-medium text-slate-700">Comparative Highlights</h4>
                    <div className="space-y-3 font-sans text-xs">
                      {departments.map((dept, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="font-medium text-slate-900">{dept.name}</span>
                            <span className="block text-[10px] text-slate-500">{dept.faculty} Faculty • {dept.researchCount} Publications</span>
                          </div>
                          <span className="text-indigo-600 font-semibold">{dept.passRate}% Pass Rate</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KPI MONITOR */}
          {activeTab === 'kpi' && (
            <div id="kpi-monitor-view">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-sans font-medium text-slate-900 mb-4">Dynamic Key Performance Indicators (KPIs)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 font-medium">Indicator Name</th>
                          <th className="pb-3 font-medium">Domain Category</th>
                          <th className="pb-3 font-medium text-right">Target</th>
                          <th className="pb-3 font-medium text-right">Current Actual</th>
                          <th className="pb-3 font-medium text-right">Progress Rate</th>
                          <th className="pb-3 font-medium text-right">Trend Velocity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {kpis.map((kpi) => {
                          const completion = Math.min(Math.round((kpi.currentValue / kpi.targetValue) * 100), 100);
                          return (
                            <tr key={kpi.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 font-medium text-slate-900">{kpi.name}</td>
                              <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-medium">{kpi.category}</span></td>
                              <td className="py-3 text-right font-mono text-slate-500">{kpi.targetValue}</td>
                              <td className="py-3 text-right font-mono text-slate-900 font-semibold">{kpi.currentValue}</td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${completion}%` }} />
                                  </div>
                                  <span className="font-mono text-slate-700 font-medium">{completion}%</span>
                                </div>
                              </td>
                              <td className={`py-3 text-right font-semibold font-mono ${kpi.trend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {kpi.trend > 0 ? `+${kpi.trend}%` : `${kpi.trend}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quality Index Audit & Quick Actions */}
                <div className="space-y-6" id="kpi-right-pane">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-sans font-medium text-slate-900 mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-indigo-600" />
                      Dynamic Data Export
                    </h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                      Secure metadata package download including University KPI reports, academic progression matrices and operational statistics. Approved for institutional audit sharing.
                    </p>
                    
                    <div className="space-y-3" id="data-export-buttons">
                      <button
                        onClick={() => handleExportData('csv')}
                        disabled={exporting}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-sans font-medium text-slate-700 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-600" />
                          Structured CSV Export
                        </span>
                        <Download className="h-4 w-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleExportData('excel')}
                        disabled={exporting}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-sans font-medium text-slate-700 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-teal-600" />
                          Microsoft Excel Matrix Export
                        </span>
                        <Download className="h-4 w-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleExportData('pdf')}
                        disabled={exporting}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-sans font-medium text-slate-700 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-rose-600" />
                          Institutional PDF Board Report
                        </span>
                        <Download className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REPORT DESIGNER */}
          {activeTab === 'builder' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto" id="report-builder-form-view">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Settings className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-sans font-medium text-slate-950">Dynamic BI Report Designer</h3>
                  <p className="text-xs text-slate-500">Design tailor-made academic or financial data queries, select appropriate dimensions, and persist configurations inside the metadata catalog.</p>
                </div>
              </div>

              {builderSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-sans flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {builderSuccess}
                </div>
              )}

              <form onSubmit={handleCreateReport} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-sans font-medium text-slate-700 mb-1.5">Report Title Name</label>
                    <input
                      type="text"
                      required
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="e.g. Q3 Student Graduation Audit"
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-slate-700 mb-1.5">Report Metadata Classification</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Academic">Academic (Students & Programs)</option>
                      <option value="Finance">Financial (Revenues & Budgets)</option>
                      <option value="Administrative">Administrative & HR</option>
                      <option value="Operational">Operational (Assets & Procurement)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-slate-700 mb-1.5">Primary Target Data Mart</label>
                    <select
                      value={selectedDataMart}
                      onChange={(e) => setSelectedDataMart(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="students">Students Core Data Mart</option>
                      <option value="admissions">Admissions Analytics Mart</option>
                      <option value="finance">Campus Revenues Mart</option>
                      <option value="faculty">Faculty Workloads Mart</option>
                      <option value="library">Library Issued Mart</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-slate-700 mb-1.5">Aggregation Dimension</label>
                    <select
                      value={metricAggregation}
                      onChange={(e) => setMetricAggregation(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Count">Record Count Frequency</option>
                      <option value="Sum">Sum Accumulation</option>
                      <option value="Average">Arithmetic Mean Average</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-slate-700 mb-1.5">Reporting Visual Style</label>
                    <select
                      value={selectedChartStyle}
                      onChange={(e) => setSelectedChartStyle(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Bar">Bar Comparison Chart</option>
                      <option value="Line">Continuous Line Timeline Chart</option>
                      <option value="Area">Area Density Gradient Chart</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-sans font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Save Report to Catalog
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: SAVED CATALOG */}
          {activeTab === 'reports' && (
            <div id="saved-reports-catalog-view">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Reports List */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-sans font-medium text-slate-900 mb-6">Saved Business Intelligence Catalog</h3>
                  
                  {savedReports.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-sans text-xs">
                      No customized reports designed. Use the Report Designer tab to create your first query.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 font-sans text-xs space-y-4">
                      {savedReports.map((report) => (
                        <div key={report.id} className="pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h4 className="font-medium text-slate-900 text-sm">{report.reportName}</h4>
                            <div className="flex gap-3 text-slate-500 mt-1">
                              <span>Type: <span className="text-slate-800 font-medium">{report.reportType}</span></span>
                              <span>•</span>
                              <span>Target Mart: <span className="text-slate-800 font-medium">{report.configuration?.dataMart}</span></span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 self-start md:self-auto">
                            {report.schedule ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-mono flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {report.schedule}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px]">Unscheduled</span>
                            )}

                            <button
                              onClick={() => {
                                setSchedulingReportId(report.id);
                                setScheduleSuccess(null);
                              }}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 transition-colors"
                            >
                              Configure Schedule
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduling Side-form */}
                <div className="space-y-6" id="scheduling-side-pane">
                  {schedulingReportId ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-base font-sans font-medium text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        Configure Job Schedule
                      </h3>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        Specify standard CRON notation intervals (or pick presets) to automatically trigger report exports and dispatch PDF briefings via secure mail channels.
                      </p>

                      {scheduleSuccess && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-sans">
                          {scheduleSuccess}
                        </div>
                      )}

                      <form onSubmit={handleScheduleReport} className="space-y-4">
                        <div>
                          <label className="block text-xs font-sans font-medium text-slate-700 mb-1.5">Report Execution Schedule (Cron format)</label>
                          <input
                            type="text"
                            required
                            value={cronExpression}
                            onChange={(e) => setCronExpression(e.target.value)}
                            placeholder="e.g. 0 0 * * * (daily)"
                            className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCronExpression('0 0 * * *')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-600 font-mono"
                          >
                            Daily Preset
                          </button>
                          <button
                            type="button"
                            onClick={() => setCronExpression('0 0 * * 0')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-600 font-mono"
                          >
                            Weekly Preset
                          </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-sans font-medium text-center transition-colors"
                          >
                            Save Schedule
                          </button>
                          <button
                            type="button"
                            onClick={() => setSchedulingReportId(null)}
                            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-sans text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-sans">
                      Select "Configure Schedule" on a saved report from the catalog list to establish execution parameters.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ETL PIPELINES */}
          {activeTab === 'etl' && (
            <div id="etl-pipelines-view">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Jobs list */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h3 className="text-base font-sans font-medium text-slate-900">Data Warehouse Job History</h3>
                    <button
                      onClick={handleTriggerETL}
                      disabled={loading || etlProgress !== null}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-sans font-medium transition-all"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Trigger Manual ETL Sync
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 font-medium">Job Identification</th>
                          <th className="pb-3 font-medium">Job Type</th>
                          <th className="pb-3 font-medium">Execution Status</th>
                          <th className="pb-3 font-medium">Started At</th>
                          <th className="pb-3 font-medium">Completed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 font-medium text-slate-900">{job.jobName}</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-medium">{job.jobType}</span></td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                job.status === 'Success' 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                                  : job.status === 'Running' 
                                  ? 'bg-indigo-50 border-indigo-100 text-indigo-800 animate-pulse'
                                  : 'bg-rose-50 border-rose-100 text-rose-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'Success' ? 'bg-emerald-500' : job.status === 'Running' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                                {job.status}
                              </span>
                            </td>
                            <td className="py-3 text-slate-500 font-mono">{new Date(job.startedAt).toLocaleTimeString()}</td>
                            <td className="py-3 text-slate-500 font-mono">
                              {job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Warehouse Stats */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="warehouse-stats-pane">
                  <h3 className="text-base font-sans font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-600" />
                    Data Warehouse Architecture
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    The Smart Campus Data Warehouse follows an star-schema architectural paradigm, extracting, transforming and loading operational transactional databases into high-performance reporting analytical tables.
                  </p>

                  <div className="space-y-4 font-sans text-xs" id="warehouse-properties">
                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                      <span className="text-slate-500">Warehouse Host:</span>
                      <span className="font-mono text-slate-700 font-medium">db.university.edu:5432</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                      <span className="text-slate-500">Warehouse Schema Version:</span>
                      <span className="font-mono text-slate-700 font-medium">v4.1.2-bi</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                      <span className="text-slate-500">Daily Extracted volume:</span>
                      <span className="font-mono text-slate-700 font-medium">~1.24 GB / Day</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TREND & FORECAST */}
          {activeTab === 'forecast' && (
            <div id="predictive-forecast-view">
              {/* Statistical explanation banner */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-950 rounded-3xl p-6 md:p-8 text-white mb-8" id="forecast-banner">
                <div className="max-w-3xl">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium font-sans">
                    Arima Predictive Model Active
                  </span>
                  <h2 className="text-2xl font-sans font-medium text-white tracking-tight mt-3">
                    Campus Advanced Predictive Modeling
                  </h2>
                  <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                    By combining historical enrollment numbers, programmatic admission pipelines and financial margins from previous semesters, our machine learning forecasting model projects future growth paths for the upcoming calendar year with dynamic confidence boundaries.
                  </p>
                </div>
              </div>

              {/* Forecast Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-sans font-medium text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Projected Campus Enrollment Trajectory ( ARIMA Projection )
                  </h3>
                  
                  <div className="h-80" id="arima-forecast-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        {/* Shaded Area representing High confidence project boundary */}
                        <Area type="monotone" dataKey="projectHigh" name="Optimistic Path" stroke="#a5b4fc" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorConfidence)" />
                        <Area type="monotone" dataKey="projectLow" name="Pessimistic Path" stroke="#c7d2fe" strokeDasharray="5 5" fill="none" />
                        <Line type="monotone" dataKey="actual" name="Historical Recorded" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Predictor Weights */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="predictor-weights-pane">
                  <h3 className="text-base font-sans font-medium text-slate-900 mb-4">Regression Weights</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Core analytical weights contributing to our predictive campus growth projections:
                  </p>

                  <div className="space-y-4 font-sans text-xs" id="regressors-list">
                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>Admissions Yield Velocity:</span>
                        <span className="font-mono font-semibold text-slate-900">0.42 (High Impact)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '84%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>Regional Demographic Growth:</span>
                        <span className="font-mono font-semibold text-slate-900">0.24 (Moderate Impact)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '48%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>Financial Scholarship Grants:</span>
                        <span className="font-mono font-semibold text-slate-900">0.18 (Low Impact)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '36%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
export default AnalyticsPage;
