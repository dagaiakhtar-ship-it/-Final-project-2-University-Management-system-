/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, AlertCircle, FileQuestion } from 'lucide-react';
import { Button } from '../common/Button';

// 1. Loading Widget
interface LoadingWidgetProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export const LoadingWidget: React.FC<LoadingWidgetProps> = ({
  message = 'Loading dashboard content...',
  size = 'md',
  id = 'dashboard-loading-widget',
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm': return 'h-5 w-5';
      case 'lg': return 'h-10 w-10';
      default: return 'h-8 w-8';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-3 bg-white border border-slate-150 rounded-xl" id={id}>
      <Loader2 className={`${getSpinnerSize()} animate-spin text-slate-500`} />
      <span className="text-xs text-slate-500 font-medium font-sans">{message}</span>
    </div>
  );
};

// 2. Error Widget
interface ErrorWidgetProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  id?: string;
}

export const ErrorWidget: React.FC<ErrorWidgetProps> = ({
  title = 'System Synchronization Failed',
  message,
  onRetry,
  id = 'dashboard-error-widget',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-4 bg-white border border-red-150 rounded-xl max-w-md mx-auto" id={id}>
      <div className="p-2.5 bg-red-50 text-red-600 rounded-full border border-red-100">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm" className="mt-1">
          Synchronize Again
        </Button>
      )}
    </div>
  );
};

// 3. Empty Widget
interface EmptyWidgetProps {
  title?: string;
  message: string;
  actionText?: string;
  onActionClick?: () => void;
  id?: string;
}

export const EmptyWidget: React.FC<EmptyWidgetProps> = ({
  title = 'No Records Found',
  message,
  actionText,
  onActionClick,
  id = 'dashboard-empty-widget',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-4 bg-slate-50/50 border border-slate-200 border-dashed rounded-xl" id={id}>
      <div className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200">
        <FileQuestion className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1 max-w-xs">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{message}</p>
      </div>
      {actionText && onActionClick && (
        <Button onClick={onActionClick} variant="primary" size="sm" className="mt-1">
          {actionText}
        </Button>
      )}
    </div>
  );
};
