/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Spinner } from './Spinner';

export interface LoaderProps {
  fullscreen?: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ fullscreen = false, message = 'Loading...' }) => {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xs">
        <Spinner size="lg" />
        {message && <p className="mt-4 text-sm font-semibold text-slate-700 animate-pulse">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[200px]">
      <Spinner size="md" />
      {message && <p className="mt-3 text-xs font-semibold text-slate-500 animate-pulse">{message}</p>}
    </div>
  );
};
