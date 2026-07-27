import React from 'react';
import { 
  Building2, Users, Briefcase, GraduationCap, DollarSign, Percent, Award 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface PlacementOverviewProps {
  analytics: {
    totalCompanies: number;
    activeRecruiters: number;
    openJobs: number;
    internshipOpportunities: number;
    placementRate: number;
    averageSalary: number;
    departmentWisePlacement: Array<{ name: string; placed: number }>;
    companyWiseHiring: Array<{ name: string; hired: number }>;
  } | null;
  onNavigateToTab: (tab: 'overview' | 'companies' | 'jobs' | 'applications' | 'history') => void;
  userRole: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const PlacementOverview: React.FC<PlacementOverviewProps> = ({ 
  analytics, 
  onNavigateToTab,
  userRole 
}) => {
  const stats = analytics || {
    totalCompanies: 0,
    activeRecruiters: 0,
    openJobs: 0,
    internshipOpportunities: 0,
    placementRate: 0,
    averageSalary: 75000,
    departmentWisePlacement: [],
    companyWiseHiring: [],
  };

  const formattedSalary = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(stats.averageSalary);

  const cardData = [
    {
      id: 'placement-rate-card',
      title: 'Placement Success Rate',
      value: `${stats.placementRate}%`,
      subtitle: 'Placed / Applying Students',
      icon: <Percent className="h-6 w-6 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      id: 'avg-salary-card',
      title: 'Avg. CTC Offered',
      value: formattedSalary,
      subtitle: 'Annualized Package (Median)',
      icon: <DollarSign className="h-6 w-6 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      id: 'open-jobs-card',
      title: 'Active Job Postings',
      value: stats.openJobs,
      subtitle: `${stats.internshipOpportunities} Internship opportunities`,
      icon: <Briefcase className="h-6 w-6 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      id: 'partner-companies-card',
      title: 'Partner Companies',
      value: stats.totalCompanies,
      subtitle: `${stats.activeRecruiters} Verified recruiters`,
      icon: <Building2 className="h-6 w-6 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
    },
  ];

  return (
    <div className="space-y-8" id="placement-overview-tab">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card) => (
          <div 
            key={card.id} 
            id={card.id}
            className={`p-6 rounded-2xl border ${card.bg} flex items-center justify-between shadow-sm transition hover:shadow-md`}
          >
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h4 className="text-3xl font-bold text-gray-900 mt-2">{card.value}</h4>
              <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-xs">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department placement success */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="dept-placement-chart-container">
          <div className="flex items-center justify-between mb-6">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Placed Students by Department
            </h5>
            <span className="text-xs font-medium text-gray-400">Current Academic Term</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.departmentWisePlacement}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
                  labelClassName="font-medium text-gray-900"
                />
                <Bar dataKey="placed" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {stats.departmentWisePlacement.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="company-hiring-chart-container">
          <div className="flex items-center justify-between mb-6">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Hiring Breakdown by Partner Corporation
            </h5>
            <span className="text-xs font-medium text-gray-400">Selected / Offered Count</span>
          </div>
          <div className="h-80 w-full flex flex-col md:flex-row items-center justify-center">
            {stats.companyWiseHiring.length === 0 ? (
              <p className="text-gray-400 text-sm">No hiring records found yet.</p>
            ) : (
              <>
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.companyWiseHiring}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="hired"
                      >
                        {stats.companyWiseHiring.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-3 justify-center pl-4">
                  {stats.companyWiseHiring.slice(0, 5).map((entry, idx) => (
                    <div key={`legend-${idx}`} className="flex items-center gap-3 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-gray-600 font-medium truncate w-32">{entry.name}</span>
                      <span className="text-gray-900 font-bold ml-auto">{entry.hired} hired</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role-specific quick link panels */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between shadow-xs">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="p-3 bg-blue-600 text-white rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h6 className="font-semibold text-gray-900 text-lg">Manage or Apply for Placements</h6>
            <p className="text-sm text-gray-600 mt-1">
              {['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER'].includes(userRole) 
                ? 'Review student applications, manage corporate profiles, and coordinate interviews in real-time.' 
                : 'Check academic eligibility criteria, complete your resume file, and apply for top careers with partner companies.'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            id="quick-jobs-btn"
            onClick={() => onNavigateToTab('jobs')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            {['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER'].includes(userRole) ? 'Post a Job' : 'Browse Jobs'}
          </button>
          <button 
            id="quick-companies-btn"
            onClick={() => onNavigateToTab('companies')}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl text-sm transition"
          >
            View Corporate Partners
          </button>
        </div>
      </div>
    </div>
  );
};
