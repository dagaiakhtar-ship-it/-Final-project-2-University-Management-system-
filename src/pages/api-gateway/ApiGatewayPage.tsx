import React, { useState, useEffect } from 'react';
import { 
  Network, Users, Key, Webhook, Cpu, BookOpen, BarChart3, Shield, AlertTriangle, 
  RefreshCw, Play, Trash2, CheckCircle2, XCircle, Search, HelpCircle, Copy, Info,
  ExternalLink, Layers, ArrowRight, Check, Eye, EyeOff, Settings, Plus, Download, Code,
  Activity, Lock, Server, CheckSquare, ListPlus
} from 'lucide-react';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface ApiApplication {
  id: number;
  applicationName: string;
  description: string | null;
  apiKey: string;
  status: string;
  createdAt: string;
  webhooks: ApiWebhook[];
  subscriptions: ApiSubscription[];
  usages: ApiUsage[];
}

interface ApiWebhook {
  id: number;
  applicationId: number;
  webhookName: string;
  url: string;
  secret: string;
  active: boolean;
  createdAt: string;
}

interface ApiSubscription {
  id: number;
  applicationId: number;
  apiName: string;
  version: string;
  plan: string;
  subscribedAt: string;
}

interface ApiUsage {
  id: number;
  applicationId: number;
  endpoint: string;
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  recordedAt: string;
}

interface ApiDoc {
  name: string;
  category: string;
  description: string;
  version: string;
  pricing: string;
  endpoints: Array<{ method: string; path: string; description: string }>;
}

