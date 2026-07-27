/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuthStore } from '../../store/auth.store';

interface HasRoleProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * HasRole component checks user role and renders children if authorized,
 * or fallback (null by default) if not.
 */
export const HasRole: React.FC<HasRoleProps> = ({ roles, children, fallback = null }) => {
  const { user } = useAuthStore();

  if (!user || !user.role) {
    return <>{fallback}</>;
  }

  const userRole = user.role.toUpperCase();
  const hasAccess = roles.some((r) => r.toUpperCase() === userRole);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Custom hook to check if current logged-in user possesses any of the specified roles.
 */
export const useHasRole = (roles: string[]): boolean => {
  const { user } = useAuthStore();
  if (!user || !user.role) return false;
  const userRole = user.role.toUpperCase();
  return roles.some((r) => r.toUpperCase() === userRole);
};
