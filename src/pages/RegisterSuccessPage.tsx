/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Mail, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { ROUTES } from '../constants/routes.constants';
import { Button } from '../components/common/Button';

export const RegisterSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your-academic-email@university.edu';

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus('idle');
    setResendMessage(null);

    try {
      // Endpoint to trigger a fresh verification email link
      await axios.post('/api/auth/resend-verification', { email });
      setResendStatus('success');
      setResendMessage('A new verification email has been dispatched to your inbox.');
    } catch (err: any) {
      setResendStatus('error');
      setResendMessage(err.response?.data?.message || err.message || 'Failed to resend email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 items-center text-center py-4" id="register-success-module">
      {/* Visual Indicator */}
      <div className="relative">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 animate-bounce">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
      </div>

      {/* Message Header */}
      <div className="flex flex-col gap-1.5 max-w-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Created!</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your academic profile record has been successfully registered on the Smart University server.
        </p>
      </div>

      {/* Info Card with Email Details */}
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 max-w-sm text-left">
        <div className="flex gap-2.5 items-start">
          <Mail className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">Verification Required</span>
            <span className="text-xs text-slate-600 font-medium break-all">{email}</span>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
              For security compliance, a single-use email verification link has been sent. You must confirm your email before logging in.
            </p>
          </div>
        </div>
      </div>

      {/* Resend status notices */}
      {resendMessage && (
        <div className={`p-3 rounded-lg text-xs flex items-start gap-2 max-w-sm text-left ${
          resendStatus === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {resendStatus === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          )}
          <span>{resendMessage}</span>
        </div>
      )}

      {/* Action triggers */}
      <div className="flex flex-col gap-2.5 w-full max-w-sm mt-2">
        <Link to={ROUTES.LOGIN} className="w-full">
          <Button variant="primary" className="w-full" rightIcon={ArrowRight}>
            Proceed to Sign In
          </Button>
        </Link>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 py-1.5 disabled:opacity-50 transition-colors focus:outline-none"
        >
          <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
          Resend Verification Email
        </button>
      </div>
    </div>
  );
};
