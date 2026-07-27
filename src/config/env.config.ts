/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Environment Configuration
 * Provides strongly typed access to environment variables.
 */

// Simple runtime check to determine if we are in a Node/backend environment
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  GEMINI_API_KEY: string;
  APP_URL: string;
}

const getEnv = (key: string, defaultValue = ''): string => {
  if (isNode) {
    return process.env[key] || defaultValue;
  }
  // In Vite client context, look up import.meta.env
  // @ts-ignore - Vite specific env
  const viteEnv = typeof import.meta !== 'undefined' && import.meta.env;
  if (viteEnv) {
    // @ts-ignore
    return viteEnv[`VITE_${key}`] || viteEnv[key] || defaultValue;
  }
  return defaultValue;
};

export const envConfig: EnvConfig = {
  NODE_ENV: (getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY', ''),
  APP_URL: getEnv('APP_URL', 'http://localhost:3000'),
};
