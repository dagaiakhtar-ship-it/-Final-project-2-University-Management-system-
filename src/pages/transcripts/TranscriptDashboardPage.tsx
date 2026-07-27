import React, { useState, useEffect } from 'react';
import { 
  FileText, GraduationCap, ClipboardCheck, CheckCircle2, XCircle, 
  Download, Plus, Search, Filter, TrendingUp, Calendar, Clock, 
  ShieldCheck, RefreshCw, Trash2, Eye, ExternalLink, Check, AlertCircle, BookOpen, Building
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';

// TS interfaces
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  email: string;
  program?: { id: number; name: string };
  department?: { id: number; name: string };
}

interface Transcript {
  id: number;
  transcriptNumber: string;
  studentId: number;
  student: Student;
  programId: number;
  program: { name: string };
  departmentId: number;
  department: { name: string };
  issueDate: string;
  gpaHistory: any; // array of semesters and GPAs
  academicHistory: any; // courses details
  totalCreditsEarned: number;
  cgpa: number;
  academicStanding: string;
  transcriptStatus: 'Draft' | 'Approved' | 'Published';
  approvedBy?: string;
  approvalDate?: string;
  verificationToken: string;
  qrCodeUrl?: string;
  remarks?: string;
}

interface TranscriptRequest {
  id: number;
  studentId: number;
  student: Student;
  requestDate: string;
  purpose: string;
  numberOfCopies: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  remarks?: string;
  processedBy?: string;
  processedDate?: string;
}

