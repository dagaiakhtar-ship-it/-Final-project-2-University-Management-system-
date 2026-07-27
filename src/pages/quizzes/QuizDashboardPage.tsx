import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { useAuth } from '../../providers/AuthProvider';
import { Quiz, QuizSubmission, QuestionBank } from './types';
import { QuizAttemptPage } from './QuizAttemptPage';
import { QuizAnalyticsView } from './QuizAnalyticsView';
import { QuestionBankView } from './QuestionBankView';
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
  PlusCircle,
  Trash2,
  Settings,
  HelpCircle,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';

export const QuizDashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';

  // Core List states
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [offeringFilter, setOfferingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Course Offerings for creators
  const [offerings, setOfferings] = useState<any[]>([]);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'quizzes' | 'question_bank' | 'submissions' | 'analytics'>('quizzes');

  // Interactive Active View states
  const [activeAttemptQuiz, setActiveAttemptQuiz] = useState<Quiz | null>(null);
  const [activeAttemptSubmission, setActiveAttemptSubmission] = useState<QuizSubmission | null>(null);
  const [activeAttemptQuestions, setActiveAttemptQuestions] = useState<QuestionBank[]>([]);

  // View Past Submission Details
  const [viewingPastSubmission, setViewingPastSubmission] = useState<QuizSubmission | null>(null);

  // Forms states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);

  // Question selection states for Quiz Form
  const [availableQuestions, setAvailableQuestions] = useState<QuestionBank[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    courseOfferingId: '',
    totalMarks: '10',
    passingMarks: '5',
    durationMinutes: '30',
    availableFrom: '',
    availableUntil: '',
    maximumAttempts: '1',
    shuffleQuestions: false,
    shuffleOptions: false,
    negativeMarkingEnabled: false,
    negativeMarksPerQuestion: '0',
    showResultImmediately: true,
    showCorrectAnswers: true,
    visibilityStatus: 'Draft' as 'Draft' | 'Published',
  });

  // Fetch Course Offerings
  const loadOfferings = async () => {
    try {
      const res = await apiClient.get('/course-offerings');
      if (res.data?.success) {
        setOfferings(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Quizzes List
  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: search || undefined,
        courseOfferingId: offeringFilter || undefined,
        visibilityStatus: isStudent ? 'Published' : (statusFilter || undefined),
      };
      const res = await apiClient.get('/quizzes', { params });
      if (res.data?.success) {
        setQuizzes(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Submissions List (For teachers/admins or student past list)
  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/quizzes/submissions/list');
      if (res.data?.success) {
        setSubmissions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load quiz attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferings();
    loadQuizzes();
    loadSubmissions();
  }, [search, offeringFilter, statusFilter]);

  // Real-time socket listener for quiz alerts
  useEffect(() => {
    const socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      console.log('Quiz visual panel synced with notification hub.');
      if (user) {
        if (isStudent) socket.emit('join', `student:${user.id}`);
        else if (isTeacher) socket.emit('join', `teacher:${user.id}`);
      }
    });

    socket.on('quiz:notification', (notification: any) => {
      toast((t) => (
        <span className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
          <span className="text-xs font-semibold text-gray-800">
            {notification.title}: {notification.message}
          </span>
        </span>
      ), { duration: 6000 });

      // Live reload lists
      loadQuizzes();
      loadSubmissions();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Handle Question Loading when selecting offering in Form
  useEffect(() => {
    const loadQuestionsForForm = async () => {
      if (!formData.courseOfferingId) {
        setAvailableQuestions([]);
        return;
      }
      try {
        const res = await apiClient.get('/quizzes/questions', {
          params: { courseOfferingId: formData.courseOfferingId },
        });
        if (res.data?.success) {
          setAvailableQuestions(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadQuestionsForForm();
  }, [formData.courseOfferingId]);

  // Actions for Quizzes
  const handleCreateOrUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseOfferingId) {
      toast.error('Please select a course offering.');
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast.error('Please assign at least one question from the bank to this quiz.');
      return;
    }

    const payload = {
      ...formData,
      questionIds: selectedQuestionIds,
    };

    try {
      if (editingQuizId) {
        const res = await apiClient.put(`/quizzes/${editingQuizId}`, payload);
        if (res.data?.success) {
          toast.success('Quiz updated successfully!');
          resetForm();
          loadQuizzes();
        }
      } else {
        const res = await apiClient.post('/quizzes', payload);
        if (res.data?.success) {
          toast.success('Quiz created successfully!');
          resetForm();
          loadQuizzes();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save quiz.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      courseOfferingId: '',
      totalMarks: '10',
      passingMarks: '5',
      durationMinutes: '30',
      availableFrom: '',
      availableUntil: '',
      maximumAttempts: '1',
      shuffleQuestions: false,
      shuffleOptions: false,
      negativeMarkingEnabled: false,
      negativeMarksPerQuestion: '0',
      showResultImmediately: true,
      showCorrectAnswers: true,
      visibilityStatus: 'Draft',
    });
    setSelectedQuestionIds([]);
    setEditingQuizId(null);
    setShowCreateForm(false);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuizId(quiz.id);
    setFormData({
      title: quiz.title,
      description: quiz.description || '',
      instructions: quiz.instructions || '',
      courseOfferingId: String(quiz.courseOfferingId),
      totalMarks: String(quiz.totalMarks),
      passingMarks: String(quiz.passingMarks),
      durationMinutes: String(quiz.durationMinutes),
      availableFrom: new Date(quiz.availableFrom).toISOString().slice(0, 16),
      availableUntil: new Date(quiz.availableUntil).toISOString().slice(0, 16),
      maximumAttempts: String(quiz.maximumAttempts),
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions,
      negativeMarkingEnabled: quiz.negativeMarkingEnabled,
      negativeMarksPerQuestion: String(quiz.negativeMarksPerQuestion),
      showResultImmediately: quiz.showResultImmediately,
      showCorrectAnswers: quiz.showCorrectAnswers,
      visibilityStatus: quiz.visibilityStatus === 'Draft' ? 'Draft' : 'Published',
    });

    if (quiz.questions) {
      setSelectedQuestionIds(quiz.questions.map((q) => q.id));
    }
    setShowCreateForm(true);
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const res = await apiClient.delete(`/quizzes/${id}`);
      if (res.data?.success) {
        toast.success('Quiz soft-deleted successfully.');
        loadQuizzes();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete quiz.');
    }
  };

  const handlePublishQuiz = async (id: number) => {
    try {
      const res = await apiClient.patch(`/quizzes/${id}/publish`);
      if (res.data?.success) {
        toast.success('Quiz published successfully! Students can now start attempting it.');
        loadQuizzes();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish.');
    }
  };

  const handleArchiveQuiz = async (id: number) => {
    try {
      const res = await apiClient.patch(`/quizzes/${id}/archive`);
      if (res.data?.success) {
        toast.success('Quiz successfully archived.');
        loadQuizzes();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  // Student Attempt Actions
  const handleStartQuizAttempt = async (quizId: number) => {
    if (!window.confirm('Do you want to start attempting this quiz? The timer will begin immediately.')) return;
    try {
      const res = await apiClient.post(`/quizzes/${quizId}/start`);
      if (res.data?.success) {
        const { submission, questions } = res.data.data;
        // Find quiz details
        const quizDetail = quizzes.find((q) => q.id === quizId);
        if (quizDetail) {
          setActiveAttemptQuiz(quizDetail);
          setActiveAttemptSubmission(submission);
          setActiveAttemptQuestions(questions);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start quiz.');
    }
  };

  const handleReviewSubmission = async (sub: QuizSubmission) => {
    try {
      const res = await apiClient.get(`/quizzes/submissions/${sub.id}`);
      if (res.data?.success) {
        setViewingPastSubmission(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load past attempt details.');
    }
  };

  const toggleQuestionSelection = (qid: number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qid) ? prev.filter((id) => id !== qid) : [...prev, qid]
    );
  };

  // Render Quiz Taking screen
  if (activeAttemptQuiz && activeAttemptSubmission && activeAttemptQuestions.length > 0) {
    return (
      <PageContainer title={`Attempting: ${activeAttemptQuiz.title}`}>
        <QuizAttemptPage
          quiz={activeAttemptQuiz}
          initialSubmission={activeAttemptSubmission}
          initialQuestions={activeAttemptQuestions}
          onBack={() => {
            setActiveAttemptQuiz(null);
            setActiveAttemptSubmission(null);
            setActiveAttemptQuestions([]);
            loadQuizzes();
            loadSubmissions();
          }}
          onFinish={(finalSub) => {
            setActiveAttemptQuiz(null);
            setActiveAttemptSubmission(null);
            setActiveAttemptQuestions([]);
            loadQuizzes();
            loadSubmissions();
            // Show result screen
            setViewingPastSubmission(finalSub);
          }}
        />
      </PageContainer>
    );
  }

  // Render Past Attempt Review
  if (viewingPastSubmission) {
    const qz = viewingPastSubmission.quiz;
    const pastAnswers = viewingPastSubmission.answers || {};

    return (
      <PageContainer title={`Attempt Review: ${qz?.title || 'Quiz'}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setViewingPastSubmission(null)} className="flex items-center space-x-1">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-semibold text-gray-500">Score Obtained:</span>
              <span className="font-bold text-indigo-600">
                {viewingPastSubmission.obtainedMarks} / {qz?.totalMarks} ({viewingPastSubmission.percentage}%)
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                viewingPastSubmission.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                Grade {viewingPastSubmission.grade}
              </span>
            </div>
          </div>

          <Card className="p-6 border border-gray-100 bg-white">
            <h3 className="text-base font-bold text-gray-900 mb-2">Quiz Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-3">
              <div>
                <p className="text-gray-400 font-medium">Attempt Number</p>
                <p className="text-gray-900 font-semibold text-sm mt-0.5">#{viewingPastSubmission.attemptNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Time Taken</p>
                <p className="text-gray-900 font-semibold text-sm mt-0.5">
                  {Math.floor((viewingPastSubmission.timeTaken || 0) / 60)}m {(viewingPastSubmission.timeTaken || 0) % 60}s
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Status</p>
                <p className="text-gray-900 font-semibold text-sm mt-0.5 uppercase tracking-wide">{viewingPastSubmission.submissionStatus}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Passing Score</p>
                <p className="text-gray-900 font-semibold text-sm mt-0.5">{qz?.passingMarks} Marks</p>
              </div>
            </div>
          </Card>

          {qz?.showCorrectAnswers ? (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-900">Question by Question Review</h3>
              {qz.questions?.map((q, qidx) => {
                const answer = pastAnswers[q.id];
                const isMulti = q.questionType === 'MultipleSelect';

                return (
                  <Card key={q.id} className="p-5 border border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-indigo-600">
                        Question {qidx + 1}
                      </span>
                      <span className="text-xs bg-gray-50 text-gray-500 px-2.5 py-0.5 rounded font-semibold uppercase">
                        {q.marks} Marks
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-900 mb-4 whitespace-pre-wrap">{q.questionText}</p>

                    <div className="space-y-2">
                      {q.options.map((opt, oidx) => {
                        const optId = opt.id as number;
                        const isChosen = isMulti
                          ? Array.isArray(answer) && answer.includes(optId)
                          : Number(answer) === optId;

                        const isCorrect = opt.isCorrect;

                        let style = 'border-gray-100';
                        let icon = null;

                        if (isCorrect) {
                          style = 'border-emerald-200 bg-emerald-50 text-emerald-900';
                        } else if (isChosen && !isCorrect) {
                          style = 'border-red-200 bg-red-50 text-red-900';
                        }

                        return (
                          <div key={optId} className={`p-3 border rounded-lg flex items-center justify-between text-xs ${style}`}>
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-gray-400">{String.fromCharCode(65 + oidx)}.</span>
                              <span className="font-medium">{opt.optionText}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isChosen && <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.5 rounded">Your Answer</span>}
                              {isCorrect && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">Correct</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl text-xs text-indigo-800 border-l-4 border-indigo-500">
                        <span className="font-bold">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center text-gray-500 border border-gray-100 bg-white">
              The instructor has disabled displaying correct answers and solution reviews for this quiz.
            </Card>
          )}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Quiz Assessment System">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-gray-200 pb-px">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'quizzes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Quizzes
          </button>
          {!isStudent && (
            <>
              <button
                onClick={() => setActiveTab('question_bank')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'question_bank'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Question Bank
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'submissions'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Submissions
              </button>
            </>
          )}
        </div>

        {activeTab === 'quizzes' && (
          <>
            {/* Creators & Admins Dashboard Widgets */}
            {!showCreateForm && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 max-w-lg relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search quizzes by title or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={offeringFilter}
                    onChange={(e) => setOfferingFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Course Offerings</option>
                    {offerings.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.courseCode} - {o.subject?.name}
                      </option>
                    ))}
                  </select>

                  {!isStudent && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  )}

                  {!isStudent && (
                    <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)} className="flex items-center space-x-1">
                      <Plus className="h-4 w-4" />
                      <span>Create Quiz</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {showCreateForm ? (
              <Card className="p-6 max-w-4xl mx-auto border border-gray-200 bg-white">
                <h3 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100 mb-6">
                  {editingQuizId ? 'Edit Quiz Assessment' : 'Setup New Quiz Assessment'}
                </h3>

                <form onSubmit={handleCreateOrUpdateQuiz} className="space-y-6">
                  {/* Basic Quiz Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Quiz Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Midterm Assessment"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Course Offering *
                      </label>
                      <select
                        required
                        disabled={!!editingQuizId}
                        value={formData.courseOfferingId}
                        onChange={(e) => setFormData({ ...formData, courseOfferingId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select offering</option>
                        {offerings.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.courseCode} - {o.subject?.name} ({o.section?.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Total Marks *
                        </label>
                        <input
                          type="number"
                          required
                          value={formData.totalMarks}
                          onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Passing Marks *
                        </label>
                        <input
                          type="number"
                          required
                          value={formData.passingMarks}
                          onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Duration (Mins) *
                        </label>
                        <input
                          type="number"
                          required
                          value={formData.durationMinutes}
                          onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Available From *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={formData.availableFrom}
                          onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Available Until *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={formData.availableUntil}
                          onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Max Attempt Limits
                      </label>
                      <input
                        type="number"
                        value={formData.maximumAttempts}
                        onChange={(e) => setFormData({ ...formData, maximumAttempts: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Visibility Initial Status
                      </label>
                      <select
                        value={formData.visibilityStatus}
                        onChange={(e) => setFormData({ ...formData, visibilityStatus: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Draft">Draft (Hidden)</option>
                        <option value="Published">Published (Open / Live)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Instructions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Read carefully. Negative marking is enabled."
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Rules Settings */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 text-xs text-gray-600 font-semibold uppercase tracking-wider cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.shuffleQuestions}
                        onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                      />
                      <span>Shuffle Questions</span>
                    </label>

                    <label className="flex items-center space-x-3 text-xs text-gray-600 font-semibold uppercase tracking-wider cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.shuffleOptions}
                        onChange={(e) => setFormData({ ...formData, shuffleOptions: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                      />
                      <span>Shuffle Options</span>
                    </label>

                    <label className="flex items-center space-x-3 text-xs text-gray-600 font-semibold uppercase tracking-wider cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.negativeMarkingEnabled}
                        onChange={(e) => setFormData({ ...formData, negativeMarkingEnabled: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                      />
                      <span>Negative Marking</span>
                    </label>

                    {formData.negativeMarkingEnabled && (
                      <div className="col-span-1 sm:col-span-2 md:col-span-3 grid grid-cols-2 gap-2 mt-2 bg-white p-3 rounded-lg border border-gray-100">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Penalty per incorrect question
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.negativeMarksPerQuestion}
                            onChange={(e) => setFormData({ ...formData, negativeMarksPerQuestion: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <label className="flex items-center space-x-3 text-xs text-gray-600 font-semibold uppercase tracking-wider cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showResultImmediately}
                        onChange={(e) => setFormData({ ...formData, showResultImmediately: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                      />
                      <span>Show Results Immediately</span>
                    </label>

                    <label className="flex items-center space-x-3 text-xs text-gray-600 font-semibold uppercase tracking-wider cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showCorrectAnswers}
                        onChange={(e) => setFormData({ ...formData, showCorrectAnswers: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                      />
                      <span>Reveal Correct Answers</span>
                    </label>
                  </div>

                  {/* Question Assignment Panel */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      Assign Questions from Course Question Bank
                    </h4>

                    {!formData.courseOfferingId ? (
                      <p className="text-xs text-amber-600 italic">Please select a Course Offering above to view available questions.</p>
                    ) : availableQuestions.length === 0 ? (
                      <div className="p-6 bg-gray-50 border border-dashed rounded-xl text-center text-xs text-gray-500">
                        No questions in the question bank for this offering. Navigate to the "Question Bank" tab to create some first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                        {availableQuestions.map((q) => {
                          const isSelected = selectedQuestionIds.includes(q.id);
                          return (
                            <div
                              key={q.id}
                              onClick={() => toggleQuestionSelection(q.id)}
                              className={`p-3 border rounded-xl cursor-pointer transition-all flex items-start justify-between text-xs ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/50'
                                  : 'border-gray-100 hover:border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex-1 pr-2">
                                <p className="font-semibold text-gray-800 line-clamp-2">{q.questionText}</p>
                                <div className="flex items-center space-x-2 mt-1.5 text-[9px] text-gray-400 font-semibold uppercase">
                                  <span>{q.difficultyLevel}</span>
                                  <span>•</span>
                                  <span>{q.questionType}</span>
                                </div>
                              </div>
                              <span className="font-bold text-indigo-600">{q.marks} Marks</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                    <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      {editingQuizId ? 'Update Quiz' : 'Save Quiz'}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                  <p className="text-sm text-gray-500 col-span-full">Loading quizzes list...</p>
                ) : quizzes.length === 0 ? (
                  <Card className="col-span-full p-8 text-center text-gray-500 bg-white border-dashed border-gray-200">
                    No quizzes found matching your criteria.
                  </Card>
                ) : (
                  quizzes.map((q) => {
                    // Check if student has already completed attempts
                    const studentAttempts = submissions.filter((sub) => sub.quizId === q.id);
                    const isCompleted = studentAttempts.some((sub) => ['Submitted', 'Auto Submitted', 'Graded'].includes(sub.submissionStatus));
                    const remaining = q.maximumAttempts - studentAttempts.length;

                    return (
                      <Card key={q.id} className="p-5 border border-gray-100 hover:border-gray-200 transition-colors bg-white flex flex-col justify-between h-[280px]">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-sm font-semibold tracking-wide font-mono">
                              {q.quizCode}
                            </span>
                            <div className="flex items-center space-x-1">
                              {!isStudent && (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                                  q.visibilityStatus === 'Draft'
                                    ? 'bg-amber-50 text-amber-700'
                                    : q.visibilityStatus === 'Archived'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {q.visibilityStatus}
                                </span>
                              )}
                              {isStudent && (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                                  isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                                }`}>
                                  {isCompleted ? 'Completed' : 'Pending'}
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">{q.title}</h3>
                          {q.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{q.description}</p>}

                          <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-50 pt-3 text-gray-500">
                            <div className="flex items-center space-x-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-semibold text-gray-700">{q.courseOffering?.courseCode || 'Course'}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span>{q.durationMinutes} Mins</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Award className="h-3.5 w-3.5 text-gray-400" />
                              <span>Passing: {q.passingMarks}/{q.totalMarks}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              <span>{q.maximumAttempts} AttemptLimit</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-3">
                          {isStudent ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] text-gray-400 font-medium">
                                {isCompleted ? 'Finished' : `${remaining} attempts left`}
                              </span>
                              <div className="flex space-x-1">
                                {studentAttempts.length > 0 && (
                                  <Button variant="ghost" size="sm" onClick={() => handleReviewSubmission(studentAttempts[0])} className="text-xs">
                                    <Eye className="h-3.5 w-3.5 mr-1" /> Review
                                  </Button>
                                )}
                                {!isCompleted && remaining > 0 && (
                                  <Button variant="primary" size="sm" onClick={() => handleStartQuizAttempt(q.id)} className="text-xs font-semibold">
                                    Start Attempt
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditQuiz(q)} className="text-xs text-gray-500 hover:text-indigo-600">
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteQuiz(q.id)} className="text-xs text-red-500 hover:bg-red-50">
                                  Delete
                                </Button>
                              </div>
                              <div className="flex space-x-1">
                                {q.visibilityStatus === 'Draft' && (
                                  <Button variant="ghost" size="sm" onClick={() => handlePublishQuiz(q.id)} className="text-xs text-emerald-600 hover:bg-emerald-50">
                                    Publish
                                  </Button>
                                )}
                                {q.visibilityStatus === 'Published' && (
                                  <Button variant="ghost" size="sm" onClick={() => handleArchiveQuiz(q.id)} className="text-xs text-gray-600 hover:bg-gray-50">
                                    Archive
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'question_bank' && <QuestionBankView />}

        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <Card className="p-5 border border-gray-100 bg-white">
              <h3 className="text-base font-bold text-gray-900 mb-4">Student Assessment Attempts</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase font-semibold tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Quiz Title</th>
                      <th className="py-3 px-4">Attempt #</th>
                      <th className="py-3 px-4">Marks Obtained</th>
                      <th className="py-3 px-4">Percentage</th>
                      <th className="py-3 px-4">Grade</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 italic">
                          No student attempts recorded yet.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900">{sub.student?.fullName}</p>
                            <p className="text-[10px] text-gray-400">{sub.student?.registrationNumber}</p>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-700">{sub.quiz?.title}</td>
                          <td className="py-3 px-4">Attempt {sub.attemptNumber}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {sub.obtainedMarks !== null ? `${sub.obtainedMarks} / ${sub.quiz?.totalMarks}` : '-'}
                          </td>
                          <td className="py-3 px-4 font-medium">{sub.percentage !== null ? `${sub.percentage}%` : '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.grade === 'F' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {sub.grade || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 uppercase tracking-wide text-[10px] font-bold text-gray-500">
                            {sub.submissionStatus}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {sub.submissionStatus !== 'In Progress' && (
                              <Button variant="ghost" size="sm" onClick={() => handleReviewSubmission(sub)} className="text-xs">
                                Review Answers
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Quick Analytics Summary */}
            {quizzes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center">
                    <TrendingUp className="h-4 w-4 text-indigo-600 mr-2" /> Live Quiz Performance Analytics
                  </h4>
                </div>
                {quizzes.map((qz) => {
                  const qzSubmissions = submissions.filter((s) => s.quizId === qz.id);
                  return (
                    <Card key={qz.id} className="p-5 border border-gray-100 bg-white space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                        <span className="font-bold text-gray-800 text-sm">{qz.title}</span>
                        <span className="text-xs text-gray-400 font-mono">{qz.quizCode}</span>
                      </div>
                      <QuizAnalyticsView quiz={qz} submissions={qzSubmissions} />
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
