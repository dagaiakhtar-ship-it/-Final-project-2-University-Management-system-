/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES } from '../../constants/routes.constants';

interface BreadcrumbProps {
  customItems?: { label: string; path?: string }[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ customItems }) => {
  const location = useLocation();

  // If custom items are provided, use them
  if (customItems) {
    return (
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium" aria-label="Breadcrumb" id="dashboard-breadcrumb">
        <Link to={ROUTES.DASHBOARD} className="hover:text-slate-800 transition-colors flex items-center gap-1">
          <Home className="h-3 w-3" />
        </Link>
        {customItems.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
            {item.path ? (
              <Link to={item.path} className="hover:text-slate-800 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-800 font-semibold truncate max-w-[120px]">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }

  // Otherwise, automatically derive from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium font-sans" aria-label="Breadcrumb" id="dashboard-breadcrumb">
      <Link to={ROUTES.DASHBOARD} className="hover:text-slate-700 transition-colors flex items-center gap-1">
        <Home className="h-3.5 w-3.5 text-slate-400" />
      </Link>
      {pathSegments.map((segment, idx) => {
        const path = `/${pathSegments.slice(0, idx + 1).join('/')}`;
        const isLast = idx === pathSegments.length - 1;
        const label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return (
          <React.Fragment key={path}>
            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
            {isLast ? (
              <span className="text-slate-700 font-semibold truncate max-w-[120px] md:max-w-none">{label}</span>
            ) : (
              <Link to={path} className="hover:text-slate-600 transition-colors truncate max-w-[100px] md:max-w-none">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
