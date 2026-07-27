/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  iconColorClass?: string;
  iconBgClass?: string;
  id?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  iconColorClass = 'text-slate-850',
  iconBgClass = 'bg-slate-50',
  id,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-slate-200 hover:border-slate-350 rounded-xl p-5 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500 group relative overflow-hidden w-full"
      id={id}
    >
      <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${iconBgClass} ${iconColorClass}`}>
        <Icon className="h-5.5 w-5.5" />
      </div>
      <div className="flex flex-col gap-1 pr-6">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          {description}
        </p>
      </div>
      <div className="absolute right-4 top-4 text-slate-300 group-hover:text-slate-600 transition-colors duration-200">
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </button>
  );
};
