import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { io } from 'socket.io-client';
import {
  Plus,
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Grid,
  List,
  Clock,
  BookOpen,
  MapPin,
  User,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  GraduationCap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LookupOptions {
  departments: Array<{ id: number; name: string; code: string }>;
  programs: Array<{ id: number; name: string; code: string; departmentId: number }>;
  semesters: Array<{ id: number; name: string; code: string; programId: number }>;
  sections: Array<{ id: number; name: string; code: string; semesterId: number }>;
  teachers: Array<{ id: number; employeeId: string; user: { firstName: string; lastName: string; id: number } }>;
  rooms: Array<{ id: number; roomNumber: string; roomType: string; capacity: number; building: { id: number; name: string; code: string } }>;
  buildings: Array<{ id: number; name: string; code: string }>;
  subjects: Array<{ id: number; name: string; code: string }>;
  timeslots: Array<{ id: number; dayOfWeek: string; startTime: string; endTime: string; periodNumber: number }>;
}

interface TimetableEntry {
  id: number;
  uuid: string;
  courseOfferingId: number;
  teacherId: number;
  subjectId: number;
  sectionId: number;
  roomId: number;
  timeSlotId: number;
  academicYear: string;
  session: string;
  weeklyRepeat: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'Active' | 'Suspended' | 'Cancelled';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  courseOffering: {
    courseCode: string;
  };
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  subject: {
    name: string;
    code: string;
  };
  section: {
    name: string;
    code: string;
  };
  room: {
    roomNumber: string;
    roomType: string;
    capacity: number;
    building: {
      name: string;
      code: string;
    };
  };
  timeSlot: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    periodNumber: number;
  };
}

