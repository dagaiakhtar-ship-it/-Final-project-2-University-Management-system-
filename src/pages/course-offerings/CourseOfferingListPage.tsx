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
  GraduationCap,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LookupOptions {
  departments: Array<{ id: number; name: string; code: string }>;
  programs: Array<{ id: number; name: string; code: string; departmentId: number }>;
  semesters: Array<{ id: number; name: string; code: string; programId: number }>;
  sections: Array<{ id: number; name: string; code: string; semesterId: number }>;
  subjects: Array<{ id: number; name: string; code: string }>;
  teachers: Array<{
    id: number;
    uuid: string;
    employeeId: string;
    user: { firstName: string; lastName: string };
  }>;
}

interface CourseOffering {
  id: number;
  uuid: string;
  courseCode: string;
  academicYear: string;
  session: string;
  startDate: string;
  endDate: string;
  weeklyLectureHours: number;
  weeklyLabHours: number;
  maxStudents: number;
  currentEnrollment: number;
  status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';
  description: string | null;
  createdAt: string;
  department: { name: string; code: string };
  program: { name: string; code: string };
  semester: { name: string; code: string };
  section: { name: string; code: string };
  subject: { name: string; code: string };
  teacher: {
    employeeId: string;
    user: { firstName: string; lastName: string };
  };
}

