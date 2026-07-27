/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white py-4 px-6 flex items-center justify-between">
        <span className="font-bold text-slate-900">Smart University ERP</span>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Smart University ERP. All rights reserved.
      </footer>
    </div>
  );
};
