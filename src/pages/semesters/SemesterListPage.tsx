import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { 
  GraduationCap, Search, ArrowUpDown, Plus, Trash2, Edit2, Eye, MoreVertical, 
  Calendar, SlidersHorizontal, RefreshCw, AlertCircle, X, ChevronRight, ChevronLeft,
  BookOpen, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Program {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

interface Semester {
  id: number;
  uuid: string;
  name: string;
  code: string;
  semesterNumber: number;
  semesterType: 'REGULAR' | 'SUMMER' | 'WINTER';
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'ARCHIVED';
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  minCreditHours: number;
  maxCreditHours: number;
  description: string | null;
  createdAt: string;
  program: {
    id: number;
    name: string;
    code: string;
  };
  academicYear: {
    id: number;
    name: string;
  };
}

export const SemesterListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Core Data State
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown States
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // Filtering, Searching, Sorting, Pagination States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [ayFilter, setAyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Interactive UI States
  const [activeMenuUuid, setActiveMenuUuid] = useState<string | null>(null);
  const [deleteConfirmUuid, setDeleteConfirmUuid] = useState<string | null>(null);
  const [updatingStatusUuid, setUpdatingStatusUuid] = useState<string | null>(null);

  // Load dropdown lists (programs & academic years)
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [progRes, ayRes] = await Promise.all([
          apiClient.get('/programs', { params: { limit: 100 } }),
          apiClient.get('/semesters/academic-years'),
        ]);

        if (progRes.data?.status === 'success') {
          setPrograms(progRes.data.data.programs || []);
        }
        if (ayRes.data?.status === 'success') {
          setAcademicYears(ayRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load filter choices:', err);
      }
    };
    fetchDropdowns();
  }, []);

  // Primary Data Fetching
  const fetchSemesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/semesters', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          semesterType: typeFilter || undefined,
          programId: programFilter || undefined,
          academicYearId: ayFilter || undefined,
          page,
          limit,
          sortBy,
          sortOrder,
        },
      });

      if (response.data?.status === 'success') {
        setSemesters(response.data.data.semesters || []);
        setTotal(response.data.data.total || 0);
      }
    } catch (err: any) {
      console.error('Error loading semesters:', err);
      setError(
        err.response?.data?.message || 'Failed to load semester records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
    // Close menus on page/filter change
    setActiveMenuUuid(null);
  }, [search, statusFilter, typeFilter, programFilter, ayFilter, page, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setProgramFilter('');
    setAyFilter('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
    toast.success('Filters cleared');
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

  const handleDelete = async (uuid: string) => {
    try {
      const res = await apiClient.delete(`/semesters/${uuid}`);
      if (res.data?.status === 'success') {
        toast.success('Semester deleted successfully');
        setDeleteConfirmUuid(null);
        fetchSemesters();
      }
    } catch (err: any) {
      console.error('Delete semester failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete semester record');
    }
  };

  const handleStatusChange = async (uuid: string, newStatus: string) => {
    try {
      const res = await apiClient.patch(`/semesters/${uuid}/status`, { status: newStatus });
      if (res.data?.status === 'success') {
        toast.success(`Semester status updated to ${newStatus}`);
        setUpdatingStatusUuid(null);
        setActiveMenuUuid(null);
        fetchSemesters();
      }
    } catch (err: any) {
      console.error('Status update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to change semester status');
    }
  };

  // Status Badge colors generator
  const getStatusBadge = (status: string) => {
    const maps: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      UPCOMING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Upcoming' },
      ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
      COMPLETED: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500', label: 'Completed' },
      SUSPENDED: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Suspended' },
      ARCHIVED: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Archived' },
    };

    const current = maps[status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', label: status };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-tight ${current.bg} ${current.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`}></span>
        {current.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageContainer>
      {/* Upper header section */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between" id="semester-list-header">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Semester Management
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Administer academic terms, student registration durations, and credit limit bounds
          </p>
        </div>

        {isWritable && (
          <Link to={`${ROUTES.SEMESTERS}/create`} id="btn-create-semester-link">
            <Button className="font-mono text-xs uppercase tracking-wider py-2">
              <Plus className="w-4 h-4 mr-1.5" /> New Semester
            </Button>
          </Link>
        )}
      </div>

      {/* Control and Filters Panel */}
      <Card className="mb-6 border border-slate-200 shadow-xs p-4 bg-white" id="semester-list-filters-panel">
        <div className="flex flex-col gap-4">
          {/* Row 1: Search & Reset */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name, code, program, or academic year..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 font-mono text-xs bg-slate-50/50"
                id="semester-search-input"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="font-mono text-xs border-slate-300 py-2.5 shrink-0"
              id="btn-reset-filters"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Clear filters
            </Button>
          </div>

          {/* Row 2: Advanced filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Program Filter */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-program" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Program Select
              </label>
              <select
                id="filter-program"
                value={programFilter}
                onChange={(e) => {
                  setProgramFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs font-mono rounded-lg border border-slate-200 bg-white p-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              >
                <option value="">All Programs</option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-academic-year" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Academic Year
              </label>
              <select
                id="filter-academic-year"
                value={ayFilter}
                onChange={(e) => {
                  setAyFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs font-mono rounded-lg border border-slate-200 bg-white p-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              >
                <option value="">All Years</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Type Filter */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-type" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Type
              </label>
              <select
                id="filter-type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs font-mono rounded-lg border border-slate-200 bg-white p-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              >
                <option value="">All Types</option>
                <option value="REGULAR">Regular</option>
                <option value="SUMMER">Summer</option>
                <option value="WINTER">Winter</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-status" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs font-mono rounded-lg border border-slate-200 bg-white p-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              >
                <option value="">All Statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table Segment */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center p-12 border border-slate-200 bg-white min-h-[400px]">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="mt-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Loading semester catalog...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-8 border border-red-200 bg-red-50 text-center flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-red-900 text-sm">Failed to retrieve data</h3>
          <p className="text-xs text-red-700 font-mono mt-1 max-w-md">{error}</p>
          <Button onClick={fetchSemesters} className="mt-4 text-xs font-mono" variant="outline">
            Try Again
          </Button>
        </Card>
      ) : semesters.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border border-slate-200 bg-white min-h-[400px]">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-indigo-500" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">No Semesters Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md font-sans">
            No semester matches your filters. Modify search strings or create a new academic semester record.
          </p>
          {isWritable && (
            <Link to={`${ROUTES.SEMESTERS}/create`} className="mt-4">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Create First Semester
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="relative">
          <Card className="overflow-x-auto border border-slate-200 shadow-xs bg-white rounded-xl">
            <table className="w-full text-left border-collapse min-w-[1000px]" id="semesters-catalog-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort('semesterNumber')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Term No. <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Semester Name <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort('program')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Program <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort('academicYear')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Academic Year <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Duration Dates
                  </th>
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-center">
                    Credits (Min / Max)
                  </th>
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-center">
                    Type
                  </th>
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {semesters.map((sem) => (
                  <tr
                    key={sem.uuid}
                    className="hover:bg-slate-50/50 transition duration-150"
                    id={`semester-row-${sem.uuid}`}
                  >
                    {/* Term No. */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      Sem {sem.semesterNumber}
                    </td>

                    {/* Name & Code */}
                    <td className="py-4 px-4 font-sans font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{sem.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{sem.code}</span>
                      </div>
                    </td>

                    {/* Program */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{sem.program.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{sem.program.code}</span>
                      </div>
                    </td>

                    {/* Academic Year */}
                    <td className="py-4 px-4 font-mono text-slate-600">
                      {sem.academicYear.name}
                    </td>

                    {/* Duration Dates */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 font-mono text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" /> Class: {formatDate(sem.startDate)} - {formatDate(sem.endDate)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <BookOpen className="w-3 h-3" /> Reg: {formatDate(sem.registrationStartDate)} - {formatDate(sem.registrationEndDate)}
                        </span>
                      </div>
                    </td>

                    {/* Credit Bounds */}
                    <td className="py-4 px-4 text-center font-mono font-semibold">
                      {sem.minCreditHours} - {sem.maxCreditHours} Cr
                    </td>

                    {/* Semester Type */}
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {sem.semesterType}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {getStatusBadge(sem.status)}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-4 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`${ROUTES.SEMESTERS}/${sem.uuid}`} title="View Details">
                          <Button variant="outline" size="sm" className="p-1 h-8 w-8 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 bg-white">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {isWritable && (
                          <>
                            <Link to={`${ROUTES.SEMESTERS}/${sem.uuid}/edit`} title="Edit Record">
                              <Button variant="outline" size="sm" className="p-1 h-8 w-8 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 bg-white">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </Link>

                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-1 h-8 w-8 text-slate-500 hover:text-indigo-600 bg-white"
                                onClick={() => setActiveMenuUuid(activeMenuUuid === sem.uuid ? null : sem.uuid)}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>

                              {/* Dropdown Box */}
                              {activeMenuUuid === sem.uuid && (
                                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg z-30 py-1 text-left">
                                  <div className="px-2 py-1 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                    Change Status
                                  </div>
                                  {['UPCOMING', 'ACTIVE', 'COMPLETED', 'SUSPENDED', 'ARCHIVED'].map((st) => (
                                    <button
                                      key={st}
                                      onClick={() => handleStatusChange(sem.uuid, st)}
                                      disabled={sem.status === st}
                                      className={`w-full px-3 py-1.5 text-left text-xs font-mono hover:bg-slate-50 transition ${
                                        sem.status === st ? 'text-indigo-650 font-bold bg-slate-50' : 'text-slate-600'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}

                                  <div className="border-t border-slate-100 mt-1 pt-1">
                                    <button
                                      onClick={() => {
                                        setDeleteConfirmUuid(sem.uuid);
                                        setActiveMenuUuid(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-red-600 font-mono hover:bg-red-50 flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Soft Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination Controllers */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-mono">
              Showing <span className="font-bold text-slate-800">{semesters.length}</span> of{' '}
              <span className="font-bold text-slate-800">{total}</span> semester records
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1 bg-white border-slate-200 hover:bg-slate-50 h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono text-slate-700">
                Page <span className="font-bold">{page}</span> of{' '}
                <span className="font-bold">{Math.ceil(total / limit) || 1}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(page + 1)}
                className="p-1 bg-white border-slate-200 hover:bg-slate-50 h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay Modal */}
      {deleteConfirmUuid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <Card className="max-w-md w-full bg-white p-6 border border-slate-200 shadow-2xl rounded-2xl animate-in fade-in-50 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-grow">
                <h3 className="text-base font-bold text-slate-900 leading-snug">Delete Semester?</h3>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  Are you sure you want to soft-delete this academic semester record? This record won't show in the main catalog, but can be recovered if needed.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3.5">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmUuid(null)}
                className="font-mono text-xs uppercase tracking-wider py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmUuid)}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-wider py-2 border-red-650"
              >
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default SemesterListPage;
