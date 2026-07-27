import { Router } from 'express';
import { sectionController } from '../controllers/section.controller';
import { timetableController } from '../controllers/timetable.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';


export const sectionRouter = Router();

// Require authentication for all section routes
sectionRouter.use(authenticate);

// READ: accessible by Super Admin, Admin, Teacher, Student, and Parent
sectionRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  sectionController.getAll
);

sectionRouter.get(
  '/teachers',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  sectionController.getTeachers
);

sectionRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  sectionController.getOne
);

sectionRouter.get(
  '/:id/timetable',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  timetableController.getBySection
);


// GET sections by semesterId
sectionRouter.get(
  '/semester/:semesterId',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  sectionController.getBySemester
);

// WRITE: restricted to Super Admin and Admin only
sectionRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  sectionController.create
);

sectionRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  sectionController.update
);

sectionRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  sectionController.updateStatus
);

sectionRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  sectionController.delete
);

export default sectionRouter;
