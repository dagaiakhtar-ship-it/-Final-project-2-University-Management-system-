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
  Check,
  X,
  Download,
  AlertCircle,
  GraduationCap,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LookupOptions {
  departments: Array<{ id: number; name: string; code: string }>;
  programs: Array<{ id: number; name: string; code: string; departmentId: number }>;
  semesters: Array<{ id: number; name: string; code: string; programId: number }>;
  sections: Array<{ id: number; name: string; code: string; semesterId: number }>;
  courseOfferings: Array<{ id: number; courseCode: string; session: string; academicYear: string; subject: { name: string } }>;
  students: Array<{ id: number; rollNumber: string; fullName: string }>;
}

interface Enrollment {
  id: number;
  uuid: string;
  enrollmentNumber: string;
  studentId: number;
  courseOfferingId: number;
  academicYear: string;
  session: string;
  enrollmentDate: string;
  status: 'Pending' | 'Approved' | 'Enrolled' | 'Dropped' | 'Withdrawn' | 'Completed';
  enrollmentType: 'Regular' | 'Repeat' | 'Improvement' | 'Audit';
  creditsRegistered: number;
  tuitionStatus: 'Pending' | 'Paid' | 'Scholarship';
  advisorApproval: boolean;
  registrarApproval: boolean;
  remarks: string | null;
  student: {
    id: number;
    fullName: string;
    rollNumber: string;
    registrationNumber: string;
    user: { email: string };
    department: { name: string; code: string };
    program: { name: string; code: string };
    semester: { name: string; code: string };
    section: { name: string; code: string } | null;
  };
  courseOffering: {
    id: number;
    courseCode: string;
    subject: { name: string; code: string };
    teacher: { user: { firstName: string; lastName: string } };
  };
}

