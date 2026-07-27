import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Shield, Server, Activity, Database, Cpu, HardDrive, 
  RefreshCw, AlertTriangle, Play, FileText, CheckCircle2, XCircle, 
  Download, Plus, Search, Filter, Lock, Eye, EyeOff, BookOpen, 
  Clock, Check, Sparkles, Send, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';
import { DemoRestoreCard } from '../../components/common/DemoRestoreCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Legend
} from 'recharts';

interface DeploymentData {
  id: number;
  version: string;
  environment: string;
  deployedBy: string;
  deployedAt: string;
  status: string;
}

interface BackupData {
  id: number;
  backupType: string;
  storageLocation: string;
  createdAt: string;
  completedAt?: string;
  status: string;
}

interface InfrastructureAlertData {
  id: number;
  severity: string;
  source: string;
  message: string;
  resolved: boolean;
  createdAt: string;
}

interface EnvironmentVarData {
  id: number;
  key: string;
  environment: string;
  active: boolean;
  valueObfuscated: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

export function DevopsPage() {
  const { user } = useAuthStore();
  const userRole = user?.role || 'SUPER_ADMIN';

  // State Management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // DB Records
  const [deployments, setDeployments] = useState<DeploymentData[]>([]);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [alerts, setAlerts] = useState<InfrastructureAlertData[]>([]);
  const [envVars, setEnvVars] = useState<EnvironmentVarData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<any>({
    cpuUsage: 18,
    memoryUsage: 54,
    storageUsage: 62,
    activeAlertsCount: 0,
    queueStatus: 'Healthy',
    apiHealth: '100% Operational',
    databaseHealth: 'Connected (0ms Latency)',
    aiServiceHealth: 'Gemini-2.5-Flash Online',
    websocketConnections: 1
  });

  // Action forms state
  const [newVersion, setNewVersion] = useState('');
  const [newEnv, setNewEnv] = useState('Production');
  const [submittingDeploy, setSubmittingDeploy] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<number | null>(null);

  const [backupType, setBackupType] = useState('Database');
  const [creatingBackup, setCreatingBackup] = useState(false);

  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');
  const [envEnvironment, setEnvEnvironment] = useState('Production');
  const [submittingEnv, setSubmittingEnv] = useState(false);
  const [showSecretValue, setShowSecretValue] = useState<Record<string, boolean>>({});

  // Filters for Log viewer
  const [logSearch, setLogSearch] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [logSourceFilter, setLogSourceFilter] = useState('ALL');

  // Interactive playground for Docker & K8s guides
  const [selectedPlaygroundDoc, setSelectedPlaygroundDoc] = useState('dockerfile');
  const [customPort, setCustomPort] = useState('3000');
  const [nodeEnv, setNodeEnv] = useState('production');

  // Load DevOps data
  const loadDevopsData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/devops/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setAlerts(res.data.activeAlerts);
        setLogs(res.data.logs || []);
      }

      // Load specific lists
      const [deploymentsRes, backupsRes, alertsRes, envRes] = await Promise.all([
        apiClient.get('/api/devops/deployments').catch(() => ({ data: [] })),
        apiClient.get('/api/devops/backups').catch(() => ({ data: [] })),
        apiClient.get('/api/devops/alerts').catch(() => ({ data: [] })),
        apiClient.get('/api/devops/environment').catch(() => ({ data: [] }))
      ]);

