import { Router } from 'express';
import { timeSlotController } from '../controllers/timeslot.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const timeSlotRouter = Router();

timeSlotRouter.use(authenticate);

timeSlotRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  timeSlotController.getAll
);

timeSlotRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  timeSlotController.getOne
);

timeSlotRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  timeSlotController.create
);

timeSlotRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  timeSlotController.update
);

timeSlotRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  timeSlotController.delete
);

export default timeSlotRouter;
