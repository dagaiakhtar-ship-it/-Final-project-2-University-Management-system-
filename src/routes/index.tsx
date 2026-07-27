/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.constants';

// Layouts
import { PublicLayout } from '../components/layout/PublicLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ProtectedLayout } from '../components/layout/ProtectedLayout';
import { MainLayout } from '../components/layout/MainLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Guards
import { RoleGuard } from '../components/common/RoleGuard';

// Pages
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { RegisterSuccessPage } from '../pages/RegisterSuccessPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Dashboard Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { SuperAdminDashboard } from '../pages/dashboard/SuperAdminDashboard';
import { AdminDashboard } from '../pages/dashboard/AdminDashboard';
import { TeacherDashboard } from '../pages/dashboard/TeacherDashboard';
import { StudentDashboard } from '../pages/dashboard/StudentDashboard';
import { ParentDashboard } from '../pages/dashboard/ParentDashboard';

// User Management Pages
import { UserListPage, UserCreatePage, UserDetailPage, UserEditPage } from '../pages/users';

// Settings Page
import { SettingsPage } from '../pages/settings';

// Reports Page
import { ReportsPage } from '../pages/reports';

// Parent Pages
import { ParentListPage, ParentCreatePage, ParentDetailPage, ParentEditPage } from '../pages/parents';

// Department Pages (Step 13)
import { DepartmentListPage } from '../pages/departments/DepartmentListPage';
import { DepartmentCreatePage } from '../pages/departments/DepartmentCreatePage';
import { DepartmentEditPage } from '../pages/departments/DepartmentEditPage';
import { DepartmentDetailPage } from '../pages/departments/DepartmentDetailPage';

// Program Pages (Step 15)
import { ProgramListPage } from '../pages/programs/ProgramListPage';
import { ProgramCreatePage } from '../pages/programs/ProgramCreatePage';
import { ProgramEditPage } from '../pages/programs/ProgramEditPage';
import { ProgramDetailPage } from '../pages/programs/ProgramDetailPage';

// Semester Pages (Step 17)
import { SemesterListPage } from '../pages/semesters/SemesterListPage';
import { SemesterCreatePage } from '../pages/semesters/SemesterCreatePage';
import { SemesterEditPage } from '../pages/semesters/SemesterEditPage';
import { SemesterDetailPage } from '../pages/semesters/SemesterDetailPage';

// Section Pages (Step 19)
import { SectionListPage } from '../pages/sections/SectionListPage';
import { SectionCreatePage } from '../pages/sections/SectionCreatePage';
import { SectionEditPage } from '../pages/sections/SectionEditPage';
import { SectionDetailPage } from '../pages/sections/SectionDetailPage';

// Subject Pages (Step 21)
import { SubjectListPage } from '../pages/subjects/SubjectListPage';
import { SubjectCreatePage } from '../pages/subjects/SubjectCreatePage';
import { SubjectEditPage } from '../pages/subjects/SubjectEditPage';
import { SubjectDetailPage } from '../pages/subjects/SubjectDetailPage';

// Course Offering Pages (Step 23)
import { CourseOfferingListPage } from '../pages/course-offerings/CourseOfferingListPage';
import { CourseOfferingCreatePage } from '../pages/course-offerings/CourseOfferingCreatePage';
import { CourseOfferingEditPage } from '../pages/course-offerings/CourseOfferingEditPage';
import { CourseOfferingDetailPage } from '../pages/course-offerings/CourseOfferingDetailPage';

// Teacher Pages (Step 25)
import { TeacherListPage } from '../pages/teachers/TeacherListPage';
import { TeacherCreatePage } from '../pages/teachers/TeacherCreatePage';
import { TeacherEditPage } from '../pages/teachers/TeacherEditPage';
import { TeacherDetailPage } from '../pages/teachers/TeacherDetailPage';

// Student Pages (Step 27)
import { StudentListPage } from '../pages/students/StudentListPage';
import { StudentCreatePage } from '../pages/students/StudentCreatePage';
import { StudentEditPage } from '../pages/students/StudentEditPage';
import { StudentDetailPage } from '../pages/students/StudentDetailPage';

