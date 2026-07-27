import React, { useState } from 'react';
import { 
  AlertTriangle, Plus, X, CheckCircle, Clock, 
  HelpCircle, ShieldAlert, FileText, Send 
} from 'lucide-react';

interface HostelComplaintsProps {
  complaints: any[];
  onAddComplaint: (data: any) => Promise<void>;
  onUpdateComplaint: (id: number, data: any) => Promise<void>;
  isAdminOrWarden: boolean;
  userStudentId: number | undefined;
}

export const HostelComplaints: React.FC<HostelComplaintsProps> = ({
  complaints,
  onAddComplaint,
  onUpdateComplaint,
  isAdminOrWarden,
  userStudentId,
}) => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  // Submit Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [description, setDescription] = useState('');

  // Resolve Form Fields
  const [status, setStatus] = useState('In Progress');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openSubmitModal = () => {
    setTitle('');
    setCategory('Electrical');
    setDescription('');
    setError(null);
    setIsSubmitModalOpen(true);
  };

  const openResolveModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setStatus(complaint.status === 'Pending' ? 'In Progress' : complaint.status);
    setRemarks(complaint.remarks || '');
    setError(null);
    setIsResolveModalOpen(true);
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onAddComplaint({
        studentId: userStudentId, // Will be used if student files
        title: title.trim(),
        category,
        description: description.trim(),
      });
      setIsSubmitModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await onUpdateComplaint(selectedComplaint.id, {
        status,
        remarks,
      });
      setIsResolveModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update complaint status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter complaints based on user roles
  const filteredComplaints = complaints.filter((c) => {
    if (userStudentId && c.studentId !== userStudentId) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6" id="hostel-complaints-tab">
      
      {/* Tab Header Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Hostel Helpdesk & Support Tickets</h2>
          <p className="text-xs text-slate-500">Submit requests for broken assets, internet failures, electrical glitches, and other repairs.</p>
        </div>
        {!isAdminOrWarden && userStudentId && (
          <button
            onClick={openSubmitModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition cursor-pointer"
            id="btn-add-complaint"
          >
            <Plus className="h-4 w-4" /> File Support Ticket
          </button>
        )}
      </div>

      {/* Complaints List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredComplaints.map((c) => {
          const authorName = c.student 
            ? `${c.student.user?.firstName} ${c.student.user?.lastName}` 
            : 'Academic Host';
          const roomCode = c.room 
            ? `${c.room.building?.buildingCode} • Room ${c.room.roomNumber}`
            : 'Not Assigned';

          return (
            <div 
              key={c.id} 
              className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all relative"
              id={`complaint-card-${c.id}`}
            >
              <div>
                {/* Upper row */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{c.category}</span>
                    <h3 className="text-base font-black text-slate-900 leading-snug mt-0.5">{c.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase font-mono ${
                    c.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                    c.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">{c.description}</p>

                {/* Meta details */}
                <div className="space-y-1.5 pt-4 border-t border-slate-50 text-[11px] text-slate-400">
                  <p>Location: <strong className="text-slate-700">{roomCode}</strong></p>
                  {isAdminOrWarden && <p>Student: <strong className="text-slate-700">{authorName} ({c.student?.rollNumber})</strong></p>}
                  <p>Logged: <strong className="text-slate-700">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' as any })}
                  </strong></p>
                </div>

                {/* Resolution Remarks if available */}
                {c.remarks && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <p className="font-bold text-slate-600 uppercase font-mono text-[9px]">Resolution / Warden Remarks</p>
                    <p className="text-slate-500 mt-1 leading-normal italic">"{c.remarks}"</p>
                  </div>
                )}
              </div>

              {/* Status Action for Warden */}
              {isAdminOrWarden && c.status !== 'Resolved' && (
                <div className="pt-4 border-t border-slate-50 mt-4 flex justify-end">
                  <button
                    onClick={() => openResolveModal(c)}
                    className="px-3 py-1.5 bg-slate-150 text-slate-900 hover:bg-slate-200 text-[10px] font-black rounded-lg flex items-center gap-1 transition"
                  >
                    <Clock className="h-3.5 w-3.5" /> Update Ticket Status
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredComplaints.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-2xl">
            <AlertTriangle className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold">No active complaints or support tickets logged.</p>
          </div>
        )}
      </div>

      {/* COMPLAINT FILE MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="complaint-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">File Support / Complaint Ticket</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="Electrical">Electrical (Broken fan, lights, sockets)</option>
                  <option value="Plumbing">Plumbing (Clogged washroom, water leak, taps)</option>
                  <option value="Internet/Wifi">Internet & Wi-Fi Problems</option>
                  <option value="Housekeeping">Housekeeping & Cleaning Services</option>
                  <option value="Furniture/Damage">Broken Furniture & Locks</option>
                  <option value="Noise/Dispute">Hostel Noise or Roommate Grievance</option>
                  <option value="Other">Other Miscellaneous Repairs</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WiFi router disconnected, Water tap dripping"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Detailed Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue with specifications so we can deploy the right maintenance team..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-black bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 transition flex items-center gap-1"
                >
                  <Send className="h-3 w-3" /> {submitting ? 'Submitting...' : 'File Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINT RESOLUTION MODAL */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="resolve-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Update Grievance Status</h3>
              <button onClick={() => setIsResolveModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Selected Complaint detail */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{selectedComplaint?.category}</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">{selectedComplaint?.title}</p>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Set Ticket Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="Pending">Pending / Unassigned</option>
                  <option value="In Progress">In Progress / Assigned Repairman</option>
                  <option value="Resolved">Resolved / Closed</option>
                </select>
              </div>

              {/* Action / Resolution Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Warden Resolution Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide resolution details for the student to read..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-black bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {submitting ? 'Updating...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
