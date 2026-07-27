import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  TrendingUp,
  User,
  Users,
  Search,
  Check,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  FileText,
  Printer,
  ChevronRight,
  Filter,
  BarChart2,
  List,
  Grid,
  Zap,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export const ResultDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'STUDENT';
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Tabs: 'analytics', 'manage', 'transcript', 'merit'
  const [activeTab, setActiveTab] = useState<string>(isStudent ? 'transcript' : 'manage');

  // Core Data State
  const [semesters, setSemesters] = useState<any[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [meritList, setMeritList] = useState<any[]>([]);
  
  // Selected student context (for transcript/mark sheet viewing)
  const [currentStudentId, setCurrentStudentId] = useState<number | null>(null);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [transcriptData, setTranscriptData] = useState<any | null>(null);

  // Filters State
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Loading & Action State
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manage Results Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [formMarks, setFormMarks] = useState({
    studentId: '',
    enrollmentId: '',
    courseOfferingId: '',
    semesterId: '',
    academicYear: '2026-2027',
    session: 'Fall',
    assignmentMarks: '',
    quizMarks: '',
    midtermMarks: '',
    finalExamMarks: '',
    practicalMarks: '',
    vivaMarks: '',
    makeupMarks: '',
    remarks: '',
  });

  // Load configuration and core lookups
  useEffect(() => {
    fetchCoreLookups();
  }, []);

  // Fetch lookups
  const fetchCoreLookups = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      // 1. Fetch semesters
      const semRes = await apiClient.get('/semesters');
      let semList = [];
      if (semRes.data) {
        if (Array.isArray(semRes.data)) {
          semList = semRes.data;
        } else if (semRes.data.data) {
          semList = Array.isArray(semRes.data.data) ? semRes.data.data : (semRes.data.data.semesters || []);
        } else if (semRes.data.semesters) {
          semList = semRes.data.semesters;
        }
      }
      setSemesters(semList);

      // 2. Fetch course offerings
      const coRes = await apiClient.get('/course-offerings');
      let coList = [];
      if (coRes.data) {
        if (Array.isArray(coRes.data)) {
          coList = coRes.data;
        } else if (coRes.data.data) {
          coList = Array.isArray(coRes.data.data) ? coRes.data.data : (coRes.data.data.courseOfferings || []);
        } else if (coRes.data.courseOfferings) {
          coList = coRes.data.courseOfferings;
        }
      }
      setCourseOfferings(coList);

      // 3. Fetch students
      const studRes = await apiClient.get('/students');
      let finalStudList = [];
      if (studRes.data) {
        if (Array.isArray(studRes.data)) {
          finalStudList = studRes.data;
        } else if (studRes.data.data) {
          finalStudList = Array.isArray(studRes.data.data) ? studRes.data.data : (studRes.data.data.students || []);
        } else if (studRes.data.students) {
          finalStudList = studRes.data.students;
        }
      }
      setStudents(finalStudList);

      // If user is a student, automatically find and set their student profile context
      if (isStudent) {
        const found = finalStudList.find((s: any) => s.user?.email === user?.email || s.userId === user?.id);
        if (found) {
          setCurrentStudentId(found.id);
          setStudentProfile(found);
          fetchStudentTranscript(found.id);
        } else {
          // If profile lookup didn't succeed, list own results if endpoint allows
          fetchOwnStudentResults();
        }
      }
    } catch (err: any) {
      setErrorMessage('Failed to fetch initial dropdown settings. Please refresh.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch results based on current filters
  const fetchResultsList = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const params: any = {};
      if (selectedSemester) params.semesterId = selectedSemester;
      if (selectedCourseOffering) params.courseOfferingId = selectedCourseOffering;
      if (statusFilter) params.approvalStatus = statusFilter;

      const res = await apiClient.get('/results', { params });
      setResults(res.data || []);
    } catch (err: any) {
      setErrorMessage('Could not load results. Check network or database connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch own results for student
  const fetchOwnStudentResults = async () => {
    try {
      setLoading(true);
      if (currentStudentId) {
        fetchStudentTranscript(currentStudentId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Transcript & GPAs for a specific student ID
  const fetchStudentTranscript = async (studentId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/students/${studentId}/transcript-preview`);
      setTranscriptData(res.data || null);
    } catch (err: any) {
      setErrorMessage('Error fetching student transcript preview.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Analytics
  const fetchResultAnalytics = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedSemester) params.semesterId = selectedSemester;
      const res = await apiClient.get('/results/analytics', { params });
      setAnalytics(res.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Merit List
  const fetchMeritListRecords = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedSemester) params.semesterId = selectedSemester;
      const res = await apiClient.get('/results/merit-list', { params });
      setMeritList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger query depending on current active tab
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchResultsList();
    } else if (activeTab === 'analytics') {
      fetchResultAnalytics();
    } else if (activeTab === 'merit') {
      fetchMeritListRecords();
    }
  }, [activeTab, selectedSemester, selectedCourseOffering, statusFilter]);

  // Handle automatic batch processing
  const handleBatchProcess = async () => {
    if (!selectedCourseOffering) {
      setErrorMessage('Please select a Course Offering to process results.');
      return;
    }
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await apiClient.post('/results/process', {
        courseOfferingId: Number(selectedCourseOffering),
      });
      setSuccessMessage(res.data.message || 'Results processed successfully!');
      fetchResultsList();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to process course marks.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate GPA
  const handleCalculateGPA = async (studentId: number, semesterId: number) => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await apiClient.post('/results/calculate-gpa', { studentId, semesterId });
      setSuccessMessage(res.data.message || 'Semester GPA calculated!');
      fetchResultsList();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'GPA calculation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate CGPA
  const handleCalculateCGPA = async (studentId: number) => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await apiClient.post('/results/calculate-cgpa', { studentId });
      setSuccessMessage(res.data.message || 'Cumulative CGPA calculated!');
      fetchResultsList();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'CGPA calculation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve a single result
  const handleApproveResult = async (id: number) => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await apiClient.patch(`/results/${id}/approve`);
      setSuccessMessage('Result marks successfully approved.');
      fetchResultsList();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to approve marks.');
    } finally {
      setActionLoading(false);
    }
  };

  // Publish a single result
  const handlePublishResult = async (id: number) => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await apiClient.patch(`/results/${id}/publish`);
      setSuccessMessage('Result successfully published. Student can now view.');
      fetchResultsList();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to publish marks.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete result record
  const handleDeleteResult = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this result record?')) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      await apiClient.delete(`/results/${id}`);
      setSuccessMessage('Result record deleted successfully.');
      fetchResultsList();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to delete record.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit modal open
  const openEditModal = (result: any | null = null) => {
    if (result) {
      setEditingResult(result);
      setFormMarks({
        studentId: String(result.studentId),
        enrollmentId: String(result.enrollmentId),
        courseOfferingId: String(result.courseOfferingId),
        semesterId: String(result.semesterId),
        academicYear: result.academicYear || '2026-2027',
        session: result.session || 'Fall',
        assignmentMarks: result.assignmentMarks !== null ? String(result.assignmentMarks) : '',
        quizMarks: result.quizMarks !== null ? String(result.quizMarks) : '',
        midtermMarks: result.midtermMarks !== null ? String(result.midtermMarks) : '',
        finalExamMarks: result.finalExamMarks !== null ? String(result.finalExamMarks) : '',
        practicalMarks: result.practicalMarks !== null ? String(result.practicalMarks) : '',
        vivaMarks: result.vivaMarks !== null ? String(result.vivaMarks) : '',
        makeupMarks: result.makeupMarks !== null ? String(result.makeupMarks) : '',
        remarks: result.remarks || '',
      });
    } else {
      setEditingResult(null);
      setFormMarks({
        studentId: '',
        enrollmentId: '',
        courseOfferingId: '',
        semesterId: '',
        academicYear: '2026-2027',
        session: 'Fall',
        assignmentMarks: '',
        quizMarks: '',
        midtermMarks: '',
        finalExamMarks: '',
        practicalMarks: '',
        vivaMarks: '',
        makeupMarks: '',
        remarks: '',
      });
    }
    setIsEditModalOpen(true);
  };

  // Handle modal submit (create/edit)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload = {
        studentId: Number(formMarks.studentId),
        enrollmentId: Number(formMarks.enrollmentId),
        courseOfferingId: Number(formMarks.courseOfferingId),
        semesterId: Number(formMarks.semesterId),
        academicYear: formMarks.academicYear,
        session: formMarks.session,
        assignmentMarks: formMarks.assignmentMarks !== '' ? parseFloat(formMarks.assignmentMarks) : null,
        quizMarks: formMarks.quizMarks !== '' ? parseFloat(formMarks.quizMarks) : null,
        midtermMarks: formMarks.midtermMarks !== '' ? parseFloat(formMarks.midtermMarks) : null,
        finalExamMarks: formMarks.finalExamMarks !== '' ? parseFloat(formMarks.finalExamMarks) : null,
        practicalMarks: formMarks.practicalMarks !== '' ? parseFloat(formMarks.practicalMarks) : null,
        vivaMarks: formMarks.vivaMarks !== '' ? parseFloat(formMarks.vivaMarks) : null,
        makeupMarks: formMarks.makeupMarks !== '' ? parseFloat(formMarks.makeupMarks) : null,
        remarks: formMarks.remarks,
      };

      if (editingResult) {
        await apiClient.put(`/results/${editingResult.id}`, payload);
        setSuccessMessage('Result marks updated successfully!');
      } else {
        // Automatically find enrollment matching studentId and courseOfferingId
        const matchStudent = students.find(s => s.id === Number(formMarks.studentId));
        if (!matchStudent) {
          throw new Error('Please select a valid registered student.');
        }
        
        // Find if we have an enrollment
        const enrolls = await apiClient.get(`/students/${formMarks.studentId}/enrollments`);
        const enrollmentList = Array.isArray(enrolls.data) ? enrolls.data : (enrolls.data.data || []);
        const targetEnroll = enrollmentList.find((e: any) => e.courseOfferingId === Number(formMarks.courseOfferingId));
        
        if (!targetEnroll) {
          throw new Error('This student is not enrolled in the selected course offering.');
        }

        const fullPayload = {
          ...payload,
          enrollmentId: targetEnroll.id,
          semesterId: targetEnroll.courseOffering?.semesterId || semesters[0]?.id || 1,
        };

        await apiClient.post('/results', fullPayload);
        setSuccessMessage('New result record created successfully.');
      }

      setIsEditModalOpen(false);
      fetchResultsList();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Validation error saving marks.');
    } finally {
      setActionLoading(false);
    }
  };

  // Print Transcript/Mark Sheet helper
  const handlePrint = () => {
    window.print();
  };

  // Colors for charts
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Filtered results list for Search Box
  const filteredResults = results.filter(r => {
    const studentName = (r.student?.fullName || `${r.student?.user?.firstName} ${r.student?.user?.lastName}`).toLowerCase();
    const rollNo = (r.student?.rollNumber || '').toLowerCase();
    const courseName = (r.courseOffering?.subject?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || rollNo.includes(query) || courseName.includes(query);
  });

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto" id="result-management-module-container">
      {/* Page Title & Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-slate-900">
              Result & Grading Management
            </h1>
            <p className="text-xs text-slate-500">
              Manage student term grades, automatic result aggregation, GPA/CGPA computation, and transcript card verification.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => openEditModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" /> Record Marks Manually
            </button>
          )}
          <button
            onClick={() => {
              if (activeTab === 'manage') fetchResultsList();
              if (activeTab === 'analytics') fetchResultAnalytics();
              if (activeTab === 'merit') fetchMeritListRecords();
              if (isStudent && currentStudentId) fetchStudentTranscript(currentStudentId);
            }}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 h-9 w-9 rounded-lg flex items-center justify-center transition-all shadow-xs"
            title="Refresh current ledger"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alert Banner / Messages */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg flex items-start gap-3 text-xs leading-normal shadow-xs">
          <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="font-bold hover:text-red-950">×</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-r-lg flex items-start gap-3 text-xs leading-normal shadow-xs">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="font-bold hover:text-emerald-950">×</button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto scrollbar-none">
        {!isStudent && (
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manage'
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
            }`}
          >
            <List className="h-4 w-4" /> Manage Student Marks
          </button>
        )}
        <button
          onClick={() => {
            setActiveTab('transcript');
            if (!isStudent && currentStudentId) {
              fetchStudentTranscript(currentStudentId);
            }
          }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'transcript'
              ? 'border-slate-900 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" /> Official Mark Sheet & Transcript
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-slate-900 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          <BarChart2 className="h-4 w-4" /> Performance Analytics
        </button>
        <button
          onClick={() => setActiveTab('merit')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'merit'
              ? 'border-slate-900 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Merit Board
        </button>
      </div>

      {/* Primary Filtering Panel (Visible to Admins / Teachers on manage, analytics, merit tabs) */}
      {!isStudent && activeTab !== 'transcript' && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-wrap md:flex-nowrap gap-3 items-center shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 pl-1 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Filters</span>
          </div>

          <div className="w-full md:w-52">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
            >
              <option value="">-- Select Semester --</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({typeof s.academicYear === 'object' ? (s.academicYear?.name || '') : s.academicYear})
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'manage' && (
            <>
              <div className="w-full md:w-60">
                <select
                  value={selectedCourseOffering}
                  onChange={(e) => setSelectedCourseOffering(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                >
                  <option value="">-- Select Course Offering --</option>
                  {courseOfferings.map(co => (
                    <option key={co.id} value={co.id}>
                      {co.subject?.name} - {co.subject?.code} ({co.section?.name || 'No Section'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                >
                  <option value="">-- Status Filter --</option>
                  <option value="Draft">Draft Only</option>
                  <option value="Approved">Approved Only</option>
                  <option value="Published">Published Only</option>
                </select>
              </div>

              <div className="relative w-full md:flex-1">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student name, roll number, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:border-slate-300 outline-none"
                />
              </div>

              {/* Automatic Batch Action for selected course offering */}
              {selectedCourseOffering && (
                <button
                  onClick={handleBatchProcess}
                  disabled={actionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 shadow-xs transition-all disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" /> Auto Process Grades
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================== VIEW 1: MANAGE STUDENT MARKS ==================== */}
      {activeTab === 'manage' && !isStudent && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Student Term Grades Ledger</h2>
              <p className="text-xs text-slate-500">Manual adjustments, calculation metrics, approval state, and publishing registry.</p>
            </div>
            {filteredResults.length > 0 && (
              <div className="text-xs font-mono text-slate-500 font-medium">
                Showing {filteredResults.length} records
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-600" />
              <span className="text-xs font-medium">Querying database...</span>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <Info className="h-10 w-10 text-slate-300" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-slate-700">No result records found</span>
                <p className="text-xs max-w-sm text-slate-500 leading-relaxed">
                  Select a Course Offering above and click <strong>Auto Process Grades</strong> to automatically aggregate assignment, quiz, and completed exam marks, or record marks manually.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">Student / Roll No.</th>
                    <th className="p-3">Course / Credits</th>
                    <th className="p-3 text-center">Marks Component Breakdown (Asg, Qz, Mid, Fin, Pract, Viva)</th>
                    <th className="p-3 text-center">Total / %</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-center">GPA / QP</th>
                    <th className="p-3 text-center">Workflow Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredResults.map(r => {
                    const fullName = r.student?.fullName || `${r.student?.user?.firstName} ${r.student?.user?.lastName}`;
                    const isDraft = r.approvalStatus === 'Draft';
                    const isApproved = r.approvalStatus === 'Approved';
                    const isPublished = r.approvalStatus === 'Published';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800">{fullName}</span>
                            <span className="font-mono text-[10px] text-slate-500">Roll: {r.student?.rollNumber || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-700">{r.courseOffering?.subject?.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Code: {r.courseOffering?.subject?.code} | CH: {r.creditHours}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                            <span className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100" title="Assignments (Max 10)">Asg:{r.assignmentMarks ?? '-'}</span>
                            <span className="bg-purple-50 text-purple-700 px-1 py-0.5 rounded border border-purple-100" title="Quizzes (Max 10)">Qz:{r.quizMarks ?? '-'}</span>
                            <span className="bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-100" title="Midterm (Max 30)">Mid:{r.midtermMarks ?? '-'}</span>
                            <span className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded border border-indigo-100" title="Final Exam (Max 50)">Fin:{r.finalExamMarks ?? '-'}</span>
                            {r.practicalMarks !== null && <span className="bg-teal-50 text-teal-700 px-1 py-0.5 rounded border border-teal-100" title="Practical (Max 10)">Pr:{r.practicalMarks}</span>}
                            {r.vivaMarks !== null && <span className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-100" title="Viva (Max 10)">Vv:{r.vivaMarks}</span>}
                            {r.makeupMarks !== null && <span className="bg-red-50 text-red-700 px-1 py-0.5 rounded border border-red-100" title="Makeup Marks (Replaces Final if better)">Mk:{r.makeupMarks}</span>}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{r.totalObtainedMarks} / 100</span>
                            <span className="text-[10px] text-slate-400 font-mono">{r.percentage}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            r.grade === 'A+' || r.grade === 'A'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : r.grade === 'F'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col font-mono text-[10px]">
                            <span className="font-bold text-slate-700">GP: {r.gradePoint.toFixed(2)}</span>
                            <span className="text-slate-400">QP: {r.qualityPoints.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-semibold ${
                            isDraft 
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : isApproved 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {r.approvalStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Actions for Draft Results */}
                            {isDraft && (
                              <button
                                onClick={() => handleApproveResult(r.id)}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-[10px] font-medium transition-all"
                                title="Approve marks validation"
                              >
                                Approve
                              </button>
                            )}

                            {/* Actions for Approved Results */}
                            {isApproved && isAdmin && (
                              <button
                                onClick={() => handlePublishResult(r.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-medium transition-all"
                                title="Publish result for student view"
                              >
                                Publish
                              </button>
                            )}

                            {/* GPA Calculations */}
                            {isPublished && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleCalculateGPA(r.studentId, r.semesterId)}
                                  className="border border-slate-200 hover:bg-slate-100 text-slate-700 px-1.5 py-1 rounded text-[9px] font-semibold transition-all"
                                  title="Recalculate Semester GPA & Rank"
                                >
                                  GPA
                                </button>
                                <button
                                  onClick={() => handleCalculateCGPA(r.studentId)}
                                  className="border border-slate-200 hover:bg-slate-100 text-slate-700 px-1.5 py-1 rounded text-[9px] font-semibold transition-all"
                                  title="Recalculate Cumulative CGPA"
                                >
                                  CGPA
                                </button>
                              </div>
                            )}

                            {/* Edit / Delete */}
                            <button
                              onClick={() => openEditModal(r)}
                              className="text-slate-500 hover:text-slate-800 p-1"
                              title="Modify component marks manually"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteResult(r.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete result record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 2: TRANSCRIPT & OFFICIAL MARK SHEET ==================== */}
      {activeTab === 'transcript' && (
        <div className="flex flex-col gap-6">
          {/* Student Selector (For Admins and Teachers) */}
          {!isStudent && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Select Student Profile</span>
                  <p className="text-[11px] text-slate-500">View and print standard semester cards, mark sheets, and cumulative academic records.</p>
                </div>
              </div>

              <div className="w-full md:w-80">
                <select
                  value={currentStudentId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setCurrentStudentId(id);
                    const prof = students.find(s => s.id === id);
                    setStudentProfile(prof || null);
                    if (id) fetchStudentTranscript(id);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                >
                  <option value="">-- Select Student Profile --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName || `${s.user?.firstName} ${s.user?.lastName}`} (Roll: {s.rollNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-600" />
              <span className="text-xs font-medium">Drafting official mark sheet card...</span>
            </div>
          ) : !transcriptData ? (
            <div className="p-16 text-center bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400">
              <FileText className="h-10 w-10 text-slate-300" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-slate-700">No student selected or records published</span>
                <p className="text-xs max-w-sm text-slate-500 leading-relaxed">
                  Please select a registered student profile to inspect their official university transcripts, grading breakdown, class rank, and GPA cards.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6" id="printable-transcript-area">
              {/* Controls */}
              <div className="flex justify-end gap-2 no-print">
                <button
                  onClick={handlePrint}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Printer className="h-4 w-4" /> Print or Save PDF
                </button>
              </div>

              {/* TRANSCRIPT CARD */}
              <div className="bg-white border-2 border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden font-sans">
                {/* Decorative university design borders */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900"></div>

                {/* Mark Sheet Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans uppercase">
                      SMART UNIVERSITY ERP
                    </h2>
                    <span className="text-[10px] font-bold font-mono tracking-widest text-slate-500 uppercase">
                      OFFICIAL SEMESTER GRADE CARD & ACADEMIC TRANSCRIPT
                    </span>
                  </div>
                  
                  {/* QR Code Validation Container */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] font-bold text-slate-800">SECURE VERIFICATION</span>
                      <p className="text-[8px] text-slate-500 max-w-32 leading-tight">Scan this digital validation token to verify authenticity against ERP ledger.</p>
                    </div>
                    {/* Visual QR Code placeholder with university design */}
                    <div className="h-12 w-12 bg-white border border-slate-300 p-1 rounded flex items-center justify-center font-mono text-[6px] shrink-0 font-bold relative">
                      <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-80">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className={`rounded-[1px] ${i % 3 === 0 || i % 5 === 2 ? 'bg-slate-950' : 'bg-transparent'}`}></div>
                        ))}
                      </div>
                      <div className="absolute inset-0 m-auto h-3 w-3 bg-white border border-slate-900 flex items-center justify-center text-[5px] text-slate-900 font-extrabold">U</div>
                    </div>
                  </div>
                </div>

                {/* Student Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Student Name:</span>
                    <p className="font-bold text-slate-800">{transcriptData.student?.fullName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Roll Number:</span>
                    <p className="font-mono font-bold text-slate-800">{transcriptData.student?.rollNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Registration No:</span>
                    <p className="font-mono font-bold text-slate-800">{transcriptData.student?.registrationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Academic Program:</span>
                    <p className="font-bold text-slate-800">{typeof transcriptData.student?.program === 'object' ? transcriptData.student?.program?.name : transcriptData.student?.program}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Department:</span>
                    <p className="font-bold text-slate-800">{typeof transcriptData.student?.department === 'object' ? transcriptData.student?.department?.name : transcriptData.student?.department}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Graduation Status:</span>
                    <p className="font-bold text-amber-600 font-mono">{transcriptData.cumulative?.graduationStatus || 'In Progress'}</p>
                  </div>
                </div>

                {/* Semesters Cards Ledger list */}
                <div className="flex flex-col gap-6">
                  {transcriptData.semesters.map((sem: any) => (
                    <div key={sem.id} className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-slate-900 text-white p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider">{sem.semesterName}</span>
                        <div className="flex gap-4 font-mono text-[11px]">
                          <span>Credits Registered: <strong>{sem.totalCreditHours}</strong></span>
                          <span>Credits Earned: <strong>{sem.earnedCreditHours}</strong></span>
                          <span>Term GPA: <strong className="text-amber-400">{sem.semesterGPA.toFixed(2)}</strong></span>
                          <span>Class Rank: <strong>#{sem.classRank}</strong></span>
                        </div>
                      </div>

                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                            <th className="p-3">Course Code</th>
                            <th className="p-3">Course Title</th>
                            <th className="p-3 text-center">Credit Hours</th>
                            <th className="p-3 text-center">Obtained Marks (100)</th>
                            <th className="p-3 text-center">Letter Grade</th>
                            <th className="p-3 text-center">Grade Point</th>
                            <th className="p-3 text-center">Quality Points</th>
                            <th className="p-3 text-right">Pass Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sem.courses.map((course: any) => (
                            <tr key={course.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-800">{course.courseCode}</td>
                              <td className="p-3 font-medium text-slate-700">{course.courseName}</td>
                              <td className="p-3 text-center font-mono">{course.creditHours}</td>
                              <td className="p-3 text-center font-mono">{course.obtainedMarks}</td>
                              <td className="p-3 text-center font-bold">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  course.grade === 'F' ? 'text-red-600 bg-red-50' : 'text-slate-800 bg-slate-50'
                                }`}>
                                  {course.grade}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono">{course.gradePoint.toFixed(2)}</td>
                              <td className="p-3 text-center font-mono">{course.qualityPoints.toFixed(2)}</td>
                              <td className="p-3 text-right font-semibold">
                                <span className={course.passStatus === 'Pass' ? 'text-emerald-600' : 'text-red-600'}>
                                  {course.passStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* Cumulative Ledger Footer Block */}
                {transcriptData.cumulative && (
                  <div className="mt-4 border-2 border-slate-800 bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold border border-slate-700">
                        ∑
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-semibold">CUMULATIVE SUMMARY</span>
                        <p className="text-[11px] text-slate-400">Total metrics aggregated across all active completed semesters.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center font-mono text-sm">
                      <div className="flex flex-col border-r border-slate-800 pr-6">
                        <span className="text-[10px] text-slate-400 uppercase">Total Credits</span>
                        <p className="text-base font-extrabold">{transcriptData.cumulative.totalCreditHours}</p>
                      </div>
                      <div className="flex flex-col border-r border-slate-800 pr-6">
                        <span className="text-[10px] text-slate-400 uppercase">Earned Credits</span>
                        <p className="text-base font-extrabold text-emerald-400">{transcriptData.cumulative.earnedCreditHours}</p>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase">Cumulative CGPA</span>
                        <p className="text-base font-extrabold text-amber-400">{transcriptData.cumulative.cgpa.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 3: PERFORMANCE ANALYTICS ==================== */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-600" />
              <span className="text-xs font-medium">Aggregating grading distributions...</span>
            </div>
          ) : !analytics ? (
            <div className="p-16 text-center bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400">
              <BarChart2 className="h-10 w-10 text-slate-300" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-slate-700">No analytical data compiled</span>
                <p className="text-xs max-w-sm text-slate-500">Select a semester above to compile grade distributions and department stats.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary Metrics */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Graded Results</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{analytics.totalResults}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Passed Students</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{analytics.passedCount}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Failed Students</span>
                  <p className="text-2xl font-bold text-red-600 mt-1">{analytics.failedCount}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Overall Pass Percentage</span>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{analytics.passPercentage}%</p>
                </div>
              </div>

              {/* Chart 1: Grade Distribution */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Letter Grade Distribution</h3>
                  <p className="text-[11px] text-slate-500">Letter grades awarded across all processed courses.</p>
                </div>
                <div className="h-64">
                  {analytics.gradeDistribution?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.gradeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="grade" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1e293b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No data points.</div>
                  )}
                </div>
              </div>

              {/* Chart 2: GPA Range Distribution */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semester GPA Distribution</h3>
                  <p className="text-[11px] text-slate-500">Number of students categorized by semester GPA intervals.</p>
                </div>
                <div className="h-64">
                  {analytics.gpaDistribution?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.gpaDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No data points.</div>
                  )}
                </div>
              </div>

              {/* Chart 3: Department average GPA */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col gap-4 lg:col-span-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departmental Academic Performance</h3>
                  <p className="text-[11px] text-slate-500">Average semester GPAs scored by students across departments.</p>
                </div>
                <div className="h-64">
                  {analytics.departmentPerformance?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.departmentPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 4]} />
                        <YAxis dataKey="department" type="category" width={150} />
                        <Tooltip />
                        <Bar dataKey="averageGPA" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No data points.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 4: MERIT BOARD ==================== */}
      {activeTab === 'merit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Merit List & Class Standings</h2>
              <p className="text-xs text-slate-500">Top performing university scholars ranked by term GPA or cumulative CGPA.</p>
            </div>
            {meritList.length > 0 && (
              <div className="text-xs font-mono font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                ★ Academic Honor Roll
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-600" />
              <span className="text-xs font-medium">Re-indexing standings...</span>
            </div>
          ) : meritList.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <TrendingUp className="h-10 w-10 text-slate-300" />
              <span className="text-sm font-bold text-slate-700">No standings generated</span>
              <p className="text-xs text-slate-500 max-w-sm">
                Standing indices are calculated during the GPA calculation cycle. Publish results and calculate GPAs first.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">Honor Standing</th>
                    <th className="p-3">Student Full Name</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3">Program & Department</th>
                    <th className="p-3 text-center">Semester Credits Registered</th>
                    <th className="p-3 text-center">Earned Credits</th>
                    <th className="p-3 text-right">Academic GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {meritList.map((m, idx) => {
                    const fullName = m.student?.fullName || `${m.student?.user?.firstName} ${m.student?.user?.lastName}`;
                    const isTopThree = idx < 3;
                    const rankBadge = isTopThree 
                      ? ['🥇 First Place', '🥈 Second Place', '🥉 Third Place'][idx]
                      : `#${idx + 1}`;

                    return (
                      <tr key={m.id} className={`${isTopThree ? 'bg-amber-50/20' : ''} hover:bg-slate-50/50 transition-colors`}>
                        <td className="p-3 font-semibold text-slate-800">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            idx === 0 
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : idx === 1 
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : idx === 2 
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'text-slate-600'
                          }`}>
                            {rankBadge}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{fullName}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{m.student?.rollNumber}</td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{m.student?.program?.name}</span>
                            <span className="text-[10px] text-slate-400">{m.student?.department?.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono">{m.totalCreditHours}</td>
                        <td className="p-3 text-center font-mono text-emerald-600">{m.earnedCreditHours}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-950">
                          {m.semesterGPA !== undefined ? m.semesterGPA.toFixed(2) : m.cgpa?.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== MANUAL RECORD/EDIT MARKS MODAL ==================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editingResult ? 'Modify Student Component Marks' : 'Record Student Marks Manually'}
                </h3>
                <p className="text-[11px] text-slate-500">Calculate totals, letter grades and pass status inside constraints dynamically.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-5 flex flex-col gap-4 text-xs">
              {!editingResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Select Student</label>
                    <select
                      required
                      value={formMarks.studentId}
                      onChange={(e) => setFormMarks({ ...formMarks, studentId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    >
                      <option value="">-- Select Student --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName || `${s.user?.firstName} ${s.user?.lastName}`} (Roll: {s.rollNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Course Offering</label>
                    <select
                      required
                      value={formMarks.courseOfferingId}
                      onChange={(e) => setFormMarks({ ...formMarks, courseOfferingId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    >
                      <option value="">-- Select Course Offering --</option>
                      {courseOfferings.map(co => (
                        <option key={co.id} value={co.id}>
                          {co.subject?.name} - {co.subject?.code} ({co.section?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Marks Components Breakdown Fields */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wide text-[10px]">Component Marks Entry</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Assignments (Max 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formMarks.assignmentMarks}
                      onChange={(e) => setFormMarks({ ...formMarks, assignmentMarks: e.target.value })}
                      placeholder="e.g. 8.5"
                      className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Quizzes (Max 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formMarks.quizMarks}
                      onChange={(e) => setFormMarks({ ...formMarks, quizMarks: e.target.value })}
                      placeholder="e.g. 7.0"
                      className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Midterm (Max 30)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="30"
                      value={formMarks.midtermMarks}
                      onChange={(e) => setFormMarks({ ...formMarks, midtermMarks: e.target.value })}
                      placeholder="e.g. 24.5"
                      className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Final Exam (Max 50)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      value={formMarks.finalExamMarks}
                      onChange={(e) => setFormMarks({ ...formMarks, finalExamMarks: e.target.value })}
                      placeholder="e.g. 39.0"
                      className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Practical (Max 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formMarks.practicalMarks}
                      onChange={(e) => setFormMarks({ ...formMarks, practicalMarks: e.target.value })}
                      placeholder="e.g. 8.5"
                      className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Viva Voce (Max 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formMarks.vivaMarks}
                      onChange={(e) => setFormMarks({ ...formMarks, vivaMarks: e.target.value })}
                      placeholder="e.g. 9.0"
                      className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="font-semibold text-slate-700">Makeup Marks (Max 50, replaces Final if better)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      value={formMarks.makeupMarks}
                      onChange={(e) => setFormMarks({ ...formMarks, makeupMarks: e.target.value })}
                      placeholder="e.g. 42.0"
                      className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={formMarks.academicYear}
                    onChange={(e) => setFormMarks({ ...formMarks, academicYear: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Session</label>
                  <select
                    required
                    value={formMarks.session}
                    onChange={(e) => setFormMarks({ ...formMarks, session: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                  >
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Remarks / Notes</label>
                  <input
                    type="text"
                    value={formMarks.remarks}
                    onChange={(e) => setFormMarks({ ...formMarks, remarks: e.target.value })}
                    placeholder="e.g. Excellent work"
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-slate-500 leading-normal">
                <Info className="h-4 w-4 text-slate-700 mt-0.5 shrink-0" />
                <p className="text-[10px]">
                  All marks entered are non-negative and bounded inside respective standard max bounds. ERP calculation engines will automatically compute Letter Grade and Pass Status.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-lg font-semibold tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold tracking-wide disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Result Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDashboardPage;
