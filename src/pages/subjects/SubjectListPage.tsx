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
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Building,
  GraduationCap,
  Calendar,
  BookOpen,
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
  departmentId: number;
}

interface Semester {
  id: number;
  name: string;
  code: string;
  programId: number;
}

interface Subject {
  id: number;
  uuid: string;
  code: string;
  name: string;
  shortName: string | null;
  creditHours: number;
  theoryHours: number;
  labHours: number;
  subjectType: 'Theory' | 'Lab' | 'Mixed';
  category: 'Core' | 'Elective' | 'General';
  status: 'ACTIVE' | 'INACTIVE';
  description: string | null;
  createdAt: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  program: {
    id: number;
    name: string;
    code: string;
  };
  semester: {
    id: number;
    name: string;
    code: string;
  };
}

export const SubjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [subjectType, setSubjectType] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [programId, setProgramId] = useState<string>('');
  const [semesterId, setSemesterId] = useState<string>('');

  // Dropdown options
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Filtering dropdowns based on dependencies
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>([]);

  // Sorting/Pagination
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);

  // Fetch subjects
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/subjects', {
        params: {
          search: search || undefined,
          status: status || undefined,
          subjectType: subjectType || undefined,
          category: category || undefined,
          departmentId: departmentId || undefined,
          programId: programId || undefined,
          semesterId: semesterId || undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        },
      });

      if (response.data?.status === 'success') {
        setSubjects(response.data.data.subjects);
        setTotal(response.data.data.total);
      }
    } catch (err: any) {
      console.error('Fetch subjects failed:', err);
      toast.error(err.response?.data?.message || 'Could not fetch subject records.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, progRes, semRes] = await Promise.all([
          apiClient.get('/departments?limit=100').catch(() => ({ data: { status: 'success', data: [] } })),
          apiClient.get('/programs?limit=100').catch(() => ({ data: { status: 'success', data: [] } })),
          apiClient.get('/semesters?limit=100').catch(() => ({ data: { status: 'success', data: [] } })),
        ]);

        if (deptRes?.data?.status === 'success') {
          const depts = Array.isArray(deptRes.data.data)
            ? deptRes.data.data
            : deptRes.data.data?.departments || [];
          setDepartments(depts);
        }
        if (progRes?.data?.status === 'success') {
          const progs = Array.isArray(progRes.data.data)
            ? progRes.data.data
            : progRes.data.data?.programs || [];
          setPrograms(progs);
        }
        if (semRes?.data?.status === 'success') {
          const sems = Array.isArray(semRes.data.data)
            ? semRes.data.data
            : semRes.data.data?.semesters || [];
          setSemesters(sems);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Update filtered programs when department selection changes
  useEffect(() => {
    if (departmentId) {
      const filtered = programs.filter(p => p.departmentId === parseInt(departmentId, 10));
      setFilteredPrograms(filtered);
      // Reset dependent selections if they are no longer valid
      setProgramId('');
      setSemesterId('');
    } else {
      setFilteredPrograms(programs);
    }
  }, [departmentId, programs]);

  // Update filtered semesters when program selection changes
  useEffect(() => {
    if (programId) {
      const filtered = semesters.filter(s => s.programId === parseInt(programId, 10));
      setFilteredSemesters(filtered);
      setSemesterId('');
    } else {
      if (departmentId) {
        // Programs in this dept
        const progIds = programs.filter(p => p.departmentId === parseInt(departmentId, 10)).map(p => p.id);
        const filtered = semesters.filter(s => progIds.includes(s.programId));
        setFilteredSemesters(filtered);
      } else {
        setFilteredSemesters(semesters);
      }
    }
  }, [programId, departmentId, semesters, programs]);

  // Fetch triggers
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSubjects();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, status, subjectType, category, departmentId, programId, semesterId, sortBy, sortOrder, page]);

  // Handle Sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setSubjectType('');
    setCategory('');
    setDepartmentId('');
    setProgramId('');
    setSemesterId('');
    setPage(1);
    toast.success('Filters cleared');
  };

  // Toggle subject status
  const handleToggleStatus = async (subject: Subject) => {
    setTogglingStatusId(subject.id);
    const nextStatus = subject.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await apiClient.patch(`/subjects/${subject.uuid}/status`, {
        status: nextStatus,
      });
      if (res.data?.status === 'success') {
        toast.success(`Subject code ${subject.code} is now ${nextStatus}`);
        setSubjects(prev =>
          prev.map(s => (s.id === subject.id ? { ...s, status: nextStatus } : s))
        );
      }
    } catch (err: any) {
      console.error('Status toggle failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update subject status.');
    } finally {
      setTogglingStatusId(null);
      setActiveMenuId(null);
    }
  };

  // Delete Subject
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiClient.delete(`/subjects/${deleteTarget.uuid}`);
      if (res.data?.status === 'success') {
        toast.success(`Subject "${deleteTarget.name}" deleted successfully.`);
        setSubjects(prev => prev.filter(s => s.id !== deleteTarget.id));
        setTotal(prev => prev - 1);
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Could not delete subject.');
    } finally {
      setDeleteTarget(null);
      setActiveMenuId(null);
    }
  };

  // Page index helper
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Subject Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, view, and manage university academic subjects, credit allocations, and constraints.
          </p>
        </div>
        {isWritable && (
          <Link to="/subjects/create">
            <Button id="btn-create-subject" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Subject</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Main Content Area */}
      <Card id="subject-list-card" className="overflow-visible">
        {/* Search, filters toggler, and clear button */}
        <div className="p-4 flex flex-col md:flex-row gap-3 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="subject-search-input"
              type="text"
              placeholder="Search by subject code, name, or short name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              id="btn-toggle-filters"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <span>Filters</span>
              {(status || subjectType || category || departmentId || programId || semesterId) && (
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              )}
            </Button>
            <Button
              id="btn-reset-filters"
              variant="ghost"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900"
              onClick={handleResetFilters}
              disabled={!search && !status && !subjectType && !category && !departmentId && !programId && !semesterId}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Filters Section */}
        {showFilters && (
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300">
            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
              <select
                id="filter-department"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Program */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Program</label>
              <select
                id="filter-program"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={programId}
                onChange={(e) => {
                  setProgramId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Programs</option>
                {filteredPrograms.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Semester</label>
              <select
                id="filter-semester"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={semesterId}
                onChange={(e) => {
                  setSemesterId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Semesters</option>
                {filteredSemesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject Type</label>
              <select
                id="filter-subject-type"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={subjectType}
                onChange={(e) => {
                  setSubjectType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Types</option>
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
              <select
                id="filter-category"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                <option value="Core">Core</option>
                <option value="Elective">Elective</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select
                id="filter-status"
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Subjects Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-400 mt-4 font-medium">Retrieving academic subjects...</span>
            </div>
          ) : subjects.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No subjects found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                We couldn't find any academic subjects matching your search terms or filter constraints. Try widening your criteria.
              </p>
              {(status || subjectType || category || departmentId || programId || semesterId || search) && (
                <Button id="btn-clear-search-empty" variant="outline" size="sm" className="mt-4" onClick={handleResetFilters}>
                  Clear Search Filters
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('code')}>
                    <div className="flex items-center gap-1">
                      <span>Code</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortBy === 'code' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Subject Name</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortBy === 'name' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 hidden lg:table-cell">Details</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('creditHours')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Credits</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortBy === 'creditHours' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 hidden md:table-cell">Type / Category</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-xs">
                        {subject.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{subject.name}</div>
                      {subject.shortName && (
                        <div className="text-xs text-gray-400 font-medium">{subject.shortName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-xs">
                      <div className="flex flex-col gap-1 text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span>{subject.department?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                          <span>{subject.program?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{subject.semester?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-semibold text-gray-900 w-7 h-7 rounded-full bg-indigo-50/60 border border-indigo-100 text-xs">
                        {subject.creditHours}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        ({subject.theoryHours}T + {subject.labHours}L)
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full w-max">
                          {subject.subjectType}
                        </span>
                        <span className="text-[11px] text-gray-500 ml-1 font-medium">
                          {subject.category} Subject
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          subject.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {subject.status === 'ACTIVE' ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{subject.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right overflow-visible relative">
                      <div className="inline-block text-left">
                        <button
                          id={`action-menu-trigger-${subject.id}`}
                          onClick={() => setActiveMenuId(activeMenuId === subject.id ? null : subject.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === subject.id && (
                          <>
                            {/* Overlay to catch clicks and close menu */}
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                            <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-20 focus:outline-none">
                              <div className="py-1">
                                <button
                                  id={`action-view-${subject.id}`}
                                  onClick={() => {
                                    navigate(`/subjects/${subject.uuid}`);
                                    setActiveMenuId(null);
                                  }}
                                  className="group flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                                >
                                  <Eye className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                  View Details
                                </button>
                                {isWritable && (
                                  <>
                                    <button
                                      id={`action-edit-${subject.id}`}
                                      onClick={() => {
                                        navigate(`/subjects/${subject.uuid}/edit`);
                                        setActiveMenuId(null);
                                      }}
                                      className="group flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                                    >
                                      <Edit2 className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                      Edit Subject
                                    </button>
                                    <button
                                      id={`action-status-${subject.id}`}
                                      onClick={() => handleToggleStatus(subject)}
                                      disabled={togglingStatusId === subject.id}
                                      className="group flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                                    >
                                      {subject.status === 'ACTIVE' ? (
                                        <XCircle className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                      ) : (
                                        <CheckCircle className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                      )}
                                      {togglingStatusId === subject.id ? 'Updating...' : `Mark ${subject.status === 'ACTIVE' ? 'Inactive' : 'Active'}`}
                                    </button>
                                  </>
                                )}
                              </div>
                              {isWritable && (
                                <div className="py-1">
                                  <button
                                    id={`action-delete-${subject.id}`}
                                    onClick={() => {
                                      setDeleteTarget(subject);
                                      setActiveMenuId(null);
                                    }}
                                    className="group flex items-center px-4 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left"
                                  >
                                    <Trash2 className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" />
                                    Delete Subject
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
          )}
        </div>

        {/* Pagination Section */}
        {subjects.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-500">
              Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold">{total}</span> subjects
            </span>
            <div className="flex items-center gap-2">
              <Button
                id="btn-prev-page"
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </Button>
              <div className="flex items-center gap-1 px-2 text-xs font-medium">
                <span>Page</span>
                <span className="font-semibold">{page}</span>
                <span>of</span>
                <span className="font-semibold">{totalPages}</span>
              </div>
              <Button
                id="btn-next-page"
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Subject</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete the subject <span className="font-semibold text-gray-800">"{deleteTarget.name}" ({deleteTarget.code})</span>?
              This will remove the record. This action is irreversible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                id="btn-cancel-delete"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                id="btn-confirm-delete"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
