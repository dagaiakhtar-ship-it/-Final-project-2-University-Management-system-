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
  UserCheck,
  FileEdit,
  Clock,
  User,
  Building,
  MapPin,
  Users,
  ChevronRight,
  ExternalLink,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TeacherProfile {
  id: number;
  uuid: string;
  employeeId: string;
  designation: string | null;
  status: string;
  department?: { id: number; name: string; code: string };
}

interface TimetableItem {
  id: number;
  uuid: string;
  academicYear: string;
  session: string;
  status: string;
  courseOffering?: {
    courseCode: string;
    currentEnrollment?: number;
  };
  subject?: {
    name: string;
    code: string;
    creditHours?: number;
  };
  section?: {
    name: string;
    code: string;
    currentStrength?: number;
  };
  room?: {
    roomNumber: string;
    roomType: string;
    capacity?: number;
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

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  });

  useEffect(() => {
    const loadTeacherData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);

        // 1. Fetch Teacher Profile
        let teacherData: TeacherProfile | null = null;
        try {
          const profRes = await apiClient.get(`/users/${user.id}/teacher-profile`);
          if (profRes.data?.data) {
            teacherData = profRes.data.data;
          }
        } catch (err) {
          // Fallback teacher search
          const searchRes = await apiClient.get('/teachers', { params: { search: user.email, limit: 1 } });
          const raw = searchRes.data?.data?.teachers || searchRes.data?.teachers || searchRes.data?.data;
          if (Array.isArray(raw) && raw.length > 0) {
            teacherData = raw[0];
          }
        }

        if (teacherData) {
          setProfile(teacherData);

          // 2. Fetch Teacher Personal Teaching Schedule
          try {
            const ttRes = await apiClient.get(`/teachers/${teacherData.uuid}/timetable`);
            const ttRaw = ttRes.data?.data || ttRes.data || [];
            setTimetable(Array.isArray(ttRaw) ? ttRaw : []);
          } catch (ttErr) {
            const queryTt = await apiClient.get('/timetable', { params: { teacherId: teacherData.id, limit: 50 } });
            const ttRaw = queryTt.data?.data?.timetables || queryTt.data?.data || [];
            setTimetable(Array.isArray(ttRaw) ? ttRaw : []);
          }
        } else {
          // Fallback master timetable
          const queryTt = await apiClient.get('/timetable', { params: { limit: 20 } });
          const ttRaw = queryTt.data?.data?.timetables || queryTt.data?.data || [];
          setTimetable(Array.isArray(ttRaw) ? ttRaw : []);
        }

        // 3. Fetch Assignments created or assigned
        try {
          const assRes = await apiClient.get('/assignments', { params: { limit: 5 } });
          const assRaw = assRes.data?.data?.assignments || assRes.data?.data || [];
          setAssignments(Array.isArray(assRaw) ? assRaw : []);
        } catch (e) {
          console.warn('Assignments fetch error', e);
        }

      } catch (err) {
        console.error('Error loading teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [user]);

  const lastLoginFormatted = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : 'First session today';

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Filter lecture slots for selected day
  const filteredDayTimetable = timetable.filter(
    item => item.timeSlot?.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase()
  );

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto" id="teacher-dashboard-container">
      {/* Faculty Member Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-md border border-slate-800">
        <div className="flex flex-col gap-2.5">
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 text-indigo-400 font-mono text-xs font-bold px-3 py-1 rounded-full w-max border border-indigo-800/80">
            <BookOpen className="h-4 w-4" /> FACULTY ACADEMICS PORTAL
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight">
            Welcome back, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {profile ? (
              <>
                <span className="text-indigo-300 font-semibold">{profile.designation || 'Faculty Member'}</span> • Department of <span className="text-indigo-300 font-semibold">{profile.department?.name || 'Academic Studies'}</span> • Employee ID <span className="text-indigo-300 font-semibold">{profile.employeeId}</span>
              </>
            ) : (
              'Manage your assigned lecture schedule, record classroom attendance, upload course syllabi, and grade student submissions.'
            )}
          </p>
          <div className="text-[11px] text-slate-400 font-mono mt-1 border-t border-slate-800/80 pt-2.5 flex items-center gap-4">
            <span>Faculty ID: <strong className="text-white">{profile?.employeeId || `EMP-${user?.id || '101'}`}</strong></span>
            <span>•</span>
            <span>Last session: {lastLoginFormatted}</span>
          </div>
        </div>

        {/* Faculty Status Badge */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shrink-0 min-w-[240px] flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base border border-indigo-500/30">
              {user?.firstName?.[0] || 'F'}{user?.lastName?.[0] || 'M'}
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
              <span className="text-slate-400 block">Dept Code</span>
              <span className="text-indigo-300 font-bold truncate">{profile?.department?.code || 'FAC'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Teaching Timetable */}
      <Card className="p-6 border border-slate-200/90 rounded-2xl shadow-sm bg-white flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                My Teaching Lecture Timetable
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                  {timetable.length} Assigned Slots
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                View your allocated class lectures, tutorial halls, and assigned section groups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={ROUTES.TIMETABLE}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-xl">
                Master Schedule <ExternalLink className="w-3.5 h-3.5" />
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
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{day}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-200 text-slate-600'
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
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Loading faculty schedule...</span>
          </div>
        ) : filteredDayTimetable.length === 0 ? (
          <div className="py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
            <Clock className="w-8 h-8 text-slate-300" />
            <h4 className="text-xs font-bold text-slate-700">No Lectures Scheduled for {selectedDay}</h4>
            <p className="text-[11px] text-slate-500 max-w-sm">
              You have no active teaching slots assigned on {selectedDay}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDayTimetable.map((slot) => (
              <div
                key={slot.id || slot.uuid}
                className="bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-indigo-300 transition-all rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs group"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-indigo-900 bg-indigo-100/80 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    {slot.timeSlot?.startTime} - {slot.timeSlot?.endTime}
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-200/80 text-slate-700 font-semibold rounded">
                    Period {slot.timeSlot?.periodNumber || 1}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {slot.subject?.name || slot.courseOffering?.courseCode || 'Teaching Session'}
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    Section: <span className="font-bold text-slate-800">{slot.section?.name || slot.section?.code || 'Group A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {slot.section?.currentStrength || slot.courseOffering?.currentEnrollment || 30} Students
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 justify-end">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
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

      {/* Faculty Quick Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={ROUTES.ATTENDANCE}>
          <Card className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all bg-white flex items-center gap-3.5 shadow-2xs group">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Record Attendance</h3>
              <p className="text-[11px] text-slate-500">Mark student roll-calls</p>
            </div>
          </Card>
        </Link>

        <Link to={ROUTES.RESULTS}>
          <Card className="p-4 border border-slate-200 rounded-xl hover:border-emerald-300 transition-all bg-white flex items-center gap-3.5 shadow-2xs group">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Submit Marks</h3>
              <p className="text-[11px] text-slate-500">Gradebooks & exams</p>
            </div>
          </Card>
        </Link>

        <Link to={ROUTES.ASSIGNMENTS}>
          <Card className="p-4 border border-slate-200 rounded-xl hover:border-amber-300 transition-all bg-white flex items-center gap-3.5 shadow-2xs group">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Create Assignment</h3>
              <p className="text-[11px] text-slate-500">Post new homework prompt</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};
