/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ShieldX, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../constants/routes.constants';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email address, please wait...');

  useEffect(() => {
    const doVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token was provided in the link. Please make sure the URL is copied correctly.');
        return;
      }

      try {
        await axios.get(`/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage('Your university email address has been verified successfully!');
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Email verification failed.';
        setStatus('error');
        setMessage(msg);
      }
    };

    doVerification();
  }, [token]);

  return (
    <div className="flex flex-col gap-6 items-center text-center py-4" id="verify-email-page">
      {status === 'verifying' && (
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-bold text-slate-900">Email Verification</h1>
            <p className="text-xs text-slate-500 max-w-xs">{message}</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-bounce" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Verified Successfully</h1>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{message}</p>
          </div>
          <Link to={ROUTES.LOGIN} className="w-full mt-2">
            <Button variant="primary" className="w-full">
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4">
          <ShieldX className="h-12 w-12 text-red-500" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-bold text-slate-900">Verification Failed</h1>
            <p className="text-xs text-red-600 max-w-xs bg-red-50 p-2.5 border border-red-100 rounded-lg font-medium">
              {message}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full mt-2">
            <Link to={ROUTES.LOGIN} className="w-full">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
