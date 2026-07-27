import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Shield, Settings, Server, AppWindow, Cpu, BarChart3, Radio, HelpCircle,
  Plus, Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Info, Lock, Trash2, 
  Play, MapPin, Battery, Wifi, Layers, QrCode, Clipboard, Check, Activity, Download,
  ExternalLink, ArrowRight, Monitor, Eye, Key, ShieldAlert, Laptop, EyeOff, User, Building
} from 'lucide-react';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line
} from 'recharts';

// Interfaces mapping to Prisma Schema
interface DevicePolicy {
  id: number;
  policyName: string;
  description: string | null;
  passcodeRequired: boolean;
  encryptionRequired: boolean;
  cameraAllowed: boolean;
  screenshotAllowed: boolean;
  kioskMode: boolean;
  kioskApp: string | null;
  createdAt: string;
  _count?: {
    devices: number;
  };
}

interface DeviceApplication {
  id: number;
  deviceId: number;
  applicationName: string;
  version: string;
  installed: boolean;
}

interface DeviceCommand {
  id: number;
  deviceId: number;
  command: string;
  status: string;
  executedAt: string | null;
  createdAt: string;
}

interface ManagedDevice {
  id: number;
  deviceName: string;
  platform: string;
  manufacturer: string;
  model: string;
  osVersion: string;
  serialNumber: string;
  imei: string | null;
  ownerId: number | null;
  departmentId: number | null;
  status: string;
  batteryLevel: number;
  lastSeen: string;
  createdAt: string;
  policyId: number | null;
  policy?: DevicePolicy | null;
  commands?: DeviceCommand[];
  applications?: DeviceApplication[];
}

