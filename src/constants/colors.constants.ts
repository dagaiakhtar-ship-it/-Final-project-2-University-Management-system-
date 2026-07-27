/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const COLORS = {
  primary: {
    DEFAULT: '#0f172a', // Slate 900
    light: '#1e293b',   // Slate 800
    dark: '#020617',    // Slate 950
  },
  accent: {
    DEFAULT: '#10b981', // Emerald 500
    light: '#34d399',   // Emerald 400
    dark: '#047857',    // Emerald 700
  },
  neutral: {
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
  },
  feedback: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  }
} as const;