// Enrollment Pages (Step 29)
import { EnrollmentListPage } from '../pages/enrollments/EnrollmentListPage';
import { EnrollmentCreatePage } from '../pages/enrollments/EnrollmentCreatePage';
import { EnrollmentEditPage } from '../pages/enrollments/EnrollmentEditPage';
import { EnrollmentDetailPage } from '../pages/enrollments/EnrollmentDetailPage';

// Timetable Pages (Step 31)
import { TimetableDashboardPage } from '../pages/timetable/TimetableDashboardPage';
import { TimetableCreatePage } from '../pages/timetable/TimetableCreatePage';
import { TimetableEditPage } from '../pages/timetable/TimetableEditPage';
import { TimetableDetailPage } from '../pages/timetable/TimetableDetailPage';

// Attendance Pages (Step 33)
import { AttendanceDashboardPage } from '../pages/attendance/AttendanceDashboardPage';
import { AttendanceSessionPage } from '../pages/attendance/AttendanceSessionPage';

// Leave Pages (Step 35)
import { LeaveDashboardPage } from '../pages/leaves/LeaveDashboardPage';
import { CreateLeavePage } from '../pages/leaves/CreateLeavePage';
import { LeaveDetailsPage } from '../pages/leaves/LeaveDetailsPage';

// Assignment Pages (Step 37)
import { AssignmentDashboardPage } from '../pages/assignments/AssignmentDashboardPage';

// Quiz Pages (Step 39)
import { QuizDashboardPage } from '../pages/quizzes/QuizDashboardPage';

// Exam Pages (Step 41)
import { ExamDashboardPage } from '../pages/exams/ExamDashboardPage';

// Result Pages (Step 43)
import { ResultDashboardPage } from '../pages/results/ResultDashboardPage';

// Transcript Pages (Step 45)
import { TranscriptDashboardPage } from '../pages/transcripts/TranscriptDashboardPage';
import { VerifyTranscriptPage } from '../pages/transcripts/VerifyTranscriptPage';

// Degree Audit Page (Step 47)
import { DegreeAuditPage } from '../pages/degree-audit/DegreeAuditPage';

// Alumni Page (Step 49)
import { AlumniPage } from '../pages/alumni/AlumniPage';

// Notifications Page
import { NotificationsPage } from '../pages/notifications/NotificationsPage';

// Placement Page (Step 51)
import { PlacementPage } from '../pages/placement/PlacementPage';

// Hostel & Accommodation Page (Step 53)
import { HostelPage } from '../pages/hostel/HostelPage';

// Transport Management Page (Step 55)
import { TransportPage } from '../pages/transport/TransportPage';

// Library Management Page (Step 57)
import { LibraryPage } from '../pages/library/LibraryPage';

// Finance & Fee Management Page (Step 59)
import { FeesPage } from '../pages/fees/FeesPage';

// Procurement Page (Step 63)
import { ProcurementPage } from '../pages/procurement/ProcurementPage';

// Facilities Page (Step 65)
import { FacilitiesPage } from '../pages/facilities/FacilitiesPage';

// Research Page (Step 67)
import { ResearchPage } from '../pages/research/ResearchPage';

// Accreditation & QA Management Page (Step 69)
import { AccreditationPage } from '../pages/accreditation/AccreditationPage';
import { CmsDashboardPage } from '../pages/cms/CmsDashboardPage';
import { AIPage } from '../pages/ai/AIPage';
import { ApiGatewayPage } from '../pages/api-gateway/ApiGatewayPage';
import { DevopsPage } from '../pages/devops/DevopsPage';
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';
import { MultitenantPage } from '../pages/multitenant/MultitenantPage';
import { WorkflowPage } from '../pages/workflow/WorkflowPage';
import { WorkflowDesignerPage } from '../pages/workflow/WorkflowDesignerPage';
import { SearchPage } from '../pages/search/SearchPage';
import { GRCPage } from '../pages/grc/GRCPage';
import { MdmPage } from '../pages/mdm/MdmPage';

// Course Management Pages
import { CourseListPage } from '../pages/courses/CourseListPage';
import { CourseCreatePage } from '../pages/courses/CourseCreatePage';
import { CourseDetailPage } from '../pages/courses/CourseDetailPage';
import { CourseEditPage } from '../pages/courses/CourseEditPage';






