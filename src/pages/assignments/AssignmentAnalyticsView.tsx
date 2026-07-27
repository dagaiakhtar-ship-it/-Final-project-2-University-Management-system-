import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AssignmentAnalytics } from './types';
import { Award, Users, FileCheck, AlertTriangle, Percent } from 'lucide-react';

interface AnalyticsProps {
  analytics: AssignmentAnalytics;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#6B7280'];

export const AssignmentAnalyticsView: React.FC<AnalyticsProps> = ({ analytics }) => {
  const { stats, gradeDistribution } = analytics;

  const data = [
    { name: 'Enrolled', value: stats.enrolledStudents, icon: Users, color: 'text-blue-500 bg-blue-50' },
    { name: 'Submissions', value: stats.totalSubmissions, icon: FileCheck, color: 'text-emerald-500 bg-emerald-50' },
    { name: 'Graded', value: stats.gradedSubmissions, icon: Award, color: 'text-purple-500 bg-purple-50' },
    { name: 'Late', value: stats.lateSubmissions, icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
  ];

  // Grade chart data
  const chartData = gradeDistribution.map((item, idx) => ({
    name: item.grade,
    count: item.count,
    fill: COLORS[idx % COLORS.length],
  }));

  // Pie chart for submission vs missing
  const missingCount = Math.max(0, stats.enrolledStudents - stats.totalSubmissions);
  const submissionPieData = [
    { name: 'Submitted', value: stats.totalSubmissions },
    { name: 'Missing/Pending', value: missingCount },
  ];
  const PIE_COLORS = ['#10B981', '#E5E7EB'];

  return (
    <div className="space-y-6">
      {/* 1. Bento Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Enrolled Students</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.enrolledStudents}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Submission Rate</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.submissionRate}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Average Marks</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">
              {stats.averageMarks} <span className="text-sm text-gray-400 font-normal">/ {analytics.totalMarks}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Late submission rate</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.lateSubmissionRate}%</p>
          </div>
        </div>
      </div>

      {/* 2. Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Grade Distribution</h3>
          {stats.gradedSubmissions === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <Award className="h-12 w-12 text-gray-200 mb-2" />
              <p className="text-sm">No graded submissions yet.</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs font-medium text-gray-400" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs font-medium text-gray-400" />
                  <Tooltip
                    cursor={{ fill: '#F9FAFB' }}
                    contentStyle={{ background: '#1F2937', borderRadius: '8px', color: '#FFF', border: 'none' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Submission Rate Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Submission Status</h3>
          <div className="flex-1 h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={submissionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {submissionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">{stats.submissionRate}%</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Performance Table */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Key Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-xl">
            <span className="block text-xs font-medium text-gray-400 uppercase">Grading Completion</span>
            <span className="text-xl font-bold text-gray-800 mt-1 block">
              {stats.totalSubmissions > 0
                ? Math.round((stats.gradedSubmissions / stats.totalSubmissions) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <span className="block text-xs font-medium text-gray-400 uppercase">Pass Percentage</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">{stats.passPercentage}%</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <span className="block text-xs font-medium text-gray-400 uppercase">Average Percentage</span>
            <span className="text-xl font-bold text-blue-600 mt-1 block">
              {analytics.totalMarks > 0
                ? Math.round((stats.averageMarks / analytics.totalMarks) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <span className="block text-xs font-medium text-gray-400 uppercase">Pending Submissions</span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {stats.enrolledStudents - stats.totalSubmissions}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AssignmentAnalyticsView;
