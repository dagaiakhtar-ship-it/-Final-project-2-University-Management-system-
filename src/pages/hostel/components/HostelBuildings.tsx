import React, { useState } from 'react';
import { 
  Building2, Plus, Edit, Trash2, X, Users, MapPin, 
  Layers, Lock, ShieldAlert, CheckCircle, HelpCircle
} from 'lucide-react';

interface HostelBuildingsProps {
  buildings: any[];
  wardens: any[];
  onAdd: (data: any) => Promise<void>;
  onUpdate: (id: number, data: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isAdminOrWarden: boolean;
}

export const HostelBuildings: React.FC<HostelBuildingsProps> = ({
  buildings,
  wardens,
  onAdd,
  onUpdate,
  onDelete,
  isAdminOrWarden,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  
  // Form fields
  const [buildingCode, setBuildingCode] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [totalFloors, setTotalFloors] = useState<number>(3);
  const [wardenId, setWardenId] = useState<number | ''>('');
  const [status, setStatus] = useState('Active');
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setSelectedBuilding(null);
    setBuildingCode('');
    setBuildingName('');
    setGender('Male');
    setAddress('');
    setTotalFloors(3);
    setWardenId('');
    setStatus('Active');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (building: any) => {
    setSelectedBuilding(building);
    setBuildingCode(building.buildingCode);
    setBuildingName(building.buildingName);
    setGender(building.gender);
    setAddress(building.address || '');
    setTotalFloors(building.totalFloors);
    setWardenId(building.wardenId || '');
    setStatus(building.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingCode.trim() || !buildingName.trim()) {
      setError('Code and Name are required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        buildingCode,
        buildingName,
        gender,
        address,
        totalFloors: Number(totalFloors),
        wardenId: wardenId ? Number(wardenId) : undefined,
        status,
      };

      if (selectedBuilding) {
        await onUpdate(selectedBuilding.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving building.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you absolutely sure you want to delete this hostel? This action will fail if the building has registered rooms.')) {
      try {
        await onDelete(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete building.');
      }
    }
  };

  return (
    <div className="space-y-6" id="hostel-buildings-tab">
      
      {/* Tab Header Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Hostel Properties</h2>
          <p className="text-xs text-slate-500">View and manage physical hostel layouts and assign designated wardens.</p>
        </div>
        {isAdminOrWarden && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            id="btn-add-building"
          >
            <Plus className="h-4 w-4" /> Add Building
          </button>
        )}
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map((b) => {
          const wardenName = b.warden 
            ? `${b.warden.firstName} ${b.warden.lastName}` 
            : 'Not Assigned';

          return (
            <div 
              key={b.id} 
              className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all relative"
              id={`building-card-${b.id}`}
            >
              <div>
                {/* Upper row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-slate-50 text-slate-800 rounded-xl flex items-center justify-center border border-slate-100">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono ${
                      b.gender === 'Male' ? 'bg-blue-50 text-blue-600' :
                      b.gender === 'Female' ? 'bg-rose-50 text-rose-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {b.gender} Only
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono ${
                      b.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Building details */}
                <h3 className="text-base font-black text-slate-900">{b.buildingName}</h3>
                <p className="text-xs text-slate-400 font-mono font-semibold mt-0.5">Code: {b.buildingCode}</p>

                {/* Info Lines */}
                <div className="space-y-2 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Warden: <strong className="text-slate-800">{wardenName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Floors: <strong className="text-slate-800">{b.totalFloors} Stories</strong></span>
                  </div>
                  {b.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate" title={b.address}>{b.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Counts & Actions */}
              <div className="border-t border-slate-50 pt-4 mt-5 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Rooms</p>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">{b.totalRooms || 0}</p>
                  </div>
                  <div className="text-center border-l border-slate-100 pl-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Beds</p>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">{b.totalBeds || 0}</p>
                  </div>
                </div>

                {isAdminOrWarden && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                      title="Edit Building"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Building"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {buildings.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-2xl">
            <Building2 className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold">No physical hostel buildings registered yet.</p>
          </div>
        )}
      </div>

      {/* Building Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="building-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {selectedBuilding ? 'Edit Hostel Building' : 'Add Hostel Building'}
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

              {/* Building Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Building Code *</label>
                <input
                  type="text"
                  value={buildingCode}
                  onChange={(e) => setBuildingCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BH-A, GH-3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  required
                />
              </div>

              {/* Building Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Building Name *</label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="e.g. boys hostel a, tagore residence"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  required
                />
              </div>

              {/* Gender and Floors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Mixed">Mixed / Co-ed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Total Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Warden Assignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Assigned Warden</label>
                <select
                  value={wardenId}
                  onChange={(e) => setWardenId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                >
                  <option value="">-- No Assigned Warden --</option>
                  {wardens.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName} ({w.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Address / Landmark</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. North Campus, next to Central Library"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-slate-950 focus:outline-none bg-white"
                >
                  <option value="Active">Active / Operational</option>
                  <option value="Maintenance">Under Maintenance</option>
                  <option value="Inactive">Inactive / Suspended</option>
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
                  {submitting ? 'Saving...' : 'Save Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
