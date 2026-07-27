import { Router } from 'express';
import { courseController } from '../controllers/course.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const courseRouter = Router();

courseRouter.use(authenticate);

courseRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  courseController.getAll
);

courseRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  courseController.getOne
);

courseRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  courseController.create
);

courseRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  courseController.update
);

courseRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  courseController.delete
);

courseRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  courseController.updateStatus
);

export default courseRouter;
