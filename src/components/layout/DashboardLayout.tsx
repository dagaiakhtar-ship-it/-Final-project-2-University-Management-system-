/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../dashboard/Sidebar';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { FloatingCopilot } from '../common/FloatingCopilot';

export const DashboardLayout: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" id="erp-dashboard-layout">
      {/* 1. Sidebar Navigation - Handles desktop side rails and mobile drawer overlays */}
      <Sidebar />

      {/* 2. Main Workspace Block */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header - Incorporates profile settings, breadcrumbs, notifications, and mobile hamburger */}
        <DashboardHeader />

        {/* Scrollable Viewport Content */}
        <main className="flex-grow overflow-y-auto bg-slate-50/50 flex flex-col justify-between">
          {/* Main Slot Page Entry */}
          <div className="flex-grow">
            <Outlet />
          </div>

          {/* Standardized Dashboard Footer */}
          <footer className="py-4 px-6 md:px-8 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider bg-white">
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2">
              <span>© {currentYear} Smart University ERP System. All rights reserved.</span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span>Classified Academic Security Protocol (C-ASP) v2.6.4</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Context-Aware AI Copilot Overlay */}
      <FloatingCopilot />
    </div>
  );
};
export default DashboardLayout;