export const TranscriptDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';
  const isStudent = userRole === 'STUDENT';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  // State Management
  const [activeTab, setActiveTab] = useState<string>(isAdmin ? 'manage' : 'history');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [requests, setRequests] = useState<TranscriptRequest[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Student history states
  const [myTranscript, setMyTranscript] = useState<Transcript | null>(null);
  const [myRequests, setMyRequests] = useState<TranscriptRequest[]>([]);
  
  // Submit request states
  const [reqPurpose, setReqPurpose] = useState('Higher Education');
  const [reqCopies, setReqCopies] = useState(1);
  const [customPurpose, setCustomPurpose] = useState('');

  // Inline Detail view
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);

  // Verification state
  const [verificationToken, setVerificationToken] = useState('');
  const [verifiedData, setVerifiedData] = useState<Transcript | null>(null);
  const [verificationError, setVerificationError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Initialize
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (isAdmin) {
        if (activeTab === 'manage') {
          const res = await apiClient.get('/transcripts', {
            params: { search: searchQuery, status: statusFilter }
          });
          let list: any[] = [];
          if (res.data) {
            if (Array.isArray(res.data)) {
              list = res.data;
            } else if (Array.isArray(res.data.transcripts)) {
              list = res.data.transcripts;
            } else if (res.data.data) {
              list = Array.isArray(res.data.data) ? res.data.data : (res.data.data.transcripts || []);
            }
          }
          setTranscripts(list);
          
          // Get students list for generation lookup
          const studRes = await apiClient.get('/students');
          let studList: any[] = [];
          if (studRes.data) {
            if (Array.isArray(studRes.data)) {
              studList = studRes.data;
            } else if (Array.isArray(studRes.data.students)) {
              studList = studRes.data.students;
            } else if (studRes.data.data) {
              studList = Array.isArray(studRes.data.data) ? studRes.data.data : (studRes.data.data.students || []);
            }
          }
          setStudentsList(studList);
        } else if (activeTab === 'requests') {
          const res = await apiClient.get('/transcripts/requests');
          let reqList: any[] = [];
          if (res.data) {
            if (Array.isArray(res.data)) {
              reqList = res.data;
            } else if (Array.isArray(res.data.requests)) {
              reqList = res.data.requests;
            } else if (res.data.data) {
              reqList = Array.isArray(res.data.data) ? res.data.data : (res.data.data.requests || []);
            }
          }
          setRequests(reqList);
        }
      } else if (isStudent) {
        if (activeTab === 'history') {
          try {
            const res = await apiClient.get(`/students/me/transcript`);
            setMyTranscript(res.data);
          } catch (err: any) {
            setMyTranscript(null); // No transcript compiled yet
          }
        } else if (activeTab === 'requests') {
          const res = await apiClient.get('/transcripts/requests');
          let myReqList: any[] = [];
          if (res.data) {
            if (Array.isArray(res.data)) {
              myReqList = res.data;
            } else if (Array.isArray(res.data.requests)) {
              myReqList = res.data.requests;
            } else if (res.data.data) {
              myReqList = Array.isArray(res.data.data) ? res.data.data : (res.data.data.requests || []);
            }
          }
          setMyRequests(myReqList);
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.response?.data?.error || 'Failed to load module data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
    setTimeout(() => {
      setErrorMsg('');
      setSuccessMsg('');
    }, 5000);
  };

  // Compile standard Draft Transcript
  const handleCompileTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast('Please select a student first.', true);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/transcripts/generate', { studentId: Number(selectedStudentId) });
      showToast(`Transcript compiled as Draft for Student successfully! Number: ${res.data.transcriptNumber}`);
      setSelectedStudentId('');
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to compile transcript.', true);
    } finally {
      setLoading(false);
    }
  };

  // Approve Transcript Draft
  const handleApproveTranscript = async (id: number) => {
    setActionLoading(id);
    try {
      await apiClient.post(`/transcripts/${id}/approve`);
      showToast('Transcript approved and seal attached successfully.');
      if (selectedTranscript?.id === id) {
        const updated = await apiClient.get(`/transcripts/${id}`);
        setSelectedTranscript(updated.data);
      }
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Approval failed.', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Publish Transcript
  const handlePublishTranscript = async (id: number) => {
    setActionLoading(id);
    try {
      await apiClient.post(`/transcripts/${id}/publish`);
      showToast('Transcript published and made visible to Student portal.');
      if (selectedTranscript?.id === id) {
        const updated = await apiClient.get(`/transcripts/${id}`);
        setSelectedTranscript(updated.data);
      }
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Publishing failed.', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Transcript
  const handleDeleteTranscript = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this academic transcript? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/transcripts/${id}`);
      showToast('Transcript deleted.');
      setSelectedTranscript(null);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Deletion failed.', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Download Transcript PDF
  const handleDownloadPdf = async (id: number, numberStr: string) => {
    try {
      const response = await apiClient.get(`/transcripts/${id}/download`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `official-transcript-${numberStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      showToast('Failed to download transcript PDF. Please check server availability.', true);
    }
  };

  // Handle Transcript Request (Approve/Reject)
  const handleProcessRequest = async (id: number, status: 'Approved' | 'Rejected', remarks: string = '') => {
    setActionLoading(id);
    try {
      await apiClient.post(`/transcripts/requests/${id}/handle`, { status, remarks });
      showToast(`Request marked as ${status} successfully.`);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to process request.', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Student Submits Transcript Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPurpose = reqPurpose === 'Other' ? customPurpose : reqPurpose;
    if (!finalPurpose) {
      showToast('Please specify a purpose.', true);
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/transcripts/request', {
        purpose: finalPurpose,
        numberOfCopies: Number(reqCopies)
      });
      showToast('Transcript request submitted successfully. Academic Registrar notified!');
      setCustomPurpose('');
      setReqCopies(1);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Request submission failed.', true);
    } finally {
      setLoading(false);
    }
  };

  // Verification Token Search
  const handleVerifySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationToken.trim()) {
      setVerificationError('Please enter a verification token.');
      return;
    }
    setVerificationLoading(true);
    setVerificationError('');
    setVerifiedData(null);
    try {
      const res = await apiClient.get(`/transcripts/verify/${verificationToken.trim()}`);
      setVerifiedData(res.data);
      showToast('Transcript successfully verified against official blockchain/DB logs!');
    } catch (err: any) {
      setVerificationError(err.response?.data?.error || 'Verification failed. Token is invalid, expired, or revoked.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Helpers for summary analytics calculations
  const totalCompletedTranscripts = transcripts.length;
  const approvedTranscripts = transcripts.filter(t => t.transcriptStatus === 'Approved').length;
  const publishedTranscripts = transcripts.filter(t => t.transcriptStatus === 'Published').length;
  const draftTranscripts = transcripts.filter(t => t.transcriptStatus === 'Draft').length;

  const totalRequestsCount = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const approvedRequests = requests.filter(r => r.status === 'Approved' || r.status === 'Completed').length;

  // Pie chart data
  const statusPieData = [
    { name: 'Draft', value: draftTranscripts || 1 },
    { name: 'Approved', value: approvedTranscripts || 1 },
    { name: 'Published', value: publishedTranscripts || 1 }
  ];
  const COLORS = ['#94a3b8', '#0ea5e9', '#10b981'];

  // Requests status data
  const requestsBarData = [
    { name: 'Pending', count: pendingRequests },
    { name: 'Processed', count: approvedRequests },
    { name: 'Total', count: totalRequestsCount }
  ];

  return (
    <div className="space-y-6" id="transcript-dashboard-container">
      {/* Dynamic Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-emerald-600" />
            Official Transcript & Academic Records
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate, verify, request, and publish secure, branded, QR-coded academic transcripts.
          </p>
        </div>

        {/* Global Action Banner */}
        <div className="flex items-center gap-2">
          {activeTab === 'manage' && isAdmin && (
            <form onSubmit={handleCompileTranscript} className="flex items-center gap-2">
              <select
                className="rounded-lg border-slate-300 text-sm p-2 w-48 focus:border-emerald-500 focus:ring-emerald-500"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                id="compile-student-dropdown"
              >
                <option value="">Select Student...</option>
                {studentsList.map((stud) => (
                  <option key={stud.id} value={stud.id}>
                    {stud.firstName} {stud.lastName} ({stud.registrationNumber})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                id="compile-submit-button"
              >
                {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Compile Transcript
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-emerald-800 text-sm flex items-center gap-2.5 rounded-r-lg" id="success-banner">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-800 text-sm flex items-center gap-2.5 rounded-r-lg" id="error-banner">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        {isAdmin && (
          <button
            onClick={() => { setActiveTab('manage'); setSelectedTranscript(null); }}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'manage' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-manage-transcripts"
          >
            Manage Transcripts
          </button>
        )}

        <button
          onClick={() => { setActiveTab('requests'); setSelectedTranscript(null); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'requests' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="tab-requests"
        >
          {isAdmin ? 'Requests & Approvals' : 'Request Official Transcript'}
        </button>

        {isStudent && (
          <button
            onClick={() => { setActiveTab('history'); setSelectedTranscript(null); }}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'history' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-student-history"
          >
            My Academic Transcript
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => { setActiveTab('analytics'); setSelectedTranscript(null); }}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'analytics' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-analytics"
          >
            Analytics & Audits
          </button>
        )}

        <button
          onClick={() => { setActiveTab('verify'); setSelectedTranscript(null); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'verify' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="tab-verify"
        >
          Verify Certificate
        </button>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side/Central Area (Takes 2/3 space if details view is open, or full space) */}
        <div className={`lg:col-span-2 space-y-6 ${activeTab === 'verify' || activeTab === 'analytics' ? 'lg:col-span-3' : ''}`}>
          
          {/* 1. MANAGE TAB (ADMIN) */}
          {activeTab === 'manage' && isAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="manage-transcripts-panel">
              {/* Header & Filter Row */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student or transcript..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full rounded-lg border border-slate-200 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <select
                    className="rounded-lg border border-slate-200 p-2 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Published">Published</option>
                  </select>
                  <button
                    onClick={fetchData}
                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                    title="Reload transcripts list"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-slate-400 text-xs font-mono font-medium">
                  Compiled Transcripts: {transcripts.length}
                </div>
              </div>

              {/* Transcripts Table */}
              {loading ? (
                <div className="p-12 text-center" id="loading-spinner">
                  <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-slate-500 text-sm mt-3">Fetching official database listings...</p>
                </div>
              ) : transcripts.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No compiled transcripts found</p>
                  <p className="text-xs text-slate-400 mt-1">Select a student above to compile their official records.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="p-4">Transcript No</th>
                        <th className="p-4">Student</th>
                        <th className="p-4 text-center">CGPA</th>
                        <th className="p-4 text-center">Standing</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {transcripts.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-800">
                            {t.transcriptNumber}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{t.student?.firstName} {t.student?.lastName}</div>
                            <div className="text-slate-400 text-[10px] font-mono mt-0.5">{t.student?.registrationNumber}</div>
                          </td>
                          <td className="p-4 text-center font-mono font-black text-emerald-650">
                            {t.cgpa?.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {t.academicStanding}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.transcriptStatus === 'Published' ? 'bg-emerald-100 text-emerald-800' :
                              t.transcriptStatus === 'Approved' ? 'bg-sky-100 text-sky-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {t.transcriptStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedTranscript(t)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all inline-flex items-center gap-1 font-semibold text-[11px]"
                              title="View full academic history details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(t.id, t.transcriptNumber)}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all inline-flex items-center gap-1 font-semibold text-[11px]"
                              title="Download dynamic PDF stream"
                            >
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </button>
                            <button
                              onClick={() => handleDeleteTranscript(t.id)}
                              disabled={actionLoading === t.id}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all disabled:opacity-50 inline-flex"
                              title="Delete Transcript"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. REQUESTS TAB (ADMIN + STUDENT) */}
          {activeTab === 'requests' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="requests-tab-panel">
              
              {/* STUDENT SUBMIT REQUEST FORM (Left column) */}
              {isStudent && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                      New Request Form
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Submit request for secure physical or digital copy.</p>
                  </div>

                  <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5">Request Purpose</label>
                      <select
                        value={reqPurpose}
                        onChange={(e) => setReqPurpose(e.target.value)}
                        className="w-full rounded-lg border-slate-200 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                        id="purpose-select"
                      >
                        <option value="Higher Education">Higher Education Admission</option>
                        <option value="Employment">Employment Verification</option>
                        <option value="Scholarship">Scholarship Application</option>
                        <option value="Visa">Visa / Embassy Clearance</option>
                        <option value="Personal">Personal Records</option>
                        <option value="Other">Other Purpose...</option>
                      </select>
                    </div>

                    {reqPurpose === 'Other' && (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Specify Purpose</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Bank Loan Clearance"
                          value={customPurpose}
                          onChange={(e) => setCustomPurpose(e.target.value)}
                          className="w-full rounded-lg border-slate-200 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5">Number of Printed Copies Required</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        required
                        value={reqCopies}
                        onChange={(e) => setReqCopies(Number(e.target.value))}
                        className="w-full rounded-lg border-slate-200 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      Submit Official Request
                    </button>
                  </form>
                </div>
              )}

              {/* REQUESTS LIST TABLE (Takes remaining space) */}
              <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${isStudent ? 'md:col-span-2' : 'md:col-span-3'}`}>
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {isAdmin ? 'Active Academic Registrar Queue' : 'My Submission History'}
                  </h3>
                  <button
                    onClick={fetchData}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {loading ? (
                  <div className="p-12 text-center">
                    <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin mx-auto" />
                  </div>
                ) : (isStudent ? myRequests : requests).length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <ClipboardCheck className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No requests filed yet</p>
                    {isStudent && <p className="text-xs text-slate-400 mt-1">Submit request on the left panel to begin.</p>}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                          {isAdmin && <th className="p-4">Student</th>}
                          <th className="p-4">Date Filed</th>
                          <th className="p-4">Purpose</th>
                          <th className="p-4 text-center">Copies</th>
                          <th className="p-4 text-center">Status</th>
                          {isAdmin && <th className="p-4 text-right">Approval Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(isStudent ? myRequests : requests).map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                            {isAdmin && (
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{r.student?.firstName} {r.student?.lastName}</div>
                                <div className="text-slate-400 text-[10px] font-mono">{r.student?.registrationNumber}</div>
                              </td>
                            )}
                            <td className="p-4 text-slate-600">
                              {new Date(r.requestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="p-4 font-medium text-slate-800">{r.purpose}</td>
                            <td className="p-4 text-center font-mono font-bold">{r.numberOfCopies}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                r.status === 'Approved' ? 'bg-sky-100 text-sky-800' :
                                r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="p-4 text-right space-x-1 whitespace-nowrap">
                                {r.status === 'Pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleProcessRequest(r.id, 'Approved')}
                                      disabled={actionLoading === r.id}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-md transition-all inline-flex items-center gap-1"
                                    >
                                      <Check className="h-3 w-3" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleProcessRequest(r.id, 'Rejected')}
                                      disabled={actionLoading === r.id}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold px-2 py-1 rounded-md transition-all inline-flex items-center gap-1"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">Processed</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. STUDENT OWN ACADEMIC HISTORY TAB */}
          {activeTab === 'history' && isStudent && (
            <div className="space-y-6" id="student-academic-history-panel">
              {myTranscript ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                  {/* Dynamic Header Badge Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/40">
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">Verified Official Transcript</div>
                      <h3 className="font-extrabold text-slate-900 text-lg">{myTranscript.transcriptNumber}</h3>
                      <div className="text-xs text-slate-500">Seal attached on: {new Date(myTranscript.issueDate).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center bg-white border border-slate-100 px-4 py-2 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Credits Earned</div>
                        <div className="text-lg font-black text-slate-800">{myTranscript.totalCreditsEarned}</div>
                      </div>
                      <div className="text-center bg-white border border-slate-100 px-4 py-2 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Cumulative CGPA</div>
                        <div className="text-lg font-black text-emerald-600">{myTranscript.cgpa?.toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => handleDownloadPdf(myTranscript.id, myTranscript.transcriptNumber)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-lg flex items-center gap-1.5 transition-all self-stretch shadow-sm"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Academic semester wise results list */}
                  <div className="space-y-6">
                    <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                      Term-by-Term Course Registration & Grading Log
                    </h4>

                    {myTranscript.academicHistory && Object.keys(myTranscript.academicHistory).map((semName) => {
                      const sem = myTranscript.academicHistory[semName];
                      return (
                        <div key={semName} className="border border-slate-100 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-b border-slate-100">
                            <span className="font-extrabold text-slate-800 text-xs">{semName}</span>
                            <div className="space-x-3 text-[11px] font-bold text-slate-500">
                              <span>Semester GPA: <span className="text-emerald-600 font-black">{sem.gpa?.toFixed(2)}</span></span>
                              <span>Credits: <span className="text-slate-800">{sem.credits}</span></span>
                            </div>
                          </div>
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50/20 text-slate-400 text-[10px] font-bold border-b border-slate-100">
                                <th className="p-3">Course Code</th>
                                <th className="p-3">Course Title</th>
                                <th className="p-3 text-center">Credit Hours</th>
                                <th className="p-3 text-center">Letter Grade</th>
                                <th className="p-3 text-center">Grade Point</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {sem.courses.map((c: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/30">
                                  <td className="p-3 font-mono font-bold text-slate-700">{c.code}</td>
                                  <td className="p-3 text-slate-800 font-medium">{c.title}</td>
                                  <td className="p-3 text-center text-slate-600 font-bold">{c.credits}</td>
                                  <td className="p-3 text-center">
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-black text-[10px]">
                                      {c.grade}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center text-slate-600 font-mono font-bold">{c.points?.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-extrabold text-slate-700 text-sm">No Official Transcript Compiled</h4>
                  <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                    Your official transcript draft is yet to be compiled or published by the Academic Registrar's office. You can request a transcript using the Request tab above.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. VERIFY PORTAL */}
          {activeTab === 'verify' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-4xl mx-auto" id="verify-form-panel">
              <div className="text-center space-y-2 border-b border-slate-100 pb-5">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  Anti-Forgery Verification Engine
                </h3>
                <p className="text-slate-500 text-xs">
                  Validate the integrity of any official university transcript. Input the printed verification token to pull from the live ledger.
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleVerifySearch} className="flex gap-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <ShieldCheck className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter transcript verification token..."
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-slate-200 text-xs focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    id="verification-token-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verificationLoading}
                  className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                  id="verification-verify-button"
                >
                  {verificationLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Verify'}
                </button>
              </form>

              {/* Verification Results Display */}
              {verificationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-xs flex items-center gap-3 max-w-lg mx-auto">
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-extrabold">Verification Failed:</span> {verificationError}
                  </div>
                </div>
              )}

              {verifiedData && (
                <div className="border border-emerald-200 bg-emerald-50/10 rounded-xl p-6 max-w-xl mx-auto space-y-5 shadow-sm" id="verified-result-card">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <Check className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-emerald-700 font-black text-sm uppercase tracking-wider">VERIFIED AUTHENTIC</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Token: {verifiedData.verificationToken}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px] font-bold">VERIFICATION DATE</div>
                      <div className="text-slate-800 text-xs font-bold font-mono">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Student profile verification summary */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">STUDENT NAME</span>
                      <span className="text-slate-900 font-extrabold">{verifiedData.student?.firstName} {verifiedData.student?.lastName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">REGISTRATION NO</span>
                      <span className="text-slate-900 font-bold font-mono">{verifiedData.student?.registrationNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">ACADEMIC PROGRAM</span>
                      <span className="text-slate-900 font-medium">{verifiedData.program?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">OFFICIAL CGPA</span>
                      <span className="text-emerald-600 font-black font-mono text-sm">{verifiedData.cgpa?.toFixed(2)} / 4.00</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">CREDITS COMPLETED</span>
                      <span className="text-slate-900 font-bold font-mono">{verifiedData.totalCreditsEarned} Credits</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">ACADEMIC STANDING</span>
                      <span className="text-slate-900 font-semibold">{verifiedData.academicStanding}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    This record is certified by the Academic Registrar and tamper-proofed with static crypt-signature.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. ANALYTICS & AUDITS TAB (ADMIN) */}
          {activeTab === 'analytics' && isAdmin && (
            <div className="space-y-6" id="analytics-charts-panel">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                  <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Compiled</div>
                    <div className="text-xl font-black text-slate-800">{totalCompletedTranscripts}</div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                  <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</div>
                    <div className="text-xl font-black text-slate-800">{pendingRequests}</div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                  <div className="h-10 w-10 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Seals</div>
                    <div className="text-xl font-black text-slate-800">{approvedTranscripts}</div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Published Active</div>
                    <div className="text-xl font-black text-slate-800">{publishedTranscripts}</div>
                  </div>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Transcript status distribution */}
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2">Transcript Compilation Status</h4>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Requests process status */}
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2">Registrar Requests Performance</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={requestsBarData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                          {requestsBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#0ea5e9' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Right Side: Detail Panel (Takes 1/3 space and displays selected transcript info) */}
        {activeTab === 'manage' && isAdmin && selectedTranscript && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5 h-fit" id="detail-preview-panel">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Transcript Details
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Live academic record visualization</p>
              </div>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1.5 hover:bg-slate-50 rounded-lg transition-all"
              >
                Close
              </button>
            </div>

            {/* Profile info block */}
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Student Profile</div>
                <div className="font-extrabold text-slate-900 mt-1">{selectedTranscript.student?.firstName} {selectedTranscript.student?.lastName}</div>
                <div className="font-mono text-[10px] text-slate-500 mt-0.5">{selectedTranscript.student?.registrationNumber}</div>
                <div className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {selectedTranscript.program?.name}
                </div>
              </div>

              {/* Transcript Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-55/40 border border-slate-100 rounded-lg">
                <div>
                  <span className="text-[9px] font-bold text-slate-450 block">STATUS</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black inline-block mt-0.5 ${
                    selectedTranscript.transcriptStatus === 'Published' ? 'bg-emerald-150/70 text-emerald-800' :
                    selectedTranscript.transcriptStatus === 'Approved' ? 'bg-sky-150/70 text-sky-800' :
                    'bg-slate-150/70 text-slate-600'
                  }`}>
                    {selectedTranscript.transcriptStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-450 block">FINAL CGPA</span>
                  <span className="text-slate-800 font-black text-sm font-mono mt-0.5">{selectedTranscript.cgpa?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-450 block">EARNED CREDITS</span>
                  <span className="text-slate-800 font-bold font-mono mt-0.5">{selectedTranscript.totalCreditsEarned} Credits</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-450 block">STANDING</span>
                  <span className="text-slate-800 font-semibold mt-0.5 inline-block">{selectedTranscript.academicStanding}</span>
                </div>
              </div>

              {/* Crypt-verification card */}
              <div className="p-3 border border-emerald-100 bg-emerald-50/10 rounded-lg space-y-1">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Crypt Ledger Token</span>
                <span className="text-[10px] font-mono text-slate-700 font-medium break-all block">{selectedTranscript.verificationToken}</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2">
                {selectedTranscript.transcriptStatus === 'Draft' && (
                  <button
                    onClick={() => handleApproveTranscript(selectedTranscript.id)}
                    disabled={actionLoading === selectedTranscript.id}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs"
                  >
                    {actionLoading === selectedTranscript.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Attach Seal & Approve
                  </button>
                )}

                {selectedTranscript.transcriptStatus === 'Approved' && (
                  <button
                    onClick={() => handlePublishTranscript(selectedTranscript.id)}
                    disabled={actionLoading === selectedTranscript.id}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs"
                  >
                    {actionLoading === selectedTranscript.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Publish to Student Portal
                  </button>
                )}

                <button
                  onClick={() => handleDownloadPdf(selectedTranscript.id, selectedTranscript.transcriptNumber)}
                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  Download Verified PDF
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
