import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const assignmentRouter = Router();

// Apply auth middleware to all assignment routes
assignmentRouter.use(authenticate);

// 1. Assignment CRUD and Query routes
assignmentRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  assignmentController.getAssignments
);

assignmentRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  assignmentController.getAssignmentById
);

assignmentRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  assignmentController.createAssignment
);

assignmentRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  assignmentController.updateAssignment
);

assignmentRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  assignmentController.deleteAssignment
);

// 2. Publish and Archive routes
assignmentRouter.patch(
  '/:id/publish',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  assignmentController.publishAssignment
);

assignmentRouter.patch(
  '/:id/archive',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  assignmentController.archiveAssignment
);

// 3. Submissions management
assignmentRouter.post(
  '/:id/submissions',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  assignmentController.createSubmission
);

// Get multiple submissions (teachers/admins/students)
assignmentRouter.get(
  '/:id/submissions-list',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  assignmentController.getSubmissions
);

// 4. Specific Submission operations
assignmentRouter.put(
  '/submissions/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  assignmentController.updateSubmission
);

assignmentRouter.get(
  '/submissions/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  assignmentController.getSubmissionById
);

assignmentRouter.patch(
  '/submissions/:id/grade',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  assignmentController.gradeSubmission
);

// 5. Parameterized fetch routes
assignmentRouter.get(
  '/students/:id/assignments',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  assignmentController.getStudentAssignments
);

assignmentRouter.get(
  '/teachers/:id/assignments',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  assignmentController.getTeacherAssignments
);

// 6. Analytics
assignmentRouter.get(
  '/:id/analytics',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  assignmentController.getAssignmentAnalytics
);

export default assignmentRouter;
