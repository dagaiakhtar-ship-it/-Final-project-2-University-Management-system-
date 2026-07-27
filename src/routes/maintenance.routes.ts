import { Router } from 'express';
import { maintenanceController } from '../controllers/maintenance.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const maintenanceRouter = Router();

maintenanceRouter.use(authenticate);

maintenanceRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  maintenanceController.getAll
);

maintenanceRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  maintenanceController.getOne
);

maintenanceRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  maintenanceController.create
);

maintenanceRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), // Technicians, Managers, Admins can update status/assignment
  maintenanceController.update
);

export default maintenanceRouter;