export const EnrollmentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  // State
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Stats Counters
  const [stats, setStats] = useState({
    totalCount: 0,
    pending: 0,
    approved: 0,
    credits: 0,
  });

  // Table parameters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [progFilter, setProgFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [secFilter, setSecFilter] = useState('');
  const [offeringFilter, setOfferingFilter] = useState('');

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Cascade dropdown lookups
  const [lookups, setLookups] = useState<LookupOptions>({
    departments: [],
    programs: [],
    semesters: [],
    sections: [],
    courseOfferings: [],
    students: [],
  });

  // Fetch cascades and lookups
  const fetchLookups = async () => {
    try {
      const [deptRes, progRes, semRes, secRes, coRes, studRes] = await Promise.all([
        apiClient.get('/departments').catch(() => ({ data: { data: [] } })),
        apiClient.get('/programs').catch(() => ({ data: { data: [] } })),
        apiClient.get('/semesters').catch(() => ({ data: { data: [] } })),
        apiClient.get('/sections').catch(() => ({ data: { data: [] } })),
        apiClient.get('/course-offerings').catch(() => ({ data: { data: [] } })),
        user?.role !== 'STUDENT'
          ? apiClient.get('/students').catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);

      setLookups({
        departments: deptRes.data?.data || [],
        programs: progRes.data?.data || [],
        semesters: semRes.data?.data || [],
        sections: secRes.data?.data || [],
        courseOfferings: coRes.data?.data || [],
        students: studRes.data?.data || [],
      });
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        enrollmentType: typeFilter || undefined,
        session: sessionFilter || undefined,
        academicYear: academicYearFilter || undefined,
        departmentId: deptFilter || undefined,
        programId: progFilter || undefined,
        semesterId: semFilter || undefined,
        sectionId: secFilter || undefined,
        courseOfferingId: offeringFilter || undefined,
        sortBy,
        sortOrder,
      };

      const response = await apiClient.get('/enrollments', { params });
      if (response.data?.status === 'success') {
        const dataList = response.data.data || [];
        setEnrollments(dataList);
        setTotal(response.data.total || 0);

        // Derive statistics locally based on list or separate count
        const pending = dataList.filter((e: any) => e.status === 'Pending').length;
        const approved = dataList.filter((e: any) => e.status === 'Approved' || e.status === 'Enrolled').length;
        const totalCredits = dataList.reduce((sum: number, e: any) => sum + e.creditsRegistered, 0);

        setStats({
          totalCount: response.data.total || 0,
          pending,
          approved,
          credits: totalCredits,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch enrollments', error);
      toast.error(error.response?.data?.message || 'Failed to retrieve enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [
    page,
    statusFilter,
    typeFilter,
    sessionFilter,
    academicYearFilter,
    deptFilter,
    progFilter,
    semFilter,
    secFilter,
    offeringFilter,
    sortBy,
    sortOrder,
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setSessionFilter('');
    setAcademicYearFilter('');
    setDeptFilter('');
    setProgFilter('');
    setSemFilter('');
    setSecFilter('');
    setOfferingFilter('');
    setPage(1);
    toast.success('Filters cleared successfully');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEnrollments();
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await apiClient.patch(`/enrollments/${id}/status`, { status: newStatus });
      if (res.data?.status === 'success') {
        toast.success(`Enrollment status updated to ${newStatus}`);
        fetchEnrollments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this enrollment record?')) return;
    try {
      const res = await apiClient.delete(`/enrollments/${id}`);
      if (res.data?.status === 'success') {
        toast.success('Enrollment deleted successfully');
        fetchEnrollments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete enrollment');
    }
  };

  const handleExportCSV = () => {
    if (enrollments.length === 0) {
      toast.error('No enrollment records to export.');
      return;
    }

    const headers = [
      'Enrollment Number',
      'Student Roll No',
      'Student Name',
      'Department',
      'Program',
      'Course Code',
      'Subject',
      'Session',
      'Academic Year',
      'Credits',
      'Type',
      'Tuition Status',
      'Status'
    ];

    const rows = enrollments.map((e) => [
      e.enrollmentNumber,
      e.student?.rollNumber || '',
      e.student?.fullName || '',
      e.student?.department?.code || '',
      e.student?.program?.code || '',
      e.courseOffering?.courseCode || '',
      e.courseOffering?.subject?.name || '',
      e.session,
      e.academicYear,
      e.creditsRegistered,
      e.enrollmentType,
      e.tuitionStatus,
      e.status
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Enrollments_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully');
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Status badges classes helper
  const getStatusBadge = (status: string) => {
    const base = 'px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5';
    switch (status) {
      case 'Approved':
      case 'Enrolled':
        return `${base} bg-green-50 text-green-700 border border-green-200`;
      case 'Pending':
        return `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
      case 'Dropped':
      case 'Withdrawn':
        return `${base} bg-red-50 text-red-700 border border-red-200`;
      case 'Completed':
        return `${base} bg-blue-50 text-blue-700 border border-blue-200`;
      default:
        return `${base} bg-gray-50 text-gray-700 border border-gray-200`;
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Enrollments</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStudent ? 'View and register your academic semesters and course selections.' : 'Manage student course registration pipelines and credit limits.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          {(isWritable || isStudent) && (
            <Link to={ROUTES.ENROLLMENTS_CREATE}>
              <Button size="sm" className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> {isStudent ? 'Register Course' : 'Create Enrollment'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Total Registrations</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{stats.totalCount}</span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Pending Actions</span>
            <span className="text-2xl font-bold text-yellow-600 mt-1 block">{stats.pending}</span>
          </div>
          <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Approved / Active</span>
            <span className="text-2xl font-bold text-green-600 mt-1 block">{stats.approved}</span>
          </div>
          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Total Enrolled Credits</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{stats.credits} CH</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filters and Search panel */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name, roll number, registration, or email..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm">Search</Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} title="Reset">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Academic Year</label>
                <select
                  value={academicYearFilter}
                  onChange={(e) => { setAcademicYearFilter(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Years</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Session</label>
                <select
                  value={sessionFilter}
                  onChange={(e) => { setSessionFilter(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Sessions</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Enrollment Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Dropped">Dropped</option>
                  <option value="Withdrawn">Withdrawn</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Enrollment Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="Regular">Regular</option>
                  <option value="Repeat">Repeat</option>
                  <option value="Improvement">Improvement</option>
                  <option value="Audit">Audit</option>
                </select>
              </div>

              {/* Cascade Options */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Departments</option>
                  {lookups.departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Program</label>
                <select
                  value={progFilter}
                  onChange={(e) => { setProgFilter(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Programs</option>
                  {lookups.programs
                    .filter((p) => !deptFilter || p.departmentId === parseInt(deptFilter, 10))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Semester</label>
                <select
                  value={semFilter}
                  onChange={(e) => { setSemFilter(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Semesters</option>
                  {lookups.semesters
                    .filter((s) => !progFilter || s.programId === parseInt(progFilter, 10))
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Section</label>
                <select
                  value={secFilter}
                  onChange={(e) => { setSecFilter(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Sections</option>
                  {lookups.sections
                    .filter((sec) => !semFilter || sec.semesterId === parseInt(semFilter, 10))
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </form>
      </Card>

      {/* Main Table Grid */}
      <Card className="overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
              <p className="text-sm text-gray-500">Loading enrollment records...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No Enrollments Found</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                There are no matches for your current selection parameters. Try modifying your queries.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleResetFilters}>Reset Filters</Button>
                {(isWritable || isStudent) && (
                  <Link to={ROUTES.ENROLLMENTS_CREATE}>
                    <Button size="sm" variant="primary">Add New Record</Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <th className="p-4 cursor-pointer" onClick={() => toggleSort('enrollmentNumber')}>Enrollment No</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Course Details</th>
                  <th className="p-4">Period</th>
                  <th className="p-4 text-center">Credits</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-mono text-xs font-semibold text-gray-900">{e.enrollmentNumber}</td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-gray-900">{e.student?.fullName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Roll No: {e.student?.rollNumber}</div>
                        <div className="text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md inline-block mt-1">
                          {e.student?.department?.code} &bull; {e.student?.program?.code}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900">{e.courseOffering?.subject?.name}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">{e.courseOffering?.courseCode}</div>
                        <div className="text-xs text-gray-400 mt-1">Teacher: {e.courseOffering?.teacher?.user?.firstName} {e.courseOffering?.teacher?.user?.lastName}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs">
                        <div className="font-semibold text-gray-700">{e.session}</div>
                        <div className="text-gray-400 mt-0.5">{e.academicYear}</div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold text-gray-900">{e.creditsRegistered} CH</td>
                    <td className="p-4 text-xs font-medium text-gray-600">
                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                        {e.enrollmentType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={getStatusBadge(e.status)}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`${ROUTES.ENROLLMENTS}/${e.uuid}`} title="View Details">
                          <Button variant="outline" size="sm" className="p-1.5 text-gray-600 hover:text-indigo-600">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>

                        {/* Edit Access Guard */}
                        {(isWritable || (isStudent && e.status === 'Pending')) && (
                          <Link to={`${ROUTES.ENROLLMENTS}/${e.id}/edit`} title="Edit">
                            <Button variant="outline" size="sm" className="p-1.5 text-gray-600 hover:text-green-600">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}

                        {/* Admin Action Approvals */}
                        {isWritable && e.status === 'Pending' && (
                          <>
                            <Button
                              onClick={() => handleStatusChange(e.id, 'Approved')}
                              variant="outline"
                              size="sm"
                              className="p-1.5 text-green-600 hover:bg-green-50"
                              title="Approve Enrollment"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleStatusChange(e.id, 'Dropped')}
                              variant="outline"
                              size="sm"
                              className="p-1.5 text-red-600 hover:bg-red-50"
                              title="Decline/Drop"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {/* Delete / Drop Access Guard */}
                        {(isWritable || (isStudent && e.status === 'Pending')) && (
                          <Button
                            onClick={() => handleDelete(e.id)}
                            variant="outline"
                            size="sm"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete/Drop Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {!loading && total > limit && (
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between text-xs font-semibold text-gray-700">
            <div>
              Showing <span className="font-bold text-gray-900">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-bold text-gray-900">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-bold text-gray-900">{total}</span> records
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="inline-flex items-center"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
                className="inline-flex items-center"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
