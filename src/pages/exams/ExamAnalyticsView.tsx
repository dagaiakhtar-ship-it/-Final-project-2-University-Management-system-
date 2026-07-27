import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { apiClient } from '../../api/api-client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, RefreshCw, Sparkles, Trophy } from 'lucide-react';

export const ExamAnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/exams/analytics/overview');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load exam analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-slate-100">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
        <span className="text-slate-500 font-semibold text-xs uppercase">Running analytics engine...</span>
      </div>
    );
  }

  if (!data) return null;

  const { overview, roomUtilization, invigilatorWorkload, examDistribution } = data;

  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8" id="exam-analytics-dashboard">
      {/* Overview Grid cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-100 text-left">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Scheduled</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{overview.scheduled}</span>
          <span className="text-[9px] text-emerald-600 font-black mt-1 block">✓ Hall Booked</span>
        </Card>

        <Card className="p-4 bg-white border border-slate-100 text-left">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft Exams</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{overview.draft}</span>
          <span className="text-[9px] text-amber-600 font-black mt-1 block">⌛ Needs Room Allocation</span>
        </Card>

        <Card className="p-4 bg-white border border-slate-100 text-left">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Participation</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{overview.studentParticipation}</span>
          <span className="text-[9px] text-indigo-600 font-black mt-1 block">👥 Registered Candidates</span>
        </Card>

        <Card className="p-4 bg-white border border-slate-100 text-left">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Sessions</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{overview.completed}</span>
          <span className="text-[9px] text-emerald-600 font-black mt-1 block">✓ Successfully Executed</span>
        </Card>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Booking load */}
        <Card className="p-5 bg-white border border-slate-100 flex flex-col justify-between" id="room-utilization-card">
          <div className="border-b border-slate-100 pb-3 mb-4 text-left">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" /> Room Allocation Frequencies
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Booked exam frequencies across university lecture halls.</p>
          </div>
          {roomUtilization.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-bold">No active room bookings recorded.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomUtilization}>
                  <XAxis dataKey="room" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Exams Booked" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Exam distribution */}
        <Card className="p-5 bg-white border border-slate-100 flex flex-col justify-between" id="exam-distribution-card">
          <div className="border-b border-slate-100 pb-3 mb-4 text-left">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-indigo-500" /> Exam Distribution by Type
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Classification ratios of different evaluation types.</p>
          </div>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={examDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {examDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend block */}
            <div className="w-full sm:w-1/2 text-left space-y-2">
              {examDistribution.map((entry: any, index: number) => (
                <div key={entry.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium text-slate-600">{entry.type}</span>
                  </div>
                  <span className="font-bold text-slate-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Invigilator Duties load */}
        <Card className="p-5 bg-white border border-slate-100 lg:col-span-2 text-left" id="invigilator-workload-card">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-4 w-4 text-indigo-500" /> Invigilator Duty Workload
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Supervising assignment frequencies per academic faculty staff member.</p>
          </div>
          {invigilatorWorkload.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-bold">No supervision duties allocated.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={invigilatorWorkload} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="teacher" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Duties Assigned" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
