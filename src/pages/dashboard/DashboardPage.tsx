/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { AdminDashboard } from './AdminDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentDashboard } from './StudentDashboard';
import { ParentDashboard } from './ParentDashboard';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const userRole = user?.role?.toUpperCase();

  switch (userRole) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    case 'PARENT':
      return <ParentDashboard />;
    default:
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center" id="unknown-role-error-container">
          <div className="p-3 bg-red-50 text-red-600 rounded-full border border-red-100">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-sm">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Unknown Account Role</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              We could not resolve your academic account role ({user?.role || 'None'}). Please contact the university administration office to restore database parameters.
            </p>
          </div>
        </div>
      );
  }
};
