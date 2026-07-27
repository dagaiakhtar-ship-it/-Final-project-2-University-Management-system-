import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, SlidersHorizontal, BarChart3, Bookmark, History, Database,
  Cpu, Sparkles, RefreshCw, Layers, Calendar, CheckCircle2,
  AlertCircle, AlertTriangle, FileText, ExternalLink, Trash2, ArrowUpRight,
  TrendingUp, Clock, Zap, Info, ShieldCheck, HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { motion } from 'framer-motion';
import * as echarts from 'echarts';

interface SearchResult {
  id: number;
  module: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  metadata: string;
  score?: number;
}

interface SavedSearch {
  id: number;
  searchName: string;
  query: string;
  filters?: string;
  createdAt: string;
}

interface SearchHistory {
  id: number;
  query: string;
  module?: string;
  searchType: string;
  executedAt: string;
}

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'history' | 'dashboard' | 'indexer'>('search');

  // Search Parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'text' | 'semantic' | 'hybrid'>('text');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Advanced filters expansion
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search Results & UI States
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  const [executionTime, setExecutionTime] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Saved searches & History States
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [newSaveName, setNewSaveName] = useState('');
  const [isSavingQuery, setIsSavingQuery] = useState(false);

  // Dashboard & Analytics States
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Index Manager States
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexerLogs, setIndexerLogs] = useState<string[]>([]);
  const [indexingProgress, setIndexingProgress] = useState<{ total: number; success: boolean } | null>(null);

  // Global Alerts & Feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // DOM references for charts
  const trendChartRef = useRef<HTMLDivElement>(null);
  const moduleChartRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('su_access_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Execute Search Query
  const runSearch = async (overrideQuery?: string, overrideType?: 'text' | 'semantic' | 'hybrid') => {
    const activeQuery = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const activeType = overrideType || searchType;

    if (!activeQuery.trim()) {
      showToast('error', 'Please enter a search query.');
      return;
    }

    setIsSearching(true);
    setAiSummary('');
    setCitations([]);

    try {
      const queryParams = new URLSearchParams({
        q: activeQuery,
        searchType: activeType,
        ...(selectedModule && { module: selectedModule }),
        ...(selectedEntityType && { entityType: selectedEntityType }),
      });

      const res = await fetch(`/api/search?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setAiSummary(data.aiSummary || '');
        setCitations(data.citations || []);
        setExecutionTime(data.executionTime || 0);
        setTotalCount(data.totalCount || 0);

        // Fetch history and analytics in parallel to keep tables current
        fetchHistoryAndSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error || 'Failed to execute search.');
      }
    } catch (error) {
      showToast('error', 'Network error executing search.');
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Fetch history and saved search
  const fetchHistoryAndSaved = async () => {
    try {
      const historyRes = await fetch('/api/search/history', { headers });
      if (historyRes.ok) {
        const data = await historyRes.json();
        setSearchHistory(data);
      }

      const savedRes = await fetch('/api/search/saved', { headers });
      if (savedRes.ok) {
        const data = await savedRes.json();
        setSavedSearches(data);
      }
    } catch (e) {
      console.error('Failed to load history/saved searches', e);
    }
  };

  // 3. Fetch Dashboard analytics
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch('/api/search/analytics', { headers });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to retrieve search analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // 4. Save Current Query
  const handleSaveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSaveName.trim() || !searchQuery.trim()) {
      showToast('error', 'Please provide a name and a non-empty search query.');
      return;
    }

    setIsSavingQuery(true);
    try {
      const res = await fetch('/api/search/saved', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          searchName: newSaveName.trim(),
          query: searchQuery.trim(),
          filters: {
            module: selectedModule,
            entityType: selectedEntityType,
            searchType
          }
        })
      });

      if (res.ok) {
        showToast('success', `Saved search "${newSaveName}" successfully.`);
        setNewSaveName('');
        fetchHistoryAndSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error || 'Failed to save search.');
      }
    } catch (error) {
      showToast('error', 'Error saving search.');
    } finally {
      setIsSavingQuery(false);
    }
  };

  // 5. Delete Saved Search
  const handleDeleteSaved = async (id: number) => {
    try {
      const res = await fetch(`/api/search/saved/${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        showToast('success', 'Saved search deleted.');
        fetchHistoryAndSaved();
      } else {
        showToast('error', 'Failed to delete saved search.');
      }
    } catch (error) {
      showToast('error', 'Error deleting saved search.');
    }
  };

  // 6. Trigger Global Reindexing
  const handleTriggerReindex = async () => {
    setIsIndexing(true);
    setIndexerLogs(['Initializing global discovery crawling...', 'Scanning available entity models...']);
    setIndexingProgress(null);

    try {
      const res = await fetch('/api/search/reindex', {
        method: 'POST',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setIndexerLogs(prev => [
          ...prev,
          ...data.logs,
          'Successfully completed database indexing loop!'
        ]);
        setIndexingProgress({ total: data.totalIndexed, success: true });
        showToast('success', 'Global Discovery index synchronized successfully.');
      } else {
        const data = await res.json().catch(() => ({}));
        setIndexerLogs(prev => [
          ...prev,
          `Error: ${data.error || 'Execution context failed.'}`,
          ...(data.logs || [])
        ]);
        setIndexingProgress({ total: 0, success: false });
        showToast('error', 'Index synchronization failed.');
      }
    } catch (error) {
      setIndexerLogs(prev => [...prev, 'Network failure communicating with search engine server.']);
      showToast('error', 'Network error during indexing.');
    } finally {
      setIsIndexing(false);
    }
  };

  // 7. Click-through logging helper
  const handleResultClick = async (result: SearchResult) => {
    // Log analytical clicks directly or open resource
    showToast('success', `Navigating to ${result.entityType} with ID ${result.entityId}`);
    // Simulate navigation to correct workspace modules
    const routeMap: { [key: string]: string } = {
      'Student': `/students/${result.entityId}`,
      'Teacher': `/teachers/${result.entityId}`,
      'Department': `/departments/${result.entityId}`,
      'Course': `/course-offerings/${result.entityId}`,
      'Workflow': `/workflow`,
      'NewsArticle': `/cms`,
      'ResearchProject': `/research`
    };
    if (routeMap[result.entityType]) {
      navigate(routeMap[result.entityType]);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHistoryAndSaved();
  }, []);

  // Sync tab triggers
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Render Charts in Dashboard Tab
  useEffect(() => {
    if (activeTab !== 'dashboard' || !analyticsData) return;

    let trendChart: echarts.ECharts | null = null;
    let moduleChart: echarts.ECharts | null = null;

    if (trendChartRef.current) {
      trendChart = echarts.init(trendChartRef.current);
      const trends = analyticsData.trends || [];
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: trends.map((t: any) => t.date),
          axisLine: { lineStyle: { color: '#9ca3af' } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#9ca3af' } }
        },
        series: [{
          name: 'Queries Executed',
          type: 'line',
          smooth: true,
          data: trends.map((t: any) => t.count),
          lineStyle: { width: 3, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ])
          }
        }]
      });
    }

    if (moduleChartRef.current) {
      moduleChart = echarts.init(moduleChartRef.current);
      const indexBreakdown = analyticsData.statistics?.indexedByModule || [];
      moduleChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center', textStyle: { color: '#4b5563' } },
        series: [{
          name: 'Records by Module',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: indexBreakdown.map((item: any) => ({
            value: item._count.id,
            name: item.module
          }))
        }]
      });
    }

    const handleResize = () => {
      trendChart?.resize();
      moduleChart?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      trendChart?.dispose();
      moduleChart?.dispose();
    };
  }, [activeTab, analyticsData]);

  // Filter labels list
  const erpModules = [
    { key: 'Academic', name: 'Academic & Courses' },
    { key: 'HR', name: 'HR & Faculty' },
    { key: 'Finance', name: 'Financial Ledger' },
    { key: 'Procurement', name: 'Procurement Domain' },
    { key: 'Inventory', name: 'Inventory Ledger' },
    { key: 'Assets', name: 'Asset Management' },
    { key: 'Library', name: 'Library Catalog' },
    { key: 'Research', name: 'Research Center' },
    { key: 'AI', name: 'AI Knowledge' },
    { key: 'Workflow', name: 'Workflow Engines' },
    { key: 'Notifications', name: 'Notifications Center' },
    { key: 'CMS', name: 'Website CMS' }
  ];

  const entityTypes = [
    'Student', 'Teacher', 'Department', 'Course', 'AttendanceRecord',
    'Result', 'StudentInvoice', 'PurchaseOrder', 'InventoryItem',
    'Asset', 'Book', 'ResearchProject', 'KnowledgeDocument',
    'Workflow', 'Notification', 'CmsPage'
  ];

  return (
    <div id="enterprise-search-discovery" className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Alert Feedback */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg max-w-sm ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          <span className="font-medium text-sm">{toast.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-2xl p-6 border border-slate-100 shadow-sm gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-blue-500 p-2 rounded-lg text-white">
                <Search className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Enterprise Search & Universal Discovery
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Cross-module Full-text Indexing, AI-Grounding, Semantic Clustering, and Real-time ERP Data Retrieval.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'search' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Search className="w-4 h-4" /> Universal Search
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'saved' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Bookmark className="w-4 h-4" /> Saved Searches
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <History className="w-4 h-4" /> Search History
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <BarChart3 className="w-4 h-4" /> Stats & Trends
            </button>
            {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
              <button
                onClick={() => setActiveTab('indexer')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'indexer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Database className="w-4 h-4" /> Index Manager
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* TAB 1: SEARCH INTERFACE */}
        {activeTab === 'search' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Search Setup Form and Results */}
            <div className="lg:col-span-3 space-y-6">
              {/* Main search card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-md">Search Mode</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSearchType('text')}
                        className={`px-3 py-1 text-xs rounded-full border transition-all font-medium ${searchType === 'text' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        Full-Text (Standard)
                      </button>
                      <button
                        onClick={() => setSearchType('semantic')}
                        className={`px-3 py-1 text-xs rounded-full border transition-all font-medium flex items-center gap-1 ${searchType === 'semantic' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        <Cpu className="w-3.5 h-3.5" /> Semantic (Gemini RAG)
                      </button>
                      <button
                        onClick={() => setSearchType('hybrid')}
                        className={`px-3 py-1 text-xs rounded-full border transition-all font-medium flex items-center gap-1 ${searchType === 'hybrid' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Hybrid Smart Search
                      </button>
                    </div>
                  </div>

                  {/* Search bar input group */}
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-slate-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchType === 'text' ? 'Search by name, roll number, PO code, title or details...' : 'Ask a natural language question (e.g. "Who is majoring in Computer Science and has unpaid fees?")'}
                      onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                      className="w-full pl-12 pr-28 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 font-medium transition-all shadow-inner"
                    />
                    <div className="absolute right-2 flex items-center gap-1.5">
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`p-2.5 rounded-lg border transition-all ${showAdvanced ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                        title="Toggle Filters"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => runSearch()}
                        disabled={isSearching}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                      </button>
                    </div>
                  </div>

                  {/* Quick Filters Drawer */}
                  {showAdvanced && (
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">ERP Module</label>
                        <select
                          value={selectedModule}
                          onChange={(e) => setSelectedModule(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All Modules</option>
                          {erpModules.map((m) => (
                            <option key={m.key} value={m.key}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Entity Type</label>
                        <select
                          value={selectedEntityType}
                          onChange={(e) => setSelectedEntityType(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All Entities</option>
                          {entityTypes.map((et) => (
                            <option key={et} value={et}>{et}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Indexing Period</label>
                        <select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All-Time records</option>
                          <option value="today">Today</option>
                          <option value="week">Past Week</option>
                          <option value="month">Past Month</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Quick Search Saving</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Save lookup as..."
                            value={newSaveName}
                            onChange={(e) => setNewSaveName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700"
                          />
                          <button
                            onClick={handleSaveSearch}
                            disabled={isSavingQuery || !newSaveName.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RAG Summarization Box */}
              {aiSummary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-md font-bold text-slate-900">AI Synthesized Result Summary</h3>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Context-Aware</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 font-medium mb-4 whitespace-pre-line">
                    {aiSummary}
                  </p>
                  {citations.length > 0 && (
                    <div className="border-t border-indigo-100/80 pt-3">
                      <h4 className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Citations / Relevant Sources:</h4>
                      <div className="flex flex-wrap gap-2">
                        {citations.map((c, idx) => (
                          <span key={idx} className="bg-white/80 border border-indigo-100 px-2 py-1 rounded-md text-xs font-medium text-slate-600 shadow-sm">
                            [{idx + 1}] {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Results count statistics header */}
              {(results.length > 0 || isSearching) && (
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold uppercase tracking-wide">
                  <span>Found {totalCount} indexed {totalCount === 1 ? 'record' : 'records'}</span>
                  <span>Execution speed: {executionTime} ms</span>
                </div>
              )}

              {/* Search Results Listing */}
              <div className="space-y-4">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center bg-white border border-slate-150 rounded-2xl p-12 shadow-sm text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                    <h3 className="text-md font-bold text-slate-800">Scouring Enterprise Index</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Executing hybrid search over academic files, financial records, library items, and system logs...
                    </p>
                  </div>
                ) : results.length > 0 ? (
                  results.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick(item)}
                      className="bg-white hover:border-blue-300 border border-slate-200/80 hover:shadow-md cursor-pointer rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                            item.module === 'Academic' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            item.module === 'HR' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            item.module === 'Finance' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            {item.module}
                          </span>
                          <span className="text-[10px] font-medium tracking-wide text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                            {item.entityType}
                          </span>
                          {item.score && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              Score: {item.score}
                            </span>
                          )}
                        </div>

                        <h3 className="text-md font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5">
                          {item.title}
                        </h3>

                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg transition-all">
                          Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : searchQuery ? (
                  <div className="flex flex-col items-center justify-center bg-white border border-slate-150 rounded-2xl p-12 shadow-sm text-center">
                    <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                    <h3 className="text-md font-bold text-slate-800">No Indexed Records Matched</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Check your spelling or tweak filters. Try triggering a fresh "Global Index Rebuild" in the Index Manager.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center bg-white border border-slate-150 rounded-2xl p-12 shadow-sm text-center">
                    <Search className="w-8 h-8 text-slate-300 mb-2" />
                    <h3 className="text-md font-bold text-slate-700">Awaiting your search query...</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Instantly query student profiles, courses, procurement POs, transcripts, or notifications.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar quick filters & summaries */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Module Quick-Filters</h3>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedModule('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${!selectedModule ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    All Campuses & Domains
                  </button>
                  {erpModules.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setSelectedModule(m.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${selectedModule === m.key ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span>{m.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Filter</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Sparkles className="w-24 h-24" />
                </div>
                <h3 className="text-md font-bold mb-1 flex items-center gap-1.5 text-blue-400">
                  <Cpu className="w-5 h-5" /> Semantic Discovery
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Turn on Semantic Search to query the campus index with natural, logic-based questions. The search engine uses the Gemini LLM to crawl documents, structure context, and summarize outcomes directly.
                </p>
                <div className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-[11px] text-slate-300 font-medium leading-normal">
                    AI Summary and citational source mapping are generated instantly.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SAVED SEARCHES */}
        {activeTab === 'saved' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Saved Search Bookmarks</h2>
                <p className="text-xs text-slate-500">Save frequent complex queries and parameters to run them in one-click.</p>
              </div>
              <Bookmark className="w-5 h-5 text-indigo-500" />
            </div>

            {savedSearches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedSearches.map((saved) => (
                  <div key={saved.id} className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">{saved.searchName}</h3>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">{new Date(saved.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                        Query: {saved.query}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => {
                          setSearchQuery(saved.query);
                          setActiveTab('search');
                          runSearch(saved.query);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Execute Search <ArrowUpRight className="w-4.5 h-4.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSaved(saved.id)}
                        className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-all"
                        title="Delete Bookmark"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No saved searches yet</h4>
                <p className="text-xs text-slate-400 mt-1">To save a search query, run a search, expand the advanced menu, and use the save search field.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SEARCH HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Search Activity</h2>
                <p className="text-xs text-slate-500">View and audit your historically run search queries and modes.</p>
              </div>
              <History className="w-5 h-5 text-slate-500" />
            </div>

            {searchHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                      <th className="pb-3">Query string</th>
                      <th className="pb-3">Query Type</th>
                      <th className="pb-3">Module Context</th>
                      <th className="pb-3">Executed At</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {searchHistory.map((hist) => (
                      <tr key={hist.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800">{hist.query}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            hist.searchType === 'text' ? 'bg-slate-100 text-slate-700' :
                            hist.searchType === 'semantic' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {hist.searchType}
                          </span>
                        </td>
                        <td className="py-3 text-xs font-semibold text-slate-500">{hist.module || 'Global Index'}</td>
                        <td className="py-3 text-xs text-slate-400">{new Date(hist.executedAt).toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setSearchQuery(hist.query);
                              setSearchType(hist.searchType as any);
                              setActiveTab('search');
                              runSearch(hist.query, hist.searchType as any);
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                          >
                            Rerun
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No search logs recorded</h4>
                <p className="text-xs text-slate-400 mt-1">Run search queries from the universal dashboard to build your log history.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STATS & TRENDS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Indexed Records</span>
                  <span className="text-2xl font-bold text-slate-800">{analyticsData?.statistics?.indexedRecords || 0}</span>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                  <Database className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Search Volume</span>
                  <span className="text-2xl font-bold text-slate-800">{analyticsData?.statistics?.totalRequests || 0}</span>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Avg response speed</span>
                  <span className="text-2xl font-bold text-slate-800">{analyticsData?.statistics?.avgResponseTime || '0ms'}</span>
                </div>
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Search Accuracy</span>
                  <span className="text-2xl font-bold text-slate-800">{analyticsData?.statistics?.successRate || '100%'}</span>
                </div>
                <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Apache ECharts visualization blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Query Volumes */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h3 className="text-md font-bold text-slate-900 mb-4">Daily Search Volume Trends</h3>
                <div ref={trendChartRef} className="w-full h-80" />
              </div>

              {/* Index breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h3 className="text-md font-bold text-slate-900 mb-4">Indexed Content Breakdown</h3>
                <div ref={moduleChartRef} className="w-full h-80" />
              </div>
            </div>

            {/* Most popular search strings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-md font-bold text-slate-900 mb-4">Top 10 Most Frequent Queries</h3>
              {analyticsData?.popularSearches?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyticsData.popularSearches.map((pop: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200/60 px-2.5 py-1 rounded-lg">
                        #{idx+1} {pop.query}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{pop.count} searches</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No queries run yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: INDEX MANAGER */}
        {activeTab === 'indexer' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Search Engine Index Manager</h2>
                <p className="text-xs text-slate-500">Crawl, format, tokenize, and map database models into the universal database index.</p>
              </div>
              <Database className="w-6 h-6 text-blue-500" />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Crawl Database Content</h3>
                <p className="text-xs text-slate-500">
                  Clears the index and indexes Students, Faculty, Procurement, Inventory, Library books, Research records, and CMS fields.
                </p>
              </div>

              <button
                onClick={handleTriggerReindex}
                disabled={isIndexing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all self-start md:self-auto disabled:opacity-50"
              >
                {isIndexing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Trigger Global Re-Index
              </button>
            </div>

            {/* Logging and progression console output */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Indexing Log Console:</span>
              <div className="bg-slate-950 text-slate-200 font-mono text-xs rounded-2xl p-5 h-64 overflow-y-auto space-y-1.5 shadow-inner border border-slate-850">
                {indexerLogs.length > 0 ? (
                  indexerLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                      <span className={log.startsWith('Error') ? 'text-rose-400' : log.startsWith('Indexed') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {log}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-center py-12">Console is ready. Press "Trigger Global Re-Index" to start crawling.</div>
                )}
              </div>
            </div>

            {indexingProgress && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${indexingProgress.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                {indexingProgress.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold">Successfully index synchronization! Added {indexingProgress.total} records.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span className="text-xs font-bold">Indexing encountered errors. Please check console outputs.</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default SearchPage;
