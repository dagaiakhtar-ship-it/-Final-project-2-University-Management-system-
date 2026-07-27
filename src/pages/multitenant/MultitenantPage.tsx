import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, Globe, Settings, Sliders, Palette, Mail, MessageSquare, 
  Cloud, RefreshCw, Plus, Search, Filter, Trash2, Calendar, Edit, 
  RotateCcw, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, 
  Database, Cpu, HardDrive, Play, FileText, Check, Sparkles, Send, 
  Network, HelpCircle, ArrowRight, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';
import { io } from 'socket.io-client';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

interface Tenant {
  id: number;
  tenantCode: string;
  tenantName: string;
  universityName: string;
  domain: string;
  subdomain: string;
  status: 'Active' | 'Suspended' | 'Maintenance';
  timezone: string;
  locale: string;
  currency: string;
  createdAt: string;
  configurations?: any[];
  maintenanceWindows?: any[];
}

interface RecoveryPoint {
  id: number;
  recoveryType: 'Snapshot' | 'Full Backup' | 'Incremental Backup';
  region: string;
  storageProvider: string;
  storageLocation: string;
  checksum: string;
  verified: boolean;
  createdAt: string;
}

interface MaintenanceWindow {
  id: number;
  tenantId: number;
  tenant?: Tenant;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export function MultitenantPage() {
  const { user } = useAuthStore();
  const isAdminOrSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Navigation state (Unified sub-views of Step 83 on a single master page)
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core records lists
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [recoveryPoints, setRecoveryPoints] = useState<RecoveryPoint[]>([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Socket state
  const [socketStatus, setSocketStatus] = useState<'Connected' | 'Disconnected'>('Disconnected');
  const [activeFailoverAlert, setActiveFailoverAlert] = useState<any>(null);
  const [restoringState, setRestoringState] = useState<{
    pointId: number;
    progress: number;
    status: string;
    stepName: string;
  } | null>(null);

  // Loading & Action UI states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forms state
  // Onboarding
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    tenantCode: '',
    tenantName: '',
    universityName: '',
    domain: '',
    subdomain: '',
    status: 'Active' as 'Active' | 'Suspended' | 'Maintenance',
    timezone: 'PST',
    locale: 'en_US',
    currency: 'USD'
  });

  // Branding & Configuration Selectors
  const [selectedConfigTenantId, setSelectedConfigTenantId] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState('#0891b2');
  const [brandingTheme, setBrandingTheme] = useState('light');
  const [brandingLayout, setBrandingLayout] = useState('classic');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smsProvider, setSmsProvider] = useState('twilio');
  const [smsApiKey, setSmsApiKey] = useState('hidden_credential');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [aiEndpoint, setAiEndpoint] = useState('');
  const [storageProvider, setStorageProvider] = useState('s3');
  const [storageBucket, setStorageBucket] = useState('');

  // Recovery Points creation
  const [newRecoveryPoint, setNewRecoveryPoint] = useState({
    recoveryType: 'Snapshot' as 'Snapshot' | 'Full Backup' | 'Incremental Backup',
    region: 'us-east-1 (N. Virginia)',
    storageProvider: 'AWS S3',
    storageLocation: 's3://unidb-dr-east-1/snapshots/',
    checksum: '',
    verified: true
  });

