/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { Loader } from '../common/Loader';

export const ProtectedLayout: React.FC = () => {
  const { status } = useAuthStore();

  if (status === 'loading' || status === 'idle') {
    return <Loader fullscreen message="Verifying session..." />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};
