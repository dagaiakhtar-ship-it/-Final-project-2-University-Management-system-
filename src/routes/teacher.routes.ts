import { Router } from 'express';
import { teacherController } from '../controllers/teacher.controller';
import { timetableController } from '../controllers/timetable.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';


export const teacherRouter = Router();

// Require authentication for all teacher routes
teacherRouter.use(authenticate);

// GET Lookup options: accessible by all authenticated users
teacherRouter.get(
  '/lookup-options',
  teacherController.getLookupOptions
);

// GET All: accessible by all authenticated users
teacherRouter.get(
  '/',
  teacherController.getAll
);

// GET One: accessible by all authenticated users
teacherRouter.get(
  '/:id',
  teacherController.getOne
);

teacherRouter.get(
  '/:id/timetable',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  timetableController.getByTeacher
);


// POST: Restricted to Super Admin and Admin
teacherRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  teacherController.create
);

// PUT: Super Admin, Admin, and Teacher (Teacher is filtered to personal fields inside controller)
teacherRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  teacherController.update
);

// PATCH Status: Super Admin and Admin only
teacherRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  teacherController.changeStatus
);

// DELETE: Super Admin and Admin only
teacherRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  teacherController.delete
);

export default teacherRouter;
