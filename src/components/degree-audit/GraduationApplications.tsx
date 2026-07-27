import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/api-client';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Send, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';

interface GraduationApplicationsProps {
  studentId: number;
  isEligible: boolean;
}

export const GraduationApplications: React.FC<GraduationApplicationsProps> = ({ studentId, isEligible }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [term, setTerm] = useState('Spring');
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchApplications = async () => {
    setFetching(true);
    try {
      const res = await apiClient.get('/graduation-applications');
      setApplications(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Error fetching applications', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.post('/graduation-applications', {
        studentId,
        graduationTerm: term,
        graduationYear: Number(year)
      });
      setSuccess('Your graduation application has been submitted successfully!');
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (appId: number) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.patch(`/graduation-applications/${appId}/withdraw`, {});
      setSuccess('Your graduation application has been withdrawn successfully.');
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to withdraw application.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'Graduated':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Graduated</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      case 'Withdrawn':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-500 border border-slate-200">Withdrawn</span>;
      case 'Under Review':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Under Review</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Submit Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-500" />
          Apply for Graduation
        </h3>
        
        {/* Eligibility warnings */}
        {!isEligible ? (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Ineligible to Graduate</span>
              You have not fulfilled all academic, credit, or experiential criteria. You can submit, but your advisor or registrar might reject the request.
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Academic Criteria Fulfilled</span>
              You have passed all audit diagnostics. You are fully eligible to apply for graduation!
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Graduation Term</label>
            <select
              value={term}
              onChange={e => setTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Graduation Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              min={2026}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
          {success && <p className="text-xs text-emerald-600 font-semibold">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/15 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>

      {/* Applications List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Your Graduation Filings</h3>

        {fetching ? (
          <div className="text-center py-12 text-slate-400">Loading Applications...</div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-100 rounded-xl text-center">
            <Calendar className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="font-semibold text-slate-700">No Applications Filed Yet</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">Submit the form on the left to initiate your graduation filing process.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="border border-slate-100 rounded-2xl p-5 hover:bg-slate-50/50 transition">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block">{app.applicationNumber}</span>
                    <h4 className="font-bold text-slate-800">
                      Graduation Filing: {app.graduationTerm} {app.graduationYear}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      Filed on {new Date(app.applicationDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(app.status)}
                    {['Submitted', 'Under Review'].includes(app.status) && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        disabled={loading}
                        className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg border border-transparent hover:border-rose-100 transition disabled:opacity-50"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>

                {/* Approver Details */}
                {(app.reviewedBy || app.remarks) && (
                  <div className="mt-4 pt-4 border-t border-slate-100/70 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {app.reviewedBy && (
                      <div>
                        <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Reviewed By</span>
                        <span className="text-slate-700 font-medium mt-1 block">{app.reviewedBy}</span>
                      </div>
                    )}
                    {app.remarks && (
                      <div>
                        <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Advisor Remarks</span>
                        <span className="text-slate-700 font-medium mt-1 block italic">"{app.remarks}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
