import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';
import {
  Database,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Server,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

interface BaselineStats {
  users?: number;
  students?: number;
  teachers?: number;
  courses?: number;
  timetables?: number;
}

interface DemoBaseline {
  savedAt?: string;
  savedBy?: string;
  status?: string;
  description?: string;
  restoreCount?: number;
  lastRestoredAt?: string | null;
  lastRestoredBy?: string | null;
  stats?: BaselineStats;
}

interface DemoRestoreCardProps {
  className?: string;
  onRestored?: () => void;
}

export const DemoRestoreCard: React.FC<DemoRestoreCardProps> = ({ className = '', onRestored }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [baseline, setBaseline] = useState<DemoBaseline | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreStep, setRestoreStep] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/demo/status');
      if (res.data?.success && res.data?.baseline) {
        setBaseline(res.data.baseline);
      }
    } catch (err) {
      console.error('Failed fetching demo status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveDemo = async () => {
    if (!isAdmin) return;
    try {
      setSaving(true);
      setToastMessage(null);
      const res = await apiClient.post('/demo/save', {
        description: `Permanent demo baseline snapshot recorded by ${user?.email || 'Admin'}.`
      });
      if (res.data?.success) {
        setBaseline(res.data.baseline);
        setToastMessage({
          type: 'success',
          text: 'Current app state saved permanently as the active demo baseline!'
        });
      }
    } catch (err: any) {
      console.error('Save demo error:', err);
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save demo baseline state.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreApp = async () => {
    if (!isAdmin) return;
    try {
      setShowConfirmModal(false);
      setRestoring(true);
      setToastMessage(null);

      setRestoreStep('1/3 Clearing and rebuilding database schema...');
      await new Promise((r) => setTimeout(r, 600));

      setRestoreStep('2/3 Re-seeding university structure, roles, timetables & profiles...');
      const res = await apiClient.post('/demo/restore');

      setRestoreStep('3/3 Finalizing application state & refreshing session...');
      await new Promise((r) => setTimeout(r, 400));

      if (res.data?.success) {
        setBaseline(res.data.baseline);
        setToastMessage({
          type: 'success',
          text: 'Whole application successfully restored to the permanent demo state!'
        });
        if (onRestored) {
          onRestored();
        }
      }
    } catch (err: any) {
      console.error('Restore app error:', err);
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to restore application state.'
      });
    } finally {
      setRestoring(false);
      setRestoreStep('');
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <Card className={`p-6 border border-slate-200/90 rounded-2xl shadow-sm bg-white flex flex-col gap-5 ${className}`} id="demo-restore-card">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/60 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Permanent Demo & System Restore</h3>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> ADMIN CONTROL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Save the current application state as a permanent baseline, or restore the whole system to clean demo data at any time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveDemo}
              disabled={saving || restoring}
              className="text-xs gap-1.5 rounded-xl border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
              id="btn-save-demo-permanently"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-indigo-600" />}
              {saving ? 'Saving Baseline...' : 'Save Demo Permanently'}
            </Button>

            <Button
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              disabled={saving || restoring}
              className="text-xs gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-xs cursor-pointer"
              id="btn-restore-whole-app"
            >
              {restoring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {restoring ? 'Restoring App...' : 'Restore Whole App'}
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {toastMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Restoring progress bar indicator */}
        {restoring && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" /> Restoring University System...
              </span>
              <span className="font-mono text-[11px] text-emerald-700">{restoreStep}</span>
            </div>
            <div className="w-full bg-emerald-200/80 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full animate-pulse w-full"></div>
            </div>
          </div>
        )}

        {/* Status Details */}
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-400 font-mono">Loading demo baseline details...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Active Baseline Info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Active Demo Baseline</span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {baseline?.status || 'Active Permanent Baseline'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 pt-1 border-t border-slate-200/60">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Saved: {baseline?.savedAt ? new Date(baseline.savedAt).toLocaleString() : 'System Default'}
              </div>
            </div>

            {/* Restores Count */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Restoration Activity</span>
              <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span className="font-mono text-base">{baseline?.restoreCount || 0}</span> Restores Executed
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 pt-1 border-t border-slate-200/60 truncate">
                <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Last: {baseline?.lastRestoredAt ? new Date(baseline.lastRestoredAt).toLocaleString() : 'Never restored'}
              </div>
            </div>

            {/* Saved By Admin */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Baseline Administrator</span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm truncate">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">{baseline?.savedBy || 'System Baseline'}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 pt-1 border-t border-slate-200/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Ready to restore
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Modal for Restoring Whole App */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="restore-confirm-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl border border-amber-300">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Restore Whole Application?</h3>
                <p className="text-xs text-slate-500">System Database Restoration</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed flex flex-col gap-2">
              <p>
                <strong>Warning:</strong> Restoring the whole application will re-seed all tables and reset data (departments, courses, timetables, users, attendance records, assignments, and exams) back to the saved permanent demo baseline.
              </p>
              <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] pt-2 border-t border-slate-200">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>All standard demo accounts (Admin, Faculty, Students) will remain functional.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleRestoreApp}
                className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer"
                id="btn-confirm-restore-app"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Confirm & Restore Whole App
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
