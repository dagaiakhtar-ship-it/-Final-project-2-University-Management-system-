import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';
import { Exam } from './types';
import { ExamForm } from './ExamForm';
import { ExamDetailsModal } from './ExamDetailsModal';
import { ExamCalendarView } from './ExamCalendarView';
import { ExamAnalyticsView } from './ExamAnalyticsView';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
  RefreshCw,
  Award,
  Grid,
  FileCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const ExamDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role || 'STUDENT';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isTeacher = userRole === 'TEACHER';
  const isStudent = userRole === 'STUDENT';

  // State Variables
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Tab views
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'analytics'>('list');

  // Internal Relational Profiles IDs
  const [studentProfileId, setStudentProfileId] = useState<number | null>(null);
  const [teacherProfileId, setTeacherProfileId] = useState<number | null>(null);

  // Flow controllers
  const [showForm, setShowForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // Fetch student or teacher internal profile ID
  useEffect(() => {
    const fetchInternalProfile = async () => {
      if (!user) return;
      try {
        if (isStudent) {
          const res = await apiClient.get('/students');
          const studentList = res.data?.data || res.data || [];
          const matched = studentList.find((s: any) => s.userId === user.id);
          if (matched) setStudentProfileId(matched.id);
        } else if (isTeacher) {
          const res = await apiClient.get('/teachers');
          const teacherList = res.data?.data || res.data || [];
          const matched = teacherList.find((t: any) => t.userId === user.id);
          if (matched) setTeacherProfileId(matched.id);
        }
      } catch (err) {
        console.error('Failed to load profile context:', err);
      }
    };

    fetchInternalProfile();
  }, [user, isStudent, isTeacher]);

  // Load exams
  const loadExams = async () => {
    try {
      setLoading(true);
      let res;
      if (isStudent && studentProfileId) {
        res = await apiClient.get(`/exams/student/${studentProfileId}`);
        setExams(Array.isArray(res.data) ? res.data : []);
      } else if (isTeacher && teacherProfileId) {
        res = await apiClient.get(`/exams/teacher/${teacherProfileId}`);
        setExams(Array.isArray(res.data) ? res.data : []);
      } else if (isAdmin) {
        const params = {
          search: search || undefined,
          status: statusFilter || undefined,
          examType: typeFilter || undefined,
        };
        res = await apiClient.get('/exams', { params });
        const list = res.data?.exams || res.data || [];
        setExams(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      toast.error('Failed to load scheduled exams list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If waiting for profile ID, don't trigger yet for student/teacher
    if (isStudent && !studentProfileId) return;
    if (isTeacher && !teacherProfileId) return;

    loadExams();
  }, [studentProfileId, teacherProfileId, search, statusFilter, typeFilter]);

  // Real-time socket listener
  useEffect(() => {
    const socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Exam Roster notifications channel.');
      if (user) {
        socket.emit('join', `role:${user.role}`);
        if (isStudent && studentProfileId) socket.emit('join', `student:${studentProfileId}`);
        if (isTeacher && teacherProfileId) socket.emit('join', `teacher:${teacherProfileId}`);
      }
    });

    socket.on('exam:changed', (data: any) => {
      loadExams();
    });

    socket.on('exam:notification', (data: any) => {
      toast((t) => (
        <div className="flex items-start gap-2.5 text-left text-xs">
          <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-slate-800 block">{data.title}</span>
            <span className="text-slate-500 block mt-0.5">{data.message}</span>
          </div>
        </div>
      ), { duration: 5000 });
      loadExams();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, studentProfileId, teacherProfileId]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this exam schedule? This action is irreversible.')) {
      return;
    }

    try {
      await apiClient.delete(`/exams/${id}`);
      toast.success('Exam schedule deleted.');
      loadExams();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete exam.');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this exam? Candidates and invigilators will be notified.')) {
      return;
    }

    try {
      await apiClient.patch(`/exams/${id}/cancel`);
      toast.success('Exam has been officially marked as Cancelled.');
      loadExams();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel exam.');
    }
  };

  // Main list filtering for Student/Teacher who fetches all they are linked with
  // We apply client-side searching to make student/teacher search instantaneous
  const filteredExams = exams.filter((exam) => {
    if (isAdmin) return true; // Already filtered on server side

    const matchSearch =
      !search ||
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.examCode.toLowerCase().includes(search.toLowerCase()) ||
      exam.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
      exam.subject?.code?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || exam.status === statusFilter;
    const matchType = !typeFilter || exam.examType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  return (
    <PageContainer>
      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 mb-6 text-left">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">University Examination Board</h1>
          <p className="text-xs text-slate-500 mt-1">Manage physical schedules, seat plans, duty rosters, and anti-forgery admit cards.</p>
        </div>
        {isAdmin && !showForm && !selectedExamId && (
          <Button onClick={() => setShowForm(true)} variant="primary" size="sm" className="shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" /> Schedule Assessment
          </Button>
        )}
      </div>

      {/* Detail view active slot */}
      {selectedExamId ? (
        <ExamDetailsModal examId={selectedExamId} onBack={() => setSelectedExamId(null)} />
      ) : showForm ? (
        <ExamForm
          examId={editingExamId}
          onSuccess={() => {
            setShowForm(false);
            setEditingExamId(null);
            loadExams();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingExamId(null);
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Navigation Controls Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none cursor-pointer ${
                  activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Detailed List
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none cursor-pointer ${
                  activeTab === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Roster Calendar
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none cursor-pointer ${
                    activeTab === 'analytics' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Analytics
                </button>
              )}
            </div>

            {/* Quick stats panel */}
            <div className="flex gap-4 text-xs font-bold font-mono text-slate-400 self-end">
              <span>ACTIVE ROSTER: {filteredExams.filter(e => e.status !== 'Cancelled').length}</span>
              <span>•</span>
              <span>DRAFTS: {filteredExams.filter(e => e.status === 'Draft').length}</span>
            </div>
          </div>

          {/* Conditional Layouts */}
          {activeTab === 'calendar' ? (
            <ExamCalendarView exams={exams} />
          ) : activeTab === 'analytics' ? (
            <ExamAnalyticsView />
          ) : (
            <div className="space-y-6">
              {/* Filter controls panel */}
              <Card className="p-4 bg-white border border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by title, subject code, or exam code..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-150 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto shrink-0">
                  <select
                    className="px-3.5 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">-- All Statuses --</option>
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <select
                    className="px-3.5 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">-- All Assessment Types --</option>
                    <option value="Midterm">Midterm Exam</option>
                    <option value="Final">Final Exam</option>
                    <option value="Practical">Practical</option>
                    <option value="Viva">Viva</option>
                    <option value="Makeup">Makeup</option>
                    <option value="Retake">Retake</option>
                  </select>
                </div>
              </Card>

              {/* Loader */}
              {loading ? (
                <div className="flex items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
                  <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Syncing secure examination roster...</span>
                </div>
              ) : filteredExams.length === 0 ? (
                <Card className="p-12 text-center max-w-md mx-auto space-y-4">
                  <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Roster Empty</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">No matching scheduled examination records are listed for your current profile context.</p>
                </Card>
              ) : (
                /* Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExams.map((exam) => {
                    const dateObj = new Date(exam.examDate);
                    const formattedDate = dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <Card
                        key={exam.id}
                        className={`p-5 bg-white border border-slate-150/60 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all relative ${
                          exam.status === 'Cancelled' ? 'opacity-65' : ''
                        }`}
                      >
                        {/* Status tag */}
                        <div className="flex justify-between items-start mb-3">
                          <span
                            className={`text-[8px] font-black font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                              exam.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700'
                                : exam.status === 'Draft'
                                ? 'bg-slate-100 text-slate-500'
                                : exam.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {exam.status}
                          </span>
                          <span className="text-[8px] text-slate-400 font-mono font-bold tracking-wider uppercase">
                            {exam.examCode}
                          </span>
                        </div>

                        {/* Title & Subject */}
                        <div className="text-left space-y-1">
                          <h4 className="text-xs font-black font-mono text-indigo-600 uppercase tracking-wider">
                            {exam.examType}
                          </h4>
                          <span className="text-sm font-extrabold text-slate-800 block truncate leading-tight">
                            {exam.title}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block truncate">
                            {exam.subject?.name || 'Subject'} ({exam.subject?.code || 'CODE'})
                          </span>
                          {isTeacher && exam.myRole && (
                            <span className="text-[10px] font-black font-mono text-emerald-600 block mt-1">
                              MY DUTY: {exam.myRole}
                            </span>
                          )}
                          {isStudent && exam.allocatedSeat && (
                            <span className="text-[10px] font-black font-mono text-emerald-600 block mt-1">
                              MY SEAT: {exam.allocatedSeat}
                            </span>
                          )}
                        </div>

                        {/* Details parameters */}
                        <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-slate-100 mt-4 text-left text-[10px] text-slate-400 font-bold font-mono">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{exam.startTime} - {exam.endTime}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {exam.room ? `${exam.room.building?.code}-${exam.room.roomNumber}` : 'Hall Unallocated'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons footer */}
                        <div className="pt-3 flex items-center justify-between mt-3">
                          {/* Left: General detailed view button */}
                          <Button
                            onClick={() => setSelectedExamId(exam.id)}
                            variant="ghost"
                            size="sm"
                            className="text-xs font-bold text-slate-500 hover:text-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Specs
                          </Button>

                          {/* Right: Admin Action operations */}
                          {isAdmin && exam.status !== 'Cancelled' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingExamId(exam.id);
                                  setShowForm(true);
                                }}
                                type="button"
                                className="p-1 rounded-md text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all focus:outline-none"
                                title="Edit Schedule Parameters"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancel(exam.id)}
                                type="button"
                                className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none"
                                title="Officially Cancel Assessment"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(exam.id)}
                                type="button"
                                className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none"
                                title="Purge Record (Soft Delete)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};
export default ExamDashboardPage;
