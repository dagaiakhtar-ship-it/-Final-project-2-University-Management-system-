import { Router } from 'express';
import { examController } from '../controllers/exam.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const examRouter = Router();

// Apply authentication middleware to all exam routes
examRouter.use(authenticate);

// 1. Exam CRUD & Queries
examRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  examController.getExams
);

examRouter.get(
  '/analytics/overview',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.getExamAnalytics
);

examRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  examController.getExamById
);

examRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.createExam
);

examRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.updateExam
);

examRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.deleteExam
);

// 2. Exam Scheduling & Action endpoints
examRouter.patch(
  '/:id/schedule',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.scheduleExam
);

examRouter.patch(
  '/:id/cancel',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.cancelExam
);

examRouter.post(
  '/:id/generate-seat-plan',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.generateSeatPlan
);

examRouter.post(
  '/:id/generate-admit-cards',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.generateAdmitCards
);

examRouter.post(
  '/:id/assign-invigilators',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  examController.assignInvigilators
);

examRouter.post(
  '/verify-admit-card',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  examController.verifyAdmitCard
);

// 3. User-specific Exam routes
examRouter.get(
  '/student/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  examController.getStudentExams
);

examRouter.get(
  '/teacher/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  examController.getTeacherExams
);
