import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';

// Icons
import { 
  Building, Home, Users, BarChart2, ShieldAlert, 
  Clock, AlertTriangle, Wrench, UserCheck, HelpCircle 
} from 'lucide-react';

// Subcomponents
import { HostelOverview } from './components/HostelOverview';
import { HostelBuildings } from './components/HostelBuildings';
import { HostelRooms } from './components/HostelRooms';
import { HostelAllocations } from './components/HostelAllocations';
import { HostelVisitors } from './components/HostelVisitors';
import { HostelComplaints } from './components/HostelComplaints';
import { HostelMaintenance } from './components/HostelMaintenance';

export const HostelPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  // State Management
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Data Lists
  const [analytics, setAnalytics] = useState<any>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);

  // Auxiliary Entity Lists
  const [students, setStudents] = useState<any[]>([]);
  const [wardens, setWardens] = useState<any[]>([]);
  const [userStudentId, setUserStudentId] = useState<number | undefined>(undefined);

  // Role Permissions
  const isAdminOrWarden = ['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN'].includes(userRole);
  const isAdminWardenOrSecurity = ['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'SECURITY_STAFF'].includes(userRole);
  const isSecurityOnly = userRole === 'SECURITY_STAFF';

  // Load All Hostel & Accommodation Data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Students & Potential Wardens (Teachers/Admins) for Admin Select boxes
      if (isAdminWardenOrSecurity) {
        const [studRes, userRes] = await Promise.all([
          apiClient.get('/students').catch(() => ({ data: [] })),
          apiClient.get('/users').catch(() => ({ data: [] })),
        ]);
        setStudents(studRes.data || []);
        
        // Filter users who can act as Wardens (warden role, or fallback to teachers/admins if list is empty)
        const possibleWardens = (userRes.data || []).filter(
          (u: any) => u.role?.toUpperCase() === 'HOSTEL_WARDEN' || u.role?.toUpperCase() === 'ADMIN'
        );
        setWardens(possibleWardens.length > 0 ? possibleWardens : userRes.data || []);
      }

      // 2. If student log-in, look up student record to resolve studentId
      if (userRole === 'STUDENT') {
        const studentRes = await apiClient.get('/students').catch(() => ({ data: [] }));
        const matched = studentRes.data?.find((s: any) => s.userId === user?.id);
        if (matched) {
          setUserStudentId(matched.id);
        }
      }

      // 3. Main REST calls
      const [
        analRes, 
        buildRes, 
        roomRes, 
        allocRes, 
        visitRes, 
        complRes, 
        maintRes
      ] = await Promise.all([
        apiClient.get('/hostels/analytics').catch(() => ({ data: null })),
        apiClient.get('/hostels').catch(() => ({ data: [] })),
        apiClient.get('/rooms').catch(() => ({ data: [] })),
        apiClient.get('/hostel-allocations').catch(() => ({ data: [] })),
        apiClient.get('/visitors').catch(() => ({ data: [] })),
        apiClient.get('/complaints').catch(() => ({ data: [] })),
        apiClient.get('/maintenance').catch(() => ({ data: [] })),
      ]);

      setAnalytics(analRes.data);
      setBuildings(buildRes.data || []);
      setRooms(roomRes.data || []);
      setAllocations(allocRes.data || []);
      setVisitorLogs(visitRes.data || []);
      setComplaints(complRes.data || []);
      setMaintenances(maintRes.data || []);

      // Adjust default landing tab based on role
      if (isSecurityOnly) {
        setActiveTab('visitors');
      }

    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load hostel services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // =========================================================================
  // ACTIONS PROXIES
  // =========================================================================

  // Buildings
  const handleAddBuilding = async (data: any) => {
    await apiClient.post('/hostels', data);
    await loadData();
  };

  const handleUpdateBuilding = async (id: number, data: any) => {
    await apiClient.put(`/hostels/${id}`, data);
    await loadData();
  };

  const handleDeleteBuilding = async (id: number) => {
    await apiClient.delete(`/hostels/${id}`);
    await loadData();
  };

  // Rooms
  const handleAddRoom = async (data: any) => {
    await apiClient.post('/rooms', data);
    await loadData();
  };

  const handleUpdateRoom = async (id: number, data: any) => {
    await apiClient.put(`/rooms/${id}`, data);
    await loadData();
  };

  const handleDeleteRoom = async (id: number) => {
    await apiClient.delete(`/rooms/${id}`);
    await loadData();
  };

  // Allocations
  const handleAddAllocation = async (data: any) => {
    await apiClient.post('/hostel-allocations', data);
    await loadData();
  };

  const handleTransferAllocation = async (id: number, data: any) => {
    await apiClient.patch(`/hostel-allocations/${id}/transfer`, data);
    await loadData();
  };

  const handleCheckoutAllocation = async (id: number) => {
    await apiClient.post(`/hostel-allocations/${id}/checkout`);
    await loadData();
  };

  // Visitors
  const handleAddVisitor = async (data: any) => {
    await apiClient.post('/visitors', data);
    await loadData();
  };

  const handleCheckoutVisitor = async (id: number) => {
    await apiClient.post(`/visitors/${id}/checkout`);
    await loadData();
  };

  // Complaints
  const handleAddComplaint = async (data: any) => {
    await apiClient.post('/complaints', data);
    await loadData();
  };

  const handleUpdateComplaint = async (id: number, data: any) => {
    await apiClient.put(`/complaints/${id}`, data);
    await loadData();
  };

  // Maintenance
  const handleAddMaintenance = async (data: any) => {
    await apiClient.post('/maintenance', data);
    await loadData();
  };

  const handleUpdateMaintenance = async (id: number, data: any) => {
    await apiClient.put(`/maintenance/${id}`, data);
    await loadData();
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]" id="hostel-loading-skeleton">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-950 mx-auto"></div>
            <p className="text-sm font-bold text-slate-500 font-mono">Synchronizing accommodation logs...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div id="hostel-accommodation-module-container" className="space-y-8">
        
        {/* Module Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 flex items-center gap-2.5">
              <Building className="h-8 w-8 text-slate-900" />
              Hostel & Accommodation Management
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1 max-w-2xl leading-relaxed">
              Allocate residential beds, manage physical hostels, register guest loggers, log complaints, and deploy repair dispatches.
            </p>
          </div>
        </div>

        {/* Dynamic Tab Bar Navigation */}
        <div className="flex border-b border-slate-100 overflow-x-auto pb-px scrollbar-none gap-8" id="hostel-tabs-nav">
          
          {/* Overview Tab (Wardens, Admins, Students) */}
          {!isSecurityOnly && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 text-xs font-black uppercase font-mono tracking-wider transition whitespace-nowrap flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'overview'
                  ? 'text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              id="tab-btn-overview"
            >
              <BarChart2 className="h-4 w-4" /> Dashboard
            </button>
          )}

          {/* Buildings Tab */}
          <button
            onClick={() => setActiveTab('buildings')}
            className={`pb-4 text-xs font-black uppercase font-mono tracking-wider transition whitespace-nowrap flex items-center gap-2 relative cursor-pointer ${
              activeTab === 'buildings'
                ? 'text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            id="tab-btn-buildings"
          >
            <Building className="h-4 w-4" /> Properties
          </button>

          {/* Rooms Tab */}
          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-4 text-xs font-black uppercase font-mono tracking-wider transition whitespace-nowrap flex items-center gap-2 relative cursor-pointer ${
              activeTab === 'rooms'
                ? 'text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            id="tab-btn-rooms"
          >
            <Home className="h-4 w-4" /> Rooms
          </button>

          {/* Allocations Tab (Wardens, Admins, Students) */}
          {!isSecurityOnly && (
            <button
              onClick={() => setActiveTab('allocations')}
              className={`pb-4 text-xs font-black uppercase font-mono tracking-wider transition whitespace-nowrap flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'allocations'
                  ? 'text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              id="tab-btn-allocations"
            >
              <Users className="h-4 w-4" /> Admissions
            </button>
          )}

          {/* Visitors Tab (All) */}
          <button
            onClick={() => setActiveTab('visitors')}
            className={`pb-4 text-xs font-black uppercase font-mono tracking-wider transition whitespace-nowrap flex items-center gap-2 relative cursor-pointer ${
              activeTab === 'visitors'
                ? 'text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            id="tab-btn-visitors"
          >
            <UserCheck className="h-4 w-4" /> Visitors
          </button>

          {/* Complaints/Helpdesk Tab (Wardens, Admins, Students) */}
          {!isSecurityOnly && (
            <button
              onClick={() => setActiveTab('complaints')}
              className={`pb-4 text-xs font-black uppercase font-mono tracking-wider transition whitespace-nowrap flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'complaints'
                  ? 'text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              id="tab-btn-complaints"
            >
              <AlertTriangle className="h-4 w-4" /> Helpdesk
            </button>
          )}

          {/* Maintenance Tab (Wardens, Admins, Students) */}
          {!isSecurityOnly && (
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`pb-4 text-xs font-black uppercase font-mono tracking-wider transition whitespace-nowrap flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              id="tab-btn-maintenance"
            >
              <Wrench className="h-4 w-4" /> Repairs
            </button>
          )}

        </div>

        {/* Tab Page Delivery Area */}
        <div id="hostel-active-tab-content">
          {activeTab === 'overview' && !isSecurityOnly && (
            <HostelOverview analytics={analytics} />
          )}

          {activeTab === 'buildings' && (
            <HostelBuildings
              buildings={buildings}
              wardens={wardens}
              onAdd={handleAddBuilding}
              onUpdate={handleUpdateBuilding}
              onDelete={handleDeleteBuilding}
              isAdminOrWarden={isAdminOrWarden}
            />
          )}

          {activeTab === 'rooms' && (
            <HostelRooms
              rooms={rooms}
              buildings={buildings}
              onAdd={handleAddRoom}
              onUpdate={handleUpdateRoom}
              onDelete={handleDeleteRoom}
              isAdminOrWarden={isAdminOrWarden}
            />
          )}

          {activeTab === 'allocations' && !isSecurityOnly && (
            <HostelAllocations
              allocations={allocations}
              students={students}
              buildings={buildings}
              rooms={rooms}
              onAdd={handleAddAllocation}
              onTransfer={handleTransferAllocation}
              onCheckout={handleCheckoutAllocation}
              isAdminOrWarden={isAdminOrWarden}
              userStudentId={userStudentId}
            />
          )}

          {activeTab === 'visitors' && (
            <HostelVisitors
              visitorLogs={visitorLogs}
              students={students}
              onAddVisitor={handleAddVisitor}
              onCheckoutVisitor={handleCheckoutVisitor}
              isAdminWardenOrSecurity={isAdminWardenOrSecurity}
              userStudentId={userStudentId}
            />
          )}

          {activeTab === 'complaints' && !isSecurityOnly && (
            <HostelComplaints
              complaints={complaints}
              onAddComplaint={handleAddComplaint}
              onUpdateComplaint={handleUpdateComplaint}
              isAdminOrWarden={isAdminOrWarden}
              userStudentId={userStudentId}
            />
          )}

          {activeTab === 'maintenance' && !isSecurityOnly && (
            <HostelMaintenance
              maintenances={maintenances}
              rooms={rooms}
              onAddMaintenance={handleAddMaintenance}
              onUpdateMaintenance={handleUpdateMaintenance}
              isAdminOrWarden={isAdminOrWarden}
              userStudentId={userStudentId}
              allocations={allocations}
            />
          )}
        </div>

      </div>
    </PageContainer>
  );
};
