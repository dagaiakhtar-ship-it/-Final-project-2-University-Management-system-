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
  GraduationCap,
  Users,
  Calendar,
  FileText,
  Building2,
  Award,
  ClipboardCheck,
  Clock,
  MapPin,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { DemoRestoreCard } from '../../components/common/DemoRestoreCard';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0,
    departmentsCount: 0,
    timetableCount: 0,
    roomsCount: 0
  });
  const [masterTimetable, setMasterTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminMetrics = async () => {
      try {
        setLoading(true);

        const [stRes, tcRes, dpRes, ttRes, rmRes] = await Promise.allSettled([
          apiClient.get('/students', { params: { limit: 1 } }),
          apiClient.get('/teachers', { params: { limit: 1 } }),
          apiClient.get('/departments', { params: { limit: 1 } }),
          apiClient.get('/timetable', { params: { limit: 10 } }),
          apiClient.get('/rooms', { params: { limit: 1 } }),
        ]);

        const getCount = (res: any) => {
          if (res.status === 'fulfilled') {
            return res.value.data?.data?.total || res.value.data?.total || 0;
          }
          return 0;
        };

        const getList = (res: any) => {
          if (res.status === 'fulfilled') {
            return res.value.data?.data?.timetables || res.value.data?.data || [];
          }
          return [];
        };

        setStats({
          studentsCount: getCount(stRes),
          teachersCount: getCount(tcRes),
          departmentsCount: getCount(dpRes),
          timetableCount: getCount(ttRes),
          roomsCount: getCount(rmRes),
        });

        const ttList = getList(ttRes);
        setMasterTimetable(Array.isArray(ttList) ? ttList : []);

      } catch (err) {
        console.error('Error loading admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminMetrics();
  }, []);

  const lastLoginFormatted = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : 'First session today';

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto" id="admin-dashboard-container">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-md border border-slate-800">
        <div className="flex flex-col gap-2.5">
          <div className="inline-flex items-center gap-2 bg-emerald-950 text-emerald-400 font-mono text-xs font-bold px-3 py-1 rounded-full w-max border border-emerald-800">
            <ClipboardCheck className="h-4 w-4" /> CAMPUS ADMINISTRATION
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight">
            Welcome back, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Oversee university academic operations, manage student enrollment records, inspect master lecture timetables, and audit faculty workloads.
          </p>
          <div className="text-[11px] text-slate-400 font-mono mt-1 border-t border-slate-800/80 pt-2.5 flex items-center gap-4">
            <span>Admin Role: <strong className="text-emerald-400 uppercase">{user?.role}</strong></span>
            <span>•</span>
            <span>Last session: {lastLoginFormatted}</span>
          </div>
        </div>
      </div>

      {/* Demo Baseline & System Restore Card */}
      <DemoRestoreCard />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Active Students</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{stats.studentsCount}</div>
          <Link to={ROUTES.STUDENTS} className="text-[11px] text-emerald-600 font-medium hover:underline mt-1 flex items-center gap-1">
            Student Directory <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Faculty Members</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{stats.teachersCount}</div>
          <Link to={ROUTES.TEACHERS} className="text-[11px] text-indigo-600 font-medium hover:underline mt-1 flex items-center gap-1">
            Faculty Directory <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Academic Departments</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{stats.departmentsCount}</div>
          <Link to={ROUTES.DEPARTMENTS} className="text-[11px] text-amber-600 font-medium hover:underline mt-1 flex items-center gap-1">
            Departments <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Timetable Schedule Slots</span>
            <Calendar className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{stats.timetableCount}</div>
          <Link to={ROUTES.TIMETABLE} className="text-[11px] text-rose-600 font-medium hover:underline mt-1 flex items-center gap-1">
            Master Timetable <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Master Timetable Inspector Card */}
      <Card className="p-6 border border-slate-200/90 rounded-2xl shadow-sm bg-white flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Master Campus Timetable Preview</h2>
              <p className="text-xs text-slate-500">Live feed of scheduled classes across all university sections and halls</p>
            </div>
          </div>
          <Link to={ROUTES.TIMETABLE}>
            <Button size="sm" variant="outline" className="text-xs gap-1 rounded-xl">
              Manage All Timetables <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading schedule...</div>
        ) : masterTimetable.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No timetable entries configured.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {masterTimetable.slice(0, 6).map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>{item.subject?.name || item.courseOffering?.courseCode || 'Lecture'}</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {item.timeSlot?.dayOfWeek}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {item.timeSlot?.startTime} - {item.timeSlot?.endTime}
                </div>
                <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span>Section: {item.section?.code || item.section?.name || 'A'}</span>
                  <span className="font-mono font-bold text-slate-800">{item.room?.roomNumber || 'Room'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
