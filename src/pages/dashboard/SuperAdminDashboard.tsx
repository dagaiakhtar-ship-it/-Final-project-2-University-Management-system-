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
  Shield,
  Users,
  Building,
  Settings,
  Database,
  Activity,
  Key,
  GraduationCap,
  Calendar,
  ChevronRight,
  ExternalLink,
  Cpu,
  Server,
  Lock
} from 'lucide-react';

import { DemoRestoreCard } from '../../components/common/DemoRestoreCard';

export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    usersCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    timetableCount: 0,
    departmentsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuperAdminStats = async () => {
      try {
        setLoading(true);

        const [usrRes, stRes, tcRes, ttRes, dpRes] = await Promise.allSettled([
          apiClient.get('/users', { params: { limit: 1 } }),
          apiClient.get('/students', { params: { limit: 1 } }),
          apiClient.get('/teachers', { params: { limit: 1 } }),
          apiClient.get('/timetable', { params: { limit: 1 } }),
          apiClient.get('/departments', { params: { limit: 1 } }),
        ]);

        const getCount = (res: any) => {
          if (res.status === 'fulfilled') {
            return res.value.data?.data?.total || res.value.data?.total || 0;
          }
          return 0;
        };

        setStats({
          usersCount: getCount(usrRes),
          studentsCount: getCount(stRes),
          teachersCount: getCount(tcRes),
          timetableCount: getCount(ttRes),
          departmentsCount: getCount(dpRes),
        });

      } catch (err) {
        console.error('Error loading super admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSuperAdminStats();
  }, []);

  const lastLoginFormatted = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : 'First session today';

  const systemModules = [
    { title: 'Global System Settings', desc: 'Configure system-wide parameters, terms, and academic calendars.', icon: Settings, route: ROUTES.SETTINGS, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { title: 'User Identity & Security', desc: 'Manage user accounts, system roles, permissions, and status.', icon: Users, route: ROUTES.USERS, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { title: 'Master University Timetable', desc: 'Inspect and resolve campus-wide room and timetable allocations.', icon: Calendar, route: ROUTES.TIMETABLE, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { title: 'Departments & Buildings', desc: 'Manage physical infrastructure, lecture halls, and academic departments.', icon: Building, route: ROUTES.DEPARTMENTS, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { title: 'System Workflows & Rules', desc: 'Configure approval workflows, notifications, and security policies.', icon: Activity, route: ROUTES.WORKFLOW, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { title: 'Security & Audit Logs', desc: 'Inspect GRC compliance, audit logs, and access permissions.', icon: Shield, route: ROUTES.GRC, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  ];

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto" id="super-admin-dashboard-container">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-md border border-slate-800">
        <div className="flex flex-col gap-2.5">
          <div className="inline-flex items-center gap-2 bg-emerald-950 text-emerald-400 font-mono text-xs font-bold px-3 py-1 rounded-full w-max border border-emerald-800">
            <Shield className="h-4 w-4" /> SYSTEM SUPER ADMINISTRATION
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight">
            Welcome back, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Root system administration active. Full authority over user identity, system configurations, master academic timetables, and audit security logs.
          </p>
          <div className="text-[11px] text-slate-400 font-mono mt-1 border-t border-slate-800/80 pt-2.5 flex items-center gap-4">
            <span>Root SuperAdmin: <strong className="text-emerald-400">{user?.email}</strong></span>
            <span>•</span>
            <span>Last session: {lastLoginFormatted}</span>
          </div>
        </div>
      </div>

      {/* Demo Baseline & System Restore Card */}
      <DemoRestoreCard />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Total System Users</span>
          <div className="text-xl font-bold font-mono text-slate-900">{stats.usersCount}</div>
        </Card>
        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Enrolled Students</span>
          <div className="text-xl font-bold font-mono text-slate-900">{stats.studentsCount}</div>
        </Card>
        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Faculty Members</span>
          <div className="text-xl font-bold font-mono text-slate-900">{stats.teachersCount}</div>
        </Card>
        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Departments</span>
          <div className="text-xl font-bold font-mono text-slate-900">{stats.departmentsCount}</div>
        </Card>
        <Card className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Timetable Slots</span>
          <div className="text-xl font-bold font-mono text-slate-900">{stats.timetableCount}</div>
        </Card>
      </div>

      {/* Super Admin Control Modules */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">System Administration Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemModules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Link key={idx} to={m.route}>
                <Card className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all bg-white flex flex-col gap-3 group h-full justify-between">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${m.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{m.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
