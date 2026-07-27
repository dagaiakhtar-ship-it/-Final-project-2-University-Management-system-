/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children?: React.ReactNode;
  id?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  value,
  icon: Icon,
  iconColorClass = 'text-slate-700',
  iconBgClass = 'bg-slate-100',
  badgeText,
  badgeType = 'info',
  children,
  id,
}) => {
  const getBadgeColors = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'info':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all duration-200 flex flex-col gap-3"
      id={id}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          {value !== undefined && (
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">{value}</span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-500 font-medium">{subtitle}</span>
          )}
        </div>
        {Icon && (
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconBgClass} ${iconColorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {badgeText && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border w-max font-mono ${getBadgeColors()}`}>
          {badgeText}
        </span>
      )}

      {children && (
        <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-1 text-xs text-slate-600 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
};