export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public / General Main Routes */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.REGISTER_SUCCESS} element={<RegisterSuccessPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
      </Route>

      {/* Public Informational Fallbacks */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.TRANSCRIPTS_VERIFY} element={<VerifyTranscriptPage />} />
      </Route>

      {/* Protected Routes Block */}
      <Route element={<ProtectedLayout />}>
        <Route element={<DashboardLayout />}>
          {/* 1. Universal Adaptive Landing Dashboard */}
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

          {/* Department Management Module (Step 13) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.DEPARTMENTS} element={<DepartmentListPage />} />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/departments/create" element={<DepartmentCreatePage />} />
            <Route path="/departments/:id/edit" element={<DepartmentEditPage />} />
          </Route>

          {/* Program Management Module (Step 15) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.PROGRAMS} element={<ProgramListPage />} />
            <Route path="/programs/:id" element={<ProgramDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/programs/create" element={<ProgramCreatePage />} />
            <Route path="/programs/:id/edit" element={<ProgramEditPage />} />
          </Route>

          {/* Semester Management Module (Step 17) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.SEMESTERS} element={<SemesterListPage />} />
            <Route path="/semesters/:id" element={<SemesterDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/semesters/create" element={<SemesterCreatePage />} />
            <Route path="/semesters/:id/edit" element={<SemesterEditPage />} />
          </Route>

          {/* Section Management Module (Step 19) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.SECTIONS} element={<SectionListPage />} />
            <Route path="/sections/:id" element={<SectionDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/sections/create" element={<SectionCreatePage />} />
            <Route path="/sections/:id/edit" element={<SectionEditPage />} />
          </Route>

          {/* Subject Management Module (Step 21) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.SUBJECTS} element={<SubjectListPage />} />
            <Route path="/subjects/:id" element={<SubjectDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/subjects/create" element={<SubjectCreatePage />} />
            <Route path="/subjects/:id/edit" element={<SubjectEditPage />} />
          </Route>

          {/* Course Management Module */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.COURSES} element={<CourseListPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/courses/create" element={<CourseCreatePage />} />
            <Route path="/courses/:id/edit" element={<CourseEditPage />} />
          </Route>

          {/* Course Offering Management Module (Step 23) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} />}>
            <Route path={ROUTES.COURSE_OFFERINGS} element={<CourseOfferingListPage />} />
            <Route path="/course-offerings/:id" element={<CourseOfferingDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/course-offerings/create" element={<CourseOfferingCreatePage />} />
            <Route path="/course-offerings/:id/edit" element={<CourseOfferingEditPage />} />
          </Route>

          {/* Teacher Management Module (Step 25) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} />}>
            <Route path={ROUTES.TEACHERS} element={<TeacherListPage />} />
            <Route path="/teachers/:id" element={<TeacherDetailPage />} />
            <Route path="/teachers/:id/edit" element={<TeacherEditPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/teachers/create" element={<TeacherCreatePage />} />
          </Route>

          {/* Student Management Module (Step 27) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.STUDENTS} element={<StudentListPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/students/:id/edit" element={<StudentEditPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/students/create" element={<StudentCreatePage />} />
          </Route>

          {/* Enrollment Management Module (Step 29) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.ENROLLMENTS} element={<EnrollmentListPage />} />
            <Route path="/enrollments/:id" element={<EnrollmentDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'STUDENT']} />}>
            <Route path={ROUTES.ENROLLMENTS_CREATE} element={<EnrollmentCreatePage />} />
            <Route path="/enrollments/:id/edit" element={<EnrollmentEditPage />} />
          </Route>

          {/* Timetable Management Module (Step 31) */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']} />}>
            <Route path={ROUTES.TIMETABLE} element={<TimetableDashboardPage />} />
            <Route path="/timetable/:id" element={<TimetableDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/timetable/create" element={<TimetableCreatePage />} />
            <Route path="/timetable/:id/edit" element={<TimetableEditPage />} />
          </Route>

          {/* User Management Routes */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path={ROUTES.USERS} element={<UserListPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="/users/create" element={<UserCreatePage />} />
            <Route path="/users/:id/edit" element={<UserEditPage />} />
          </Route>

          {/* Settings Route */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>

          {/* Reports Route */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} />}>
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          </Route>

          {/* Parent Management Routes */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT']} />}>
            <Route path={ROUTES.PARENTS} element={<ParentListPage />} />
            <Route path="/parents/:id" element={<ParentDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/parents/create" element={<ParentCreatePage />} />
            <Route path="/parents/:id/edit" element={<ParentEditPage />} />
          </Route>

          {/* 2. Role-Specific Protected Dashboards */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
            <Route path={ROUTES.DASHBOARD_SUPER_ADMIN} element={<SuperAdminDashboard />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
            <Route path={ROUTES.DASHBOARD_ADMIN} element={<AdminDashboard />} />
            <Route path={ROUTES.CMS} element={<CmsDashboardPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['TEACHER', 'SUPER_ADMIN']} />}>
            <Route path={ROUTES.DASHBOARD_TEACHER} element={<TeacherDashboard />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['STUDENT', 'SUPER_ADMIN']} />}>
            <Route path={ROUTES.DASHBOARD_STUDENT} element={<StudentDashboard />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['PARENT', 'SUPER_ADMIN']} />}>
            <Route path={ROUTES.DASHBOARD_PARENT} element={<ParentDashboard />} />
          </Route>

          {/* 3. Auxiliary Shared Academic Modules */}
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HOSTEL_WARDEN', 'SECURITY_STAFF']} />}>
            <Route path={ROUTES.ATTENDANCE} element={<AttendanceDashboardPage />} />
            <Route path="/attendance/session/:id" element={<AttendanceSessionPage />} />
            <Route path={ROUTES.LEAVES} element={<LeaveDashboardPage />} />
            <Route path={ROUTES.LEAVES_CREATE} element={<CreateLeavePage />} />
            <Route path="/leaves/:id" element={<LeaveDetailsPage />} />
            <Route path={ROUTES.RESULTS} element={<ResultDashboardPage />} />
            <Route path={ROUTES.TRANSCRIPTS} element={<TranscriptDashboardPage />} />
            <Route path={ROUTES.DEGREE_AUDIT} element={<DegreeAuditPage />} />
            <Route path={ROUTES.ALUMNI} element={<AlumniPage />} />
            <Route path={ROUTES.PLACEMENT} element={<PlacementPage />} />
            <Route path={ROUTES.HOSTEL} element={<HostelPage />} />
            <Route path={ROUTES.TRANSPORT} element={<TransportPage />} />
            <Route path={ROUTES.LIBRARY} element={<LibraryPage />} />
            <Route path={ROUTES.PROCUREMENT} element={<ProcurementPage />} />
            <Route path={ROUTES.FACILITIES} element={<FacilitiesPage />} />
            <Route path={ROUTES.RESEARCH} element={<ResearchPage />} />
            <Route path={ROUTES.ACCREDITATION} element={<AccreditationPage />} />
            <Route path={ROUTES.FEES} element={<FeesPage />} />

            <Route path={ROUTES.ASSIGNMENTS} element={<AssignmentDashboardPage />} />
            <Route path={ROUTES.QUIZZES} element={<QuizDashboardPage />} />
            <Route path={ROUTES.EXAMS} element={<ExamDashboardPage />} />
            <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
            <Route path={ROUTES.AI} element={<AIPage />} />
            <Route path={ROUTES.APIGATEWAY} element={<ApiGatewayPage />} />
            <Route path={ROUTES.DEVOPS} element={<DevopsPage />} />
            <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
            <Route path="/multitenant" element={<MultitenantPage />} />
            <Route path={ROUTES.WORKFLOW} element={<WorkflowPage />} />
            <Route path={ROUTES.WORKFLOW_DESIGNER} element={<WorkflowDesignerPage />} />
            <Route path={ROUTES.SEARCH} element={<SearchPage />} />
            <Route path={ROUTES.GRC} element={<GRCPage />} />
            <Route path={ROUTES.MDM} element={<MdmPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Not Found Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
export default AppRoutes;
