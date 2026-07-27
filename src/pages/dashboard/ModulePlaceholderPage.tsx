/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { EmptyWidget } from '../../components/dashboard/Widgets';
import { PageHeader } from '../../components/dashboard/PageHeader';

export const ModulePlaceholderPage: React.FC = () => {
  const location = useLocation();

  // Derive module name from path segment
  const pathSegment = location.pathname.split('/').filter(Boolean).pop() || 'Feature';
  const moduleName = pathSegment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="p-6 md:p-8" id="module-placeholder-container">
      <PageHeader 
        title={moduleName} 
        description={`Academic administration and portal records for the ${moduleName} module.`} 
      />
      
      <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-xs">
        <EmptyWidget
          title={`${moduleName} Module Slated for Development`}
          message={`This feature is reserved for upcoming implementation phases. The database tables, ORM structures, and user views for ${moduleName} are fully declared in our security architecture and will be connected in Step 12+.`}
        />
      </div>
    </div>
  );
};
