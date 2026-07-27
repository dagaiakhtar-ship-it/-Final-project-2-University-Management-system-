import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  PenTool, Plus, Search, DollarSign, Fuel, Wrench, 
  Settings, CheckCircle, AlertTriangle, Calendar, ClipboardCheck 
} from 'lucide-react';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../store/auth.store';

interface MaintenanceLog {
  id: number;
  vehicleId: number;
  maintenanceType: string;
  cost: number;
  serviceDate: string;
  nextDueDate: string | null;
  status: string;
  performedBy: string | null;
  remarks: string | null;
  vehicle: {
    vehicleNumber: string;
  };
}

interface FuelLog {
  id: number;
  vehicleId: number;
  fuelQuantity: number;
  cost: number;
  odometerReading: number | null;
  remarks: string | null;
  createdAt: string;
  vehicle: {
    vehicleNumber: string;
  };
}

interface VehicleOption {
  id: number;
  vehicleNumber: string;
}

export const TransportMaintenance: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [maintenances, setMaintenances] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab inside Maintenance component
  const [activeSubTab, setActiveSubTab] = useState<'MAINTENANCE' | 'FUEL'>('MAINTENANCE');

  // Modals Forms states
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);

  // Form Fields
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [maintType, setMaintType] = useState('Routine Service');
  const [cost, setCost] = useState<number>(0);
  const [serviceDate, setServiceDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [status, setStatus] = useState('Completed');
  const [remarks, setRemarks] = useState('');

  // Fuel Fields
  const [fuelQuantity, setFuelQuantity] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  const [odometer, setOdometer] = useState<number>(0);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [maintRes, fuelRes, vehiclesRes] = await Promise.all([
        apiClient.get('/vehicles/maintenances'),
        apiClient.get('/vehicles/fuel'),
        apiClient.get('/vehicles')
      ]);

      setMaintenances(maintRes.data.data || []);
      setFuelLogs(fuelRes.data.data || []);
      setVehicles(
        (vehiclesRes.data.data || []).map((v: any) => ({
          id: v.id,
          vehicleNumber: v.vehicleNumber
        }))
      );
    } catch (err: any) {
      console.error('Error fetching maintenance data:', err);
      setError(err.response?.data?.message || 'Failed to fetch financial / vehicle maintenance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenMaint = () => {
    setFeedback(null);
    setSelectedVehicleId('');
    setMaintType('Routine Service');
    setCost(150);
    setServiceDate(new Date().toISOString().split('T')[0]);
    setNextDueDate('');
    setPerformedBy('Campus Garage Depot');
    setStatus('Completed');
    setRemarks('');
    setIsMaintModalOpen(true);
  };

  const handleOpenFuel = () => {
    setFeedback(null);
    setSelectedVehicleId('');
    setFuelQuantity(35);
    setFuelCost(55);
    setOdometer(12500);
    setRemarks('Regular top up');
    setIsFuelModalOpen(true);
  };

  const handleMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      vehicleId: Number(selectedVehicleId),
      maintenanceType: maintType,
      cost: Number(cost),
      serviceDate: new Date(serviceDate).toISOString(),
      nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : undefined,
      status,
      performedBy: performedBy || undefined,
      remarks: remarks || undefined
    };

    try {
      await apiClient.post('/vehicles/maintenances', payload);
      setFeedback({ type: 'success', message: 'Maintenance record logged successfully.' });
      await fetchData();
      setTimeout(() => setIsMaintModalOpen(false), 1200);
    } catch (err: any) {
      console.error('Error creating maintenance log:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to log maintenance.' });
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      vehicleId: Number(selectedVehicleId),
      fuelQuantity: Number(fuelQuantity),
      cost: Number(fuelCost),
      odometerReading: Number(odometer),
      remarks: remarks || undefined
    };

    try {
      await apiClient.post('/vehicles/fuel', payload);
      setFeedback({ type: 'success', message: 'Fuel charge ticket logged.' });
      await fetchData();
      setTimeout(() => setIsFuelModalOpen(false), 1200);
    } catch (err: any) {
      console.error('Error logging fuel:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to log fuel.' });
    }
  };

  // Summarize Expenses
  const totalMaintCost = maintenances.reduce((acc, curr) => acc + curr.cost, 0);
  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="space-y-6" id="transport-maintenance-section">
      {/* 1. Statistics Expense Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-xl p-5 shadow-sm">
          <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Total Servicing Costs</span>
          <h4 className="text-2xl font-black mt-2">${totalMaintCost.toLocaleString()} USD</h4>
          <p className="text-[10px] text-indigo-300 mt-2">Aggregated fleet maintenance & repair costs logged.</p>
        </div>

        <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-xl p-5 shadow-sm">
          <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Total Fuel Costs</span>
          <h4 className="text-2xl font-black mt-2">${totalFuelCost.toLocaleString()} USD</h4>
          <p className="text-[10px] text-blue-300 mt-2">Aggregated fleet logistics fuel top-ups logged.</p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Logistical Actions</span>
            <p className="text-xs text-slate-500 mt-1">Register vehicle gas refills, maintenance scheduling, and fleet financial reports.</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleOpenMaint}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-550 border border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-bold py-2 rounded text-xs transition-all"
              >
                <Wrench size={12} /> Log Service
              </button>
              <button
                onClick={handleOpenFuel}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold py-2 rounded text-xs transition-all"
              >
                <Fuel size={12} /> Log Refill
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Sub-Tabs Controls */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('MAINTENANCE')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'MAINTENANCE' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Maintenance Work Orders ({maintenances.length})
          </button>
          <button
            onClick={() => setActiveSubTab('FUEL')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'FUEL' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Fuel Dispatch Logs ({fuelLogs.length})
          </button>
        </nav>
      </div>

      {/* 3. Sub-Tab lists */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Syncing operations logs...</div>
      ) : activeSubTab === 'MAINTENANCE' ? (
        /* Tab: MAINTENANCE */
        maintenances.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400 text-xs">
            No maintenance records logged in the database.
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Service Type</th>
                  <th className="p-4">Cost ($)</th>
                  <th className="p-4">Service Date</th>
                  <th className="p-4">Facility perform</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {maintenances.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{m.vehicle.vehicleNumber}</td>
                    <td className="p-4 font-semibold text-slate-700">{m.maintenanceType}</td>
                    <td className="p-4 font-mono font-bold text-rose-600">${m.cost.toFixed(2)}</td>
                    <td className="p-4 text-slate-400">{new Date(m.serviceDate).toLocaleDateString()}</td>
                    <td className="p-4">{m.performedBy || 'Campus Garage'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        m.status.toUpperCase() === 'COMPLETED' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Tab: FUEL */
        fuelLogs.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400 text-xs">
            No fuel logs registered in the database.
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Quantity (Liters)</th>
                  <th className="p-4">Total Cost ($)</th>
                  <th className="p-4">Odometer Reading</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4 text-right">Fueling Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {fuelLogs.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{f.vehicle.vehicleNumber}</td>
                    <td className="p-4 font-semibold text-slate-700">{f.fuelQuantity} L</td>
                    <td className="p-4 font-mono font-bold text-indigo-600">${f.cost.toFixed(2)}</td>
                    <td className="p-4 font-mono">{f.odometerReading ? `${f.odometerReading.toLocaleString()} km` : 'N/A'}</td>
                    <td className="p-4 text-slate-500 italic">{f.remarks || 'Standard fill'}</td>
                    <td className="p-4 text-right text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* 4. Log Servicing Modal */}
      {isMaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Log Fleet Servicing Record</h3>
              <button onClick={() => setIsMaintModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>

            <form onSubmit={handleMaintSubmit} className="p-5 space-y-4">
              {feedback && (
                <div className={`p-3 text-xs rounded-lg font-medium border ${
                  feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Vehicle *</label>
                  <select
                    required
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="">-- Choose vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Maintenance Type *</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="Routine Service">Routine Service</option>
                    <option value="Brake Repair">Brake Repair</option>
                    <option value="Engine Repair">Engine Repair</option>
                    <option value="Tire Replacement">Tire Replacement</option>
                    <option value="Accident Fix">Accident / Body Repair</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Service Cost ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Service Date *</label>
                  <input
                    type="date"
                    required
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Performed Facility Name</label>
                  <input
                    type="text"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Servicing Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending / In Garage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Additional Remarks</label>
                <textarea
                  placeholder="e.g. Engine oil replaced, filter cleaned"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsMaintModalOpen(false)} className="border border-slate-200 rounded-lg px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold">Save Log</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. Log Fuel Refill Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Log Fuel Top-up Ticket</h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>

            <form onSubmit={handleFuelSubmit} className="p-5 space-y-4">
              {feedback && (
                <div className={`p-3 text-xs rounded-lg font-medium border ${
                  feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Vehicle *</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="">-- Choose vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fuel Quantity (Liters) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={1}
                    value={fuelQuantity}
                    onChange={(e) => setFuelQuantity(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Cost ($) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={1}
                    value={fuelCost}
                    onChange={(e) => setFuelCost(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Odometer Reading (km) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={odometer}
                  onChange={(e) => setOdometer(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gas Station / Vendor / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Shell Station, Full Tank fillup"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsFuelModalOpen(false)} className="border border-slate-200 rounded-lg px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold">Save Refill Ticket</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default TransportMaintenance;
