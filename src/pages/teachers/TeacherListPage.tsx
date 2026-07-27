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
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Building,
  Mail,
  User,
  GraduationCap,
  Briefcase,
  Phone,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface Teacher {
  id: number;
  uuid: string;
  employeeId: string;
  userId: number;
  designation: string | null;
  employmentType: 'Permanent' | 'Contract' | 'Visiting';
  qualification: string | null;
  specialization: string | null;
  experience: number | null;
  joiningDate: string | null;
  officeLocation: string | null;
  officePhone: string | null;
  profilePhoto: string | null;
  status: 'Active' | 'On Leave' | 'Retired' | 'Suspended';
  user: UserProfile;
  department: Department;
}

export const TeacherListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Teacher states
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [departmentIdFilter, setDepartmentIdFilter] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Inline status update active dropdowns
  const [activeStatusDropdown, setActiveStatusDropdown] = useState<string | null>(null);

  // Fetch Lookups
  const fetchLookups = async () => {
    try {
      const response = await apiClient.get('/teachers/lookup-options');
      if (response.data?.status === 'success') {
        setDepartments(response.data.data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching lookups:', error);
    }
  };

  // Fetch Teachers list
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        status: statusFilter || undefined,
        employmentType: employmentTypeFilter || undefined,
        departmentId: departmentIdFilter || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      };

      const response = await apiClient.get('/teachers', { params });
      if (response.data?.status === 'success') {
        setTeachers(response.data.data.teachers);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [page, statusFilter, employmentTypeFilter, departmentIdFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTeachers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setEmploymentTypeFilter('');
    setDepartmentIdFilter('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleDelete = async (uuid: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the profile of ${name}? This action is irreversible.`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/teachers/${uuid}`);
      if (response.status === 200) {
        toast.success('Teacher profile deleted successfully');
        fetchTeachers();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete teacher profile');
    }
  };

  const handleStatusUpdate = async (uuid: string, newStatus: 'Active' | 'On Leave' | 'Retired' | 'Suspended') => {
    try {
      const response = await apiClient.patch(`/teachers/${uuid}/status`, { status: newStatus });
      if (response.status === 200) {
        toast.success(`Status updated to ${newStatus}`);
        setTeachers((prev) =>
          prev.map((t) => (t.uuid === uuid ? { ...t, status: newStatus } : t))
        );
      }
    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActiveStatusDropdown(null);
    }
  };

  const getStatusBadgeClass = (statusVal: string) => {
    switch (statusVal) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'On Leave':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Retired':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Suspended':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <PageContainer
      title="Teacher Directory"
      description="Access and manage university faculty records, academic specializations, and departmental loads."
      action={
        isWritable && (
          <Link to="/teachers/create" id="btn-create-teacher">
            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Teacher</span>
            </Button>
          </Link>
        )
      }
    >
      {/* Search & Filters Controls */}
      <Card className="p-4 mb-6 border border-gray-100 shadow-sm" id="filters-card">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="search-input"
              placeholder="Search by Employee ID, Name, Email, Department, Designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              id="btn-toggle-filters"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border-gray-200 text-gray-700"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {(statusFilter || employmentTypeFilter || departmentIdFilter) && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              )}
            </Button>

            <Button
              type="button"
              id="btn-reset-filters"
              variant="outline"
              onClick={handleResetFilters}
              className="flex items-center gap-2 border-gray-200 text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>

            <Button
              type="submit"
              id="btn-search-submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Search
            </Button>
          </div>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100" id="advanced-filters">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="filter-department">
                Department
              </label>
              <select
                id="filter-department"
                value={departmentIdFilter}
                onChange={(e) => {
                  setDepartmentIdFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="filter-employment-type">
                Employment Type
              </label>
              <select
                id="filter-employment-type"
                value={employmentTypeFilter}
                onChange={(e) => {
                  setEmploymentTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Employment Types</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Visiting">Visiting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="filter-status">
                Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Retired">Retired</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Loading state */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Fetching directory records...</p>
        </div>
      ) : teachers.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center text-gray-500 border border-dashed border-gray-200" id="teachers-empty-state">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">No Faculty Profiles Found</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
            We couldn't find any teacher records matching your search or filters. Create a new record to get started.
          </p>
          {isWritable && (
            <Link to="/teachers/create">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                Add Faculty Profile
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        /* Teachers Table */
        <Card className="overflow-hidden border border-gray-100 shadow-sm" id="teachers-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="teachers-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold text-gray-600">
                    <button
                      type="button"
                      onClick={() => handleSort('firstName')}
                      className="flex items-center gap-1 hover:text-gray-800 focus:outline-none"
                    >
                      <span>Teacher</span>
                      {sortBy === 'firstName' && (
                        <span className="text-indigo-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-gray-600">
                    <button
                      type="button"
                      onClick={() => handleSort('employeeId')}
                      className="flex items-center gap-1 hover:text-gray-800 focus:outline-none"
                    >
                      <span>Employee ID</span>
                      {sortBy === 'employeeId' && (
                        <span className="text-indigo-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-gray-600">
                    <button
                      type="button"
                      onClick={() => handleSort('departmentName')}
                      className="flex items-center gap-1 hover:text-gray-800 focus:outline-none"
                    >
                      <span>Department</span>
                      {sortBy === 'departmentName' && (
                        <span className="text-indigo-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-gray-600">
                    <button
                      type="button"
                      onClick={() => handleSort('designation')}
                      className="flex items-center gap-1 hover:text-gray-800 focus:outline-none"
                    >
                      <span>Designation</span>
                      {sortBy === 'designation' && (
                        <span className="text-indigo-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-gray-600">
                    <button
                      type="button"
                      onClick={() => handleSort('employmentType')}
                      className="flex items-center gap-1 hover:text-gray-800 focus:outline-none"
                    >
                      <span>Type</span>
                      {sortBy === 'employmentType' && (
                        <span className="text-indigo-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-gray-600">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {teachers.map((teacher) => {
                  const name = `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`;
                  const image = teacher.profilePhoto || teacher.user?.avatarUrl;
                  const canEdit = isWritable || (user?.role === 'TEACHER' && user.id === teacher.userId);

                  return (
                    <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors" id={`row-${teacher.id}`}>
                      {/* Avatar & Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                            {image ? (
                              <img src={image} alt={name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              <span>{teacher.user?.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {teacher.employeeId}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-800">{teacher.department?.name}</div>
                            <div className="text-xs text-gray-400">{teacher.department?.code}</div>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {teacher.designation || 'Faculty Member'}
                      </td>

                      {/* Employment Type */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {teacher.employmentType}
                        </span>
                      </td>

                      {/* Status (with inline updating dropdown) */}
                      <td className="py-3 px-4 relative">
                        {isWritable ? (
                          <div className="inline-block text-left">
                            <button
                              type="button"
                              id={`status-btn-${teacher.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveStatusDropdown(activeStatusDropdown === teacher.uuid ? null : teacher.uuid);
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all hover:ring-1 hover:ring-indigo-500 focus:outline-none ${getStatusBadgeClass(teacher.status)}`}
                            >
                              <span>{teacher.status}</span>
                              <ChevronDown className="w-3.5 h-3.5 text-current opacity-70" />
                            </button>

                            {activeStatusDropdown === teacher.uuid && (
                              <div
                                className="absolute left-4 mt-1.5 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 py-1"
                                id={`status-dropdown-${teacher.id}`}
                              >
                                {['Active', 'On Leave', 'Retired', 'Suspended'].map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusUpdate(teacher.uuid, st as any)}
                                    className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(teacher.status)}`}>
                            {teacher.status}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Link to={`/teachers/${teacher.uuid}`} id={`btn-view-${teacher.id}`}>
                            <Button variant="outline" className="p-1.5 h-8 w-8 text-gray-500 border-gray-200 hover:text-indigo-600 hover:border-indigo-200">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>

                          {canEdit && (
                            <Link to={`/teachers/${teacher.uuid}/edit`} id={`btn-edit-${teacher.id}`}>
                              <Button variant="outline" className="p-1.5 h-8 w-8 text-gray-500 border-gray-200 hover:text-amber-600 hover:border-amber-200">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}

                          {isWritable && (
                            <Button
                              type="button"
                              id={`btn-delete-${teacher.id}`}
                              variant="outline"
                              onClick={() => handleDelete(teacher.uuid, name)}
                              className="p-1.5 h-8 w-8 text-gray-500 border-gray-200 hover:text-rose-600 hover:border-rose-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-gray-50/50 px-4 py-3 flex items-center justify-between border-t border-gray-100" id="pagination-controls">
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="text-gray-700">{(page - 1) * limit + 1}</span> to{' '}
                <span className="text-gray-700">{Math.min(page * limit, total)}</span> of{' '}
                <span className="text-gray-700">{total}</span> records
              </div>

              <div className="flex gap-1.5">
                <Button
                  id="btn-prev-page"
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <Button
                    key={pNum}
                    id={`btn-page-${pNum}`}
                    variant={page === pNum ? 'primary' : 'outline'}
                    onClick={() => setPage(pNum)}
                    className="h-8 w-8 p-0 text-xs font-semibold"
                  >
                    {pNum}
                  </Button>
                ))}

                <Button
                  id="btn-next-page"
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </PageContainer>
  );
};

export default TeacherListPage;
