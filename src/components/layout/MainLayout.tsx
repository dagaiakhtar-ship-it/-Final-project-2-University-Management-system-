/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs py-4 px-6 flex items-center justify-between">
        <h2 className="font-bold text-slate-900 text-lg">Smart University ERP</h2>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800">
        &copy; {new Date().getFullYear()} Smart University ERP. All rights reserved.
      </footer>
    </div>
  );
};
