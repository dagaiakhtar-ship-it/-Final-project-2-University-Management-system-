import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const reportRouter = Router();

reportRouter.use(authenticate);

reportRouter.get(
  '/summary',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  reportController.getSummaryStats
);

reportRouter.get(
  '/saved',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  reportController.getSavedReports
);

reportRouter.post(
  '/saved',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  reportController.createSavedReport
);

reportRouter.get(
  '/generate/:type',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  reportController.generate
);

export default reportRouter;
