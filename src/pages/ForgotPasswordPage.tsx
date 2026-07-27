/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROUTES } from '../constants/routes.constants';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid academic email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await axios.post('/api/auth/forgot-password', { email: data.email });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit request';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" id="forgot-password-page">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-xl font-bold text-slate-900">Forgot Password</h1>
        <p className="text-xs text-slate-500">
          Enter your university email address to receive a secure password reset link
        </p>
      </div>

      {isSuccess ? (
        <div className="flex flex-col gap-4 text-center items-center py-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-bounce" />
          <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-semibold text-slate-800">Check your inbox</h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              If an account is associated with that email, we have sent a secure single-use link to reset your password.
            </p>
          </div>
          <Link to={ROUTES.LOGIN} className="w-full mt-2">
            <Button variant="primary" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@university.edu"
            leftIcon={Mail}
            error={errors.email?.message}
            {...register('email')}
            disabled={isLoading}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Send Reset Link
          </Button>

          <div className="text-center mt-2">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
