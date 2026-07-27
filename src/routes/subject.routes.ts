import { Router } from 'express';
import { subjectController } from '../controllers/subject.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const subjectRouter = Router();

// Require authentication for all subject routes
subjectRouter.use(authenticate);

// READ: accessible by Super Admin, Admin, Teacher, and Student
subjectRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  subjectController.getAll
);

subjectRouter.get(
  '/prerequisites',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  subjectController.getPrerequisites
);

subjectRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  subjectController.getOne
);

// WRITE: restricted to Super Admin and Admin only
subjectRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  subjectController.create
);

subjectRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  subjectController.update
);

subjectRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  subjectController.changeStatus
);

subjectRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  subjectController.delete
);

export default subjectRouter;
