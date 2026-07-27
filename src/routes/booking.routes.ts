import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const bookingRouter = Router();

bookingRouter.use(authenticate);

bookingRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  bookingController.getAll
);

bookingRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  bookingController.getOne
);

bookingRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  bookingController.create
);

bookingRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), // Department Heads / Admins can approve or update
  bookingController.update
);

bookingRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  bookingController.delete
);

export default bookingRouter;
