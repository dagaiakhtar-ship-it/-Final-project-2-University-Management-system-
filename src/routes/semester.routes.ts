import { Router } from 'express';
import { semesterController } from '../controllers/semester.controller';
import { sectionController } from '../controllers/section.controller';
import { subjectController } from '../controllers/subject.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const semesterRouter = Router();

// Require authentication for all semester routes
semesterRouter.use(authenticate);

// READ: accessible by Super Admin, Admin, Teacher, and Student
semesterRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  semesterController.getAll
);

semesterRouter.get(
  '/academic-years',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  semesterController.getAcademicYears
);

semesterRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  semesterController.getOne
);

// GET semesters by programId
semesterRouter.get(
  '/program/:programId',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  semesterController.getByProgram
);

// GET sections by semesterId
semesterRouter.get(
  '/:semesterId/sections',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  sectionController.getBySemester
);

// GET subjects by semesterId
semesterRouter.get(
  '/:semesterId/subjects',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  subjectController.getBySemester
);

// WRITE: restricted to Super Admin and Admin only
semesterRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  semesterController.create
);

semesterRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  semesterController.update
);

semesterRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  semesterController.updateStatus
);

semesterRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  semesterController.delete
);

export default semesterRouter;
