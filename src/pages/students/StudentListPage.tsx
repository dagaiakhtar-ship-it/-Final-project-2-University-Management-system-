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
  Phone,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Download,
  BookOpen,
  Calendar,
  Layers,
  MapPin,
  CreditCard
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
  semesterNumber: number;
}

interface Section {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface Student {
  id: number;
  uuid: string;
  registrationNumber: string;
  rollNumber: string;
  idCardNumber: string | null;
  userId: number;
  fullName: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'APPLIED' | 'WITHDRAWN' | 'ALUMNI';
  enrollmentStatus: string | null;
  admissionSession: string | null;
  scholarshipStatus: string | null;
  hostelStatus: string | null;
  transportStatus: string | null;
  mobileNumber: string | null;
  email: string | null;
  
  user: UserProfile;
  department: Department;
  program: Program;
  semester: Semester;
  section: Section | null;
  academicYear: AcademicYear;
}

export const StudentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Student states
  const [students, setStudents] = useState<Student[]>([]);
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
  const [departmentIdFilter, setDepartmentIdFilter] = useState('');
  const [programIdFilter, setProgramIdFilter] = useState('');
  const [semesterIdFilter, setSemesterIdFilter] = useState('');
  const [sectionIdFilter, setSectionIdFilter] = useState('');
  const [scholarshipFilter, setScholarshipFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [transportFilter, setTransportFilter] = useState('');
  const [admissionSessionFilter, setAdmissionSessionFilter] = useState('');

  // Lookup data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Inline status update active dropdowns
  const [activeStatusDropdown, setActiveStatusDropdown] = useState<string | null>(null);

  // Fetch Lookups
  const fetchLookups = async () => {
    try {
      const response = await apiClient.get('/students/lookup-options');
      if (response.data?.status === 'success') {
        const { departments, programs, semesters, sections } = response.data.data;
        setDepartments(departments || []);
        setPrograms(programs || []);
        setSemesters(semesters || []);
        setSections(sections || []);
      }
    } catch (error) {
      console.error('Error fetching lookups:', error);
    }
  };

  // Fetch Students list
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: search || undefined,
        status: statusFilter || undefined,
        departmentId: departmentIdFilter || undefined,
        programId: programIdFilter || undefined,
        semesterId: semesterIdFilter || undefined,
        sectionId: sectionIdFilter || undefined,
        scholarshipStatus: scholarshipFilter || undefined,
        hostelStatus: hostelFilter || undefined,
        transportStatus: transportFilter || undefined,
        admissionSession: admissionSessionFilter || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      };

