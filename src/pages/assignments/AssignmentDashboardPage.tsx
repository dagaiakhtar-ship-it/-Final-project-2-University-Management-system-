import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { useAuth } from '../../providers/AuthProvider';
import { Assignment, Submission, AssignmentAnalytics } from './types';
import { CreateAssignmentForm } from './CreateAssignmentForm';
import { GradeSubmissionForm } from './GradeSubmissionForm';
import { AssignmentAnalyticsView } from './AssignmentAnalyticsView';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import {
  FileText,
  Calendar,
  Clock,
  User,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  SlidersHorizontal,
  Eye,
  Award,
  BookOpen,
  Sparkles,
  BarChart2,
  RotateCcw,
  Upload,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const AssignmentDashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';

  // State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Active views / Modals
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions' | 'analytics'>('assignments');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | undefined>(undefined);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AssignmentAnalytics | null>(null);

  // Student submission form state
  const [submitText, setSubmitText] = useState('');
  const [submitAttachment, setSubmitAttachment] = useState('');
  const [isSubmitDraft, setIsSubmitDraft] = useState(false);

  // Fetch data
  const loadAssignments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
        search: search || undefined,
        assignmentType: typeFilter || undefined,
        visibilityStatus: isStudent ? 'Published' : (statusFilter || undefined),
      };

      const res = await apiClient.get('/assignments', { params });
      if (res.data?.success) {
        setAssignments(res.data.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      toast.error('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!isTeacher && !isAdmin) return;
    try {
      setLoading(true);
      const res = await apiClient.get('/assignments/1/submissions-list', {
        params: { limit: 100 }, // Fetch all active recent attempts
      });
      if (res.data?.success) {
        setSubmissions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentSubmissionsForSelected = async (assignmentId: number) => {
    if (!isStudent) return;
    try {
      const studentProfileRes = await apiClient.get(`/users/${user?.id}/student-profile`);
      const studentId = studentProfileRes.data?.data?.id;
      if (studentId) {
        const res = await apiClient.get('/assignments/1/submissions-list', {
          params: { assignmentId, studentId },
        });
        if (res.data?.success || res.data?.data) {
          setSubmissions(res.data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load student attempts:', err);
    }
  };

  useEffect(() => {
    loadAssignments();
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [currentPage, search, typeFilter, statusFilter, activeTab]);

  // Realtime Socket Integrations
  useEffect(() => {
    const socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      console.log('Assignments real-time listener online.');
      // Join general channels based on role
      if (isStudent && user) {
        socket.emit('join', `student:${user.id}`);
      } else if (isTeacher && user) {
        socket.emit('join', `teacher:${user.id}`);
      }
    });

    socket.on('assignment:notification', (notification: any) => {
      toast((t) => (
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500 animate-bounce" />
          <div>
            <p className="font-bold text-xs text-gray-800">{notification.title}</p>
            <p className="text-[10px] text-gray-500">{notification.message}</p>
          </div>
        </span>
      ), { duration: 5000 });
      // Refresh current records
      loadAssignments();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, role]);

  const handleCreateSuccess = () => {
    loadAssignments();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete/archive this assignment? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/assignments/${id}`);
      toast.success('Assignment deleted successfully.');
      loadAssignments();
    } catch (err) {
      toast.error('Failed to delete assignment.');
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await apiClient.patch(`/assignments/${id}/publish`);
      toast.success('Assignment successfully published to students.');
      loadAssignments();
    } catch (err) {
      toast.error('Failed to publish assignment.');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await apiClient.patch(`/assignments/${id}/archive`);
      toast.success('Assignment successfully archived.');
      loadAssignments();
    } catch (err) {
      toast.error('Failed to archive assignment.');
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!submitAttachment) {
      toast.error('Please provide a file URL or reference link for your attachment.');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(`/assignments/${selectedAssignment.id}/submissions`, {
        attachments: submitAttachment,
        isDraft: isSubmitDraft,
      });

      toast.success(isSubmitDraft ? 'Draft saved successfully!' : 'Assignment submitted successfully!');
      setSubmitAttachment('');
      setSubmitText('');
      loadStudentSubmissionsForSelected(selectedAssignment.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit assignment.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (asgId: number) => {
    try {
      const res = await apiClient.get(`/assignments/${asgId}/analytics`);
      if (res.data?.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load analytics.');
    }
  };

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 opacity-10">
          <BookOpen className="h-64 w-64 rotate-12 transform" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> LMS & Assignments Hub
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">University Learning Suite</h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Evaluate, track, and secure academic progression bounds under real-time feedback and evaluation metrics.
          </p>
        </div>
      </div>

      {/* 2. Top-Level Custom Navigation Tab Controls */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => {
            setActiveTab('assignments');
            setSelectedAssignment(null);
            setSelectedSubmission(null);
          }}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'assignments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Active Tasks & Assignments
        </button>

        {(isTeacher || isAdmin) && (
          <button
            onClick={() => {
              setActiveTab('submissions');
              setSelectedAssignment(null);
              setSelectedSubmission(null);
            }}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'submissions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Grade Center
          </button>
        )}
      </div>

      {/* 3. Primary Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Dynamic Workspace Lists */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'assignments' && !selectedAssignment && (
            <Card className="p-6">
              {/* Filter Row */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                <div className="relative w-full md:w-72">
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
                  >
                    <option value="">All Types</option>
                    <option value="Individual">Individual</option>
                    <option value="Project">Project</option>
                    <option value="Group">Group</option>
                    <option value="Laboratory">Laboratory</option>
                  </select>

                  {!isStudent && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
                    >
                      <option value="">All Visibilities</option>
                      <option value="Draft">Drafts</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  )}

                  {(isTeacher || isAdmin) && (
                    <Button
                      onClick={() => {
                        setEditingAssignmentId(undefined);
                        setShowCreateForm(true);
                      }}
                      className="rounded-xl flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      <Plus className="h-4 w-4" /> Create
                    </Button>
                  )}
                </div>
              </div>

              {/* Assignments List */}
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading assignments...</div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-200 mb-2" />
                  <p>No academic tasks found matching the criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.map((asg) => (
                    <div
                      key={asg.id}
                      onClick={() => {
                        setSelectedAssignment(asg);
                        loadStudentSubmissionsForSelected(asg.id);
                        fetchAnalytics(asg.id);
                      }}
                      className="p-5 border border-gray-100 hover:border-indigo-200 bg-white rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 relative group overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                      
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">
                          {asg.assignmentCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          asg.visibilityStatus === 'Published'
                            ? 'bg-emerald-50 text-emerald-600'
                            : asg.visibilityStatus === 'Draft'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {asg.visibilityStatus}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-800 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {asg.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[2rem]">
                        {asg.description || 'No description provided.'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2 text-[11px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-gray-300" /> Max Marks: {asg.totalMarks}
                        </span>
                        <span className="flex items-center gap-1 text-rose-500 font-bold">
                          <Clock className="h-3.5 w-3.5" /> Due: {new Date(asg.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Submissions Grade Center List */}
          {activeTab === 'submissions' && (
            <Card className="p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">Awaiting Evaluation</h2>
              {loading ? (
                <div className="text-center py-12 text-gray-400">Syncing Grade Center...</div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">All submissions are fully evaluated!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-400">
                        <th className="pb-3">Student</th>
                        <th className="pb-3">Assignment</th>
                        <th className="pb-3">Submitted At</th>
                        <th className="pb-3">Plagiarism</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 font-bold text-gray-700">
                            {sub.student?.fullName || 'Student'}
                            <span className="block text-[10px] text-gray-400 font-normal">
                              {sub.student?.registrationNumber}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-gray-600">
                            {sub.assignment?.title}
                          </td>
                          <td className="py-3 text-xs text-gray-400">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                          <td className="py-3 text-xs">
                            <span className={`font-bold ${
                              (sub.plagiarismScore || 0) > 15 ? 'text-rose-500' : 'text-emerald-500'
                            }`}>
                              {sub.plagiarismScore || 0}%
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              sub.submissionStatus === 'Late'
                                ? 'bg-rose-50 text-rose-600'
                                : sub.submissionStatus === 'Graded'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                              {sub.submissionStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              onClick={() => setGradingSubmission(sub)}
                              size="sm"
                              className="rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold border-none"
                            >
                              Grade
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Selected Assignment Details & Submission Panel */}
          {selectedAssignment && (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors mb-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </button>

              <Card className="p-6 space-y-4">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {selectedAssignment.assignmentCode}
                    </span>
                    <h2 className="text-xl font-bold text-gray-800 mt-2">{selectedAssignment.title}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Type: {selectedAssignment.assignmentType}</p>
                  </div>

                  {!isStudent && (
                    <div className="flex gap-1.5">
                      {selectedAssignment.visibilityStatus === 'Draft' && (
                        <Button
                          onClick={() => handlePublish(selectedAssignment.id)}
                          size="sm"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border-none font-bold"
                        >
                          Publish
                        </Button>
                      )}
                      {selectedAssignment.visibilityStatus === 'Published' && (
                        <Button
                          onClick={() => handleArchive(selectedAssignment.id)}
                          size="sm"
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border-none font-bold"
                        >
                          Archive
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setEditingAssignmentId(selectedAssignment.id);
                          setShowCreateForm(true);
                        }}
                        size="sm"
                        className="bg-gray-150 hover:bg-gray-200 text-gray-600 rounded-lg border-none font-bold"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(selectedAssignment.id)}
                        size="sm"
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border-none font-bold"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Assignment Description */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                    Task Context & Details
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {selectedAssignment.description || 'No detailed context described.'}
                  </p>
                </div>

                {selectedAssignment.instructions && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                      Submission Guidelines
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed bg-amber-50/40 p-4 rounded-2xl border border-amber-100/60">
                      {selectedAssignment.instructions}
                    </p>
                  </div>
                )}

                {selectedAssignment.attachments && (
                  <div className="flex items-center gap-2 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/60">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-indigo-700">Reference Materials</span>
                      <a
                        href={selectedAssignment.attachments}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-500 truncate block hover:underline"
                      >
                        {selectedAssignment.attachments}
                      </a>
                    </div>
                    <ExternalLink className="h-4 w-4 text-indigo-400" />
                  </div>
                )}

                {/* Bounds Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Marks</span>
                    <span className="text-lg font-bold text-gray-800">{selectedAssignment.totalMarks}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Passing Threshold</span>
                    <span className="text-lg font-bold text-gray-800">{selectedAssignment.passingMarks}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Max Attempts</span>
                    <span className="text-lg font-bold text-gray-800">{selectedAssignment.maxAttempts}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Late Submission</span>
                    <span className="text-lg font-bold text-gray-800">
                      {selectedAssignment.allowLateSubmission
                        ? `${selectedAssignment.latePenaltyPercentage}% penalty`
                        : 'Forbidden'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Student Action: Upload Submissions Area */}
              {isStudent && (
                <Card className="p-6 space-y-4">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-indigo-500 animate-bounce" /> Submit Your Work
                  </h3>

                  <form onSubmit={handleStudentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Attached Submission URL *
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://github.com/my-repo/project-thesis"
                        value={submitAttachment}
                        onChange={(e) => setSubmitAttachment(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-gray-50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Optional Submission Text
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Provide any additional summary or notes for the evaluator..."
                        value={submitText}
                        onChange={(e) => setSubmitText(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-gray-50"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        onClick={() => setIsSubmitDraft(true)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all text-center"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="submit"
                        onClick={() => setIsSubmitDraft(false)}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all text-center"
                      >
                        Final Submit
                      </button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Student Submission Attempt List */}
              {isStudent && submissions.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    My Submission History
                  </h3>
                  <div className="space-y-4">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 border border-gray-100 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-700">Attempt #{sub.submissionNumber}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              sub.submissionStatus === 'Graded'
                                ? 'bg-emerald-50 text-emerald-600'
                                : sub.submissionStatus === 'Draft'
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                              {sub.submissionStatus}
                            </span>
                          </div>
                          <span className="block text-[10px] text-gray-400 mt-1">
                            Submitted: {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        </div>

                        {sub.submissionStatus === 'Graded' ? (
                          <div className="bg-indigo-50 border border-indigo-100/60 p-3 rounded-xl flex items-center gap-4 text-indigo-700 text-sm">
                            <div>
                              <span className="block text-[9px] font-bold uppercase text-gray-400">Awarded Marks</span>
                              <span className="font-extrabold text-base">
                                {sub.obtainedMarks} <span className="text-xs font-normal text-gray-400">/ {selectedAssignment.totalMarks}</span>
                              </span>
                            </div>
                            <div>
                              <span className="block text-[9px] font-bold uppercase text-gray-400">Grade</span>
                              <span className="font-extrabold text-base">{sub.grade}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Awaiting teacher evaluation</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Analytics tab inside details view */}
              {!isStudent && analyticsData && (
                <Card className="p-6">
                  <h3 className="text-base font-bold text-gray-800 mb-4">Metrics Visualizer</h3>
                  <AssignmentAnalyticsView analytics={analyticsData} />
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Bento Academic Info Rail */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2">
              System Context
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Active Role</span>
                  <span className="text-sm font-bold text-gray-700">{role || 'GUEST'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Academic Bound</span>
                  <span className="text-sm font-bold text-gray-700">Enterprise LMS V2</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                <span>
                  All academic grading processes, late submissions, and credentials are fully tracked. Plagiarism scores are automatically updated upon final submission.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Overlay Modal: Create/Edit Assignment */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CreateAssignmentForm
            assignmentId={editingAssignmentId}
            onClose={() => {
              setShowCreateForm(false);
              setEditingAssignmentId(undefined);
            }}
            onSuccess={handleCreateSuccess}
          />
        </div>
      )}

      {/* 5. Overlay Modal: Teacher Grading */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GradeSubmissionForm
            submission={gradingSubmission}
            onClose={() => setGradingSubmission(null)}
            onSuccess={() => {
              loadSubmissions();
              if (selectedAssignment) {
                fetchAnalytics(selectedAssignment.id);
              }
            }}
          />
        </div>
      )}
    </PageContainer>
  );
};
export default AssignmentDashboardPage;