      setDeployments(deploymentsRes.data);
      setBackups(backupsRes.data);
      if (alertsRes.data.length > 0) {
        setAlerts(alertsRes.data);
      }
      setEnvVars(envRes.data);
    } catch (err) {
      console.error('[DevOps Page] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevopsData();
    // Refresh metrics/logs periodically for real-time emulation
    const interval = setInterval(() => {
      setStats((prev: any) => ({
        ...prev,
        cpuUsage: Math.max(10, Math.min(95, prev.cpuUsage + Math.floor(Math.random() * 9) - 4)),
        memoryUsage: Math.max(30, Math.min(90, prev.memoryUsage + Math.floor(Math.random() * 5) - 2))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Form Submissions
  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion) return;
    try {
      setSubmittingDeploy(true);
      const res = await apiClient.post('/api/devops/deployments', {
        version: newVersion,
        environment: newEnv
      });
      if (res.data.success) {
        setNewVersion('');
        // Add optimistic record
        setDeployments(prev => [res.data.deployment, ...prev]);
        setTimeout(loadDevopsData, 4000); // Reload after backend simulation completes
      }
    } catch (err) {
      console.error('Failed to trigger deployment:', err);
    } finally {
      setSubmittingDeploy(false);
    }
  };

  const handleRollback = async (id: number) => {
    if (!window.confirm('Are you absolutely sure you want to rollback to this deployment version? This will change the running cluster configuration.')) return;
    try {
      setRollingBackId(id);
      const res = await apiClient.post('/api/devops/rollback', {
        targetDeploymentId: id
      });
      if (res.data.success) {
        setDeployments(prev => [res.data.deployment, ...prev]);
        setTimeout(loadDevopsData, 4500);
      }
    } catch (err) {
      console.error('Rollback failed:', err);
    } finally {
      setRollingBackId(null);
    }
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingBackup(true);
      const res = await apiClient.post('/api/devops/backups', { backupType });
      if (res.data.success) {
        setBackups(prev => [res.data.backup, ...prev]);
        setTimeout(loadDevopsData, 5000);
      }
    } catch (err) {
      console.error('Failed to start backup:', err);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      const res = await apiClient.post(`/api/devops/alerts/${id}/resolve`);
      if (res.data.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envKey || !envValue) return;
    try {
      setSubmittingEnv(true);
      const res = await apiClient.post('/api/devops/environment', {
        key: envKey,
        value: envValue,
        environment: envEnvironment
      });
      if (res.data.success) {
        setEnvKey('');
        setEnvValue('');
        // Reload list
        const listRes = await apiClient.get('/api/devops/environment');
        setEnvVars(listRes.data);
      }
    } catch (err) {
      console.error('Failed to add environment variable:', err);
    } finally {
      setSubmittingEnv(false);
    }
  };

  // Mock historical metrics for charts
  const performanceData = [
    { time: '10:00', cpu: 14, memory: 48, requests: 120, latency: 12 },
    { time: '10:05', cpu: 22, memory: 51, requests: 245, latency: 15 },
    { time: '10:10', cpu: 45, memory: 55, requests: 620, latency: 32 },
    { time: '10:15', cpu: 28, memory: 53, requests: 310, latency: 18 },
    { time: '10:20', cpu: 19, memory: 52, requests: 195, latency: 14 },
    { time: '10:25', cpu: 25, memory: 54, requests: 290, latency: 16 },
    { time: '10:30', cpu: 32, memory: 58, requests: 410, latency: 20 },
  ];

  const deploymentFreqData = [
    { date: '07/13', Production: 1, Staging: 3, Development: 12 },
    { date: '07/14', Production: 0, Staging: 1, Development: 8 },
    { date: '07/15', Production: 2, Staging: 2, Development: 15 },
    { date: '07/16', Production: 1, Staging: 4, Development: 10 },
    { date: '07/17', Production: 0, Staging: 1, Development: 7 },
    { date: '07/18', Production: 1, Staging: 3, Development: 11 },
    { date: '07/19', Production: 1, Staging: 2, Development: 6 },
  ];

  // Logs filtering logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                          log.source.toLowerCase().includes(logSearch.toLowerCase());
    const matchesLevel = logLevelFilter === 'ALL' || log.level.toUpperCase() === logLevelFilter;
    const matchesSource = logSourceFilter === 'ALL' || log.source === logSourceFilter;
    return matchesSearch && matchesLevel && matchesSource;
  });

  const uniqueSources = Array.from(new Set(logs.map(l => l.source)));

  // Interactive documentation code generators
  const getPlaygroundCode = () => {
    if (selectedPlaygroundDoc === 'dockerfile') {
      return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=${nodeEnv}
ENV PORT=${customPort}
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE ${customPort}
CMD ["node", "dist/server.cjs"]`;
    }

    if (selectedPlaygroundDoc === 'docker-compose') {
      return `version: '3.8'

services:
  smart-university-erp:
    build:
      context: .
      dockerfile: Dockerfile
    image: smart-university/erp:latest
    container_name: smart-erp-app
    ports:
      - "${customPort}:${customPort}"
    environment:
      - NODE_ENV=${nodeEnv}
      - PORT=${customPort}
      - DATABASE_URL=postgresql://postgres:secret@postgres:5432/postgres
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:15-alpine
    container_name: smart-erp-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: smart-erp-cache
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:`;
    }

    if (selectedPlaygroundDoc === 'kubernetes') {
      return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: smart-university-erp
  namespace: smart-campus
  labels:
    app: erp-core
spec:
  replicas: 3
  selector:
    matchLabels:
      app: erp-core
  template:
    metadata:
      labels:
        app: erp-core
    spec:
      containers:
      - name: erp-app
        image: smart-university/erp:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: ${customPort}
        env:
        - name: NODE_ENV
          value: "${nodeEnv}"
        - name: PORT
          value: "${customPort}"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: database-url
        resources:
          limits:
            cpu: "1"
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: ${customPort}
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /ready
            port: ${customPort}
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: erp-service
  namespace: smart-campus
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: ${customPort}
    protocol: TCP
  selector:
    app: erp-core`;
    }

    return '';
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([getPlaygroundCode()], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = selectedPlaygroundDoc === 'dockerfile' ? 'Dockerfile' : 
                       selectedPlaygroundDoc === 'docker-compose' ? 'docker-compose.yml' : 'deployment.yaml';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12" id="devops_page_root">
      {/* Header Panel */}
      <div className="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/30">
                <Terminal className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  Enterprise DevOps Control Center
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                    K8s Cluster Ready
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Kubernetes orchestrator, microservice dashboards, secure environment secrets, metrics logs, and system recovery.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-3">
            <button 
              onClick={loadDevopsData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync State
            </button>
            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold rounded-lg flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Production Active (v1.12.0)
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto flex space-x-1 py-1">
          {[
            { id: 'dashboard', name: 'DevOps Dashboard', icon: Server },
            { id: 'deployments', name: 'Deployments & Rollbacks', icon: Play },
            { id: 'monitoring', name: 'Monitoring & Metrics', icon: Activity },
            { id: 'backups', name: 'Infrastructure Backups', icon: Database },
            { id: 'alerts', name: 'System Alerts', icon: AlertTriangle },
            { id: 'env', name: 'Environment Secrets', icon: Shield },
            { id: 'logs', name: 'Interactive Logs', icon: FileText },
            { id: 'playground', name: 'K8s & Docker Playground', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                  active 
                    ? 'border-sky-600 text-sky-600 font-bold bg-sky-50/50' 
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Gauges */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* CPU Widget */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm font-semibold uppercase">Cluster CPU Allocation</span>
                      <Cpu className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold text-slate-800">{stats.cpuUsage}%</span>
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            stats.cpuUsage > 80 ? 'bg-rose-500' : stats.cpuUsage > 50 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${stats.cpuUsage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-3 flex items-center justify-between">
                      <span>4 Core Pod limit</span>
                      <span>Target: &lt; 70%</span>
                    </div>
                  </div>

                  {/* Memory Widget */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm font-semibold uppercase">RAM RSS Consumption</span>
                      <HardDrive className="h-5 w-5 text-sky-500" />
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold text-slate-800">{stats.memoryUsage}%</span>
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                        <div 
                          className="h-2 rounded-full bg-sky-500 transition-all duration-1000"
                          style={{ width: `${stats.memoryUsage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-3 flex items-center justify-between">
                      <span>8 GB Limit</span>
                      <span>Allocated: 4.3 GB</span>
                    </div>
                  </div>

                  {/* Storage Usage */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm font-semibold uppercase">Supabase Media Storage</span>
                      <Database className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold text-slate-800">{stats.storageUsage}%</span>
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                        <div 
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${stats.storageUsage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-3 flex items-center justify-between">
                      <span>Bucket Size: 100 GB</span>
                      <span>Active Backup Sync: OK</span>
                    </div>
                  </div>
                </div>

                {/* Microservice Health Indicators */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-4">Cluster Service Map</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/50">
                      <div className="flex items-center space-x-2.5">
                        <Server className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-bold text-slate-700">Database Core (Postgres)</span>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold uppercase">
                        {stats.databaseHealth}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/50">
                      <div className="flex items-center space-x-2.5">
                        <Cpu className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-bold text-slate-700">AI Gateway (Gemini API)</span>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold uppercase">
                        {stats.aiServiceHealth}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/50">
                      <div className="flex items-center space-x-2.5">
                        <Activity className="h-4 w-4 text-violet-600" />
                        <span className="text-sm font-bold text-slate-700">BullMQ Distributed Queue</span>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold uppercase">
                        {stats.queueStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/50">
                      <div className="flex items-center space-x-2.5">
                        <Network className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-bold text-slate-700">Express API Router Gateway</span>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold uppercase">
                        {stats.apiHealth}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Alerts Feed */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Unresolved Infrastructure Alerts</h3>
                    <span className="text-xs bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                      {alerts.filter(a => !a.resolved).length} Alerts Pending
                    </span>
                  </div>

                  <div className="space-y-3">
                    {alerts.filter(a => !a.resolved).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No active unresolved alerts. All cluster pods healthy!
                      </div>
                    ) : (
                      alerts.filter(a => !a.resolved).map((alert) => (
                        <div key={alert.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-start space-x-3">
                            <div className={`p-1.5 rounded mt-0.5 ${
                              alert.severity === 'Critical' ? 'bg-rose-100 text-rose-600' :
                              alert.severity === 'High' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{alert.source} • {alert.severity}</span>
                              <p className="text-sm font-medium text-slate-800 mt-0.5">{alert.message}</p>
                              <span className="text-xs text-slate-400 mt-1 block flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(alert.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-3 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Micro-terminal Feed */}
                <div className="bg-slate-900 rounded-xl p-6 shadow-xs border border-slate-800 text-slate-200 font-mono">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live System Logs Stream</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto text-[11px] leading-relaxed">
                    {logs.slice(-8).map((log, i) => (
                      <div key={i} className="hover:bg-slate-800/50 p-1 rounded">
                        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className={
                          log.level === 'error' ? 'text-rose-400 font-bold' :
                          log.level === 'warn' ? 'text-amber-400' : 'text-sky-400'
                        }>
                          [{log.level.toUpperCase()}]
                        </span>{' '}
                        <span className="text-slate-300 font-semibold">{log.source}:</span>{' '}
                        <span className="text-slate-400">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DEPLOYMENTS & ROLLBACKS */}
            {activeTab === 'deployments' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Deployment Form */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Play className="h-5 w-5 text-sky-600" />
                    Trigger New Deployment
                  </h3>
                  <form onSubmit={handleDeploy} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Build Target Version / SemVer
                      </label>
                      <input 
                        type="text" 
                        value={newVersion}
                        onChange={(e) => setNewVersion(e.target.value)}
                        placeholder="e.g. v1.12.1-rc2"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cluster Environment
                      </label>
                      <select 
                        value={newEnv}
                        onChange={(e) => setNewEnv(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="Development">Development (Cluster Dev-East)</option>
                        <option value="Staging">Staging (Cluster QA-West)</option>
                        <option value="Production">Production (Cluster Prod-Main)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDeploy}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                    >
                      {submittingDeploy ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Building & Verifying...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Build & Deploy Image
                        </>
                      )}
                    </button>
                  </form>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Automated CI/CD Specs</h4>
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
                      <li>Automated lint & unit-test suite run</li>
                      <li>Docker multi-stage image generation</li>
                      <li>Pushed to AWS Elastic Container Registry</li>
                      <li>Rolling Kubernetes update triggers automatically</li>
                    </ul>
                  </div>
                </div>

                {/* Deployment History List */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Deployment Log & Rollback Architecture</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">SemVer / Tag</th>
                          <th className="py-3 px-4">Environment</th>
                          <th className="py-3 px-4">Triggered By</th>
                          <th className="py-3 px-4">Deployed At</th>
                          <th className="py-3 px-4">State</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {deployments.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-bold text-sky-600">{d.version}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                d.environment === 'Production' ? 'bg-indigo-100 text-indigo-800' :
                                d.environment === 'Staging' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {d.environment}
                              </span>
                            </td>
                            <td className="py-3 px-4">{d.deployedBy}</td>
                            <td className="py-3 px-4 text-xs text-slate-400">{new Date(d.deployedAt).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`flex items-center gap-1.5 text-xs font-bold ${
                                d.status === 'Running' ? 'text-emerald-600' :
                                d.status === 'Failed' ? 'text-rose-600' : 'text-slate-500'
                              }`}>
                                <span className={`h-2 w-2 rounded-full ${
                                  d.status === 'Running' ? 'bg-emerald-500 animate-pulse' :
                                  d.status === 'Failed' ? 'bg-rose-500' : 'bg-slate-400'
                                }`} />
                                {d.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {d.status === 'Running' && d.environment === 'Production' && (
                                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                                  Running Live
                                </span>
                              )}
                              {d.status !== 'Running' && (
                                <button
                                  onClick={() => handleRollback(d.id)}
                                  disabled={rollingBackId === d.id}
                                  className="px-2.5 py-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded transition flex items-center gap-1 ml-auto"
                                >
                                  <RefreshCw className={`h-3 w-3 ${rollingBackId === d.id ? 'animate-spin' : ''}`} />
                                  Rollback Here
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MONITORING & METRICS */}
            {activeTab === 'monitoring' && (
              <div className="space-y-8">
                {/* Charts Block */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recharts CPU / RAM usage */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Cluster Resource Utilizations (L-5m)</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                          <defs>
                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis unit="%" />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="cpu" name="CPU Core load" stroke="#6366f1" fillOpacity={1} fill="url(#colorCpu)" />
                          <Area type="monotone" dataKey="memory" name="Memory utilization" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorMem)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recharts API performance */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">API Proxy Requests & Latency Metrics</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis yAxisId="left" label={{ value: 'Requests / min', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="right" orientation="right" label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight' }} />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="requests" name="Total HTTP traffic" stroke="#f43f5e" strokeWidth={2.5} activeDot={{ r: 8 }} />
                          <Line yAxisId="right" type="monotone" dataKey="latency" name="Service execution latency" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recharts Deployment Frequency */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Historical Deployment Frequencies</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deploymentFreqData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis label={{ value: 'Build occurrences', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Development" stackId="a" fill="#94a3b8" />
                          <Bar dataKey="Staging" stackId="a" fill="#0ea5e9" />
                          <Bar dataKey="Production" stackId="a" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3">Service Level Objectives (SLOs)</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Current system metrics mapped against university reliability agreements (SLA/SLO thresholds).
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>App Availability (SLA)</span>
                          <span className="text-emerald-600">99.98% / Target 99.9%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: '99.98%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>API Request Errors</span>
                          <span className="text-emerald-600">0.02% / Target &lt; 1%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: '98%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>Database Replication Latency</span>
                          <span className="text-emerald-600">45ms / Target &lt; 200ms</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: '95%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BACKUPS & STORAGE */}
            {activeTab === 'backups' && (
              <div className="flex flex-col gap-6">
                <DemoRestoreCard />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Backup Actions */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-sky-600" />
                    Trigger System Backup
                  </h3>
                  <form onSubmit={handleCreateBackup} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Select Backup Target
                      </label>
                      <select 
                        value={backupType}
                        onChange={(e) => setBackupType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="Database">PostgreSQL Relational DB</option>
                        <option value="Media">Supabase Asset Storage Buckets</option>
                        <option value="Configuration">System Environment Config (YAML/JSON)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingBackup}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                    >
                      {creatingBackup ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Backing up...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4" />
                          Execute Backup Task
                        </>
                      )}
                    </button>
                  </form>

                  <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 mt-6">
                    <h4 className="text-xs font-bold uppercase text-sky-800 tracking-wider mb-1.5">Automated Disaster Recovery</h4>
                    <p className="text-xs text-sky-700 leading-relaxed">
                      Every backup is securely compressed, encrypted with AES-256, and pushed to isolated multi-region Supabase storage. Backups are verified before cataloging.
                    </p>
                  </div>
                </div>

                {/* Backups Logs list */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Historical Storage Backup logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Backup Type</th>
                          <th className="py-3 px-4">File Name / Storage URI</th>
                          <th className="py-3 px-4">Triggered At</th>
                          <th className="py-3 px-4">Verification State</th>
                          <th className="py-3 px-4 text-right">Size / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {backups.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                b.backupType === 'Database' ? 'bg-indigo-100 text-indigo-800' :
                                b.backupType === 'Media' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {b.backupType}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-500 max-w-[200px] truncate" title={b.storageLocation}>
                              {b.storageLocation}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400">{new Date(b.createdAt).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`flex items-center gap-1 text-xs font-bold ${
                                b.status === 'Completed' ? 'text-emerald-600' : 'text-slate-500'
                              }`}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button 
                                onClick={() => alert('Disaster Recovery Plan initialized. Backups can only be recovered by authorized Database Administrators.')}
                                className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-1 rounded transition"
                              >
                                Recover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* TAB 5: SYSTEM ALERTS */}
            {activeTab === 'alerts' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Cluster Alert Management Suite</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Monitor and acknowledge infrastructure alerts from Docker containers, database pools, and Redis worker processes.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-xl border transition ${
                        alert.resolved 
                          ? 'bg-slate-50 border-slate-200 text-slate-500' 
                          : 'bg-rose-50/50 border-rose-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          alert.resolved ? 'bg-slate-100 text-slate-500' :
                          alert.severity === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{alert.source}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              alert.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${alert.resolved ? 'line-through text-slate-400' : 'font-semibold text-slate-800'}`}>
                            {alert.message}
                          </p>
                          <span className="text-xs text-slate-400 mt-1 block">
                            Triggered on {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0">
                        {alert.resolved ? (
                          <span className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/60 rounded-lg flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Resolved & Closed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition"
                          >
                            Acknowledge & Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: ENVIRONMENT VARIABLES */}
            {activeTab === 'env' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Secrets form */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-sky-600" />
                    Record Secure Environment Secret
                  </h3>
                  <form onSubmit={handleAddEnv} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Variable Key
                      </label>
                      <input 
                        type="text" 
                        value={envKey}
                        onChange={(e) => setEnvKey(e.target.value)}
                        placeholder="e.g. STRIPE_API_SECRET_KEY"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Secret Value
                      </label>
                      <input 
                        type="password" 
                        value={envValue}
                        onChange={(e) => setEnvValue(e.target.value)}
                        placeholder="••••••••••••••••••••"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Assigned Environment
                      </label>
                      <select 
                        value={envEnvironment}
                        onChange={(e) => setEnvEnvironment(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="Production">Production</option>
                        <option value="Staging">Staging</option>
                        <option value="Development">Development</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingEnv}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                    >
                      {submittingEnv ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Encrypting...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Secure & Save Variable
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Secure Env List */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Secured Config Encryption Registry</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Secret Key</th>
                          <th className="py-3 px-4">Scope Environment</th>
                          <th className="py-3 px-4">Encrypted Representation</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {envVars.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">{v.key}</td>
                            <td className="py-3 px-4">
                              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                {v.environment}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-400">
                              {showSecretValue[v.key] ? 'Obfuscated-AES256-Decrypted-Access' : v.valueObfuscated}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setShowSecretValue(prev => ({ ...prev, [v.key]: !prev[v.key] }))}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                                title="Reveal Value"
                              >
                                {showSecretValue[v.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SYSTEM LOGS */}
            {activeTab === 'logs' && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden text-slate-200 font-mono">
                {/* Interactive logs toolbar */}
                <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-sky-400" />
                    <span className="text-sm font-bold tracking-wider text-slate-300">Centralized Loki-Ready Log aggregator</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Log search */}
                    <div className="relative w-full md:w-48">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="text" 
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Filter log output..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    {/* Level filter */}
                    <select
                      value={logLevelFilter}
                      onChange={(e) => setLogLevelFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                    >
                      <option value="ALL">All Levels</option>
                      <option value="INFO">Info</option>
                      <option value="WARN">Warnings</option>
                      <option value="ERROR">Errors</option>
                    </select>

                    {/* Source filter */}
                    <select
                      value={logSourceFilter}
                      onChange={(e) => setLogSourceFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                    >
                      <option value="ALL">All Sources</option>
                      {uniqueSources.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Log terminal logs listing */}
                <div className="p-6 max-h-[500px] overflow-y-auto text-xs space-y-2 leading-relaxed">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      No logs found matching specified level and query.
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <div key={index} className="hover:bg-slate-800 p-1.5 rounded transition flex items-start gap-3">
                        <span className="text-slate-500 shrink-0 font-light">{new Date(log.timestamp).toLocaleString()}</span>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.level === 'error' ? 'bg-rose-500/20 text-rose-400' :
                          log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-sky-300 shrink-0 font-semibold">{log.source}:</span>
                        <span className="text-slate-300 select-text">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 8: PLAYGROUND */}
            {activeTab === 'playground' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-xs h-fit">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Orchestrator Config Generator</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Configuration Target Document
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'dockerfile', name: 'Dockerfile' },
                          { id: 'docker-compose', name: 'Compose' },
                          { id: 'kubernetes', name: 'K8s YAML' }
                        ].map(doc => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedPlaygroundDoc(doc.id)}
                            className={`py-2 text-xs font-bold rounded-lg border transition ${
                              selectedPlaygroundDoc === doc.id 
                                ? 'bg-slate-900 border-slate-900 text-white' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {doc.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Application Ingress Port
                      </label>
                      <input 
                        type="text" 
                        value={customPort} 
                        onChange={(e) => setCustomPort(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Default Node Environment
                      </label>
                      <select
                        value={nodeEnv}
                        onChange={(e) => setNodeEnv(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden"
                      >
                        <option value="production">production</option>
                        <option value="development">development</option>
                        <option value="staging">staging</option>
                      </select>
                    </div>

                    <button
                      onClick={handleDownloadCode}
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Configuration
                    </button>
                  </div>
                </div>

                {/* Display Editor */}
                <div className="lg:col-span-8 bg-slate-900 rounded-xl p-6 shadow-xl border border-slate-800 text-slate-200 font-mono flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500" />
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs text-slate-500 font-semibold tracking-wider">
                      {selectedPlaygroundDoc === 'dockerfile' ? 'Dockerfile (Multi-Stage Production)' : 
                       selectedPlaygroundDoc === 'docker-compose' ? 'docker-compose.yml' : 'k8s-deployment.yaml'}
                    </span>
                  </div>
                  <pre className="text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre p-2 bg-slate-950 rounded-lg border border-slate-800/80 max-h-[420px] select-all">
                    <code>{getPlaygroundCode()}</code>
                  </pre>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
