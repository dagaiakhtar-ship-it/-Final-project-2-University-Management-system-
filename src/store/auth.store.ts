/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import axios from 'axios';

export interface UserProfile {
  id: number;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  gender: string;
  role: string;
  isEmailVerified: boolean;
  lastLogin?: string | Date | null;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
export type RegisterStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RegistrationData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  gender: string;
  role: string;
}

interface AuthState {
  user: UserProfile | null;
  role: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;

  // Registration state
  registrationStatus: RegisterStatus;
  registrationLoading: boolean;
  registrationError: string | null;

  // Actions
  login: (credentials: { email?: string; password?: string; firebaseToken?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string>;
  restoreSession: () => Promise<void>;
  clearSession: () => void;
  registerUser: (data: RegistrationData) => Promise<any>;
  resetRegistrationState: () => void;
}

const ACCESS_TOKEN_KEY = 'su_access_token';
const REFRESH_TOKEN_KEY = 'su_refresh_token';
const USER_KEY = 'su_user_profile';

let activeRefreshPromise: Promise<string> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  isLoading: false,
  error: null,

  registrationStatus: 'idle',
  registrationLoading: false,
  registrationError: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      // Direct API call to avoid dependency cycle with apiClient
      const response = await axios.post('/api/auth/login', credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({
        user,
        role: user.role,
        accessToken,
        refreshToken,
        status: 'authenticated',
        isLoading: false,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      set({ isLoading: false, error: errorMessage, status: 'unauthenticated' });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    const { accessToken, clearSession } = get();
    try {
      if (accessToken) {
        await axios.post(
          '/api/auth/logout',
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }
    } catch (err) {
      console.warn('Backend logout failed or session already expired on server:', err);
    } finally {
      clearSession();
    }
  },

  refreshSession: async () => {
    if (activeRefreshPromise) {
      return activeRefreshPromise;
    }

    const currentRefreshToken = get().refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    activeRefreshPromise = (async () => {
      try {
        const response = await axios.post('/api/auth/refresh', {
          refreshToken: currentRefreshToken,
        });
        const { accessToken, refreshToken, user } = response.data.data;

        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        if (user) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }

        set((state) => ({
          accessToken,
          refreshToken,
          user: user || state.user,
          role: user ? user.role : state.role,
          status: 'authenticated',
        }));

        return accessToken;
      } catch (err: any) {
        console.error('[Session Refresh] Failed rotating session:', err);
        get().clearSession();
        throw err;
      } finally {
        activeRefreshPromise = null;
      }
    })();

    return activeRefreshPromise;
  },

  restoreSession: async () => {
    set({ status: 'loading' });
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedAccessToken || !storedRefreshToken || !storedUser) {
      set({ status: 'unauthenticated', user: null, role: null, accessToken: null, refreshToken: null });
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      set({
        user,
        role: user.role,
        accessToken: storedAccessToken,
        refreshToken: storedRefreshToken,
        status: 'authenticated',
      });

      // Silently verify session validity via /api/auth/me instead of unconditionally rotating tokens
      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedAccessToken}` },
        });
        const refreshedUser = response.data.data;
        if (refreshedUser) {
          localStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
          set({ user: refreshedUser, role: refreshedUser.role });
        }
      } catch (meErr: any) {
        if (meErr.response?.status === 401) {
          console.log('[Session Restore] Access token expired, attempting silent session rotation...');
          await get().refreshSession();
        } else {
          console.warn('[Session Restore] Profile validation failed or server is offline:', meErr.message || meErr);
        }
      }
    } catch (err) {
      console.warn('[Session Restore] Failed restoring session, resetting credentials:', err);
      get().clearSession();
    }
  },

  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({
      user: null,
      role: null,
      accessToken: null,
      refreshToken: null,
      status: 'unauthenticated',
      isLoading: false,
    });
  },

  registerUser: async (data) => {
    set({ registrationLoading: true, registrationStatus: 'loading', registrationError: null });
    try {
      const response = await axios.post('/api/auth/register', data);
      set({
        registrationLoading: false,
        registrationStatus: 'success',
        registrationError: null,
      });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      set({
        registrationLoading: false,
        registrationStatus: 'error',
        registrationError: errorMessage,
      });
      throw new Error(errorMessage);
    }
  },

  resetRegistrationState: () => {
    set({
      registrationStatus: 'idle',
      registrationLoading: false,
      registrationError: null,
    });
  },
}));
