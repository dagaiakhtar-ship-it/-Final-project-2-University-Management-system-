/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios, { AxiosInstance } from 'axios';
import { envConfig } from './env.config';
import { appConfig } from './app.config';

export const API_BASE_URL = `${envConfig.APP_URL}${appConfig.apiPrefix}`;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Ready for future JWT authentication token injection
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ready for global error and 401/403 handle
    if (error.response) {
      const status = error.response.status;
      if (status === 401 && typeof window !== 'undefined') {
        // Handle unauthorized redirections or clear local states
      }
    }
    return Promise.reject(error);
  }
);

export const apiEndpoints = {
  health: '/health',
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  attendance: {
    base: '/attendance',
    sheets: '/attendance/sheets',
  },
  courses: {
    base: '/courses',
  },
  users: {
    base: '/users',
  },
};
