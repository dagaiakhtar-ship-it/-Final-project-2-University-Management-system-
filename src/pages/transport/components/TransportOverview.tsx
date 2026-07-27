import React, { useEffect, useState } from 'react';
import { 
  Bus, Users, MapPin, CreditCard, ShieldAlert, 
  TrendingUp, Activity, ClipboardList, PenTool 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend 
} from 'recharts';
import { motion } from 'framer-motion';

interface OverviewStats {
  totalVehicles: number;
  totalDrivers: number;
  totalRoutes: number;
  activePasses: number;
  averageOccupancy: number;
  totalMaintenanceCosts: number;
  totalFuelQuantity: number;
}

interface AlertItem {
  id: string;
  type: 'warning' | 'info' | 'danger';
  message: string;
  time: string;
}

export const TransportOverview: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalVehicles: 2,
    totalDrivers: 2,
    totalRoutes: 2,
    activePasses: 1,
    averageOccupancy: 38,
    totalMaintenanceCosts: 1250,
    totalFuelQuantity: 45.5,
  });

  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: '1', type: 'warning', message: 'Vehicle BUS-02 license insurance expires in 12 days.', time: '10 mins ago' },
    { id: '2', type: 'info', message: 'Metro-University Express route sequence updated successfully.', time: '1 hour ago' },
    { id: '3', type: 'danger', message: 'Pending maintenance request for BUS-01: brake pads check overdue.', time: '2 hours ago' },
  ]);

  const [liveStream, setLiveStream] = useState<string[]>([
    'Smart Bus Attendance marked for Student: John Doe (REG-2025-0001) - BOARDED at Central Metro Station',
    'Bus BUS-01 started trip on Metro-University Express route',
    'Fuel log added for BUS-02: 25L at cost $38.50',
  ]);

  // Simulated live telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      const messages = [
        'Bus BUS-01 has arrived at Broadway Avenue Junction stop',
        'Smart Bus Attendance: Staff Sarah Connor checked in at University Main Gate',
        'Bus BUS-02 completed routine cleaning schedule',
        'New Transport registration pass requested by Student John Doe',
        'Bus BUS-01 successfully completed its morning trip route R-METRO'
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setLiveStream(prev => [randomMsg, ...prev.slice(0, 4)]);
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const routeOccupancyData = [
    { name: 'R-METRO', occupancy: 85, capacity: 40, registered: 34 },
    { name: 'R-NORTH', occupancy: 44, capacity: 25, registered: 11 },
    { name: 'R-SOUTH', occupancy: 60, capacity: 30, registered: 18 },
    { name: 'R-EAST', occupancy: 92, capacity: 40, registered: 37 },
  ];

  const financialTrendData = [
    { month: 'Jan', Fuel: 450, Maintenance: 200 },
    { month: 'Feb', Fuel: 520, Maintenance: 350 },
    { month: 'Mar', Fuel: 490, Maintenance: 150 },
    { month: 'Apr', Fuel: 610, Maintenance: 850 },
    { month: 'May', Fuel: 580, Maintenance: 240 },
    { month: 'Jun', Fuel: 640, Maintenance: 400 },
  ];

  return (
    <div className="space-y-6" id="transport-overview-container">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Smart Transport Control Panel</h2>
          <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
            Real-time fleet tracking, student boarding analytics, route schedule coordination, and dynamic maintenance logging.
          </p>
        </div>
        <div className="absolute right-6 bottom-0 opacity-15 transform translate-y-4">
          <Bus size={180} />
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Fleet Size', val: `${stats.totalVehicles} Active Vehicles`, icon: Bus, desc: 'Buses & Shuttles', color: 'text-emerald-600 bg-emerald-50' },
          { title: 'Coordinated Routes', val: `${stats.totalRoutes} Core Lines`, icon: MapPin, desc: 'With GPS Stop Sequences', color: 'text-indigo-600 bg-indigo-50' },
          { title: 'Transport Passes', val: `${stats.activePasses} Verified Users`, icon: CreditCard, desc: 'Smart QR Attendance Enabled', color: 'text-blue-600 bg-blue-50' },
          { title: 'Average Occupancy', val: `${stats.averageOccupancy}% Seating Capacity`, icon: Users, desc: 'Optimized fleet load factor', color: 'text-amber-600 bg-amber-50' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{card.val}</h3>
                <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon size={20} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Alerts & Live Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Banner panel */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="text-rose-500" size={18} />
              Fleet & Safety Alerts
            </h3>
            <span className="text-xs bg-rose-50 text-rose-600 font-medium px-2.5 py-1 rounded-full">
              Action Required
            </span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3.5 rounded-lg border flex items-start gap-3 transition-colors ${
                  alert.type === 'danger' 
                    ? 'bg-rose-50 border-rose-100 text-rose-900' 
                    : alert.type === 'warning'
                    ? 'bg-amber-50 border-amber-100 text-amber-900'
                    : 'bg-blue-50 border-blue-100 text-blue-900'
                }`}
              >
                <div className="mt-0.5">
                  <ShieldAlert size={16} className={alert.type === 'danger' ? 'text-rose-600' : alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium leading-relaxed">{alert.message}</p>
                  <span className="text-[10px] font-semibold opacity-60 mt-1 block">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Boarding Telemetry Stream */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm flex items-center gap-2 tracking-wide uppercase text-slate-300">
              <Activity className="text-emerald-400 animate-pulse" size={16} />
              Smart Telemetry Log
            </h3>
            <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/50">
              LIVE BROADCAST
            </span>
          </div>
          <div className="space-y-3.5 min-h-[190px] max-h-[220px] overflow-y-auto pr-1">
            {liveStream.map((log, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-mono border-l-2 border-emerald-500 pl-3 py-1 bg-slate-950/40 rounded-r p-2"
              >
                <span className="text-slate-500 text-[10px] block mb-0.5">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-slate-300 leading-normal">{log}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Analytics Visualization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Seat Occupancy per Route */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Route Capacity & Active Registration</h3>
            <p className="text-xs text-slate-400">Total seating vs. registered passengers currently utilizing routes</p>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeOccupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="capacity" name="Bus Capacity" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="registered" name="Registered Passengers" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fleet Operating Finances */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Fleet Operating Finances</h3>
            <p className="text-xs text-slate-400">Monthly breakdown of fuel logistics vs maintenance expenses ($)</p>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Fuel" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorFuel)" name="Fuel Log Costs" />
                <Area type="monotone" dataKey="Maintenance" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorMaint)" name="Maintenance Costs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TransportOverview;
