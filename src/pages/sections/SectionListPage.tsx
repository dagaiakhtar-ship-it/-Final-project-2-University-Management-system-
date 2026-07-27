import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  Plus,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Users,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Building,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
  code: string;
}

interface Section {
  id: number;
  uuid: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  capacity: number;
  currentStrength: number;
  shift: 'MORNING' | 'EVENING';
  description: string | null;
  createdAt: string;
  semester: {
    id: number;
    name: string;
    code: string;
  };
  program?: {
    id: number;
    name: string;
    code: string;
  } | null;
  department?: {
    id: number;
    name: string;
    code: string;
  } | null;
  classAdvisor?: {
    id: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
}

export const SectionListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Sections State
  const [sections, setSections] = useState<Section[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [shift, setShift] = useState<string>('');
  const [semesterId, setSemesterId] = useState<string>('');
  const [programId, setProgramId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');

  // Dropdown options
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Sorting/Pagination State
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // UI Control State
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Fetch sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/sections', {
        params: {
          search: search || undefined,
          status: status || undefined,
          shift: shift || undefined,
          semesterId: semesterId || undefined,
          programId: programId || undefined,
          departmentId: departmentId || undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        },
      });

      if (response.data?.status === 'success') {
        setSections(response.data.data.sections);
        setTotal(response.data.data.total);
      }
    } catch (err: any) {
      console.error('Fetch sections failed:', err);
      toast.error(err.response?.data?.message || 'Could not fetch section records.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter metadata
  const fetchFilterMetadata = async () => {
    try {
      const [deptRes, progRes, semRes] = await Promise.all([
        apiClient.get('/departments'),
        apiClient.get('/programs'),
        apiClient.get('/semesters'),
      ]);

      if (deptRes.data?.status === 'success') {
        setDepartments(deptRes.data.data);
      }
      if (progRes.data?.status === 'success') {
        setPrograms(progRes.data.data);
      }
      if (semRes.data?.status === 'success') {
        // semesters is paginated
        setSemesters(semRes.data.data.semesters || []);
      }
    } catch (err) {
      console.error('Error fetching filter dropdown options:', err);
    }
  };

  useEffect(() => {
    fetchFilterMetadata();
  }, []);

  useEffect(() => {
    fetchSections();
  }, [search, status, shift, semesterId, programId, departmentId, sortBy, sortOrder, page]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setShift('');
    setSemesterId('');
    setProgramId('');
    setDepartmentId('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
    toast.success('Filters reset to default');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleDeleteSection = async (uuid: string) => {
    if (!window.confirm('Are you absolutely sure you want to soft-delete this section? This action is reversible but will remove the section from active lists.')) {
      return;
    }

    try {
      const res = await apiClient.delete(`/sections/${uuid}`);
      if (res.data?.status === 'success') {
        toast.success('Section soft-deleted successfully');
        fetchSections();
      }
    } catch (err: any) {
      console.error('Failed to delete section:', err);
      toast.error(err.response?.data?.message || 'Error occurred while deleting section.');
    }
  };

  const handleStatusToggle = async (uuid: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await apiClient.patch(`/sections/${uuid}/status`, { status: nextStatus });
      if (res.data?.status === 'success') {
        toast.success(`Section status changed to ${nextStatus}`);
        fetchSections();
      }
    } catch (err: any) {
      console.error('Failed to change status:', err);
      toast.error(err.response?.data?.message || 'Failed to update section status.');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <PageContainer>
      {/* Top Banner section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="section-list-header">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" />
            Section Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure student class groups, shift scheduling, adviser mapping, and physical class boundaries.
          </p>
        </div>

        {isWritable && (
          <Link to={`${ROUTES.SECTIONS}/create`}>
            <Button variant="primary" size="sm" className="font-mono text-xs uppercase tracking-wider py-2.5 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Class Section
            </Button>
          </Link>
        )}
      </div>

      {/* Main Search & Quick filter layout */}
      <Card className="p-4 border border-slate-200/80 bg-white shadow-xs rounded-2xl mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sections by code, name, advisor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`font-mono text-xs uppercase tracking-wider py-2 px-3 flex items-center gap-1.5 ${
                showFilters ? 'bg-slate-100 border-indigo-200 text-indigo-600 font-bold' : ''
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {(status || shift || semesterId || programId || departmentId) && (
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="font-mono text-xs uppercase tracking-wider py-2 px-3 flex items-center gap-1.5"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>

        {/* Collapsible filters box */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3" id="sections-filter-panel">
            {/* Department */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Department</label>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Program */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Program</label>
              <select
                value={programId}
                onChange={(e) => {
                  setProgramId(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Programs</option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>{prog.name}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Semester</label>
              <select
                value={semesterId}
                onChange={(e) => {
                  setSemesterId(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>{sem.name}</option>
                ))}
              </select>
            </div>

            {/* Shift */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Shift</label>
              <select
                value={shift}
                onChange={(e) => {
                  setShift(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Shifts</option>
                <option value="MORNING">Morning</option>
                <option value="EVENING">Evening</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Sections Table View */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-xs rounded-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 min-h-[350px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <span className="mt-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Loading class section details...</span>
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" id="sections-empty-state">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">No Sections Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mx-6 leading-relaxed">
              We couldn't locate any class sections matching your active query parameters.
            </p>
            {(search || status || shift || semesterId || programId || departmentId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-4 font-mono text-xs uppercase tracking-wider"
              >
                Reset Filter Query
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="sections-data-table">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/60 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-4.5 px-6 font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('code')}>
                    Code {sortBy === 'code' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-4.5 px-6 font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                    Section Name {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-4.5 px-6 font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('semester')}>
                    Semester {sortBy === 'semester' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-4.5 px-6 font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('program')}>
                    Program {sortBy === 'program' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-4.5 px-6 font-bold">Class Advisor</th>
                  <th className="py-4.5 px-6 font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('capacity')}>
                    Strength / Capacity {sortBy === 'capacity' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-4.5 px-6 font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('shift')}>
                    Shift {sortBy === 'shift' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-4.5 px-6 font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-4.5 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{sec.code}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{sec.name}</td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="font-medium">{sec.semester.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono uppercase">{sec.semester.code}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {sec.program ? (
                        <>
                          <span className="font-medium">{sec.program.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono uppercase">{sec.program.code}</span>
                        </>
                      ) : (
                        <span className="text-slate-300 font-mono italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {sec.classAdvisor ? (
                        <div>
                          <span className="font-semibold text-slate-800">{sec.classAdvisor.user.firstName} {sec.classAdvisor.user.lastName}</span>
                          <span className="block text-[10px] text-slate-400 font-sans">{sec.classAdvisor.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Advisor</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-800">{sec.currentStrength} / {sec.capacity}</span>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sec.currentStrength >= sec.capacity
                                ? 'bg-red-500'
                                : sec.currentStrength >= sec.capacity * 0.8
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min((sec.currentStrength / sec.capacity) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        sec.shift === 'MORNING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {sec.shift}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        sec.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {sec.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {sec.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`${ROUTES.SECTIONS}/${sec.uuid}`}>
                          <Button variant="outline" size="sm" className="p-1.5" title="View Section Details">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        {isWritable && (
                          <>
                            <Link to={`${ROUTES.SECTIONS}/${sec.uuid}/edit`}>
                              <Button variant="outline" size="sm" className="p-1.5" title="Edit Section">
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusToggle(sec.uuid, sec.status)}
                              className="p-1.5"
                              title={sec.status === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                            >
                              {sec.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5 text-slate-500" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSection(sec.uuid)}
                              className="p-1.5 text-red-600 hover:bg-red-50"
                              title="Delete Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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

        {/* Table Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="py-4 px-6 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between" id="sections-pagination-controls">
            <span className="text-xs text-slate-500 font-mono">
              Showing <span className="font-extrabold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-extrabold text-slate-800">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-extrabold text-slate-800">{total}</span> total sections
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="py-1.5 px-2.5 flex items-center gap-1 font-mono text-xs uppercase"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <span className="text-xs font-mono px-3 text-slate-600">
                Page <span className="font-bold text-slate-900">{page}</span> of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="py-1.5 px-2.5 flex items-center gap-1 font-mono text-xs uppercase"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default SectionListPage;
