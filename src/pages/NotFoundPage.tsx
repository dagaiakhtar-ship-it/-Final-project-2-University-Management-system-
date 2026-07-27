/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { AlertCircle, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes.constants';
import { useAuthStore } from '../store/auth.store';

export const NotFoundPage: React.FC = () => {
  const { status } = useAuthStore();
  const isAuthenticated = status === 'authenticated';

  return (
    <PageContainer>
      <div className="flex justify-center py-12" id="not-found-container">
        <Card className="max-w-md w-full text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
              <AlertCircle className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Page Not Found</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              The page you are looking for does not exist, has been moved, or resides in a module scheduled for upcoming deployment.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full justify-center">
              {isAuthenticated ? (
                <Link to={ROUTES.DASHBOARD} className="w-full sm:w-auto">
                  <Button className="w-full inline-flex items-center justify-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to={ROUTES.LOGIN} className="w-full sm:w-auto">
                  <Button className="w-full inline-flex items-center justify-center gap-1.5">
                    Sign In
                  </Button>
                </Link>
              )}
              <Link to={ROUTES.HOME} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full inline-flex items-center justify-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Return Home
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
