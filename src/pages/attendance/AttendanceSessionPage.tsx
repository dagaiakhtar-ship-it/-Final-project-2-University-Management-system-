import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ArrowLeft,
  Lock,
  Unlock,
  Check,
  X,
  FileText,
  Trash2,
  RefreshCw,
  Clock3,
  HelpCircle
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  attendanceStatus: string;
  arrivalTime: string | null;
  remarks: string | null;
  student: {
    id: number;
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

interface SessionDetails {
  id: number;
  attendanceDate: string;
  startTime: string;
  endTime: string;
  sessionStatus: string;
  attendanceMethod: string;
  qrCodeToken: string | null;
  qrCodeExpiry: string | null;
  notes: string | null;
  courseOffering: { courseCode: string; subject: { name: string } };
  teacher: { user: { firstName: string; lastName: string } };
  section: { name: string };
  room: { roomNumber: string };
  attendanceRecords: AttendanceRecord[];
}

export const AttendanceSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role || 'STUDENT';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isTeacher = userRole === 'TEACHER';

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // QR Generation state
  const [qrExpiryMinutes, setQrExpiryMinutes] = useState(5);
  const [qrCountdown, setQrCountdown] = useState<string | null>(null);

  // Detailed Modal/Inline edit states
  const [activeEditRecordId, setActiveEditRecordId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState('Present');
  const [editRemarks, setEditRemarks] = useState('');
  const [editArrivalTime, setEditArrivalTime] = useState('');
  const [editReason, setEditReason] = useState('');

  const fetchSessionDetails = async () => {
    try {
      if (!id) return;
      const res = await apiClient.get(`/attendance/${id}`);
      if (res.data.success && res.data.data) {
        setSession(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed loading session info:', err);
      toast.error(err.response?.data?.message || 'Failed to load attendance session detail.');
      navigate('/attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetails();
  }, [id]);

  // Real-time socket sync
  useEffect(() => {
    const socket = io();
    socket.on('attendance:changed', (data: any) => {
      // Re-fetch only if update is about this session
      if (data && (data.sessionId === Number(id) || (data.record && data.record.attendanceSessionId === Number(id)))) {
        fetchSessionDetails();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  // QR Code Expiry Countdown Timer
  useEffect(() => {
    if (!session?.qrCodeExpiry) {
      setQrCountdown(null);
      return;
    }

    const interval = setInterval(() => {
      const expiry = new Date(session.qrCodeExpiry!).getTime();
      const now = new Date().getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setQrCountdown('EXPIRED');
        clearInterval(interval);
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setQrCountdown(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.qrCodeExpiry]);

  // Lock / Unlock session handler
  const handleToggleLock = async () => {
    if (!session) return;
    const isLocked = session.sessionStatus === 'Locked';
    const endpoint = isLocked ? '/attendance/unlock' : '/attendance/lock';

    try {
      const res = await apiClient.patch(endpoint, { sessionId: session.id });
      if (res.data.success) {
        toast.success(`Session successfully ${isLocked ? 'unlocked' : 'locked'}!`);
        fetchSessionDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed lock toggle.');
    }
  };

  // Generate QR code token
  const handleGenerateQr = async () => {
    if (!session) return;
    try {
      const res = await apiClient.post(`/attendance/session/${session.id}/qr`, {
        expiryMinutes: qrExpiryMinutes,
      });
      if (res.data.success) {
        toast.success('Secure QR code check-in generated!');
        fetchSessionDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate QR token.');
    }
  };

  // Mark all enrolled present (One-click action)
  const handleMarkAllPresent = async () => {
    if (!session) return;

    const confirmAction = window.confirm('Are you sure you want to mark all students Present?');
    if (!confirmAction) return;

    try {
      const bulkRecords = session.attendanceRecords.map((r) => ({
        studentId: r.student.id,
        attendanceStatus: 'Present',
        remarks: 'Bulk marked Present',
      }));

      const res = await apiClient.post('/attendance/bulk', {
        attendanceSessionId: session.id,
        records: bulkRecords,
      });

      if (res.data.success) {
        toast.success('Successfully marked all students present!');
        fetchSessionDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk marking failed.');
    }
  };

  // Manual marking/updating a single student status directly
  const handleStatusChange = async (studentId: number, status: string) => {
    if (!session) return;
    try {
      const res = await apiClient.post('/attendance/mark', {
        attendanceSessionId: session.id,
        studentId,
        attendanceStatus: status,
        remarks: `Marked as ${status}`,
      });
      if (res.data.success) {
        fetchSessionDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update student attendance status.');
    }
  };

  // Delete session handler
  const handleDeleteSession = async () => {
    if (!session) return;
    const confirmAction = window.confirm('Are you sure you want to delete this attendance session? All related records will be lost.');
    if (!confirmAction) return;

    try {
      const res = await apiClient.delete(`/attendance/${session.id}`);
      if (res.data.success) {
        toast.success('Session deleted successfully.');
        navigate('/attendance');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  // Open Edit Details form for a student
  const handleOpenEditModal = (rec: AttendanceRecord) => {
    setActiveEditRecordId(rec.id);
    setEditStatus(rec.attendanceStatus);
    setEditRemarks(rec.remarks || '');
    setEditArrivalTime(rec.arrivalTime || '');
    setEditReason('');
  };

  // Save student detail modifications
  const handleSaveEdit = async (studentId: number) => {
    if (!session) return;
    try {
      const res = await apiClient.post('/attendance/mark', {
        attendanceSessionId: session.id,
        studentId,
        attendanceStatus: editStatus,
        remarks: editRemarks,
        arrivalTime: editArrivalTime || undefined,
        editReason: editReason || undefined,
      });

      if (res.data.success) {
        toast.success('Student attendance modified.');
        setActiveEditRecordId(null);
        fetchSessionDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to edit record.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
        <p className="text-sm font-medium text-slate-500 font-sans">Compiling attendance log sheets...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500 font-mono">Log sheet could not be fetched.</p>
      </div>
    );
  }

  const isLocked = session.sessionStatus === 'Locked';

  // Filter and search calculations
  const filteredRecords = session.attendanceRecords.filter((rec) => {
    const name = `${rec.student.user.firstName} ${rec.student.user.lastName}`.toLowerCase();
    const roll = rec.student.rollNumber.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || roll.includes(searchQuery.toLowerCase());

    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && rec.attendanceStatus === statusFilter;
  });

  const presentCount = session.attendanceRecords.filter(r => r.attendanceStatus === 'Present').length;
  const absentCount = session.attendanceRecords.filter(r => r.attendanceStatus === 'Absent').length;
  const lateCount = session.attendanceRecords.filter(r => r.attendanceStatus === 'Late').length;
  const excusedCount = session.attendanceRecords.filter(r => r.attendanceStatus === 'Excused').length;

  return (
    <PageContainer title="Attendance Session Sheet">
      <div className="space-y-6">
        {/* BACK NAVIGATION AND TITLE */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/attendance"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium font-sans"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Attendance Dashboard
          </Link>

          {(isAdmin || isTeacher) && (
            <div className="flex items-center gap-2">
              <Button
                id="toggle-lock-btn"
                onClick={handleToggleLock}
                className={`px-3 py-1.5 text-xs font-sans flex items-center gap-1.5 ${
                  isLocked ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {isLocked ? (
                  <>
                    <Unlock className="h-3.5 w-3.5" /> Unlock Session
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" /> Lock Session
                  </>
                )}
              </Button>

              <Button
                id="delete-session-btn"
                onClick={handleDeleteSession}
                variant="outline"
                className="px-3 py-1.5 text-xs font-sans text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Session
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LECTURE DETAIL BOX */}
          <div className="space-y-6">
            <Card id="session-metadata" className="border border-slate-200 p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                  {session.courseOffering.courseCode}
                </span>
                <h3 className="text-lg font-sans font-medium text-slate-900 mt-2">
                  {session.courseOffering.subject.name}
                </h3>
                <p className="text-xs text-slate-500">Managed by {session.teacher.user.firstName} {session.teacher.user.lastName}</p>
              </div>

              <div className="space-y-3 text-xs text-slate-600 font-sans">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    <strong>Date:</strong> {new Date(session.attendanceDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>
                    <strong>Time:</strong> {session.startTime} - {session.endTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>
                    <strong>Section:</strong> Section {session.section.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span>
                    <strong>Room:</strong> Room {session.room.roomNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-slate-400" />
                  <span>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`font-mono font-bold ${
                        isLocked ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {session.sessionStatus}
                    </span>
                  </span>
                </div>
              </div>

              {session.notes && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 font-sans">
                  <strong>Notes:</strong> {session.notes}
                </div>
              )}
            </Card>

            {/* QR CODE CONTROLS CARD */}
            {(isAdmin || isTeacher) && (
              <Card id="qr-generation-controls" className="border border-slate-200 p-6 space-y-4 bg-slate-50">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-sm font-sans font-medium text-slate-900">Lecture QR Access Token</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Generate an active check-in token for students to sign in directly from their devices.
                </p>

                {!isLocked && (
                  <div className="flex items-center gap-2">
                    <select
                      value={qrExpiryMinutes}
                      onChange={(e) => setQrExpiryMinutes(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 flex-1"
                    >
                      <option value={2}>2 Minutes Expiry</option>
                      <option value={5}>5 Minutes Expiry</option>
                      <option value={10}>10 Minutes Expiry</option>
                      <option value={15}>15 Minutes Expiry</option>
                    </select>

                    <Button
                      id="gen-qr-btn"
                      onClick={handleGenerateQr}
                      className="px-3 py-1.5 text-xs font-sans bg-slate-950 text-white hover:bg-slate-800"
                    >
                      Generate Check-In
                    </Button>
                  </div>
                )}

                {session.qrCodeToken && (
                  <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-3 text-center">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ACTIVE PASSCODE</p>
                    <p className="text-xl font-mono font-bold tracking-widest text-indigo-600 select-all">
                      {session.qrCodeToken}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-100">
                      <span>Countdown:</span>
                      <span className={`font-bold ${qrCountdown === 'EXPIRED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {qrCountdown || 'Calculating...'}
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-400 font-sans">
                      Students can paste this token into their check-in field to register.
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* ACTIVE SHEET LISTING */}
          <div className="lg:col-span-2 space-y-6">
            <Card id="log-sheet-list" className="border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-sans font-medium text-slate-900">Roster Check-In Logs</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>Total: {session.attendanceRecords.length} students</span>
                    <span className="text-emerald-600 font-medium">Present: {presentCount}</span>
                    <span className="text-amber-600 font-medium">Late: {lateCount}</span>
                    <span className="text-rose-600 font-medium">Absent: {absentCount}</span>
                    <span className="text-indigo-600 font-medium">Excused: {excusedCount}</span>
                  </div>
                </div>

                {!isLocked && (isAdmin || isTeacher) && (
                  <Button
                    id="mark-all-present-btn"
                    onClick={handleMarkAllPresent}
                    variant="outline"
                    className="px-3 py-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-sans flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark All Present
                  </Button>
                )}
              </div>

              {/* SEARCH AND FILTERS */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="All">All statuses</option>
                  <option value="Present">Present Only</option>
                  <option value="Absent">Absent Only</option>
                  <option value="Late">Late Only</option>
                  <option value="Excused">Excused Only</option>
                </select>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 border border-dashed border-slate-100 rounded-xl">
                  <Search className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-sans">No matching student logs found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1">
                  {filteredRecords.map((rec) => {
                    const isEditingThis = activeEditRecordId === rec.id;

                    return (
                      <div key={rec.id} className="py-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-400 font-bold">
                                {rec.student.rollNumber}
                              </span>
                              <span className="font-sans font-medium text-slate-900">
                                {rec.student.user.firstName} {rec.student.user.lastName}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-mono">
                              <span>{rec.student.user.email}</span>
                              {rec.arrivalTime && (
                                <span className="flex items-center gap-0.5 text-slate-600 font-semibold">
                                  <Clock3 className="h-3 w-3" /> Arrived: {rec.arrivalTime}
                                </span>
                              )}
                              {rec.remarks && (
                                <span className="text-slate-600 font-sans italic">
                                  "{rec.remarks}"
                                </span>
                              )}
                            </div>
                          </div>

                          {/* TOGGLE PILLS OR ACTIVE STATUS */}
                          <div className="flex items-center gap-2">
                            {isLocked || (!isAdmin && !isTeacher) ? (
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
                            ) : (
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full p-0.5">
                                {['Present', 'Late', 'Absent', 'Excused'].map((st) => (
                                  <button
                                    key={st}
                                    id={`status-toggle-${rec.student.id}-${st.toLowerCase()}`}
                                    onClick={() => handleStatusChange(rec.student.id, st)}
                                    className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold transition duration-150 ${
                                      rec.attendanceStatus === st
                                        ? st === 'Present'
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : st === 'Late'
                                          ? 'bg-amber-500 text-white shadow-sm'
                                          : st === 'Excused'
                                          ? 'bg-indigo-600 text-white shadow-sm'
                                          : 'bg-rose-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {st[0]}
                                  </button>
                                ))}
                              </div>
                            )}

                            {!isLocked && (isAdmin || isTeacher) && !isEditingThis && (
                              <Button
                                id={`edit-details-btn-${rec.id}`}
                                onClick={() => handleOpenEditModal(rec)}
                                variant="outline"
                                className="px-2 py-1 h-7 text-[10px] font-sans text-slate-500 hover:text-slate-900 border-slate-200"
                              >
                                Edit Details
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* EXPANDED DETAILED MANUALLY EDITED FORM */}
                        {isEditingThis && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                            <h4 className="text-xs font-mono font-bold text-slate-700">EDIT ATTENDANCE RECORD DETAILED DETAILS</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                                  Status
                                </label>
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                                >
                                  <option value="Present">Present</option>
                                  <option value="Absent">Absent</option>
                                  <option value="Late">Late</option>
                                  <option value="Excused">Excused</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                                  Arrival Time
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 09:15"
                                  value={editArrivalTime}
                                  onChange={(e) => setEditArrivalTime(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                                  Remarks
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Scanned QR, Late bus"
                                  value={editRemarks}
                                  onChange={(e) => setEditRemarks(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                                Reason for manual edit
                              </label>
                              <input
                                type="text"
                                placeholder="Required for regulatory audit logs..."
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                id={`cancel-edit-${rec.id}`}
                                onClick={() => setActiveEditRecordId(null)}
                                variant="outline"
                                className="px-2.5 py-1 text-[10px] h-7 font-sans text-slate-500 border-slate-200"
                              >
                                Cancel
                              </Button>
                              <Button
                                id={`save-edit-${rec.id}`}
                                onClick={() => handleSaveEdit(rec.student.id)}
                                className="px-2.5 py-1 text-[10px] h-7 font-sans bg-slate-900 text-white hover:bg-slate-800"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AttendanceSessionPage;
