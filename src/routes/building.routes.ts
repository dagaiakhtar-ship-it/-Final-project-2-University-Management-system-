import { Router } from 'express';
import { buildingController } from '../controllers/building.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const buildingRouter = Router();

buildingRouter.use(authenticate);

buildingRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  buildingController.getAll
);

buildingRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  buildingController.getOne
);

buildingRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  buildingController.create
);

buildingRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  buildingController.update
);

buildingRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  buildingController.delete
);

export default buildingRouter;
