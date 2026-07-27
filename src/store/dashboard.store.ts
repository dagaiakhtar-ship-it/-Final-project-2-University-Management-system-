/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

export type DashboardTheme = 'light' | 'dark';

interface DashboardState {
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  currentPage: string;
  notificationCount: number;
  theme: DashboardTheme;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  setCurrentPage: (page: string) => void;
  setNotificationCount: (count: number) => void;
  decrementNotificationCount: () => void;
  toggleTheme: () => void;
  resetDashboardState: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  currentPage: 'Dashboard',
  notificationCount: 5,
  theme: 'light',

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setNotificationCount: (count) => set({ notificationCount: count }),
  decrementNotificationCount: () => set((state) => ({ notificationCount: Math.max(0, state.notificationCount - 1) })),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  resetDashboardState: () => set({
    isSidebarCollapsed: false,
    isMobileSidebarOpen: false,
    currentPage: 'Dashboard',
    notificationCount: 5,
    theme: 'light',
  }),
}));
