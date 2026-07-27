import React from 'react';
import { 
  Building2, Home, Users, AlertTriangle, 
  Wrench, DollarSign, Percent, ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface HostelOverviewProps {
  analytics: {
    summary: {
      totalBuildings: number;
      totalRooms: number;
      totalBeds: number;
      occupiedBeds: number;
      availableBeds: number;
      occupancyRate: number;
      totalComplaints: number;
      pendingComplaints: number;
      resolvedComplaints: number;
      totalMaintenances: number;
      pendingMaintenances: number;
      totalMaintenanceCost: number;
      monthlyRevenueProjection: number;
    };
    buildingUtilization: Array<{
      name: string;
      beds: number;
      occupied: number;
      available: number;
      utilization: number;
    }>;
    genderDistribution: Array<{
      name: string;
      value: number;
    }>;
  };
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

export const HostelOverview: React.FC<HostelOverviewProps> = ({ analytics }) => {
  if (!analytics || !analytics.summary) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 bg-white border border-slate-100 rounded-2xl">
        No analytics data available at this time.
      </div>
    );
  }

  const { summary, buildingUtilization, genderDistribution } = analytics;

  return (
    <div className="space-y-8" id="hostel-overview-tab">
      {/* 1. Quick Info Key Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Buildings & Rooms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Properties</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.totalBuildings} Hostels</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{summary.totalRooms} Total Rooms Registered</p>
          </div>
        </div>

        {/* Occupancy and Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Home className="h-6 w-6" />
          </div>
          <div className="flex-grow">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Bed Occupancy</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-slate-900">{summary.occupiedBeds} / {summary.totalBeds}</h3>
              <span className="text-xs font-bold text-emerald-600 flex items-center font-mono">
                {summary.occupancyRate}% <Percent className="h-3 w-3" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{summary.availableBeds} Available Beds Left</p>
          </div>
        </div>

        {/* Complaints Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Support & Complaints</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.pendingComplaints} Pending</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{summary.resolvedComplaints} Resolved Academic Complaints</p>
          </div>
        </div>

        {/* Maintenance Cost & Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Facility Cost</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${summary.totalMaintenanceCost.toLocaleString()}</h3>
            <p className="text-[11px] text-rose-500 mt-0.5 font-bold flex items-center gap-1">
              {summary.pendingMaintenances} Active Repair Requests
            </p>
          </div>
        </div>

      </div>

      {/* 2. Visual Graphs & Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Building Bed Utilization Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono mb-6">Building Utilization and Bed Breakdown</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildingUtilization}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none' }}
                  labelClassName="font-bold text-slate-400"
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="occupied" name="Occupied Beds" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="Available Beds" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono mb-6">Student Demographics</h2>
          {genderDistribution.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 text-xs">
              No students are currently allocated beds.
            </div>
          ) : (
            <div className="h-[280px] flex flex-col justify-between">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                {genderDistribution.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span 
                      className="h-2.5 w-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-bold truncate leading-none">{item.name}</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">{item.value} Beds</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. Sub-level Analytics details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono mb-4">Enterprise Projections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Monthly Revenue Projection</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-black text-slate-900">${summary.monthlyRevenueProjection.toLocaleString()}</span>
              <span className="h-6 px-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md flex items-center gap-0.5">
                ESTIMATED <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Average Occupancy Rate</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-black text-slate-900">{summary.occupancyRate}%</span>
              <span className="text-[10px] font-bold text-blue-600 font-mono">CAPACITY STABLE</span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Support Resolution Performance</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-black text-slate-900">
                {summary.totalComplaints > 0 
                  ? `${Math.round((summary.resolvedComplaints / summary.totalComplaints) * 100)}%` 
                  : '100%'}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 font-mono">WARDEN RESOLVING</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
