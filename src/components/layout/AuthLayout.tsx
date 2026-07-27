/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { ROUTES } from '../../constants/routes.constants';
import { Loader } from '../common/Loader';

export const AuthLayout: React.FC = () => {
  const { status } = useAuthStore();

  if (status === 'loading') {
    return <Loader fullscreen message="Verifying session..." />;
  }

  if (status === 'authenticated') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Smart University ERP
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enterprise Academy Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
