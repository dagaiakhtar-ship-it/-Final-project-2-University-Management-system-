import React, { useState } from 'react';
import { 
  Users, Plus, RefreshCw, LogOut, X, CheckCircle, 
  Calendar, ShieldAlert, Home, User, DollarSign, Search 
} from 'lucide-react';

interface HostelAllocationsProps {
  allocations: any[];
  students: any[];
  buildings: any[];
  rooms: any[];
  onAdd: (data: any) => Promise<void>;
  onTransfer: (id: number, data: any) => Promise<void>;
  onCheckout: (id: number) => Promise<void>;
  isAdminOrWarden: boolean;
  userStudentId: number | undefined;
}

export const HostelAllocations: React.FC<HostelAllocationsProps> = ({
  allocations,
  students,
  buildings,
  rooms,
  onAdd,
  onTransfer,
  onCheckout,
  isAdminOrWarden,
  userStudentId,
}) => {
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState<any>(null);

  // Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Allocation Form State
  const [studentId, setStudentId] = useState<number | ''>('');
  const [buildingId, setBuildingId] = useState<number | ''>('');
  const [roomId, setRoomId] = useState<number | ''>('');
  const [bedNumber, setBedNumber] = useState('');
  const [allocationDate, setAllocationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedCheckout, setExpectedCheckout] = useState('');
  const [remarks, setRemarks] = useState('');

  // Transfer Form State
  const [targetRoomId, setTargetRoomId] = useState<number | ''>('');
  const [transferBedNumber, setTransferBedNumber] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter rooms based on selected building
  const availableRoomsForBuilding = rooms.filter(
    (r) => r.buildingId === Number(buildingId) && r.availableBeds > 0 && r.status === 'Available'
  );

  // Filter transfer target rooms
  const transferTargetRooms = selectedAlloc 
    ? rooms.filter(
        (r) => r.id !== selectedAlloc.roomId && r.buildingId === selectedAlloc.buildingId && r.availableBeds > 0 && r.status === 'Available'
      )
    : [];

  const openAllocModal = () => {
    setStudentId('');
    setBuildingId(buildings[0]?.id || '');
    setRoomId('');
    setBedNumber('Bed A');
    setAllocationDate(new Date().toISOString().split('T')[0]);
    setExpectedCheckout('');
    setRemarks('');
    setError(null);
    setIsAllocModalOpen(true);
  };

  const openTransferModal = (alloc: any) => {
    setSelectedAlloc(alloc);
    setTargetRoomId('');
    setTransferBedNumber('Bed A');
    setTransferRemarks('');
    setError(null);
    setIsTransferModalOpen(true);
  };

  const handleCreateAlloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !buildingId || !roomId || !bedNumber) {
      setError('Please select Student, Building, Room, and Bed.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onAdd({
        studentId: Number(studentId),
        buildingId: Number(buildingId),
        roomId: Number(roomId),
        bedNumber,
        allocationDate: new Date(allocationDate),
        expectedCheckout: expectedCheckout ? new Date(expectedCheckout) : undefined,
        remarks,
      });
      setIsAllocModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to allocate bed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoomId || !transferBedNumber) {
      setError('Please select target Room and Bed.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onTransfer(selectedAlloc.id, {
        targetRoomId: Number(targetRoomId),
        bedNumber: transferBedNumber,
        remarks: transferRemarks,
      });
      setIsTransferModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to complete room transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (id: number) => {
    if (window.confirm('Are you sure you want to checkout this student? This will free up the bed.')) {
      try {
        await onCheckout(id);
      } catch (err: any) {
        alert(err.message || 'Checkout failed.');
      }
    }
  };

  // Find active student allocation if they are logged in
  const myActiveAllocation = userStudentId 
    ? allocations.find((a) => a.studentId === userStudentId && a.status === 'Active')
    : null;

  // Filter listings
  const filteredAllocations = allocations.filter((a) => {
    const studentName = `${a.student?.user?.firstName || ''} ${a.student?.user?.lastName || ''}`.toLowerCase();
    const studentCode = (a.student?.rollNumber || '').toLowerCase();
    const buildingCode = (a.building?.buildingCode || '').toLowerCase();
    const roomNumber = (a.room?.roomNumber || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    return studentName.includes(q) || studentCode.includes(q) || buildingCode.includes(q) || roomNumber.includes(q);
  });

  return (
    <div className="space-y-6" id="hostel-allocations-tab">
      
      {/* 1. STUDENT ALREADY HAS ROOM HERO CARD */}
      {!isAdminOrWarden && myActiveAllocation && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-850 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase font-mono tracking-widest rounded-full">
              Your Allocation Active
            </span>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{myActiveAllocation.building?.buildingName}</h2>
              <p className="text-slate-400 text-xs font-mono font-bold uppercase tracking-wider mt-1">
                Room {myActiveAllocation.room?.roomNumber} • {myActiveAllocation.bedNumber}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 pt-4 text-xs">
              <div>
                <p className="text-slate-500 uppercase font-mono font-bold text-[9px]">Admission Date</p>
                <p className="font-extrabold text-slate-200 mt-1">
                  {new Date(myActiveAllocation.allocationDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              </div>
              {myActiveAllocation.expectedCheckout && (
                <div>
                  <p className="text-slate-500 uppercase font-mono font-bold text-[9px]">Check-out Deadline</p>
                  <p className="font-extrabold text-slate-200 mt-1">
                    {new Date(myActiveAllocation.expectedCheckout).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-slate-500 uppercase font-mono font-bold text-[9px]">Monthly Fee</p>
                <p className="font-extrabold text-emerald-400 mt-1">${myActiveAllocation.room?.monthlyFee || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-850/60 p-5 rounded-2xl border border-slate-800 shrink-0 w-full md:w-auto text-center md:text-left">
            <h4 className="text-xs font-black text-slate-300 font-mono uppercase tracking-wider mb-2">Need a Room Transfer?</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
              To request a change of room or checkout early, please reach out directly to your Hostel Warden or Submit a Complaint in the Support Tab.
            </p>
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              <div className="h-8 w-8 bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                W
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-200">
                  {myActiveAllocation.building?.warden 
                    ? `${myActiveAllocation.building.warden.firstName} ${myActiveAllocation.building.warden.lastName}`
                    : 'System Warden'}
                </p>
                <p className="text-[10px] text-slate-500">{myActiveAllocation.building?.warden?.email || 'warden@smartuniv.edu'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN / WARDEN FORM & SEARCH ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Bed Allocations & Admitting Students</h2>
          <p className="text-xs text-slate-500">Search current students, handle transfers, checkouts, and admissions log.</p>
        </div>
        {isAdminOrWarden && (
          <button
            onClick={openAllocModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition cursor-pointer"
            id="btn-add-allocation"
          >
            <Plus className="h-4 w-4" /> Admit Student
          </button>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-100 flex items-center">
        <Search className="h-4 w-4 text-slate-400 absolute left-6 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name, roll number, hostel building or room number..."
          className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-950 focus:border-slate-950 rounded-xl"
        />
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase font-mono border-b border-slate-150">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Department & Roll No</th>
                <th className="px-6 py-4">Hostel / Room</th>
                <th className="px-6 py-4">Allocation Date</th>
                <th className="px-6 py-4">Checkout Deadline</th>
                <th className="px-6 py-4 text-center">Status</th>
                {isAdminOrWarden && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAllocations.map((a) => {
                const isStudentActive = a.status === 'Active';
                const sName = `${a.student?.user?.firstName || ''} ${a.student?.user?.lastName || ''}`;

                return (
                  <tr key={a.id} className="hover:bg-slate-50/40">
                    {/* Student Identity */}
                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-[10px] text-slate-700 uppercase">
                          {a.student?.user?.firstName?.charAt(0)}{a.student?.user?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <span>{sName}</span>
                          <p className="text-[10px] text-slate-400 font-semibold">{a.student?.user?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Academic info */}
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <div>
                        <span>{a.student?.department?.code || 'Department'}</span>
                        <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{a.student?.rollNumber}</p>
                      </div>
                    </td>

                    {/* Hostel Location */}
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div>
                        <span>{a.building?.buildingCode} - {a.building?.buildingName}</span>
                        <p className="text-[10px] text-blue-600 font-mono font-semibold mt-0.5">
                          Room {a.room?.roomNumber} ({a.bedNumber})
                        </p>
                      </div>
                    </td>

                    {/* Allocation Date */}
                    <td className="px-6 py-4 font-mono">
                      {new Date(a.allocationDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>

                    {/* Expected checkout */}
                    <td className="px-6 py-4 font-mono">
                      {a.expectedCheckout 
                        ? new Date(a.expectedCheckout).toLocaleDateString(undefined, { dateStyle: 'medium' })
                        : '--'}
                    </td>

                    {/* Status badges */}
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase font-mono ${
                        a.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {a.status}
                      </span>
                    </td>

                    {/* Actions column */}
                    {isAdminOrWarden && (
                      <td className="px-6 py-4 text-right">
                        {isStudentActive ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openTransferModal(a)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1 transition"
                              title="Transfer Bed/Room"
                            >
                              <RefreshCw className="h-3.5 w-3.5" /> Transfer
                            </button>
                            <button
                              onClick={() => handleCheckoutSubmit(a.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold flex items-center gap-1 transition"
                              title="Checkout Student"
                            >
                              <LogOut className="h-3.5 w-3.5" /> Checkout
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">COMPLETED</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredAllocations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                    No hostel allocations matched your filters or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BED ALLOCATION MODAL */}
      {isAllocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="allocation-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">New Bed Admission / Allocation</h3>
              <button onClick={() => setIsAllocModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlloc} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Student Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Select Student *</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- Choose student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.firstName} {s.user?.lastName} - Roll: {s.rollNumber} ({s.gender})
                    </option>
                  ))}
                </select>
              </div>

              {/* Building Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Hostel Building *</label>
                <select
                  value={buildingId}
                  onChange={(e) => {
                    setBuildingId(Number(e.target.value));
                    setRoomId('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- Choose Hostel Building --</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.buildingCode} - {b.buildingName} ({b.gender})
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Select (Filtered by Building) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Room Designation *</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                  disabled={!buildingId}
                >
                  <option value="">-- Choose Room --</option>
                  {availableRoomsForBuilding.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} - {r.roomType} (Beds left: {r.availableBeds})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bed Designation & Allocation Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Bed Number *</label>
                  <select
                    value={bedNumber}
                    onChange={(e) => setBedNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                    required
                  >
                    <option value="Bed A">Bed A</option>
                    <option value="Bed B">Bed B</option>
                    <option value="Bed C">Bed C</option>
                    <option value="Bed D">Bed D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Expected Checkout</label>
                  <input
                    type="date"
                    value={expectedCheckout}
                    onChange={(e) => setExpectedCheckout(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Warden Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Additional check-in terms or details..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-black bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {submitting ? 'Allocating...' : 'Admit & Allocate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="transfer-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Transfer Student Room</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Student indicator */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Transferring Student</p>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {selectedAlloc?.student?.user?.firstName} {selectedAlloc?.student?.user?.lastName}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Current: {selectedAlloc?.building?.buildingCode} • Room {selectedAlloc?.room?.roomNumber} • {selectedAlloc?.bedNumber}
                </p>
              </div>

              {/* Target Room */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Target Room *</label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- Select Target Room --</option>
                  {transferTargetRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} - {r.roomType} (Beds left: {r.availableBeds})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Bed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Target Bed *</label>
                <select
                  value={transferBedNumber}
                  onChange={(e) => setTransferBedNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  <option value="Bed A">Bed A</option>
                  <option value="Bed B">Bed B</option>
                  <option value="Bed C">Bed C</option>
                  <option value="Bed D">Bed D</option>
                </select>
              </div>

              {/* Transfer Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Reason for Transfer</label>
                <textarea
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="e.g. Student request, roommate mismatch..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-black bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Transferring...' : 'Complete Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
