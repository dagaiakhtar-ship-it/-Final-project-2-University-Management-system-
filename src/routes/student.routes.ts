import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { timetableController } from '../controllers/timetable.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';


export const studentRouter = Router();

// Require authentication for all student routes
studentRouter.use(authenticate);

// GET Lookup options: accessible by all authenticated users
studentRouter.get(
  '/lookup-options',
  studentController.getLookupOptions
);

// GET All: accessible by all authenticated users
studentRouter.get(
  '/',
  studentController.getAll
);

// GET One: accessible by all authenticated users
studentRouter.get(
  '/:id',
  studentController.getOne
);

studentRouter.get(
  '/:id/timetable',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  timetableController.getByStudent
);


// POST Create: Super Admin and Admin only
studentRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  studentController.create
);

// PUT Update: Super Admin, Admin, and Student (ownership & restricted fields checked in controller)
studentRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  studentController.update
);

// PATCH Status: Super Admin and Admin only
studentRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  studentController.updateStatus
);

// DELETE: Super Admin and Admin only
studentRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  studentController.delete
);

export default studentRouter;
