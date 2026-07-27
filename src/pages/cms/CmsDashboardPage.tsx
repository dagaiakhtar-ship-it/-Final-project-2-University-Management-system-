import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  Layout, FileText, Newspaper, Calendar, Image, Menu, Home, Search, Globe,
  LineChart, MessageSquare, Settings, Plus, Edit2, Trash2, Check, X, Upload,
  Folder, Tag, Eye, Share2, ExternalLink, ChevronRight, Sparkles, AlertTriangle,
  CheckCircle2, Clock, Lock, Unlock, ArrowUpRight, BarChart2, EyeOff, Save,
  RotateCcw, Shield, Database, HelpCircle, Activity, Heart, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

interface CmsPage {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  pageType: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewsArticle {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  category: string;
  featuredImage: string | null;
  summary: string | null;
  content: string;
  published: boolean;
  publishedAt: string | null;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CampusEvent {
  id: number;
  uuid: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  organizer: string;
  registrationRequired: boolean;
  capacity: number | null;
  bannerImage: string | null;
  published: boolean;
  createdAt: string;
}

interface MediaItem {
  id: number;
  uuid: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  folder: string;
  tags: string | null;
  createdAt: string;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'Unread' | 'In Progress' | 'Resolved';
  createdAt: string;
}

export const CmsDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pages' | 'news' | 'events' | 'media' | 'menus' | 'homebuilder' | 'seo' | 'forms' | 'analytics' | 'audit'>('dashboard');

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Entities states
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Editing modals states
  const [editingPage, setEditingPage] = useState<Partial<CmsPage> | null>(null);
  const [editingNews, setEditingNews] = useState<Partial<NewsArticle> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<CampusEvent> | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Search, categories and pagination
  const [pageSearch, setPageSearch] = useState('');
  const [newsSearch, setNewsSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaFolderFilter, setMediaFolderFilter] = useState('All');

  // Drag and drop / file upload trigger
  const [dragActive, setDragActive] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadedName, setUploadedName] = useState('');
  const [uploadedType, setUploadedType] = useState('image/png');
  const [uploadedFolder, setUploadedFolder] = useState('General');
  const [uploadedTags, setUploadedTags] = useState('');

  // SEO Setup
  const [globalSeoTitle, setGlobalSeoTitle] = useState('Smart International University');
  const [globalSeoDesc, setGlobalSeoDesc] = useState('Compliance-driven, outcome-based leading university portal');
  const [seoHealth, setSeoHealth] = useState(88);

  // Header & Footer Configuration (State-retained)
  const [headerLinks, setHeaderLinks] = useState([
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about' },
    { label: 'Academics', url: '/academics' },
    { label: 'Admissions', url: '/admissions' },
    { label: 'Research', url: '/research' },
  ]);
  const [footerCopy, setFooterCopy] = useState('© 2026 Smart International University. All rights reserved.');
  const [footerColumns, setFooterColumns] = useState([
    { title: 'Admissions', links: ['Requirements', 'Apply Online', 'Scholarships', 'Inquire'] },
    { title: 'Academics', links: ['Syllabus Database', 'Program Catalog', 'Academic Calendar', 'Outcomes Compliance'] },
  ]);

  // Homepage builder dynamic components (State-retained)
  const [homeHeroTitle, setHomeHeroTitle] = useState('Where Outstanding Outcome Assessments Build Global Careers');
  const [homeHeroSubtitle, setHomeHeroSubtitle] = useState('Join a community of trailblazing researchers, outcomes compliant scholars, and high-performance engineering faculties.');
  const [homeHighlightTitle, setHomeHighlightTitle] = useState('Ranked Top #50 Globally for Educational Integrity');
  const [statCounters, setStatCounters] = useState([
    { label: 'Undergrad Programs', value: '40+' },
    { label: 'OBE Compliant Syllabi', value: '100%' },
    { label: 'Student-to-Faculty Ratio', value: '18:1' },
    { label: 'Post-Grad Placement', value: '98%' },
  ]);

  // Socket triggers simulations & visual indicators
  const [liveLog, setLiveLog] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    simulateSocketEvents();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Pages
      const pagesRes = await apiClient.get('/cms/pages');
      setPages(pagesRes.data.data || []);

      // 2. Fetch News
      const newsRes = await apiClient.get('/news');
      setNews(newsRes.data.data || []);

      // 3. Fetch Events
      const eventsRes = await apiClient.get('/events');
      setEvents(eventsRes.data.data || []);

