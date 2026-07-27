import { Router } from 'express';
import { placementController } from '../controllers/placement.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const placementRouter = Router();

// Require authenticate for all placement endpoints
placementRouter.use(authenticate);

// =========================================================================
// COMPANY ROUTES
// =========================================================================
placementRouter.get(
  '/companies',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER', 'STUDENT', 'TEACHER']),
  placementController.getCompanies
);

placementRouter.get(
  '/companies/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER', 'STUDENT', 'TEACHER']),
  placementController.getCompanyById
);

placementRouter.post(
  '/companies',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER']),
  placementController.createCompany
);

placementRouter.put(
  '/companies/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER']),
  placementController.updateCompany
);

placementRouter.delete(
  '/companies/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER']),
  placementController.deleteCompany
);

// =========================================================================
// RECRUITER ROUTES
// =========================================================================
placementRouter.get(
  '/recruiters',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER']),
  placementController.getRecruiters
);

placementRouter.post(
  '/recruiters',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER']),
  placementController.createRecruiter
);

placementRouter.patch(
  '/recruiters/:id/verify',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER']),
  placementController.verifyRecruiter
);

// =========================================================================
// JOB / INTERNSHIP POSTINGS ROUTES
// =========================================================================
placementRouter.get(
  '/jobs',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER', 'STUDENT', 'TEACHER']),
  placementController.getJobPostings
);

placementRouter.get(
  '/jobs/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER', 'STUDENT', 'TEACHER']),
  placementController.getJobPostingById
);

placementRouter.post(
  '/jobs',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER']),
  placementController.createJobPosting
);

placementRouter.put(
  '/jobs/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER']),
  placementController.updateJobPosting
);

placementRouter.delete(
  '/jobs/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER']),
  placementController.deleteJobPosting
);

// =========================================================================
// APPLICATIONS & ELIGIBILITY ROUTES
// =========================================================================
placementRouter.get(
  '/jobs/eligibility',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'STUDENT']),
  placementController.checkEligibility
);

placementRouter.post(
  '/jobs/apply',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  placementController.applyForJob
);

placementRouter.get(
  '/applications',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER', 'STUDENT']),
  placementController.getApplications
);

placementRouter.get(
  '/applications/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER', 'STUDENT']),
  placementController.getApplicationById
);

placementRouter.patch(
  '/applications/:id/status',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER']),
  placementController.updateApplicationStatus
);

// =========================================================================
// STUDENT CAREER & PLACEMENT HISTORY
// =========================================================================
placementRouter.get(
  '/students/:id/placements',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'TEACHER', 'STUDENT']),
  placementController.getStudentPlacements
);

// =========================================================================
// METRICS & RECHARTS ANALYTICS
// =========================================================================
placementRouter.get(
  '/placement/analytics',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'TEACHER', 'STUDENT']),
  placementController.getPlacementAnalytics
);

export default placementRouter;