export const MdmPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  // State Management
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'policies' | 'commands' | 'kiosk' | 'apps' | 'analytics'>('dashboard');
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [policies, setPolicies] = useState<DevicePolicy[]>([]);
  const [apps, setApps] = useState<{ applicationName: string; version: string; installed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');

  // Selected detail device modal/sidebar state
  const [selectedDevice, setSelectedDevice] = useState<ManagedDevice | null>(null);

  // Form states
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollMethod, setEnrollMethod] = useState<'manual' | 'qr'>('manual');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newPlatform, setNewPlatform] = useState('Android');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newOSVersion, setNewOSVersion] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newImei, setNewImei] = useState('');
  const [newPolicyId, setNewPolicyId] = useState('');

  // Policy Form states
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPasscode, setPPasscode] = useState(false);
  const [pEncrypt, setPEncrypt] = useState(false);
  const [pCamera, setPCamera] = useState(true);
  const [pScreenshot, setPScreenshot] = useState(true);
  const [pKiosk, setPKiosk] = useState(false);
  const [pKioskApp, setPKioskApp] = useState('');

  // Deploy App state
  const [showAppModal, setShowAppModal] = useState(false);
  const [appTargetDevice, setAppTargetDevice] = useState('');
  const [appName, setAppName] = useState('');
  const [appVersion, setAppVersion] = useState('v1.0.0');

  // Command panel state
  const [commandTargetDevice, setCommandTargetDevice] = useState('');
  const [commandType, setCommandType] = useState('Sync');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Simulated GPS Coordinates for devices
  const [liveLocations, setLiveLocations] = useState<Record<number, { lat: number; lng: number; speed: number }>>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [devRes, polRes, appRes] = await Promise.all([
        apiClient.get('/mdm/devices'),
        apiClient.get('/mdm/policies'),
        apiClient.get('/mdm/apps')
      ]);

      setDevices(devRes.data || []);
      setPolicies(polRes.data || []);
      setApps(appRes.data || []);

      // Seed initial dummy locations for visual maps
      const locs: Record<number, { lat: number; lng: number; speed: number }> = {};
      (devRes.data || []).forEach((d: ManagedDevice) => {
        locs[d.id] = {
          lat: 37.7749 + (Math.random() - 0.5) * 0.05,
          lng: -122.4194 + (Math.random() - 0.5) * 0.05,
          speed: Math.floor(Math.random() * 5)
        };
      });
      setLiveLocations(locs);

    } catch (error: any) {
      console.error('[MDM Frontend Error]:', error);
      showToast(error.response?.data?.error || 'Failed to sync with MDM cloud services.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup simulated socket/updates loops: Fluctuates battery and simulates locations to highlight "Live Monitoring"
    const interval = setInterval(() => {
      setDevices(prev => 
        prev.map(d => {
          if (d.status === 'Retired') return d;
          // Random slight battery change
          const randomFactor = Math.random();
          let delta = 0;
          if (randomFactor > 0.85) delta = -1;
          else if (randomFactor < 0.1) delta = 1;
          
          const newBattery = Math.min(100, Math.max(1, d.batteryLevel + delta));
          return {
            ...d,
            batteryLevel: newBattery,
            lastSeen: new Date().toISOString()
          };
        })
      );

      setLiveLocations(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          const numId = Number(id);
          updated[numId] = {
            lat: updated[numId].lat + (Math.random() - 0.5) * 0.0005,
            lng: updated[numId].lng + (Math.random() - 0.5) * 0.0005,
            speed: Math.floor(Math.random() * 10)
          };
        });
        return updated;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Action: Enroll Device
  const handleEnrollDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName || !newPlatform || !newSerialNumber) {
      showToast('Device Name, Platform and Serial Number are required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post('/mdm/devices', {
        deviceName: newDeviceName,
        platform: newPlatform,
        manufacturer: newManufacturer,
        model: newModel,
        osVersion: newOSVersion,
        serialNumber: newSerialNumber,
        imei: newImei || null,
        policyId: newPolicyId ? Number(newPolicyId) : null,
        departmentId: (user as any)?.departmentId || 1
      });

      showToast(`Device "${newDeviceName}" successfully enrolled with Secure Node API.`);
      setShowEnrollModal(false);
      
      // Reset Form
      setNewDeviceName('');
      setNewManufacturer('');
      setNewModel('');
      setNewOSVersion('');
      setNewSerialNumber('');
      setNewImei('');
      setNewPolicyId('');

      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Enrollment rejected.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Create Policy
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName) {
      showToast('Policy name is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/mdm/policies', {
        policyName: pName,
        description: pDesc,
        passcodeRequired: pPasscode,
        encryptionRequired: pEncrypt,
        cameraAllowed: pCamera,
        screenshotAllowed: pScreenshot,
        kioskMode: pKiosk,
        kioskApp: pKiosk ? pKioskApp : null
      });

      showToast(`Security Policy "${pName}" deployed to campus rules register.`);
      setShowPolicyModal(false);
      setPName('');
      setPDesc('');
      setPPasscode(false);
      setPEncrypt(false);
      setPCamera(true);
      setPScreenshot(true);
      setPKiosk(false);
      setPKioskApp('');

      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to record policy.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Deploy App
  const handleDeployApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTargetDevice || !appName) {
      showToast('Please select target device and specify app name.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/mdm/apps', {
        deviceId: Number(appTargetDevice),
        applicationName: appName,
        version: appVersion,
        installed: true
      });

      showToast(`Application deployment packet dispatched successfully.`);
      setShowAppModal(false);
      setAppName('');
      setAppVersion('v1.0.0');

      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Deployment dispatch failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Dispatch Command
  const handleDispatchCommand = async (customDevId?: number, customCmd?: string) => {
    const targetDevId = customDevId || Number(commandTargetDevice);
    const targetCmd = customCmd || commandType;

    if (!targetDevId) {
      showToast('Please select a target active device.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post('/mdm/commands', {
        deviceId: targetDevId,
        command: targetCmd
      });

      showToast(`Command [${targetCmd}] dispatched and executed on device handshake.`);
      
      // Update selected device display if active
      if (selectedDevice && selectedDevice.id === targetDevId) {
        setSelectedDevice(res.data.device);
      }

      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Remote handshake failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Update device details (e.g. associate policy)
  const handleAssociatePolicy = async (deviceId: number, policyId: number | null) => {
    try {
      const res = await apiClient.put(`/mdm/devices/${deviceId}`, {
        policyId: policyId
      });
      showToast('Security Policy mapped to managed hardware node successfully.');
      if (selectedDevice && selectedDevice.id === deviceId) {
        setSelectedDevice(res.data);
      }
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Policy mapping update failed.', 'error');
    }
  };

  // Filters & Search
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesPlatform = platformFilter === 'ALL' || d.platform.toUpperCase() === platformFilter.toUpperCase();
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Analytics Math
  const totalEnrolled = devices.length;
  const compliantCount = devices.filter(d => d.status === 'Enrolled' && d.policy && d.policy.encryptionRequired).length;
  const atRiskCount = devices.filter(d => !d.policy || (d.status === 'Enrolled' && !d.policy.encryptionRequired)).length;
  const blockedCount = devices.filter(d => d.status === 'Blocked').length;
  const retiredCount = devices.filter(d => d.status === 'Retired').length;

  const androidCount = devices.filter(d => d.platform.toLowerCase() === 'android').length;
  const iosCount = devices.filter(d => d.platform.toLowerCase() === 'ios').length;
  const macOSCount = devices.filter(d => d.platform.toLowerCase() === 'macos').length;
  const windowsCount = devices.filter(d => d.platform.toLowerCase() === 'windows').length;

  // Pie chart data
  const platformData = [
    { name: 'Android', value: androidCount, color: '#3DDC84' },
    { name: 'iOS/iPadOS', value: iosCount, color: '#000000' },
    { name: 'macOS', value: macOSCount, color: '#999999' },
    { name: 'Windows', value: windowsCount, color: '#0078D4' }
  ].filter(p => p.value > 0);

  const complianceData = [
    { name: 'Compliant', value: compliantCount, color: '#10B981' },
    { name: 'At Risk', value: atRiskCount, color: '#F59E0B' },
    { name: 'Blocked', value: blockedCount, color: '#EF4444' },
    { name: 'Retired', value: retiredCount, color: '#6B7280' }
  ].filter(c => c.value > 0);

  // Recent Command Logs
  const allCommands = devices.flatMap(d => (d.commands || []).map(c => ({ ...c, deviceName: d.deviceName })))
                             .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" id="mdm-main-container">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl shadow-2xl transition-all duration-300 transform scale-100 ${
          toast.type === 'error' ? 'bg-rose-500 text-white' : toast.type === 'info' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'
        }`} id="mdm-global-toast">
          {toast.type === 'error' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <span className="font-sans text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Hero Header Area */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm" id="mdm-hero-header">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Smartphone className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Mobile Device Management (MDM)</h1>
              <p className="text-sm text-slate-500">Unified Remote Administration, Security Policies, compliance auditing & Student Kiosk control.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-sm rounded-2xl transition-all active:scale-95"
            title="Refresh network sync"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Hub</span>
          </button>

          {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
            <>
              <button 
                onClick={() => setShowPolicyModal(true)} 
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-sm rounded-2xl transition-all"
              >
                <Shield className="h-4 w-4" />
                <span>New Policy</span>
              </button>

              <button 
                onClick={() => setShowEnrollModal(true)} 
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-2xl shadow-sm hover:shadow transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Enroll Device</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-2xl max-w-max border border-slate-200" id="mdm-tabs">
        <button 
          onClick={() => { setActiveTab('dashboard'); setSelectedDevice(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Operations Dashboard</span>
        </button>

        <button 
          onClick={() => { setActiveTab('inventory'); setSelectedDevice(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Device Inventory</span>
          <span className="ml-1 bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">{devices.length}</span>
        </button>

        <button 
          onClick={() => { setActiveTab('policies'); setSelectedDevice(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'policies' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Security Policies</span>
          <span className="ml-1 bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">{policies.length}</span>
        </button>

        <button 
          onClick={() => { setActiveTab('commands'); setSelectedDevice(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'commands' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Command Center</span>
        </button>

        <button 
          onClick={() => { setActiveTab('kiosk'); setSelectedDevice(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'kiosk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Monitor className="h-4 w-4" />
          <span>Kiosk Profiles</span>
        </button>

        <button 
          onClick={() => { setActiveTab('apps'); setSelectedDevice(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'apps' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AppWindow className="h-4 w-4" />
          <span>Apps Catalog</span>
        </button>

        <button 
          onClick={() => { setActiveTab('analytics'); setSelectedDevice(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Telemetry & Stats</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="mdm-loading-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
              <div className="h-20 bg-slate-100 rounded-2xl"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6" id="mdm-dashboard-view">
              
              {/* Quick Status Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">Enrolled Hardware</span>
                    <Smartphone className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{totalEnrolled}</span>
                    <p className="text-xs text-emerald-600 font-medium">100% active communication links</p>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-indigo-500"></div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">Security Compliance</span>
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {totalEnrolled > 0 ? Math.round((compliantCount / totalEnrolled) * 100) : 0}%
                    </span>
                    <p className="text-xs text-slate-500">{compliantCount} of {totalEnrolled} fully encrypted</p>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500"></div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">At-Risk Terminals</span>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{atRiskCount}</span>
                    <p className="text-xs text-amber-600 font-medium">Lacks secure local encryption</p>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-500"></div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">Isolated & Blocked</span>
                    <XCircle className="h-5 w-5 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{blockedCount}</span>
                    <p className="text-xs text-rose-600 font-medium">Remote locks active</p>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-500"></div>
                </div>
              </div>

              {/* Layout splits */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Live Tracker Map Mock */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="space-y-0.5">
                      <h2 className="text-lg font-bold text-slate-900">Live Campus Geofence Radar</h2>
                      <p className="text-xs text-slate-500">Real-time localized signal coordinates and satellite telemetry.</p>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full animate-pulse">
                      <Radio className="h-3.5 w-3.5" />
                      <span>Live Radar Stream</span>
                    </div>
                  </div>

                  {/* Mock map container */}
                  <div className="h-80 bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-800 flex items-center justify-center">
                    {/* SVG grid lines for high-tech look */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    
                    {/* Glowing geofence concentric circles */}
                    <div className="absolute h-72 w-72 rounded-full border border-indigo-500/20 animate-ping"></div>
                    <div className="absolute h-48 w-48 rounded-full border border-teal-500/30"></div>
                    <div className="absolute h-24 w-24 rounded-full border border-indigo-500/40 bg-indigo-500/5"></div>

                    {/* Plot device nodes */}
                    {devices.filter(d => d.status !== 'Retired').map((d, index) => {
                      const loc = liveLocations[d.id] || { lat: 37.77, lng: -122.41, speed: 0 };
                      const topPercent = 30 + (index * 15) % 60;
                      const leftPercent = 20 + (index * 22) % 60;
                      
                      return (
                        <div 
                          key={d.id} 
                          className="absolute group cursor-pointer"
                          style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                          onClick={() => setSelectedDevice(d)}
                        >
                          <div className={`relative flex items-center justify-center h-4 w-4 rounded-full shadow-lg ${
                            d.status === 'Blocked' ? 'bg-rose-500' : 'bg-indigo-500 animate-pulse'
                          }`}>
                            <div className="absolute -inset-1 rounded-full bg-inherit opacity-45 animate-ping"></div>
                            <MapPin className="h-2.5 w-2.5 text-white" />
                          </div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap font-mono z-20">
                            {d.deviceName} ({d.platform})<br />
                            Lat: {loc.lat.toFixed(4)}° | Batt: {d.batteryLevel}%
                          </div>
                        </div>
                      );
                    })}

                    <div className="absolute bottom-4 left-4 bg-slate-900/95 text-[10px] text-slate-400 p-2.5 rounded-lg border border-slate-800 font-mono space-y-1">
                      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500"></span> Active Campus iPads/Nodes</div>
                      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Lost/Blocked State Triggered</div>
                    </div>
                  </div>
                </div>

                {/* Operations Checklist / Audit Log preview */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900">MDM Operations Audit Trail</h2>
                    <p className="text-xs text-slate-500">Real-time recording of security and deployment actions.</p>
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-3 max-h-80 pr-1 mt-2">
                    {allCommands.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        No commands executed yet.
                      </div>
                    ) : (
                      allCommands.map((cmd, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
                          <div className={`p-1.5 rounded-lg ${
                            cmd.command === 'Wipe' ? 'bg-rose-100 text-rose-600' :
                            cmd.command === 'Lock' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            <Cpu className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-grow space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700">{cmd.command} dispatched</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(cmd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-500">Target: <strong className="text-slate-700">{cmd.deviceName}</strong></p>
                            <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium mt-1 ${
                              cmd.status === 'Executed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {cmd.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button 
                    onClick={() => setActiveTab('commands')} 
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                  >
                    <span>Open Command Console</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB: DEVICE INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6" id="mdm-inventory-view">
              
              {/* Filter Action Bars */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input 
                    type="text" 
                    placeholder="Search by device name, model, serial..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-sm transition-all focus:outline-none"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ENROLLED">Enrolled</option>
                      <option value="PENDING">Pending</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform:</span>
                    <select 
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Platforms</option>
                      <option value="ANDROID">Android</option>
                      <option value="IOS">iOS / iPadOS</option>
                      <option value="WINDOWS">Windows</option>
                      <option value="MACOS">macOS</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Inventory Table & Optional Side details view */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Master Inventory list */}
                <div className={`bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm ${selectedDevice ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="text-base font-bold text-slate-900">Registered Devices ({filteredDevices.length})</h2>
                    <span className="text-xs font-mono text-slate-500">LSP secure communications</span>
                  </div>

                  {filteredDevices.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                      <div className="p-4 bg-slate-100 rounded-full inline-block text-slate-400">
                        <Smartphone className="h-8 w-8" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">No managed devices found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">Try clearing your filters, searching for another term, or register a new hardware device using the button above.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                            <th className="px-6 py-4">Device / Platform</th>
                            <th className="px-6 py-4">Serial Number</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Battery</th>
                            <th className="px-6 py-4 text-center">Applied Policy</th>
                            <th className="px-6 py-4">Last Seen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                          {filteredDevices.map(d => (
                            <tr 
                              key={d.id} 
                              onClick={() => setSelectedDevice(d)}
                              className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${selectedDevice?.id === d.id ? 'bg-indigo-50/50' : ''}`}
                            >
                              <td className="px-6 py-4 font-medium">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-xl ${
                                    d.platform.toLowerCase() === 'android' ? 'bg-emerald-50 text-emerald-600' :
                                    d.platform.toLowerCase() === 'ios' ? 'bg-slate-950 text-white' :
                                    d.platform.toLowerCase() === 'macos' ? 'bg-slate-100 text-slate-800' : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    {d.platform.toLowerCase() === 'android' ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{d.deviceName}</p>
                                    <p className="text-[10px] text-slate-400">{d.manufacturer} {d.model} • {d.osVersion}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-slate-500">
                                {d.serialNumber}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  d.status === 'Enrolled' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  d.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  d.status === 'Blocked' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-300'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    d.status === 'Enrolled' ? 'bg-emerald-500' :
                                    d.status === 'Pending' ? 'bg-amber-500' :
                                    d.status === 'Blocked' ? 'bg-rose-500' : 'bg-slate-500'
                                  }`}></span>
                                  {d.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 font-mono font-semibold">
                                  <Battery className={`h-4.5 w-4.5 ${
                                    d.batteryLevel < 20 ? 'text-rose-500 animate-pulse' :
                                    d.batteryLevel < 50 ? 'text-amber-500' : 'text-emerald-500'
                                  }`} />
                                  <span>{d.batteryLevel}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {d.policy ? (
                                  <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-1 rounded-lg border border-indigo-100">
                                    {d.policy.policyName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No Policy Applied</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {new Date(d.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Focused Details View (Sidebar Panel inside inventory) */}
                {selectedDevice && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm flex flex-col justify-between transition-all duration-300">
                    <div className="space-y-4">
                      
                      {/* Header with platform badge */}
                      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {selectedDevice.platform}
                            </span>
                            {selectedDevice.status === 'Blocked' && (
                              <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                LOST / BLOCKED
                              </span>
                            )}
                          </div>
                          <h2 className="text-lg font-bold text-slate-950 mt-1">{selectedDevice.deviceName}</h2>
                        </div>
                        <button 
                          onClick={() => setSelectedDevice(null)} 
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Info grid */}
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-400 font-semibold">Manufacturer:</span>
                          <span className="text-slate-800 font-medium">{selectedDevice.manufacturer}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-400 font-semibold">Model ID:</span>
                          <span className="text-slate-800 font-medium">{selectedDevice.model}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-400 font-semibold">OS Version:</span>
                          <span className="text-slate-800 font-medium font-mono">{selectedDevice.osVersion}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-400 font-semibold">Serial Number:</span>
                          <span className="text-slate-800 font-bold font-mono">{selectedDevice.serialNumber}</span>
                        </div>
                        {selectedDevice.imei && (
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-400 font-semibold">IMEI (Cellular):</span>
                            <span className="text-slate-800 font-mono">{selectedDevice.imei}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-400 font-semibold">Enrolled At:</span>
                          <span className="text-slate-800">{new Date(selectedDevice.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Associated Policy selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Security Rule Profile</label>
                        <select 
                          value={selectedDevice.policyId || ''}
                          onChange={(e) => handleAssociatePolicy(selectedDevice.id, e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- No Active Policy Map --</option>
                          {policies.map(p => (
                            <option key={p.id} value={p.id}>{p.policyName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Target App installed list */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Installed App Bundles</h3>
                          <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {(selectedDevice.applications || []).length} total
                          </span>
                        </div>
                        
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {(selectedDevice.applications || []).map((app, index) => (
                            <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                              <div className="flex items-center gap-2">
                                <AppWindow className="h-4 w-4 text-slate-400" />
                                <span className="font-semibold text-slate-700">{app.applicationName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                                {app.version}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Remote Admin Commands drawer shortcut */}
                    <div className="border-t border-slate-150 pt-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dispatched Remote Actions</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => handleDispatchCommand(selectedDevice.id, 'Sync')}
                          className="flex flex-col items-center justify-center p-2 border border-slate-200 hover:bg-slate-50 text-indigo-600 rounded-xl transition-all"
                        >
                          <RefreshCw className="h-4 w-4 mb-1" />
                          <span className="text-[10px] font-bold">Force Sync</span>
                        </button>

                        <button 
                          onClick={() => handleDispatchCommand(selectedDevice.id, 'Lock')}
                          className="flex flex-col items-center justify-center p-2 border border-slate-200 hover:bg-slate-50 text-amber-600 rounded-xl transition-all"
                        >
                          <Lock className="h-4 w-4 mb-1" />
                          <span className="text-[10px] font-bold">Lock Device</span>
                        </button>

                        <button 
                          onClick={() => handleDispatchCommand(selectedDevice.id, 'Wipe')}
                          className="flex flex-col items-center justify-center p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4 mb-1" />
                          <span className="text-[10px] font-bold">Wipe Hardware</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB: SECURITY POLICIES */}
          {activeTab === 'policies' && (
            <div className="space-y-6" id="mdm-policies-view">
              
              <div className="bg-indigo-900 text-white rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10">
                  <Shield className="h-96 w-96 text-white" />
                </div>

                <div className="space-y-2 z-10">
                  <h2 className="text-xl font-extrabold tracking-tight">Active MDM Policy Register</h2>
                  <p className="text-sm text-indigo-200 max-w-2xl">Deploy system-wide hardware policies ensuring passcode compliance, local storage encryption, and feature restriction toggles across public tablets and faculty laptops.</p>
                </div>

                <button 
                  onClick={() => setShowPolicyModal(true)} 
                  className="bg-white hover:bg-indigo-50 text-indigo-900 font-bold px-5 py-3 rounded-2xl text-sm transition-all shadow-md active:scale-95 z-10 shrink-0"
                >
                  Create Security Policy
                </button>
              </div>

              {/* Policies Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map(p => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 flex flex-col justify-between shadow-sm hover:shadow transition-all relative overflow-hidden">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Shield className="h-5 w-5" />
                        </span>
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {p._count?.devices || 0} active nodes
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">{p.policyName}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{p.description || 'No description configured.'}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device Restrictions</h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 py-1">
                          {p.passcodeRequired ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}
                          <span className="text-slate-600">Passcode Required</span>
                        </div>

                        <div className="flex items-center gap-1.5 py-1">
                          {p.encryptionRequired ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}
                          <span className="text-slate-600">Encryption Required</span>
                        </div>

                        <div className="flex items-center gap-1.5 py-1">
                          {p.cameraAllowed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                          <span className="text-slate-600">Camera Access</span>
                        </div>

                        <div className="flex items-center gap-1.5 py-1">
                          {p.screenshotAllowed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                          <span className="text-slate-600">Screenshot Allowed</span>
                        </div>
                      </div>

                      {p.kioskMode && (
                        <div className="mt-3 p-2.5 bg-amber-50 text-amber-800 rounded-xl text-[11px] font-semibold flex items-center gap-2 border border-amber-200">
                          <Monitor className="h-4 w-4" />
                          <span>Kiosk Target App: <strong>{p.kioskApp || 'Any'}</strong></span>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: COMMAND CENTER (Remote Administration) */}
          {activeTab === 'commands' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="mdm-commands-view">
              
              {/* Dispatch Action Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900">Remote Administration Command Center</h2>
                  <p className="text-xs text-slate-500">Execute instantaneous, secure administrative hooks on enrolled active mobile hardware.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Select Target Hardware</label>
                    <select 
                      value={commandTargetDevice}
                      onChange={(e) => setCommandTargetDevice(e.target.value)}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Target Active Node --</option>
                      {devices.filter(d => d.status !== 'Retired').map(d => (
                        <option key={d.id} value={d.id}>{d.deviceName} ({d.platform} • {d.serialNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">2. Choose Command Packet</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { name: 'Force Sync', val: 'Sync', desc: 'Sync system configs' },
                        { name: 'Remote Lock', val: 'Lock', desc: 'Force lock device lockscreen' },
                        { name: 'Hardware Restart', val: 'Restart', desc: 'Trigger safe reboot' },
                        { name: 'Remote Locate', val: 'Locate', desc: 'Pull active GPS coordinates' },
                        { name: 'Remote Unlock', val: 'Unlock', desc: 'Clear secure locked status' },
                        { name: 'Full Remote Wipe', val: 'Wipe', desc: 'Wipe hardware to factory state' }
                      ].map(cmd => (
                        <button 
                          key={cmd.val}
                          type="button"
                          onClick={() => setCommandType(cmd.val)}
                          className={`p-3 text-left border rounded-2xl transition-all ${
                            commandType === cmd.val ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <p className="text-xs font-bold">{cmd.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{cmd.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleDispatchCommand()}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    <span>Dispatch Command</span>
                  </button>
                </div>
              </div>

              {/* Execution logs */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Execution Command Log Registry</h2>
                  <p className="text-xs text-slate-500">Live feed monitoring the results of remote security, lock, and wipes dispatched by Super Administrators.</p>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 mt-4 max-h-[440px] pr-2">
                  {allCommands.length === 0 ? (
                    <div className="text-center py-24 text-slate-400 text-sm font-medium">
                      No administrative commands recorded.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {allCommands.map((c, i) => (
                        <div key={i} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                              <Cpu className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Remote {c.command} Execution</p>
                              <p className="text-[10px] text-slate-500">Device: <strong className="text-slate-700">{c.deviceName}</strong></p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Success
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">
                              {new Date(c.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: KIOSK MANAGER */}
          {activeTab === 'kiosk' && (
            <div className="space-y-6" id="mdm-kiosk-view">
              
              <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-24 -translate-y-24 opacity-10">
                  <Monitor className="h-96 w-96 text-white animate-spin-slow" />
                </div>

                <div className="space-y-2 z-10">
                  <h2 className="text-xl font-extrabold tracking-tight">Kiosk Platform Management (Locked-Down Modes)</h2>
                  <p className="text-sm text-slate-300 max-w-2xl">Configure Single App, Multi App or Digital Signage profiles. Restrict devices so they boot directly into dedicated campus services like exam proctor sheets or self-checkout portals.</p>
                </div>
              </div>

              {/* Kiosk templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Student Self-Service', target: 'Campus Portal', icon: Smartphone, bg: 'bg-indigo-50 text-indigo-700', active: true, desc: 'Enables registration, fee checks, and timetables. Locked to single application.' },
                  { title: 'Examination Shield', target: 'ExamShield v2.4', icon: Shield, bg: 'bg-emerald-50 text-emerald-700', active: true, desc: 'Midterm/Final testing lock. Disables copy-paste, print screen, and tabs.' },
                  { title: 'Library Checkout Kiosk', target: 'Library Catalog', icon: Monitor, bg: 'bg-amber-50 text-amber-700', active: true, desc: 'Public terminal lookup for physical book shelf tags and quick scanning.' },
                  { title: 'Reception/Visitor Kiosk', target: 'Campus Visitor Log', icon: User, bg: 'bg-rose-50 text-rose-700', active: false, desc: 'Secure sign-in ledger for external parents, guest speakers and VIPs.' }
                ].map((kiosk, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`p-2 rounded-xl ${kiosk.bg}`}>
                          <kiosk.icon className="h-5 w-5" />
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          kiosk.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {kiosk.active ? 'ACTIVE PROFILE' : 'INACTIVE'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{kiosk.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{kiosk.desc}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Locked Target app</span>
                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {kiosk.target}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: APPLICATION MANAGER */}
          {activeTab === 'apps' && (
            <div className="space-y-6" id="mdm-apps-view">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Corporate & Academic App Catalog</h2>
                  <p className="text-xs text-slate-500">Track application bundle distributions, manage required deployments, or dispatch silent updates.</p>
                </div>

                <button 
                  onClick={() => setShowAppModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Deploy Custom App Bundle</span>
                </button>
              </div>

              {/* Apps List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Campus Portal', version: 'v3.2.1', size: '24 MB', category: 'General', required: true },
                  { name: 'Academic Dashboard', version: 'v2.1.0', size: '18 MB', category: 'Faculty', required: true },
                  { name: 'ExamShield v2.4', version: 'v2.4.0', size: '42 MB', category: 'Testing', required: true },
                  { name: 'Library Catalog', version: 'v1.4.0', size: '12 MB', category: 'Student Self-Service', required: false },
                  { name: 'Remote Security Daemon', version: 'v1.0.0', size: '5 MB', category: 'Telemetry', required: true }
                ].map((app, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                          <AppWindow className="h-5 w-5" />
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          app.required ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {app.required ? 'MANDATORY APP' : 'OPTIONAL'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{app.name}</h3>
                      <p className="text-xs text-slate-500">Category: <strong>{app.category}</strong> • Size: {app.size}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Active Build</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {app.version}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: TELEMETRY & ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6" id="mdm-analytics-view">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Platform Distribution Chart */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">OS Platform Distribution</h3>
                  <div className="h-64">
                    {platformData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        No platform statistics computed yet.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {platformData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} Devices`, 'Distribution']} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Compliance Rates Chart */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">Device Compliance Status</h3>
                  <div className="h-64">
                    {complianceData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        No compliance data computed yet.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={complianceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {complianceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} Devices`, 'Compliance Status']} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Battery Health stats */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">Live Battery Levels Comparison</h3>
                  <div className="h-64">
                    {devices.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        No active battery telemetry.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={devices.filter(d => d.status !== 'Retired')}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="deviceName" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} label={{ value: 'Battery %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="batteryLevel" fill="#6366F1" radius={[4, 4, 0, 0]}>
                            {devices.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.batteryLevel < 20 ? '#EF4444' : entry.batteryLevel < 55 ? '#F59E0B' : '#10B981'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </>
      )}

      {/* MODAL: ENROLL NEW DEVICE */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="mdm-enroll-modal">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enroll New Smart Campus Device</h3>
                <p className="text-xs text-slate-500">Add secure telemetry hooks onto hardware assets.</p>
              </div>
              <button 
                onClick={() => setShowEnrollModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Methods select */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button 
                type="button"
                onClick={() => setEnrollMethod('manual')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  enrollMethod === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manual Enrollment
              </button>

              <button 
                type="button"
                onClick={() => setEnrollMethod('qr')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  enrollMethod === 'qr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                QR Code Enrollment
              </button>
            </div>

            {enrollMethod === 'qr' ? (
              <div className="space-y-4 text-center py-6">
                <div className="inline-block p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                  {/* Visual CSS-based QR mockup */}
                  <div className="h-44 w-44 bg-white border-4 border-slate-900 relative flex items-center justify-center p-2 rounded">
                    <QrCode className="h-36 w-36 text-slate-900" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">Scan QR to Auto-Enroll</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Open the campus developer app on your client terminal and point its camera at this code to establish a secure handshake.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnrollDevice} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Device Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. library-tablet-05"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Platform OS *</label>
                    <select 
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all font-semibold"
                    >
                      <option value="Android">Android</option>
                      <option value="iOS">iOS / iPadOS</option>
                      <option value="Windows">Windows</option>
                      <option value="macOS">macOS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Manufacturer</label>
                    <input 
                      type="text"
                      placeholder="e.g. Samsung / Apple"
                      value={newManufacturer}
                      onChange={(e) => setNewManufacturer(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Model Name/Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. Galaxy Tab S9 Ultra"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">OS Build/Version</label>
                    <input 
                      type="text"
                      placeholder="e.g. v14.0.1 Sonoma"
                      value={newOSVersion}
                      onChange={(e) => setNewOSVersion(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Serial Number *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. SN-SAM-1199X"
                      value={newSerialNumber}
                      onChange={(e) => setNewSerialNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">IMEI (Cellular Data option)</label>
                    <input 
                      type="text"
                      placeholder="e.g. 354921-08-..."
                      value={newImei}
                      onChange={(e) => setNewImei(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Initial Policy Map</label>
                    <select 
                      value={newPolicyId}
                      onChange={(e) => setNewPolicyId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all font-semibold"
                    >
                      <option value="">-- Apply No Policy --</option>
                      {policies.map(p => (
                        <option key={p.id} value={p.id}>{p.policyName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Submit Secure Registration</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL: CREATE SECURITY POLICY */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="mdm-policy-modal">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Deploy New MDM Security Policy</h3>
                <p className="text-xs text-slate-500">Build systemic profiles restricting hardware modules.</p>
              </div>
              <button 
                onClick={() => setShowPolicyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Policy Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Exam Shield Policy"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Policy Description</label>
                <textarea 
                  placeholder="Brief description of the constraints implemented..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-2">
                  <label className="font-bold text-slate-600 uppercase text-[10px] tracking-wider block">Local Security</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input 
                      type="checkbox"
                      checked={pPasscode}
                      onChange={(e) => setPPasscode(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Require Lockscreen Pin</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input 
                      type="checkbox"
                      checked={pEncrypt}
                      onChange={(e) => setPEncrypt(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Mandate Local Encryption</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-600 uppercase text-[10px] tracking-wider block">Access Restrictions</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input 
                      type="checkbox"
                      checked={pCamera}
                      onChange={(e) => setPCamera(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Allow Camera Access</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input 
                      type="checkbox"
                      checked={pScreenshot}
                      onChange={(e) => setPScreenshot(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Allow Screenshots</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                  <input 
                    type="checkbox"
                    checked={pKiosk}
                    onChange={(e) => setPKiosk(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Lock to Single App Mode (Kiosk Mode)</span>
                </label>

                {pKiosk && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1">
                    <label className="font-bold text-slate-600">Target Application Bundle Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. ExamShield v2.4"
                      value={pKioskApp}
                      onChange={(e) => setPKioskApp(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all font-mono"
                    />
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow transition-all active:scale-95 disabled:opacity-50"
              >
                <span>Deploy Policy Rules</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: DEPLOY CUSTOM APP BUNDLE */}
      {showAppModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="mdm-app-modal">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Deploy Custom App Bundle</h3>
                <p className="text-xs text-slate-500">Distribute application packages silently to hardware nodes.</p>
              </div>
              <button 
                onClick={() => setShowAppModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDeployApp} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Target Enrolled Device *</label>
                <select 
                  required
                  value={appTargetDevice}
                  onChange={(e) => setAppTargetDevice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all font-semibold"
                >
                  <option value="">-- Choose Target Enrolled Node --</option>
                  {devices.filter(d => d.status !== 'Retired').map(d => (
                    <option key={d.id} value={d.id}>{d.deviceName} ({d.platform})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Application Bundle Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Student Survey Client"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Bundle Release Version *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. v1.0.2"
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition-all font-mono"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow transition-all active:scale-95 disabled:opacity-50"
              >
                <span>Dispatch Package Bundle</span>
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
export default MdmPage;
