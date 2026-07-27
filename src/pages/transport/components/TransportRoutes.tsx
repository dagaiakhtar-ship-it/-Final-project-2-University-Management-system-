import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, Plus, Edit2, Trash2, Search, ArrowRight, 
  Clock, Map, Play, CheckCircle, Navigation, Info 
} from 'lucide-react';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../store/auth.store';

interface Stop {
  id: number;
  stopName: string;
  latitude: number | null;
  longitude: number | null;
  arrivalTime: string;
  departureTime: string;
  sequence: number;
}

interface Route {
  id: number;
  routeName: string;
  routeCode: string;
  startLocation: string;
  endLocation: string;
  estimatedDistance: number;
  estimatedTime: string;
  fare: number;
  active: boolean;
  stops: Stop[];
}

export const TransportRoutes: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search Filter
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Route Form State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeFormMode, setRouteFormMode] = useState<'create' | 'edit'>('create');
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);

  const [routeName, setRouteName] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState<number>(10);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [fare, setFare] = useState<number>(10);
  const [active, setActive] = useState(true);

  // Stop Form State
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopName, setStopName] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [sequence, setSequence] = useState<number>(1);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/routes');
      const loadedRoutes = res.data.data || [];
      setRoutes(loadedRoutes);
      
      // Auto-select first route if none is selected
      if (loadedRoutes.length > 0 && !selectedRoute) {
        setSelectedRoute(loadedRoutes[0]);
      } else if (selectedRoute) {
        // Keep selected route reference synchronized
        const updated = loadedRoutes.find((r: Route) => r.id === selectedRoute.id);
        if (updated) setSelectedRoute(updated);
      }
    } catch (err: any) {
      console.error('Error fetching routes:', err);
      setError(err.response?.data?.message || 'Failed to fetch academic transit routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleOpenRouteModal = (mode: 'create' | 'edit', r?: Route) => {
    setRouteFormMode(mode);
    setFeedback(null);
    if (mode === 'create') {
      setEditingRouteId(null);
      setRouteName('');
      setRouteCode('');
      setStartLocation('');
      setEndLocation('');
      setEstimatedDistance(12.0);
      setEstimatedTime('35 mins');
      setFare(15.0);
      setActive(true);
    } else if (mode === 'edit' && r) {
      setEditingRouteId(r.id);
      setRouteName(r.routeName);
      setRouteCode(r.routeCode);
      setStartLocation(r.startLocation);
      setEndLocation(r.endLocation);
      setEstimatedDistance(r.estimatedDistance);
      setEstimatedTime(r.estimatedTime);
      setFare(r.fare);
      setActive(r.active);
    }
    setIsRouteModalOpen(true);
  };

  const handleRouteFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const data = {
      routeName,
      routeCode,
      startLocation,
      endLocation,
      estimatedDistance: Number(estimatedDistance),
      estimatedTime,
      fare: Number(fare),
      active,
    };

    try {
      if (routeFormMode === 'create') {
        const res = await apiClient.post('/routes', data);
        setFeedback({ type: 'success', message: 'Transit Route registered successfully!' });
        await fetchRoutes();
        setTimeout(() => setIsRouteModalOpen(false), 1000);
      } else if (routeFormMode === 'edit' && editingRouteId) {
        const res = await apiClient.put(`/routes/${editingRouteId}`, data);
        setFeedback({ type: 'success', message: 'Transit Route updated successfully!' });
        await fetchRoutes();
        setTimeout(() => setIsRouteModalOpen(false), 1000);
      }
    } catch (err: any) {
      console.error('Error saving route:', err);
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to register route. Ensure Route Code is unique.' 
      });
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!window.confirm('Delete this transit route? This will wipe out all stop sequences associated with it.')) {
      return;
    }

    try {
      await apiClient.delete(`/routes/${id}`);
      setRoutes(prev => prev.filter(r => r.id !== id));
      if (selectedRoute?.id === id) {
        setSelectedRoute(null);
      }
      alert('Transit Route deleted.');
    } catch (err: any) {
      console.error('Error deleting route:', err);
      alert(err.response?.data?.message || 'Failed to delete route.');
    }
  };

  // Add Stop Submit
  const handleStopFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;
    setFeedback(null);

    const data = {
      stopName,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      arrivalTime,
      departureTime,
      sequence: Number(sequence)
    };

    try {
      // Put updated route with stop sequences
      const updatedStops = [...selectedRoute.stops, data].sort((a, b) => a.sequence - b.sequence);
      
      const payload = {
        routeName: selectedRoute.routeName,
        routeCode: selectedRoute.routeCode,
        startLocation: selectedRoute.startLocation,
        endLocation: selectedRoute.endLocation,
        estimatedDistance: selectedRoute.estimatedDistance,
        estimatedTime: selectedRoute.estimatedTime,
        fare: selectedRoute.fare,
        active: selectedRoute.active,
        stops: updatedStops
      };

      await apiClient.put(`/routes/${selectedRoute.id}`, payload);
      setFeedback({ type: 'success', message: 'Transit sequence stop appended successfully.' });
      await fetchRoutes();
      setTimeout(() => {
        setIsStopModalOpen(false);
        setStopName('');
        setLatitude('');
        setLongitude('');
        setArrivalTime('');
        setDepartureTime('');
      }, 1000);
    } catch (err: any) {
      console.error('Error appending stop:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to append stop sequence.' });
    }
  };

  const handleRemoveStop = async (stopIndex: number) => {
    if (!selectedRoute || !isAdmin) return;
    if (!window.confirm('Remove this stop from the active sequence route?')) return;

    try {
      const remainingStops = selectedRoute.stops.filter((_, idx) => idx !== stopIndex);
      
      const payload = {
        routeName: selectedRoute.routeName,
        routeCode: selectedRoute.routeCode,
        startLocation: selectedRoute.startLocation,
        endLocation: selectedRoute.endLocation,
        estimatedDistance: selectedRoute.estimatedDistance,
        estimatedTime: selectedRoute.estimatedTime,
        fare: selectedRoute.fare,
        active: selectedRoute.active,
        stops: remainingStops.map((s, idx) => ({ ...s, sequence: idx + 1 })) // re-index sequence
      };

      await apiClient.put(`/routes/${selectedRoute.id}`, payload);
      await fetchRoutes();
    } catch (err: any) {
      console.error('Error removing stop:', err);
      alert(err.response?.data?.message || 'Failed to remove sequence stop.');
    }
  };

  // Filter routes
  const filteredRoutes = routes.filter(r => {
    return (
      r.routeName.toLowerCase().includes(search.toLowerCase()) ||
      r.routeCode.toLowerCase().includes(search.toLowerCase()) ||
      r.startLocation.toLowerCase().includes(search.toLowerCase()) ||
      r.endLocation.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="transport-routes-section">
      {/* 1. Left Side: Route Lists */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Transit Lines ({filteredRoutes.length})</h3>
            <p className="text-[11px] text-slate-400">Core campus travel routes</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleOpenRouteModal('create')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg"
              title="Add Route"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search Route Code, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 text-xs">Syncing transit systems...</div>
        ) : filteredRoutes.length === 0 ? (
          <div className="py-10 text-center border border-dashed rounded-xl text-slate-400 text-xs bg-white">
            No transit routes found.
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredRoutes.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedRoute(r)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRoute?.id === r.id 
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {r.routeCode}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {r.estimatedDistance} km • {r.estimatedTime}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs leading-normal">{r.routeName}</h4>
                <div className="flex items-center gap-2 mt-2.5 text-[10px] text-slate-500 font-medium">
                  <span className="truncate max-w-[100px]">{r.startLocation}</span>
                  <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                  <span className="truncate max-w-[100px]">{r.endLocation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Right Side: Interactive Stops Timeline */}
      <div className="lg:col-span-2">
        {selectedRoute ? (
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">TRANSIT DETAILS: {selectedRoute.routeCode}</span>
                <h3 className="font-bold text-slate-800 text-base">{selectedRoute.routeName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Distance: {selectedRoute.estimatedDistance} km • Time: {selectedRoute.estimatedTime} • Fare: ${selectedRoute.fare.toFixed(2)}</p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRouteModal('edit', selectedRoute)}
                    className="flex items-center gap-1.5 border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit2 size={12} /> Edit Route
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(selectedRoute.id)}
                    className="flex items-center gap-1.5 border border-slate-200 hover:border-rose-600 hover:text-rose-600 text-slate-400 p-2 rounded-lg transition-colors"
                    title="Delete Route"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Stop Sequence Timeline */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <Navigation size={14} className="text-indigo-600" />
                  Stops Sequences ({selectedRoute.stops?.length || 0})
                </h4>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setFeedback(null);
                      setStopName('');
                      setSequence((selectedRoute.stops?.length || 0) + 1);
                      setIsStopModalOpen(true);
                    }}
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold px-2.5 py-1.5 rounded"
                  >
                    <Plus size={12} /> Add Stop Stop
                  </button>
                )}
              </div>

              {(!selectedRoute.stops || selectedRoute.stops.length === 0) ? (
                <div className="text-center py-10 border border-dashed rounded-xl bg-slate-50/50">
                  <Map size={30} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">No stops defined for this route. Add sequenced boarding stops for students.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-indigo-100 pl-6 ml-3 space-y-6 py-2">
                  {selectedRoute.stops.map((stop, idx) => (
                    <div key={stop.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-0.5 bg-indigo-600 text-white rounded-full h-4 w-4 flex items-center justify-center font-mono text-[9px] font-bold shadow-sm">
                        {stop.sequence}
                      </span>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start justify-between">
                        <div>
                          <h5 className="font-bold text-xs text-slate-800">{stop.stopName}</h5>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              Arrival: {stop.arrivalTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              Departure: {stop.departureTime}
                            </span>
                          </div>
                          {(stop.latitude && stop.longitude) && (
                            <span className="text-[9px] font-mono text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded mt-2 inline-block">
                              GPS Lat: {stop.latitude}, Lon: {stop.longitude}
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleRemoveStop(idx)}
                            className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5"
                            title="Remove Stop"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center text-slate-400 text-xs">
            Select a route transit line to display stopping sequence timeline and route metrics.
          </div>
        )}
      </div>

      {/* 3. Create/Edit Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {routeFormMode === 'create' ? 'Create Core Transit Route' : `Edit Route: ${routeCode}`}
              </h3>
              <button onClick={() => setIsRouteModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>

            <form onSubmit={handleRouteFormSubmit} className="p-5 space-y-4">
              {feedback && (
                <div className={`p-3 text-xs rounded-lg font-medium border ${
                  feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Route Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metro-University Express"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Route Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. R-METRO"
                    value={routeCode}
                    onChange={(e) => setRouteCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Location *</label>
                  <input
                    type="text"
                    required
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Location *</label>
                  <input
                    type="text"
                    required
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={estimatedDistance}
                    onChange={(e) => setEstimatedDistance(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Est. Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 mins"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fare Cost ($) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={fare}
                    onChange={(e) => setFare(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Transit Active Status</label>
                <select
                  value={String(active)}
                  onChange={(e) => setActive(e.target.value === 'true')}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="true">Active Transit Line</option>
                  <option value="false">Suspended / Out of Service</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsRouteModalOpen(false)} className="border border-slate-200 rounded-lg px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold">Save Transit Line</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 4. Add Stop Modal */}
      {isStopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Sequenced Boarding Stop</h3>
              <button onClick={() => setIsStopModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>

            <form onSubmit={handleStopFormSubmit} className="p-5 space-y-4">
              {feedback && (
                <div className={`p-3 text-xs rounded-lg font-medium border ${
                  feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broadway Avenue Junction"
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Planned Arrival Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 07:45 AM"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Planned Departure Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 07:47 AM"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sequence # *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={sequence}
                    onChange={(e) => setSequence(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GPS Lat</label>
                  <input
                    type="text"
                    placeholder="e.g. 40.71"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GPS Lon</label>
                  <input
                    type="text"
                    placeholder="e.g. -74.00"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsStopModalOpen(false)} className="border border-slate-200 rounded-lg px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold">Append Stop</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default TransportRoutes;
