import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  BookOpen,
  QrCode,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Lock,
  Unlock,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TimetableSlot {
  id: number;
  courseOfferingId: number;
  teacherId: number;
  sectionId: number;
  roomId: number;
  academicYear: string;
  session: string;
  subject: { name: string; code: string };
  section: { name: string; code: string };
  room: { roomNumber: string; building: { name: string } };
  timeSlot: { dayOfWeek: string; startTime: string; endTime: string };
  teacher: { id: number; user: { firstName: string; lastName: string } };
  courseOffering: { id: number; courseCode: string };
}

interface AttendanceSession {
  id: number;
  uuid: string;
  timetableId: number | null;
  attendanceDate: string;
  startTime: string;
  endTime: string;
  sessionStatus: string;
  attendanceMethod: string;
  courseOffering: { courseCode: string; subject: { name: string } };
  teacher: { user: { firstName: string; lastName: string } };
  section: { name: string };
  room: { roomNumber: string };
  _count: { attendanceRecords: number };
}

interface StudentStats {
  overallPercentage: number;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  courses: {
    courseOfferingId: number;
    courseCode: string;
    subjectName: string;
    present: number;
    total: number;
    percentage: number;
  }[];
  records: any[];
}

export const AttendanceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role || 'STUDENT';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isTeacher = userRole === 'TEACHER';

  // State
  const [loading, setLoading] = useState(true);
  const [scheduledClasses, setScheduledClasses] = useState<TimetableSlot[]>([]);
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Student specific QR scan state
  const [qrToken, setQrToken] = useState('');
  const [scanning, setScanning] = useState(false);

  // Filters
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sections, setSections] = useState<any[]>([]);

  // Analytics Dates
  const [analyticsCourse, setAnalyticsCourse] = useState('');
  const [coursesLookup, setCoursesLookup] = useState<any[]>([]);

  // Fetch Teacher/Student Profiles to get internal IDs
  const [profileId, setProfileId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isTeacher && user) {
          const res = await apiClient.get(`/users/${user.id}/teacher-profile`);
          const pData = res.data?.data;
          if (pData?.id) {
            setProfileId(pData.id);
          }
        } else if (userRole === 'STUDENT' && user) {
          const res = await apiClient.get(`/users/${user.id}/student-profile`);
          const pData = res.data?.data;
          if (pData?.id) {
            setProfileId(pData.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile info:', err);
      }
    };
    fetchProfile();
  }, [user, isTeacher, userRole]);

  // Fetch lookup data
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const secsRes = await apiClient.get('/sections').catch((err) => {
          console.warn('[AttendanceDashboard] Section lookup failed:', err);
          return null;
        });
        if (secsRes) {
          setSections(secsRes.data.data?.sections || secsRes.data.data || []);
        }

        const coursesRes = await apiClient.get('/course-offerings').catch((err) => {
          console.warn('[AttendanceDashboard] Course offering lookup failed:', err);
          return null;
        });
        if (coursesRes) {
          setCoursesLookup(coursesRes.data.data?.courseOfferings || coursesRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load lookups', err);
      }
    };
    fetchLookups();
  }, []);

  // Main data fetching
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin || isTeacher) {
        // Fetch Scheduled Classes for today (convert current day name)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date(selectedDate).getDay()];

        const params: any = { dayOfWeek: currentDay, status: 'Active' };
        if (isTeacher && profileId) {
          params.teacherId = profileId;
        }
        if (selectedSection) {
          params.sectionId = selectedSection;
        }

        const timetablesRes = await apiClient.get('/timetable', { params });
        setScheduledClasses(timetablesRes.data.data?.timetables || timetablesRes.data.data || []);

        // Fetch Recent Attendance Sessions
        const sessParams: any = {};
        if (isTeacher && profileId) {
          sessParams.teacherId = profileId;
        }
        const sessionsRes = await apiClient.get('/attendance', { params: sessParams });
        setRecentSessions(sessionsRes.data.data || []);

        // Fetch Analytics
        const analyticsParams: any = {};
        if (analyticsCourse) {
          analyticsParams.courseOfferingId = analyticsCourse;
        }
        const analyticsRes = await apiClient.get('/attendance/analytics', { params: analyticsParams });
        setAnalytics(analyticsRes.data.data);
      } else if (userRole === 'STUDENT') {
        if (profileId) {
          // Fetch student history and stats
          const res = await apiClient.get(`/students/${profileId}/attendance`);
          setStudentStats(res.data.data);
        }
      }
    } catch (err: any) {
      console.error('Failed loading dashboard details:', err);
      toast.error('Could not load some dashboard modules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [profileId, userRole, selectedSection, selectedDate, analyticsCourse]);

  // Real-time socket updates
  useEffect(() => {
    const socket = io();
    socket.on('attendance:changed', () => {
      loadDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, [profileId, userRole]);

  // Handle Starting Attendance from Timetable entry
  const handleStartAttendance = async (slot: TimetableSlot) => {
    try {
      const payload = {
        timetableId: slot.id,
        courseOfferingId: slot.courseOfferingId,
        teacherId: slot.teacherId,
        sectionId: slot.sectionId,
        roomId: slot.roomId,
        attendanceDate: selectedDate,
        startTime: slot.timeSlot.startTime,
        endTime: slot.timeSlot.endTime,
        attendanceMethod: 'Manual',
        notes: `Class scheduled on ${slot.timeSlot.dayOfWeek}`,
      };

      const res = await apiClient.post('/attendance/session', payload);
      if (res.data.success && res.data.data) {
        toast.success('Attendance session initialized successfully!');
        navigate(`/attendance/session/${res.data.data.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize session.');
    }
  };

  // Student QR Code scan check-in
  const handleQrCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrToken.trim()) {
      toast.error('Please enter a valid check-in token.');
      return;
    }

    setScanning(true);
    try {
      const res = await apiClient.post('/attendance/scan', {
        qrToken: qrToken.trim(),
        studentId: profileId,
      });

      if (res.data.success) {
        toast.success('Checked in successfully! Attendance registered.', { icon: '🎉' });
        setQrToken('');
        loadDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired check-in token.');
    } finally {
      setScanning(false);
    }
  };

  // Color mappings for recharts
  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

  return (
    <PageContainer title="Classroom Attendance Ledger">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-sm font-medium text-slate-500 font-sans">Compiling attendance logs...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* HEADER METRICS BAR FOR ADMIN / TEACHERS */}
          {(isAdmin || isTeacher) && analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card id="metric-overall" className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-slate-300 uppercase tracking-wider">Overall Att. Rate</p>
                    <h3 className="text-3xl font-sans font-medium tracking-tight mt-1">{analytics.overallPercentage}%</h3>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 font-mono">Dynamic academic average</p>
              </Card>

              <Card id="metric-sessions" className="p-4 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Sessions Logged</p>
                    <h3 className="text-3xl font-sans font-medium tracking-tight mt-1 text-slate-900">{analytics.totalSessions}</h3>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 font-mono">Durable cloud logs</p>
              </Card>

              <Card id="metric-presents" className="p-4 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Present Checks</p>
                    <h3 className="text-3xl font-sans font-medium tracking-tight mt-1 text-emerald-600">{analytics.totalPresent + analytics.totalLate}</h3>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 font-mono">Includes late arrivals</p>
              </Card>

              <Card id="metric-absents" className="p-4 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Absences Registered</p>
                    <h3 className="text-3xl font-sans font-medium tracking-tight mt-1 text-rose-600">{analytics.totalAbsent}</h3>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 font-mono">Action required for thresholds</p>
              </Card>
            </div>
          )}

          {/* TEACHERS AND ADMINS MAIN DASHBOARD */}
          {(isAdmin || isTeacher) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* TODAY'S CLASSES TIMETABLE LIST */}
              <div className="lg:col-span-2 space-y-6">
                <Card id="today-classes" className="border border-slate-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h3 className="text-lg font-sans font-medium text-slate-900">Today's Class Schedule</h3>
                      <p className="text-xs text-slate-500">Scheduled slots from the university timetable</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="">All Sections</option>
                        {sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            Section {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {scheduledClasses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Calendar className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-sans font-medium text-slate-600">No scheduled classes found</p>
                      <p className="text-xs text-slate-400 mt-1">Check filters, selected date, or add timetable entries first.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduledClasses.map((slot) => {
                        // Check if a session already exists for this slot on this day
                        const dateFormatted = new Date(selectedDate).toISOString().split('T')[0];
                        const matchedSession = recentSessions.find(
                          (s) =>
                            s.timetableId === slot.id &&
                            s.attendanceDate.split('T')[0] === dateFormatted
                        );

                        return (
                          <div
                            key={slot.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 hover:border-slate-300 rounded-xl transition duration-150 gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full">
                                  {slot.courseOffering.courseCode}
                                </span>
                                <span className="bg-slate-900 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full">
                                  Section {slot.section.name}
                                </span>
                              </div>
                              <h4 className="text-sm font-sans font-medium text-slate-900">{slot.subject.name}</h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {slot.timeSlot.startTime} - {slot.timeSlot.endTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {slot.room.roomNumber} ({slot.room.building.name})
                                </span>
                                {isAdmin && (
                                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                                    <User className="h-3 w-3" /> {slot.teacher.user.firstName} {slot.teacher.user.lastName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              {matchedSession ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-mono font-semibold px-2 py-1 rounded-full ${
                                      matchedSession.sessionStatus === 'Locked'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                        : matchedSession.sessionStatus === 'Completed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    }`}
                                  >
                                    {matchedSession.sessionStatus}
                                  </span>
                                  <Button
                                    id={`view-session-${matchedSession.id}`}
                                    onClick={() => navigate(`/attendance/session/${matchedSession.id}`)}
                                    variant="outline"
                                    className="px-3 py-1.5 text-xs font-sans text-slate-700"
                                  >
                                    View / Edit
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  id={`start-session-${slot.id}`}
                                  onClick={() => handleStartAttendance(slot)}
                                  className="px-3 py-1.5 text-xs font-sans bg-slate-900 text-white flex items-center gap-1 hover:bg-slate-800"
                                >
                                  Start Attendance <ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* HISTORICAL RECHARTS ANALYTICS */}
                <Card id="analytics-module" className="border border-slate-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h3 className="text-lg font-sans font-medium text-slate-900">Historical Attendance Analytics</h3>
                      <p className="text-xs text-slate-500">Visual trend charts compiled from session logs</p>
                    </div>

                    <select
                      value={analyticsCourse}
                      onChange={(e) => setAnalyticsCourse(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">All Courses</option>
                      {coursesLookup.map((co) => (
                        <option key={co.id} value={co.id}>
                          {co.courseCode} - {co.subject?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {analytics?.dailyTrend && analytics.dailyTrend.length > 0 ? (
                    <div className="space-y-6">
                      <div className="h-64">
                        <p className="text-xs font-mono text-slate-500 mb-2">DAILY ATTENDANCE RATE TREND (%)</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.dailyTrend}>
                            <defs>
                              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                            <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={10} tickLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="attendanceRate" stroke="#10B981" fillOpacity={1} fill="url(#colorRate)" strokeWidth={2} name="Att. %" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Breakdown by Status Pie */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs font-mono text-slate-500 mb-2 text-center">ATTENDANCE CHECK BREAKDOWN</p>
                          <div className="h-44 flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Present', value: analytics.totalPresent },
                                    { name: 'Absent', value: analytics.totalAbsent },
                                    { name: 'Late', value: analytics.totalLate },
                                    { name: 'Excused', value: analytics.totalExcused }
                                  ].filter(d => d.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={65}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {COLORS.map((color, index) => (
                                    <Cell key={`cell-${index}`} fill={color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Attendance by Course Bar Chart */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs font-mono text-slate-500 mb-2">COURSE-BY-COURSE ATTENDANCE (%)</p>
                          <div className="h-44">
                            {analytics.courseStats && analytics.courseStats.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.courseStats}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                  <XAxis dataKey="courseCode" stroke="#94A3B8" fontSize={9} tickLine={false} />
                                  <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={9} tickLine={false} />
                                  <Tooltip />
                                  <Bar dataKey="percentage" fill="#1e293b" radius={[4, 4, 0, 0]} name="Rate %" />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                No course breakdown available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <TrendingUp className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-sans font-medium text-slate-600">Analytics compilation pending</p>
                      <p className="text-xs text-slate-400 mt-1">Create and lock some attendance sessions to compile chart trends.</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* RECENT COMPLETED SESSIONS LISTING */}
              <div className="space-y-6">
                <Card id="recent-sessions" className="border border-slate-200 p-6">
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-base font-sans font-medium text-slate-900">Attendance Session Logs</h3>
                    <p className="text-xs text-slate-500">Historic logs with status and audit checks</p>
                  </div>

                  {recentSessions.length === 0 ? (
                    <p className="text-xs font-sans text-slate-400 text-center py-6">No previous sessions found</p>
                  ) : (
                    <div className="space-y-3 divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                      {recentSessions.map((sess, idx) => (
                        <div key={sess.id} className={`pt-3 ${idx === 0 ? 'pt-0' : ''} space-y-1.5`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {sess.courseOffering.courseCode}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                                sess.sessionStatus === 'Locked'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : sess.sessionStatus === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}
                            >
                              {sess.sessionStatus}
                            </span>
                          </div>

                          <h4 className="text-xs font-sans font-medium text-slate-900 line-clamp-1">
                            {sess.courseOffering.subject.name}
                          </h4>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{new Date(sess.attendanceDate).toLocaleDateString()}</span>
                            <span>{sess._count.attendanceRecords} students</span>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              id={`view-detail-sess-${sess.id}`}
                              onClick={() => navigate(`/attendance/session/${sess.id}`)}
                              variant="outline"
                              className="px-2 py-1 text-[10px] h-7 font-sans text-slate-600 border-slate-200 flex items-center gap-1"
                            >
                              Details <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* FUTURE-READY METRICS AND INTEGRATIONS CONTAINER */}
                <Card id="biometric-panel" className="border border-slate-200 p-6 bg-slate-50">
                  <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Enterprise IoT & Integrations</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Active infrastructure connectors configured for smart university tracking.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700">
                      <span className="flex items-center gap-1.5"><QrCode className="h-3.5 w-3.5 text-indigo-600" /> Secure QR Generator</span>
                      <span className="text-emerald-600 font-bold">● ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 opacity-60">
                      <span className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5 text-slate-500" /> RFID / NFC Gate Entry</span>
                      <span className="text-slate-500">READY</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 opacity-60">
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-500" /> Facial Recognition</span>
                      <span className="text-slate-500">STANDBY</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* STUDENT DASHBOARD VIEWS */}
          {userRole === 'STUDENT' && studentStats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CHECK-IN VIA MANUAL OR SCAN QR CODE */}
              <div className="space-y-6">
                <Card id="student-qr-card" className="border border-slate-200 p-6 bg-slate-900 text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="h-6 w-6 text-indigo-400" />
                    <h3 className="text-base font-sans font-medium">Lecture Instant Check-In</h3>
                  </div>
                  <p className="text-xs text-slate-300 mb-4">
                    Scan the class QR code displayed by your lecturer or enter the secure token below to sign in instantly.
                  </p>

                  <form onSubmit={handleQrCheckIn} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                        Secure Access Token
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5e9b867c..."
                        value={qrToken}
                        onChange={(e) => setQrToken(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                      />
                    </div>

                    <Button
                      id="submit-qr-code"
                      type="submit"
                      disabled={scanning}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-sans font-medium h-9 flex items-center justify-center gap-1"
                    >
                      {scanning ? 'Verifying...' : 'Check-In Active Session'}
                    </Button>
                  </form>
                </Card>

                {/* GENERAL SUMMARY PROGRESS CARD */}
                <Card id="student-summary-card" className="border border-slate-200 p-6 text-center">
                  <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Attendance Average</h3>

                  <div className="relative inline-flex items-center justify-center mb-4">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        className="stroke-slate-100 fill-none"
                        strokeWidth="10"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        className={`fill-none ${
                          studentStats.overallPercentage >= 75
                            ? 'stroke-emerald-500'
                            : 'stroke-rose-500'
                        }`}
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - studentStats.overallPercentage / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-sans font-medium text-slate-900">{studentStats.overallPercentage}%</span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Average</p>
                    </div>
                  </div>

                  {studentStats.overallPercentage < 75 ? (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-left text-xs">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-sans font-medium">Critical Threshold Warning</p>
                        <p className="text-[10px] text-rose-600 font-mono mt-0.5">Attendance is below the 75% limit for examinations.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-left text-xs">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-sans font-medium">Safe Standing</p>
                        <p className="text-[10px] text-emerald-600 font-mono mt-0.5">You meet all mandatory exam eligibility metrics.</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* COURSE BREAKDOWN AND LEDGER RECORD HISTORY */}
              <div className="lg:col-span-2 space-y-6">
                {/* Course stats table */}
                <Card id="student-courses" className="border border-slate-200 p-6">
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-base font-sans font-medium text-slate-900">Enrolled Course Progress</h3>
                    <p className="text-xs text-slate-500">Progress metrics by registered subject</p>
                  </div>

                  <div className="space-y-4">
                    {studentStats.courses.map((course) => (
                      <div key={course.courseOfferingId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-500">{course.courseCode}</span>
                          <span className="font-sans font-semibold text-slate-900">{course.subjectName}</span>
                          <span
                            className={`font-mono font-bold ${
                              course.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {course.percentage}% ({course.present}/{course.total})
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              course.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, course.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Historical records list */}
                <Card id="student-history" className="border border-slate-200 p-6">
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-base font-sans font-medium text-slate-900">Check-In Logs</h3>
                    <p className="text-xs text-slate-500">Full audit log of lecture check-ins</p>
                  </div>

                  {studentStats.records.length === 0 ? (
                    <p className="text-xs font-sans text-slate-400 text-center py-6">No lecture logs found.</p>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {studentStats.records.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 rounded-xl transition duration-150 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                              {rec.attendanceSession.courseOffering.courseCode}
                            </span>
                            <h4 className="font-sans font-medium text-slate-900 mt-1">
                              {rec.attendanceSession.courseOffering.subject.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {new Date(rec.attendanceSession.attendanceDate).toLocaleDateString()} | {rec.attendanceSession.startTime}
                            </p>
                          </div>

                          <div className="text-right space-y-1">
                            <span
                              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                                rec.attendanceStatus === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : rec.attendanceStatus === 'Late'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : rec.attendanceStatus === 'Excused'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}
                            >
                              {rec.attendanceStatus}
                            </span>
                            {rec.arrivalTime && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Checked-in: {rec.arrivalTime}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default AttendanceDashboardPage;
