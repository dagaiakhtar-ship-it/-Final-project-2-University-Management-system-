import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardList, Plus, Search, Filter, CheckCircle, 
  XCircle, AlertCircle, Bus, MapPin, Calendar, Clock, UserCheck 
} from 'lucide-react';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../store/auth.store';

interface AttendanceLog {
  id: number;
  passId: number;
  routeId: number;
  stopId: number;
  status: string;
  scannedAt: string;
  notes: string | null;
  pass: {
    passNumber: string;
    userType: string;
    student?: {
      fullName: string;
      registrationNumber: string;
    } | null;
  };
  route: {
    routeName: string;
    routeCode: string;
  };
  stop: {
    stopName: string;
  };
}

interface PassOption {
  id: number;
  passNumber: string;
  studentName: string;
}

interface RouteOption {
  id: number;
  routeName: string;
  routeCode: string;
  stops: Array<{ id: number; stopName: string }>;
}

export const TransportAttendance: React.FC = () => {
  const { user } = useAuthStore();
  const isSecurityOrAdmin = 
    user?.role === 'SUPER_ADMIN' || 
    user?.role === 'ADMIN' || 
    user?.role === 'SECURITY_STAFF';

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [passes, setPasses] = useState<PassOption[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Attendance Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPassId, setSelectedPassId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');
  const [boardingStatus, setBoardingStatus] = useState('Boarded');
  const [notes, setNotes] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [logsRes, passesRes, routesRes] = await Promise.all([
        apiClient.get('/transport/attendance'),
        apiClient.get('/transport/passes'),
        apiClient.get('/routes')
      ]);

      setLogs(logsRes.data.data || []);
      setPasses(
        (passesRes.data.data || [])
          .filter((p: any) => p.status.toUpperCase() === 'ACTIVE')
          .map((p: any) => ({
            id: p.id,
            passNumber: p.passNumber,
            studentName: p.student?.fullName || 'Sarah Connor'
          }))
      );
      setRoutes(routesRes.data.data || []);
    } catch (err: any) {
      console.error('Error fetching transport attendance data:', err);
      setError(err.response?.data?.message || 'Failed to sync transport boarding logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setFeedback(null);
    setSelectedPassId('');
    setSelectedRouteId('');
    setSelectedStopId('');
    setBoardingStatus('Boarded');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      passId: Number(selectedPassId),
      routeId: Number(selectedRouteId),
      stopId: Number(selectedStopId),
      status: boardingStatus,
      notes: notes || undefined
    };

    try {
      await apiClient.post('/transport/attendance', payload);
      setFeedback({ type: 'success', message: 'Boarding check attendance marked successfully.' });
      await fetchData();
      setTimeout(() => setIsModalOpen(false), 1200);
    } catch (err: any) {
      console.error('Error submitting boarding log:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit boarding log. Ensure stop belongs to the route.'
      });
    }
  };

  // Dynamic Stop Options based on route selection
  const activeRouteStops = routes.find(r => r.id === Number(selectedRouteId))?.stops || [];

  // Filter attendance logs
  const filteredLogs = logs.filter(l => {
    const holderName = l.pass.student?.fullName || '';
    const matchesSearch = 
      holderName.toLowerCase().includes(search.toLowerCase()) ||
      l.pass.passNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.route.routeName.toLowerCase().includes(search.toLowerCase()) ||
      l.stop.stopName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || l.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="transport-attendance-section">
      {/* 1. Header and quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <ClipboardList size={20} className="text-indigo-600" />
            Smart Boarding Attendance History ({filteredLogs.length})
          </h3>
          <p className="text-xs text-slate-500">Track student daily check-in logs, boarding stop verification, and safety trip compliance.</p>
        </div>

        {isSecurityOrAdmin && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all animate-pulse"
          >
            <UserCheck size={16} />
            Scan / Mark Boarding
          </button>
        )}
      </div>

      {/* 2. Searching filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search boarding log history by student name, pass ID, stop location..."
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
            <option value="ALL">All Boarding Statuses</option>
            <option value="BOARDED">Boarded</option>
            <option value="LEFT">Left Bus</option>
            <option value="MISSED">Missed Bus</option>
          </select>
        </div>
      </div>

      {/* 3. Boarding Logs history table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Syncing real-time boarding attendance logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed rounded-xl bg-white text-slate-400 text-xs">
          <ClipboardList size={40} className="mx-auto text-slate-200 mb-2" />
          No bus boarding attendance records found.
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-4">Student Holder</th>
                <th className="p-4">Pass ID</th>
                <th className="p-4">Transit Route</th>
                <th className="p-4">Boarding Stop</th>
                <th className="p-4">Log Status</th>
                <th className="p-4 text-right">Logged Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredLogs.map((l) => {
                const isBoarded = l.status.toUpperCase() === 'BOARDED';
                const isLeft = l.status.toUpperCase() === 'LEFT';
                const isMissed = l.status.toUpperCase() === 'MISSED' || l.status.toUpperCase() === 'ABSENT';

                return (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">
                      {l.pass.student?.fullName || 'Sarah Connor'}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {l.pass.userType} • {l.pass.student?.registrationNumber || 'T-1000'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {l.pass.passNumber}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-700">{l.route.routeName}</span>
                      <span className="block text-[9px] text-slate-400 font-mono">({l.route.routeCode})</span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      {l.stop.stopName}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit ${
                        isBoarded 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : isLeft 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {isBoarded ? <CheckCircle size={10} /> : isLeft ? <Clock size={10} /> : <XCircle size={10} />}
                        {l.status}
                      </span>
                      {l.notes && <span className="block text-[9px] text-slate-400 mt-1 italic">{l.notes}</span>}
                    </td>
                    <td className="p-4 text-right text-slate-400 font-mono font-medium">
                      {new Date(l.scannedAt).toLocaleDateString()} {new Date(l.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Log Boarding attendance modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Smart Bus Attendance Boarding</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {feedback && (
                <div className={`p-3 text-xs rounded-lg font-medium border ${
                  feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Active Pass / Passenger *</label>
                <select
                  required
                  value={selectedPassId}
                  onChange={(e) => setSelectedPassId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="">-- Choose verified active pass --</option>
                  {passes.map(p => (
                    <option key={p.id} value={p.id}>{p.studentName} ({p.passNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Transit Line *</label>
                <select
                  required
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    setSelectedStopId('');
                  }}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="">-- Select route path --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>
                  ))}
                </select>
              </div>

              {selectedRouteId && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Arrival Stop *</label>
                  <select
                    required
                    value={selectedStopId}
                    onChange={(e) => setSelectedStopId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="">-- Select boarding stop sequence --</option>
                    {activeRouteStops.map(s => (
                      <option key={s.id} value={s.id}>{s.stopName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Boarding Status *</label>
                  <select
                    value={boardingStatus}
                    onChange={(e) => setBoardingStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="Boarded">Boarded (Passenger on Bus)</option>
                    <option value="Left">Left Bus (Checked out)</option>
                    <option value="Missed">Missed Bus / Absent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Scan Logs / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Card scanned manually"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 rounded-lg px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold">Verify & Board</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default TransportAttendance;
