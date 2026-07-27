import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

interface Teacher {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Program {
  id: number;
  uuid: string;
  name: string;
  code: string;
  shortName: string | null;
  degreeLevel: string;
  duration: number;
  totalSemesters: number;
  creditHours: number;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  department: Department;
  coordinator: Teacher | null;
}

export const ProgramListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // State Management
  const [programs, setPrograms] = useState<Program[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Dropdowns
  const [departments, setDepartments] = useState<Department[]>([]);
  const [degreeLevelFilter, setDegreeLevelFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Search, Sort, Pagination
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // UI state
  const [activeMenuUuid, setActiveMenuUuid] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch available departments for filters
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await apiClient.get('/departments', { params: { limit: 100 } });
        if (response.data?.status === 'success') {
          setDepartments(response.data.data.departments || []);
        }
      } catch (err) {
        console.error('Failed to load departments list for filtering:', err);
      }
    };
    fetchDepartments();
  }, []);

  // 2. Fetch Programs from REST API
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/programs', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          degreeLevel: degreeLevelFilter || undefined,
          departmentId: deptFilter ? parseInt(deptFilter, 10) : undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        },
      });

      if (response.data?.status === 'success') {
        setPrograms(response.data.data.programs || []);
        setTotal(response.data.data.total || 0);
      } else {
        throw new Error('Failed to retrieve academic programs.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not fetch academic programs. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, degreeLevelFilter, deptFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Handler for sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Handler for search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  // Handler for reset filters
  const handleResetFilters = () => {
    setSearchInput('');
    setSearch('');
    setDegreeLevelFilter('');
    setDeptFilter('');
    setStatusFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  // Action: Toggle Status
  const handleToggleStatus = async (program: Program) => {
    const nextStatus = program.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoading(program.uuid);
    try {
      // Optimistic update
      setPrograms((prev) =>
        prev.map((p) => (p.uuid === program.uuid ? { ...p, status: nextStatus } : p))
      );

      const response = await apiClient.patch(`/programs/${program.uuid}/status`, {
        status: nextStatus,
      });

      if (response.data?.status !== 'success') {
        throw new Error();
      }
    } catch (err) {
      console.error('Failed to change program status:', err);
      // Revert on failure
      setPrograms((prev) =>
        prev.map((p) => (p.uuid === program.uuid ? { ...p, status: program.status } : p))
      );
      alert('Failed to modify status. Check connection and permissions.');
    } finally {
      setActionLoading(null);
      setActiveMenuUuid(null);
    }
  };

  // Action: Delete Program
  const handleDeleteProgram = async (programUuid: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this program? All related configurations will be affected.')) {
      return;
    }
    setActionLoading(programUuid);
    try {
      const response = await apiClient.delete(`/programs/${programUuid}`);
      if (response.data?.status === 'success') {
        // Remove from list
        setPrograms((prev) => prev.filter((p) => p.uuid !== programUuid));
        setTotal((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error('Failed to delete program:', err);
      alert('Delete operation failed. Please check permissions.');
    } finally {
      setActionLoading(null);
      setActiveMenuUuid(null);
    }
  };

  return (
    <PageContainer>
      {/* Header section */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between" id="program-list-header">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-1">
            <Link to={ROUTES.DASHBOARD} className="hover:text-indigo-600">ERP</Link>
            <span>/</span>
            <span className="text-gray-400">ACADEMIC PROGRAMS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            Programs Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Build, edit, and orchestrate degree plans (BS, MS, PhD) across active academic departments.
          </p>
        </div>

        {isWritable && (
          <div>
            <Link to={`${ROUTES.PROGRAMS}/create`} id="btn-create-program">
              <Button variant="primary" size="sm" className="flex items-center gap-2 font-mono text-xs">
                <Plus className="w-4 h-4" /> Create Program
              </Button>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3 text-sm" id="program-list-error">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>{error}</div>
          <button onClick={() => fetchPrograms()} className="ml-auto text-xs font-mono font-bold text-red-700 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Control Bar: search and filters */}
      <Card className="p-4 mb-6 shadow-2xs border border-gray-100" id="program-list-control-card">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code, name, department..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Degree Level Filter */}
            <select
              value={degreeLevelFilter}
              onChange={(e) => {
                setDegreeLevelFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Degree Levels</option>
              <option value="Diploma">Diploma</option>
              <option value="Associate">Associate Degree</option>
              <option value="BS">Bachelor (BS)</option>
              <option value="MS">Master (MS)</option>
              <option value="MPhil">MPhil</option>
              <option value="PhD">Doctorate (PhD)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Reset Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="font-mono text-3xs border-gray-300 py-1.5"
            >
              Reset Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Table Card */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm" id="program-list-table-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 min-h-[350px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-xs font-mono text-gray-500">Querying registry database...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-16 px-4 min-h-[300px] flex flex-col justify-center items-center">
            <GraduationCap className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">No academic programs found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              We couldn't find any programs matching those filters. Try adjusting your constraints or create a new program.
            </p>
            {isWritable && (
              <Link to={`${ROUTES.PROGRAMS}/create`} className="mt-4">
                <Button variant="outline" size="sm" className="font-mono text-3xs">
                  Create First Program
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="program-list-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-3xs font-mono uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4 font-semibold">
                    <button
                      onClick={() => handleSort('code')}
                      className="flex items-center gap-1 hover:text-indigo-600 focus:outline-none"
                    >
                      Code <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-indigo-600 focus:outline-none"
                    >
                      Program Name <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button
                      onClick={() => handleSort('department')}
                      className="flex items-center gap-1 hover:text-indigo-600 focus:outline-none"
                    >
                      Department <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button
                      onClick={() => handleSort('degreeLevel')}
                      className="flex items-center gap-1 hover:text-indigo-600 focus:outline-none"
                    >
                      Level <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">
                    <button
                      onClick={() => handleSort('duration')}
                      className="inline-flex items-center gap-1 hover:text-indigo-600 focus:outline-none"
                    >
                      Dur <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">
                    <button
                      onClick={() => handleSort('totalSemesters')}
                      className="inline-flex items-center gap-1 hover:text-indigo-600 focus:outline-none"
                    >
                      Semesters <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">
                    <button
                      onClick={() => handleSort('creditHours')}
                      className="inline-flex items-center gap-1 hover:text-indigo-600 focus:outline-none"
                    >
                      Credits <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">Coordinator</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {programs.map((prog) => (
                  <tr key={prog.uuid} className="hover:bg-gray-50/50 transition-colors" id={`row-${prog.code.toLowerCase()}`}>
                    {/* Code */}
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-700">
                      {prog.code}
                    </td>

                    {/* Program Name */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-950">{prog.name}</div>
                      {prog.shortName && (
                        <span className="text-3xs font-mono text-gray-400">Abbr: {prog.shortName}</span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-gray-900">{prog.department.name}</div>
                      <span className="text-3xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200/50">
                        {prog.department.code}
                      </span>
                    </td>

                    {/* Degree Level */}
                    <td className="py-3 px-4 text-xs">
                      <span className="font-mono bg-indigo-50/55 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/50">
                        {prog.degreeLevel}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 text-xs font-mono text-center">
                      {prog.duration} {prog.duration === 1 ? 'yr' : 'yrs'}
                    </td>

                    {/* Total Semesters */}
                    <td className="py-3 px-4 text-xs font-mono text-center text-gray-900">
                      {prog.totalSemesters}
                    </td>

                    {/* Credit Hours */}
                    <td className="py-3 px-4 text-xs font-mono text-center font-medium">
                      {prog.creditHours}
                    </td>

                    {/* Coordinator */}
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {prog.coordinator ? (
                        <div>
                          <p className="font-semibold text-gray-900">
                            {prog.coordinator.user.firstName} {prog.coordinator.user.lastName}
                          </p>
                          <p className="text-3xs font-mono text-gray-400 break-all">{prog.coordinator.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic font-mono text-3xs">Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-xs">
                      {prog.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-3xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-3xs font-semibold px-2 py-0.5 rounded-full border border-gray-200">
                          <XCircle className="w-3 h-3" /> INACTIVE
                        </span>
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Instant actions */}
                        <Link to={`${ROUTES.PROGRAMS}/${prog.uuid}`} title="View Details">
                          <Button variant="outline" size="sm" className="p-1 h-8 w-8 text-gray-500 hover:text-indigo-600 hover:border-indigo-200">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>

                        {isWritable && (
                          <>
                            <Link to={`${ROUTES.PROGRAMS}/${prog.uuid}/edit`} title="Edit Record">
                              <Button variant="outline" size="sm" className="p-1 h-8 w-8 text-gray-500 hover:text-indigo-600 hover:border-indigo-200">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </Link>

                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-1 h-8 w-8 text-gray-500 hover:text-indigo-600"
                                onClick={() => setActiveMenuUuid(activeMenuUuid === prog.uuid ? null : prog.uuid)}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>

                              {activeMenuUuid === prog.uuid && (
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 text-left animate-fade-in">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(prog)}
                                    className="w-full px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                    disabled={actionLoading === prog.uuid}
                                  >
                                    {prog.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5 text-gray-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                    {prog.status === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProgram(prog.uuid)}
                                    className="w-full px-4 py-2 text-xs hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-red-600 border-t border-gray-100"
                                    disabled={actionLoading === prog.uuid}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                    Delete Program
                                  </button>
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
          </div>
        )}

        {/* Pagination bar */}
        {!loading && total > 0 && (
          <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex items-center justify-between font-mono text-xs text-gray-500" id="program-list-pagination">
            <div>
              Showing <span className="font-semibold text-gray-950">{Math.min(total, (page - 1) * limit + 1)}</span> to{' '}
              <span className="font-semibold text-gray-950">{Math.min(total, page * limit)}</span> of{' '}
              <span className="font-semibold text-gray-950">{total}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1 bg-white border-gray-200 hover:bg-gray-50 h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-gray-900 font-semibold px-2">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(page + 1)}
                className="p-1 bg-white border-gray-200 hover:bg-gray-50 h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
export default ProgramListPage;
