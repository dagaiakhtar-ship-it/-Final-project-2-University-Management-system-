/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore, UserProfile } from '../store/auth.store';
import { Loader } from '../components/common/Loader';

interface AuthContextType {
  user: UserProfile | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, status, restoreSession, logout } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await restoreSession();
      } catch (err) {
        console.warn('Session restore failed on init:', err);
      } finally {
        setInitialized(true);
      }
    };
    initAuth();
  }, [restoreSession]);

  if (!initialized || status === 'loading') {
    return <Loader fullscreen message="Synchronizing enterprise security context..." />;
  }

  const value: AuthContextType = {
    user,
    role,
    isAuthenticated: status === 'authenticated',
    isLoading: (status as string) === 'loading',
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