      // 4. Fetch Media
      try {
        const mediaRes = await apiClient.get('/media');
        setMedia(mediaRes.data.data || []);
      } catch (err) {
        // Fallback for media if endpoint yields auth issues or empty
        setMedia([
          { id: 1, uuid: 'm1', fileName: 'campus_main.jpg', fileType: 'image/jpeg', fileUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', uploadedBy: 'Admin', folder: 'Campus', tags: 'hero, outdoor', createdAt: new Date().toISOString() },
          { id: 2, uuid: 'm2', fileName: 'auditorium.jpg', fileType: 'image/jpeg', fileUrl: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?w=800', uploadedBy: 'Admin', folder: 'Campus', tags: 'event, indoor', createdAt: new Date().toISOString() },
          { id: 3, uuid: 'm3', fileName: 'prospectus_2026.pdf', fileType: 'application/pdf', fileUrl: 'https://example.com/prospectus.pdf', uploadedBy: 'Registrar', folder: 'Documents', tags: 'pdf, admissions', createdAt: new Date().toISOString() },
        ]);
      }

      // 5. Populate standard mock Contact inquiries
      setMessages([
        { id: 101, name: 'Amara Kaelen', email: 'amara.k@gmail.com', subject: 'Admissions Inquiry', message: 'Hi, I would like to inquire if there is direct entry into BS Cyber Security matching credits from my vocational diploma program?', status: 'Unread', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: 102, name: 'Dr. Arthur Pendelton', email: 'arthur.p@oxford.edu', subject: 'Research Cooperation', message: 'Our research syndicate is looking to establish outcomes alignment models. Do you offer cooperative API schemas for program maps?', status: 'In Progress', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
        { id: 103, name: 'Julian Vance', email: 'jvance@outlook.com', subject: 'Accreditation Query', message: 'Hello! I am confirming that the transcript QR code matches regional standards and is accepted by European translation bodies.', status: 'Resolved', createdAt: new Date(Date.now() - 3600000 * 48).toISOString() },
      ]);

      // 6. Fetch audit logs (simulated or database)
      setAuditLogs([
        { id: 1, action: 'Page Created', tableName: 'CmsPage', recordId: '1', timestamp: new Date(Date.now() - 500000).toISOString(), user: 'admin@siu.edu' },
        { id: 2, action: 'Page Published', tableName: 'CmsPage', recordId: '1', timestamp: new Date(Date.now() - 400000).toISOString(), user: 'admin@siu.edu' },
        { id: 3, action: 'News Published', tableName: 'NewsArticle', recordId: '4', timestamp: new Date(Date.now() - 300000).toISOString(), user: 'editor@siu.edu' },
        { id: 4, action: 'Media Uploaded', tableName: 'MediaLibrary', recordId: '12', timestamp: new Date(Date.now() - 200000).toISOString(), user: 'admin@siu.edu' },
        { id: 5, action: 'Event Created', tableName: 'Event', recordId: '3', timestamp: new Date(Date.now() - 100000).toISOString(), user: 'event_manager@siu.edu' },
      ]);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch CMS records.');
    } finally {
      setLoading(false);
    }
  };

  const simulateSocketEvents = () => {
    // Simulate real-time logs coming from server
    const events = [
      '⚡ [Realtime] CMS Page published: "/about-siu"',
      '⚡ [Realtime] News published: "Compliance board awards perfect evaluation to Engineering school"',
      '⚡ [Realtime] New Admissions Inquiry submitted by amara.k@gmail.com',
      '⚡ [Realtime] Event Updated: "Global Research Symposium 2026"',
      '⚡ [Realtime] Media uploaded: "convocation_banner_2026.png" (Optimized)'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < events.length) {
        setLiveLog(prev => [events[i], ...prev].slice(0, 5));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15000);
    return () => clearInterval(interval);
  };

  // --- ACTIONS: CMS PAGES ---
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage?.title || !editingPage?.content || !editingPage?.pageType) return;

    try {
      if (editingPage.id) {
        await apiClient.put(`/cms/pages/${editingPage.id}`, editingPage);
      } else {
        await apiClient.post('/cms/pages', editingPage);
      }
      setEditingPage(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving page.');
    }
  };

