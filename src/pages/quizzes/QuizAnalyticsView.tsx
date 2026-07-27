import React, { useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Quiz, QuizSubmission } from './types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Award, Percent, Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface QuizAnalyticsViewProps {
  quiz: Quiz;
  submissions: QuizSubmission[];
}

export const QuizAnalyticsView: React.FC<QuizAnalyticsViewProps> = ({ quiz, submissions }) => {
  const analytics = useMemo(() => {
    const completed = submissions.filter(
      (s) => s.submissionStatus !== 'In Progress' && s.obtainedMarks !== null && s.obtainedMarks !== undefined
    );

    if (completed.length === 0) return null;

    const scores = completed.map((s) => s.obtainedMarks as number);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const average = scores.reduce((sum, val) => sum + val, 0) / scores.length;

    const passedCount = completed.filter((s) => (s.obtainedMarks || 0) >= quiz.passingMarks).length;
    const passPercentage = (passedCount / completed.length) * 100;

    // Grade distribution
    const grades: Record<string, number> = { 'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0 };
    completed.forEach((s) => {
      if (s.grade && s.grade in grades) {
        grades[s.grade]++;
      } else if (s.grade) {
        grades[s.grade] = (grades[s.grade] || 0) + 1;
      }
    });

    const gradeData = Object.entries(grades).map(([name, value]) => ({
      name,
      count: value,
    })).filter(g => g.count > 0 || ['A+', 'A', 'B', 'C', 'D', 'F'].includes(g.name));

    // Pass vs Fail distribution
    const passFailData = [
      { name: 'Passed', value: passedCount },
      { name: 'Failed', value: completed.length - passedCount },
    ];

    // Score distribution (binned)
    const scoreBins: Record<string, number> = {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0,
    };

    completed.forEach((s) => {
      const pct = s.percentage || 0;
      if (pct <= 20) scoreBins['0-20%']++;
      else if (pct <= 40) scoreBins['21-40%']++;
      else if (pct <= 60) scoreBins['41-60%']++;
      else if (pct <= 80) scoreBins['61-80%']++;
      else scoreBins['81-100%']++;
    });

    const binData = Object.entries(scoreBins).map(([range, count]) => ({
      range,
      count,
    }));

    return {
      total: completed.length,
      average: parseFloat(average.toFixed(1)),
      highest,
      lowest,
      passPercentage: parseFloat(passPercentage.toFixed(1)),
      gradeData,
      passFailData,
      binData,
    };
  }, [submissions, quiz]);

  const COLORS = ['#22c55e', '#ef4444'];

  if (!analytics) {
    return (
      <Card className="p-8 text-center bg-gray-50 border border-dashed border-gray-200">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Submissions Yet</h3>
        <p className="text-sm text-gray-500">
          Analytics will become available once students submit their quiz attempts.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center space-x-4 border border-gray-100 bg-white shadow-xs">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Submissions</p>
            <p className="text-2xl font-semibold text-gray-900">{analytics.total}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border border-gray-100 bg-white shadow-xs">
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Percentage</p>
            <p className="text-2xl font-semibold text-emerald-600">{analytics.passPercentage}%</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border border-gray-100 bg-white shadow-xs">
          <div className="p-3 rounded-full bg-violet-50 text-violet-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</p>
            <p className="text-2xl font-semibold text-gray-900">
              {analytics.average} <span className="text-sm text-gray-400">/ {quiz.totalMarks}</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border border-gray-100 bg-white shadow-xs">
          <div className="p-3 rounded-full bg-amber-50 text-amber-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Highest / Lowest</p>
            <p className="text-2xl font-semibold text-gray-900">
              {analytics.highest} <span className="text-sm text-gray-400">/ {analytics.lowest}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card className="p-5 border border-gray-100 bg-white shadow-xs flex flex-col h-[350px]">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Grade Distribution</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Score Intervals */}
        <Card className="p-5 border border-gray-100 bg-white shadow-xs flex flex-col h-[350px]">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Performance Distribution</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.binData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pass / Fail */}
        <Card className="p-5 border border-gray-100 bg-white shadow-xs flex flex-col h-[350px] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Pass vs Fail Ratio</h3>
            <span className="text-xs text-gray-500">Passing Mark: {quiz.passingMarks}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around flex-1 min-h-0">
            <div className="h-[220px] w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.passFailData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.passFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {analytics.passFailData.map((data, index) => (
                <div key={data.name} className="flex items-center space-x-3">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{data.name}</p>
                    <p className="text-xs text-gray-500">
                      {data.value} student(s) ({((data.value / analytics.total) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
