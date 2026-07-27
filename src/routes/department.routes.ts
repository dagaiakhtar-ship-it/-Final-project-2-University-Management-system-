import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { programController } from '../controllers/program.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const departmentRouter = Router();

// Require authentication for all department routes
departmentRouter.use(authenticate);

// READ: accessible by Super Admin, Admin, Teacher, and Student
departmentRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  departmentController.getAll
);

departmentRouter.get(
  '/teachers',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  departmentController.getTeachers
);

departmentRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  departmentController.getOne
);

// WRITE: restricted to Super Admin and Admin only
departmentRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  departmentController.create
);

departmentRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  departmentController.update
);

departmentRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  departmentController.delete
);

departmentRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  departmentController.updateStatus
);

departmentRouter.get(
  '/:departmentId/programs',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  programController.getByDepartment
);

export default departmentRouter;
