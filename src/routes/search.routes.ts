import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const searchRouter = Router();

// Ensure all search routes are authenticated
searchRouter.use(authenticate);

// Main search routes
searchRouter.get('/', searchController.search.bind(searchController));
searchRouter.post('/', searchController.search.bind(searchController));

// Search history routes
searchRouter.get('/history', searchController.getHistory.bind(searchController));

// Saved search routes
searchRouter.get('/saved', searchController.getSaved.bind(searchController));
searchRouter.post('/saved', searchController.saveSearch.bind(searchController));
searchRouter.delete('/saved/:id', searchController.deleteSaved.bind(searchController));

// Analytics and Dashboard routes (Restricted to admins/superadmins)
searchRouter.get('/analytics', requireRoles(['SUPER_ADMIN', 'ADMIN']), searchController.getAnalytics.bind(searchController));

// Trigger manual global re-indexing (Restricted to admins/superadmins)
searchRouter.post('/reindex', requireRoles(['SUPER_ADMIN', 'ADMIN']), searchController.reindex.bind(searchController));