  const handleDeletePage = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this CMS page?')) return;
    try {
      await apiClient.delete(`/cms/pages/${id}`);
      fetchData();
    } catch (err: any) {
      alert('Error deleting page.');
    }
  };

  // --- ACTIONS: NEWS ---
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews?.title || !editingNews?.content || !editingNews?.category) return;

    try {
      if (editingNews.id) {
        await apiClient.put(`/news/${editingNews.id}`, editingNews);
      } else {
        await apiClient.post('/news', editingNews);
      }
      setEditingNews(null);
      fetchData();
    } catch (err: any) {
      alert('Error saving news article.');
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await apiClient.delete(`/news/${id}`);
      fetchData();
    } catch (err: any) {
      alert('Error deleting news.');
    }
  };

  // --- ACTIONS: EVENTS ---
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.title || !editingEvent?.description || !editingEvent?.location) return;

    try {
      if (editingEvent.id) {
        await apiClient.put(`/events/${editingEvent.id}`, editingEvent);
      } else {
        await apiClient.post('/events', editingEvent);
      }
      setEditingEvent(null);
      fetchData();
    } catch (err: any) {
      alert('Error saving campus event.');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await apiClient.delete(`/events/${id}`);
      fetchData();
    } catch (err: any) {
      alert('Error deleting event.');
    }
  };

  // --- ACTIONS: MEDIA ---
  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedName || !uploadedUrl) return;

    try {
      await apiClient.post('/media', {
        fileName: uploadedName,
        fileType: uploadedType,
        fileUrl: uploadedUrl,
        folder: uploadedFolder,
        tags: uploadedTags
      });
      setUploadedUrl('');
      setUploadedName('');
      setUploadedTags('');
      fetchData();
    } catch (err: any) {
      alert('Error uploading media asset.');
    }
  };

  const handleDeleteMedia = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await apiClient.delete(`/media/${id}`);
      fetchData();
    } catch (err: any) {
      alert('Error deleting media.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedName(file.name);
      setUploadedType(file.type);
      // Simulate uploaded Cloudinary / Supabase URL
      setUploadedUrl(`https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800`);
    }
  };

  // --- FILTERED DATASETS ---
  const filteredPages = pages.filter(p =>
    p.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
    p.pageType.toLowerCase().includes(pageSearch.toLowerCase())
  );

  const filteredNews = news.filter(n =>
    n.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
    n.category.toLowerCase().includes(newsSearch.toLowerCase())
  );

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    e.location.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredMedia = media.filter(m => {
    const matchesSearch = m.fileName.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      (m.tags && m.tags.toLowerCase().includes(mediaSearch.toLowerCase()));
    const matchesFolder = mediaFolderFilter === 'All' || m.folder === mediaFolderFilter;
    return matchesSearch && matchesFolder;
  });

  // Calculate stats
  const totalPages = pages.length;
  const publishedPages = pages.filter(p => p.published).length;
  const draftPages = totalPages - publishedPages;
  const newsPublished = news.filter(n => n.published).length;
  const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date()).length;
  const totalMedia = media.length;

  // Analytics Chart Data
  const statPublishingTrends = [
    { name: 'Jan', Pages: 2, News: 5, Events: 1 },
    { name: 'Feb', Pages: 4, News: 8, Events: 3 },
    { name: 'Mar', Pages: 5, News: 12, Events: 4 },
    { name: 'Apr', Pages: 8, News: 15, Events: 6 },
    { name: 'May', Pages: 9, News: 22, Events: 8 },
    { name: 'Jun', Pages: 12, News: 31, Events: 10 },
  ];

  const searchAnalytics = [
    { name: 'Syllabus Requirements', searches: 450 },
    { name: 'Admissions Fee Structure', searches: 380 },
    { name: 'Engineering OBE Program', searches: 290 },
    { name: 'Scholarship Form', searches: 240 },
    { name: 'Verifiable Degrees', searches: 190 },
  ];

  const mediaUsageData = [
    { name: 'Campus Images', value: 45 },
    { name: 'Admissions PDFs', value: 25 },
    { name: 'Press Kit Assets', value: 15 },
    { name: 'Governance Docs', value: 15 },
  ];
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Banner with real-time logging alert */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs px-4 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400 font-medium">Enterprise CMS Administration Console</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-[10px]">Active Roles: SUPER_ADMIN, WEB_ADMIN</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-400 font-mono text-[10px]">v4.2-Secure</span>
        </div>
      </div>

      <div className="flex flex-1">
        
        {/* Left Side Tab Navigation */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">SIU CMS Panel</h2>
                <p className="text-[10px] text-slate-500">Global Website Manager</p>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Admin Dashboard', icon: Layout },
                { id: 'pages', label: 'CMS Pages', icon: FileText, count: pages.length },
                { id: 'news', label: 'News Articles', icon: Newspaper, count: news.length },
                { id: 'events', label: 'Campus Events', icon: Calendar, count: events.length },
                { id: 'media', label: 'Media Library', icon: Image, count: media.length },
                { id: 'menus', label: 'Menus & Footer', icon: Menu },
                { id: 'homebuilder', label: 'Homepage Builder', icon: Sparkles },
                { id: 'seo', label: 'SEO Manager', icon: Settings },
                { id: 'forms', label: 'Contact Messages', icon: MessageSquare, count: messages.filter(m=>m.status==='Unread').length },
                { id: 'analytics', label: 'CMS Analytics', icon: LineChart },
                { id: 'audit', label: 'Action Audit Logs', icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors font-medium text-left ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Realtime Event Monitor Box */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-left space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live Socket.io Streams</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[9px] text-slate-400">
              {liveLog.length === 0 ? (
                <div className="text-slate-600 italic">Listening for live updates...</div>
              ) : (
                liveLog.map((log, idx) => (
                  <div key={idx} className="line-clamp-1 border-b border-slate-900 pb-1 text-emerald-400">{log}</div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950 text-rose-200 border border-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2 text-left">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* -------------------- 1. DASHBOARD TAB -------------------- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">CMS Admin Overview</h1>
                  <p className="text-xs text-slate-400">Consolidated analytics, content health score, and website configuration indices.</p>
                </div>
                <Button variant="secondary" onClick={fetchData} className="text-xs">
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  <span>Refresh Stats</span>
                </Button>
              </div>

              {/* Statistical Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-xs font-bold uppercase">Total Pages</span>
                    <FileText className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{totalPages}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>{publishedPages} Published / {draftPages} Drafts</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-xs font-bold uppercase">News Articles</span>
                    <Newspaper className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{news.length}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>{newsPublished} currently active and visible</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-xs font-bold uppercase">Upcoming Events</span>
                    <Calendar className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{upcomingEvents}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-400" />
                    <span>Scheduled on public calendar</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-xs font-bold uppercase">SEO Health Score</span>
                    <Activity className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{seoHealth}%</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Compliance level high</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Analytics Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase text-slate-400">Content Publishing Trends (Last 6 Months)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={statPublishingTrends}>
                        <defs>
                          <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorNews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="Pages" stroke="#6366f1" fillOpacity={1} fill="url(#colorPages)" strokeWidth={2} />
                        <Area type="monotone" dataKey="News" stroke="#10b981" fillOpacity={1} fill="url(#colorNews)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400">Media Library Distribution</h3>
                    <div className="h-44 mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mediaUsageData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {mediaUsageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                    {mediaUsageData.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span>{d.name}</span>
                        </span>
                        <span className="font-mono text-white font-semibold">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400">Dynamic Sitemap & Indexing Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-indigo-400" />
                        <span>sitemap.xml</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Automated sitemap crawling indexing nodes.</p>
                    </div>
                    <a href="/api/cms/sitemap.xml" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-semibold flex items-center gap-1 font-mono text-[11px]">
                      <span>Open XML</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-emerald-400" />
                        <span>robots.txt</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Crawler guidelines, allow index settings.</p>
                    </div>
                    <a href="/api/cms/robots.txt" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-semibold flex items-center gap-1 font-mono text-[11px]">
                      <span>Open TXT</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- 2. CMS PAGES TAB -------------------- */}
          {activeTab === 'pages' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">University CMS Pages</h1>
                  <p className="text-xs text-slate-400">Create, customize, and schedule static, custom, or landing pages for the university website.</p>
                </div>
                <Button variant="primary" onClick={() => setEditingPage({ pageType: 'Static', published: false, content: '' })} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Create Page</span>
                </Button>
              </div>

              {/* Filter / Search Bar */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="Search pages by title, slug, or type..."
                  className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              {/* Page Editor Modal / Panel (Inline) */}
              {editingPage && (
                <Card title={editingPage.id ? 'Edit Page Definition' : 'Create New Page Definition'} description="Construct content blocks, specify page configurations and publish settings." className="border border-indigo-500">
                  <form onSubmit={handleSavePage} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Page Title</label>
                        <input
                          type="text"
                          required
                          value={editingPage.title || ''}
                          onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                          placeholder="e.g. Scholarship Information Desk"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Page Type</label>
                        <select
                          value={editingPage.pageType || 'Static'}
                          onChange={(e) => setEditingPage({ ...editingPage, pageType: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        >
                          {['Home', 'About', 'Admission', 'Academic', 'Research', 'Department', 'Static', 'Landing', 'Custom'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Custom Slug (Auto-generated if empty)</label>
                        <input
                          type="text"
                          value={editingPage.slug || ''}
                          onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                          placeholder="e.g. scholarship-admissions"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-6 pt-5 pl-1">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          <input
                            type="checkbox"
                            checked={editingPage.published || false}
                            onChange={(e) => setEditingPage({ ...editingPage, published: e.target.checked })}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Publish Immediately</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">SEO Meta Title</label>
                        <input
                          type="text"
                          value={editingPage.seoTitle || ''}
                          onChange={(e) => setEditingPage({ ...editingPage, seoTitle: e.target.value })}
                          placeholder="e.g. Apply for Full Scholarships | SIU"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">SEO Meta Description</label>
                        <input
                          type="text"
                          value={editingPage.seoDescription || ''}
                          onChange={(e) => setEditingPage({ ...editingPage, seoDescription: e.target.value })}
                          placeholder="Verify eligibility metrics for international and regional full support programs."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Rich text editing block simulation helper */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-400">Content (HTML / Rich Markdown Support)</label>
                        <div className="flex gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setEditingPage({ ...editingPage, content: (editingPage.content || '') + '<h2>Section Heading</h2>\n<p>Add outcomes descriptions here...</p>' })}
                            className="text-indigo-400 hover:underline"
                          >
                            + Heading Block
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPage({ ...editingPage, content: (editingPage.content || '') + '<div class="p-4 bg-slate-900 border border-slate-800 rounded-xl">\n  <h3>Highlight Card</h3>\n  <p>Highlight important metrics...</p>\n</div>' })}
                            className="text-emerald-400 hover:underline"
                          >
                            + Alert/Highlight Block
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={10}
                        required
                        value={editingPage.content || ''}
                        onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                        placeholder="Type HTML markup or rich-text paragraphs..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono leading-relaxed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" type="button" onClick={() => setEditingPage(null)}>Cancel</Button>
                      <Button variant="primary" type="submit">
                        <Save className="h-3.5 w-3.5 mr-1" />
                        <span>Save CMS Page</span>
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Pages Grid/List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-3">Page Title</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Published At</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPages.map((page) => (
                      <tr key={page.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-white">{page.title}</td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">/page/{page.slug}</td>
                        <td className="p-3">
                          <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded uppercase">
                            {page.pageType}
                          </span>
                        </td>
                        <td className="p-3">
                          {page.published ? (
                            <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-900 text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 w-max">
                              <Check className="h-3 w-3" />
                              <span>Published</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 bg-amber-950/40 border border-amber-900 text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 w-max">
                              <EyeOff className="h-3 w-3" />
                              <span>Draft</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">
                          {page.publishedAt ? new Date(page.publishedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => setEditingPage(page)} className="p-1 text-indigo-400 hover:text-white transition">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeletePage(page.id)} className="p-1 text-rose-400 hover:text-white transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPages.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">No CMS Pages match query parameter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------- 3. NEWS ARTICLES TAB -------------------- */}
          {activeTab === 'news' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">University Press & News Articles</h1>
                  <p className="text-xs text-slate-400">Publish news, announcements, scholar achievements, and academic compliance audits.</p>
                </div>
                <Button variant="primary" onClick={() => setEditingNews({ category: 'Campus Update', published: false, content: '' })} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Create News</span>
                </Button>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  placeholder="Search articles by title, category..."
                  className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              {editingNews && (
                <Card title={editingNews.id ? 'Edit News Article' : 'Draft New Press Release'} description="Draft media statements and associate correct folder tags." className="border border-indigo-500">
                  <form onSubmit={handleSaveNews} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Article Title</label>
                        <input
                          type="text"
                          required
                          value={editingNews.title || ''}
                          onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                          placeholder="e.g. Board of Trustees Announces Tuition Support Initiative"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                        <select
                          value={editingNews.category || 'Campus Update'}
                          onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        >
                          {['Campus Update', 'Academics', 'Research', 'Achievement', 'Admissions'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Featured Image URL</label>
                        <input
                          type="text"
                          value={editingNews.featuredImage || ''}
                          onChange={(e) => setEditingNews({ ...editingNews, featuredImage: e.target.value })}
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex gap-4 pt-5 pl-1 text-xs">
                        <label className="flex items-center gap-2 font-semibold text-slate-300">
                          <input
                            type="checkbox"
                            checked={editingNews.published || false}
                            onChange={(e) => setEditingNews({ ...editingNews, published: e.target.checked })}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                          />
                          <span>Publish on Website</span>
                        </label>
                        <label className="flex items-center gap-2 font-semibold text-slate-300">
                          <input
                            type="checkbox"
                            checked={editingNews.featured || false}
                            onChange={(e) => setEditingNews({ ...editingNews, featured: e.target.checked })}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                          />
                          <span>Feature on Homepage Slider</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Short Summary / Abstract</label>
                      <input
                        type="text"
                        value={editingNews.summary || ''}
                        onChange={(e) => setEditingNews({ ...editingNews, summary: e.target.value })}
                        placeholder="Provide a fast, 1-sentence synopsis."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Article Content</label>
                      <textarea
                        rows={8}
                        required
                        value={editingNews.content || ''}
                        onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" type="button" onClick={() => setEditingNews(null)}>Cancel</Button>
                      <Button variant="primary" type="submit">Save Article</Button>
                    </div>
                  </form>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNews.map((article) => (
                  <div key={article.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-slate-800 text-indigo-300 font-bold px-2 py-0.5 rounded font-mono uppercase">
                          {article.category}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingNews(article)} className="p-1 text-indigo-400 hover:text-white transition">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteNews(article.id)} className="p-1 text-rose-400 hover:text-white transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5">{article.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{article.summary || article.content}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Status: {article.published ? '✅ Live' : '✏️ Draft'}</span>
                      <span>Published: {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -------------------- 4. CAMPUS EVENTS TAB -------------------- */}
          {activeTab === 'events' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Campus Events Calendar</h1>
                  <p className="text-xs text-slate-400">Add expos, symposia, outcome workshops, and register prospective student seats.</p>
                </div>
                <Button variant="primary" onClick={() => setEditingEvent({ published: false, registrationRequired: true })} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Schedule Event</span>
                </Button>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events by title, organizer, location..."
                  className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              {editingEvent && (
                <Card title={editingEvent.id ? 'Edit Scheduled Event' : 'Schedule New Event'} description="Fill out event timeframes, capacities, and public settings." className="border border-indigo-500">
                  <form onSubmit={handleSaveEvent} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Event Title</label>
                        <input
                          type="text"
                          required
                          value={editingEvent.title || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                          placeholder="e.g. Global OBE Compliance Symposium 2026"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Event Location</label>
                        <input
                          type="text"
                          required
                          value={editingEvent.location || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                          placeholder="e.g. Auditorium B, East Campus"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={editingEvent.startDate ? editingEvent.startDate.slice(0, 16) : ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">End Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={editingEvent.endDate ? editingEvent.endDate.slice(0, 16) : ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, endDate: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Organizer</label>
                        <input
                          type="text"
                          required
                          value={editingEvent.organizer || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, organizer: e.target.value })}
                          placeholder="e.g. Registrar Office"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Seat Capacity (Optional)</label>
                        <input
                          type="number"
                          value={editingEvent.capacity || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, capacity: parseInt(e.target.value) || null })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="flex gap-4 pt-6 pl-1 text-xs">
                        <label className="flex items-center gap-2 font-semibold text-slate-300">
                          <input
                            type="checkbox"
                            checked={editingEvent.registrationRequired || false}
                            onChange={(e) => setEditingEvent({ ...editingEvent, registrationRequired: e.target.checked })}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                          />
                          <span>Registration Required</span>
                        </label>
                        <label className="flex items-center gap-2 font-semibold text-slate-300">
                          <input
                            type="checkbox"
                            checked={editingEvent.published || false}
                            onChange={(e) => setEditingEvent({ ...editingEvent, published: e.target.checked })}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                          />
                          <span>Make Event Live</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                      <textarea
                        rows={4}
                        required
                        value={editingEvent.description || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" type="button" onClick={() => setEditingEvent(null)}>Cancel</Button>
                      <Button variant="primary" type="submit">Schedule Event</Button>
                    </div>
                  </form>
                </Card>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-3">Event Title</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Date Frame</th>
                      <th className="p-3">Organizer</th>
                      <th className="p-3">Live Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((evt) => (
                      <tr key={evt.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-white">{evt.title}</td>
                        <td className="p-3 text-slate-300">{evt.location}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-400">
                          {new Date(evt.startDate).toLocaleDateString()} - {new Date(evt.endDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-slate-400">{evt.organizer}</td>
                        <td className="p-3">
                          {evt.published ? (
                            <span className="text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-900 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 w-max">
                              <Check className="h-3 w-3" />
                              <span>Live</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 font-semibold bg-amber-950/40 border border-amber-900 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 w-max">
                              <EyeOff className="h-3 w-3" />
                              <span>Draft</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => setEditingEvent(evt)} className="p-1 text-indigo-400 hover:text-white transition">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteEvent(evt.id)} className="p-1 text-rose-400 hover:text-white transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------- 5. MEDIA LIBRARY TAB -------------------- */}
          {activeTab === 'media' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">University Media Library</h1>
                <p className="text-xs text-slate-400">Upload, compress, and reuse institutional imagery, brochures, and dynamic blueprints.</p>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragActive ? 'border-indigo-500 bg-indigo-950/10' : 'border-slate-800 bg-slate-900/40'}`}
              >
                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex justify-center">
                    <Upload className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-300">Drag and Drop Media File to Upload</h3>
                  <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG, or PDF up to 10MB. Images optimized dynamically.</p>
                  <div className="text-[10px] text-slate-400">or select manually below:</div>
                </div>
              </div>

              {/* Upload settings manual form */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <form onSubmit={handleUploadMedia} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">File Name</label>
                    <input
                      type="text"
                      required
                      value={uploadedName}
                      onChange={(e) => setUploadedName(e.target.value)}
                      placeholder="e.g. admissions_form.pdf"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">File URL</label>
                    <input
                      type="text"
                      required
                      value={uploadedUrl}
                      onChange={(e) => setUploadedUrl(e.target.value)}
                      placeholder="Supabase/Cloudinary URL"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Folder Group</label>
                    <select
                      value={uploadedFolder}
                      onChange={(e) => setUploadedFolder(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      {['General', 'Campus', 'Documents', 'Prospectus'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="primary" type="submit" className="w-full text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span>Register Media File</span>
                    </Button>
                  </div>
                </form>
              </div>

              {/* Folders & Media Grid */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  {['All', 'General', 'Campus', 'Documents'].map(f => (
                    <button
                      key={f}
                      onClick={() => setMediaFolderFilter(f)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${mediaFolderFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredMedia.map((m) => (
                    <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group flex flex-col justify-between">
                      <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800 relative">
                        {m.fileType.startsWith('image/') ? (
                          <img src={m.fileUrl} alt={m.fileName} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
                        ) : (
                          <FileText className="h-8 w-8 text-indigo-400" />
                        )}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => handleDeleteMedia(m.id)} className="p-1.5 bg-slate-950/80 rounded hover:bg-slate-950 hover:text-rose-400 text-slate-300">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3 space-y-1 text-left">
                        <h4 className="text-xs font-bold text-white truncate">{m.fileName}</h4>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span className="font-mono">{m.folder}</span>
                          <span>{m.fileType.split('/')[1]?.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -------------------- 6. NAVIGATION MENUS TAB -------------------- */}
          {activeTab === 'menus' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Header & Footer Navigation Menus</h1>
                <p className="text-xs text-slate-400">Configure global website headers, quick link lists, and footer disclosures.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Header Menu Items */}
                <Card title="Top Navigation Header Menu" description="Set key landing destinations across public header.">
                  <div className="space-y-3">
                    {headerLinks.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const updated = [...headerLinks];
                            updated[idx].label = e.target.value;
                            setHeaderLinks(updated);
                          }}
                          placeholder="Label"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => {
                            const updated = [...headerLinks];
                            updated[idx].url = e.target.value;
                            setHeaderLinks(updated);
                          }}
                          placeholder="Path"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                        <button
                          onClick={() => setHeaderLinks(headerLinks.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <Button variant="secondary" onClick={() => setHeaderLinks([...headerLinks, { label: 'New Link', url: '/custom' }])} className="text-[10px]">
                        <span>Add Link</span>
                      </Button>
                      <Button variant="primary" onClick={() => alert('Navigation structure updated on client')} className="text-[10px]">
                        <span>Save Header</span>
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Footer Content */}
                <Card title="Footer Disclosures & Columns" description="Update legal statements, copyrights, and outcome indicators.">
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Copyright Disclosure Notice</label>
                      <input
                        type="text"
                        value={footerCopy}
                        onChange={(e) => setFooterCopy(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Footer Navigation Columns</label>
                      {footerColumns.map((col, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                          <input
                            type="text"
                            value={col.title}
                            onChange={(e) => {
                              const updated = [...footerColumns];
                              updated[idx].title = e.target.value;
                              setFooterColumns(updated);
                            }}
                            className="font-bold text-white bg-slate-900 px-2 py-1 rounded w-full border-none"
                          />
                          <p className="text-[10px] text-slate-500">Links: {col.links.join(', ')}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-800">
                      <Button variant="primary" onClick={() => alert('Footer layouts compiled')} className="text-[10px]">
                        <span>Compile Footer</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* -------------------- 7. HOMEPAGE BUILDER TAB -------------------- */}
          {activeTab === 'homebuilder' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Public Homepage Builder</h1>
                <p className="text-xs text-slate-400">Visually adjust the headings, highlight boards, and key figures displaying on the campus root URL.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Hero section */}
                <div className="md:col-span-2 space-y-4">
                  <Card title="Hero Announcement Board" description="Edit main display title and abstract paragraph.">
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Hero settings saved'); }}>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Main Heading</label>
                        <input
                          type="text"
                          value={homeHeroTitle}
                          onChange={(e) => setHomeHeroTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Paragraph Subheading</label>
                        <textarea
                          rows={3}
                          value={homeHeroSubtitle}
                          onChange={(e) => setHomeHeroSubtitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Top Highlight Capsule</label>
                        <input
                          type="text"
                          value={homeHighlightTitle}
                          onChange={(e) => setHomeHighlightTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="primary" type="submit" className="text-xs">
                          <span>Apply Layout Modifications</span>
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>

                {/* Counter blocks */}
                <div className="space-y-4">
                  <Card title="Homepage Counter Statistics" description="Provide verifiable compliance counters.">
                    <div className="space-y-3">
                      {statCounters.map((ctr, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={ctr.label}
                            onChange={(e) => {
                              const updated = [...statCounters];
                              updated[idx].label = e.target.value;
                              setStatCounters(updated);
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300"
                          />
                          <input
                            type="text"
                            value={ctr.value}
                            onChange={(e) => {
                              const updated = [...statCounters];
                              updated[idx].value = e.target.value;
                              setStatCounters(updated);
                            }}
                            className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-center text-indigo-400 font-bold"
                          />
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800 text-right">
                        <Button variant="secondary" onClick={() => alert('Counter values stored')} className="text-[10px]">
                          <span>Apply Counters</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- 8. SEO MANAGER TAB -------------------- */}
          {activeTab === 'seo' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">SEO & Indexing Manager</h1>
                <p className="text-xs text-slate-400">Configure global metadata structures, meta tags, and check search diagnostics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* SEO Config */}
                <div className="md:col-span-2 space-y-4">
                  <Card title="Global Metadata Settings" description="Controls fallbacks for crawlers and dynamic metadata.">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Global Site Title (Browser Title bar suffix)</label>
                        <input
                          type="text"
                          value={globalSeoTitle}
                          onChange={(e) => setGlobalSeoTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Global Fallback Meta Description</label>
                        <textarea
                          rows={3}
                          value={globalSeoDesc}
                          onChange={(e) => setGlobalSeoDesc(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
                        />
                      </div>
                      <div className="flex justify-end pt-2 border-t border-slate-800">
                        <Button variant="primary" onClick={() => alert('Global meta tags generated')} className="text-xs">
                          <span>Re-Generate Meta Schema</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Audit Health */}
                <div className="space-y-4">
                  <Card title="Search Crawl Diagnostics" description="SEO Health Indicators based on compliant pages.">
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Missing H1 Headers:</span>
                        <span className="text-emerald-400 font-bold font-mono">0 Pages</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Missing Alt Tags:</span>
                        <span className="text-emerald-400 font-bold font-mono">0 Assets</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Indexability Index:</span>
                        <span className="text-emerald-400 font-bold font-mono">100% Fully Crawlable</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Canonical Redundant URLs:</span>
                        <span className="text-amber-400 font-bold font-mono">2 Warnings</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- 9. CONTACT MESSAGES TAB -------------------- */}
          {activeTab === 'forms' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Public Forms & Inquiries Inbox</h1>
                <p className="text-xs text-slate-400">View and respond to admissions requests or academic accreditation inquiries filed on public portal.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-3">Sender Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Topic / Subject</th>
                      <th className="p-3">Message Snippet</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((msg) => (
                      <tr key={msg.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-white">{msg.name}</td>
                        <td className="p-3 font-mono text-slate-400">{msg.email}</td>
                        <td className="p-3 text-slate-300">{msg.subject}</td>
                        <td className="p-3 text-slate-400 line-clamp-1 truncate max-w-xs">{msg.message}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${msg.status === 'Unread' ? 'bg-rose-950 text-rose-300 border border-rose-900' : msg.status === 'In Progress' ? 'bg-amber-950 text-amber-300 border border-amber-900' : 'bg-emerald-950 text-emerald-300 border border-emerald-900'}`}>
                            {msg.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => {
                              const updated = messages.map(m => m.id === msg.id ? { ...m, status: 'Resolved' as const } : m);
                              setMessages(updated);
                              alert('Message status updated to Resolved');
                            }} className="text-emerald-400 hover:underline">
                              Mark Resolved
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------- 10. CMS ANALYTICS HUB -------------------- */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">CMS Performance Analytics</h1>
                <p className="text-xs text-slate-400">Crawl metrics, visitor search requests, publishing rates, and storage consumption overview.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Search Queries Bar Chart */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase text-slate-400">Popular Search Queries on Portal</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={searchAnalytics} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={11} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={130} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                        <Bar dataKey="searches" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Static summaries */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400">Visitor Overview Architecture</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Our content systems are architected with headless CMS routing ready. Any client can request page schemas, announcements, news channels, or events catalogs without authentication.
                    </p>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total API Endpoint Requests:</span>
                      <span className="font-mono text-white font-semibold">1,489 / Day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average Headless Load Time:</span>
                      <span className="font-mono text-emerald-400 font-semibold">45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Media CDN Efficiency:</span>
                      <span className="font-mono text-emerald-400 font-semibold">98.4% Cached</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- 11. AUDIT LOGS TAB -------------------- */}
          {activeTab === 'audit' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">CMS Action Audit Logs</h1>
                <p className="text-xs text-slate-400">Immutable log records recording content additions, publications, and directory adjustments.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-3">Logged Action</th>
                      <th className="p-3">Reference Model</th>
                      <th className="p-3">Record ID</th>
                      <th className="p-3">Authorized Operator</th>
                      <th className="p-3">Timestamp Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-900 font-bold uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-mono text-[11px]">{log.tableName}</td>
                        <td className="p-3 text-slate-400 font-mono">{log.recordId}</td>
                        <td className="p-3 text-white">{log.user}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default CmsDashboardPage;
