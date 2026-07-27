import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/api-client';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  FileText, 
  AlertCircle, 
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  UserCheck
} from 'lucide-react';

interface AdvisorRegistrarReviewProps {
  onSelectStudent: (studentId: number) => void;
}

export const AdvisorRegistrarReview: React.FC<AdvisorRegistrarReviewProps> = ({ onSelectStudent }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Submitted');
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');
  const [finalizeGraduation, setFinalizeGraduation] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/graduation-applications');
      setApplications(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Error fetching applications for review', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await apiClient.patch(`/graduation-applications/${id}/approve`, {
        remarks,
        finalizeGraduation
      });
      setReviewingId(null);
      setRemarks('');
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Approval failed.');
    }
  };

  const handleReject = async (id: number) => {
    if (!remarks) {
      alert('Remarks are required for rejecting applications.');
      return;
    }
    try {
      await apiClient.patch(`/graduation-applications/${id}/reject`, {
        remarks
      });
      setReviewingId(null);
      setRemarks('');
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Rejection failed.');
    }
  };

  const filteredApps = applications.filter(app => {
    const student = app.student;
    const nameMatch = student?.fullName?.toLowerCase().includes(search.toLowerCase()) || 
                      student?.registrationNumber?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === 'All' || app.status === statusFilter;
    return nameMatch && statusMatch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search by student, reg number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto py-1">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          {['All', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Graduated'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                statusFilter === status 
                  ? 'bg-slate-800 text-white border-slate-800' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table/List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading graduation applications...</div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No applications found matching the filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                  <th className="p-4 pl-6">Filing # / Date</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Program / Dept</th>
                  <th className="p-4">Graduation Term</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredApps.map(app => (
                  <React.Fragment key={app.id}>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6">
                        <div className="font-mono text-xs font-semibold text-slate-800">{app.applicationNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(app.applicationDate).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {app.student?.fullName}
                        <div className="font-mono text-[10px] text-slate-400 font-normal">{app.student?.registrationNumber}</div>
                      </td>
                      <td className="p-4 text-xs font-medium">
                        {app.student?.program?.name}
                        <div className="text-[10px] text-slate-400 font-normal">{app.student?.department?.name}</div>
                      </td>
                      <td className="p-4 font-medium">
                        {app.graduationTerm} {app.graduationYear}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          app.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                          app.status === 'Graduated' ? 'bg-indigo-50 text-indigo-700' :
                          app.status === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                          app.status === 'Under Review' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6 space-x-2">
                        <button
                          onClick={() => onSelectStudent(app.studentId)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition rounded-lg inline-flex items-center gap-1"
                        >
                          Audit <ExternalLink className="h-3 w-3" />
                        </button>
                        
                        {(app.status === 'Submitted' || app.status === 'Under Review') && (
                          <button
                            onClick={() => setReviewingId(reviewingId === app.id ? null : app.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition rounded-lg"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Review Expanded Section */}
                    {reviewingId === app.id && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50/50 p-6 pl-6 border-b border-slate-100">
                          <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-4 max-w-2xl">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                              <UserCheck className="h-4 w-4 text-indigo-500" />
                              Process Application: {app.applicationNumber}
                            </h4>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision Remarks</label>
                              <textarea
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="Add comments, missing requirements, or approval criteria..."
                                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                rows={3}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="finalize"
                                checked={finalizeGraduation}
                                onChange={e => setFinalizeGraduation(e.target.checked)}
                                className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 rounded"
                              />
                              <label htmlFor="finalize" className="text-xs font-semibold text-slate-600 cursor-pointer">
                                Mark student status as **GRADUATED** immediately in the Student Profile
                              </label>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(app.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1 transition shadow-sm"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" /> Approve Graduation
                              </button>
                              <button
                                onClick={() => handleReject(app.id)}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1 transition shadow-sm"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" /> Reject Application
                              </button>
                              <button
                                onClick={() => setReviewingId(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};
