import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Plus, Edit2, Trash2, Search, Mail, Phone, 
  ShieldAlert, CheckCircle, Award, Eye, FileText, Truck 
} from 'lucide-react';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../store/auth.store';

interface Driver {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  address: string;
  emergencyContact: string;
  assignedVehicleId: number | null;
  status: string;
  assignedVehicle?: {
    id: number;
    vehicleNumber: string;
    manufacturer: string;
    model: string;
  } | null;
}

interface VehicleOption {
  id: number;
  vehicleNumber: string;
}

export const TransportDrivers: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState<string>('');
  const [status, setStatus] = useState('Active');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [driversRes, vehiclesRes] = await Promise.all([
        apiClient.get('/drivers'),
        apiClient.get('/vehicles')
      ]);

      setDrivers(driversRes.data.data || []);
      setVehicles(
        (vehiclesRes.data.data || []).map((v: any) => ({
          id: v.id,
          vehicleNumber: v.vehicleNumber
        }))
      );
    } catch (err: any) {
      console.error('Error fetching drivers data:', err);
      setError(err.response?.data?.message || 'Failed to fetch transport staff data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setFormMode('create');
    setEditingId(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setLicenseNumber('');
    setLicenseExpiry('');
    setAddress('');
    setEmergencyContact('');
    setAssignedVehicleId('');
    setStatus('Active');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (d: Driver) => {
    setFormMode('edit');
    setEditingId(d.id);
    setFullName(d.fullName);
    setPhone(d.phone);
    setEmail(d.email);
    setLicenseNumber(d.licenseNumber);
    setLicenseExpiry(d.licenseExpiry ? d.licenseExpiry.split('T')[0] : '');
    setAddress(d.address || '');
    setEmergencyContact(d.emergencyContact || '');
    setAssignedVehicleId(d.assignedVehicleId ? String(d.assignedVehicleId) : '');
    setStatus(d.status);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const data = {
      fullName,
      phone,
      email,
      licenseNumber,
      licenseExpiry: licenseExpiry ? new Date(licenseExpiry).toISOString() : undefined,
      address: address || undefined,
      emergencyContact: emergencyContact || undefined,
      assignedVehicleId: assignedVehicleId ? Number(assignedVehicleId) : null,
      status,
    };

    try {
      if (formMode === 'create') {
        const res = await apiClient.post('/drivers', data);
        setFeedback({ type: 'success', message: 'Driver registered successfully.' });
        
        // Refresh full roster to populate nested vehicle object
        await fetchData();
        setTimeout(() => setIsModalOpen(false), 1000);
      } else if (formMode === 'edit' && editingId) {
        const res = await apiClient.put(`/drivers/${editingId}`, data);
        setFeedback({ type: 'success', message: 'Driver roster details updated.' });
        
        await fetchData();
        setTimeout(() => setIsModalOpen(false), 1000);
      }
    } catch (err: any) {
      console.error('Error submitting driver form:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save driver. Check syntax & phone number.'
      });
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this driver profile from active service?')) {
      return;
    }

    try {
      await apiClient.delete(`/drivers/${id}`);
      setDrivers(prev => prev.filter(d => d.id !== id));
      alert('Driver successfully removed.');
    } catch (err: any) {
      console.error('Error deleting driver:', err);
      alert(err.response?.data?.message || 'Failed to remove driver.');
    }
  };

  // Search filter
  const filteredDrivers = drivers.filter(d => {
    return (
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6" id="transport-drivers-section">
      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            Coordinated Driver Roster ({filteredDrivers.length})
          </h3>
          <p className="text-xs text-slate-500">Manage professional driver credentials, emergency contact info, and active vehicle coupling assignments.</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Plus size={16} />
            Register Driver
          </button>
        )}
      </div>

      {/* 2. Search Controls */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search drivers by name, phone number, email or DL license ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* 3. Driver Listing layout */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs font-semibold">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          Syncing crew database...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 font-medium">
          {error}
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <Users size={40} className="mx-auto text-slate-300 mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">No drivers found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Make sure you have added drivers to the roster database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDrivers.map((d) => {
            const isLicenseExpired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
            const isActive = d.status.toLowerCase() === 'active';

            return (
              <div 
                key={d.id} 
                className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{d.fullName}</h4>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full mt-1.5 ${
                        isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <CheckCircle size={10} />
                        {d.status}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-1 text-slate-500">
                      <Truck size={16} />
                      <span className="text-[10px] font-mono font-bold text-slate-700">
                        {d.assignedVehicle?.vehicleNumber || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Grid */}
                  <div className="space-y-2 mt-4 text-[11px] text-slate-600 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span>{d.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400" />
                      <span>{d.email}</span>
                    </div>
                    {d.address && (
                      <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded mt-1">
                        <strong>Address:</strong> {d.address}
                      </div>
                    )}
                  </div>

                  {/* License Info box */}
                  <div className="mt-4 p-3 rounded-lg border border-slate-100 flex items-start gap-2.5 bg-slate-50">
                    <Award size={16} className="text-indigo-600 mt-0.5" />
                    <div className="flex-1 text-[11px]">
                      <div className="flex items-center justify-between font-medium text-slate-700">
                        <span>DL: {d.licenseNumber}</span>
                        {isLicenseExpired ? (
                          <span className="text-rose-600 flex items-center gap-0.5 text-[10px] font-bold">
                            <ShieldAlert size={10} /> Expired
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-[10px]">Valid</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Expires: {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Emergency contact info */}
                  {d.emergencyContact && (
                    <p className="text-[10px] text-rose-700 font-medium mt-3">
                      ⚠️ Emergency Contact: {d.emergencyContact}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-5">
                    <button
                      onClick={() => handleOpenEditModal(d)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded-lg py-2 text-[11px] font-semibold text-slate-500 transition-colors"
                    >
                      <Edit2 size={11} />
                      Edit Crew Profile
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(d.id)}
                      className="border border-slate-200 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg p-2 text-slate-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. CRUD Driver form modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {formMode === 'create' ? 'Register New Transport Crew Member' : `Modify Crew Profile: ${fullName}`}
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

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert De Niro"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +15550701"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. driver@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Driving License Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-99881122"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">License Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Core Vehicle</label>
                  <select
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">No Assigned Vehicle (Float)</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Crew Active Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Active">Active / On Duty</option>
                    <option value="Inactive">On Leave / Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Home Residence Address</label>
                <input
                  type="text"
                  placeholder="e.g. 55 Ocean Ave, Retro City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Emergency Contact Info (Name + Phone)</label>
                <input
                  type="text"
                  placeholder="e.g. Spouse: Mary De Niro (+1-555-0702)"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  Save Crew Profile
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default TransportDrivers;
