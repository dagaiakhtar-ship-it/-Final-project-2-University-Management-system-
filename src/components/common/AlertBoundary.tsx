/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AlertBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Uncaught exception caught by AlertBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div className="max-w-md w-full flex flex-col items-center text-center gap-5">
            <div className="p-3 bg-red-50 text-red-600 rounded-full border border-red-100">
              <AlertOctagon className="h-10 w-10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-bold text-slate-800">Something went wrong</h2>
              <p className="text-sm text-slate-500">
                An unexpected system error occurred. We have logged this issue and our team has been notified.
              </p>
              {this.state.error && (
                <pre className="mt-2 text-left p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-red-600 overflow-x-auto max-w-full">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <Button variant="primary" onClick={this.handleReset}>
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