export const TimetableDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const userRole = user?.role || 'STUDENT';

  // Master view state: 'list' or 'grid'
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(
    (searchParams.get('view') as 'list' | 'grid') || 'grid'
  );

  // Sub-view category inside Grid mode: 'section' | 'teacher' | 'student' | 'room'
  const [gridCategory, setGridCategory] = useState<'section' | 'teacher' | 'student' | 'room'>(
    (searchParams.get('category') as any) || 
    (userRole === 'TEACHER' ? 'teacher' : userRole === 'STUDENT' ? 'student' : 'section')
  );

  // Core Data Lists
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering Options State
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedProg, setSelectedProg] = useState<string>('');
  const [selectedSem, setSelectedSem] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Lookup data
  const [lookups, setLookups] = useState<LookupOptions>({
    departments: [],
    programs: [],
    semesters: [],
    sections: [],
    teachers: [],
    rooms: [],
    buildings: [],
    subjects: [],
    timeslots: [],
  });

  // Fetch Lookups
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [deptsRes, progsRes, semsRes, secsRes, teachsRes, roomsRes, bldgsRes, subjsRes, timeslotsRes] = await Promise.all([
          apiClient.get('/departments'),
          apiClient.get('/programs'),
          apiClient.get('/semesters'),
          apiClient.get('/sections'),
          apiClient.get('/teachers'),
          apiClient.get('/rooms'),
          apiClient.get('/buildings'),
          apiClient.get('/subjects'),
          apiClient.get('/timeslots'),
        ]);

        const extractList = (res: any, key?: string, altKey?: string) => {
          const payload = res?.data?.data || res?.data;
          if (Array.isArray(payload)) return payload;
          if (key && Array.isArray(payload?.[key])) return payload[key];
          if (altKey && Array.isArray(payload?.[altKey])) return payload[altKey];
          return [];
        };

        setLookups({
          departments: extractList(deptsRes, 'departments'),
          programs: extractList(progsRes, 'programs'),
          semesters: extractList(semsRes, 'semesters'),
          sections: extractList(secsRes, 'sections'),
          teachers: extractList(teachsRes, 'teachers'),
          rooms: extractList(roomsRes, 'rooms'),
          buildings: extractList(bldgsRes, 'buildings'),
          subjects: extractList(subjsRes, 'subjects'),
          timeslots: extractList(timeslotsRes, 'timeSlots', 'timeslots'),
        });
      } catch (err) {
        console.error('Failed loading lookup options', err);
      }
    };
    fetchLookups();
  }, []);

  // Set default filters based on logged in user
  useEffect(() => {
    if (lookups.teachers.length > 0 && userRole === 'TEACHER' && user) {
      const match = lookups.teachers.find(t => t.user.id === user.id || t.user.firstName === user.firstName);
      if (match) {
        setSelectedTeacher(match.id.toString());
      }
    }
  }, [lookups.teachers, userRole, user]);

  // Handle Real-time socket updates
  useEffect(() => {
    const socket = io();
    socket.on('connect', () => {
      console.log('[Realtime] Dashboard connected to notification socket');
    });

    socket.on('timetable:changed', (data: { action: string; payload: any }) => {
      toast(`Timetable entry ${data.action.toLowerCase()}! Refreshing schedule grid...`, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#0f172a',
          color: '#fff',
        },
      });
      fetchTimetables();
    });

    return () => {
      socket.disconnect();
    };
  }, [page, limit, searchQuery, selectedDept, selectedProg, selectedSem, selectedSection, selectedTeacher, selectedRoom, selectedBuilding, selectedSubject, selectedAcademicYear, selectedStatus]);

  // Fetch list of timetables
  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: viewMode === 'grid' ? 150 : limit, // Load all for the grid view
        search: searchQuery || undefined,
        departmentId: selectedDept ? parseInt(selectedDept) : undefined,
        programId: selectedProg ? parseInt(selectedProg) : undefined,
        semesterId: selectedSem ? parseInt(selectedSem) : undefined,
        sectionId: selectedSection ? parseInt(selectedSection) : undefined,
        teacherId: selectedTeacher ? parseInt(selectedTeacher) : undefined,
        roomId: selectedRoom ? parseInt(selectedRoom) : undefined,
        buildingId: selectedBuilding ? parseInt(selectedBuilding) : undefined,
        subjectId: selectedSubject ? parseInt(selectedSubject) : undefined,
        academicYear: selectedAcademicYear || undefined,
        status: selectedStatus || undefined,
      };

      const res = await apiClient.get('/timetable', { params });
      if (res.data && res.data.data) {
        setTimetables(res.data.data.timetables || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching timetable entries', err);
      toast.error('Failed to load timetable entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [
    viewMode,
    page,
    searchQuery,
    selectedDept,
    selectedProg,
    selectedSem,
    selectedSection,
    selectedTeacher,
    selectedRoom,
    selectedBuilding,
    selectedSubject,
    selectedAcademicYear,
    selectedStatus
  ]);

  // Sync SearchParams with UI tabs
  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    setSearchParams({ view: mode, category: gridCategory });
  };

  const handleGridCategoryChange = (cat: 'section' | 'teacher' | 'student' | 'room') => {
    setGridCategory(cat);
    setSearchParams({ view: viewMode, category: cat });
    // Reset specific filters when switching categories to keep UX clean
    if (cat === 'section') {
      setSelectedTeacher('');
      setSelectedRoom('');
    } else if (cat === 'teacher') {
      setSelectedSection('');
      setSelectedRoom('');
    } else if (cat === 'room') {
      setSelectedSection('');
      setSelectedTeacher('');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedDept('');
    setSelectedProg('');
    setSelectedSem('');
    setSelectedSection('');
    setSelectedTeacher('');
    setSelectedRoom('');
    setSelectedBuilding('');
    setSelectedSubject('');
    setSelectedAcademicYear('');
    setSelectedStatus('');
    setSearchQuery('');
    setPage(1);
    toast.success('Filters cleared');
  };

  // Delete handler
  const handleDelete = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to delete this class schedule entry?')) return;
    try {
      await apiClient.delete(`/timetable/${uuid}`);
      toast.success('Timetable entry deleted successfully');
      fetchTimetables();
    } catch (err) {
      toast.error('Failed to delete timetable entry');
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (uuid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await apiClient.patch(`/timetable/${uuid}/status`, { status: nextStatus });
      toast.success(`Schedule status changed to ${nextStatus}`);
      fetchTimetables();
    } catch (err) {
      toast.error('Failed to change schedule status');
    }
  };

  // Generate beautiful consistent background colors for cards based on subject IDs
  const getBadgeColor = (id: number) => {
    const colors = [
      'bg-blue-50 text-blue-800 border-blue-200',
      'bg-emerald-50 text-emerald-800 border-emerald-200',
      'bg-indigo-50 text-indigo-800 border-indigo-200',
      'bg-violet-50 text-violet-800 border-violet-200',
      'bg-amber-50 text-amber-800 border-amber-200',
      'bg-rose-50 text-rose-800 border-rose-200',
      'bg-cyan-50 text-cyan-800 border-cyan-200',
      'bg-sky-50 text-sky-800 border-sky-200',
    ];
    return colors[id % colors.length];
  };

  // Grouping for Weekly Grid view
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Find all unique periods across timeslots and sort them
  const timeslotsArr = Array.isArray(lookups.timeslots) ? lookups.timeslots : [];
  const uniquePeriods = Array.from(new Set(timeslotsArr.map(ts => ts.periodNumber))).sort((a, b) => a - b);

  // Return the timeslot name/hours
  const getPeriodTimeRange = (period: number) => {
    const slot = timeslotsArr.find(ts => ts.periodNumber === period);
    return slot ? `${slot.startTime} - ${slot.endTime}` : '';
  };

  return (
    <PageContainer
      title="Enterprise Timetable Dashboard"
      description="Design, coordinate, and browse weekly lecture and laboratory scheduling while avoiding space and faculty conflicts."
      action={
        <div className="flex items-center gap-3" id="timetable-actions">
          {isWritable && (
            <Link to="/timetable/create">
              <Button leftIcon={Plus} variant="secondary">
                Add Class Session
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6" id="timetable-dashboard-viewport">
        {/* VIEW SEGMENT BAR */}
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-4 h-4" />
              Weekly Grid
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" />
              Master Directory
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 flex items-center gap-1.5 text-xs font-semibold ${
                showFilters ? 'bg-slate-100' : ''
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Advanced Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
              title="Clear all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ADVANCED FILTERS PANEL */}
        {showFilters && (
          <Card className="bg-slate-50/50 border border-slate-200 rounded-xl p-5" title="Filter Scheduling Directory">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Department */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedProg('');
                    setSelectedSem('');
                    setSelectedSection('');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">All Departments</option>
                  {lookups.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
              </div>

              {/* Program */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Academic Program</label>
                <select
                  value={selectedProg}
                  onChange={(e) => {
                    setSelectedProg(e.target.value);
                    setSelectedSem('');
                    setSelectedSection('');
                  }}
                  disabled={!selectedDept}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50"
                >
                  <option value="">All Programs</option>
                  {lookups.programs
                    .filter((p) => !selectedDept || p.departmentId === parseInt(selectedDept))
                    .map((prog) => (
                      <option key={prog.id} value={prog.id}>{prog.name} ({prog.code})</option>
                    ))}
                </select>
              </div>

              {/* Semester */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Semester</label>
                <select
                  value={selectedSem}
                  onChange={(e) => {
                    setSelectedSem(e.target.value);
                    setSelectedSection('');
                  }}
                  disabled={!selectedProg}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50"
                >
                  <option value="">All Semesters</option>
                  {lookups.semesters
                    .filter((s) => !selectedProg || s.programId === parseInt(selectedProg))
                    .map((sem) => (
                      <option key={sem.id} value={sem.id}>{sem.name}</option>
                    ))}
                </select>
              </div>

              {/* Section */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Section / Batch</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedSem}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50"
                >
                  <option value="">All Sections</option>
                  {lookups.sections
                    .filter((sec) => !selectedSem || sec.semesterId === parseInt(selectedSem))
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.name} ({sec.code})</option>
                    ))}
                </select>
              </div>

              {/* Teacher */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Instructor</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">All Instructors</option>
                  {lookups.teachers.map((teach) => (
                    <option key={teach.id} value={teach.id}>
                      {teach.user.firstName} {teach.user.lastName} ({teach.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Room</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">All Rooms</option>
                  {lookups.rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.building.code} - {rm.roomNumber} ({rm.roomType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Building */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Building</label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">All Buildings</option>
                  {lookups.buildings.map((bldg) => (
                    <option key={bldg.id} value={bldg.id}>{bldg.name} ({bldg.code})</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Subject / Course</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">All Subjects</option>
                  {lookups.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Academic Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2025-2026"
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Session Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* GRID VIEW CONTAINER */}
        {viewMode === 'grid' && (
          <div className="flex flex-col gap-6" id="timetable-grid-viewport">
            {/* GRID SUB-CATEGORIES */}
            <div className="flex border-b border-slate-200 pb-px gap-6">
              <button
                onClick={() => handleGridCategoryChange('section')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  gridCategory === 'section'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Users className="w-4 h-4" />
                Section Schedule
              </button>
              <button
                onClick={() => handleGridCategoryChange('teacher')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  gridCategory === 'teacher'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <User className="w-4 h-4" />
                Teacher Schedule
              </button>
              <button
                onClick={() => handleGridCategoryChange('student')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  gridCategory === 'student'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Personal Schedule
              </button>
              <button
                onClick={() => handleGridCategoryChange('room')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  gridCategory === 'room'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Room Utilization
              </button>
            </div>

            {/* SELECTION ASSISTANT PER VIEW CATEGORY */}
            <div className="bg-slate-100/60 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 justify-between">
              {gridCategory === 'section' && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Load Weekly Section:</span>
                  <select
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setSelectedProg('');
                      setSelectedSem('');
                      setSelectedSection('');
                    }}
                    className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">1. Choose Department</option>
                    {lookups.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select
                    value={selectedProg}
                    disabled={!selectedDept}
                    onChange={(e) => {
                      setSelectedProg(e.target.value);
                      setSelectedSem('');
                      setSelectedSection('');
                    }}
                    className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  >
                    <option value="">2. Choose Program</option>
                    {lookups.programs.filter(p => p.departmentId === parseInt(selectedDept)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select
                    value={selectedSem}
                    disabled={!selectedProg}
                    onChange={(e) => {
                      setSelectedSem(e.target.value);
                      setSelectedSection('');
                    }}
                    className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  >
                    <option value="">3. Choose Semester</option>
                    {lookups.semesters.filter(s => s.programId === parseInt(selectedProg)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select
                    value={selectedSection}
                    disabled={!selectedSem}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  >
                    <option value="">4. Choose Section</option>
                    {lookups.sections.filter(sec => sec.semesterId === parseInt(selectedSem)).map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                  </select>
                </div>
              )}

              {gridCategory === 'teacher' && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Load Weekly Instructor:</span>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">Choose Instructor</option>
                    {lookups.teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.user.firstName} {t.user.lastName} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {gridCategory === 'student' && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Student Sync:</span>
                  <span className="bg-slate-200 border border-slate-300 text-[11px] font-semibold text-slate-600 px-3 py-1 rounded-full">
                    {userRole === 'STUDENT' ? `Authenticated Profile: ${user?.firstName} ${user?.lastName} (${userRole})` : 'Filter by selecting Student\'s Department / Section in Advanced Filters'}
                  </span>
                </div>
              )}

              {gridCategory === 'room' && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Load Space Allocation:</span>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      setSelectedRoom('');
                    }}
                    className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">1. Choose Building</option>
                    {lookups.buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <select
                    value={selectedRoom}
                    disabled={!selectedBuilding}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  >
                    <option value="">2. Choose Room</option>
                    {lookups.rooms.filter(r => r.building.id === parseInt(selectedBuilding)).map(r => (
                      <option key={r.id} value={r.id}>{r.roomNumber} ({r.roomType})</option>
                    ))}
                  </select>
                </div>
              )}

              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                {timetables.length} Allocated Slot{timetables.length !== 1 ? 's' : ''} Loaded
              </span>
            </div>

            {/* TIMETABLE WEEKLY GRID CONTAINER */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse table-fixed text-slate-700">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-left">
                    <th className="p-4 text-xs font-mono font-bold uppercase tracking-wider w-40 border-r border-slate-200">
                      Class Period
                    </th>
                    {daysOfWeek.map((day) => (
                      <th key={day} className="p-4 text-xs font-bold uppercase tracking-wider border-r border-slate-200 last:border-r-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {uniquePeriods.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-12 text-slate-400 text-sm font-semibold">
                        No periods registered. Register time slots in the database to display weekly schedules.
                      </td>
                    </tr>
                  ) : (
                    uniquePeriods.map((period) => (
                      <tr key={period} className="hover:bg-slate-50/30 transition-colors">
                        {/* Period Column */}
                        <td className="p-4 align-top border-r border-slate-200 bg-slate-50/50">
                          <div className="flex flex-col gap-1 font-sans">
                            <span className="text-xs font-bold text-slate-900">Period {period}</span>
                            <span className="text-[10px] text-slate-400 font-semibold font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {getPeriodTimeRange(period)}
                            </span>
                          </div>
                        </td>

                        {/* Days of Week columns */}
                        {daysOfWeek.map((day) => {
                          // Find entries in this specific day and period
                          const matchingEntries = timetables.filter(
                            (t) => t.timeSlot?.dayOfWeek === day && t.timeSlot?.periodNumber === period
                          );

                          return (
                            <td key={day} className="p-2 align-top border-r border-slate-200 last:border-r-0 h-36">
                              <div className="flex flex-col gap-2 h-full overflow-y-auto">
                                {matchingEntries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    onClick={() => navigate(`/timetable/${entry.uuid}`)}
                                    className={`p-3 rounded-lg border flex flex-col gap-1.5 transition-all cursor-pointer hover:shadow-md ${getBadgeColor(
                                      entry.subjectId
                                    )} ${entry.status !== 'Active' ? 'opacity-50 line-through' : ''}`}
                                  >
                                    {/* Subject */}
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-extrabold tracking-tight leading-tight">
                                        {entry.subject.name}
                                      </span>
                                      <span className="text-[9px] font-mono font-bold tracking-wider opacity-80 uppercase">
                                        {entry.subject.code} • {entry.courseOffering?.courseCode}
                                      </span>
                                    </div>

                                    {/* Lecturer */}
                                    <span className="text-[10px] font-semibold flex items-center gap-1 opacity-90">
                                      <User className="w-3 h-3 shrink-0" />
                                      Prof. {entry.teacher?.user.firstName} {entry.teacher?.user.lastName}
                                    </span>

                                    {/* Room & Building */}
                                    <span className="text-[10px] font-mono font-semibold flex items-center gap-1 opacity-90">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      {entry.room.building.code} - {entry.room.roomNumber}
                                    </span>

                                    {/* Section Badge */}
                                    <span className="inline-block self-start text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200">
                                      Sec: {entry.section.code}
                                    </span>

                                    {/* Status Indicator */}
                                    {entry.status !== 'Active' && (
                                      <span className="text-[8px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm self-start">
                                        {entry.status}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MASTER DIRECTORY VIEW (LIST) */}
        {viewMode === 'list' && (
          <Card className="shadow-xs overflow-hidden rounded-xl border border-slate-200" title="Class Schedule Registry">
            <div className="flex flex-col gap-4">
              {/* Table search bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by subject name, course code, instructor, or section..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Loader */}
              {loading ? (
                <div className="flex items-center justify-center py-20" id="directory-loader">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                </div>
              ) : timetables.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200" id="directory-empty">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">No Timetable Records Found</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
                    Try clearing filters or adjusting your query parameter to explore scheduled class sessions.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                        <th className="p-4 font-bold">Session Details</th>
                        <th className="p-4 font-bold">Section</th>
                        <th className="p-4 font-bold">Instructor</th>
                        <th className="p-4 font-bold">Weekly Schedule</th>
                        <th className="p-4 font-bold">Room & Space</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {timetables.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/30 transition-all">
                          {/* Subject & Code */}
                          <td className="p-4 align-top">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-900">{entry.subject.name}</span>
                              <span className="text-xs font-mono text-slate-400 font-bold">
                                {entry.subject.code} • {entry.courseOffering?.courseCode}
                              </span>
                            </div>
                          </td>

                          {/* Section */}
                          <td className="p-4 align-top">
                            <span className="inline-block text-xs font-bold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {entry.section.code}
                            </span>
                          </td>

                          {/* Instructor */}
                          <td className="p-4 align-top">
                            <span className="font-semibold text-slate-800">
                              Prof. {entry.teacher?.user.firstName} {entry.teacher?.user.lastName}
                            </span>
                          </td>

                          {/* Day / Period / Time */}
                          <td className="p-4 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full self-start border border-emerald-100">
                                {entry.timeSlot?.dayOfWeek}
                              </span>
                              <span className="text-xs font-mono text-slate-500 font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                Period {entry.timeSlot?.periodNumber} ({entry.timeSlot?.startTime} - {entry.timeSlot?.endTime})
                              </span>
                            </div>
                          </td>

                          {/* Room Location */}
                          <td className="p-4 align-top">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800">
                                {entry.room.building.code} - {entry.room.roomNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-mono font-bold">
                                {entry.room.roomType} (Max {entry.room.capacity})
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-4 align-top">
                            <button
                              disabled={!isWritable}
                              onClick={() => handleToggleStatus(entry.uuid, entry.status)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                                entry.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200 hover:bg-emerald-500/20'
                                  : entry.status === 'Suspended'
                                  ? 'bg-amber-500/10 text-amber-700 border border-amber-200 hover:bg-amber-500/20'
                                  : 'bg-red-500/10 text-red-700 border border-red-200 hover:bg-red-500/20'
                              }`}
                            >
                              {entry.status}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-4 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/timetable/${entry.uuid}`} title="Details">
                                <button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                              {isWritable && (
                                <>
                                  <Link to={`/timetable/${entry.uuid}/edit`} title="Edit">
                                    <button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  </Link>
                                  <button
                                    onClick={() => handleDelete(entry.uuid)}
                                    className="p-1.5 hover:bg-red-50 rounded-md text-red-500 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGINATION PANEL */}
              {!loading && timetables.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400">
                    Showing {timetables.length} of {total} slots
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-bold text-slate-700">Page {page}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * limit >= total}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};
export default TimetableDashboardPage;
