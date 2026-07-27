import { Router } from 'express';
import { roomController } from '../controllers/room.controller';
import { timetableController } from '../controllers/timetable.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';


export const roomRouter = Router();

roomRouter.use(authenticate);

roomRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  roomController.getAll
);

roomRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  roomController.getOne
);

roomRouter.get(
  '/:id/timetable',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  timetableController.getByRoom
);


roomRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  roomController.create
);

roomRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  roomController.update
);

roomRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  roomController.delete
);

export default roomRouter;
