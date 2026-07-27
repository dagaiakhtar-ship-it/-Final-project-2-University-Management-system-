/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Bell, User, LogOut, ChevronDown, BookOpen, Clock, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useDashboardStore } from '../../store/dashboard.store';
import { Breadcrumb } from './Breadcrumb';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';

export const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    isMobileSidebarOpen, 
    toggleMobileSidebar, 
    notificationCount, 
    decrementNotificationCount 
  } = useDashboardStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (err) {
      console.error('[Header Logout] Failed to sign out:', err);
    }
  };

  const userInitials = user 
    ? (`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U')
    : 'U';

  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  const roleLabels: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Admin',
    'TEACHER': 'Faculty Teacher',
    'STUDENT': 'Student',
    'PARENT': 'Guardian Parent',
  };

  const displayedRoleLabel = roleLabels[userRole] || userRole;

  return (
    <header 
      className="bg-white border-b border-slate-200 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40" 
      id="global-dashboard-header"
    >
      {/* Left Block: Hamburger menu (mobile) + Breadcrumbs (desktop) */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu button for mobile viewports */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-850 cursor-pointer focus:outline-none"
          aria-label="Toggle navigation menu"
          id="mobile-hamburger-button"
        >
          {isMobileSidebarOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
        
        {/* Mobile-only short branding */}
        <span className="sm:hidden font-extrabold text-sm text-slate-800 tracking-tight">Smart Univ</span>
      </div>

      {/* Right Block: System Metrics Placeholder + Notifications + Profile dropdown */}
      <div className="flex items-center gap-4">
        {/* Term indicator (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-150 rounded-lg text-[10px] font-bold text-slate-500 font-mono">
          <Clock className="h-3.5 w-3.5 text-slate-400" /> TERM: FALL 2026
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={() => {
            if (notificationCount > 0) decrementNotificationCount();
          }}
          className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-850 transition-colors cursor-pointer focus:outline-none"
          title={`${notificationCount} unread announcements. Click to acknowledge.`}
          id="header-notification-button"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-red-550 border border-white flex items-center justify-center text-[8px] font-black font-mono text-white leading-none">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            id="header-profile-dropdown-button"
          >
            {/* User Avatar Initials */}
            <div className="h-7.5 w-7.5 bg-slate-900 border border-slate-800 text-emerald-400 rounded-lg flex items-center justify-center text-[11px] font-black font-sans shrink-0">
              {userInitials}
            </div>
            
            {/* User Text Label (Desktop) */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 tracking-tight leading-none">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[9px] text-slate-400 font-bold mt-1.5 leading-none">
                {displayedRoleLabel}
              </span>
            </div>

            <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Actual Dropdown Menu Box */}
          {isProfileOpen && (
            <div 
              className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-200 rounded-xl shadow-md py-2 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="header-profile-dropdown-button"
              id="header-profile-dropdown-menu"
            >
              {/* Account Meta Section */}
              <div className="px-4 py-2 border-b border-slate-100 mb-1 flex flex-col gap-0.5">
                <span className="text-xs font-extrabold text-slate-800 truncate">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[10px] text-slate-400 truncate leading-none">
                  {user?.email}
                </span>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate(ROUTES.DASHBOARD);
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left cursor-pointer w-full"
                role="menuitem"
              >
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>My Dashboard</span>
              </button>

              {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate(ROUTES.SETTINGS);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 text-left cursor-pointer w-full"
                  role="menuitem"
                >
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                  <span>Restore Demo App</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 text-left cursor-pointer border-t border-slate-100 mt-1 w-full"
                role="menuitem"
              >
                <LogOut className="h-4 w-4 text-red-400" />
                <span>Sign Out Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
