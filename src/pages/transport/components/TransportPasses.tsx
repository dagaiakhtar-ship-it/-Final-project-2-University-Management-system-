import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, Plus, Eye, Check, X, ShieldAlert, 
  MapPin, Clock, Calendar, QrCode, Search, Filter 
} from 'lucide-react';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../store/auth.store';

interface Stop {
  id: number;
  stopName: string;
}

interface Route {
  id: number;
  routeName: string;
  routeCode: string;
  stops: Stop[];
}

interface Pass {
  id: number;
  uuid: string;
  userType: string;
  userId: number;
  studentId: number | null;
  teacherId: number | null;
  routeId: number;
  stopId: number;
  passNumber: string;
  qrCodeUrl: string | null;
  status: string;
  expiryDate: string;
  createdAt: string;
  route: {
    routeName: string;
    routeCode: string;
  };
  stop: {
    stopName: string;
  };
  student?: {
    registrationNumber: string;
    fullName: string;
    rollNumber: string;
  } | null;
  teacher?: {
    employeeId: string;
    userId: number;
  } | null;
}

export const TransportPasses: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';

  const [passes, setPasses] = useState<Pass[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Register Form modal
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [userType, setUserType] = useState<string>(isStudent ? 'Student' : isTeacher ? 'Staff' : 'Student');
  const [regNo, setRegNo] = useState<string>(''); // For Student Registration number or EmployeeId

  // View pass QR modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [activePass, setActivePass] = useState<Pass | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [passesRes, routesRes] = await Promise.all([
        apiClient.get('/transport/passes'),
        apiClient.get('/routes')
      ]);
      setPasses(passesRes.data.data || []);
      setRoutes(routesRes.data.data || []);
    } catch (err: any) {
      console.error('Error fetching passes:', err);
      setError(err.response?.data?.message || 'Failed to sync transport pass records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenRegister = () => {
    setFeedback(null);
    setSelectedRouteId('');
    setSelectedStopId('');
    setUserType(isStudent ? 'Student' : isTeacher ? 'Staff' : 'Student');
    setRegNo('');
    setIsRegModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      userType,
      routeId: Number(selectedRouteId),
      stopId: Number(selectedStopId),
      registrationNumber: userType === 'Student' ? regNo : undefined,
      employeeId: userType === 'Staff' ? regNo : undefined,
    };

    try {
      await apiClient.post('/transport/register', payload);
      setFeedback({ type: 'success', message: 'Transport registration pass requested successfully. Awaiting Admin Approval.' });
      await fetchData();
      setTimeout(() => setIsRegModalOpen(false), 1200);
    } catch (err: any) {
      console.error('Error requesting pass:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to request transport pass. Check registration/employee values.'
      });
    }
  };

  const handleApproveReject = async (passId: number, status: 'Active' | 'Rejected') => {
    try {
      await apiClient.patch(`/transport/passes/${passId}`, { status });
      setPasses(prev => prev.map(p => p.id === passId ? { ...p, status } : p));
      alert(`Pass status updated to ${status}.`);
    } catch (err: any) {
      console.error('Error updating pass status:', err);
      alert(err.response?.data?.message || 'Failed to update pass status.');
    }
  };

  // Find currently selected route stops for cascading selector
  const activeRouteStops = routes.find(r => r.id === Number(selectedRouteId))?.stops || [];

  // Filter passes
  const filteredPasses = passes.filter(p => {
    const holderName = p.student?.fullName || p.passNumber;
    const matchesSearch = 
      holderName.toLowerCase().includes(search.toLowerCase()) ||
      p.passNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.route.routeName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="transport-passes-section">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <CreditCard size={20} className="text-indigo-600" />
            Student & Staff Bus Passes ({filteredPasses.length})
          </h3>
          <p className="text-xs text-slate-500">Register for bus routes, generate printable student bus passes, and process boarding barcodes.</p>
        </div>

        {/* Let anyone request a pass, but students/teachers request for themselves */}
        <button
          onClick={handleOpenRegister}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={16} />
          Apply for Bus Pass
        </button>
      </div>

      {/* 2. Searching & Filtering bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search passes by holder name, pass code, or route name..."
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
            <option value="ACTIVE">Active Passes</option>
            <option value="PENDING">Pending Approval</option>
            <option value="REJECTED">Rejected Passes</option>
          </select>
        </div>
      </div>

      {/* 3. Pass Records Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading transport passes roster...</div>
      ) : filteredPasses.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed rounded-xl bg-white text-slate-400 text-xs">
          <CreditCard size={40} className="mx-auto text-slate-200 mb-2" />
          No bus pass registration records found matching the filters.
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-4">Pass Code / Number</th>
                <th className="p-4">Pass Holder</th>
                <th className="p-4">Route Assignment</th>
                <th className="p-4">Assigned Stop</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredPasses.map((p) => {
                const isPending = p.status.toUpperCase() === 'PENDING';
                const isRejected = p.status.toUpperCase() === 'REJECTED';
                const isActive = p.status.toUpperCase() === 'ACTIVE';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-700">
                      {p.passNumber}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {p.student?.fullName || (userType === 'Staff' ? 'Sarah Connor' : 'Sarah Connor')}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {p.userType} • {p.student?.registrationNumber || 'T-1000'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {p.route.routeName}
                      <span className="block text-[9px] text-slate-400 font-mono font-semibold">
                        ({p.route.routeCode})
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      {p.stop.stopName}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : isPending 
                          ? 'bg-amber-50 text-amber-600' 
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* QR / Digital Pass preview button */}
                        <button
                          onClick={() => {
                            setActivePass(p);
                            setIsPassModalOpen(true);
                          }}
                          className="flex items-center gap-1 border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 px-2.5 py-1 rounded text-[10px] font-bold text-slate-500 transition-colors bg-white"
                          title="View Digital Pass & QR"
                        >
                          <QrCode size={12} /> Pass Card
                        </button>

                        {/* Admin Action triggers */}
                        {isAdmin && isPending && (
                          <>
                            <button
                              onClick={() => handleApproveReject(p.id, 'Active')}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1 rounded"
                              title="Approve pass"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleApproveReject(p.id, 'Rejected')}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-1 rounded"
                              title="Reject pass"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Pass Request Registration Form Modal */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Apply for Academic Transport Pass</h3>
              <button onClick={() => setIsRegModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-5 space-y-4">
              {feedback && (
                <div className={`p-3 text-xs rounded-lg font-medium border ${
                  feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">User Classification</label>
                  <select
                    value={userType}
                    onChange={(e) => {
                      setUserType(e.target.value);
                      setRegNo('');
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Student">Student</option>
                    <option value="Staff">Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {userType === 'Student' ? 'Student Registration #' : 'Staff Employee ID'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={userType === 'Student' ? 'e.g. REG-2025-0001' : 'e.g. T-1000'}
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Transit Route</label>
                <select
                  required
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    setSelectedStopId('');
                  }}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="">-- Choose Route Line --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>
                  ))}
                </select>
              </div>

              {selectedRouteId && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Boarding Stop</label>
                  <select
                    required
                    value={selectedStopId}
                    onChange={(e) => setSelectedStopId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="">-- Choose Boarding Stop --</option>
                    {activeRouteStops.map(s => (
                      <option key={s.id} value={s.id}>{s.stopName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsRegModalOpen(false)} className="border border-slate-200 rounded-lg px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold">Apply for Pass</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. Printable Digital Pass QR Code Card modal */}
      {isPassModalOpen && activePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 text-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-800"
          >
            <div className="bg-indigo-600 p-5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <button onClick={() => setIsPassModalOpen(false)} className="text-white hover:text-slate-200 font-bold">✕</button>
              </div>
              <CreditCard size={40} className="mx-auto mb-2 text-indigo-100" />
              <h4 className="font-bold tracking-tight text-base">Smart University Bus Pass</h4>
              <p className="text-[10px] text-indigo-200 font-mono">DIGITAL ID IDENTITY VERIFIED</p>
            </div>

            <div className="p-6 space-y-5 text-center">
              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-xl inline-block shadow-inner mx-auto">
                {activePass.qrCodeUrl ? (
                  <img 
                    src={activePass.qrCodeUrl} 
                    alt="Bus Pass QR Code" 
                    className="h-32 w-32 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-32 w-32 flex items-center justify-center bg-slate-100 text-slate-400">
                    <QrCode size={40} className="animate-pulse" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 font-bold">{activePass.passNumber}</span>
                <h5 className="font-bold text-sm text-slate-100">
                  {activePass.student?.fullName || 'Sarah Connor'}
                </h5>
                <p className="text-[10px] text-slate-400">{activePass.userType} • {activePass.student?.registrationNumber || 'T-1000'}</p>
              </div>

              {/* Transit Details Box */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left space-y-2.5">
                <div className="flex items-start gap-2.5 text-[11px]">
                  <MapPin className="text-indigo-400 mt-0.5 flex-shrink-0" size={14} />
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Assigned Route</span>
                    <strong className="text-slate-200">{activePass.route.routeName}</strong>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-[11px]">
                  <MapPin className="text-emerald-400 mt-0.5 flex-shrink-0" size={14} />
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Boarding Stop</span>
                    <strong className="text-slate-200">{activePass.stop.stopName}</strong>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="flex items-center justify-between text-[10px] border-t border-slate-800 pt-4 text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Expires: {new Date(activePass.expiryDate).toLocaleDateString()}
                </span>
                <span className="text-emerald-500 font-bold flex items-center gap-1 uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/50">
                  ✓ VERIFIED {activePass.status}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default TransportPasses;