      const response = await apiClient.get('/students', { params });
      if (response.data?.status === 'success') {
        setStudents(response.data.data.students);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'STUDENT' || user?.role === 'PARENT') {
      toast.error('You do not have permission to view the student directory.');
      navigate(ROUTES.DASHBOARD);
      return;
    }
    fetchLookups();
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role !== 'STUDENT' && user?.role !== 'PARENT') {
      fetchStudents();
    }
  }, [
    page,
    statusFilter,
    departmentIdFilter,
    programIdFilter,
    semesterIdFilter,
    sectionIdFilter,
    scholarshipFilter,
    hostelFilter,
    transportFilter,
    admissionSessionFilter,
    sortBy,
    sortOrder,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDepartmentIdFilter('');
    setProgramIdFilter('');
    setSemesterIdFilter('');
    setSectionIdFilter('');
    setScholarshipFilter('');
    setHostelFilter('');
    setTransportFilter('');
    setAdmissionSessionFilter('');
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

  const handleStatusChange = async (studentUuid: string, newStatus: string) => {
    try {
      const response = await apiClient.patch(`/students/${studentUuid}/status`, { status: newStatus });
      if (response.data?.status === 'success') {
        toast.success(`Status updated to ${newStatus}`);
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActiveStatusDropdown(null);
    }
  };

  const handleDelete = async (studentUuid: string) => {
    if (!window.confirm('Are you sure you want to soft-delete this student profile?')) {
      return;
    }

    try {
      await apiClient.delete(`/students/${studentUuid}`);
      toast.success('Student profile deleted successfully');
      fetchStudents();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student profile');
    }
  };

  const exportCSV = () => {
    if (students.length === 0) {
      toast.error('No students to export');
      return;
    }
    const headers = [
      'Registration Number',
      'Roll Number',
      'Full Name',
      'User Full Name',
      'Department',
      'Program',
      'Semester',
      'Section',
      'Status',
      'Session',
      'Mobile',
      'Scholarship',
      'Hostel',
      'Transport'
    ];

    const rows = students.map((s) => [
      s.registrationNumber,
      s.rollNumber,
      s.fullName || `${s.user.firstName} ${s.user.lastName}`,
      `${s.user.firstName} ${s.user.lastName}`,
      s.department.code,
      s.program.code,
      s.semester.name,
      s.section?.name || 'N/A',
      s.status,
      s.admissionSession || 'N/A',
      s.mobileNumber || 'N/A',
      s.scholarshipStatus || 'No',
      s.hostelStatus || 'No',
      s.transportStatus || 'No'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Export initiated successfully!');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INACTIVE':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'SUSPENDED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'GRADUATED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'APPLIED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'WITHDRAWN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ALUMNI':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Filter lists based on cascaded options
  const filteredPrograms = departmentIdFilter
    ? programs.filter((p: any) => p.departmentId === parseInt(departmentIdFilter, 10))
    : programs;

  const filteredSemesters = programIdFilter
    ? semesters.filter((s: any) => s.programId === parseInt(programIdFilter, 10))
    : semesters;

  return (
    <PageContainer title="Student Directory" description="Manage comprehensive academic and personal records of all enrolled students.">
      <div className="flex flex-col space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-slate-500">
              Total Enrolled Students: <span className="text-slate-800 font-bold">{total}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              id="export-btn"
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="flex items-center space-x-2 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>

            <Button
              id="toggle-filters-btn"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 ${
                showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </Button>

            {isWritable && (
              <Link to="/students/create">
                <Button id="create-student-btn" variant="primary" size="sm" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Student</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filter bar */}
        <Card id="student-filters-card" className="p-4 border-slate-100">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="student-search"
                  type="text"
                  placeholder="Search students by Roll Number, Registration Number, full name, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <Button id="search-submit-btn" type="submit" variant="primary" size="sm" className="px-5">
                  Search
                </Button>
                <Button
                  id="reset-filters-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Reset all filters"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                {/* Department filter */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Department</label>
                  <select
                    id="filter-dept"
                    value={departmentIdFilter}
                    onChange={(e) => {
                      setDepartmentIdFilter(e.target.value);
                      setProgramIdFilter('');
                      setSemesterIdFilter('');
                      setPage(1);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Program filter */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Program</label>
                  <select
                    id="filter-prog"
                    value={programIdFilter}
                    onChange={(e) => {
                      setProgramIdFilter(e.target.value);
                      setSemesterIdFilter('');
                      setPage(1);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">All Programs</option>
                    {filteredPrograms.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester filter */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Semester</label>
                  <select
                    id="filter-semester"
                    value={semesterIdFilter}
                    onChange={(e) => {
                      setSemesterIdFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">All Semesters</option>
                    {filteredSemesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section filter */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Section</label>
                  <select
                    id="filter-section"
                    value={sectionIdFilter}
                    onChange={(e) => {
                      setSectionIdFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">All Sections</option>
                    {sections.map((sect) => (
                      <option key={sect.id} value={sect.id}>
                        {sect.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Status</label>
                  <select
                    id="filter-status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="GRADUATED">Graduated</option>
                    <option value="APPLIED">Applied</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                    <option value="ALUMNI">Alumni</option>
                  </select>
                </div>

                {/* Facility / Scholarship Filter */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Scholarship Status</label>
                  <select
                    id="filter-scholarship"
                    value={scholarshipFilter}
                    onChange={(e) => {
                      setScholarshipFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">All Students</option>
                    <option value="None">No Scholarship</option>
                    <option value="Need Based">Need Based</option>
                    <option value="Merit Based">Merit Based</option>
                    <option value="HEC Scholarship">HEC Scholarship</option>
                    <option value="Partial Waiver">Partial Waiver</option>
                    <option value="Full Waiver">Full Waiver</option>
                  </select>
                </div>

                {/* Hostel Status */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Hostel Status</label>
                  <select
                    id="filter-hostel"
                    value={hostelFilter}
                    onChange={(e) => {
                      setHostelFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">All Students</option>
                    <option value="No">No Hostel</option>
                    <option value="Yes">Yes (Residing)</option>
                    <option value="Waitlisted">Waitlisted</option>
                  </select>
                </div>

                {/* Transport Status */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Transport Status</label>
                  <select
                    id="filter-transport"
                    value={transportFilter}
                    onChange={(e) => {
                      setTransportFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">All Students</option>
                    <option value="No">No Transport</option>
                    <option value="Yes">Yes (Subscribed)</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        </Card>

        {/* Data Table */}
        <Card id="student-table-card" className="overflow-hidden border-slate-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <span className="text-sm font-medium text-slate-500">Retrieving academic profiles...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="p-3 bg-slate-50 rounded-full text-slate-400 mb-4">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No students found</h3>
              <p className="text-sm text-slate-500 max-w-md mt-1">
                We couldn't find any student matches. Try adjusting your search query, clearing filters, or adding a new student.
              </p>
              {search || statusFilter || departmentIdFilter || programIdFilter ? (
                <Button id="clear-filters-empty-btn" onClick={handleResetFilters} variant="outline" size="sm" className="mt-4 border-slate-200">
                  Clear Filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('registrationNumber')}>
                      <div className="flex items-center space-x-1">
                        <span>Registration No</span>
                        {sortBy === 'registrationNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                    <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('rollNumber')}>
                      <div className="flex items-center space-x-1">
                        <span>Roll No</span>
                        {sortBy === 'rollNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                    <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('firstName')}>
                      <div className="flex items-center space-x-1">
                        <span>Student info</span>
                        {sortBy === 'firstName' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                    <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('departmentName')}>
                      <div className="flex items-center space-x-1">
                        <span>Program & Semester</span>
                        {sortBy === 'departmentName' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Facilities</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {students.map((student) => {
                    const studentName = student.fullName || `${student.user.firstName} ${student.user.lastName}`;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition">
                        {/* Registration Number */}
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-indigo-700">
                          {student.registrationNumber}
                        </td>

                        {/* Roll Number */}
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {student.rollNumber}
                        </td>

                        {/* Student Name and Email */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200">
                              {student.user.avatarUrl ? (
                                <img
                                  src={student.user.avatarUrl}
                                  alt={studentName}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 leading-none">{studentName}</div>
                              <div className="text-xs text-slate-400 mt-1 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {student.user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Academic Track: Program, Semester, Section */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <div className="font-medium text-slate-800 text-xs flex items-center">
                              <GraduationCap className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              {student.program.code} — {student.department.code}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                              <span>Semester: <span className="font-semibold text-slate-700">{student.semester.name}</span></span>
                              <span className="text-slate-200">|</span>
                              <span>Sec: <span className="font-semibold text-slate-700">{student.section?.name || 'Unassigned'}</span></span>
                            </div>
                          </div>
                        </td>

                        {/* Status dropdown/badge */}
                        <td className="py-4 px-6 relative">
                          {isWritable ? (
                            <div>
                              <button
                                id={`status-dropdown-btn-${student.id}`}
                                type="button"
                                onClick={() =>
                                  setActiveStatusDropdown(activeStatusDropdown === student.uuid ? null : student.uuid)
                                }
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full border inline-flex items-center space-x-1 cursor-pointer transition focus:outline-none ${getStatusBadgeClass(
                                  student.status
                                )}`}
                              >
                                <span>{student.status}</span>
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </button>

                              {activeStatusDropdown === student.uuid && (
                                <div className="absolute left-6 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-30 py-1 overflow-hidden">
                                  {['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'APPLIED', 'WITHDRAWN', 'ALUMNI'].map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => handleStatusChange(student.uuid, st)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(student.status)}`}>
                              {student.status}
                            </span>
                          )}
                        </td>

                        {/* Special flags & features */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {student.scholarshipStatus && student.scholarshipStatus !== 'None' && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-semibold px-1.5 py-0.5 rounded" title={`Scholarship: ${student.scholarshipStatus}`}>
                                🎓 Sch
                              </span>
                            )}
                            {student.hostelStatus === 'Yes' && (
                              <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold px-1.5 py-0.5 rounded" title="Hostelite">
                                🏠 Hostel
                              </span>
                            )}
                            {student.transportStatus === 'Yes' && (
                              <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-semibold px-1.5 py-0.5 rounded" title="Transport Subscriber">
                                🚌 Bus
                              </span>
                            )}
                            {(!student.scholarshipStatus || student.scholarshipStatus === 'None') &&
                              student.hostelStatus !== 'Yes' &&
                              student.transportStatus !== 'Yes' && (
                                <span className="text-slate-400 text-xs italic">None</span>
                              )}
                          </div>
                        </td>

                        {/* Operations */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link to={`/students/${student.uuid}`}>
                              <Button
                                id={`view-student-${student.id}`}
                                variant="outline"
                                size="sm"
                                className="p-1.5 border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>

                            {(isWritable || (user?.role === 'STUDENT' && user.id === student.userId)) && (
                              <Link to={`/students/${student.uuid}/edit`}>
                                <Button
                                  id={`edit-student-${student.id}`}
                                  variant="outline"
                                  size="sm"
                                  className="p-1.5 border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                  title="Edit Profile"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}

                            {isWritable && (
                              <Button
                                id={`delete-student-${student.id}`}
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(student.uuid)}
                                className="p-1.5 border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete Profile"
                              >
                                <Trash2 className="h-4 w-4" />
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
          )}

          {/* Pagination Footer */}
          {!loading && students.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Showing <span className="text-slate-800 font-semibold">{students.length}</span> of{' '}
                <span className="text-slate-800 font-semibold">{total}</span> student records
              </span>

              <div className="flex items-center space-x-1">
                <Button
                  id="prev-page-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-1 min-w-[32px] border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <Button
                      id={`page-btn-${pNum}`}
                      key={pNum}
                      variant={page === pNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pNum)}
                      className={`min-w-[32px] h-8 px-2 text-xs font-semibold ${
                        page === pNum
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pNum}
                    </Button>
                  );
                })}

                <Button
                  id="next-page-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-1 min-w-[32px] border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

export default StudentListPage;
