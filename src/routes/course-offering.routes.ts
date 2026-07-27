import { Router } from 'express';
import { courseOfferingController } from '../controllers/course-offering.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const courseOfferingRouter = Router();

// Require authentication for all course offering routes
courseOfferingRouter.use(authenticate);

// READ: Super Admin, Admin, Teacher, Student, and Parent (Read-only)
courseOfferingRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  courseOfferingController.getAll
);

courseOfferingRouter.get(
  '/lookup-options',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  courseOfferingController.getLookupOptions
);

courseOfferingRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  courseOfferingController.getOne
);

// WRITE: restricted to Super Admin and Admin only
courseOfferingRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  courseOfferingController.create
);

courseOfferingRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  courseOfferingController.update
);

courseOfferingRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  courseOfferingController.changeStatus
);

courseOfferingRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  courseOfferingController.delete
);

export default courseOfferingRouter;
