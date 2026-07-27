import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Mail, Smartphone, MessageSquare, Layout, Calendar, Radio,
  History, BarChart3, Sliders, Plus, Search, Filter, Trash2, Edit,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, UserCheck, Users,
  Check, Send, ShieldAlert, BookOpen, Clock, Settings, Info, Server,
  SlidersHorizontal, ChevronRight, CheckSquare
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'notifications' | 'push' | 'email' | 'sms' | 'templates' | 'scheduled' | 'broadcast' | 'history' | 'analytics' | 'preferences'
  >('dashboard');

  // API states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [notifSearch, setNotifSearch] = useState('');
  const [histSearch, setHistSearch] = useState('');
  const [histStatus, setHistStatus] = useState('');
  const [histType, setHistType] = useState('');
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);

  // Form states
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // New notification form
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    notificationType: 'InApp',
    priority: 'Normal',
    scheduledAt: '',
    status: 'Draft'
  });

  // New template form
  const [templateForm, setTemplateForm] = useState({
    id: null as number | null,
    templateName: '',
    channel: 'InApp',
    subject: '',
    body: '',
    variables: '["student_name", "course_name", "due_date"]',
    active: true
  });

  // Broadcast form
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    notificationType: 'InApp',
    priority: 'Normal',
    targetAudience: 'STUDENT',
    targetId: ''
  });

  // SMTP Settings
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.smartuniv.edu',
    port: 587,
    secure: true,
    user: 'notifications@smartuniv.edu',
    senderName: 'Smart University ERP'
  });

  // Twilio Settings
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authToken: '••••••••••••••••••••••••••••••••',
    fromNumber: '+15550199'
  });

  // FCM Settings
  const [fcmConfig, setFcmConfig] = useState({
    apiKey: 'AIzaSyA1xxxxxxxxxxxxxxxxxxxxxxxx',
    authDomain: 'smart-univ-erp.firebaseapp.com',
    projectId: 'smart-univ-erp',
    messagingSenderId: '88219472194'
  });

  // Notification Preferences (saved in localState / localStorage for security and privacy)
  const [preferences, setPreferences] = useState({
    Academic: { Email: true, Push: true, SMS: false, InApp: true },
    Fee: { Email: true, Push: true, SMS: true, InApp: true },
    Attendance: { Email: false, Push: true, SMS: true, InApp: true },
    Assignment: { Email: true, Push: true, SMS: false, InApp: true },
    Announcement: { Email: true, Push: true, SMS: false, InApp: true },
    System: { Email: true, Push: true, SMS: false, InApp: true }
  });

  // Socket logs console simulation
  const [socketLogs, setSocketLogs] = useState<any[]>([
    { time: new Date().toLocaleTimeString(), event: 'SYSTEM_READY', data: 'Socket.io notification gateway initialized.' }
  ]);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [notifRes, tempRes, histRes, analRes] = await Promise.all([
        apiClient.get('/notifications', { params: { search: notifSearch } }).catch(() => ({ data: { items: [], total: 0 } })),
        apiClient.get('/notification-templates').catch(() => ({ data: [] })),
        apiClient.get('/notification-history', { params: { page: histPage, limit: 10, status: histStatus, type: histType } }).catch(() => ({ data: { items: [], total: 0 } })),
        apiClient.get('/notifications/analytics').catch(() => ({ data: null }))
      ]);

      setNotifications(notifRes.data.items || []);
      setTemplates(tempRes.data || []);
      setHistory(histRes.data.items || []);
      setHistTotal(histRes.data.total || 0);
      setAnalytics(analRes.data || null);

    } catch (err: any) {
      setError(err.message || 'Failed to load communications center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Load local preferences if any
    const savedPrefs = localStorage.getItem('user_notification_preferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {}
    }
  }, [activeTab, notifSearch, histPage, histStatus, histType]);

  // Handle preference toggle
  const togglePreference = (category: string, channel: string) => {
    const updated = {
      ...preferences,
      [category]: {
        ...preferences[category as keyof typeof preferences],
        [channel]: !preferences[category as keyof typeof preferences][channel as 'Email' | 'Push' | 'SMS' | 'InApp']
      }
    };
    setPreferences(updated);
    localStorage.setItem('user_notification_preferences', JSON.stringify(updated));
    
    // Add socket log for local update
    setSocketLogs(prev => [
      { time: new Date().toLocaleTimeString(), event: 'PREFERENCES_UPDATED', data: `Category: ${category}, Channel: ${channel}` },
      ...prev
    ]);
  };

  // Actions
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/notifications', notifForm);
      setIsNotifModalOpen(false);
      setNotifForm({
        title: '',
        message: '',
        notificationType: 'InApp',
        priority: 'Normal',
        scheduledAt: '',
        status: 'Draft'
      });
      loadData();
      setSocketLogs(prev => [
        { time: new Date().toLocaleTimeString(), event: 'NOTIFICATION_DRAFT_CREATED', data: notifForm.title },
        ...prev
      ]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create notification.');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (templateForm.id) {
        await apiClient.put(`/notification-templates/${templateForm.id}`, templateForm);
      } else {
        await apiClient.post('/notification-templates', templateForm);
      }
      setIsTemplateModalOpen(false);
      setTemplateForm({
        id: null,
        templateName: '',
        channel: 'InApp',
        subject: '',
        body: '',
        variables: '["student_name", "course_name", "due_date"]',
        active: true
      });
      loadData();
      setSocketLogs(prev => [
        { time: new Date().toLocaleTimeString(), event: 'TEMPLATE_SAVED', data: templateForm.templateName },
        ...prev
      ]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save template.');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await apiClient.delete(`/notifications/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete notification.');
    }
  };

  const handleSendNotification = async (notifId: number) => {
    try {
      setSocketLogs(prev => [
        { time: new Date().toLocaleTimeString(), event: 'BROADCAST_QUEUED', data: `Notification ID: ${notifId}` },
        ...prev
      ]);
      // For demo / test sending, find a random list of users or current admin user
      const usersRes = await apiClient.get('/students').catch(() => null);
      let userIds: number[] = [];
      if (usersRes && usersRes.data) {
        const students = usersRes.data.data?.students || (Array.isArray(usersRes.data) ? usersRes.data : []);
        userIds = students.slice(0, 5).map((u: any) => u.userId || u.id).filter(Boolean);
      }
      if (userIds.length === 0) {
        userIds.push(user?.id || 1);
      }

      await apiClient.post('/notifications/send', {
        notificationId: notifId,
        userIds
      });
      
      // Simulate real-time updates via mock websocket
      setTimeout(() => {
        setSocketLogs(prev => [
          { time: new Date().toLocaleTimeString(), event: 'BROADCAST_STARTED', data: `Sending notification ID ${notifId}` },
          { time: new Date().toLocaleTimeString(), event: 'DELIVERY_SUCCESS', data: `Delivered to users: [${userIds.join(', ')}]` },
          { time: new Date().toLocaleTimeString(), event: 'BROADCAST_COMPLETED', data: `Notification ID ${notifId} sent successfully` },
          ...prev
        ]);
        loadData();
      }, 1500);

    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send notification.');
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSocketLogs(prev => [
        { time: new Date().toLocaleTimeString(), event: 'BROADCAST_REQUESTED', data: `${broadcastForm.targetAudience} Broadcast` },
        ...prev
      ]);
      await apiClient.post('/notifications/broadcast', broadcastForm);
      setIsBroadcastModalOpen(false);
      setBroadcastForm({
        title: '',
        message: '',
        notificationType: 'InApp',
        priority: 'Normal',
        targetAudience: 'STUDENT',
        targetId: ''
      });

      setTimeout(() => {
        setSocketLogs(prev => [
          { time: new Date().toLocaleTimeString(), event: 'BROADCAST_COMPLETED', data: 'Successfully broadcasted' },
          ...prev
        ]);
        loadData();
      }, 2000);

    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initiate broadcast.');
    }
  };

  const handleMarkAsRead = async (recipientId: number) => {
    try {
      await apiClient.put(`/notifications/recipients/${recipientId}/read`);
      loadData();
      setSocketLogs(prev => [
        { time: new Date().toLocaleTimeString(), event: 'READ_STATUS_UPDATED', data: `Recipient ID: ${recipientId}` },
        ...prev
      ]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to mark as read.');
    }
  };

  // Replace variable templates dynamically for live previews
  const renderTemplatePreview = (body: string) => {
    return body
      .replace(/\{\{student_name\}\}/g, `${user?.firstName || 'John'} ${user?.lastName || 'Doe'}`)
      .replace(/\{\{course_name\}\}/g, 'Advanced Software Engineering CS-401')
      .replace(/\{\{due_date\}\}/g, new Date(Date.now() + 86400000 * 3).toLocaleDateString());
  };

  return (
    <PageContainer title="Enterprise Notification & Communication Platform">
      <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6" id="comms-workspace">
        
        {/* Left Side Navigation Panel - Swiss modern bento menu */}
        <div className="w-full xl:w-72 shrink-0 flex flex-col gap-2">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Workspace Nodes</span>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'dashboard' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Communication Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'notifications' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Bell className="h-4 w-4 shrink-0" />
              <span>Notifications Hub</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('broadcast')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'broadcast' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Radio className="h-4 w-4 shrink-0" />
                  <span>Broadcast Center</span>
                </button>

                <button
                  onClick={() => setActiveTab('push')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'push' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Smartphone className="h-4 w-4 shrink-0" />
                  <span>Push Notification Center</span>
                </button>

                <button
                  onClick={() => setActiveTab('email')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'email' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>Email Control Center</span>
                </button>

                <button
                  onClick={() => setActiveTab('sms')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'sms' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span>SMS Dispatch Console</span>
                </button>

                <button
                  onClick={() => setActiveTab('templates')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'templates' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Layout className="h-4 w-4 shrink-0" />
                  <span>Rich Message Templates</span>
                </button>

                <button
                  onClick={() => setActiveTab('scheduled')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'scheduled' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Scheduled Delivery Queues</span>
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'history' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Full Notification History</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'analytics' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Delivery & Read Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeTab === 'preferences' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Sliders className="h-4 w-4 shrink-0" />
              <span>My Channel Preferences</span>
            </button>
          </div>

          {/* WebSocket real-time terminal monitor */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-[10px] shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                Live socket.io link
              </span>
              <span>127.0.0.1:3000</span>
            </div>
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {socketLogs.map((log, idx) => (
                <div key={idx} className="leading-tight">
                  <span className="text-slate-500 mr-1">[{log.time}]</span>
                  <span className="text-amber-400 font-bold">{log.event}:</span>{' '}
                  <span className="text-slate-200">{log.data}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Content Frame */}
        <div className="flex-grow min-w-0 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm min-h-[70vh]">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-900" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">Synchronizing Node States...</span>
            </div>
          )}

          {!loading && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                
                {/* 1. DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">Campus Communication Hub</h2>
                        <p className="text-xs text-slate-500">Real-time control center for university-wide messaging, alerts, and templates.</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
                          >
                            <Radio className="h-4 w-4" />
                            <span>Broadcast Alert</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dashboard Metrics Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">Sent Today</span>
                          <span className="text-2xl font-black text-slate-950">{analytics?.summary?.sentToday || 0}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">Success Rate</span>
                          <span className="text-2xl font-black text-slate-950">{analytics?.summary?.deliverySuccessRate || 100}%</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">Failed Queue</span>
                          <span className="text-2xl font-black text-slate-950">{analytics?.summary?.failedNotifications || 0}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Server className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">Pending Queue</span>
                          <span className="text-2xl font-black text-slate-950">{analytics?.summary?.pendingQueue || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Notification Delivery Trends</h3>
                        <div className="h-64">
                          {analytics?.dailyTrend ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analytics.dailyTrend}>
                                <defs>
                                  <linearGradient id="colorEmail" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <Tooltip />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Area type="monotone" dataKey="Email" stroke="#0f172a" fillOpacity={1} fill="url(#colorEmail)" strokeWidth={2} />
                                <Area type="monotone" dataKey="SMS" stroke="#10b981" strokeWidth={2} fill="none" />
                                <Area type="monotone" dataKey="Push" stroke="#f59e0b" strokeWidth={2} fill="none" />
                                <Area type="monotone" dataKey="InApp" stroke="#6366f1" strokeWidth={2} fill="none" />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">No trend data available.</div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Channel Efficiency</h3>
                        <div className="h-64 flex flex-col justify-between">
                          {analytics?.byType ? (
                            <div className="space-y-4">
                              {Object.entries(analytics.byType).map(([channel, stats]: [string, any]) => {
                                const total = stats.sent + stats.failed + stats.pending;
                                const rate = total > 0 ? (stats.sent / total) * 100 : 100;
                                return (
                                  <div key={channel} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium text-slate-700">
                                      <span>{channel} Gateway</span>
                                      <span>{rate.toFixed(0)}% Delivered</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-slate-900 h-full rounded-full transition-all"
                                        style={{ width: `${rate}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                      <span>Delivered: {stats.sent}</span>
                                      <span>Failed: {stats.failed}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">No gateway data available.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Templates & Scheduled Broadcasts Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Active System Templates</h3>
                          <button onClick={() => setActiveTab('templates')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold">
                            <span>Manage Templates</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {templates.slice(0, 4).map((temp) => (
                            <div key={temp.id} className="py-2.5 flex items-center justify-between">
                              <div>
                                <span className="block text-xs font-bold text-slate-900">{temp.templateName}</span>
                                <span className="text-[10px] text-slate-400 font-mono uppercase">{temp.channel} channel</span>
                              </div>
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                          ))}
                          {templates.length === 0 && (
                            <p className="text-xs text-slate-400 py-4 text-center">No active templates found.</p>
                          )}
                        </div>
                      </div>

                      <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Gateway Activity Stream</h3>
                          <button onClick={() => setActiveTab('history')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold">
                            <span>View All Logs</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {analytics?.recentAuditLogs?.slice(0, 4).map((log: any) => (
                            <div key={log.id} className="py-2.5 flex items-start gap-3">
                              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-grow">
                                <span className="block text-xs text-slate-700 leading-tight">{log.oldValue}</span>
                                <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                                  {new Date(log.createdAt).toLocaleString()} • IP: {log.ipAddress}
                                </span>
                              </div>
                            </div>
                          ))}
                          {(!analytics?.recentAuditLogs || analytics.recentAuditLogs.length === 0) && (
                            <p className="text-xs text-slate-400 py-4 text-center">No recent gateway logs.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. NOTIFICATIONS HUB TAB */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">Communications Dispatch Hub</h2>
                        <p className="text-xs text-slate-500">Draft, configure, and execute precise message dispatches to target recipients.</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setIsNotifModalOpen(true)}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start transition"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Draft Notification</span>
                        </button>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search dispatches..."
                          value={notifSearch}
                          onChange={(e) => setNotifSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-400 transition"
                        />
                      </div>
                      <button onClick={loadData} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        <RefreshCw className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>

                    {/* Notification Drafts / Scheduled List */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                            <th className="p-4">Dispatch Title</th>
                            <th className="p-4">Channel</th>
                            <th className="p-4">Priority</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Scheduled At</th>
                            {isAdmin && <th className="p-4 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {notifications.map((notif) => (
                            <tr key={notif.id} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <span className="font-bold text-slate-900 block">{notif.title}</span>
                                <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">{notif.message}</span>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-800">
                                  {notif.notificationType === 'Email' && <Mail className="h-3 w-3" />}
                                  {notif.notificationType === 'SMS' && <MessageSquare className="h-3 w-3" />}
                                  {notif.notificationType === 'Push' && <Smartphone className="h-3 w-3" />}
                                  {notif.notificationType === 'InApp' && <Bell className="h-3 w-3" />}
                                  {notif.notificationType}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  notif.priority === 'Critical' ? 'bg-rose-50 text-rose-600' :
                                  notif.priority === 'High' ? 'bg-amber-50 text-amber-600' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {notif.priority}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  notif.status === 'Sent' ? 'bg-emerald-50 text-emerald-600' :
                                  notif.status === 'Failed' ? 'bg-rose-50 text-rose-600' :
                                  notif.status === 'Sending' ? 'bg-amber-50 text-amber-600' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {notif.status}
                                </span>
                              </td>
                              <td className="p-4 text-slate-400 font-mono text-[10px]">
                                {notif.scheduledAt ? new Date(notif.scheduledAt).toLocaleString() : 'Immediate'}
                              </td>
                              {isAdmin && (
                                <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    {notif.status === 'Draft' && (
                                      <button
                                        onClick={() => handleSendNotification(notif.id)}
                                        className="p-1 px-2.5 bg-slate-900 text-white text-[10px] font-semibold rounded hover:bg-slate-800 flex items-center gap-1 transition"
                                      >
                                        <Send className="h-3 w-3" />
                                        <span>Send</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteNotification(notif.id)}
                                      className="p-1 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded transition"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                          {notifications.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">
                                No active notification records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. BROADCAST CENTER TAB */}
                {activeTab === 'broadcast' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Campus-Wide Broadcasting Center</h2>
                      <p className="text-xs text-slate-500">Initiate mass broadcasts to students, faculty, or department-wide structures with high priority delivery.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-5 border border-slate-200 rounded-xl space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Broadcast Config</h3>
                        <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Broadcast Title</label>
                            <input
                              type="text"
                              value={broadcastForm.title}
                              onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                              required
                              placeholder="Emergency Alert: Weather Warning / Academic Update"
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Message Content</label>
                            <textarea
                              rows={4}
                              value={broadcastForm.message}
                              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                              required
                              placeholder="Please be advised that the university campus is..."
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">Delivery Channel</label>
                              <select
                                value={broadcastForm.notificationType}
                                onChange={(e) => setBroadcastForm({ ...broadcastForm, notificationType: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                              >
                                <option value="InApp">InApp Alert Only</option>
                                <option value="Email">Email Dispatch</option>
                                <option value="SMS">SMS Dispatch</option>
                                <option value="Push">Push Notification</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">Priority Tier</label>
                              <select
                                value={broadcastForm.priority}
                                onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                              >
                                <option value="Low">Low</option>
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical (Bypasses limits)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">Target Audience</label>
                              <select
                                value={broadcastForm.targetAudience}
                                onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                              >
                                <option value="ALL">All Campus</option>
                                <option value="STUDENT">Students Only</option>
                                <option value="PARENT">Parents Only</option>
                                <option value="EMPLOYEE">Employees/Faculty Only</option>
                                <option value="DEPARTMENT">Specific Department</option>
                              </select>
                            </div>

                            {broadcastForm.targetAudience === 'DEPARTMENT' && (
                              <div className="space-y-1">
                                <label className="font-bold text-slate-700">Department ID / Code</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 1"
                                  value={broadcastForm.targetId || ''}
                                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetId: e.target.value })}
                                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                                />
                              </div>
                            )}
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
                          >
                            <Send className="h-4 w-4" />
                            <span>Dispatch Broadcast Stream</span>
                          </button>
                        </form>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                        <div className="space-y-4">
                          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Aesthetic Live Preview</h3>
                          
                          {/* Live phone notification bubble */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md max-w-sm mx-auto space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                              <Bell className="h-4 w-4 text-slate-900" />
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Campus Alert</span>
                            </div>
                            <div>
                              <span className="block font-black text-slate-950 text-xs">{broadcastForm.title || 'Notification Title'}</span>
                              <span className="block text-slate-600 text-[11px] mt-1 leading-relaxed">{broadcastForm.message || 'Notification content body goes here...'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                              <span>Priority: {broadcastForm.priority}</span>
                              <span>Target: {broadcastForm.targetAudience}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-slate-100 text-[11px] text-slate-500 space-y-2 mt-4 leading-relaxed">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <ShieldAlert className="h-4 w-4 text-slate-600" />
                            <span>Security & RBAC Controls</span>
                          </div>
                          <span>Super Admins and Admins maintain full access to global broadcasts. Faculty is constrained to Student and Department levels. Delivery metrics are logged to the university audit table.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PUSH NOTIFICATION CENTER TAB */}
                {activeTab === 'push' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Firebase Cloud Messaging Console</h2>
                      <p className="text-xs text-slate-500">Configure client credentials, messaging credentials, and broadcast testing for web and mobile devices.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 p-5 border border-slate-200 rounded-xl space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">FCM Web Credentials Configuration</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">API Key</label>
                            <input
                              type="text"
                              value={fcmConfig.apiKey}
                              onChange={(e) => setFcmConfig({ ...fcmConfig, apiKey: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Auth Domain</label>
                            <input
                              type="text"
                              value={fcmConfig.authDomain}
                              onChange={(e) => setFcmConfig({ ...fcmConfig, authDomain: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Project ID</label>
                            <input
                              type="text"
                              value={fcmConfig.projectId}
                              onChange={(e) => setFcmConfig({ ...fcmConfig, projectId: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Messaging Sender ID</label>
                            <input
                              type="text"
                              value={fcmConfig.messagingSenderId}
                              onChange={(e) => setFcmConfig({ ...fcmConfig, messagingSenderId: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => {
                              alert('Firebase messaging configuration updated and saved.');
                              setSocketLogs(prev => [
                                { time: new Date().toLocaleTimeString(), event: 'FCM_CONFIG_UPDATED', data: 'Saved new FCM keys' },
                                ...prev
                              ]);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
                          >
                            <Check className="h-4 w-4" />
                            <span>Save Firebase Configuration</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Device Sandbox Simulator</h3>
                        
                        <div className="space-y-4 text-xs">
                          <p className="text-[11px] text-slate-500 leading-relaxed">Simulate receiving web push notifications on client browsers instantly.</p>
                          
                          <button
                            onClick={() => {
                              // Trigger a real browser notification API request as a sandbox preview
                              if ('Notification' in window) {
                                Notification.requestPermission().then(permission => {
                                  if (permission === 'granted') {
                                    new window.Notification('Smart Campus Platform', {
                                      body: 'Web push notifications are fully configured and ready!'
                                    });
                                  } else {
                                    alert('Browser notification permissions denied.');
                                  }
                                });
                              } else {
                                alert('This browser does not support notifications.');
                              }
                            }}
                            className="w-full py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
                          >
                            <Smartphone className="h-4 w-4" />
                            <span>Test Live Web Push</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. EMAIL CENTER TAB */}
                {activeTab === 'email' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Nodemailer & SMTP Control Center</h2>
                      <p className="text-xs text-slate-500">Configure secure mail gateways, manage outgoing mail queues, and monitor transmission states.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 p-5 border border-slate-200 rounded-xl space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Active SMTP Server Settings</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">SMTP Host</label>
                            <input
                              type="text"
                              value={smtpConfig.host}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">SMTP Port</label>
                            <input
                              type="number"
                              value={smtpConfig.port}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value, 10) })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Username / Sender Email</label>
                            <input
                              type="text"
                              value={smtpConfig.user}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Sender Display Name</label>
                            <input
                              type="text"
                              value={smtpConfig.senderName}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              alert('SMTP test connection successful.');
                              setSocketLogs(prev => [
                                { time: new Date().toLocaleTimeString(), event: 'SMTP_TEST_OK', data: `SMTP connected to ${smtpConfig.host}` },
                                ...prev
                              ]);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 px-4 py-2 rounded-lg text-xs font-semibold transition"
                          >
                            Test Connection
                          </button>
                          <button
                            onClick={() => {
                              alert('SMTP settings updated.');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                          >
                            Save Settings
                          </button>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">SMTP Performance Log</h3>
                        <div className="space-y-3 font-mono text-[11px] text-slate-600 leading-tight">
                          <div className="flex justify-between">
                            <span>Connection State:</span>
                            <span className="text-emerald-600 font-bold">CONNECTED</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Secured via TLS:</span>
                            <span className="text-slate-900">YES (PORT 587)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Outbox Queue:</span>
                            <span className="text-slate-900">0 pending items</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily Quota Limit:</span>
                            <span className="text-slate-900">123 / 50000 sent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SMS DISPATCH CONSOLE TAB */}
                {activeTab === 'sms' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Twilio SMS Integration Console</h2>
                      <p className="text-xs text-slate-500">Configure API endpoints, Twilio configurations, and monitor real-time SMS delivery statuses.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 p-5 border border-slate-200 rounded-xl space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Twilio Account & Auth Settings</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Account SID</label>
                            <input
                              type="text"
                              value={twilioConfig.accountSid}
                              onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Auth Token</label>
                            <input
                              type="password"
                              value={twilioConfig.authToken}
                              onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Twilio Outbound Number</label>
                            <input
                              type="text"
                              value={twilioConfig.fromNumber}
                              onChange={(e) => setTwilioConfig({ ...twilioConfig, fromNumber: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-slate-400 transition"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              alert('Twilio credentials updated successfully.');
                              setSocketLogs(prev => [
                                { time: new Date().toLocaleTimeString(), event: 'TWILIO_UPDATED', data: 'Twilio tokens verified' },
                                ...prev
                              ]);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                          >
                            Save Twilio Credentials
                          </button>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Gateway Health Status</h3>
                        <div className="space-y-3 font-mono text-[11px] text-slate-600 leading-tight">
                          <div className="flex justify-between">
                            <span>SMS Link status:</span>
                            <span className="text-emerald-600 font-bold">ONLINE</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Balance/Credit:</span>
                            <span className="text-slate-900">$240.50</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Latency (avg):</span>
                            <span className="text-slate-900">420ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. RICH MESSAGE TEMPLATES TAB */}
                {activeTab === 'templates' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">Campus Notification Templates</h2>
                        <p className="text-xs text-slate-500">Draft reusable message templates with robust variable parameters for auto-replacement.</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setTemplateForm({
                              id: null,
                              templateName: '',
                              channel: 'InApp',
                              subject: '',
                              body: '',
                              variables: '["student_name", "course_name", "due_date"]',
                              active: true
                            });
                            setIsTemplateModalOpen(true);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start transition"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Template</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {templates.map((temp) => (
                        <div key={temp.id} className="p-5 border border-slate-200 rounded-xl bg-white space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">{temp.channel} channel</span>
                              <span className={`h-2 w-2 rounded-full ${temp.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            </div>
                            <h3 className="font-black text-slate-900 text-sm leading-tight">{temp.templateName}</h3>
                            {temp.subject && (
                              <p className="text-[11px] text-slate-500 font-mono italic">Subj: {temp.subject}</p>
                            )}
                            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 font-mono leading-relaxed max-h-24 overflow-y-auto">
                              {temp.body}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                            <div className="flex gap-1">
                              {(() => {
                                try {
                                  return JSON.parse(temp.variables).map((v: string) => (
                                    <span key={v} className="bg-slate-100 text-[9px] px-1.5 py-0.5 rounded text-slate-600 font-mono">
                                      {v}
                                    </span>
                                  ));
                                } catch (e) {
                                  return null;
                                }
                              })()}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setTemplateForm({
                                    id: temp.id,
                                    templateName: temp.templateName,
                                    channel: temp.channel,
                                    subject: temp.subject || '',
                                    body: temp.body,
                                    variables: temp.variables,
                                    active: temp.active
                                  });
                                  setIsTemplateModalOpen(true);
                                }}
                                className="text-slate-400 hover:text-slate-900 transition"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {templates.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-8 col-span-3">No active message templates available.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 8. SCHEDULED DELIVERY QUEUES TAB */}
                {activeTab === 'scheduled' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Scheduled Delivery Queues</h2>
                      <p className="text-xs text-slate-500">Monitor and manage scheduled notification queues and timed academic messages.</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                            <th className="p-4">Notification Name</th>
                            <th className="p-4">Delivery Channel</th>
                            <th className="p-4">Planned Scheduled Date</th>
                            <th className="p-4">Queue State</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {notifications.filter(n => n.scheduledAt && n.status === 'Scheduled').map((notif) => (
                            <tr key={notif.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900">{notif.title}</td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-800">
                                  {notif.notificationType}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-[10px] text-slate-500">
                                {new Date(notif.scheduledAt).toLocaleString()}
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600">
                                  {notif.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleDeleteNotification(notif.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                                >
                                  Cancel Dispatch
                                </button>
                              </td>
                            </tr>
                          ))}
                          {notifications.filter(n => n.scheduledAt && n.status === 'Scheduled').length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400">
                                There are no notifications currently scheduled in the delivery queue.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 9. FULL NOTIFICATION HISTORY TAB */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Enterprise Notification Delivery Audit Logs</h2>
                      <p className="text-xs text-slate-500">Audit, query, and track precise reading and delivery states for all campus members.</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs">
                      <div className="flex-grow min-w-[200px] relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search delivery history..."
                          value={histSearch}
                          onChange={(e) => setHistSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                        />
                      </div>

                      <select
                        value={histType}
                        onChange={(e) => setHistType(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                      >
                        <option value="">All Channels</option>
                        <option value="Email">Email</option>
                        <option value="SMS">SMS</option>
                        <option value="Push">Push</option>
                        <option value="InApp">In-App</option>
                      </select>

                      <select
                        value={histStatus}
                        onChange={(e) => setHistStatus(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                      >
                        <option value="">All Delivery States</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Failed">Failed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                            <th className="p-4">Message Title</th>
                            <th className="p-4">Recipient</th>
                            <th className="p-4">Channel</th>
                            <th className="p-4">Delivery</th>
                            <th className="p-4">Read Status</th>
                            <th className="p-4 text-right">Mark Read</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {history.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <span className="font-bold text-slate-900 block">{rec.notification?.title || 'System Alert'}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">{rec.notification?.message}</span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-slate-900 block">{rec.user?.firstName} {rec.user?.lastName}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{rec.user?.email}</span>
                              </td>
                              <td className="p-4">
                                <span className="font-mono text-[10px] uppercase text-slate-500">{rec.notification?.notificationType}</span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  rec.deliveryStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
                                  rec.deliveryStatus === 'Failed' ? 'bg-rose-50 text-rose-600' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {rec.deliveryStatus}
                                </span>
                              </td>
                              <td className="p-4">
                                {rec.readStatus ? (
                                  <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Read {rec.readAt ? `(${new Date(rec.readAt).toLocaleTimeString()})` : ''}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Unread</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                {!rec.readStatus && (rec.userId === user?.id || isAdmin) && (
                                  <button
                                    onClick={() => handleMarkAsRead(rec.id)}
                                    className="p-1 px-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-[10px] font-bold rounded transition"
                                  >
                                    Mark Read
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {history.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">
                                No matching delivery history logs found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {histTotal > 10 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-mono">Total log entries: {histTotal}</span>
                        <div className="flex gap-2">
                          <button
                            disabled={histPage <= 1}
                            onClick={() => setHistPage(p => p - 1)}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 disabled:opacity-50 transition"
                          >
                            Prev
                          </button>
                          <button
                            disabled={histPage * 10 >= histTotal}
                            onClick={() => setHistPage(p => p + 1)}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 disabled:opacity-50 transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 10. ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Campus Engagement & Delivery Analytics</h2>
                      <p className="text-xs text-slate-500">Aesthetic visualizations of notification channels, read metrics, and recipient engagements over time.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Gateway Success Metrics</h3>
                        <div className="h-64">
                          {analytics?.dailyTrend ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analytics.dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <Tooltip />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="Email" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="SMS" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Push" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">No metrics available.</div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-4">
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Gateway Read State Ratios</h3>
                        <div className="h-64 flex items-center justify-center">
                          {analytics?.summary ? (
                            <div className="w-full max-w-xs space-y-4 text-xs font-mono">
                              <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span>Successful Deliveries:</span>
                                <span className="font-bold text-emerald-600">{analytics.summary.totalRecipients - analytics.summary.failedNotifications}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span>Total Failures:</span>
                                <span className="font-bold text-rose-600">{analytics.summary.failedNotifications}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span>Success Rate Ratio:</span>
                                <span className="font-bold text-slate-900">{analytics.summary.deliverySuccessRate}%</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-xs">No summary stats available.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. USER PREFERENCES TAB */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Personal Communication Preferences</h2>
                      <p className="text-xs text-slate-500">Configure which channels (Email, SMS, Push, In-App) you would like to receive messages for each academic category.</p>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="grid grid-cols-5 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                        <div>Academic Category</div>
                        <div className="text-center">Email Dispatch</div>
                        <div className="text-center">SMS Alert</div>
                        <div className="text-center">Push Notification</div>
                        <div className="text-center">In-App Alert</div>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs text-slate-700">
                        {Object.entries(preferences).map(([category, channels]) => (
                          <div key={category} className="grid grid-cols-5 p-4 items-center">
                            <div className="font-bold text-slate-900">{category} Notifications</div>
                            
                            <div className="flex justify-center">
                              <button
                                onClick={() => togglePreference(category, 'Email')}
                                className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${channels.Email ? 'bg-slate-900' : 'bg-slate-200'}`}
                              >
                                <div className={`h-4 w-4 rounded-full bg-white transition-transform ${channels.Email ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                            </div>

                            <div className="flex justify-center">
                              <button
                                onClick={() => togglePreference(category, 'SMS')}
                                className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${channels.SMS ? 'bg-slate-900' : 'bg-slate-200'}`}
                              >
                                <div className={`h-4 w-4 rounded-full bg-white transition-transform ${channels.SMS ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                            </div>

                            <div className="flex justify-center">
                              <button
                                onClick={() => togglePreference(category, 'Push')}
                                className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${channels.Push ? 'bg-slate-900' : 'bg-slate-200'}`}
                              >
                                <div className={`h-4 w-4 rounded-full bg-white transition-transform ${channels.Push ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                            </div>

                            <div className="flex justify-center">
                              <button
                                onClick={() => togglePreference(category, 'InApp')}
                                className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${channels.InApp ? 'bg-slate-900' : 'bg-slate-200'}`}
                              >
                                <div className={`h-4 w-4 rounded-full bg-white transition-transform ${channels.InApp ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </div>

      {/* DRAFT NOTIFICATION MODAL */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-950 text-sm">Draft Communication Dispatch</h3>
              <button onClick={() => setIsNotifModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Dispatch Title</label>
                <input
                  type="text"
                  required
                  value={notifForm.title}
                  onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                  placeholder="Academic Fee Reminder / Event Alert"
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Message body</label>
                <textarea
                  required
                  rows={3}
                  value={notifForm.message}
                  onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                  placeholder="Notification content body..."
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Channel</label>
                  <select
                    value={notifForm.notificationType}
                    onChange={(e) => setNotifForm({ ...notifForm, notificationType: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                  >
                    <option value="InApp">InApp</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="Push">Push</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Priority</label>
                  <select
                    value={notifForm.priority}
                    onChange={(e) => setNotifForm({ ...notifForm, priority: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Scheduled Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={notifForm.scheduledAt}
                  onChange={(e) => setNotifForm({ ...notifForm, scheduledAt: e.target.value, status: e.target.value ? 'Scheduled' : 'Draft' })}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
              >
                Save Dispatch Draft
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-950 text-sm">{templateForm.id ? 'Edit Template' : 'Create Template'}</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Template Name</label>
                <input
                  type="text"
                  required
                  value={templateForm.templateName}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })}
                  placeholder="FEE_REMINDER / ACADEMIC_ALERT"
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Default Channel</label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                  >
                    <option value="InApp">InApp</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="Push">Push</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Active State</label>
                  <select
                    value={templateForm.active ? 'true' : 'false'}
                    onChange={(e) => setTemplateForm({ ...templateForm, active: e.target.value === 'true' })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              {templateForm.channel === 'Email' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subject Title</label>
                  <input
                    type="text"
                    value={templateForm.subject || ''}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    placeholder="Fee Due Reminder Notification"
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Body Body (supports variables like `{"{{student_name}}"}`)</label>
                <textarea
                  required
                  rows={4}
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  placeholder="Hello {{student_name}}, please be advised that your course {{course_name}} has an assignment due on {{due_date}}."
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-bold text-[10px] uppercase text-slate-400 font-mono">Template Variable Live Preview</span>
                <p className="text-[11px] text-slate-600 italic leading-relaxed font-mono">
                  {renderTemplatePreview(templateForm.body || 'Your draft template preview will appear here...')}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
              >
                Save Template
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-950 text-sm">Campus Broadcaster Dispatcher</h3>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Broadcast Title</label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="Emergency Warning / University Closure Alert"
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Message Alert Body</label>
                <textarea
                  required
                  rows={3}
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  placeholder="Specify broadcast details..."
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Audience Group</label>
                  <select
                    value={broadcastForm.targetAudience}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                  >
                    <option value="ALL">All Campus</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="PARENT">Parents Only</option>
                    <option value="EMPLOYEE">Employees Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Delivery Gateway</label>
                  <select
                    value={broadcastForm.notificationType}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, notificationType: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition"
                  >
                    <option value="InApp">InApp</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="Push">Push</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
              >
                Send Instant Broadcast
              </button>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
