import { Router } from 'express';
import { settingController } from '../controllers/setting.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const settingRouter = Router();

settingRouter.use(authenticate);

settingRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  settingController.getAll
);

settingRouter.put(
  '/',
  requireRoles(['SUPER_ADMIN']),
  settingController.update
);

settingRouter.post(
  '/bulk',
  requireRoles(['SUPER_ADMIN']),
  settingController.bulkUpdate
);

export default settingRouter;
