import { Router } from 'express';
import { programController } from '../controllers/program.controller';
import { semesterController } from '../controllers/semester.controller';
import { subjectController } from '../controllers/subject.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const programRouter = Router();

// Require authentication for all program routes
programRouter.use(authenticate);

// READ: accessible by Super Admin, Admin, Teacher, and Student
programRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  programController.getAll
);

programRouter.get(
  '/teachers',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  programController.getTeachers
);

programRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  programController.getOne
);

programRouter.get(
  '/:programId/semesters',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  semesterController.getByProgram
);

programRouter.get(
  '/:programId/subjects',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  subjectController.getByProgram
);

// WRITE: restricted to Super Admin and Admin only
programRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  programController.create
);

programRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  programController.update
);

programRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  programController.delete
);

programRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  programController.updateStatus
);

export default programRouter;
