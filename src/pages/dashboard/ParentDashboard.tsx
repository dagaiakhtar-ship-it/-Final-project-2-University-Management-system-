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
  Users,
  GraduationCap,
  Calendar,
  Clock,
  UserCheck,
  Award,
  DollarSign,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

interface StudentWard {
  id: number;
  uuid: string;
  registrationNumber: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  department?: { id: number; name: string; code: string };
  program?: { id: number; name: string; code: string };
  section?: { id: number; name: string; code: string };
  semester?: { id: number; name: string; code: string };
}

interface ParentProfile {
  id: number;
  uuid: string;
  relation: string;
  occupation: string | null;
  students: StudentWard[];
}

interface TimetableItem {
  id: number;
  uuid: string;
  status: string;
  subject?: { name: string; code: string };
  teacher?: { user: { firstName: string; lastName: string } };
  room?: { roomNumber: string; building?: { code: string } };
  timeSlot?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    periodNumber: number;
  };
}

export const ParentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [selectedWardIndex, setSelectedWardIndex] = useState<number>(0);
  const [wardTimetable, setWardTimetable] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  });

  useEffect(() => {
    const loadParentData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);

        // 1. Fetch Parent Profile and linked wards
        let parentData: ParentProfile | null = null;
        try {
          const profRes = await apiClient.get(`/users/${user.id}/parent-profile`);
          if (profRes.data?.data) {
            parentData = profRes.data.data;
          }
        } catch (e) {
          // Fallback parent lookup
          const searchRes = await apiClient.get('/parents', { params: { search: user.email, limit: 1 } });
          const raw = searchRes.data?.data?.parents || searchRes.data?.parents || searchRes.data?.data;
          if (Array.isArray(raw) && raw.length > 0) {
            parentData = raw[0];
          }
        }

        if (parentData) {
          setParent(parentData);
          
          // 2. Load selected ward timetable
          const ward = parentData.students?.[selectedWardIndex];
          if (ward?.uuid) {
            try {
              const ttRes = await apiClient.get(`/students/${ward.uuid}/timetable`);
              const ttRaw = ttRes.data?.data || ttRes.data || [];
              setWardTimetable(Array.isArray(ttRaw) ? ttRaw : []);
            } catch (err) {
              if (ward.section?.id) {
                const secTt = await apiClient.get('/timetable', { params: { sectionId: ward.section.id, limit: 50 } });
                const ttRaw = secTt.data?.data?.timetables || secTt.data?.data || [];
                setWardTimetable(Array.isArray(ttRaw) ? ttRaw : []);
              }
            }
          }
        } else {
          // Fallback sample timetable
          const fallbackTt = await apiClient.get('/timetable', { params: { limit: 10 } });
          const ttRaw = fallbackTt.data?.data?.timetables || fallbackTt.data?.data || [];
          setWardTimetable(Array.isArray(ttRaw) ? ttRaw : []);
        }

      } catch (err) {
        console.error('Error loading parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadParentData();
  }, [user, selectedWardIndex]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentWard = parent?.students?.[selectedWardIndex];

  // Filter timetable for current ward & selected day
  const filteredDayTimetable = wardTimetable.filter(
    item => item.timeSlot?.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase()
  );

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto" id="parent-dashboard-container">
      {/* Guardian Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-md border border-slate-800">
        <div className="flex flex-col gap-2.5">
          <div className="inline-flex items-center gap-2 bg-emerald-950/80 text-emerald-400 font-mono text-xs font-bold px-3 py-1 rounded-full w-max border border-emerald-800/80">
            <Users className="h-4 w-4" /> PARENT & GUARDIAN PORTAL
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Monitor your student ward's academic timetable, class attendance registers, term exam results, and fee accounts.
          </p>
        </div>

        {/* Parent Identity Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shrink-0 min-w-[240px] flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base border border-emerald-500/30">
              {user?.firstName?.[0] || 'P'}{user?.lastName?.[0] || 'G'}
            </div>
            <div>
              <div className="text-xs font-bold text-white">{user?.firstName} {user?.lastName}</div>
              <div className="text-[10px] font-mono text-slate-400">Relation: {parent?.relation || 'Guardian'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ward Selector Tabs */}
      {parent && parent.students && parent.students.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Student Ward:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {parent.students.map((st, idx) => {
              const isSelected = selectedWardIndex === idx;
              const name = st.user ? `${st.user.firstName} ${st.user.lastName}` : `Ward #${st.id}`;
              return (
                <button
                  key={st.id || idx}
                  onClick={() => setSelectedWardIndex(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{name}</span>
                  <span className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded">
                    {st.registrationNumber}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ward's Personal Timetable Card */}
      <Card className="p-6 border border-slate-200/90 rounded-2xl shadow-sm bg-white flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {currentWard?.user ? `${currentWard.user.firstName}'s` : "Ward's"} Weekly Class Timetable
              </h2>
              <p className="text-xs text-slate-500">
                Department: {currentWard?.department?.name || 'Academic Dept'} • Section: {currentWard?.section?.code || 'A'}
              </p>
            </div>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay.toLowerCase() === day.toLowerCase();
            const count = wardTimetable.filter(t => t.timeSlot?.dayOfWeek?.toLowerCase() === day.toLowerCase()).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{day}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timetable Slot List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Loading ward timetable...</span>
          </div>
        ) : filteredDayTimetable.length === 0 ? (
          <div className="py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
            <Clock className="w-8 h-8 text-slate-300" />
            <h4 className="text-xs font-bold text-slate-700">No Classes Scheduled for {selectedDay}</h4>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Your ward has no scheduled lecture periods on {selectedDay}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDayTimetable.map((slot) => (
              <div
                key={slot.id || slot.uuid}
                className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-xs font-mono text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {slot.timeSlot?.startTime} - {slot.timeSlot?.endTime}
                  </span>
                  <span>Period {slot.timeSlot?.periodNumber || 1}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{slot.subject?.name || 'Class Period'}</h3>
                  <div className="text-xs font-mono text-slate-500">{slot.subject?.code}</div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                  <span>Instructor: {slot.teacher?.user ? `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}` : 'Faculty'}</span>
                  <span className="font-mono font-bold text-slate-800">{slot.room?.roomNumber || 'Room 101'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
