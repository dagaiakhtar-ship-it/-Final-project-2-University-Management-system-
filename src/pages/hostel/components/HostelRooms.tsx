import React, { useState } from 'react';
import { 
  Home, Plus, Edit, Trash2, X, CheckCircle, 
  AlertTriangle, Hammer, ShieldAlert, DollarSign, Layers 
} from 'lucide-react';

interface HostelRoomsProps {
  rooms: any[];
  buildings: any[];
  onAdd: (data: any) => Promise<void>;
  onUpdate: (id: number, data: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isAdminOrWarden: boolean;
}

export const HostelRooms: React.FC<HostelRoomsProps> = ({
  rooms,
  buildings,
  onAdd,
  onUpdate,
  onDelete,
  isAdminOrWarden,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // Filters
  const [filterBuilding, setFilterBuilding] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Form Fields
  const [buildingId, setBuildingId] = useState<number | ''>('');
  const [floorNumber, setFloorNumber] = useState<number>(0);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Double Shared');
  const [capacity, setCapacity] = useState<number>(2);
  const [monthlyFee, setMonthlyFee] = useState<number>(150);
  const [status, setStatus] = useState('Available');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setSelectedRoom(null);
    setBuildingId(buildings[0]?.id || '');
    setFloorNumber(1);
    setRoomNumber('');
    setRoomType('Double Shared');
    setCapacity(2);
    setMonthlyFee(150);
    setStatus('Available');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room: any) => {
    setSelectedRoom(room);
    setBuildingId(room.buildingId);
    setFloorNumber(room.floorNumber);
    setRoomNumber(room.roomNumber);
    setRoomType(room.roomType);
    setCapacity(room.capacity);
    setMonthlyFee(room.monthlyFee);
    setStatus(room.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId || !roomNumber.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        buildingId: Number(buildingId),
        floorNumber: Number(floorNumber),
        roomNumber: roomNumber.trim(),
        roomType,
        capacity: Number(capacity),
        monthlyFee: Number(monthlyFee),
        status,
      };

      if (selectedRoom) {
        await onUpdate(selectedRoom.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the room.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this room? This action will fail if student allocations exist in this room.')) {
      try {
        await onDelete(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete room.');
      }
    }
  };

  // Filter application
  const filteredRooms = rooms.filter((r) => {
    if (filterBuilding && String(r.buildingId) !== filterBuilding) return false;
    if (filterType && r.roomType !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6" id="hostel-rooms-tab">
      
      {/* Filters and Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Filters:</span>
          
          {/* Building Filter */}
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50 text-slate-800"
          >
            <option value="">All Buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.buildingCode} - {b.buildingName}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50 text-slate-800"
          >
            <option value="">All Room Types</option>
            <option value="Single Private">Single Private</option>
            <option value="Double Shared">Double Shared</option>
            <option value="Triple Shared">Triple Shared</option>
            <option value="Four Shared">Four Shared</option>
            <option value="Dormitory">Dormitory</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50 text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Full">Full</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {isAdminOrWarden && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition-all cursor-pointer shrink-0 self-end lg:self-auto"
            id="btn-add-room"
          >
            <Plus className="h-4 w-4" /> Add Room
          </button>
        )}

      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredRooms.map((r) => {
          const filledPercentage = Math.min(100, (r.occupiedBeds / r.capacity) * 100);
          
          return (
            <div 
              key={r.id} 
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition flex flex-col justify-between"
              id={`room-card-${r.id}`}
            >
              <div>
                {/* Header row */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono">{r.building?.buildingCode || 'Hostel'}</span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">Room {r.roomNumber}</h3>
                  </div>
                  
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase font-mono ${
                    r.status === 'Available' ? 'bg-emerald-50 text-emerald-600' :
                    r.status === 'Full' ? 'bg-blue-50 text-blue-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {r.status}
                  </span>
                </div>

                {/* Technical Specs */}
                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <p className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Floor {r.floorNumber}
                  </p>
                  <p className="font-semibold text-slate-700">{r.roomType}</p>
                  <p className="flex items-center text-emerald-600 font-mono font-bold mt-1">
                    <DollarSign className="h-3.5 w-3.5" />{r.monthlyFee}/month
                  </p>
                </div>

                {/* Progress bar representing beds filled */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400">
                    <span>BEDS occupied</span>
                    <span className="text-slate-700">{r.occupiedBeds} / {r.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        filledPercentage === 100 ? 'bg-blue-600' :
                        filledPercentage > 50 ? 'bg-emerald-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${filledPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions row */}
              {isAdminOrWarden && (
                <div className="border-t border-slate-50 pt-3 mt-4 flex justify-end gap-1">
                  <button
                    onClick={() => openEditModal(r)}
                    className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                    title="Edit Room"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Room"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredRooms.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-2xl">
            <Home className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold">No rooms matching selected filters were found.</p>
          </div>
        )}
      </div>

      {/* Room Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="room-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {selectedRoom ? 'Edit Hostel Room' : 'Add Hostel Room'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
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

              {/* Building Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Hostel Building *</label>
                <select
                  value={buildingId}
                  onChange={(e) => setBuildingId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  required
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.buildingCode} - {b.buildingName} ({b.gender})
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Number & Floor Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Room Number *</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 101, 305B"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Floor Number</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Room Type and Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  >
                    <option value="Single Private">Single Private</option>
                    <option value="Double Shared">Double Shared</option>
                    <option value="Triple Shared">Triple Shared</option>
                    <option value="Four Shared">Four Shared</option>
                    <option value="Dormitory">Dormitory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Bed Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Monthly Fee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Monthly Room Fee ($) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Full">Full</option>
                  <option value="Maintenance">Under Maintenance</option>
                </select>
              </div>

              {/* Form Buttons */}
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
                  {submitting ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
