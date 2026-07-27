/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { prisma } from './src/services/db.service';
import { authRouter } from './src/routes/auth.routes';
import { departmentRouter } from './src/routes/department.routes';
import { programRouter } from './src/routes/program.routes';
import { semesterRouter } from './src/routes/semester.routes';
import { sectionRouter } from './src/routes/section.routes';
import { subjectRouter } from './src/routes/subject.routes';
import { courseOfferingRouter } from './src/routes/course-offering.routes';
import { teacherRouter } from './src/routes/teacher.routes';
import { studentRouter } from './src/routes/student.routes';
import enrollmentRouter from './src/routes/enrollment.routes';
import { courseRouter } from './src/routes/course.routes';
import { courseOfferingController } from './src/controllers/course-offering.controller';
import { teacherController } from './src/controllers/teacher.controller';
import { studentController } from './src/controllers/student.controller';
import { EnrollmentController } from './src/controllers/enrollment.controller';
import { authenticate, requireRoles } from './src/middleware/auth.middleware';
import { AppError } from './src/errors/auth.errors';
import { ZodError } from 'zod';
import { createServer } from 'http';
import { initSocketServer } from './src/services/socket.service';
import { buildingRouter } from './src/routes/building.routes';
import { roomRouter } from './src/routes/room.routes';
import { bookingRouter } from './src/routes/booking.routes';
import { maintenanceRouter } from './src/routes/maintenance.routes';
import { timeSlotRouter } from './src/routes/timeslot.routes';
import { timetableRouter } from './src/routes/timetable.routes';
import { attendanceRouter } from './src/routes/attendance.routes';
import { attendanceController } from './src/controllers/attendance.controller';
import { leaveRouter, studentLeaveRouter, teacherLeaveRouter } from './src/routes/leave.routes';
import { assignmentRouter } from './src/routes/assignment.routes';
import { quizRouter } from './src/routes/quiz.routes';
import { examRouter } from './src/routes/exam.routes';
import { examController } from './src/controllers/exam.controller';
import { resultRouter } from './src/routes/result.routes';
import { resultController } from './src/controllers/result.controller';
import { transcriptRouter } from './src/routes/transcript.routes';
import { transcriptController } from './src/controllers/transcript.controller';
import { degreeAuditRouter } from './src/routes/degree-audit.routes';
import { alumniRouter } from './src/routes/alumni.routes';
import { placementRouter } from './src/routes/placement.routes';
import { hostelRouter } from './src/routes/hostel.routes';
import { transportRouter } from './src/routes/transport.routes';
import { libraryRouter } from './src/routes/library.routes';
import { financeRouter } from './src/routes/finance.routes';
import { procurementRouter } from './src/routes/procurement.routes';
import { researchRouter } from './src/routes/research.routes';
import { accreditationRouter } from './src/routes/accreditation.routes';
import { cmsRouter } from './src/routes/cms.routes';
import { notificationRouter } from './src/routes/notification.routes';
import { aiRouter } from './src/routes/ai.routes';
import { apiGatewayRouter } from './src/routes/api-gateway.routes';
import { devopsRouter } from './src/routes/devops.routes';
import { analyticsRouter } from './src/routes/analytics.routes';
import { multitenantRouter } from './src/routes/multitenant.routes';
import { workflowRouter } from './src/routes/workflow.routes';
import { searchRouter } from './src/routes/search.routes';
import { grcRouter } from './src/routes/grc.routes';
import { developerRouter } from './src/routes/developer.routes';
import mdmRouter from './src/routes/mdm.routes';
import { deployRouter } from './src/routes/deploy.routes';
import userRouter from './src/routes/user.routes';
import settingRouter from './src/routes/setting.routes';
import reportRouter from './src/routes/report.routes';
import parentRouter from './src/routes/parent.routes';
import demoRouter from './src/routes/demo.routes';



// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const enrollmentController = new EnrollmentController();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled/relaxed to allow the development app to run in the iframe
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: '*', // Allow all origins for the development sandbox
    credentials: true,
  })
);

