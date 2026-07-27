import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import {
  BarChart2,
  FileText,
  Download,
  Calendar,
  Users,
  BookOpen,
  Award,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface StatsData {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalDepartments: number;
  totalSavedReports: number;
}

interface SavedReportItem {
  id: number;
  reportName: string;
  reportType: string;
  createdBy: string;
  configuration: string;
  schedule: string | null;
}

export const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        apiClient.get('/reports/summary'),
        apiClient.get('/reports/saved'),
      ]);

      if (statsRes.data?.status === 'success') {
        setStats(statsRes.data.data);
      }
      if (reportsRes.data?.status === 'success') {
        setSavedReports(reportsRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'Error loading report metrics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateReport = async (type: string) => {
    setGenerating(true);
    setActiveReport(type);
    setError(null);
    try {
      const res = await apiClient.get(`/reports/generate/${type}`);
      if (res.data?.status === 'success') {
        setReportData(res.data.data);
      } else {
        throw new Error('Report execution failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'Failed to generate report output.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(reportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${activeReport || 'report'}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <PageContainer
      title="Reports & Institutional Intelligence"
      description="Executive analytics engine, automated compliance reporting, and custom data exports."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 flex items-center space-x-4 border-l-4 border-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Students Enrolled</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalStudents || 0}</h3>
            </div>
          </Card>

          <Card className="p-5 flex items-center space-x-4 border-l-4 border-emerald-500">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Active Catalog Courses</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats?.totalCourses || 0}</h3>
            </div>
          </Card>

          <Card className="p-5 flex items-center space-x-4 border-l-4 border-indigo-500">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Total Enrollments</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats?.totalEnrollments || 0}</h3>
            </div>
          </Card>

          <Card className="p-5 flex items-center space-x-4 border-l-4 border-amber-500">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Saved Reports</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats?.totalSavedReports || 0}</h3>
            </div>
          </Card>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        {/* Quick Report Execution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900">Enrollment Summary</h3>
            </div>
            <p className="text-xs text-gray-500">
              Complete audit report of student course enrollments, status distribution, and dates.
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={generating && activeReport === 'ENROLLMENT_SUMMARY' ? RefreshCw : BarChart2}
              onClick={() => handleGenerateReport('ENROLLMENT_SUMMARY')}
              className="w-full"
            >
              {generating && activeReport === 'ENROLLMENT_SUMMARY' ? 'Generating...' : 'Run Enrollment Report'}
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900">Student Directory</h3>
            </div>
            <p className="text-xs text-gray-500">
              Department-wise student roster, registration status, and assigned faculty advisors.
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={generating && activeReport === 'STUDENT_DIRECTORY' ? RefreshCw : BarChart2}
              onClick={() => handleGenerateReport('STUDENT_DIRECTORY')}
              className="w-full"
            >
              {generating && activeReport === 'STUDENT_DIRECTORY' ? 'Generating...' : 'Run Student Directory'}
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900">Faculty & Staff Analysis</h3>
            </div>
            <p className="text-xs text-gray-500">
              Academic teaching load, faculty designation records, and departmental assignment breakdown.
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={generating && activeReport === 'FACULTY_ANALYSIS' ? RefreshCw : BarChart2}
              onClick={() => handleGenerateReport('FACULTY_ANALYSIS')}
              className="w-full"
            >
              {generating && activeReport === 'FACULTY_ANALYSIS' ? 'Generating...' : 'Run Faculty Report'}
            </Button>
          </Card>
        </div>

        {/* Report Output Viewer */}
        {reportData && (
          <Card className="p-6 space-y-4 border-2 border-primary/20">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Report Results: <span className="font-mono text-primary">{activeReport}</span>
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  Generated at {new Date().toLocaleString()}
                </p>
              </div>
              <Button variant="primary" size="sm" leftIcon={Download} onClick={handleExportCSV}>
                Export Report
              </Button>
            </div>

            <div className="bg-gray-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-96">
              <pre>{JSON.stringify(reportData, null, 2)}</pre>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};