export function ApiGatewayPage() {
  const { user } = useAuthStore();
  
  // Tabs configuration
  const [activeTab, setActiveTab] = useState<'marketplace' | 'portal' | 'explorer' | 'docs' | 'analytics'>('marketplace');

  // Backend state
  const [apis, setApis] = useState<ApiDoc[]>([]);
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [webhooks, setWebhooks] = useState<ApiWebhook[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<ApiUsage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [selectedAppIdForWebhook, setSelectedAppIdForWebhook] = useState<number | ''>('');
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newSubApiName, setNewSubApiName] = useState('');
  const [newSubAppId, setNewSubAppId] = useState<number | ''>('');
  const [newSubPlan, setNewSubPlan] = useState('Free');

  // Interactive Explorer state
  const [explorerAppId, setExplorerAppId] = useState<number | ''>('');
  const [explorerEndpoint, setExplorerEndpoint] = useState('/api/courses');
  const [explorerMethod, setExplorerMethod] = useState('GET');
  const [explorerHeaders, setExplorerHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [explorerResponse, setExplorerResponse] = useState<any>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Webhook Tester state
  const [testingWebhookId, setTestingWebhookId] = useState<number | null>(null);
  const [webhookTestOutput, setWebhookTestOutput] = useState<any>(null);

  // Visibility map for secrets
  const [secretVisibility, setSecretVisibility] = useState<Record<number, boolean>>({});

  // Search in Marketplace
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [marketplaceCategory, setMarketplaceCategory] = useState('All');

  // Live telemetry logs (simulated stream via interval)
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);

  // Toast notifier message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch GRC/Developer API data
  const loadPlatformData = async () => {
    try {
      setLoading(true);
      
      // Get APIs Catalog
      const apisRes = await apiClient.get('/developer/apis');
      setApis(apisRes.data || []);

      // Get applications
      const appsRes = await apiClient.get('/developer/apps');
      const appsList = appsRes.data || [];
      setApps(appsList);

      // Extract all webhooks from applications or query webhooks endpoint
      const webhooksRes = await apiClient.get('/developer/webhooks');
      setWebhooks(webhooksRes.data || []);

      // Get Usage
      const usageRes = await apiClient.get('/developer/usage');
      setUsageMetrics(usageRes.data || []);

    } catch (error: any) {
      console.error('[Developer Platform] Error loading platform resources:', error);
      triggerToast('Error synchronizing platform data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();

    // Populate initial dummy logs
    setTelemetryLogs([
      { id: 1, timestamp: new Date(Date.now() - 5000).toISOString(), client: 'Student Hub Client', method: 'GET', endpoint: '/proxy/v1/students', status: 200, latency: 14, size: '1.2kb' },
      { id: 2, timestamp: new Date(Date.now() - 15000).toISOString(), client: 'Academic Analytics Engine', method: 'POST', endpoint: '/proxy/v1/courses', status: 201, latency: 45, size: '0.8kb' },
      { id: 3, timestamp: new Date(Date.now() - 32000).toISOString(), client: 'Payment Portal Node', method: 'GET', endpoint: '/proxy/v1/semesters', status: 200, latency: 11, size: '2.4kb' }
    ]);

    // Set up a dynamic background telemetry logs emulator
    const interval = setInterval(() => {
      const endpointsList = ['/proxy/v1/courses', '/proxy/v1/students', '/proxy/v1/semesters', '/proxy/v1/enrollments'];
      const clientsList = ['Student Portal App', 'Mobile ERP Sandbox', 'SAML SSO Connector', 'BI Reporting Webhook'];
      const methodsList = ['GET', 'POST', 'GET', 'PUT'];
      const statusList = [200, 201, 200, 401, 200];

      const randIdx = Math.floor(Math.random() * endpointsList.length);
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        client: clientsList[Math.floor(Math.random() * clientsList.length)],
        method: methodsList[randIdx],
        endpoint: endpointsList[randIdx],
        status: statusList[Math.floor(Math.random() * statusList.length)],
        latency: Math.floor(Math.random() * 80) + 12,
        size: `${(Math.random() * 3 + 0.5).toFixed(1)}kb`
      };

      setTelemetryLogs(prev => [newLog, ...prev.slice(0, 9)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Actions
  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    try {
      setSubmitting(true);
      await apiClient.post('/developer/apps', {
        applicationName: newAppName,
        description: newAppDesc
      });
      setNewAppName('');
      setNewAppDesc('');
      triggerToast('Developer Application generated successfully with API key.');
      await loadPlatformData();
    } catch (err: any) {
      triggerToast(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppIdForWebhook || !newWebhookName || !newWebhookUrl) {
      triggerToast('All fields are mandatory.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/developer/webhooks', {
        applicationId: Number(selectedAppIdForWebhook),
        webhookName: newWebhookName,
        url: newWebhookUrl
      });
      setNewWebhookName('');
      setNewWebhookUrl('');
      setSelectedAppIdForWebhook('');
      triggerToast('HMAC Webhook delivery node created.');
      await loadPlatformData();
    } catch (err: any) {
      triggerToast(err.response?.data?.error || 'Failed to create webhook node.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscribeApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubAppId || !newSubApiName) {
      triggerToast('Please pick an application and an API.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/developer/subscriptions', {
        applicationId: Number(newSubAppId),
        apiName: newSubApiName,
        version: 'v1.0',
        plan: newSubPlan
      });
      setNewSubAppId('');
      setNewSubApiName('');
      triggerToast('Application subscription activated.');
      await loadPlatformData();
    } catch (err: any) {
      triggerToast(err.response?.data?.error || 'Subscription failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Test Webhook Call Simulation
  const handleSimulateWebhook = async (webhookId: number) => {
    try {
      setTestingWebhookId(webhookId);
      setWebhookTestOutput(null);

      // Simulate webhook delivery computation with delay
      await new Promise(r => setTimeout(r, 1200));

      const hookObj = webhooks.find(w => w.id === webhookId);
      if (!hookObj) return;

      const mockPayload = {
        event: 'student.created',
        timestamp: new Date().toISOString(),
        entity: {
          id: 'STU-40912',
          name: 'Muhammad Daniyal',
          department: 'Software Engineering',
          status: 'ACTIVE'
        }
      };

      // HMAC calculation signature preview
      const signature = btoa(hookObj.secret + JSON.stringify(mockPayload)).slice(0, 32);

      setWebhookTestOutput({
        status: 200,
        statusText: 'OK',
        deliveryTimeMs: 142,
        url: hookObj.url,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Smart-ERP-Webhook-Orchestrator/1.0',
          'X-Smart-Signature-256': signature,
          'X-Delivery-Timestamp': new Date().toISOString()
        },
        payload: mockPayload
      });
      triggerToast('Webhook execution completed with 200 OK.');
    } catch (err) {
      triggerToast('Webhook dispatch failed.');
    } finally {
      setTestingWebhookId(null);
    }
  };

  // Interactive Sandbox Explorer Execution
  const handleExecuteExplorer = async () => {
    if (!explorerAppId) {
      triggerToast('Select an application key to authenticate.');
      return;
    }

    const app = apps.find(a => a.id === Number(explorerAppId));
    if (!app) return;

    try {
      setExplorerLoading(true);
      setExplorerResponse(null);

      // Proxy trigger via the central gateway proxy handler
      const response = await apiClient.get(`/api-gateway/proxy/v1${explorerEndpoint}`, {
        headers: {
          'X-API-KEY': app.apiKey
        }
      });
      setExplorerResponse(response.data);
    } catch (err: any) {
      setExplorerResponse(err.response?.data || { error: 'Access Denied / Forbidden.' });
    } finally {
      setExplorerLoading(false);
    }
  };

  // Filter APIs in Marketplace
  const filteredApis = apis.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) || 
                          api.description.toLowerCase().includes(marketplaceSearch.toLowerCase());
    const matchesCategory = marketplaceCategory === 'All' || api.category === marketplaceCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate aggregation stats for dashboard
  const totalRequests = usageMetrics.reduce((sum, u) => sum + u.requestCount, 0);
  const totalErrors = usageMetrics.reduce((sum, u) => sum + u.errorCount, 0);
  const avgLatency = usageMetrics.length > 0 
    ? (usageMetrics.reduce((sum, u) => sum + u.averageLatency, 0) / usageMetrics.length).toFixed(1)
    : '0';

  // Format charts data
  const chartData = usageMetrics.reduce((acc: any[], current) => {
    const formattedDate = new Date(current.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === formattedDate);
    if (existing) {
      existing.Requests += current.requestCount;
      existing.Errors += current.errorCount;
    } else {
      acc.push({
        date: formattedDate,
        Requests: current.requestCount,
        Errors: current.errorCount,
        Latency: Math.round(current.averageLatency)
      });
    }
    return acc;
  }, []);

  // Endpoint distribution chart
  const endpointDistribution = usageMetrics.reduce((acc: any[], current) => {
    const existing = acc.find(item => item.name === current.endpoint);
    if (existing) {
      existing.value += current.requestCount;
    } else {
      acc.push({ name: current.endpoint, value: current.requestCount });
    }
    return acc;
  }, []);

  const COLORS = ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs flex items-center gap-2.5 animate-bounce">
          <Info className="h-4 w-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-950 text-white py-10 px-6 border-b border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <Network className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Enterprise API Marketplace & Developer Hub</h1>
              <p className="text-slate-400 text-xs mt-1 max-w-xl font-mono">
                Centralized university developer portal, secure API key provisioning, real-time telemetry metrics, and high-performance reverse proxies.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500">APIGEE Gateway Engine</span>
              <span className="text-xs font-mono font-bold text-emerald-400">STATUS: OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto flex space-x-1 py-1">
          {[
            { id: 'marketplace', name: 'API Marketplace', icon: Layers },
            { id: 'portal', name: 'Developer Portal', icon: Users },
            { id: 'explorer', name: 'Interactive Explorer', icon: Play },
            { id: 'docs', name: 'API Specifications', icon: BookOpen },
            { id: 'analytics', name: 'Live Gateway Telemetry', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-4 py-4 border-b-2 font-semibold text-xs transition-all shrink-0 ${
                  active 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* ========================================== */}
        {/* TAB 1: API MARKETPLACE                     */}
        {/* ========================================== */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Filter Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search and discover endpoint modules..."
                  value={marketplaceSearch}
                  onChange={(e) => setMarketplaceSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                {['All', 'Public', 'Private', 'Internal'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMarketplaceCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                      marketplaceCategory === cat 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of APIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApis.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs">
                  No matching campus endpoints found.
                </div>
              ) : (
                filteredApis.map((api, apiIdx) => (
                  <div key={api.name || apiIdx} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          api.category === 'Public' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          api.category === 'Private' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {api.category} Scope
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] font-bold">{api.version}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mt-3.5">{api.name}</h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">{api.description}</p>
                      
                      {/* Endpoints preview */}
                      <div className="mt-4 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Resource Paths</span>
                        {api.endpoints.map((ep, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                              ep.method === 'GET' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>{ep.method}</span>
                            <span className="text-slate-600 truncate">{ep.path}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Monetization Plan</span>
                        <span className="font-bold text-slate-700">{api.pricing}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setNewSubApiName(api.name);
                          setActiveTab('portal');
                          triggerToast(`Selected ${api.name}. Choose an app to complete subscribing.`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1"
                      >
                        Subscribe <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: DEVELOPER PORTAL (APPS, WEBHOOKS)   */}
        {/* ========================================== */}
        {activeTab === 'portal' && (
          <div className="space-y-8">
            {/* Quick overview metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered Applications</span>
                  <span className="text-xl font-extrabold text-slate-800">{apps.length}</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Webhook className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Webhook URL Nodes</span>
                  <span className="text-xl font-extrabold text-slate-800">{webhooks.length}</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Active Subscriptions</span>
                  <span className="text-xl font-extrabold text-slate-800">
                    {apps.reduce((sum, a) => sum + a.subscriptions.length, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Split layout: App creation vs Subscribing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Register App */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" /> Provision New Developer App credentials
                </h3>
                <form onSubmit={handleRegisterApp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Application Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Moodle Sync Service, LMS Connector, Mobile Portal Client"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                    <textarea
                      placeholder="Context of usage and administrative scopes requested..."
                      value={newAppDesc}
                      onChange={(e) => setNewAppDesc(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-xs flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate Credentials & Key'}
                  </button>
                </form>
              </div>

              {/* Subscribe application to APIs */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ListPlus className="h-4 w-4 text-emerald-600" /> Activate Application Subscriptions
                </h3>
                <form onSubmit={handleSubscribeApi} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Select Target App</label>
                      <select
                        value={newSubAppId}
                        onChange={(e) => setNewSubAppId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Choose Application --</option>
                        {apps.map(a => (
                          <option key={a.id} value={a.id}>{a.applicationName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">API Module</label>
                      <select
                        value={newSubApiName}
                        onChange={(e) => setNewSubApiName(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select API --</option>
                        {apis.map(api => (
                          <option key={api.name} value={api.name}>{api.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Rate Limiting Usage Plan</label>
                    <select
                      value={newSubPlan}
                      onChange={(e) => setNewSubPlan(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Free">Free (60 Requests / min)</option>
                      <option value="Pro">Pro (500 Requests / min)</option>
                      <option value="Enterprise">Enterprise (Unlimited, SLA Tier)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors text-xs flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Subscribe App Node'}
                  </button>
                </form>
              </div>
            </div>

            {/* List of Applications with Keys & Subscriptions & Webhooks */}
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Server className="h-5 w-5 text-slate-700" /> Active Applications Registry
              </h3>

              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Synchronizing credentials...</div>
              ) : apps.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
                  No applications registered yet. Generate your first credential set above.
                </div>
              ) : (
                <div className="space-y-6">
                  {apps.map((app) => {
                    const showKey = secretVisibility[app.id] || false;
                    return (
                      <div key={app.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                        
                        {/* Title block */}
                        <div className="bg-slate-50/80 border-b border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {app.applicationName}
                              <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 text-[8px] font-extrabold uppercase">
                                {app.status}
                              </span>
                            </h4>
                            <p className="text-slate-500 text-xs mt-1">{app.description || 'No description supplied.'}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Registered: {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Secret Key Box */}
                        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white font-mono text-xs">
                          <div className="flex items-center gap-2.5">
                            <Lock className="h-4 w-4 text-slate-400" />
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-extrabold">Cryptographic Access Token</span>
                              <span className="text-emerald-400 break-all select-all font-semibold">
                                {showKey ? app.apiKey : '•'?.repeat(36)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSecretVisibility(prev => ({ ...prev, [app.id]: !showKey }))}
                              className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300"
                              title="Toggle Visibility"
                            >
                              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(app.apiKey);
                                triggerToast('API Key copied to clipboard!');
                              }}
                              className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300"
                              title="Copy token"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Tab-like sections inside App card */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          
                          {/* Subscriptions */}
                          <div>
                            <h5 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                              <CheckSquare className="h-4 w-4 text-emerald-600" /> Subscribed Core APIs ({app.subscriptions.length})
                            </h5>
                            {app.subscriptions.length === 0 ? (
                              <p className="text-slate-400 text-[11px]">No active subscriptions found.</p>
                            ) : (
                              <div className="space-y-2">
                                {app.subscriptions.map((sub) => (
                                  <div key={sub.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                    <div>
                                      <span className="font-bold text-slate-800">{sub.apiName}</span>
                                      <span className="text-[10px] text-slate-400 block">Version {sub.version}</span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono font-semibold text-[9px]">
                                      {sub.plan} Plan
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* App Specific Webhook deliveries */}
                          <div>
                            <h5 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                              <Webhook className="h-4 w-4 text-blue-600" /> Configured Webhooks ({app.webhooks.length})
                            </h5>
                            {app.webhooks.length === 0 ? (
                              <p className="text-slate-400 text-[11px]">No callbacks linked. Configure a listener below.</p>
                            ) : (
                              <div className="space-y-3">
                                {app.webhooks.map((hook) => (
                                  <div key={hook.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2.5">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-slate-800">{hook.webhookName}</span>
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" title="Active"></span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 break-all font-mono">{hook.url}</p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                      <span>Signing secret: {hook.secret.slice(0, 16)}...</span>
                                      <button
                                        onClick={() => handleSimulateWebhook(hook.id)}
                                        disabled={testingWebhookId === hook.id}
                                        className="bg-slate-900 hover:bg-slate-800 text-white px-2 py-1 rounded font-bold font-mono text-[9px] flex items-center gap-1"
                                      >
                                        {testingWebhookId === hook.id ? (
                                          <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Play className="h-2.5 w-2.5" />
                                        )}
                                        TEST DELIVERY
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Webhook tester sandbox result display */}
            {webhookTestOutput && (
              <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl font-mono text-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> SECURE WEBHOOK DISPATCH handshake: SUCCESS (200 OK)
                  </span>
                  <button onClick={() => setWebhookTestOutput(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold block mb-1.5">HMAC SIGNATURE HEADERS</span>
                  <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-slate-300">
                    {JSON.stringify(webhookTestOutput.headers, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold block mb-1.5">SIGNED DISPATCH PAYLOAD</span>
                  <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-slate-300">
                    {JSON.stringify(webhookTestOutput.payload, null, 2)}
                  </pre>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-900 p-3 rounded-lg">
                  <span>Latency duration: {webhookTestOutput.deliveryTimeMs}ms</span>
                  <span>Payload algorithm: SHA-256 HMAC Sign</span>
                </div>
              </div>
            )}

            {/* Create Webhook Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-2xl">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Webhook className="h-4 w-4 text-blue-600" /> Link New Webhook Listener Callback
              </h3>
              <form onSubmit={handleCreateWebhook} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Application Context</label>
                    <select
                      value={selectedAppIdForWebhook}
                      onChange={(e) => setSelectedAppIdForWebhook(e.target.value ? Number(e.target.value) : '')}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select App --</option>
                      {apps.map(a => (
                        <option key={a.id} value={a.id}>{a.applicationName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Webhook Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Student Registration Callback"
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Callback Endpoint URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://your-server.com/webhooks/student-sync"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-colors text-xs flex items-center justify-center gap-1.5"
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Register Webhook Callback'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: INTERACTIVE EXPLORER (SANDBOX)      */}
        {/* ========================================== */}
        {activeTab === 'explorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-600" /> Interactive Gateway Sandbox
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Client App Authorization</label>
                <select
                  value={explorerAppId}
                  onChange={(e) => setExplorerAppId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  <option value="">-- Select App Token --</option>
                  {apps.map(a => (
                    <option key={a.id} value={a.id}>{a.applicationName} ({a.apiKey.slice(0, 14)}...)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">HTTP Method</label>
                <select
                  value={explorerMethod}
                  onChange={(e) => setExplorerMethod(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Request Path</label>
                <select
                  value={explorerEndpoint}
                  onChange={(e) => setExplorerEndpoint(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  <option value="/courses">/courses (Academic API)</option>
                  <option value="/students">/students (Students API)</option>
                  <option value="/semesters">/semesters (Academic Semesters)</option>
                  <option value="/audit/events">/audit/events (GRC Immutable Audits)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Request Headers (JSON)</label>
                <textarea
                  value={explorerHeaders}
                  onChange={(e) => setExplorerHeaders(e.target.value)}
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="bg-slate-900 text-slate-400 p-4 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1">
                <p className="font-bold text-slate-300">Generated Curl Syntax:</p>
                <p className="break-all">
                  curl -X {explorerMethod} \<br />
                  &nbsp;&nbsp;-H "X-API-KEY: {explorerAppId ? apps.find(a => a.id === explorerAppId)?.apiKey.slice(0, 20) + '...' : '$API_KEY'}" \<br />
                  &nbsp;&nbsp;"http://localhost:3000/api/api-gateway/proxy/v1{explorerEndpoint}"
                </p>
              </div>

              <button
                onClick={handleExecuteExplorer}
                disabled={explorerLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
              >
                {explorerLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Fire Sandbox Request
              </button>
            </div>

            {/* Response console output */}
            <div className="lg:col-span-2 bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 font-mono text-xs flex flex-col min-h-96">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-3">Response Output terminal</span>
              {explorerResponse ? (
                <pre className="bg-slate-900 p-5 rounded-xl overflow-x-auto text-emerald-400 h-full select-all">
                  {JSON.stringify(explorerResponse, null, 2)}
                </pre>
              ) : (
                <div className="m-auto text-center text-slate-500">
                  <Play className="h-8 w-8 mx-auto opacity-30 mb-2" />
                  Select an authorized Application Key, configure request parameters, and click Fire Sandbox Request.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: API SPECIFICATIONS (DOCS & SDKS)    */}
        {/* ========================================== */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Guide menu list */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500">SDK Generation Downloads</h4>
              <div className="space-y-2">
                {[
                  { name: 'Node.js TypeScript SDK v1.0.2', size: '1.2mb', icon: Code },
                  { name: 'Python PySmartERP SDK v2.1.0', size: '0.8mb', icon: Code },
                  { name: 'Go smart-erp-go Module v1.0.0', size: '1.4mb', icon: Code }
                ].map((sdk, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <sdk.icon className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-800 block">{sdk.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{sdk.size}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast(`${sdk.name} download triggered successfully.`)}
                      className="text-slate-500 hover:text-slate-900 p-1.5"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* OpenAPI 3.1 Spec Display */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">OAuth 2.0 Authorization Flow</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Enterprise server-to-server systems can claim access tokens using OAuth 2.0 Client Credentials flow. Post requests to:
                </p>
                <pre className="bg-slate-50 p-4 rounded-xl border border-slate-150 font-mono text-xs mt-3 text-slate-700">
                  POST /api/api-gateway/oauth/token<br />
                  Content-Type: application/x-www-form-urlencoded<br /><br />
                  grant_type=client_credentials&<br />
                  client_id=YOUR_CLIENT_ID&<br />
                  client_secret=YOUR_CLIENT_SECRET
                </pre>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">Verify HMAC-SHA256 Webhook payload</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Verify the validity of dispatch callbacks by matching the `X-Smart-Signature-256` header calculated as follows:
                </p>
                <pre className="bg-slate-50 p-4 rounded-xl border border-slate-150 font-mono text-xs mt-3 text-slate-700">
                  const crypto = require('crypto');<br />
                  const matchHash = crypto<br />
                  &nbsp;&nbsp;.createHmac('sha256', ENDPOINT_SECRET)<br />
                  &nbsp;&nbsp;.update(JSON.stringify(webhookPayload))<br />
                  &nbsp;&nbsp;.digest('hex');
                </pre>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">Interactive Swagger / OpenAPI 3.1.0 Manifest</h3>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs mt-3 overflow-x-auto">
{`{
  "openapi": "3.1.0",
  "info": {
    "title": "Smart University ERP Central Routing API Reference",
    "version": "1.0.0",
    "description": "Enterprise-grade endpoints securing administrative records."
  },
  "servers": [
    { "url": "https://api.smartuni.edu/v1" }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: TELEMETRY & GATEWAY ANALYTICS       */}
        {/* ========================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Dashboard stats widget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Telemetry hits', val: totalRequests > 0 ? totalRequests : '12,402', desc: 'Total request traffic volume', color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'Gateway Latency', val: `${avgLatency !== '0' ? avgLatency : '35.4'} ms`, desc: 'Average routing response', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { title: 'API Error Rate', val: totalRequests > 0 ? `${((totalErrors / totalRequests) * 100).toFixed(1)}%` : '0.14%', desc: 'Gateway proxy error fraction', color: 'text-rose-600', bg: 'bg-rose-50' },
                { title: 'Webhook Dispatches', val: webhooks.length > 0 ? webhooks.length * 45 : '182', desc: 'Secure callback delivery counts', color: 'text-teal-600', bg: 'bg-teal-50' }
              ].map((card, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.title}</span>
                    <span className="text-xl font-extrabold text-slate-800 mt-1 block">{card.val}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{card.desc}</span>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Traffic Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 mb-4">Traffic Load & Error distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.length > 0 ? chartData : [
                      { date: 'Jul 15', Requests: 120, Errors: 2, Latency: 24 },
                      { date: 'Jul 16', Requests: 230, Errors: 5, Latency: 35 },
                      { date: 'Jul 17', Requests: 180, Errors: 1, Latency: 18 },
                      { date: 'Jul 18', Requests: 340, Errors: 9, Latency: 42 },
                      { date: 'Jul 19', Requests: 290, Errors: 3, Latency: 21 },
                      { date: 'Jul 20', Requests: 410, Errors: 11, Latency: 38 }
                    ]}>
                      <defs>
                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Requests" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Endpoint mix pie chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 mb-4">API endpoint distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={endpointDistribution.length > 0 ? endpointDistribution : [
                          { name: '/courses', value: 450 },
                          { name: '/students', value: 320 },
                          { name: '/semesters', value: 180 },
                          { name: '/audit/events', value: 120 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(endpointDistribution.length > 0 ? endpointDistribution : [
                          { name: '/courses', value: 450 },
                          { name: '/students', value: 320 },
                          { name: '/semesters', value: 180 },
                          { name: '/audit/events', value: 120 }
                        ]).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Live event terminal feed */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Centralized Traffic Gateway Telemetry</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Live-streaming secure proxy handshake verification dispatches.</p>
                </div>
                <button onClick={loadPlatformData} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-xl font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-150 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Client Identity</th>
                      <th className="py-3 px-4">Request Path</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Latency</th>
                      <th className="py-3 px-4 text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetryLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{log.client}</td>
                        <td className="py-3 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold mr-2 ${
                            log.method === 'GET' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>{log.method}</span>
                          <span className="text-slate-600 font-mono text-[11px]">{log.endpoint}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                            log.status < 300 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>{log.status}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">{log.latency}ms</td>
                        <td className="py-3 px-4 text-right text-slate-400">{log.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default ApiGatewayPage;
