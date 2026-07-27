/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  BookOpen,
  Calendar,
  Award,
  CheckSquare,
  Clock,
  User,
  GraduationCap,
  Building2,
  MapPin,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react';

interface StudentProfile {
  id: number;
  uuid: string;
  registrationNumber: string;
  status: string;
  department?: { id: number; name: string; code: string };
  program?: { id: number; name: string; code: string };
  section?: { id: number; name: string; code: string };
  semester?: { id: number; name: string; code: string; semesterNumber: number };
  currentCgpa?: number;
}

interface TimetableItem {
  id: number;
  uuid: string;
  academicYear: string;
  session: string;
  status: string;
  courseOffering?: {
    courseCode: string;
  };
  subject?: {
    name: string;
    code: string;
    creditHours?: number;
    subjectType?: string;
  };
  section?: {
    name: string;
    code: string;
  };
  teacher?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  room?: {
    roomNumber: string;
    roomType: string;
    building?: {
      name: string;
      code: string;
    };
  };
  timeSlot?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    periodNumber: number;
  };
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  });

  useEffect(() => {
    const loadStudentData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        // 1. Fetch Student Profile
        let studentData: StudentProfile | null = null;
        try {
          const profRes = await apiClient.get(`/users/${user.id}/student-profile`);
          if (profRes.data?.data) {
            studentData = profRes.data.data;
          }
        } catch (e) {
          // Fallback search
          const searchRes = await apiClient.get('/students', { params: { search: user.email, limit: 1 } });
          const raw = searchRes.data?.data?.students || searchRes.data?.students || searchRes.data?.data;
          if (Array.isArray(raw) && raw.length > 0) {
            studentData = raw[0];
          }
        }

        if (studentData) {
          setProfile(studentData);

          // 2. Fetch Personal Timetable using student uuid or section
          try {
            const ttRes = await apiClient.get(`/students/${studentData.uuid}/timetable`);
            const ttRaw = ttRes.data?.data || ttRes.data || [];
            setTimetable(Array.isArray(ttRaw) ? ttRaw : []);
          } catch (ttErr) {
            if (studentData.section?.id) {
              const secTt = await apiClient.get('/timetable', { params: { sectionId: studentData.section.id, limit: 50 } });
              const secRaw = secTt.data?.data?.timetables || secTt.data?.data || [];
              setTimetable(Array.isArray(secRaw) ? secRaw : []);
            }
          }

          // 3. Fetch Course Enrollments
          try {
            const enrRes = await apiClient.get('/enrollments', { params: { studentId: studentData.id } });
            const enrRaw = enrRes.data?.data?.enrollments || enrRes.data?.data || [];
            setEnrollments(Array.isArray(enrRaw) ? enrRaw : []);
          } catch (enrErr) {
            console.warn('Enrollments fetch error', enrErr);
          }
        } else {
          // Fallback master timetable query for student overview
          const masterTt = await apiClient.get('/timetable', { params: { limit: 10 } });
          const ttRaw = masterTt.data?.data?.timetables || masterTt.data?.data || [];
          setTimetable(Array.isArray(ttRaw) ? ttRaw : []);
        }

        // 4. Fetch Assignments
        try {
          const assRes = await apiClient.get('/assignments', { params: { limit: 5 } });
          const assRaw = assRes.data?.data?.assignments || assRes.data?.data || [];
          setAssignments(Array.isArray(assRaw) ? assRaw : []);
        } catch (assErr) {
          console.warn('Assignments fetch error', assErr);
        }

      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [user]);

  const lastLoginFormatted = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : 'First session today';

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Filter timetable entries for selected day
  const filteredDayTimetable = timetable.filter(
    item => item.timeSlot?.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase()
  );

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto" id="student-dashboard-container">
      {/* Personal Identity Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-md border border-slate-800">
        <div className="flex flex-col gap-2.5">
          <div className="inline-flex items-center gap-2 bg-amber-950/80 text-amber-400 font-mono text-xs font-bold px-3 py-1 rounded-full w-max border border-amber-800/80">
            <GraduationCap className="h-4 w-4" /> STUDENT ACADEMIC DESK
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight">
            Welcome back, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {profile ? (
              <>
                Enrolled in <span className="text-amber-300 font-semibold">{profile.program?.name || 'Academic Degree'}</span> • Section <span className="text-amber-300 font-semibold">{profile.section?.code || profile.section?.name || 'A'}</span> • Semester <span className="text-amber-300 font-semibold">{profile.semester?.semesterNumber || 1}</span>
              </>
            ) : (
              'Access your personal lecture timetable, enrolled course modules, tutorial attendance percentages, and pending assignments.'
            )}
          </p>
          <div className="text-[11px] text-slate-400 font-mono mt-1 border-t border-slate-800/80 pt-2.5 flex items-center gap-4">
            <span>Registration ID: <strong className="text-white">{profile?.registrationNumber || `STD-${user?.id || '001'}`}</strong></span>
            <span>•</span>
            <span>Last login: {lastLoginFormatted}</span>
          </div>
        </div>

        {/* Quick Profile Summary Badge */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shrink-0 min-w-[240px] flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base border border-amber-500/30">
              {user?.firstName?.[0] || 'S'}{user?.lastName?.[0] || 'T'}
            </div>
            <div>
              <div className="text-xs font-bold text-white">{user?.firstName} {user?.lastName}</div>
              <div className="text-[10px] font-mono text-slate-400">{user?.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-700/60 text-center text-[10px] font-mono">
            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Status</span>
              <span className="text-emerald-400 font-bold uppercase">{profile?.status || 'Active'}</span>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Department</span>
              <span className="text-amber-300 font-bold truncate">{profile?.department?.code || 'CS'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Personal Timetable Section */}
      <Card className="p-6 border border-slate-200/90 rounded-2xl shadow-sm bg-white flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                My Personal Weekly Timetable
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                  Section {profile?.section?.code || profile?.section?.name || 'All'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Weekly scheduled lectures, tutorial blocks, lab locations, and assigned instructors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={ROUTES.TIMETABLE}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-xl">
                Full Calendar Schedule <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay.toLowerCase() === day.toLowerCase();
            const count = timetable.filter(t => t.timeSlot?.dayOfWeek?.toLowerCase() === day.toLowerCase()).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{day}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timetable Slots Table / Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Loading personal timetable...</span>
          </div>
        ) : filteredDayTimetable.length === 0 ? (
          <div className="py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
            <Clock className="w-8 h-8 text-slate-300" />
            <h4 className="text-xs font-bold text-slate-700">No Scheduled Lectures for {selectedDay}</h4>
            <p className="text-[11px] text-slate-500 max-w-sm">
              You have no active class periods assigned on {selectedDay}. Enjoy your revision or library study time!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDayTimetable.map((slot) => (
              <div
                key={slot.id || slot.uuid}
                className="bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-amber-300 transition-all rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs group"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {slot.timeSlot?.startTime} - {slot.timeSlot?.endTime}
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-200/80 text-slate-700 font-semibold rounded">
                    Period {slot.timeSlot?.periodNumber || 1}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {slot.subject?.name || slot.courseOffering?.courseCode || 'Subject Session'}
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    Code: <span className="font-bold text-slate-800">{slot.subject?.code || slot.courseOffering?.courseCode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {slot.teacher?.user ? `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}` : 'Assigned Lecturer'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 justify-end">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-mono font-bold text-slate-800 truncate">
                      {slot.room ? `${slot.room.roomNumber} (${slot.room.building?.code || 'Hall'})` : 'Main Hall'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Grid: My Courses & Enrolled Modules + Assignments & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Academic Modules */}
        <Card className="p-5 border border-slate-200/90 rounded-2xl shadow-xs bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">My Enrolled Courses</h3>
            </div>
            <Link to={ROUTES.ENROLLMENTS}>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:bg-indigo-50">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No active course enrollments recorded.
            </div>
          ) : (
            <div className="space-y-2.5">
              {enrollments.slice(0, 4).map((enr: any) => (
                <div key={enr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{enr.courseOffering?.subject?.name || enr.courseOffering?.courseCode || 'Academic Course'}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Code: {enr.courseOffering?.courseCode} • Credits: {enr.courseOffering?.subject?.creditHours || 3}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold rounded-full uppercase">
                    {enr.status || 'Enrolled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Assignments & Academic Tasks */}
        <Card className="p-5 border border-slate-200/90 rounded-2xl shadow-xs bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Assignments & Due Work</h3>
            </div>
            <Link to={ROUTES.ASSIGNMENTS}>
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:bg-emerald-50">
                Submissions <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {assignments.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No pending assignment submissions.
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignments.slice(0, 4).map((ass: any) => (
                <div key={ass.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start justify-between text-xs">
                  <div className="flex flex-col gap-0.5">
                    <div className="font-bold text-slate-900">{ass.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Due Date: {ass.dueDate ? new Date(ass.dueDate).toLocaleDateString() : 'Next Week'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold rounded-full uppercase shrink-0">
                    {ass.status || 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
