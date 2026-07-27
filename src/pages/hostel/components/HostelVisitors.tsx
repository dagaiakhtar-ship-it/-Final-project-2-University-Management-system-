import React, { useState } from 'react';
import { 
  Users, Plus, LogOut, X, CheckCircle, 
  Clock, Phone, ShieldAlert, FileText, Search 
} from 'lucide-react';

interface HostelVisitorsProps {
  visitorLogs: any[];
  students: any[];
  onAddVisitor: (data: any) => Promise<void>;
  onCheckoutVisitor: (id: number) => Promise<void>;
  isAdminWardenOrSecurity: boolean;
  userStudentId: number | undefined;
}

export const HostelVisitors: React.FC<HostelVisitorsProps> = ({
  visitorLogs,
  students,
  onAddVisitor,
  onCheckoutVisitor,
  isAdminWardenOrSecurity,
  userStudentId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [studentId, setStudentId] = useState<number | ''>('');
  const [visitorName, setVisitorName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openModal = () => {
    setStudentId('');
    setVisitorName('');
    setRelationship('');
    setPhone('');
    setApprovedBy('Hostel Security');
    setRemarks('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !visitorName.trim() || !relationship.trim() || !phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onAddVisitor({
        studentId: Number(studentId),
        visitorName: visitorName.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        approvedBy,
        remarks,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to log visitor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (id: number) => {
    try {
      await onCheckoutVisitor(id);
    } catch (err: any) {
      alert(err.message || 'Visitor checkout failed.');
    }
  };

  // Filter visitor logs
  const filteredLogs = visitorLogs.filter((log) => {
    // If logged in user is a STUDENT, only show visitor logs for themselves!
    if (userStudentId && log.studentId !== userStudentId) {
      return false;
    }

    const visitor = log.visitorName.toLowerCase();
    const student = `${log.student?.user?.firstName || ''} ${log.student?.user?.lastName || ''}`.toLowerCase();
    const roll = (log.student?.rollNumber || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    return visitor.includes(q) || student.includes(q) || roll.includes(q);
  });

  return (
    <div className="space-y-6" id="hostel-visitors-tab">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Campus Visitor Registry</h2>
          <p className="text-xs text-slate-500">Log guest entries, approve relations, and track checked-out visitors.</p>
        </div>
        {isAdminWardenOrSecurity && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition cursor-pointer"
            id="btn-add-visitor"
          >
            <Plus className="h-4 w-4" /> Log Guest Entry
          </button>
        )}
      </div>

      {/* Filter search bar */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-100 flex items-center">
        <Search className="h-4 w-4 text-slate-400 absolute left-6 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={userStudentId ? "Filter visitor logs..." : "Search by guest name, host student, roll number..."}
          className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-950 focus:border-slate-950 rounded-xl"
        />
      </div>

      {/* Visitor Logs List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase font-mono border-b border-slate-150">
              <tr>
                <th className="px-6 py-4">Visitor Details</th>
                <th className="px-6 py-4">Relationship</th>
                {!userStudentId && <th className="px-6 py-4">Host Student</th>}
                <th className="px-6 py-4">Host Room</th>
                <th className="px-6 py-4">Check-In Time</th>
                <th className="px-6 py-4">Check-Out Time</th>
                {isAdminWardenOrSecurity && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isCheckedIn = !log.checkOut;
                const hostStudentName = `${log.student?.user?.firstName || ''} ${log.student?.user?.lastName || ''}`;
                
                // Find active student room code
                const activeAlloc = log.student?.hostelAllocations?.[0];
                const roomInfo = activeAlloc 
                  ? `${activeAlloc.building?.buildingCode} - Room ${activeAlloc.room?.roomNumber}`
                  : 'N/A';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/40">
                    {/* Visitor details */}
                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      <div>
                        <span>{log.visitorName}</span>
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {log.phone}
                        </p>
                      </div>
                    </td>

                    {/* Relationship */}
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {log.relationship}
                    </td>

                    {/* Host Student */}
                    {!userStudentId && (
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        <div>
                          <span>{hostStudentName}</span>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.student?.rollNumber}</p>
                        </div>
                      </td>
                    )}

                    {/* Host Room */}
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {roomInfo}
                    </td>

                    {/* CheckIn Time */}
                    <td className="px-6 py-4 font-mono">
                      {new Date(log.checkIn).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>

                    {/* CheckOut Time */}
                    <td className="px-6 py-4 font-mono">
                      {log.checkOut ? (
                        new Date(log.checkOut).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                      ) : (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[9px] uppercase">
                          Active Visitor
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {isAdminWardenOrSecurity && (
                      <td className="px-6 py-4 text-right">
                        {isCheckedIn ? (
                          <button
                            onClick={() => handleCheckout(log.id)}
                            className="px-3 py-1 bg-slate-100 text-slate-800 hover:bg-slate-200 transition text-[10px] font-black rounded-lg inline-flex items-center gap-1 cursor-pointer"
                          >
                            <LogOut className="h-3 w-3" /> Register Check-Out
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">COMPLETED</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                    No visitor entries registered at this time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VISITORS FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="visitor-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Log Guest Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Host Student Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Host Student *</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- Choose Host Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.firstName} {s.user?.lastName} - Roll: {s.rollNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guest Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Guest Name *</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. John Doe Sr."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  required
                />
              </div>

              {/* Relationship & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Relationship *</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Parent, Sibling"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Approved By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Authorized By</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Entrance Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Luggage details or visitor purpose..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-black bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {submitting ? 'Logging...' : 'Register Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
