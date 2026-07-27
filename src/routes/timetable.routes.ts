import { Router } from 'express';
import { timetableController } from '../controllers/timetable.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const timetableRouter = Router();

timetableRouter.use(authenticate);

timetableRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  timetableController.getAll
);

timetableRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  timetableController.getOne
);

timetableRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  timetableController.create
);

timetableRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  timetableController.update
);

timetableRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  timetableController.delete
);

timetableRouter.patch(
  '/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  timetableController.patchStatus
);

export default timetableRouter;