export const CourseOfferingListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Offering state
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [session, setSession] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  // Dropdown options lookup
  const [lookups, setLookups] = useState<LookupOptions>({
    departments: [],
    programs: [],
    semesters: [],
    sections: [],
    subjects: [],
    teachers: [],
  });

  // Cascading lists
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);

  // Sorting/Pagination
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseOffering | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  // Fetch Lookups
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const response = await apiClient.get('/course-offerings/lookup-options');
        if (response.data?.status === 'success') {
          setLookups(response.data.data);
        }
      } catch (err) {
        console.error('[CourseOfferingList] Lookup fetch error:', err);
        toast.error('Failed to load filter options');
      }
    };
    fetchLookups();
  }, []);

  // Handle cascading filter changes
  useEffect(() => {
    if (departmentId) {
      setFilteredPrograms(lookups.programs.filter((p) => p.departmentId === parseInt(departmentId, 10)));
    } else {
      setFilteredPrograms(lookups.programs);
    }
    setProgramId('');
    setSemesterId('');
    setSectionId('');
  }, [departmentId, lookups.programs]);

  useEffect(() => {
    if (programId) {
      setFilteredSemesters(lookups.semesters.filter((s) => s.programId === parseInt(programId, 10)));
    } else {
      setFilteredSemesters([]);
    }
    setSemesterId('');
    setSectionId('');
  }, [programId, lookups.semesters]);

  useEffect(() => {
    if (semesterId) {
      setFilteredSections(lookups.sections.filter((s) => s.semesterId === parseInt(semesterId, 10)));
    } else {
      setFilteredSections([]);
    }
    setSectionId('');
  }, [semesterId, lookups.sections]);

  // Fetch Course Offerings list
  const fetchOfferings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/course-offerings', {
        params: {
          search: search || undefined,
          status: status || undefined,
          session: session || undefined,
          academicYear: academicYear || undefined,
          departmentId: departmentId || undefined,
          programId: programId || undefined,
          semesterId: semesterId || undefined,
          sectionId: sectionId || undefined,
          subjectId: subjectId || undefined,
          teacherId: teacherId || undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        },
      });

      if (response.data?.status === 'success') {
        setOfferings(response.data.data.courseOfferings);
        setTotal(response.data.data.total);
      }
    } catch (err) {
      console.error('[CourseOfferingList] Fetch error:', err);
      toast.error('Failed to load course offerings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchOfferings();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, status, session, academicYear, departmentId, programId, semesterId, sectionId, subjectId, teacherId, sortBy, sortOrder, page]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setSession('');
    setAcademicYear('');
    setDepartmentId('');
    setProgramId('');
    setSemesterId('');
    setSectionId('');
    setSubjectId('');
    setTeacherId('');
    setPage(1);
  };

  const handleDelete = async (uuid: string) => {
    try {
      await apiClient.delete(`/course-offerings/${uuid}`);
      toast.success('Course offering deleted successfully');
      setDeleteTarget(null);
      fetchOfferings();
    } catch (err) {
      console.error('[CourseOfferingList] Delete error:', err);
      toast.error('Failed to delete course offering');
    }
  };

  const handleToggleStatus = async (uuid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Cancelled' : 'Active';
    setTogglingStatusId(uuid);
    try {
      await apiClient.patch(`/course-offerings/${uuid}/status`, { status: nextStatus });
      toast.success(`Status updated to ${nextStatus}`);
      fetchOfferings();
    } catch (err) {
      console.error('[CourseOfferingList] Toggle status error:', err);
      toast.error('Failed to update status');
    } finally {
      setTogglingStatusId(null);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Status Badge Helper
  const getStatusBadgeClass = (statusVal: string) => {
    switch (statusVal) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Upcoming':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <PageContainer
      title="Course Offerings"
      description="Manage the pairing of subjects, sections, academic years, and teachers."
      action={
        isWritable && (
          <Button
            id="btn-create-offering"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            onClick={() => navigate('/course-offerings/create')}
          >
            <Plus className="w-4 h-4" />
            <span>Offer Subject</span>
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-6" id="course-offerings-list-layout">
        {/* Search & Filters Toggle Panel */}
        <Card id="course-offerings-filter-card" className="p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="search-offerings"
                type="text"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Search by code, subject name, or teacher name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end">
              <Button
                id="btn-toggle-filters"
                variant="outline"
                className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 text-gray-700"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span>Filters</span>
                {(status || session || academicYear || departmentId || programId || semesterId || sectionId || subjectId || teacherId) && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                )}
              </Button>
              <Button
                id="btn-reset-filters"
                variant="ghost"
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900"
                onClick={handleResetFilters}
                disabled={!search && !status && !session && !academicYear && !departmentId && !programId && !semesterId && !sectionId && !subjectId && !teacherId}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300">
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
                  {lookups.departments.map((dept) => (
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
                  disabled={!programId}
                >
                  <option value="">All Semesters</option>
                  {filteredSemesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Section</label>
                <select
                  id="filter-section"
                  className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={sectionId}
                  onChange={(e) => {
                    setSectionId(e.target.value);
                    setPage(1);
                  }}
                  disabled={!semesterId}
                >
                  <option value="">All Sections</option>
                  {filteredSections.map((sect) => (
                    <option key={sect.id} value={sect.id}>
                      Section {sect.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                <select
                  id="filter-subject"
                  className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Subjects</option>
                  {lookups.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Teacher</label>
                <select
                  id="filter-teacher"
                  className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={teacherId}
                  onChange={(e) => {
                    setTeacherId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Teachers</option>
                  {lookups.teachers.map((teach) => (
                    <option key={teach.id} value={teach.id}>
                      Dr. {teach.user.firstName} {teach.user.lastName} ({teach.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Session */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Session</label>
                <select
                  id="filter-session"
                  className="w-full text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={session}
                  onChange={(e) => {
                    setSession(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Sessions</option>
                  <option value="Spring">Spring</option>
                  <option value="Fall">Fall</option>
                  <option value="Summer">Summer</option>
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
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Offerings Table */}
        <Card id="course-offerings-table-card" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 select-none cursor-pointer" onClick={() => toggleSort('courseCode')}>
                    <div className="flex items-center gap-1.5">
                      <span>Code</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortBy === 'courseCode' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    </div>
                  </th>
                  <th className="py-4 px-6">Subject & Section</th>
                  <th className="py-4 px-6">Teacher</th>
                  <th className="py-4 px-6 select-none cursor-pointer" onClick={() => toggleSort('academicYear')}>
                    <div className="flex items-center gap-1.5">
                      <span>Session/Year</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortBy === 'academicYear' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center">Hours</th>
                  <th className="py-4 px-6 text-center">Enrollment</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading course offerings...</span>
                      </div>
                    </td>
                  </tr>
                ) : offerings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                        <span>No course offerings found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  offerings.map((offering) => (
                    <tr
                      key={offering.uuid}
                      className="hover:bg-gray-50/40 transition-colors"
                      id={`row-offering-${offering.uuid}`}
                    >
                      <td className="py-4 px-6 font-mono font-semibold text-xs text-indigo-600">
                        {offering.courseCode}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-gray-900">{offering.subject.name}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {offering.program.code} — {offering.semester.name} Section {offering.section.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center rounded-full text-xs">
                            {offering.teacher.user?.firstName?.charAt(0) || 'T'}
                          </div>
                          <div className="flex flex-col">
                            <span>Dr. {offering.teacher.user.firstName} {offering.teacher.user.lastName}</span>
                            <span className="text-[10px] text-gray-400 font-mono">ID: {offering.teacher.employeeId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-gray-800">{offering.session}</span>
                          <span className="text-gray-400 font-mono">{offering.academicYear}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-medium text-slate-600">
                        <div className="flex items-center justify-center gap-2 font-mono">
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded" title="Lecture Hours">L: {offering.weeklyLectureHours}h</span>
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded" title="Lab Hours">B: {offering.weeklyLabHours}h</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-xs font-mono font-bold text-gray-800">
                            {offering.currentEnrollment} / {offering.maxStudents}
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100, (offering.currentEnrollment / offering.maxStudents) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded-full border ${getStatusBadgeClass(offering.status)}`}>
                          {offering.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            id={`btn-view-${offering.uuid}`}
                            variant="ghost"
                            size="sm"
                            className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                            onClick={() => navigate(`/course-offerings/${offering.uuid}`)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {isWritable && (
                            <>
                              <Button
                                id={`btn-edit-${offering.uuid}`}
                                variant="ghost"
                                size="sm"
                                className="p-1 text-gray-400 hover:text-emerald-600 rounded"
                                onClick={() => navigate(`/course-offerings/${offering.uuid}/edit`)}
                                title="Edit Pairing"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>

                              <Button
                                id={`btn-toggle-status-${offering.uuid}`}
                                variant="ghost"
                                size="sm"
                                className={`p-1 rounded ${offering.status === 'Active' ? 'text-gray-400 hover:text-amber-600' : 'text-gray-400 hover:text-emerald-600'}`}
                                onClick={() => handleToggleStatus(offering.uuid, offering.status)}
                                disabled={togglingStatusId === offering.uuid}
                                title={offering.status === 'Active' ? 'Cancel' : 'Activate'}
                              >
                                {offering.status === 'Active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </Button>

                              <Button
                                id={`btn-delete-${offering.uuid}`}
                                variant="ghost"
                                size="sm"
                                className="p-1 text-gray-400 hover:text-rose-600 rounded"
                                onClick={() => setDeleteTarget(offering)}
                                title="Delete Offering"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Footer */}
          {!loading && offerings.length > 0 && (
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">
                Showing {offerings.length} of {total} records
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  id="btn-pagination-prev"
                  variant="outline"
                  size="sm"
                  className="p-1 hover:bg-gray-100 disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono font-bold text-gray-700 px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  id="btn-pagination-next"
                  variant="outline"
                  size="sm"
                  className="p-1 hover:bg-gray-100 disabled:opacity-40"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Course Offering?</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Are you sure you want to delete the course offering for <strong className="text-slate-800">{deleteTarget.subject.name}</strong> scheduled for <span className="font-mono text-slate-700">{deleteTarget.semester.name} Section {deleteTarget.section.name}</span>?
                This action is reversible but will detach the course teacher assignment.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  id="btn-delete-cancel"
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  id="btn-delete-confirm"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
                  onClick={() => handleDelete(deleteTarget.uuid)}
                >
                  Delete Offering
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default CourseOfferingListPage;
