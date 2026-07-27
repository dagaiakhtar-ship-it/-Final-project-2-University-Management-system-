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
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface Subject {
  id: number;
  uuid: string;
  name: string;
  code: string;
  department?: {
    name: string;
  };
  program?: {
    name: string;
  };
}

interface Course {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string | null;
  credits: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  subjects?: Subject[];
}

export const CourseListPage: React.FC = () => {
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // State Management
  const [courses, setCourses] = useState<Course[]>([]);
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

  // Fetch Courses from REST API
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/courses', {
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
        setCourses(response.data.data.courses);
        setTotal(response.data.data.total);
      } else {
        throw new Error('Failed to retrieve courses');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred while fetching courses'
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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

  // Single Delete action
  const handleDelete = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action is reversible if backed up, but will soft-delete the record.')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/courses/${uuid}`);
      if (response.status === 200 || response.data?.status === 'success') {
        fetchCourses();
      } else {
        throw new Error('Failed to delete course');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to delete course');
    }
  };

  // Toggle Status action
  const handleToggleStatus = async (course: Course) => {
    const newStatus = course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await apiClient.patch(`/courses/${course.uuid}/status`, { status: newStatus });
      if (response.status === 200 || response.data?.status === 'success') {
        fetchCourses();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  // Pagination helper
  const totalPages = Math.ceil(total / limit);

  return (
    <PageContainer
      title="Courses Directory"
      description="Comprehensive catalog of primary university courses, degree criteria, and connected curriculum structures."
      action={
        isWritable && (
          <Link to="/courses/create">
            <Button variant="primary" leftIcon={Plus}>
              New Course
            </Button>
          </Link>
        )
      }
    >
      <div className="space-y-6">
        {/* Statistics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 flex items-center space-x-4 border-l-4 border-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Total Courses</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{total}</h3>
            </div>
          </Card>
          <Card className="p-5 flex items-center space-x-4 border-l-4 border-emerald-500">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Active Status</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {courses.filter((c) => c.status === 'ACTIVE').length} Active
              </h3>
            </div>
          </Card>
          <Card className="p-5 flex items-center space-x-4 border-l-4 border-amber-500">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Credits Load</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                Avg {total > 0 && Array.isArray(courses) && courses.length > 0 ? (courses.reduce((sum, c) => sum + c.credits, 0) / courses.length).toFixed(1) : 0} Credits
              </h3>
            </div>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="Search by code, title, or details..."
                className="w-full pl-10 pr-20 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-14 top-2 text-xs font-mono text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition"
              >
                Go
              </button>
            </form>

            {/* Quick Filters */}
            <div className="flex items-center space-x-3 self-end md:self-auto">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Filter className="h-4 w-4 text-gray-400" />
                <span>Status:</span>
              </div>
              <select
                className="border border-gray-200 rounded-lg py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                leftIcon={RefreshCw}
                onClick={fetchCourses}
                className="h-9 px-3"
              >
                Reload
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Handling */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{error}</p>
            <button
              onClick={fetchCourses}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Directory Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-mono text-gray-500">Retrieving system catalog records...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-gray-800">No Course Records Found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                No university courses match your filters. Seed the database or create a new entry to begin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-mono uppercase text-gray-500 tracking-wider">
                    <th className="py-4 px-6 font-medium">
                      <button
                        onClick={() => handleSort('code')}
                        className="flex items-center space-x-1 hover:text-gray-900"
                      >
                        <span>Course Code</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-6 font-medium">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-gray-900"
                      >
                        <span>Course Name</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-6 font-medium">
                      <button
                        onClick={() => handleSort('credits')}
                        className="flex items-center space-x-1 hover:text-gray-900"
                      >
                        <span>Credits</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-6 font-medium">Linked Subjects</th>
                    <th className="py-4 px-6 font-medium">Status</th>
                    <th className="py-4 px-6 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-sans text-gray-700">
                  {courses.map((course) => (
                    <tr key={course.uuid} className="hover:bg-gray-50/50 transition duration-150">
                      {/* Code */}
                      <td className="py-4 px-6 font-mono font-semibold text-primary">
                        {course.code}
                      </td>

                      {/* Name / Description */}
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900">{course.name}</div>
                          {course.description && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Credits */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-100">
                          {course.credits} Credits
                        </span>
                      </td>

                      {/* Linked Subjects */}
                      <td className="py-4 px-6">
                        {course.subjects && course.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {course.subjects.map((sub) => (
                              <span
                                key={sub.id}
                                className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded font-mono"
                                title={sub.name}
                              >
                                {sub.code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <button
                          disabled={!isWritable}
                          onClick={() => handleToggleStatus(course)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                            course.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100/50'
                              : 'bg-red-50 text-red-800 border-red-100 hover:bg-red-100/50'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              course.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span>{course.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link to={`/courses/${course.uuid}`} title="View Details">
                            <Button variant="ghost" size="sm" className="p-1.5 text-gray-500 hover:text-gray-900">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {isWritable && (
                            <>
                              <Link to={`/courses/${course.uuid}/edit`} title="Edit Record">
                                <Button variant="ghost" size="sm" className="p-1.5 text-gray-500 hover:text-primary">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 text-gray-500 hover:text-red-600"
                                onClick={() => handleDelete(course.uuid)}
                                title="Delete Record"
                              >
                                <Trash2 className="h-4 w-4" />
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-500">
                Showing {courses.length} of {total} courses (Page {page} of {totalPages})
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  leftIcon={ChevronLeft}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  leftIcon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
