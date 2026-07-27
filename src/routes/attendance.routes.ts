import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

// 1. Get/Create Sessions
attendanceRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  attendanceController.getSessions
);

attendanceRouter.get(
  '/analytics',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.getAnalytics
);

attendanceRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  attendanceController.getSession
);

attendanceRouter.post(
  '/session',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.createSession
);

// 2. Mark & Bulk Mark Attendance
attendanceRouter.post(
  '/mark',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.markAttendance
);

attendanceRouter.post(
  '/bulk',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.bulkMarkAttendance
);

// 3. Update & Soft Delete
attendanceRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.update
);

attendanceRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.delete
);

// 4. Locks & Unlocks
attendanceRouter.patch(
  '/lock',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.lock
);

attendanceRouter.patch(
  '/unlock',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.unlock
);

// 5. QR Code Handling
attendanceRouter.post(
  '/session/:id/qr',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  attendanceController.generateQr
);

// Student scans QR Code
attendanceRouter.post(
  '/scan',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  attendanceController.scanQr
);

export default attendanceRouter;
