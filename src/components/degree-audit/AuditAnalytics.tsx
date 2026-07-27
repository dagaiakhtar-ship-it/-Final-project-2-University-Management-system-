import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion } from 'framer-motion';
import { Award, BookOpen, UserCheck, TrendingUp } from 'lucide-react';

interface AuditAnalyticsProps {
  audits: any[];
}

export const AuditAnalytics: React.FC<AuditAnalyticsProps> = ({ audits = [] }) => {
  // Compute metrics dynamically from the audits list!
  const stats = useMemo(() => {
    const total = audits.length;
    if (total === 0) {
      return {
        total,
        eligible: 0,
        ineligible: 0,
        avgCGPA: 0,
        gradRate: 0,
        deptData: [],
        statusData: []
      };
    }

    const eligible = audits.filter(a => a.graduationStatus === 'Eligible' || a.graduationStatus === 'Graduated').length;
    const ineligible = total - eligible;
    
    const sumCGPA = audits.reduce((sum, a) => sum + (a.currentCGPA || 0), 0);
    const avgCGPA = Number((sumCGPA / total).toFixed(2));
    const gradRate = Number(((eligible / total) * 100).toFixed(0));

    // Group by department
    const depts: Record<string, { name: string; eligible: number; ineligible: number }> = {};
    audits.forEach(a => {
      const deptName = a.student?.department?.shortName || a.student?.department?.name || 'Unknown';
      if (!depts[deptName]) {
        depts[deptName] = { name: deptName, eligible: 0, ineligible: 0 };
      }
      if (a.graduationStatus === 'Eligible' || a.graduationStatus === 'Graduated') {
        depts[deptName].eligible++;
      } else {
        depts[deptName].ineligible++;
      }
    });

    const statusData = [
      { name: 'Eligible / Graduated', value: eligible, color: '#10B981' },
      { name: 'Ineligible', value: ineligible, color: '#EF4444' }
    ];

    return {
      total,
      eligible,
      ineligible,
      avgCGPA,
      gradRate,
      deptData: Object.values(depts),
      statusData
    };
  }, [audits]);

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Eligible Students</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.eligible}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Out of {stats.total} total audits</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Graduation Rate</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.gradRate}%</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Completed curriculum successfully</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average CGPA</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.avgCGPA.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Across all audited profiles</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ineligible Count</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.ineligible}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Barriers or warning states</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Recharts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eligibility Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Graduation Eligibility Ratio</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} layout="vertical" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-wise compliance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Department-wise Graduation Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.deptData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="eligible" name="Eligible / Graduated" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ineligible" name="Ineligible" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
