/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Mail, Lock, Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';

import { useAuthStore } from '../store/auth.store';
import { ROUTES } from '../constants/routes.constants';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { auth } from '../services/firebase.service';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid university email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const authStoreError = useAuthStore((state) => state.error);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLocalError(null);
    setSuccessMsg(null);
    try {
      await login({
        email: data.email,
        password: data.password,
      });
      setSuccessMsg('Successfully authenticated! Redirecting to dashboard...');
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 1500);
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setLocalError(null);
    setSuccessMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseToken = await result.user.getIdToken();

      await login({
        firebaseToken,
      });

      setSuccessMsg('Successfully logged in via Google SSO! Redirecting...');
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 1500);
    } catch (err: any) {
      console.error('Google Auth Popup Error:', err);
      setLocalError(err.response?.data?.message || err.message || 'Google authentication was cancelled or failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" id="login-module-container">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="p-3 bg-slate-900 text-white rounded-full flex items-center justify-center">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
            Sign in to Smart University
          </h1>
          <p className="text-xs text-slate-500">
            Enter your university credentials or authenticate via Google SSO
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 animate-bounce text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {(localError || authStoreError) && !successMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-red-700">Authentication Failure</span>
            <span>{localError || authStoreError}</span>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@university.edu"
          leftIcon={Mail}
          error={errors.email?.message}
          {...register('email')}
          disabled={isLoading || isGoogleLoading}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={Lock}
            error={errors.password?.message}
            {...register('password')}
            disabled={isLoading || isGoogleLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-9.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Utilities: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between mt-1 text-xs">
          <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              {...register('rememberMe')}
              disabled={isLoading || isGoogleLoading}
            />
            <span>Remember Me</span>
          </label>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Action Buttons */}
        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={isGoogleLoading}
        >
          Sign In
        </Button>
      </form>

      {/* SSO Separator */}
      <div className="relative flex items-center justify-center py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          Or Continue With
        </span>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        className="w-full hover:bg-slate-50 border-slate-300"
        onClick={handleGoogleLogin}
        isLoading={isGoogleLoading}
        disabled={isLoading}
      >
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 12-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </Button>

      {/* Demo Credentials Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 shadow-xs">
        <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] text-center border-b border-slate-200 pb-1.5">
          Demo Academic Credentials
        </h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
            <div>
              <span className="font-bold text-[10px] uppercase text-indigo-600 block">Super Admin</span>
              <span className="font-mono text-[10px] text-slate-500">admin@university.edu</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'admin@university.edu', { shouldValidate: true });
                setValue('password', 'Password@123', { shouldValidate: true });
              }}
              className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
            >
              Auto Fill
            </button>
          </div>
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
            <div>
              <span className="font-bold text-[10px] uppercase text-violet-600 block">Faculty / Teacher</span>
              <span className="font-mono text-[10px] text-slate-500">teacher@university.edu</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'teacher@university.edu', { shouldValidate: true });
                setValue('password', 'Password@123', { shouldValidate: true });
              }}
              className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
            >
              Auto Fill
            </button>
          </div>
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
            <div>
              <span className="font-bold text-[10px] uppercase text-emerald-600 block">Student</span>
              <span className="font-mono text-[10px] text-slate-500">student@university.edu</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'student@university.edu', { shouldValidate: true });
                setValue('password', 'Password@123', { shouldValidate: true });
              }}
              className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
            >
              Auto Fill
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 text-center italic mt-1">
          Common password: <code className="font-bold font-mono bg-white px-1 py-0.5 rounded border border-slate-150">Password@123</code>
        </p>
      </div>

      {/* Footer Back Link */}
      <div className="text-center flex flex-col gap-2.5 mt-2">
        <Link
          to={ROUTES.REGISTER}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Register an Account
        </Link>
        <Link
          to={ROUTES.HOME}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          &larr; Return to main site
        </Link>
      </div>
    </div>
  );
};
