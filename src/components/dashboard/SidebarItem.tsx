/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  name: string;
  path: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
  id?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  name,
  path,
  icon: Icon,
  isActive,
  isCollapsed,
  onClick,
  id,
}) => {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
        isActive
          ? 'bg-slate-800 text-white border-l-4 border-emerald-500'
          : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
      } ${isCollapsed ? 'justify-center px-1' : ''}`}
      title={isCollapsed ? name : undefined}
      id={id}
    >
      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
      {!isCollapsed && <span className="truncate">{name}</span>}
    </Link>
  );
};
