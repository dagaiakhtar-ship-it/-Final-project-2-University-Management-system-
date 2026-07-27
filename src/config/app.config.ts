/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppConfig {
  name: string;
  version: string;
  apiPrefix: string;
  defaultLocale: string;
  supportEmail: string;
}

export const appConfig: AppConfig = {
  name: 'Smart University ERP',
  version: '1.0.0',
  apiPrefix: '/api',
  defaultLocale: 'en-US',
  supportEmail: 'support@smartuniversity.edu',
};
