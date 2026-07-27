import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bus, Plus, Edit2, Trash2, Search, Filter, 
  Settings, CheckCircle, AlertTriangle, Calendar, Users, Eye 
} from 'lucide-react';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../store/auth.store';

interface Vehicle {
  id: number;
  vehicleNumber: string;
  registrationNumber: string;
  vehicleType: string;
  manufacturer: string;
  model: string;
  year: number;
  seatingCapacity: number;
  fuelType: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  status: string;
  createdAt: string;
}

export const TransportVehicles: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Bus');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [seatingCapacity, setSeatingCapacity] = useState<number>(40);
  const [fuelType, setFuelType] = useState('Diesel');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [status, setStatus] = useState('Active');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/vehicles');
      setVehicles(res.data.data || []);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.response?.data?.message || 'Failed to fetch vehicles list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenCreateModal = () => {
    setFormMode('create');
    setEditingId(null);
    setVehicleNumber('');
    setRegistrationNumber('');
    setVehicleType('Bus');
    setManufacturer('');
    setModel('');
    setYear(new Date().getFullYear());
    setSeatingCapacity(40);
    setFuelType('Diesel');
    setInsuranceExpiry('');
    setFitnessExpiry('');
    setStatus('Active');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: Vehicle) => {
    setFormMode('edit');
    setEditingId(v.id);
    setVehicleNumber(v.vehicleNumber);
    setRegistrationNumber(v.registrationNumber);
    setVehicleType(v.vehicleType);
    setManufacturer(v.manufacturer);
    setModel(v.model);
    setYear(v.year);
    setSeatingCapacity(v.seatingCapacity);
    setFuelType(v.fuelType);
    setInsuranceExpiry(v.insuranceExpiry ? v.insuranceExpiry.split('T')[0] : '');
    setFitnessExpiry(v.fitnessExpiry ? v.fitnessExpiry.split('T')[0] : '');
    setStatus(v.status);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const data = {
      vehicleNumber,
      registrationNumber,
      vehicleType,
      manufacturer,
      model,
      year: Number(year),
      seatingCapacity: Number(seatingCapacity),
      fuelType,
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry).toISOString() : undefined,
      fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry).toISOString() : undefined,
      status,
    };

    try {
      if (formMode === 'create') {
        const res = await apiClient.post('/vehicles', data);
        setFeedback({ type: 'success', message: 'Vehicle registered successfully.' });
        setVehicles(prev => [res.data.data, ...prev]);
        setTimeout(() => setIsModalOpen(false), 1000);
      } else if (formMode === 'edit' && editingId) {
        const res = await apiClient.put(`/vehicles/${editingId}`, data);
        setFeedback({ type: 'success', message: 'Vehicle details updated successfully.' });
        setVehicles(prev => prev.map(item => item.id === editingId ? res.data.data : item));
        setTimeout(() => setIsModalOpen(false), 1000);
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to save vehicle details. Validate your inputs.' 
      });
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm('Are you absolutely sure you want to remove this vehicle from the database? This cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
      alert('Vehicle successfully deleted.');
    } catch (err: any) {
      console.error('Error deleting vehicle:', err);
      alert(err.response?.data?.message || 'Failed to delete vehicle.');
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || v.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="transport-vehicles-section">
      {/* 1. Sub-Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Bus size={20} className="text-indigo-600" />
            University Vehicle Fleet ({filteredVehicles.length})
          </h3>
          <p className="text-xs text-slate-500">Add, track, and monitor capacity and safety inspections of standard transport buses & shuttles.</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Plus size={16} />
            Register Vehicle
          </button>
        )}
      </div>

      {/* 2. Controls & Search Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Bus number, Plate number, model, manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="IN MAINTENANCE">In Maintenance</option>
            <option value="OUT OF SERVICE">Out of Service</option>
          </select>
        </div>
      </div>

      {/* 3. Vehicles Grid/List View */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs font-semibold">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          Syncing vehicle database...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 font-medium">
          {error}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <Bus size={40} className="mx-auto text-slate-300 mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">No vehicles matched your search</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Try adjusting your filters or add a new vehicle registration record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((v) => {
            const isMaint = v.status.toLowerCase() === 'in maintenance';
            const isOut = v.status.toLowerCase() === 'out of service';
            return (
              <motion.div
                key={v.id}
                layout
                className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status & Badge */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {v.vehicleNumber}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                      isMaint 
                        ? 'bg-amber-50 text-amber-600' 
                        : isOut 
                        ? 'bg-rose-50 text-rose-600' 
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {isMaint ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                      {v.status}
                    </span>
                  </div>

                  {/* Title & Details */}
                  <h4 className="font-bold text-slate-800 text-sm">
                    {v.manufacturer} {v.model}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Plate Number: <span className="font-mono font-medium text-slate-600">{v.registrationNumber}</span></p>

                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-50 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Seating Capacity</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Users size={12} className="text-slate-400" />
                        {v.seatingCapacity} Seats
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Engine Fuel</span>
                      <span className="text-xs font-semibold text-slate-700 mt-0.5 block">{v.fuelType}</span>
                    </div>
                  </div>

                  {/* Inspections Status checks */}
                  <div className="space-y-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />
                        Insurance Expiry
                      </span>
                      <span className={`font-semibold ${
                        v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date() ? 'text-rose-600' : 'text-slate-600'
                      }`}>
                        {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />
                        Fitness Expiry
                      </span>
                      <span className={`font-semibold ${
                        v.fitnessExpiry && new Date(v.fitnessExpiry) < new Date() ? 'text-rose-600' : 'text-slate-600'
                      }`}>
                        {v.fitnessExpiry ? new Date(v.fitnessExpiry).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Actions buttons */}
                {isAdmin && (
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-5">
                    <button
                      onClick={() => handleOpenEditModal(v)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded-lg py-2 text-[11px] font-semibold text-slate-500 transition-colors"
                    >
                      <Edit2 size={12} />
                      Edit Details
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="border border-slate-200 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg p-2 text-slate-400 transition-colors"
                      title="Remove Vehicle"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. CRUD Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {formMode === 'create' ? 'Register New University Vehicle' : `Modify Vehicle: ${vehicleNumber}`}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {feedback && (
                <div className={`p-3 text-xs rounded-lg font-medium border ${
                  feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bus/Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BUS-01, SHUTTLE-3"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">License Plate Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TX-9988-ABC"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vehicle Type *</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Bus">Bus (40+ Seats)</option>
                    <option value="Mini Bus">Mini Bus (20-35 Seats)</option>
                    <option value="Van">Van (10-15 Seats)</option>
                    <option value="SUV">SUV (Faculty Transport)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Seating Capacity *</label>
                  <input
                    type="number"
                    required
                    min={2}
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mercedes-Benz, Toyota"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sprinter, Coaster"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Manufacture Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fuel Type *</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="CNG">CNG (Clean Natural Gas)</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fitness Expiry</label>
                  <input
                    type="date"
                    value={fitnessExpiry}
                    onChange={(e) => setFitnessExpiry(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Operating Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="In Maintenance">In Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-slate-200 hover:bg-slate-50 rounded-lg px-4 py-2 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default TransportVehicles;
