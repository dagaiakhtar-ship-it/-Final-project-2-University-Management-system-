import React, { useState } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { useAuthStore } from '../../store/auth.store';

// Icons
import { 
  Bus, LayoutDashboard, MapPin, Users, 
  CreditCard, ClipboardList, PenTool 
} from 'lucide-react';

// Subcomponents
import { TransportOverview } from './components/TransportOverview';
import { TransportVehicles } from './components/TransportVehicles';
import { TransportDrivers } from './components/TransportDrivers';
import { TransportRoutes } from './components/TransportRoutes';
import { TransportPasses } from './components/TransportPasses';
import { TransportAttendance } from './components/TransportAttendance';
import { TransportMaintenance } from './components/TransportMaintenance';

export const TransportPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Role Permissions
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'SECURITY_STAFF'].includes(userRole);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'vehicles', name: 'Fleet', icon: Bus },
    { id: 'drivers', name: 'Drivers', icon: Users },
    { id: 'routes', name: 'Routes', icon: MapPin },
    { id: 'passes', name: 'Bus Passes', icon: CreditCard },
    { id: 'attendance', name: 'Boarding Logs', icon: ClipboardList },
    { id: 'maintenance', name: 'Operations & Fuel', icon: PenTool, adminOnly: true }
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'overview':
        return <TransportOverview />;
      case 'vehicles':
        return <TransportVehicles />;
      case 'drivers':
        return <TransportDrivers />;
      case 'routes':
        return <TransportRoutes />;
      case 'passes':
        return <TransportPasses />;
      case 'attendance':
        return <TransportAttendance />;
      case 'maintenance':
        return <TransportMaintenance />;
      default:
        return <TransportOverview />;
    }
  };

  return (
    <PageContainer title="Transport Management System">
      <div className="space-y-6" id="transport-master-page">
        {/* Module Sub-Tabs navigation header */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-px scrollbar-thin">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px ${
                  isSelected 
                    ? 'border-indigo-600 text-indigo-700 font-extrabold' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Selected Component Render area */}
        <div className="bg-white rounded-2xl shadow-sm p-1">
          {renderActiveComponent()}
        </div>
      </div>
    </PageContainer>
  );
};
export default TransportPage;
