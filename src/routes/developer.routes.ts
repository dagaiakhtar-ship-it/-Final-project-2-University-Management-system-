import { Router } from 'express';
import { developerController } from '../controllers/developer.controller';
import { authenticate } from '../middleware/auth.middleware';

export const developerRouter = Router();

// Publicly available API catalogs or documentation schemas (no JWT lock required for general discovery)
developerRouter.get('/apis', developerController.getApis);
developerRouter.get('/docs', developerController.getDocs);

// Secure endpoints require standard client context login
developerRouter.post('/apps', authenticate, developerController.createApp);
developerRouter.get('/apps', authenticate, developerController.getApps);

developerRouter.post('/webhooks', authenticate, developerController.createWebhook);
developerRouter.get('/webhooks', authenticate, developerController.getWebhooks);

developerRouter.post('/subscriptions', authenticate, developerController.createSubscription);
developerRouter.get('/usage', authenticate, developerController.getUsage);

export default developerRouter;
