import { Router } from 'express';
import { resultController } from '../controllers/result.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const resultRouter = Router();

// Apply auth middleware
resultRouter.use(authenticate);

// Results CRUD and Action Endpoints
resultRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  resultController.getResults
);

resultRouter.get(
  '/analytics',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  resultController.getResultAnalytics
);

resultRouter.get(
  '/merit-list',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  resultController.getMeritList
);

resultRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  resultController.getResultById
);

resultRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  resultController.createResult
);

resultRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  resultController.updateResult
);

resultRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  resultController.deleteResult
);

resultRouter.patch(
  '/:id/approve',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  resultController.approveResult
);

resultRouter.patch(
  '/:id/publish',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  resultController.publishResult
);

resultRouter.post(
  '/process',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  resultController.processResults
);

resultRouter.post(
  '/calculate-gpa',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  resultController.calculateGPA
);

resultRouter.post(
  '/calculate-cgpa',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  resultController.calculateCGPA
);