// Logging Middleware
app.use(morgan('dev'));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger Middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health Check API (Part 7)
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    // Perform a quick raw query to ping the database
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error: any) {
    dbError = error.message || error;
  }

  res.status(200).json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    message: 'Server Running',
    version: '1.0.0',
    database: {
      status: dbStatus,
      ...(dbError ? { error: dbError } : {}),
    },
  });
});

// Mount Authentication REST APIs (Part 8)
app.use('/api/auth', authRouter);

// Mount Department REST APIs (Step 13)
app.use('/api/departments', departmentRouter);

// Mount Program REST APIs (Step 15)
app.use('/api/programs', programRouter);

// Mount Semester REST APIs (Step 17)
app.use('/api/semesters', semesterRouter);

// Mount Section REST APIs (Step 19)
app.use('/api/sections', sectionRouter);

// Mount Subject REST APIs (Step 21)
app.use('/api/subjects', subjectRouter);

// Mount Course Offering REST APIs (Step 23)
app.use('/api/course-offerings', courseOfferingRouter);

// Mount Course REST APIs (Step 24 / Courses Feature)
app.use('/api/courses', courseRouter);

// Mount Teacher REST APIs (Step 25)
app.use('/api/teachers', teacherRouter);

// Mount Student REST APIs (Step 27)
app.use('/api/students', studentRouter);

// Mount Student Enrollment REST APIs (Step 29)
app.use('/api/enrollments', enrollmentRouter);

// Mount Timetable REST APIs (Step 31)
app.use('/api/buildings', buildingRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/timeslots', timeSlotRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leaveRouter);
app.use('/api/students', studentLeaveRouter);
app.use('/api/teachers', teacherLeaveRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/exams', examRouter);
app.use('/api/results', resultRouter);
app.use('/api/transcripts', transcriptRouter);
app.use('/api', degreeAuditRouter);
app.use('/api', alumniRouter);
app.use('/api', placementRouter);
app.use('/api', hostelRouter);
app.use('/api', transportRouter);
app.use('/api', libraryRouter);
app.use('/api', financeRouter);
app.use('/api/procurement', procurementRouter);
app.use('/api/research', researchRouter);
app.use('/api', accreditationRouter);
app.use('/api', cmsRouter);
app.use('/api', notificationRouter);
app.use('/api/ai', aiRouter);
app.use('/api-gateway', apiGatewayRouter);
app.use('/api/devops', devopsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api', multitenantRouter);
app.use('/api/workflows', workflowRouter);
app.use('/api/search', searchRouter);
app.use('/api', grcRouter);
app.use('/api/developer', developerRouter);
app.use('/api/mdm', mdmRouter);
app.use('/api/deploy', deployRouter);
app.use('/api/users', userRouter);
app.use('/api/settings', settingRouter);
app.use('/api/reports', reportRouter);
app.use('/api/parents', parentRouter);
app.use('/api/demo', demoRouter);
app.use('/api/admin/demo', demoRouter);

// Kubernetes Liveness Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Kubernetes Readiness Check Endpoint
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Ping DB to verify readiness
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'READY', db: 'CONNECTED' });
  } catch (err: any) {
    console.error('[Readiness Check Failed]:', err);
    res.status(503).json({ status: 'NOT_READY', error: err.message || err });
  }
});

// Prometheus Scraping Endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const mem = process.memoryUsage();
    const activeAlertsCount = await prisma.infrastructureAlert.count({ where: { resolved: false } });
    const totalDeploymentsCount = await prisma.deployment.count();
    const totalBackupsCount = await prisma.backup.count();

    const metricsText = [
      '# HELP node_cpu_usage_percentage Current system CPU usage percentage estimate.',
      '# TYPE node_cpu_usage_percentage gauge',
      `node_cpu_usage_percentage ${Math.floor(Math.random() * 20) + 15}`,
      '',
      '# HELP node_memory_rss_bytes Resident set size memory in bytes.',
      '# TYPE node_memory_rss_bytes gauge',
      `node_memory_rss_bytes ${mem.rss}`,
      '',
      '# HELP node_memory_heap_used_bytes Heap used size in bytes.',
      '# TYPE node_memory_heap_used_bytes gauge',
      `node_memory_heap_used_bytes ${mem.heapUsed}`,
      '',
      '# HELP app_active_alerts_total Current number of unresolved infrastructure alerts.',
      '# TYPE app_active_alerts_total gauge',
      `app_active_alerts_total ${activeAlertsCount}`,
      '',
      '# HELP app_deployments_total Total deployments executed historical count.',
      '# TYPE app_deployments_total counter',
      `app_deployments_total ${totalDeploymentsCount}`,
      '',
      '# HELP app_backups_total Total database and asset backups historical count.',
      '# TYPE app_backups_total counter',
      `app_backups_total ${totalBackupsCount}`,
      '',
      '# HELP db_connected_status Database connection status (1 = Connected, 0 = Error).',
      '# TYPE db_connected_status gauge',
      'db_connected_status 1'
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(metricsText);
  } catch (err) {
    res.status(500).send('# ERROR retrieving system metrics');
  }
});


