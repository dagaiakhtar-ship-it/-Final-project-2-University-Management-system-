import { Router } from 'express';
import { parentController } from '../controllers/parent.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const parentRouter = Router();

parentRouter.use(authenticate);

parentRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT']),
  parentController.getAll
);

parentRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT']),
  parentController.getOne
);

parentRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  parentController.create
);

parentRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  parentController.update
);

parentRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  parentController.delete
);

export default parentRouter;
