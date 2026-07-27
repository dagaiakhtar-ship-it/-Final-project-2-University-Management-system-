import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
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
  uuid: string;
  name: string;
  code: string;
  shortName: string | null;
  description: string | null;
  faculty: string | null;
  officeLocation: string | null;
  officePhone: string | null;
  officeEmail: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  headOfDepartment: Teacher | null;
}

export const DepartmentListPage: React.FC = () => {
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // State Management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter, Sort, Pagination Params
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Selection & Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMenuUuid, setActiveMenuUuid] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Fetch Departments from REST API
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/departments', {
        params: {
          search,
          status: statusFilter || undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        },
      });

      if (response.data?.status === 'success') {
        setDepartments(response.data.data.departments);
        setTotal(response.data.data.total);
      } else {
        throw new Error('Failed to retrieve departments');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred while fetching departments'
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // Clear Search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Toggle Sorting column
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Toggle Row Selection
  const toggleSelectRow = (uuid: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(uuid)) {
      updated.delete(uuid);
    } else {
      updated.add(uuid);
    }
    setSelectedIds(updated);
  };

  // Toggle Select All Rows
  const toggleSelectAll = () => {
    if (selectedIds.size === departments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(departments.map((d) => d.uuid)));
    }
  };

  // Single Delete action
  const handleDelete = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to delete this department? This action is reversible if backed up, but will soft-delete the record.')) {
      return;
    }
    try {
      const response = await apiClient.delete(`/departments/${uuid}`);
      if (response.data?.status === 'success') {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(uuid);
          return next;
        });
        fetchDepartments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  // Single Toggle Status action
  const handleToggleStatus = async (uuid: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await apiClient.patch(`/departments/${uuid}/status`, { status: nextStatus });
      if (response.data?.status === 'success') {
        fetchDepartments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update department status');
    }
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedIds).map((uuid) =>
        apiClient.patch(`/departments/${uuid}/status`, { status })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      fetchDepartments();
    } catch (err: any) {
      alert('Bulk status update failed partially or fully.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete all ${selectedIds.size} selected departments?`)) {
      return;
    }
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedIds).map((uuid) =>
        apiClient.delete(`/departments/${uuid}`)
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      fetchDepartments();
    } catch (err: any) {
      alert('Bulk delete failed partially or fully.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Close Action Menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuUuid(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <PageContainer
      title="Department Management"
      description="Create, monitor, and configure academic departments, faculties, and operations."
      action={
        isWritable && (
          <Link to={`${ROUTES.DEPARTMENTS}/create`} id="btn-create-department">
            <Button className="inline-flex items-center gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Create Department
            </Button>
          </Link>
        )
      }
    >
      <div className="flex flex-col gap-6" id="department-list-container">
        {/* Error State Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h4 className="font-semibold text-sm">Synchronisation Error</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDepartments}
              className="border-red-300 text-red-800 hover:bg-red-100 flex-shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* Filters and Search Toolbar */}
        <Card className="px-4 py-3 bg-slate-50 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-grow max-w-lg flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by code, name, faculty, or key terms..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-slate-900"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
              <Button type="submit" variant="primary" size="sm" className="px-4">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none border-none p-0 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchDepartments}
                className="h-[38px] w-[38px] p-0 flex items-center justify-center border-slate-300 text-slate-700 hover:bg-slate-100"
                title="Refresh Department Data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </Card>

        {/* Selected Rows Bulk Actions Bar */}
        {selectedIds.size > 0 && isWritable && (
          <div className="bg-slate-900 text-white rounded-lg px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in border border-slate-850">
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-700">
                {selectedIds.size} Selected
              </span>
              <p className="text-xs text-slate-300 font-medium">Perform bulk system overrides on chosen records.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={bulkActionLoading}
                onClick={() => handleBulkStatusChange('ACTIVE')}
                className="border-slate-700 text-white hover:bg-slate-800 bg-slate-800"
              >
                Mark Active
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkActionLoading}
                onClick={() => handleBulkStatusChange('INACTIVE')}
                className="border-slate-700 text-white hover:bg-slate-800 bg-slate-800"
              >
                Mark Inactive
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={bulkActionLoading}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Table Container */}
        <Card className="overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-2xs font-semibold">
                  {isWritable && (
                    <th className="py-4 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={departments.length > 0 && selectedIds.size === departments.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer h-4 w-4"
                      />
                    </th>
                  )}
                  <th className="py-4 px-5">
                    <button
                      type="button"
                      onClick={() => handleSort('code')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer text-left"
                    >
                      Code <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-4 px-5">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer text-left"
                    >
                      Department Name <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-4 px-5 hidden md:table-cell">
                    <button
                      type="button"
                      onClick={() => handleSort('faculty')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer text-left"
                    >
                      Faculty/School <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-4 px-5 hidden lg:table-cell">
                    <button
                      type="button"
                      onClick={() => handleSort('headOfDepartment')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer text-left"
                    >
                      Head of Department <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
                {loading ? (
                  // Loading state skeletons
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      {isWritable && <td className="py-4 px-4 text-center"><div className="h-4 w-4 bg-slate-200 rounded mx-auto" /></td>}
                      <td className="py-4 px-5"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-5">
                        <div className="h-4 w-40 bg-slate-200 rounded mb-1" />
                        <div className="h-3 w-20 bg-slate-100 rounded" />
                      </td>
                      <td className="py-4 px-5 hidden md:table-cell"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-5 hidden lg:table-cell"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-5"><div className="h-6 w-16 bg-slate-200 rounded-full" /></td>
                      <td className="py-4 px-5 text-right"><div className="h-8 w-16 bg-slate-200 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : departments.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan={isWritable ? 7 : 6} className="py-12 px-5 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                        <div className="p-4 bg-slate-100 rounded-full text-slate-400 border border-slate-200">
                          <Sparkles className="h-8 w-8" />
                        </div>
                        <h4 className="font-semibold text-base text-slate-800">No departments found</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Your search query or selected status filter returned no results. Try adjusting your inputs or create a new department.
                        </p>
                        {search || statusFilter ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearch('');
                              setSearchInput('');
                              setStatusFilter('');
                            }}
                            className="mt-2"
                          >
                            Reset Filters
                          </Button>
                        ) : (
                          isWritable && (
                            <Link to={`${ROUTES.DEPARTMENTS}/create`} className="mt-2">
                              <Button size="sm" className="inline-flex items-center gap-1">
                                <Plus className="h-3.5 w-3.5" /> Create Department
                              </Button>
                            </Link>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Records list
                  departments.map((dept) => {
                    const isSelected = selectedIds.has(dept.uuid);
                    return (
                      <tr
                        key={dept.uuid}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-slate-50/70' : ''
                        }`}
                      >
                        {isWritable && (
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(dept.uuid)}
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer h-4 w-4"
                            />
                          </td>
                        )}
                        <td className="py-4 px-5 font-mono text-xs font-bold text-slate-900">
                          {dept.code}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-sm hover:text-slate-900">
                              {dept.name}
                            </span>
                            {dept.shortName && (
                              <span className="text-2xs text-slate-500 font-medium">
                                Alias: {dept.shortName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 hidden md:table-cell text-slate-600 font-medium">
                          {dept.faculty || <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="py-4 px-5 hidden lg:table-cell">
                          {dept.headOfDepartment ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">
                                {dept.headOfDepartment.user.firstName} {dept.headOfDepartment.user.lastName}
                              </span>
                              <span className="text-2xs text-slate-400 font-medium">
                                {dept.headOfDepartment.user.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Vacant</span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          {dept.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right relative">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link to={`${ROUTES.DEPARTMENTS}/${dept.uuid}`} title="View Details">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 flex items-center justify-center border-slate-200 hover:bg-slate-100"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-600" />
                              </Button>
                            </Link>

                            {isWritable && (
                              <>
                                <Link to={`${ROUTES.DEPARTMENTS}/${dept.uuid}/edit`} title="Edit Record">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 flex items-center justify-center border-slate-200 hover:bg-slate-100"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                                  </Button>
                                </Link>

                                <div className="relative">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuUuid(activeMenuUuid === dept.uuid ? null : dept.uuid);
                                    }}
                                    className="h-8 w-8 p-0 flex items-center justify-center border-slate-200 hover:bg-slate-100"
                                    title="More Options"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5 text-slate-600" />
                                  </Button>

                                  {activeMenuUuid === dept.uuid && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-left"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuUuid(null);
                                          handleToggleStatus(dept.uuid, dept.status);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium flex items-center gap-1.5"
                                      >
                                        Mark as {dept.status === 'ACTIVE' ? 'Inactive' : 'Active'}
                                      </button>
                                      <hr className="border-slate-150 my-1" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuUuid(null);
                                          handleDelete(dept.uuid);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-medium flex items-center gap-1.5"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete Department
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && departments.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Showing{' '}
                <span className="text-slate-800 font-bold">
                  {Math.min((page - 1) * limit + 1, total)}
                </span>{' '}
                to{' '}
                <span className="text-slate-800 font-bold">
                  {Math.min(page * limit, total)}
                </span>{' '}
                of <span className="text-slate-800 font-bold">{total}</span> departments
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-8 px-2 flex items-center gap-1 border-slate-300 hover:bg-slate-100"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>

                {Array.from({ length: Math.ceil(total / limit) }).map((_, pageIdx) => {
                  const targetPage = pageIdx + 1;
                  return (
                    <Button
                      key={targetPage}
                      variant={page === targetPage ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setPage(targetPage)}
                      className={`h-8 w-8 p-0 border-slate-300 ${
                        page === targetPage
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {targetPage}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage(page + 1)}
                  className="h-8 px-2 flex items-center gap-1 border-slate-300 hover:bg-slate-100"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
export default DepartmentListPage;