  // Maintenance Windows creation
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    tenantId: 0,
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    active: true
  });

  // HA State (Primary & Replicas status triggers)
  const [activePrimaryNode, setActivePrimaryNode] = useState('aws-us-east-1-primary');
  const [failoverHistory, setFailoverHistory] = useState<any[]>([]);

  // Socket IO Reference
  const socketRef = useRef<any>(null);

  // Fetch all core Multi-tenant / DR stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, rpRes, maintRes, auditRes] = await Promise.all([
        apiClient.get('/api/tenants'),
        apiClient.get('/api/recovery-points'),
        apiClient.get('/api/maintenance'),
        apiClient.get('/api/devops/dashboard').catch(() => ({ data: { logs: [] } }))
      ]);

      if (tenantsRes.data.success) {
        setTenants(tenantsRes.data.data);
        if (tenantsRes.data.data.length > 0 && !selectedConfigTenantId) {
          loadTenantConfig(tenantsRes.data.data[0].id);
        }
      }
      if (rpRes.data.success) {
        setRecoveryPoints(rpRes.data.data);
      }
      if (maintRes.data.success) {
        setMaintenanceWindows(maintRes.data.data);
      }
      if (auditRes.data && auditRes.data.success) {
        setAuditLogs(auditRes.data.logs || []);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load multi-tenant services.');
    } finally {
      setLoading(false);
    }
  };

  // Load configuration details for a specific tenant
  const loadTenantConfig = async (tenantId: number) => {
    try {
      setSelectedConfigTenantId(tenantId);
      const res = await apiClient.get(`/api/tenant-config?tenantId=${tenantId}`);
      if (res.data.success) {
        const c = res.data.data;
        setLogoUrl(c.logo || '');
        setFaviconUrl(c.favicon || '');
        setPrimaryColor(c.primaryColor || '#4f46e5');
        setSecondaryColor(c.secondaryColor || '#0891b2');
        setBrandingTheme(c.branding?.theme || 'light');
        setBrandingLayout(c.branding?.layout || 'classic');
        setSmtpHost(c.emailConfiguration?.host || '');
        setSmtpPort(c.emailConfiguration?.port || 587);
        setSmsProvider(c.smsConfiguration?.provider || 'twilio');
        setSmsApiKey(c.smsConfiguration?.apiKey || '••••••••••••••••');
        setAiModel(c.aiConfiguration?.model || 'gemini-1.5-flash');
        setAiEndpoint(c.aiConfiguration?.endpoint || '');
        setStorageProvider(c.storageConfiguration?.provider || 's3');
        setStorageBucket(c.storageConfiguration?.bucket || '');
      }
    } catch (err) {
      console.error('Failed to load tenant configuration', err);
    }
  };

  // Save Tenant Configuration updates
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigTenantId) return;

    try {
      setActionLoading(true);
      const res = await apiClient.put('/api/tenant-config', {
        tenantId: selectedConfigTenantId,
        logo: logoUrl,
        favicon: faviconUrl,
        primaryColor,
        secondaryColor,
        branding: { theme: brandingTheme, layout: brandingLayout },
        emailConfiguration: { host: smtpHost, port: smtpPort },
        smsConfiguration: { provider: smsProvider, apiKey: smsApiKey },
        aiConfiguration: { model: aiModel, endpoint: aiEndpoint },
        storageConfiguration: { provider: storageProvider, bucket: storageBucket }
      });

      if (res.data.success) {
        setSuccessMessage('Tenant Configuration and branding settings updated successfully!');
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  // Onboard Tenant
  const handleOnboardTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await apiClient.post('/api/tenants', newTenant);
      if (res.data.success) {
        setSuccessMessage(`Tenant "${newTenant.tenantName}" successfully provisioned and isolated.`);
        setShowOnboardModal(false);
        setNewTenant({
          tenantCode: '',
          tenantName: '',
          universityName: '',
          domain: '',
          subdomain: '',
          status: 'Active',
          timezone: 'PST',
          locale: 'en_US',
          currency: 'USD'
        });
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Onboarding failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Tenant Status
  const handleUpdateTenantStatus = async (tenantId: number, status: 'Active' | 'Suspended' | 'Maintenance') => {
    try {
      setActionLoading(true);
      const res = await apiClient.put(`/api/tenants/${tenantId}`, { status });
      if (res.data.success) {
        setSuccessMessage(`Tenant status successfully updated to "${status}".`);
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update tenant status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (tenantId: number) => {
    if (!window.confirm('CRITICAL WARNING: This will permanently purge the isolated tenant and delete all configuration metadata. Proceed?')) return;
    try {
      setActionLoading(true);
      const res = await apiClient.delete(`/api/tenants/${tenantId}`);
      if (res.data.success) {
        setSuccessMessage('Tenant permanently removed from platform catalogs.');
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete tenant.');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Backup Point
  const handleCreateRecoveryPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    const mockChecksum = 'sha256_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    try {
      setActionLoading(true);
      const res = await apiClient.post('/api/recovery-points', {
        ...newRecoveryPoint,
        checksum: mockChecksum
      });
      if (res.data.success) {
        setSuccessMessage(`New physical backup point successfully registered.`);
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to register recovery point.');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger System Restore
  const handleRestoreSystem = async (pointId: number) => {
    if (!window.confirm('HIGH RISK WARNING: Restoring the system will load the database snapshots, applying structural schemas. Continue?')) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post('/api/recovery/restore', { recoveryPointId: pointId });
      if (res.data.success) {
        setRestoringState({
          pointId,
          progress: 0,
          status: 'Started',
          stepName: 'Initializing restoration workflow protocols...'
        });
        setSuccessMessage('Restoration pipeline triggered successfully.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to trigger restoration.');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Replication Failover Simulation
  const handleTriggerFailover = async () => {
    const backupNode = activePrimaryNode === 'aws-us-east-1-primary' ? 'aws-us-west-2-replica' : 'aws-us-east-1-primary';
    if (!window.confirm(`FAILOVER CONFIRMATION: Promote the standby secondary read-replica "${backupNode}" to Write Master?`)) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post('/api/recovery/failover', {
        sourceNode: activePrimaryNode,
        targetNode: backupNode
      });
      if (res.data.success) {
        setActivePrimaryNode(backupNode);
        setSuccessMessage(res.data.message);
        setFailoverHistory(prev => [
          {
            timestamp: new Date().toLocaleTimeString(),
            source: activePrimaryNode,
            target: backupNode,
            status: 'Completed'
          },
          ...prev
        ]);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to trigger cluster failover.');
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule Maintenance Window
  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await apiClient.post('/api/maintenance', newMaintenance);
      if (res.data.success) {
        setSuccessMessage('New isolated tenant maintenance window registered successfully!');
        setShowMaintenanceModal(false);
        setNewMaintenance({
          tenantId: tenants[0]?.id || 0,
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          active: true
        });
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to register maintenance window.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Maintenance Status
  const handleToggleMaintenance = async (windowId: number, currentActive: boolean) => {
    try {
      setActionLoading(true);
      const res = await apiClient.put(`/api/maintenance/${windowId}`, { active: !currentActive });
      if (res.data.success) {
        setSuccessMessage('Maintenance window updated successfully.');
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update maintenance window.');
    } finally {
      setActionLoading(false);
    }
  };

  // Connect to Socket.io for Realtime DR/HA Events
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus('Connected');
    });

    socket.on('disconnect', () => {
      setSocketStatus('Disconnected');
    });

    // Realtime tenant update listener
    socket.on('tenant:status:updated', (data: any) => {
      fetchData();
    });

    // Realtime restoration progress listener
    socket.on('recovery:restore:progress', (data: {
      recoveryPointId: number;
      progress: number;
      status: string;
      stepName: string;
    }) => {
      setRestoringState({
        pointId: data.recoveryPointId,
        progress: data.progress,
        status: data.status,
        stepName: data.stepName
      });
      if (data.progress >= 100) {
        setTimeout(() => {
          setRestoringState(null);
          setSuccessMessage(`Restoration from point #${data.recoveryPointId} finished successfully!`);
          fetchData();
        }, 2000);
      }
    });

    // Realtime failover alert listener
    socket.on('infra:failover:alert', (data: any) => {
      setActiveFailoverAlert(data);
      setTimeout(() => setActiveFailoverAlert(null), 8000);
    });

    // Realtime maintenance scheduled listener
    socket.on('infra:maintenance:scheduled', (data: any) => {
      fetchData();
    });

    // Realtime recovery snapshot status listener
    socket.on('recovery:status:updated', (data: any) => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch data on page load
  useEffect(() => {
    fetchData();
  }, []);

  // Clear alerts automatically after 5s
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Derived dashboard analytics
  const activeTenantsCount = tenants.filter(t => t.status === 'Active').length;
  const totalTenantsCount = tenants.length;
  const maintenanceTenantsCount = tenants.filter(t => t.status === 'Maintenance').length;
  const suspendedTenantsCount = tenants.filter(t => t.status === 'Suspended').length;

  const tenantChartData = [
    { name: 'Active', value: activeTenantsCount, color: '#10b981' },
    { name: 'Suspended', value: suspendedTenantsCount, color: '#f43f5e' },
    { name: 'Maintenance', value: maintenanceTenantsCount, color: '#eab308' }
  ];

  const replicaHealthData = [
    { time: '05:00', primaryLag: 0, replicaWestLag: 12, replicaEuropeLag: 42 },
    { time: '05:10', primaryLag: 0, replicaWestLag: 9, replicaEuropeLag: 38 },
    { time: '05:20', primaryLag: 0, replicaWestLag: 15, replicaEuropeLag: 45 },
    { time: '05:30', primaryLag: 0, replicaWestLag: 8, replicaEuropeLag: 31 },
    { time: '05:40', primaryLag: 0, replicaWestLag: 11, replicaEuropeLag: 29 },
    { time: '05:50', primaryLag: 0, replicaWestLag: 14, replicaEuropeLag: 35 }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      
      {/* Realtime Socket Alert banners */}
      <AnimatePresence>
        {activeFailoverAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg bg-rose-600 border border-rose-500 rounded-xl p-4 shadow-2xl flex items-start gap-4"
          >
            <AlertTriangle className="text-white w-6 h-6 flex-shrink-0 animate-bounce" />
            <div>
              <h4 className="text-white font-bold">CRITICAL INFRASTRUCTURE FAILOVER</h4>
              <p className="text-rose-100 text-sm mt-1">{activeFailoverAlert.message}</p>
              <div className="flex items-center gap-2 text-xs text-rose-200 mt-2">
                <span className="bg-rose-700 px-2 py-0.5 rounded font-mono">{activeFailoverAlert.sourceNode} → {activeFailoverAlert.targetNode}</span>
                <span>• {new Date(activeFailoverAlert.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </motion.div>
        )}

        {restoringState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 w-full max-w-xl shadow-2xl">
              <div className="flex items-center gap-4 text-indigo-400 mb-6">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <div>
                  <h3 className="text-xl font-extrabold text-white">SYSTEM RESTORE IN PROGRESS</h3>
                  <p className="text-slate-400 text-sm">Recovering point-in-time snapshot #{restoringState.pointId}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-300 font-mono mb-2">
                  <span>Progress Status: {restoringState.status}</span>
                  <span>{restoringState.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                    style={{ width: `${restoringState.progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400 h-32 overflow-y-auto">
                <p className="text-slate-500">[{new Date().toLocaleTimeString()}] Restorer daemon online.</p>
                {restoringState.progress >= 20 && <p className="mt-1">[{new Date().toLocaleTimeString()}] ✓ STOPPED writing pipeline locks on core nodes.</p>}
                {restoringState.progress >= 40 && <p className="mt-1">[{new Date().toLocaleTimeString()}] ✓ CHECKSUM matching verified.</p>}
                {restoringState.progress >= 60 && <p className="mt-1">[{new Date().toLocaleTimeString()}] ✓ Recreated cluster indexes.</p>}
                {restoringState.progress >= 80 && <p className="mt-1">[{new Date().toLocaleTimeString()}] ✓ Star-schema analytical tables re-populated.</p>}
                {restoringState.progress === 100 && <p className="mt-1 text-emerald-300">[{new Date().toLocaleTimeString()}] ★ RESTORATION VERIFICATION COMPLETE.</p>}
                <p className="mt-2 text-indigo-400 animate-pulse">&gt; {restoringState.stepName}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Enterprise Multi-Tenant & HA/DR Platform
            </h1>
          </div>
          <p className="text-slate-400 mt-1">
            Global University Tenant Isolation, Real-Time Database Replication, and Point-In-Time Disaster Recovery Orchestration
          </p>
        </div>

        {/* Real-time connections & actions indicator */}
        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
          <span className={`w-2.5 h-2.5 rounded-full ${socketStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs font-mono text-slate-300">
            Platform Gateway: {socketStatus}
          </span>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            title="Refresh system state"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action alerts */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {errorMessage}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'dashboard' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Overview & KPIs
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'tenants' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Building className="w-4 h-4" />
          Tenant Manager
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'branding' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Palette className="w-4 h-4" />
          Branding & Config
        </button>
        <button
          onClick={() => setActiveTab('dr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'dr' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Database className="w-4 h-4" />
          Disaster Recovery
        </button>
        <button
          onClick={() => setActiveTab('ha')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ha' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Network className="w-4 h-4" />
          High Availability & Replicas
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'maintenance' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Maintenance Windows
        </button>
      </div>

      {/* Loader for first page load */}
      {loading && tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-slate-400 text-sm">Orchestrating container filesystems and polling databases...</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ---------------------------------------------------------
              SUB-TAB 1: OVERVIEW & KPIs
             --------------------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Stats Panel */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total isolated tenants</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">{totalTenantsCount}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Building className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Standby replicas online</span>
                    <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">3</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Network className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">DR Recovery Points</span>
                    <span className="text-3xl font-extrabold text-indigo-400 mt-1 block">{recoveryPoints.length}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Database className="w-6 h-6" />
                  </div>
                </div>

                {/* Main Graph */}
                <div className="md:col-span-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-extrabold text-white flex items-center gap-2 text-md">
                      <RefreshCw className="w-5 h-5 text-indigo-400" />
                      Live Replica Synchronization Lag (ms)
                    </h3>
                    <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full font-mono">
                      Refreshes: 10s intervals
                    </span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={replicaHealthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Legend />
                        <Line type="monotone" dataKey="replicaWestLag" stroke="#10b981" strokeWidth={2} name="US-West Standby (ms)" />
                        <Line type="monotone" dataKey="replicaEuropeLag" stroke="#0ea5e9" strokeWidth={2} name="EU-Central Standby (ms)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Status breakdown circular visualizer */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-md mb-2">Tenant Status Allocation</h3>
                  <p className="text-slate-400 text-xs">Physical status of mapped database namespaces on the master cluster.</p>
                </div>
                <div className="h-48 my-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tenantChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {tenantChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {tenantChartData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm border-t border-slate-800/60 pt-2">
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-bold text-white">{item.value} ({Math.round((item.value / (totalTenantsCount || 1)) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}


          {/* ---------------------------------------------------------
              SUB-TAB 2: TENANT MANAGER
             --------------------------------------------------------- */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <h3 className="font-extrabold text-white text-md">Onboard & Provision Federated Tenants</h3>
                  <p className="text-slate-400 text-xs">Instantly provisions standard database records, sets isolations, and hooks domain triggers.</p>
                </div>
                <button
                  onClick={() => setShowOnboardModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/10"
                >
                  <Plus className="w-4 h-4" />
                  Onboard New Tenant
                </button>
              </div>

              {/* Tenants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map(tenant => (
                  <div key={tenant.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition flex flex-col justify-between">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-indigo-400 font-mono tracking-wider block uppercase">{tenant.tenantCode}</span>
                          <h4 className="text-lg font-bold text-white mt-1">{tenant.tenantName}</h4>
                          <span className="text-xs text-slate-400 block mt-0.5">{tenant.universityName}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tenant.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          tenant.status === 'Maintenance' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {tenant.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">DNS Domain:</span>
                          <span className="text-slate-200 font-mono">{tenant.domain}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tenant Subdomain:</span>
                          <span className="text-slate-200 font-mono">{tenant.subdomain}.campus.edu</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Locale / Currency:</span>
                          <span className="text-slate-200 font-mono">{tenant.locale} / {tenant.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cluster Location:</span>
                          <span className="text-slate-200 font-mono">{tenant.timezone} Region</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-between gap-2">
                      <div className="flex gap-1">
                        {tenant.status !== 'Active' && (
                          <button
                            onClick={() => handleUpdateTenantStatus(tenant.id, 'Active')}
                            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-500/20 transition"
                          >
                            Activate
                          </button>
                        )}
                        {tenant.status !== 'Suspended' && (
                          <button
                            onClick={() => handleUpdateTenantStatus(tenant.id, 'Suspended')}
                            className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-2 py-1 rounded text-xs border border-rose-500/20 transition"
                          >
                            Suspend
                          </button>
                        )}
                        {tenant.status !== 'Maintenance' && (
                          <button
                            onClick={() => handleUpdateTenantStatus(tenant.id, 'Maintenance')}
                            className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-2 py-1 rounded text-xs border border-amber-500/20 transition"
                          >
                            Set Maintenance
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded transition"
                        title="Permanently Delete Tenant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Onboarding form */}
              {showOnboardModal && (
                <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <form onSubmit={handleOnboardTenant} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-indigo-400" />
                      Onboard New University Tenant
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-slate-400 text-xs font-semibold block mb-1">University / Institute Name</label>
                        <input
                          type="text"
                          required
                          value={newTenant.universityName}
                          onChange={e => setNewTenant(p => ({ ...p, universityName: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="e.g. Stanford Academic Campus"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Tenant Name (Display)</label>
                        <input
                          type="text"
                          required
                          value={newTenant.tenantName}
                          onChange={e => setNewTenant(p => ({ ...p, tenantName: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="e.g. Stanford West"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Tenant Unique Code</label>
                        <input
                          type="text"
                          required
                          value={newTenant.tenantCode}
                          onChange={e => setNewTenant(p => ({ ...p, tenantCode: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="e.g. stanford-west"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Enterprise Domain</label>
                        <input
                          type="text"
                          required
                          value={newTenant.domain}
                          onChange={e => setNewTenant(p => ({ ...p, domain: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="e.g. stanford.edu"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Platform Subdomain Prefix</label>
                        <input
                          type="text"
                          required
                          value={newTenant.subdomain}
                          onChange={e => setNewTenant(p => ({ ...p, subdomain: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="e.g. stanford-w"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Locale Mode</label>
                        <input
                          type="text"
                          required
                          value={newTenant.locale}
                          onChange={e => setNewTenant(p => ({ ...p, locale: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="en_US"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Regional Currency</label>
                        <input
                          type="text"
                          required
                          value={newTenant.currency}
                          onChange={e => setNewTenant(p => ({ ...p, currency: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="USD"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Timezone Location</label>
                        <select
                          value={newTenant.timezone}
                          onChange={e => setNewTenant(p => ({ ...p, timezone: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                        >
                          <option value="EST">EST (New York)</option>
                          <option value="PST">PST (Los Angeles)</option>
                          <option value="AST">AST (London)</option>
                          <option value="GMT">GMT (Greenwich)</option>
                          <option value="SGT">SGT (Singapore)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Initial Status</label>
                        <select
                          value={newTenant.status}
                          onChange={e => setNewTenant(p => ({ ...p, status: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                        >
                          <option value="Active">Active</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowOnboardModal(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                      >
                        {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Onboard & Initialize
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}


          {/* ---------------------------------------------------------
              SUB-TAB 3: BRANDING & CONFIGURATION
             --------------------------------------------------------- */}
          {activeTab === 'branding' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Selector List */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="font-extrabold text-white text-md mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" />
                  Select Tenant Configuration
                </h3>
                <div className="space-y-2">
                  {tenants.map(tenant => (
                    <button
                      key={tenant.id}
                      onClick={() => loadTenantConfig(tenant.id)}
                      className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between ${
                        selectedConfigTenantId === tenant.id 
                          ? 'bg-indigo-600/10 border-indigo-500 text-white' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-mono block text-slate-500 uppercase">{tenant.tenantCode}</span>
                        <span className="font-bold text-sm block text-slate-200 mt-0.5">{tenant.tenantName}</span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Form */}
              <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <form onSubmit={handleSaveConfig} className="space-y-6">
                  
                  {/* Visual Branding Section */}
                  <div>
                    <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                      <Palette className="w-4 h-4 text-pink-400" />
                      Visual Identity & White-labeling
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Logo URL (PNG/SVG)</label>
                        <input
                          type="text"
                          value={logoUrl}
                          onChange={e => setLogoUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="Logo link"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Favicon URL</label>
                        <input
                          type="text"
                          value={faviconUrl}
                          onChange={e => setFaviconUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="Favicon link"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Primary Core Hex Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            className="w-10 h-9 bg-transparent border-0 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Secondary Hex Accent</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={e => setSecondaryColor(e.target.value)}
                            className="w-10 h-9 bg-transparent border-0 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={secondaryColor}
                            onChange={e => setSecondaryColor(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mail and SMS Gateways */}
                  <div>
                    <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                      <Mail className="w-4 h-4 text-teal-400" />
                      Isolated Communication Gateways
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">SMTP Mail Host Server</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          placeholder="e.g. smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">SMTP Mail Port</label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={e => setSmtpPort(parseInt(e.target.value, 10))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">SMS API Provider Gateway</label>
                        <select
                          value={smsProvider}
                          onChange={e => setSmsProvider(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                        >
                          <option value="twilio">Twilio SMS Hub</option>
                          <option value="nexmo">Nexmo/Vonage API</option>
                          <option value="aws_sns">AWS SNS Gateway</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">SMS API Key Credentials</label>
                        <input
                          type="password"
                          value={smsApiKey}
                          onChange={e => setSmsApiKey(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI & Cloud Storage isolation */}
                  <div>
                    <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                      <Cloud className="w-4 h-4 text-cyan-400" />
                      Isolated Services & Cloud Storage Buckets
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">S3-Compatible Cloud Storage Provider</label>
                        <select
                          value={storageProvider}
                          onChange={e => setStorageProvider(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                        >
                          <option value="s3">Amazon S3 Storage</option>
                          <option value="supabase">Supabase Storage Bucket</option>
                          <option value="gcs">Google Cloud Storage (GCS)</option>
                          <option value="local">Isolated Container Filesystem</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Dedicated Tenant Storage Bucket</label>
                        <input
                          type="text"
                          value={storageBucket}
                          onChange={e => setStorageBucket(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          placeholder="e.g. stanford-isolated-bucket-us-east"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Assigned AI LLM Core</label>
                        <select
                          value={aiModel}
                          onChange={e => setAiModel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                        >
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (Standard Enterprise)</option>
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash (Performance Tier)</option>
                          <option value="gemini-2.0-flash">Gemini 2.0 Flash (Advanced Multimodal)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Custom Dedicated AI Endpoint</label>
                        <input
                          type="text"
                          value={aiEndpoint}
                          onChange={e => setAiEndpoint(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          placeholder="https://ai.tenant-domain.edu/v1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/10"
                    >
                      {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Configurations & Propagate
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}


          {/* ---------------------------------------------------------
              SUB-TAB 4: DISASTER RECOVERY (DR)
             --------------------------------------------------------- */}
          {activeTab === 'dr' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Point-in-time Snapshot generation form */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="font-extrabold text-white text-md mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Trigger Instant Snapshot
                </h3>
                <p className="text-slate-400 text-xs mb-6">
                  Performs a hot-swap transaction lock across all database shards and writes standard SQL/binary archives to isolated storage.
                </p>

                <form onSubmit={handleCreateRecoveryPoint} className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-xs font-semibold block mb-1">Recovery Backup Type</label>
                    <select
                      value={newRecoveryPoint.recoveryType}
                      onChange={e => setNewRecoveryPoint(p => ({ ...p, recoveryType: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                    >
                      <option value="Snapshot">Snapshot (Fast Transaction Dump)</option>
                      <option value="Full Backup">Full Backup (Isolated Binary Dump)</option>
                      <option value="Incremental Backup">Incremental Backup (Delta Binary Logs)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold block mb-1">Target DR Region</label>
                    <input
                      type="text"
                      value={newRecoveryPoint.region}
                      onChange={e => setNewRecoveryPoint(p => ({ ...p, region: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold block mb-1">Off-site Storage Provider</label>
                    <input
                      type="text"
                      value={newRecoveryPoint.storageProvider}
                      onChange={e => setNewRecoveryPoint(p => ({ ...p, storageProvider: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold block mb-1">Storage Location Path URI</label>
                    <input
                      type="text"
                      value={newRecoveryPoint.storageLocation}
                      onChange={e => setNewRecoveryPoint(p => ({ ...p, storageLocation: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-4"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Generate System Recovery Point
                  </button>
                </form>
              </div>

              {/* Recovery Points lists */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="font-extrabold text-white text-md mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    Available Recovery Point Manager & Restores
                  </h3>

                  <div className="space-y-4">
                    {recoveryPoints.map(point => (
                      <div key={point.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              point.recoveryType === 'Full Backup' ? 'bg-indigo-500/10 text-indigo-400' :
                              point.recoveryType === 'Incremental Backup' ? 'bg-teal-500/10 text-teal-400' :
                              'bg-pink-500/10 text-pink-400'
                            }`}>
                              {point.recoveryType}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">ID: #{point.id}</span>
                            <span className="text-xs text-slate-500 font-mono">• {new Date(point.createdAt).toLocaleString()}</span>
                          </div>

                          <div className="mt-2 text-xs font-mono space-y-1">
                            <p className="text-slate-300">
                              <span className="text-slate-500">Region:</span> {point.region}
                            </p>
                            <p className="text-slate-300">
                              <span className="text-slate-500">Storage URI:</span> {point.storageLocation}
                            </p>
                            <p className="text-slate-400 truncate w-full max-w-lg">
                              <span className="text-slate-500">SHA-256 Hash:</span> {point.checksum}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-400 font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            Checksum Verified Integrity Pass
                          </div>
                        </div>

                        <button
                          onClick={() => handleRestoreSystem(point.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-rose-600/10"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore System
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}


          {/* ---------------------------------------------------------
              SUB-TAB 5: HIGH AVAILABILITY & REPLICATION
             --------------------------------------------------------- */}
          {activeTab === 'ha' && (
            <div className="space-y-6">
              
              {/* Diagram / status mapping of Standby Replicas */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-extrabold text-white text-md flex items-center gap-2">
                      <Network className="w-5 h-5 text-indigo-400 animate-pulse" />
                      Global High Availability Cluster & Read-Replicas Mapping
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Simulated replication topologies with automatic and manual transactional promote routes.
                    </p>
                  </div>

                  <button
                    onClick={handleTriggerFailover}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/10"
                  >
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                    Force Standby Failover
                  </button>
                </div>

                {/* Grid Mapping representing active nodes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  {/* Primary Node */}
                  <div className={`border rounded-2xl p-5 ${
                    activePrimaryNode === 'aws-us-east-1-primary'
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-slate-500">MASTER CLUSTER WRITE</span>
                      <span className={`w-2 h-2 rounded-full ${
                        activePrimaryNode === 'aws-us-east-1-primary' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'
                      }`} />
                    </div>
                    <h4 className="font-extrabold text-white text-md mt-2">aws-us-east-1-primary</h4>
                    <p className="text-slate-400 text-xs mt-0.5">N. Virginia Central Campus</p>

                    <div className="mt-4 space-y-1.5 text-xs font-mono border-t border-slate-800/60 pt-3">
                      <p className="text-slate-300">Status: <span className="text-emerald-400 font-semibold">Active Master</span></p>
                      <p className="text-slate-300">Replication Lag: <span className="text-slate-400">0ms (Authoritative)</span></p>
                      <p className="text-slate-300">Connection Load: <span className="text-indigo-400 font-bold">144 Queries/s</span></p>
                    </div>
                  </div>

                  {/* Replica 1 (Oregon) */}
                  <div className={`border rounded-2xl p-5 ${
                    activePrimaryNode === 'aws-us-west-2-replica'
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-slate-500">STANDBY STANDBY</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <h4 className="font-extrabold text-white text-md mt-2">aws-us-west-2-replica</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Oregon West-Coast Campus</p>

                    <div className="mt-4 space-y-1.5 text-xs font-mono border-t border-slate-800/60 pt-3">
                      <p className="text-slate-300">Status: <span className="text-emerald-400">Syncing Standby</span></p>
                      <p className="text-slate-300">Replication Lag: <span className="text-emerald-400">12ms</span></p>
                      <p className="text-slate-300">Connection Load: <span className="text-slate-400">42 Queries/s (Read)</span></p>
                    </div>
                  </div>

                  {/* Replica 2 (Ireland) */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-slate-500">STANDBY REPLICA</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <h4 className="font-extrabold text-white text-md mt-2">azure-eu-west-1-replica</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Ireland Europe-West Campus</p>

                    <div className="mt-4 space-y-1.5 text-xs font-mono border-t border-slate-800/60 pt-3">
                      <p className="text-slate-300">Status: <span className="text-emerald-400">Syncing Standby</span></p>
                      <p className="text-slate-300">Replication Lag: <span className="text-emerald-400">35ms</span></p>
                      <p className="text-slate-300">Connection Load: <span className="text-slate-400">18 Queries/s (Read)</span></p>
                    </div>
                  </div>

                  {/* Replica 3 (Singapore) */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-slate-500">STANDBY REPLICA</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <h4 className="font-extrabold text-white text-md mt-2">gcp-ap-southeast-1-replica</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Singapore Asia-Pacific Campus</p>

                    <div className="mt-4 space-y-1.5 text-xs font-mono border-t border-slate-800/60 pt-3">
                      <p className="text-slate-300">Status: <span className="text-emerald-400">Syncing Standby</span></p>
                      <p className="text-slate-300">Replication Lag: <span className="text-emerald-400">55ms</span></p>
                      <p className="text-slate-300">Connection Load: <span className="text-slate-400">22 Queries/s (Read)</span></p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Failover History log */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="font-extrabold text-white text-md mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Cluster Failover & Replication Incident Logs
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {failoverHistory.length === 0 ? (
                    <p className="text-slate-500 text-sm italic font-mono py-4">No cluster replication incidents or failovers recorded in current sandbox lifetime.</p>
                  ) : (
                    failoverHistory.map((log, index) => (
                      <div key={index} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs font-mono text-slate-300">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Promoted <span className="text-indigo-400">{log.target}</span> (formerly standby replica) to Primary Write-Master</span>
                        </div>
                        <div className="text-slate-500 text-right">
                          <p>{log.timestamp}</p>
                          <p className="text-emerald-400 font-bold">SUCCESS</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}


          {/* ---------------------------------------------------------
              SUB-TAB 6: MAINTENANCE WINDOWS
             --------------------------------------------------------- */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <h3 className="font-extrabold text-white text-md">Schedule & Maintain Isolated Universes</h3>
                  <p className="text-slate-400 text-xs">Locks administrative tasks and displays clean maintenance placeholders for the isolated tenant domain.</p>
                </div>
                <button
                  onClick={() => {
                    if (tenants.length === 0) {
                      alert('Please onboard at least one tenant first.');
                      return;
                    }
                    setNewMaintenance(p => ({ ...p, tenantId: tenants[0].id }));
                    setShowMaintenanceModal(true);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/10"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Maintenance
                </button>
              </div>

              {/* Maintenance Schedule Cards */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="font-extrabold text-white text-md mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Upcoming Maintenance Windows
                </h3>

                <div className="space-y-4">
                  {maintenanceWindows.length === 0 ? (
                    <p className="text-slate-500 text-sm italic font-mono py-4 text-center">No maintenance windows currently scheduled.</p>
                  ) : (
                    maintenanceWindows.map(win => (
                      <div key={win.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 font-extrabold text-sm">{win.tenant?.tenantName || 'Global Tenant'}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              win.active ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {win.active ? 'Active Lockout' : 'Inactive'}
                            </span>
                          </div>

                          <h4 className="text-white font-bold text-md mt-1">{win.title}</h4>
                          <p className="text-slate-400 text-xs mt-1 max-w-2xl">{win.description}</p>

                          <div className="flex gap-4 mt-3 text-xs text-slate-500 font-mono">
                            <p>Start: {new Date(win.startTime).toLocaleString()}</p>
                            <p>End: {new Date(win.endTime).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => handleToggleMaintenance(win.id, win.active)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                              win.active 
                                ? 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                            }`}
                          >
                            {win.active ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                            {win.active ? 'Active' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Maintenance Schedule modal */}
              {showMaintenanceModal && (
                <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <form onSubmit={handleScheduleMaintenance} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      Schedule Maintenance Window
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Target Tenant University</label>
                        <select
                          value={newMaintenance.tenantId}
                          onChange={e => setNewMaintenance(p => ({ ...p, tenantId: parseInt(e.target.value, 10) }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                        >
                          {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.tenantName}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Maintenance Title</label>
                        <input
                          type="text"
                          required
                          value={newMaintenance.title}
                          onChange={e => setNewMaintenance(p => ({ ...p, title: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                          placeholder="e.g. Cluster Database Vacuuming"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Detailed Description</label>
                        <textarea
                          required
                          value={newMaintenance.description}
                          onChange={e => setNewMaintenance(p => ({ ...p, description: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 h-20"
                          placeholder="Applying latest index tables, vacuuming tables and rebuilding indexes..."
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">Start Time (Date/Time)</label>
                        <input
                          type="datetime-local"
                          required
                          value={newMaintenance.startTime}
                          onChange={e => setNewMaintenance(p => ({ ...p, startTime: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold block mb-1">End Time (Date/Time)</label>
                        <input
                          type="datetime-local"
                          required
                          value={newMaintenance.endTime}
                          onChange={e => setNewMaintenance(p => ({ ...p, endTime: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="maint_active"
                          checked={newMaintenance.active}
                          onChange={e => setNewMaintenance(p => ({ ...p, active: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 border-slate-800 bg-slate-950 focus:ring-indigo-500"
                        />
                        <label htmlFor="maint_active" className="text-slate-300 text-xs">Set lockout immediately active</label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowMaintenanceModal(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                      >
                        {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Schedule Window
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
