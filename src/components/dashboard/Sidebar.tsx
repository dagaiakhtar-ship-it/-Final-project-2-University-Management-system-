/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building, BookOpen, Book, GraduationCap,
  ClipboardCheck, Award, Calendar, DollarSign, FileText, Settings, FileEdit,
  ChevronLeft, ChevronRight, LogOut, Bell, Hotel, Bus, ShoppingCart, Wrench,
  FlaskConical, Globe, Sparkles, Network, Terminal, Search, ShieldCheck, Smartphone
} from 'lucide-react';


import { useAuthStore } from '../../store/auth.store';
import { useDashboardStore } from '../../store/dashboard.store';
import { ROUTES } from '../../constants/routes.constants';
import { SidebarItem } from './SidebarItem';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    isSidebarCollapsed, 
    toggleSidebar, 
    isMobileSidebarOpen, 
    setMobileSidebarOpen 
  } = useDashboardStore();

  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  // 1. Sidebar menu config mapping per role
  const getSidebarMenuItems = () => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Users', path: ROUTES.USERS, icon: Users },
          { name: 'Departments', path: ROUTES.DEPARTMENTS, icon: Building },
          { name: 'Programs', path: ROUTES.PROGRAMS, icon: GraduationCap },
          { name: 'Semesters', path: ROUTES.SEMESTERS, icon: Calendar },
          { name: 'Sections', path: ROUTES.SECTIONS, icon: Users },
          { name: 'Courses', path: ROUTES.COURSES, icon: BookOpen },
          { name: 'Subjects', path: ROUTES.SUBJECTS, icon: Book },
          { name: 'Course Offerings', path: ROUTES.COURSE_OFFERINGS, icon: BookOpen },
          { name: 'Enrollments', path: ROUTES.ENROLLMENTS, icon: ClipboardCheck },
          { name: 'Teachers', path: ROUTES.TEACHERS, icon: Users },
          { name: 'Students', path: ROUTES.STUDENTS, icon: GraduationCap },
          { name: 'Parents', path: ROUTES.PARENTS, icon: Users },
          { name: 'Attendance', path: ROUTES.ATTENDANCE, icon: ClipboardCheck },
          { name: 'Leaves', path: ROUTES.LEAVES, icon: FileText },
          { name: 'Results', path: ROUTES.RESULTS, icon: Award },
          { name: 'Transcripts', path: ROUTES.TRANSCRIPTS, icon: FileText },
          { name: 'Degree Audit', path: ROUTES.DEGREE_AUDIT, icon: GraduationCap },
          { name: 'Alumni', path: ROUTES.ALUMNI, icon: Users },
          { name: 'Placements', path: ROUTES.PLACEMENT, icon: Award },
          { name: 'Hostel', path: ROUTES.HOSTEL, icon: Hotel },
          { name: 'Transport', path: ROUTES.TRANSPORT, icon: Bus },
          { name: 'Library', path: ROUTES.LIBRARY, icon: Book },
          { name: 'Timetable', path: ROUTES.TIMETABLE, icon: Calendar },
          { name: 'Assignments', path: ROUTES.ASSIGNMENTS, icon: FileEdit },
          { name: 'Quizzes', path: ROUTES.QUIZZES, icon: Award },
          { name: 'Exams', path: ROUTES.EXAMS, icon: FileText },
          { name: 'Fees', path: ROUTES.FEES, icon: DollarSign },
          { name: 'Reports', path: ROUTES.REPORTS, icon: FileText },
          { name: 'Procurement', path: ROUTES.PROCUREMENT, icon: ShoppingCart },
          { name: 'Facilities', path: ROUTES.FACILITIES, icon: Wrench },
          { name: 'Research', path: ROUTES.RESEARCH, icon: FlaskConical },
          { name: 'Accreditation & QA', path: ROUTES.ACCREDITATION, icon: Award },
          { name: 'University CMS', path: ROUTES.CMS, icon: Globe },
          { name: 'Communications', path: ROUTES.NOTIFICATIONS, icon: Bell },
          { name: 'AI Co-pilot', path: ROUTES.AI, icon: Sparkles },
          { name: 'API Gateway', path: ROUTES.APIGATEWAY, icon: Network },
          { name: 'DevOps Engine', path: ROUTES.DEVOPS, icon: Terminal },
          { name: 'Multi-Tenant & DR', path: '/multitenant', icon: Building },
          { name: 'Workflows & BPMN', path: ROUTES.WORKFLOW, icon: Network },
          { name: 'Search & Discovery', path: ROUTES.SEARCH, icon: Search },
          { name: 'Governance & GRC', path: ROUTES.GRC, icon: ShieldCheck },
          { name: 'Mobile MDM & Kiosks', path: ROUTES.MDM, icon: Smartphone },
          { name: 'Settings', path: ROUTES.SETTINGS, icon: Settings },

        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Departments', path: ROUTES.DEPARTMENTS, icon: Building },
          { name: 'Programs', path: ROUTES.PROGRAMS, icon: GraduationCap },
          { name: 'Semesters', path: ROUTES.SEMESTERS, icon: Calendar },
          { name: 'Sections', path: ROUTES.SECTIONS, icon: Users },
          { name: 'Subjects', path: ROUTES.SUBJECTS, icon: Book },
          { name: 'Course Offerings', path: ROUTES.COURSE_OFFERINGS, icon: BookOpen },
          { name: 'Enrollments', path: ROUTES.ENROLLMENTS, icon: ClipboardCheck },
          { name: 'Teachers', path: ROUTES.TEACHERS, icon: Users },
          { name: 'Students', path: ROUTES.STUDENTS, icon: GraduationCap },
          { name: 'Attendance', path: ROUTES.ATTENDANCE, icon: ClipboardCheck },
          { name: 'Leaves', path: ROUTES.LEAVES, icon: FileText },
          { name: 'Results', path: ROUTES.RESULTS, icon: Award },
          { name: 'Transcripts', path: ROUTES.TRANSCRIPTS, icon: FileText },
          { name: 'Degree Audit', path: ROUTES.DEGREE_AUDIT, icon: GraduationCap },
          { name: 'Alumni', path: ROUTES.ALUMNI, icon: Users },
          { name: 'Placements', path: ROUTES.PLACEMENT, icon: Award },
          { name: 'Hostel', path: ROUTES.HOSTEL, icon: Hotel },
          { name: 'Transport', path: ROUTES.TRANSPORT, icon: Bus },
          { name: 'Library', path: ROUTES.LIBRARY, icon: Book },
          { name: 'Quizzes', path: ROUTES.QUIZZES, icon: Award },
          { name: 'Exams', path: ROUTES.EXAMS, icon: FileText },
          { name: 'Timetable', path: ROUTES.TIMETABLE, icon: Calendar },
          { name: 'Procurement', path: ROUTES.PROCUREMENT, icon: ShoppingCart },
          { name: 'Facilities', path: ROUTES.FACILITIES, icon: Wrench },
          { name: 'Research', path: ROUTES.RESEARCH, icon: FlaskConical },
          { name: 'Accreditation & QA', path: ROUTES.ACCREDITATION, icon: Award },
          { name: 'University CMS', path: ROUTES.CMS, icon: Globe },
          { name: 'Communications', path: ROUTES.NOTIFICATIONS, icon: Bell },
          { name: 'AI Co-pilot', path: ROUTES.AI, icon: Sparkles },
          { name: 'API Gateway', path: ROUTES.APIGATEWAY, icon: Network },
          { name: 'DevOps Engine', path: ROUTES.DEVOPS, icon: Terminal },
          { name: 'Multi-Tenant & DR', path: '/multitenant', icon: Building },
          { name: 'Workflows & BPMN', path: ROUTES.WORKFLOW, icon: Network },
          { name: 'Search & Discovery', path: ROUTES.SEARCH, icon: Search },
          { name: 'Governance & GRC', path: ROUTES.GRC, icon: ShieldCheck },
          { name: 'Mobile MDM & Kiosks', path: ROUTES.MDM, icon: Smartphone },
          { name: 'Reports', path: ROUTES.REPORTS, icon: FileText },

        ];
      case 'TEACHER':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Semesters', path: ROUTES.SEMESTERS, icon: Calendar },
          { name: 'Sections', path: ROUTES.SECTIONS, icon: Users },
          { name: 'Subjects', path: ROUTES.SUBJECTS, icon: Book },
          { name: 'Course Offerings', path: ROUTES.COURSE_OFFERINGS, icon: BookOpen },
          { name: 'Enrollments', path: ROUTES.ENROLLMENTS, icon: ClipboardCheck },
          { name: 'Attendance', path: ROUTES.ATTENDANCE, icon: ClipboardCheck },
          { name: 'Leaves', path: ROUTES.LEAVES, icon: FileText },
          { name: 'Results', path: ROUTES.RESULTS, icon: Award },
          { name: 'Transcripts', path: ROUTES.TRANSCRIPTS, icon: FileText },
          { name: 'Degree Audit', path: ROUTES.DEGREE_AUDIT, icon: GraduationCap },
          { name: 'Alumni', path: ROUTES.ALUMNI, icon: Users },
          { name: 'Placements', path: ROUTES.PLACEMENT, icon: Award },
          { name: 'Transport', path: ROUTES.TRANSPORT, icon: Bus },
          { name: 'Library', path: ROUTES.LIBRARY, icon: Book },
          { name: 'Timetable', path: ROUTES.TIMETABLE, icon: Calendar },
          { name: 'Assignments', path: ROUTES.ASSIGNMENTS, icon: FileEdit },
          { name: 'Quizzes', path: ROUTES.QUIZZES, icon: Award },
          { name: 'Facilities', path: ROUTES.FACILITIES, icon: Wrench },
          { name: 'Research', path: ROUTES.RESEARCH, icon: FlaskConical },
          { name: 'Accreditation & QA', path: ROUTES.ACCREDITATION, icon: Award },
          { name: 'Communications', path: ROUTES.NOTIFICATIONS, icon: Bell },
          { name: 'AI Co-pilot', path: ROUTES.AI, icon: Sparkles },
          { name: 'Workflows & BPMN', path: ROUTES.WORKFLOW, icon: Network },
          { name: 'Search & Discovery', path: ROUTES.SEARCH, icon: Search },
          { name: 'Governance & GRC', path: ROUTES.GRC, icon: ShieldCheck },
          { name: 'Mobile MDM & Kiosks', path: ROUTES.MDM, icon: Smartphone },
        ];
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Semesters', path: ROUTES.SEMESTERS, icon: Calendar },
          { name: 'Sections', path: ROUTES.SECTIONS, icon: Users },
          { name: 'Subjects', path: ROUTES.SUBJECTS, icon: Book },
          { name: 'Enrollments', path: ROUTES.ENROLLMENTS, icon: ClipboardCheck },
          { name: 'Attendance', path: ROUTES.ATTENDANCE, icon: ClipboardCheck },
          { name: 'Leaves', path: ROUTES.LEAVES, icon: FileText },
          { name: 'Results', path: ROUTES.RESULTS, icon: Award },
          { name: 'Transcripts', path: ROUTES.TRANSCRIPTS, icon: FileText },
          { name: 'Degree Audit', path: ROUTES.DEGREE_AUDIT, icon: GraduationCap },
          { name: 'Alumni', path: ROUTES.ALUMNI, icon: Users },
          { name: 'Placements', path: ROUTES.PLACEMENT, icon: Award },
          { name: 'Hostel', path: ROUTES.HOSTEL, icon: Hotel },
          { name: 'Transport', path: ROUTES.TRANSPORT, icon: Bus },
          { name: 'Library', path: ROUTES.LIBRARY, icon: Book },
          { name: 'Timetable', path: ROUTES.TIMETABLE, icon: Calendar },
          { name: 'Assignments', path: ROUTES.ASSIGNMENTS, icon: FileEdit },
          { name: 'Quizzes', path: ROUTES.QUIZZES, icon: Award },
          { name: 'Exams', path: ROUTES.EXAMS, icon: FileText },
          { name: 'Facilities', path: ROUTES.FACILITIES, icon: Wrench },
          { name: 'Research', path: ROUTES.RESEARCH, icon: FlaskConical },
          { name: 'Accreditation & QA', path: ROUTES.ACCREDITATION, icon: Award },
          { name: 'Notifications', path: ROUTES.NOTIFICATIONS, icon: Bell },
          { name: 'AI Co-pilot', path: ROUTES.AI, icon: Sparkles },
          { name: 'Workflows & BPMN', path: ROUTES.WORKFLOW, icon: Network },
          { name: 'Search & Discovery', path: ROUTES.SEARCH, icon: Search },
          { name: 'Governance & GRC', path: ROUTES.GRC, icon: ShieldCheck },
          { name: 'Mobile MDM & Kiosks', path: ROUTES.MDM, icon: Smartphone },
        ];
      case 'PARENT':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Child Attendance', path: ROUTES.ATTENDANCE, icon: ClipboardCheck },
          { name: 'Child Results', path: ROUTES.RESULTS, icon: Award },
          { name: 'Fee Status', path: ROUTES.FEES, icon: DollarSign },
          { name: 'Notifications', path: ROUTES.NOTIFICATIONS, icon: Bell },
        ];
      case 'PLACEMENT_OFFICER':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Placements', path: ROUTES.PLACEMENT, icon: Award },
          { name: 'Alumni', path: ROUTES.ALUMNI, icon: Users },
        ];
      case 'HOSTEL_WARDEN':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Hostel', path: ROUTES.HOSTEL, icon: Hotel },
        ];
      case 'SECURITY_STAFF':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Hostel', path: ROUTES.HOSTEL, icon: Hotel },
          { name: 'Transport', path: ROUTES.TRANSPORT, icon: Bus },
        ];
      case 'RECRUITER':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Placements', path: ROUTES.PLACEMENT, icon: Award },
        ];
      case 'LIBRARIAN':
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
          { name: 'Library', path: ROUTES.LIBRARY, icon: Book },
        ];
      default:
        return [
          { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
        ];
    }
  };

  const navItems = getSidebarMenuItems();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (err) {
      console.error('[Sidebar Logout] Failed to sign out:', err);
    }
  };

  const userInitials = user 
    ? (`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U')
    : 'U';

  const roleLabels: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Admin',
    'PLACEMENT_OFFICER': 'Placement Officer',
    'RECRUITER': 'Recruiter',
    'TEACHER': 'Teacher',
    'STUDENT': 'Student',
    'PARENT': 'Parent',
    'HOSTEL_WARDEN': 'Hostel Warden',
    'SECURITY_STAFF': 'Security Staff',
  };

  const renderedRoleLabel = roleLabels[userRole] || userRole;

  // Sidebar elements
  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-5" id="dashboard-sidebar-content">
      {/* Upper Navigation Block */}
      <div className="flex flex-col gap-5 px-3">
        {/* Header Branding */}
        <div className={`px-3 pb-3 border-b border-slate-800 flex items-center justify-between ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          {!isSidebarCollapsed ? (
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base tracking-tight leading-none">Smart Univ</span>
              <span className="text-[9px] text-slate-500 font-mono font-bold mt-1 uppercase tracking-wider">Enterprise Console</span>
            </div>
          ) : (
            <div className="h-7 w-7 bg-slate-800 text-emerald-400 font-black flex items-center justify-center rounded-lg text-xs">
              S
            </div>
          )}
        </div>

        {/* Dynamic Navigation Menu Items */}
        <nav className="flex flex-col gap-1 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pr-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarItem
                key={item.path}
                name={item.name}
                path={item.path}
                icon={item.icon}
                isActive={isActive}
                isCollapsed={isSidebarCollapsed}
                onClick={() => setMobileSidebarOpen(false)}
                id={`sidebar-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              />
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Box & Collapse Toggle */}
      <div className="flex flex-col gap-3 px-3">
        {/* User Badge */}
        <div className={`flex items-center gap-2.5 p-2 bg-slate-850/50 rounded-xl border border-slate-800/40 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="h-8.5 w-8.5 shrink-0 bg-slate-800 border border-slate-700/80 rounded-lg flex items-center justify-center text-emerald-450 text-xs font-black font-sans">
            {userInitials}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{user?.firstName} {user?.lastName}</span>
              <span className="text-[10px] text-slate-500 font-bold tracking-tight">{renderedRoleLabel}</span>
            </div>
          )}
        </div>

        {/* Sidebar Collapse Toggle & Sign Out Buttons */}
        <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? 'flex-col' : 'justify-between'} border-t border-slate-800/60 pt-3`}>
          {/* Collapse Controller for Desktop only */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-850 hover:text-white transition-all cursor-pointer focus:outline-none"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            id="sidebar-toggle-button"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className={`flex h-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-950/40 hover:text-red-400 transition-all cursor-pointer focus:outline-none ${
              isSidebarCollapsed ? 'w-8' : 'px-2.5 gap-2 text-xs font-bold'
            }`}
            title="Sign Out of Session"
            id="sidebar-logout-button"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 shrink-0 sticky top-0 h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        id="desktop-sidebar-module"
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" id="mobile-sidebar-backdrop">
          {/* Dark Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileSidebarOpen(false)}
          />
          
          {/* Drawer container */}
          <aside className="relative flex flex-col w-64 max-w-xs h-full bg-slate-900 text-slate-300 border-r border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
