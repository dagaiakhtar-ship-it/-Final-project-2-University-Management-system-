import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Database,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sliders,
} from 'lucide-react';
import { DemoRestoreCard } from '../../components/common/DemoRestoreCard';

interface SettingItem {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'academic' | 'security' | 'notifications'>('general');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/settings');
      if (response.data?.status === 'success') {
        const list: SettingItem[] = response.data.data;
        const sMap: Record<string, string> = {};
        const dMap: Record<string, string> = {};
        list.forEach((item) => {
          sMap[item.key] = item.value;
          dMap[item.key] = item.description || '';
        });
        setSettings(sMap);
        setDescriptions(dMap);
      } else {
        throw new Error('Could not retrieve system configuration parameters.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'Error loading system configuration'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await apiClient.post('/settings/bulk', { settings });
      if (response.data?.status === 'success') {
        setSuccessMsg('System configuration settings saved successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error('Save operation failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'Failed to save system settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="System Settings & Governance"
      description="Configure global university parameters, security policies, and administrative operations."
    >
      <div className="space-y-6 max-w-5xl">
        {/* Success / Error Banners */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-3 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center space-x-3 text-sm font-medium">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Baseline & System Restore Card */}
        <DemoRestoreCard />

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 space-x-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 text-sm font-mono uppercase tracking-wider font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>General Institution</span>
          </button>
          <button
            onClick={() => setActiveTab('academic')}
            className={`pb-3 text-sm font-mono uppercase tracking-wider font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'academic'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Academic Thresholds</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-sm font-mono uppercase tracking-wider font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Security & Auth</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 text-sm font-mono uppercase tracking-wider font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'notifications'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Communications</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-mono text-gray-500">Retrieving system configuration matrix...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 space-y-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-3">
                    Institutional Identity & Session
                  </h3>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-2">
                      University Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                      value={settings.UNIVERSITY_NAME || ''}
                      onChange={(e) => handleChange('UNIVERSITY_NAME', e.target.value)}
                      disabled={!isSuperAdmin}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {descriptions.UNIVERSITY_NAME || 'Official university banner name across transcripts and reports.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-2">
                      Active Academic Session
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono"
                      value={settings.ACADEMIC_YEAR || ''}
                      onChange={(e) => handleChange('ACADEMIC_YEAR', e.target.value)}
                      disabled={!isSuperAdmin}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {descriptions.ACADEMIC_YEAR || 'Active academic calendar period for course scheduling and grading.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-2">
                      Maintenance Mode Status
                    </label>
                    <select
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                      value={settings.MAINTENANCE_MODE || 'false'}
                      onChange={(e) => handleChange('MAINTENANCE_MODE', e.target.value)}
                      disabled={!isSuperAdmin}
                    >
                      <option value="false">Disabled (Normal Operations)</option>
                      <option value="true font-bold">Enabled (Restricted Admin Access Only)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-3">
                    Academic Policies & Rules
                  </h3>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-2">
                      Mandatory Attendance Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono"
                      value={settings.ATTENDANCE_THRESHOLD || '75'}
                      onChange={(e) => handleChange('ATTENDANCE_THRESHOLD', e.target.value)}
                      disabled={!isSuperAdmin}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {descriptions.ATTENDANCE_THRESHOLD || 'Minimum attendance percentage required to sit for final semester examinations.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-2">
                      Passing Grade Percentage Marks (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono"
                      value={settings.PASSING_GRADE_PERCENTAGE || '40'}
                      onChange={(e) => handleChange('PASSING_GRADE_PERCENTAGE', e.target.value)}
                      disabled={!isSuperAdmin}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {descriptions.PASSING_GRADE_PERCENTAGE || 'Minimum score required to satisfy subject completion requirements.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-3">
                    Security & Authentication Controls
                  </h3>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-2">
                      Two-Factor Authentication Requirement
                    </label>
                    <select
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                      value={settings.TWO_FACTOR_AUTHENTICATION || 'optional'}
                      onChange={(e) => handleChange('TWO_FACTOR_AUTHENTICATION', e.target.value)}
                      disabled={!isSuperAdmin}
                    >
                      <option value="optional font-bold">Optional for All Users</option>
                      <option value="mandatory_admin">Mandatory for Admin Roles</option>
                      <option value="mandatory_all">Enforced for All Users</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-3">
                    Automated System Email & Communications
                  </h3>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-2">
                      System Transactional Email Dispatch
                    </label>
                    <select
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                      value={settings.SYSTEM_EMAIL_NOTIFICATIONS || 'enabled'}
                      onChange={(e) => handleChange('SYSTEM_EMAIL_NOTIFICATIONS', e.target.value)}
                      disabled={!isSuperAdmin}
                    >
                      <option value="enabled">Enabled (Dispatch emails for assignments, results, leaves)</option>
                      <option value="disabled">Disabled (Suppress automated outbound email alerts)</option>
                    </select>
                  </div>
                </div>
              )}

              {isSuperAdmin && (
                <div className="pt-6 border-t flex justify-end">
                  <Button variant="primary" type="submit" disabled={saving} leftIcon={saving ? RefreshCw : Save}>
                    {saving ? 'Saving Changes...' : 'Save Configuration'}
                  </Button>
                </div>
              )}
            </Card>
          </form>
        )}
      </div>
    </PageContainer>
  );
};
