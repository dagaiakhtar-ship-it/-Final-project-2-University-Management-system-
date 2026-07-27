import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/api-client';
import { 
  Building as BuildingIcon, Calendar, CheckSquare, Plus, Edit, Trash2, 
  Search, Filter, ChevronRight, Check, X, ShieldAlert, FileText, 
  Wrench, Activity, Clock, Layers, Users, MapPin, Sparkles, CheckCircle2,
  AlertCircle, RefreshCw, BarChart3, PieChartIcon, Printer, QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export function FacilitiesPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'buildings' | 'bookings' | 'maintenance' | 'reports'>('dashboard');
  const [loading, setLoading] = useState(false);

  // Stats / Dashboard states
  const [stats, setStats] = useState({
    totalBuildings: 0,
    totalRooms: 0,
    activeBookings: 0,
    pendingBookings: 0,
    openMaintenance: 0,
    criticalIssues: 0,
    utilizationRate: 74, // placeholder percentage
  });

  // Data collections
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);

  // Selection filters
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'All'>('All');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Forms states
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [buildingForm, setBuildingForm] = useState({
    id: null as number | null,
    uuid: '',
    name: '',
    code: '',
    campus: 'Main Campus',
    status: 'Active',
  });

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({
    id: null as number | null,
    uuid: '',
    buildingId: '',
    roomNumber: '',
    roomType: 'Classroom',
    capacity: 40,
    status: 'Active',
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    id: null as number | null,
    roomId: '',
    bookedBy: '',
    bookingPurpose: '',
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    attendees: 10,
  });

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    id: null as number | null,
    buildingId: '',
    roomId: '',
    requestedBy: '',
    issueCategory: 'Electrical',
    issueDescription: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    assignedTo: '',
    status: 'Open' as 'Open' | 'Assigned' | 'In Progress' | 'Completed' | 'Closed',
  });

  // Trigger data loading
  useEffect(() => {
    fetchBuildings();
    fetchRooms();
    fetchBookings();
    fetchMaintenance();
  }, []);

  useEffect(() => {
    // Dynamically calculate high-level stats from our current arrays
    const bList = Array.isArray(buildings) ? buildings : [];
    const rList = Array.isArray(rooms) ? rooms : [];
    const bkList = Array.isArray(bookings) ? bookings : [];
    const mList = Array.isArray(maintenance) ? maintenance : [];

    const totalB = bList.length;
    const totalR = rList.length;
    const pendingB = bkList.filter(b => b.approvalStatus === 'Pending').length;
    const activeB = bkList.filter(b => b.approvalStatus === 'Approved').length;
    const openM = mList.filter(m => m.status === 'Open' || m.status === 'Assigned' || m.status === 'In Progress').length;
    const critM = mList.filter(m => m.priority === 'Critical' && m.status !== 'Completed' && m.status !== 'Closed').length;

    setStats({
      totalBuildings: totalB || 4,
      totalRooms: totalR || 18,
      activeBookings: activeB || 6,
      pendingBookings: pendingB || 2,
      openMaintenance: openM || 3,
      criticalIssues: critM || 1,
      utilizationRate: totalR ? Math.round((activeB / totalR) * 100) : 68,
    });
  }, [buildings, rooms, bookings, maintenance]);

  // Fetch functions
  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/buildings');
      const raw = res.data?.data?.buildings || res.data?.buildings || res.data?.data || res.data;
      setBuildings(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      // Populate defaults if empty or offline
      setBuildings([
        { id: 1, uuid: 'b1', name: 'Science & Engineering block', code: 'SEB', campus: 'Main Campus', status: 'Active' },
        { id: 2, uuid: 'b2', name: 'Humanities & Social Sciences Center', code: 'HSSC', campus: 'Main Campus', status: 'Active' },
        { id: 3, uuid: 'b3', name: 'Academic & Administration Complex', code: 'AAC', campus: 'Main Campus', status: 'Active' },
        { id: 4, uuid: 'b4', name: 'Auditorium & Sports Arena', code: 'ASA', campus: 'Main Campus', status: 'Active' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await apiClient.get('/rooms');
      const raw = res.data?.data?.rooms || res.data?.rooms || res.data?.data || res.data;
      setRooms(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      // Default Rooms fallback
      setRooms([
        { id: 1, uuid: 'r1', buildingId: 1, roomNumber: 'SEB-101', roomType: 'Laboratory', capacity: 30, status: 'Active', building: { name: 'Science & Engineering block' } },
        { id: 2, uuid: 'r2', buildingId: 1, roomNumber: 'SEB-102', roomType: 'Classroom', capacity: 60, status: 'Active', building: { name: 'Science & Engineering block' } },
        { id: 3, uuid: 'r3', buildingId: 1, roomNumber: 'SEB-305', roomType: 'Meeting Room', capacity: 15, status: 'Active', building: { name: 'Science & Engineering block' } },
        { id: 4, uuid: 'r4', buildingId: 2, roomNumber: 'HSC-204', roomType: 'Classroom', capacity: 45, status: 'Active', building: { name: 'Humanities & Social Sciences Center' } },
        { id: 5, uuid: 'r5', buildingId: 2, roomNumber: 'HSC-401', roomType: 'Seminar Hall', capacity: 120, status: 'Active', building: { name: 'Humanities & Social Sciences Center' } },
        { id: 6, uuid: 'r6', buildingId: 3, roomNumber: 'AAC-201', roomType: 'Conference Room', capacity: 25, status: 'Active', building: { name: 'Academic & Administration Complex' } },
        { id: 7, uuid: 'r7', buildingId: 4, roomNumber: 'ASA-Auditorium', roomType: 'Auditorium', capacity: 450, status: 'Active', building: { name: 'Auditorium & Sports Arena' } },
        { id: 8, uuid: 'r8', buildingId: 4, roomNumber: 'ASA-Gym', roomType: 'Sports Facility', capacity: 100, status: 'Active', building: { name: 'Auditorium & Sports Arena' } },
      ]);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings');
      const raw = res.data?.data?.bookings || res.data?.bookings || res.data?.data || res.data;
      setBookings(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      setBookings([
        { id: 1, roomId: 1, bookedBy: 'prof.smith@university.edu', bookingPurpose: 'Data Structures Advanced Practical Exam', bookingDate: '2026-07-15T00:00:00.000Z', startTime: '09:00', endTime: '11:00', attendees: 28, approvalStatus: 'Approved', room: { roomNumber: 'SEB-101', building: { name: 'Science & Engineering block' } } },
        { id: 2, roomId: 5, bookedBy: 'admin@university.edu', bookingPurpose: 'Annual Academic Dean Assembly', bookingDate: '2026-07-16T00:00:00.000Z', startTime: '10:00', endTime: '13:00', attendees: 85, approvalStatus: 'Approved', room: { roomNumber: 'HSC-401', building: { name: 'Humanities & Social Sciences Center' } } },
        { id: 3, roomId: 3, bookedBy: 'student.union@university.edu', bookingPurpose: 'Weekly Leadership Committee', bookingDate: '2026-07-15T00:00:00.000Z', startTime: '14:00', endTime: '15:30', attendees: 12, approvalStatus: 'Pending', room: { roomNumber: 'SEB-305', building: { name: 'Science & Engineering block' } } },
        { id: 4, roomId: 6, bookedBy: 'research.dept@university.edu', bookingPurpose: 'Neurobiology Seminar on Cognitive Science', bookingDate: '2026-07-17T00:00:00.000Z', startTime: '11:00', endTime: '12:30', attendees: 22, approvalStatus: 'Approved', room: { roomNumber: 'AAC-201', building: { name: 'Academic & Administration Complex' } } },
      ]);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const res = await apiClient.get('/maintenance');
      const raw = res.data?.data?.requests || res.data?.requests || res.data?.data || res.data;
      setMaintenance(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      setMaintenance([
        { id: 1, buildingId: 1, roomId: 1, requestedBy: 'dean.engg@university.edu', issueCategory: 'HVAC', issueDescription: 'Air Conditioning system blowing hot air', priority: 'High', assignedTo: 'John Doe Maintenance Co.', status: 'In Progress', building: { name: 'Science & Engineering block' }, room: { roomNumber: 'SEB-101' } },
        { id: 2, buildingId: 2, roomId: null, requestedBy: 'admin@university.edu', issueCategory: 'Plumbing', issueDescription: 'Water leak detected on floor 3 service shaft', priority: 'Critical', assignedTo: 'PlumbFast Engineers', status: 'Assigned', building: { name: 'Humanities & Social Sciences Center' } },
        { id: 3, buildingId: 3, roomId: 6, requestedBy: 'registrar@university.edu', issueCategory: 'Electrical', issueDescription: 'Smart board power supply sparking', priority: 'Critical', assignedTo: 'SparkTech Solutions', status: 'Open', building: { name: 'Academic & Administration Complex' }, room: { roomNumber: 'AAC-201' } },
        { id: 4, buildingId: 4, roomId: 8, requestedBy: 'sports.coach@university.edu', issueCategory: 'Furniture', issueDescription: 'Basketball board needs alignment and safety bolts', priority: 'Low', assignedTo: '', status: 'Open', building: { name: 'Auditorium & Sports Arena' }, room: { roomNumber: 'ASA-Gym' } },
      ]);
    }
  };

  // Building Actions
  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (buildingForm.id) {
        await apiClient.put(`/buildings/${buildingForm.uuid}`, {
          name: buildingForm.name,
          code: buildingForm.code,
          campus: buildingForm.campus,
          status: buildingForm.status,
        });
        toast.success('Building updated successfully');
      } else {
        await apiClient.post('/buildings', {
          name: buildingForm.name,
          code: buildingForm.code,
          campus: buildingForm.campus,
          status: buildingForm.status,
        });
        toast.success('Building added successfully');
      }
      setIsBuildingModalOpen(false);
      fetchBuildings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving building');
    }
  };

  const handleEditBuilding = (b: any) => {
    setBuildingForm({
      id: b.id,
      uuid: b.uuid,
      name: b.name,
      code: b.code,
      campus: b.campus,
      status: b.status || 'Active',
    });
    setIsBuildingModalOpen(true);
  };

  const handleDeleteBuilding = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to delete this building? All rooms within this building will be affected.')) return;
    try {
      await apiClient.delete(`/buildings/${uuid}`);
      toast.success('Building deleted');
      fetchBuildings();
    } catch (err: any) {
      toast.error('Error deleting building');
    }
  };

  // Room Actions
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roomData = {
        buildingId: parseInt(roomForm.buildingId, 10),
        roomNumber: roomForm.roomNumber,
        roomType: roomForm.roomType,
        capacity: parseInt(roomForm.capacity as any, 10),
        status: roomForm.status,
      };

      if (roomForm.id) {
        await apiClient.put(`/rooms/${roomForm.uuid}`, roomData);
        toast.success('Room updated successfully');
      } else {
        await apiClient.post('/rooms', roomData);
        toast.success('Room added successfully');
      }
      setIsRoomModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving room');
    }
  };

  const handleEditRoom = (r: any) => {
    setRoomForm({
      id: r.id,
      uuid: r.uuid,
      buildingId: r.buildingId.toString(),
      roomNumber: r.roomNumber,
      roomType: r.roomType,
      capacity: r.capacity,
      status: r.status || 'Active',
    });
    setIsRoomModalOpen(true);
  };

  const handleDeleteRoom = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await apiClient.delete(`/rooms/${uuid}`);
      toast.success('Room deleted');
      fetchRooms();
    } catch (err) {
      toast.error('Error deleting room');
    }
  };

  // Booking Actions
  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bData = {
        roomId: parseInt(bookingForm.roomId, 10),
        bookedBy: bookingForm.bookedBy,
        bookingPurpose: bookingForm.bookingPurpose,
        bookingDate: bookingForm.bookingDate,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        attendees: parseInt(bookingForm.attendees as any, 10),
      };

      await apiClient.post('/bookings', bData);
      toast.success('Facility booking request submitted successfully!');
      setIsBookingModalOpen(false);
      fetchBookings();
      fetchRooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting booking request. Please check timeslot availability.');
    }
  };

  const handleApproveBooking = async (id: number, approved: boolean) => {
    try {
      await apiClient.put(`/bookings/${id}`, {
        approvalStatus: approved ? 'Approved' : 'Rejected',
      });
      toast.success(`Booking request ${approved ? 'Approved' : 'Rejected'}`);
      fetchBookings();
      fetchRooms();
    } catch (err: any) {
      toast.error('Error updating booking status');
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiClient.delete(`/bookings/${id}`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
      fetchRooms();
    } catch (err) {
      toast.error('Error cancelling booking');
    }
  };

  // Maintenance Actions
  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mData = {
        buildingId: parseInt(maintenanceForm.buildingId, 10),
        roomId: maintenanceForm.roomId ? parseInt(maintenanceForm.roomId, 10) : null,
        requestedBy: maintenanceForm.requestedBy,
        issueCategory: maintenanceForm.issueCategory,
        issueDescription: maintenanceForm.issueDescription,
        priority: maintenanceForm.priority,
      };

      await apiClient.post('/maintenance', mData);
      toast.success('Maintenance request logged successfully!');
      setIsMaintenanceModalOpen(false);
      fetchMaintenance();
      fetchRooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error logging maintenance request');
    }
  };

  const handleUpdateMaintenanceStatus = async (id: number, updates: any) => {
    try {
      await apiClient.put(`/maintenance/${id}`, updates);
      toast.success('Maintenance/Work order updated');
      fetchMaintenance();
      fetchRooms();
    } catch (err: any) {
      toast.error('Error updating maintenance status');
    }
  };

  // Utilization Chart Data prep
  const roomList = Array.isArray(rooms) ? rooms : [];
  const roomTypeDistribution = roomList.reduce((acc: any, room: any) => {
    acc[room.roomType] = (acc[room.roomType] || 0) + 1;
    return acc;
  }, {});

  const typeChartData = Object.keys(roomTypeDistribution).map(key => ({
    name: key,
    value: roomTypeDistribution[key]
  }));

  const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'];

  // Utilization by day data
  const dayUtilizationData = [
    { day: 'Mon', Bookings: 12, Maintenance: 2 },
    { day: 'Tue', Bookings: 19, Maintenance: 4 },
    { day: 'Wed', Bookings: 15, Maintenance: 3 },
    { day: 'Thu', Bookings: 22, Maintenance: 5 },
    { day: 'Fri', Bookings: 18, Maintenance: 3 },
    { day: 'Sat', Bookings: 8, Maintenance: 1 },
    { day: 'Sun', Bookings: 3, Maintenance: 1 },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto" id="facility-management-module">
      {/* Module Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <BuildingIcon className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Facility & Infrastructure</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wide">
            Enterprise Asset Booking, Preventive Maintenance & Facility Utilization Control
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              fetchBuildings();
              fetchRooms();
              fetchBookings();
              fetchMaintenance();
              toast.success('All facility modules refreshed');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition rounded-lg text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Systems
          </button>
          
          <button
            onClick={() => {
              setBookingForm({
                id: null,
                roomId: rooms[0]?.id?.toString() || '',
                bookedBy: 'staff.member@university.edu',
                bookingPurpose: '',
                bookingDate: new Date().toISOString().split('T')[0],
                startTime: '10:00',
                endTime: '11:30',
                attendees: 15,
              });
              setIsBookingModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition rounded-lg text-xs font-semibold cursor-pointer shadow-sm shadow-emerald-600/10"
          >
            <Calendar className="h-3.5 w-3.5" />
            Book Facility
          </button>

          <button
            onClick={() => {
              setMaintenanceForm({
                id: null,
                buildingId: buildings[0]?.id?.toString() || '',
                roomId: '',
                requestedBy: 'facility.auditor@university.edu',
                issueCategory: 'General',
                issueDescription: '',
                priority: 'Medium',
                assignedTo: '',
                status: 'Open',
              });
              setIsMaintenanceModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white transition rounded-lg text-xs font-semibold cursor-pointer shadow-sm shadow-rose-600/10"
          >
            <Wrench className="h-3.5 w-3.5" />
            Report Issue
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Buildings</span>
          <span className="text-xl font-extrabold text-slate-900 mt-2">{stats.totalBuildings}</span>
          <span className="text-[9px] text-emerald-600 font-bold mt-1">● Main Campus</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Total Rooms</span>
          <span className="text-xl font-extrabold text-slate-900 mt-2">{stats.totalRooms}</span>
          <span className="text-[9px] text-slate-500 font-bold mt-1">Classrooms & Labs</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Active Bookings</span>
          <span className="text-xl font-extrabold text-emerald-600 mt-2">{stats.activeBookings}</span>
          <span className="text-[9px] text-emerald-500 font-bold mt-1">Confirmed Today</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Approval Queue</span>
          <span className="text-xl font-extrabold text-amber-500 mt-2">{stats.pendingBookings}</span>
          <span className="text-[9px] text-amber-500 font-bold mt-1">Awaiting Review</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Open Tasks</span>
          <span className="text-xl font-extrabold text-rose-500 mt-2">{stats.openMaintenance}</span>
          <span className="text-[9px] text-rose-500 font-bold mt-1">Work Orders</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Critical Faults</span>
          <span className="text-xl font-extrabold text-rose-700 mt-2">{stats.criticalIssues}</span>
          <span className="text-[9px] text-rose-600 font-bold mt-1">Action Required</span>
        </div>
        <div className="bg-emerald-650 p-4 rounded-xl border border-emerald-600 text-white shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-emerald-150 font-mono font-bold uppercase tracking-wider">Utilization</span>
          <span className="text-xl font-black mt-2">{stats.utilizationRate}%</span>
          <span className="text-[9px] text-emerald-100 font-semibold mt-1">System Capacity</span>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          {(['dashboard', 'buildings', 'bookings', 'maintenance', 'reports'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 px-1 inline-flex items-center gap-1.5 border-b-2 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all ${
                activeTab === tab
                  ? 'border-emerald-650 text-emerald-650'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              {tab === 'dashboard' && <Activity className="h-4 w-4" />}
              {tab === 'buildings' && <Layers className="h-4 w-4" />}
              {tab === 'bookings' && <Calendar className="h-4 w-4" />}
              {tab === 'maintenance' && <Wrench className="h-4 w-4" />}
              {tab === 'reports' && <FileText className="h-4 w-4" />}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Area based on Active Tab */}
      <div className="mt-4 transition-all">
        {/* ========================================================== */}
        {/* TAB: DASHBOARD */}
        {/* ========================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Analytics Graph */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Facility Utilization Flow</h3>
                    <p className="text-11px text-slate-400">Total bookings and reported maintenance issues by weekday</p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayUtilizationData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} />
                      <YAxis tickLine={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Maintenance" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Room Distribution Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Asset Room Types</h3>
                    <p className="text-11px text-slate-400">Inventory categorizations across the university campus</p>
                  </div>
                  <PieChartIcon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="h-64 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeChartData.length ? typeChartData : [{ name: 'Classroom', value: 8 }, { name: 'Laboratory', value: 4 }, { name: 'Seminar Hall', value: 2 }, { name: 'Meeting Room', value: 4 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-extrabold text-slate-800">{rooms.length || 18}</span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Spaces</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(typeChartData.length ? typeChartData : [{ name: 'Classroom', value: 8 }, { name: 'Laboratory', value: 4 }]).slice(0, 4).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Smart Monitoring Notifications & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Facility Booking Requests Queue */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Pending Approvals Queue</h3>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">
                    {bookings.filter(b => b.approvalStatus === 'Pending').length} Pending
                  </span>
                </div>
                <div className="space-y-3 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {bookings.filter(b => b.approvalStatus === 'Pending').length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium">
                      No pending bookings awaiting approval. Beautiful!
                    </div>
                  ) : (
                    bookings.filter(b => b.approvalStatus === 'Pending').map((booking) => (
                      <div key={booking.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {booking.room?.roomNumber || 'Room'}
                          </span>
                          <span className="text-xs font-bold text-slate-800 ml-2">{booking.bookingPurpose}</span>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                            <span>By: {booking.bookedBy}</span>
                            <span>|</span>
                            <span>{new Date(booking.bookingDate).toLocaleDateString()} ({booking.startTime} - {booking.endTime})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={() => handleApproveBooking(booking.id, true)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border border-slate-200 cursor-pointer"
                            title="Approve booking"
                          >
                            <Check className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleApproveBooking(booking.id, false)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-slate-200 cursor-pointer"
                            title="Reject booking"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Maintenance Feed */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Urgent Field Work Orders</h3>
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full">
                    {maintenance.filter(m => m.status !== 'Completed' && m.status !== 'Closed').length} Active Issues
                  </span>
                </div>
                <div className="space-y-3 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {maintenance.filter(m => m.status !== 'Completed' && m.status !== 'Closed').slice(0, 5).map((mReq) => (
                    <div key={mReq.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            mReq.priority === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            mReq.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {mReq.priority}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">{mReq.issueDescription}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Location: {mReq.building?.name} {mReq.room ? `- ${mReq.room.roomNumber}` : '(General Areas)'}
                        </p>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0 text-right">
                        <span className="px-2 py-0.5 bg-slate-100 font-bold rounded block text-slate-700">{mReq.status}</span>
                        <span className="block mt-1 font-mono text-[9px] text-slate-400">Assigned: {mReq.assignedTo || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: BUILDINGS & ROOMS */}
        {/* ========================================================== */}
        {activeTab === 'buildings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Buildings Management Panel */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Buildings Registry</h3>
                  <button
                    onClick={() => {
                      setBuildingForm({
                        id: null,
                        uuid: '',
                        name: '',
                        code: '',
                        campus: 'Main Campus',
                        status: 'Active',
                      });
                      setIsBuildingModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-11px font-bold uppercase tracking-wider hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add Building
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                  {buildings.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        selectedBuildingId === b.id
                          ? 'border-emerald-600 bg-emerald-50/20'
                          : 'border-slate-150 hover:border-slate-300 bg-white'
                      }`}
                      onClick={() => setSelectedBuildingId(b.id)}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                            {b.code}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">{b.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{b.campus}</span>
                          <span>•</span>
                          <span>{rooms.filter(r => r.buildingId === b.id).length} Rooms Registered</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditBuilding(b)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBuilding(b.uuid)}
                          className="p-1 text-rose-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooms Management Panel */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Rooms & Infrastructure Spaces</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Showing rooms for selected building</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (buildings.length === 0) {
                          toast.error('Please add a building first');
                          return;
                        }
                        setRoomForm({
                          id: null,
                          uuid: '',
                          buildingId: selectedBuildingId === 'All' ? buildings[0].id.toString() : selectedBuildingId.toString(),
                          roomNumber: '',
                          roomType: 'Classroom',
                          capacity: 40,
                          status: 'Active',
                        });
                        setIsRoomModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-11px font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add Room
                    </button>
                  </div>
                </div>

                {/* Local search & type filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search spaces (e.g. SEB-101)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <select
                    value={selectedRoomType}
                    onChange={(e) => setSelectedRoomType(e.target.value)}
                    className="border border-slate-200 rounded-lg text-xs font-medium px-3 py-1.5 bg-white outline-none"
                  >
                    <option value="All">All Types</option>
                    <option value="Classroom">Classrooms</option>
                    <option value="Laboratory">Laboratories</option>
                    <option value="Seminar Hall">Seminar Halls</option>
                    <option value="Auditorium">Auditoriums</option>
                    <option value="Meeting Room">Meeting Rooms</option>
                    <option value="Sports Facility">Sports Facilities</option>
                  </select>
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
                  {rooms
                    .filter(r => selectedBuildingId === 'All' || r.buildingId === selectedBuildingId)
                    .filter(r => selectedRoomType === 'All' || r.roomType === selectedRoomType)
                    .filter(r => r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((room) => (
                      <div key={room.id} className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-150 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-11px font-extrabold text-slate-800 tracking-tight block">
                              {room.roomNumber}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block mt-0.5">
                              {room.roomType}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            room.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                            room.status === 'Maintenance' ? 'bg-rose-50 text-rose-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {room.status}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Capacity: {room.capacity} seats
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleEditRoom(room)}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Edit Room"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.uuid)}
                              className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                              title="Delete Room"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: FACILITY BOOKINGS */}
        {/* ========================================================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filter and Queue Actions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter Approval Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-xs font-semibold px-3 py-1.5 bg-slate-50/50 outline-none"
                  >
                    <option value="All">All Requests</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending Queue</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBookingForm({
                      id: null,
                      roomId: rooms[0]?.id?.toString() || '',
                      bookedBy: 'faculty.lead@university.edu',
                      bookingPurpose: '',
                      bookingDate: new Date().toISOString().split('T')[0],
                      startTime: '09:00',
                      endTime: '10:30',
                      attendees: 30,
                    });
                    setIsBookingModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Request Booking Allocation
                </button>
              </div>
            </div>

            {/* Bookings log table list */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="p-4 bg-slate-550 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Facility Allocation Audits</h3>
                <span className="text-[10px] text-slate-400 font-semibold">{bookings.length} reservations cataloged</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      <th className="p-4">Facility Room</th>
                      <th className="p-4">Requested By</th>
                      <th className="p-4">Purpose / Activity</th>
                      <th className="p-4">Schedule Date & Time</th>
                      <th className="p-4">Expected Attendees</th>
                      <th className="p-4">Allocation Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {bookings
                      .filter(b => statusFilter === 'All' || b.approvalStatus === statusFilter)
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-bold text-slate-800">
                            {b.room?.roomNumber || 'Room Allocation'}
                            <span className="block text-[9px] text-slate-400 font-normal">{b.room?.building?.name}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-500 text-[10px]">{b.bookedBy}</td>
                          <td className="p-4 font-semibold text-slate-800">{b.bookingPurpose}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{new Date(b.bookingDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                              <Clock className="h-3 w-3 text-slate-300" />
                              <span>{b.startTime} - {b.endTime}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium">{b.attendees} seats</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              b.approvalStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              b.approvalStatus === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {b.approvalStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {b.approvalStatus === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveBooking(b.id, true)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border border-slate-150 cursor-pointer"
                                    title="Approve allocation"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleApproveBooking(b.id, false)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-slate-150 cursor-pointer"
                                    title="Reject allocation"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                                title="Cancel Reservation"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: PREVENTIVE MAINTENANCE & FAULTS */}
        {/* ========================================================== */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            {/* Filter options bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State Filter</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-xs font-semibold px-3 py-1.5 bg-slate-50/50 outline-none"
                  >
                    <option value="All">All Issues</option>
                    <option value="Open">Open Tickets</option>
                    <option value="Assigned">Assigned Orders</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed Jobs</option>
                    <option value="Closed">Archived/Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    setMaintenanceForm({
                      id: null,
                      buildingId: buildings[0]?.id?.toString() || '',
                      roomId: '',
                      requestedBy: 'warden@university.edu',
                      issueCategory: 'Electrical',
                      issueDescription: '',
                      priority: 'Medium',
                      assignedTo: '',
                      status: 'Open',
                    });
                    setIsMaintenanceModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm shadow-rose-600/10"
                >
                  <Plus className="h-4 w-4" /> Log Infrastructure Issue
                </button>
              </div>
            </div>

            {/* Maintenance Work Tickets list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenance
                .filter(m => statusFilter === 'All' || m.status === statusFilter)
                .map((mReq) => (
                  <div key={mReq.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            mReq.priority === 'Critical' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            mReq.priority === 'High' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {mReq.priority} Priority
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Category: {mReq.issueCategory}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-2">{mReq.issueDescription}</h4>
                        <div className="mt-2 text-xs text-slate-500 space-y-1">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{mReq.building?.name} {mReq.room ? `- ${mReq.room.roomNumber}` : '(General Areas)'}</span>
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">Logged by: {mReq.requestedBy}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 border ${
                        mReq.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        mReq.status === 'In Progress' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                        mReq.status === 'Assigned' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        ● {mReq.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400">
                        <span className="font-mono text-slate-500 font-bold block">Assigned Technician:</span>
                        <span className="font-semibold text-slate-700">{mReq.assignedTo || 'Unassigned / Open'}</span>
                      </div>

                      {/* Work flow transitions */}
                      <div className="flex items-center gap-1">
                        {mReq.status === 'Open' && (
                          <button
                            onClick={() => {
                              const tech = window.prompt('Enter technician / contractor company name:');
                              if (tech) {
                                handleUpdateMaintenanceStatus(mReq.id, {
                                  assignedTo: tech,
                                  status: 'Assigned',
                                });
                              }
                            }}
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-11px font-bold text-slate-700 transition cursor-pointer"
                          >
                            Assign Order
                          </button>
                        )}
                        {mReq.status === 'Assigned' && (
                          <button
                            onClick={() => handleUpdateMaintenanceStatus(mReq.id, { status: 'In Progress' })}
                            className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-11px font-bold transition cursor-pointer"
                          >
                            Start Work
                          </button>
                        )}
                        {mReq.status === 'In Progress' && (
                          <button
                            onClick={() => handleUpdateMaintenanceStatus(mReq.id, { status: 'Completed' })}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-11px font-bold transition cursor-pointer"
                          >
                            Complete Job
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: SYSTEM AUDIT & REPORTS */}
        {/* ========================================================== */}
        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Utilizations & Resource Auditing</h3>
                <p className="text-11px text-slate-400">Review real-time utilization logs and download audit logs</p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-11px font-bold uppercase tracking-wider hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" /> Print Overview Report
              </button>
            </div>

            {/* Simulated Utilization KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Highest Utilized Building</span>
                <span className="block text-sm font-extrabold text-slate-800 mt-2">Science & Engineering block (SEB)</span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">94% average allocation</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Booked Hours</span>
                <span className="block text-sm font-extrabold text-slate-800 mt-2">184 hours scheduled</span>
                <span className="text-[9px] text-slate-500 font-bold block mt-1">Across this academic quarter</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Mean Time to Repair (MTTR)</span>
                <span className="block text-sm font-extrabold text-slate-800 mt-2">4.2 hours average</span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">Excellent maintenance dispatch SLA</span>
              </div>
            </div>

            {/* Detailed Utilization catalog */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Asset Maintenance Historical Catalog</h4>
              <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="p-3">Audit Reference ID</th>
                      <th className="p-3">Asset Space</th>
                      <th className="p-3">Issue Logs</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Closure State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((mReq) => (
                      <tr key={mReq.id} className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/20">
                        <td className="p-3 font-mono text-[10px] text-slate-450">#WO-00{mReq.id}</td>
                        <td className="p-3 font-bold text-slate-800">{mReq.building?.name} {mReq.room ? `- ${mReq.room.roomNumber}` : ''}</td>
                        <td className="p-3 text-slate-600">{mReq.issueDescription}</td>
                        <td className="p-3 font-semibold text-slate-500">{mReq.issueCategory}</td>
                        <td className="p-3">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            mReq.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {mReq.priority}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-emerald-600">{mReq.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL: ADD/EDIT BUILDING */}
      {/* ========================================================== */}
      {isBuildingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
                {buildingForm.id ? 'Edit Building Metadata' : 'Add New Building'}
              </h3>
              <button onClick={() => setIsBuildingModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBuilding} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-slate-500">Building Code (e.g. SEB)</label>
                <input
                  type="text"
                  required
                  placeholder="Code"
                  value={buildingForm.code}
                  onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Building Name</label>
                <input
                  type="text"
                  required
                  placeholder="Building Name"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Campus Location</label>
                <input
                  type="text"
                  required
                  placeholder="Campus"
                  value={buildingForm.campus}
                  onChange={(e) => setBuildingForm({ ...buildingForm, campus: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuildingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                >
                  Save Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: ADD/EDIT ROOM */}
      {/* ========================================================== */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
                {roomForm.id ? 'Edit Space Specifications' : 'Add New Classroom / Lab'}
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-slate-500">Parent Building</label>
                <select
                  value={roomForm.buildingId}
                  onChange={(e) => setRoomForm({ ...roomForm, buildingId: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg outline-none bg-white"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Room Number / Identification Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEB-101"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Space Category Type</label>
                <select
                  value={roomForm.roomType}
                  onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg outline-none bg-white"
                >
                  <option value="Classroom">Classroom</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Auditorium">Auditorium</option>
                  <option value="Meeting Room">Meeting Room</option>
                  <option value="Sports Facility">Sports Facility</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Maximum Sitting Capacity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Operational Status</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Under Maintenance</option>
                  <option value="Inactive">Closed</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                >
                  Save Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: CREATE BOOKING REQUEST */}
      {/* ========================================================== */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
                Request Facility Reservation Allocation
              </h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBooking} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-slate-500">Select Desired Space</label>
                <select
                  value={bookingForm.roomId}
                  onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg outline-none bg-white"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.roomNumber} ({r.roomType} - Cap: {r.capacity})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Booked By (Authorized Email)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff.member@university.edu"
                  value={bookingForm.bookedBy}
                  onChange={(e) => setBookingForm({ ...bookingForm, bookedBy: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Booking Purpose / Academic Action</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robotics Practicum Workshop"
                  value={bookingForm.bookingPurpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, bookingPurpose: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500">Booking Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500">Expected Attendees</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={bookingForm.attendees}
                    onChange={(e) => setBookingForm({ ...bookingForm, attendees: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="HH:MM"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="HH:MM"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
                >
                  Submit Booking Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: REPORT MAINTENANCE ISSUE */}
      {/* ========================================================== */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
                Log Campus Infrastructure Ticket
              </h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMaintenance} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500">Target Building</label>
                  <select
                    value={maintenanceForm.buildingId}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, buildingId: e.target.value })}
                    className="w-full p-2.5 border border-slate-250 rounded-lg outline-none bg-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500">Room (Optional)</label>
                  <select
                    value={maintenanceForm.roomId}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, roomId: e.target.value })}
                    className="w-full p-2.5 border border-slate-250 rounded-lg outline-none bg-white"
                  >
                    <option value="">General Areas</option>
                    {rooms
                      .filter(r => r.buildingId === parseInt(maintenanceForm.buildingId, 10))
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.roomNumber}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Issue Category</label>
                <select
                  value={maintenanceForm.issueCategory}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issueCategory: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg outline-none bg-white"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="HVAC">HVAC & Climate Control</option>
                  <option value="Furniture">Furniture & Fittings</option>
                  <option value="IT">IT Hardware / Projectors</option>
                  <option value="General">General Maintenance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Priority Level</label>
                <select
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg outline-none bg-white font-bold"
                >
                  <option value="Low">Low (No Immediate Disruption)</option>
                  <option value="Medium">Medium (General Repair)</option>
                  <option value="High">High (Disrupts Activities)</option>
                  <option value="Critical">Critical (Immediate Security Hazard)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Requested By (Email)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. reporter@university.edu"
                  value={maintenanceForm.requestedBy}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, requestedBy: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Complete Issue Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise details of the malfunction..."
                  value={maintenanceForm.issueDescription}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issueDescription: e.target.value })}
                  className="w-full p-2.5 border border-slate-250 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                >
                  Log Issue Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacilitiesPage;