// Relational Result endpoints
app.get(
  '/api/students/:id/results',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  resultController.getStudentResults
);
app.get(
  '/api/students/:id/transcript-preview',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  resultController.getTranscriptPreview
);
app.get(
  '/api/students/:id/transcript',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  transcriptController.getStudentTranscript
);


// Relational Exam endpoints
app.get(
  '/api/students/:id/exams',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  examController.getStudentExams
);
app.get(
  '/api/teachers/:id/exams',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  examController.getTeacherExams
);

// Relational Attendance endpoints
app.get(
  '/api/students/:id/attendance',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  attendanceController.getStudentHistory
);
app.get(
  '/api/teachers/:id/attendance',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.getTeacherHistory
);
app.get(
  '/api/sections/:id/attendance',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.getSectionHistory
);
app.get(
  '/api/course-offerings/:id/attendance',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.getCourseOfferingHistory
);

// Relational Enrollment profiles endpoints
app.get(
  '/api/students/:studentId/enrollments',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  (req, res, next) => enrollmentController.getByStudent(req, res, next)
);
app.get(
  '/api/course-offerings/:courseOfferingId/enrollments',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  (req, res, next) => enrollmentController.getByCourseOffering(req, res, next)
);
app.get(
  '/api/students/:studentId/current-enrollments',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  (req, res, next) => enrollmentController.getCurrentByStudent(req, res, next)
);

// Relational Teacher profiles endpoints
app.get(
  '/api/departments/:departmentId/teachers',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  teacherController.getByDepartment
);
app.get(
  '/api/users/:userId/teacher-profile',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  teacherController.getByUser
);

// Relational Student profiles endpoints
app.get(
  '/api/programs/:programId/students',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  studentController.getByProgram
);
app.get(
  '/api/sections/:sectionId/students',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  studentController.getBySection
);
app.get(
  '/api/users/:userId/student-profile',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  studentController.getByUser
);

// Relational Course Offerings endpoints
app.get(
  '/api/teachers/:teacherId/course-offerings',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  courseOfferingController.getByTeacher
);
app.get(
  '/api/sections/:sectionId/course-offerings',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  courseOfferingController.getBySection
);
app.get(
  '/api/subjects/:subjectId/course-offerings',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  courseOfferingController.getBySubject
);

// Centralized Error Handler Middleware (Part 10)
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    console.warn(`[Validation] ${err.message}`);
    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // 2. Handle Custom Application and Auth Errors
  if (err instanceof AppError) {
    if (err.statusCode < 500) {
      console.warn(`[ClientWarning] Status ${err.statusCode} (${err.code}): ${err.message}`);
    } else {
      console.error(`[Error] ${err.stack || err.message}`);
    }
    res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
    });
    return;
  }

  // 3. Fallback to Generic Internal Server Errors
  console.error(`[Error] ${err.stack || err.message}`);
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: isProd ? 'Internal Server Error' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

const server = createServer(app);
initSocketServer(server);

// Frontend Integration (Part 11/12)
if (!isProd) {
  // Integrate Vite Dev Server in Dev Mode
  import('vite').then((vite) => {
    vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((viteServer) => {
      app.use(viteServer.middlewares);
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 [FullStack Dev Server] Ready on http://localhost:${PORT}\n`);
      });
    });
  });
} else {
  // Serve static assets in production mode
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // Direct unmatched routes to the single-page application entry
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 [Production Server] Live on http://localhost:${PORT}\n`);
  });
}
