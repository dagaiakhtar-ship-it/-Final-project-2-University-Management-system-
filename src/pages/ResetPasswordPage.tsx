/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROUTES } from '../constants/routes.constants';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Password strength states
  const [strengthScore, setStrengthScore] = useState(0);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('password');

  useEffect(() => {
    setPasswordValue(watchPassword || '');
  }, [watchPassword]);

  // Real-time password strength validation rules
  const strengthRules = [
    { label: 'Minimum 8 characters', check: (val: string) => val.length >= 8 },
    { label: 'One uppercase letter (A-Z)', check: (val: string) => /[A-Z]/.test(val) },
    { label: 'One lowercase letter (a-z)', check: (val: string) => /[a-z]/.test(val) },
    { label: 'One digit (0-9)', check: (val: string) => /[0-9]/.test(val) },
    { label: 'One special character (@, $, !, etc.)', check: (val: string) => /[^A-Za-z0-9]/.test(val) },
  ];

  useEffect(() => {
    let score = 0;
    strengthRules.forEach((rule) => {
      if (rule.check(passwordValue)) {
        score += 1;
      }
    });
    setStrengthScore(score);
  }, [passwordValue]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setErrorMsg('A valid reset token must be supplied in the URL query parameters.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await axios.post('/api/auth/reset-password', {
        token,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update user password';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getBarColor = () => {
    if (strengthScore <= 2) return 'bg-red-500';
    if (strengthScore <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (!passwordValue) return '';
    if (strengthScore <= 2) return 'Weak';
    if (strengthScore <= 4) return 'Moderate';
    return 'Strong & Highly Secure';
  };

  return (
    <div className="flex flex-col gap-6" id="reset-password-page">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-xl font-bold text-slate-900">Reset Password</h1>
        <p className="text-xs text-slate-500">
          Create a strong password to secure your Smart University account
        </p>
      </div>

      {!token ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Missing Security Token</span>
            <span>
              The password reset link appears to be invalid or incomplete. Please request a new link from the forgot password page.
            </span>
          </div>
        </div>
      ) : isSuccess ? (
        <div className="flex flex-col gap-4 text-center items-center py-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-bounce" />
          <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-semibold text-slate-800">Password Changed!</h2>
            <p className="text-xs text-slate-500 max-w-xs">
              Your new password has been stored successfully. You can now use your updated credentials to sign in.
            </p>
          </div>
          <Link to={ROUTES.LOGIN} className="w-full mt-2">
            <Button variant="primary" className="w-full">
              Proceed to Sign In
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

          <div className="relative">
            <Input
              label="New Password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={Lock}
              error={errors.password?.message}
              {...register('password')}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-9.5 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Realtime Password Strength Display */}
          {passwordValue && (
            <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Strength Indicator</span>
                <span className={`font-semibold ${getBarColor().replace('bg-', 'text-')}`}>
                  {getStrengthLabel()}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getBarColor()}`}
                  style={{ width: `${(strengthScore / 5) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-1 gap-1.5 mt-1">
                {strengthRules.map((rule, idx) => {
                  const passed = rule.check(passwordValue);
                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
                      {passed ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span className={passed ? 'text-slate-500' : 'text-slate-400'}>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirmPass ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={Lock}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-9.5 text-slate-400 hover:text-slate-600"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
            >
              {showConfirmPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Update Password
          </Button>

          <div className="text-center mt-2">
            <Link
              to={ROUTES.LOGIN}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel and Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
