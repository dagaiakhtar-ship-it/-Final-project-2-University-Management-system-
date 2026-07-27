/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  headerAction,
  footer,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col ${className}`}
      {...props}
    >
      {(title || description || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            {title && <h3 className="font-semibold text-slate-800 text-base">{title}</h3>}
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="px-6 py-5 flex-grow">{children}</div>
      {footer && <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">{footer}</div>}
    </div>
  );
};
