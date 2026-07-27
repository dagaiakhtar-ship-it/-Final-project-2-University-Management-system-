import { Router } from 'express';
import { alumniController } from '../controllers/alumni.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const alumniRouter = Router();

// Guest/Public directories can be accessed without full auth or with limited auth.
// Let's protect them with optional authenticate if needed, or allow standard users.
alumniRouter.get(
  '/alumni',
  alumniController.getAlumniProfiles
);

// Require authentication for all other actions
alumniRouter.use(authenticate);

alumniRouter.get(
  '/alumni/analytics',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  alumniController.getAlumniAnalytics
);

alumniRouter.get(
  '/alumni/events',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  alumniController.getAlumniEvents
);

alumniRouter.post(
  '/alumni/events',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  alumniController.createAlumniEvent
);

alumniRouter.post(
  '/alumni/events/:id/register',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  alumniController.registerForEvent
);

alumniRouter.post(
  '/alumni/verify',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  alumniController.verifyAlumniProfile
);

alumniRouter.get(
  '/alumni/donations',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  alumniController.getDonations
);

alumniRouter.post(
  '/alumni/donations',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  alumniController.createDonation
);

alumniRouter.post(
  '/alumni/mentorship',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  alumniController.createMentorshipRequest
);

alumniRouter.get(
  '/alumni/mentorship',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  alumniController.getMentorships
);

alumniRouter.put(
  '/alumni/mentorship/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  alumniController.updateMentorshipStatus
);

alumniRouter.get(
  '/alumni/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  alumniController.getAlumniProfileById
);

alumniRouter.post(
  '/alumni',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  alumniController.createAlumniProfile
);

alumniRouter.put(
  '/alumni/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  alumniController.updateAlumniProfile
);

alumniRouter.delete(
  '/alumni/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  alumniController.deleteAlumniProfile
);

export default alumniRouter;
