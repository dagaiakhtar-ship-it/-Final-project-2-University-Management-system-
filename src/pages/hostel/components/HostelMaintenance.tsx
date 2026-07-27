import React, { useState } from 'react';
import { 
  Wrench, Plus, X, CheckCircle, Clock, ShieldAlert, 
  DollarSign, Hammer, AlertTriangle, AlertCircle 
} from 'lucide-react';

interface HostelMaintenanceProps {
  maintenances: any[];
  rooms: any[];
  onAddMaintenance: (data: any) => Promise<void>;
  onUpdateMaintenance: (id: number, data: any) => Promise<void>;
  isAdminOrWarden: boolean;
  userStudentId: number | undefined;
  allocations: any[];
}

export const HostelMaintenance: React.FC<HostelMaintenanceProps> = ({
  maintenances,
  rooms,
  onAddMaintenance,
  onUpdateMaintenance,
  isAdminOrWarden,
  userStudentId,
  allocations,
}) => {
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);

  // Form Fields
  const [roomId, setRoomId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [priority, setPriority] = useState('Medium');

  // Update Fields
  const [status, setStatus] = useState('Assigned');
  const [cost, setCost] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openRegModal = () => {
    setRoomId(rooms[0]?.id || '');
    setTitle('');
    setDescription('');
    setCategory('Electrical');
    setPriority('Medium');
    setError(null);
    setIsRegModalOpen(true);
  };

  const openUpdateModal = (maint: any) => {
    setSelectedMaintenance(maint);
    setStatus(maint.status === 'Pending' ? 'Assigned' : maint.status);
    setCost(maint.cost || 0);
    setRemarks(maint.remarks || '');
    setError(null);
    setIsUpdateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !title.trim() || !description.trim()) {
      setError('Room, Title, and Description are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onAddMaintenance({
        roomId: Number(roomId),
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      setIsRegModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to file maintenance request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await onUpdateMaintenance(selectedMaintenance.id, {
        status,
        cost: Number(cost),
        remarks,
      });
      setIsUpdateModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update maintenance request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Student room lookup
  const myActiveAllocation = userStudentId 
    ? allocations.find((a) => a.studentId === userStudentId && a.status === 'Active')
    : null;

  // Filter listings: students only see maintenance for their allocated room!
  const filteredMaintenances = maintenances.filter((m) => {
    if (userStudentId) {
      return myActiveAllocation && m.roomId === myActiveAllocation.roomId;
    }
    return true;
  });

  return (
    <div className="space-y-6" id="hostel-maintenance-tab">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Facility Maintenance & Repairs</h2>
          <p className="text-xs text-slate-500">Track and deploy electricians, plumbers, painters, and carpenters to resolve room damages.</p>
        </div>
        {isAdminOrWarden && (
          <button
            onClick={openRegModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition cursor-pointer"
            id="btn-add-maintenance"
          >
            <Plus className="h-4 w-4" /> Register Repair Work
          </button>
        )}
      </div>

      {/* Grid List of work logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaintenances.map((m) => {
          const roomCode = m.room 
            ? `${m.room.building?.buildingCode} • Room ${m.room.roomNumber}`
            : 'Unassigned';

          return (
            <div 
              key={m.id} 
              className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all relative"
              id={`maintenance-card-${m.id}`}
            >
              <div>
                {/* Upper line */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{m.category}</span>
                    <h3 className="text-sm font-black text-slate-900 leading-snug mt-0.5">{m.title}</h3>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase font-mono ${
                      m.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      m.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {m.status}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-md ${
                      m.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                      m.priority === 'Medium' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {m.priority} PRIORITY
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.description}</p>

                {/* Specific stats */}
                <div className="space-y-1.5 pt-4 border-t border-slate-50 text-[11px] text-slate-400">
                  <p>Location: <strong className="text-slate-700">{roomCode}</strong></p>
                  <p>Repaired Date: <strong className="text-slate-700">
                    {new Date(m.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </strong></p>
                  <p>Operation Cost: <strong className="text-emerald-600 font-mono font-bold">
                    {m.cost > 0 ? `$${m.cost}` : 'Pending Costing'}
                  </strong></p>
                </div>

                {m.remarks && (
                  <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <p className="font-bold text-slate-400 uppercase font-mono text-[9px]">Warden Note</p>
                    <p className="text-slate-500 mt-1 italic">"{m.remarks}"</p>
                  </div>
                )}
              </div>

              {/* Actions row */}
              {isAdminOrWarden && m.status !== 'Completed' && m.status !== 'Cancelled' && (
                <div className="pt-4 border-t border-slate-50 mt-5 flex justify-end">
                  <button
                    onClick={() => openUpdateModal(m)}
                    className="px-3 py-1.5 bg-slate-150 text-slate-900 hover:bg-slate-200 text-[10px] font-black rounded-lg flex items-center gap-1 transition"
                  >
                    <Wrench className="h-3.5 w-3.5" /> Dispatch / Update Cost
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredMaintenances.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-2xl">
            <Wrench className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold">No registered repair logs for your room.</p>
          </div>
        )}
      </div>

      {/* CREATE MAINTENANCE REQUEST MODAL */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="maintenance-register-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Register Repair Work</h3>
              <button onClick={() => setIsRegModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Select Room */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Target Room *</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.building?.buildingCode} • Room {r.roomNumber} ({r.roomType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Repair Issue Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Geyser short circuit, Desk leg loose"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  required
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="AC / HVAC">AC / HVAC</option>
                    <option value="Cleaning">Housekeeping</option>
                    <option value="Masonry">Masonry</option>
                    <option value="Other">Other Repairs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Severity *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                    required
                  >
                    <option value="Low">Low (Non-blocking)</option>
                    <option value="Medium">Medium (Urgent)</option>
                    <option value="High">High (Immediate Action)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Grievance Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Elaborate on the maintenance job required..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-black bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {submitting ? 'Submitting...' : 'Register Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE MAINTENANCE REQUEST MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="maintenance-update-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Update Dispatch & costing</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Set Dispatch Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="Pending">Pending / Unassigned</option>
                  <option value="Assigned">Assigned / Dispatching</option>
                  <option value="Completed">Completed / Repair Finished</option>
                  <option value="Cancelled">Cancelled / Rejected</option>
                </select>
              </div>

              {/* Cost */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Repair / Spare Parts Cost ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Maintenance / Repair Log Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Electrician fixed wiring, replaced 5W tube light"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-black bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving...' : 'Dispatch / Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
