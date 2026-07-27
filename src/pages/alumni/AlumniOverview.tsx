import React from 'react';
import { 
  Users, Award, Briefcase, Heart, 
  TrendingUp, Building, MapPin, DollarSign 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface AnalyticsData {
  totalAlumni: number;
  verifiedAlumni: number;
  employmentRate: number;
  totalDonations: number;
  departmentStats: Array<{
    department: string;
    count: number;
    employmentRate: number;
  }>;
  topCompanies: Array<{
    company: string;
    count: number;
  }>;
  geographicDistribution: Array<{
    country: string;
    count: number;
  }>;
}

interface AlumniOverviewProps {
  analytics: AnalyticsData | null;
  loading: boolean;
}

export const AlumniOverview: React.FC<AlumniOverviewProps> = ({ analytics, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500">
        No analytics data available.
      </div>
    );
  }

  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];

  const departmentData = analytics.departmentStats.map(stat => ({
    name: stat.department,
    Count: stat.count,
    'Employment Rate (%)': parseFloat((stat.employmentRate * 100).toFixed(1)),
  }));

  const companyData = analytics.topCompanies.map(c => ({
    name: c.company,
    Alumni: c.count,
  }));

  const geographicData = analytics.geographicDistribution.map(g => ({
    name: g.country,
    value: g.count,
  }));

  return (
    <div className="space-y-6" id="alumni-overview-container">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Alumni</p>
            <h3 className="text-2xl font-bold text-slate-900">{analytics.totalAlumni}</h3>
            <p className="text-xs text-slate-400">{analytics.verifiedAlumni} verified profiles</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Employment Rate</p>
            <h3 className="text-2xl font-bold text-slate-900">{(analytics.employmentRate * 100).toFixed(1)}%</h3>
            <p className="text-xs text-green-600 font-semibold">Active in workforce</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Contributions</p>
            <h3 className="text-2xl font-bold text-slate-900">${analytics.totalDonations.toLocaleString()}</h3>
            <p className="text-xs text-slate-400">Raised for campus programs</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-lg">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Mentors Available</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {analytics.verifiedAlumni > 2 ? analytics.verifiedAlumni - 1 : 2}
            </h3>
            <p className="text-xs text-slate-400">Active mentorship matches</p>
          </div>
        </div>
      </div>

      {/* Recharts Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Stats */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-slate-500" />
            Alumni Distribution by Department
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#0f172a" />
                <YAxis yAxisId="right" orientation="right" stroke="#334155" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Count" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Employment Rate (%)" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Employers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-slate-500" />
            Top Employers of Alumni
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="Alumni" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-slate-500" />
            Geographic Distribution
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={geographicData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {geographicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">Alumni global locations:</p>
              <div className="grid grid-cols-2 gap-4">
                {geographicData.map((data, index) => (
                  <div key={data.name} className="flex items-center space-x-2">
                    <span 
                      className="w-3 h-3 rounded-full inline-block" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-slate-600">
                      {data.name}: <span className="font-bold text-slate-900">{data.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
