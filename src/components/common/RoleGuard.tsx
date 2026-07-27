/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { Loader } from './Loader';

interface RoleGuardProps {
  allowedRoles: string[];
  fallbackPath?: string;
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  fallbackPath = ROUTES.UNAUTHORIZED,
  children,
}) => {
  const { user, status } = useAuthStore();

  if (status === 'loading' || status === 'idle') {
    return <Loader fullscreen message="Verifying authorization..." />;
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const userRole = user.role?.toUpperCase();
  const hasAccess = allowedRoles.some((r) => r.toUpperCase() === userRole);

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
