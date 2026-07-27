import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const leaveRouter = Router();

// Apply auth middleware to all leave routes
leaveRouter.use(authenticate);

// 1. Leave requests query & creation
leaveRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  leaveController.getLeaveRequests
);

leaveRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  leaveController.getLeaveDetails
);

leaveRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  leaveController.createLeaveRequest
);

leaveRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  leaveController.updateLeaveRequest
);

leaveRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  leaveController.deleteLeaveRequest
);

// 2. Approval lifecycle
leaveRouter.patch(
  '/:id/approve',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  leaveController.approveLeaveRequest
);

leaveRouter.patch(
  '/:id/reject',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  leaveController.rejectLeaveRequest
);

leaveRouter.patch(
  '/:id/cancel',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  leaveController.cancelLeaveRequest
);

// 3. User specific leaves
export const studentLeaveRouter = Router();
studentLeaveRouter.get(
  '/:id/leaves',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  leaveController.getStudentLeaves
);

export const teacherLeaveRouter = Router();
teacherLeaveRouter.get(
  '/:id/leaves',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  leaveController.getTeacherLeaves
);
