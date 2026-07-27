/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, Mail, Lock, Eye, EyeOff, GraduationCap, 
  AlertCircle, CheckCircle2, User, Phone, Calendar, 
  ChevronRight, ArrowLeft, ShieldAlert 
} from 'lucide-react';

import { useAuthStore, RegistrationData } from '../store/auth.store';
import { ROUTES } from '../constants/routes.constants';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

// Global feature flag to control whether guest public self-registration is enabled
// Default is false (only Admins/Super Admins can create new accounts)
export const IS_SELF_REGISTRATION_ENABLED = false;

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid academic email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phoneNumber: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .regex(/^[+]?[0-9\s-]{10,15}$/, 'Invalid phone number format'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const, {
      message: 'Please select a valid system role',
    }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'] as const, {
      message: 'Please select gender',
    }),
    dateOfBirth: z.string().refine((val) => {
      if (!val) return false;
      const birthDate = new Date(val);
      const today = new Date();
      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return !isNaN(birthDate.getTime()) && birthDate < today && age >= 3;
    }, {
      message: 'Please specify a valid date of birth (must be at least 3 years old)',
    }),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions to proceed',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, registerUser, registrationStatus, registrationError, resetRegistrationState } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [strengthScore, setStrengthScore] = useState(0);
  const [passwordValue, setPasswordValue] = useState('');

  const isAdminOrSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isAllowedToRegister = IS_SELF_REGISTRATION_ENABLED || isAdminOrSuperAdmin;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      role: 'STUDENT',
      gender: 'MALE',
      dateOfBirth: '',
      termsAccepted: false,
    },
  });

  const watchPassword = watch('password');

  useEffect(() => {
    setPasswordValue(watchPassword || '');
  }, [watchPassword]);

  useEffect(() => {
    resetRegistrationState();
  }, [resetRegistrationState]);

  // Real-time password verification rules
  const strengthRules = [
    { label: 'At least 8 characters', check: (val: string) => val.length >= 8 },
    { label: 'One uppercase letter (A-Z)', check: (val: string) => /[A-Z]/.test(val) },
    { label: 'One lowercase letter (a-z)', check: (val: string) => /[a-z]/.test(val) },
    { label: 'One digit (0-9)', check: (val: string) => /[0-9]/.test(val) },
    { label: 'One special character (@, $, #, !, etc.)', check: (val: string) => /[^A-Za-z0-9]/.test(val) },
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

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Form fields fit the register schema. Phone number and DOB are safely part of metadata or handled by backend,
      // but the main registration payload takes primary user creation params:
      const payload: RegistrationData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        role: data.role,
      };

      await registerUser(payload);
      
      // Navigate to register success page
      navigate(`${ROUTES.REGISTER_SUCCESS}?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      console.error('[Registration] Submit failure:', err);
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

  // 1. Guard against non-admin registrations if self-registration is disabled
  if (!isAllowedToRegister) {
    return (
      <div className="flex flex-col gap-6" id="register-unauthorized-guard">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center justify-center animate-pulse">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-sm mt-1">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Self-Registration Restricted
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Public self-registration is currently disabled on this system instance for enterprise security compliance.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 flex flex-col gap-2.5 leading-relaxed">
          <span className="font-semibold text-slate-700">How to proceed:</span>
          <div className="flex flex-col gap-1.5 text-slate-500">
            <p>• If you are an administrator, please sign in with an Admin account first to access the user manager.</p>
            <p>• If you are a student or faculty member, please contact your Academic Registrar to assign your system credentials.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          <Link to={ROUTES.LOGIN} className="w-full">
            <Button variant="primary" className="w-full">
              Proceed to Sign In
            </Button>
          </Link>
          <Link to={ROUTES.HOME} className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-1">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto" id="registration-form-module">
      {/* Module Title */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="p-3 bg-slate-900 text-white rounded-full flex items-center justify-center">
          <UserPlus className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
            {isAdminOrSuperAdmin ? 'Register New University User' : 'Create Smart University Account'}
          </h1>
          <p className="text-xs text-slate-500">
            {isAdminOrSuperAdmin 
              ? 'Provide profile information to establish a new academic user record' 
              : 'Sign up for access to university timetables, results, and attendance records'
            }
          </p>
        </div>
      </div>

      {/* Error Callout */}
      {registrationError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-red-700">Registration Failure</span>
            <span>{registrationError}</span>
          </div>
        </div>
      )}

      {/* Primary Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Row: Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            placeholder="John"
            leftIcon={User}
            error={errors.firstName?.message}
            {...register('firstName')}
            disabled={isLoading}
          />
          <Input
            label="Last Name"
            type="text"
            placeholder="Doe"
            leftIcon={User}
            error={errors.lastName?.message}
            {...register('lastName')}
            disabled={isLoading}
          />
        </div>

        {/* Row: Email */}
        <Input
          label="Academic Email Address"
          type="email"
          placeholder="johndoe@university.edu"
          leftIcon={Mail}
          error={errors.email?.message}
          {...register('email')}
          disabled={isLoading}
        />

        {/* Row: Phone Number & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="555-0199"
            leftIcon={Phone}
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
            disabled={isLoading}
          />
          <Input
            label="Date of Birth"
            type="date"
            leftIcon={Calendar}
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
            disabled={isLoading}
          />
        </div>

        {/* Row: Role Selection & Gender Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700" htmlFor="gender">
              Gender
            </label>
            <div className="relative">
              <select
                id="gender"
                className={`w-full text-xs font-medium bg-white rounded-lg border px-3 py-2.5 outline-none transition-all focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${
                  errors.gender ? 'border-red-400' : 'border-slate-300'
                }`}
                {...register('gender')}
                disabled={isLoading}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            {errors.gender && (
              <span className="text-[10px] font-medium text-red-500">{errors.gender.message}</span>
            )}
          </div>

          {/* Role selection - only admins can pick role; defaults to STUDENT for guest/self signups */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700" htmlFor="role">
              System Role
            </label>
            <select
              id="role"
              className={`w-full text-xs font-medium bg-white rounded-lg border px-3 py-2.5 outline-none transition-all focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${
                errors.role ? 'border-red-400' : 'border-slate-300'
              }`}
              {...register('role')}
              disabled={isLoading || !isAdminOrSuperAdmin}
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="PARENT">Parent</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            {errors.role && (
              <span className="text-[10px] font-medium text-red-500">{errors.role.message}</span>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="relative">
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={Lock}
            error={errors.password?.message}
            {...register('password')}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-9.5 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Password Strength Meter */}
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
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: passed ? '#10b981' : '#ef4444' }} />
                    <span className={passed ? 'text-slate-500' : 'text-slate-400'}>{rule.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative">
          <Input
            label="Confirm Password"
            type={showConfirmPass ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={Lock}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-9.5 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
          >
            {showConfirmPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="flex flex-col gap-1.5 mt-1">
          <label className="flex items-start gap-2 text-slate-600 font-medium cursor-pointer">
            <input
              type="checkbox"
              className={`rounded border-slate-300 text-slate-900 focus:ring-slate-500 mt-0.5 ${
                errors.termsAccepted ? 'border-red-400 focus:ring-red-400' : ''
              }`}
              {...register('termsAccepted')}
              disabled={isLoading}
            />
            <span className="text-xs leading-relaxed">
              I agree to the university's <span className="font-semibold text-slate-800 underline">Terms of Use</span>,{' '}
              <span className="font-semibold text-slate-800 underline">Academic Integrity Guidelines</span>, and consent to receive a secure email verification link.
            </span>
          </label>
          {errors.termsAccepted && (
            <span className="text-[10px] font-medium text-red-500">{errors.termsAccepted.message}</span>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
          {isAdminOrSuperAdmin ? 'Register Academic User' : 'Register Account'}
        </Button>
      </form>

      {/* Login Navigation Links */}
      <div className="text-center mt-1">
        {isAdminOrSuperAdmin ? (
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Cancel and Return to Dashboard
          </Link>
        ) : (
          <p className="text-xs text-slate-500">
            Already have an academic account?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-semibold text-emerald-600 hover:text-emerald-500 underline transition-colors"
            >
              Sign In Here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};
