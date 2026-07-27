import { Router } from 'express';
import { degreeAuditController } from '../controllers/degree-audit.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const degreeAuditRouter = Router();

degreeAuditRouter.use(authenticate);

// 1. GET /api/degree-audit - List all audits
degreeAuditRouter.get(
  '/degree-audit',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  degreeAuditController.getDegreeAudits
);

// 2. GET /api/degree-audit/:studentId - Get/Run audit for a student
degreeAuditRouter.get(
  '/degree-audit/:studentId',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  degreeAuditController.getDegreeAuditByStudentId
);

// 3. POST /api/degree-audit/run - Run fresh audit
degreeAuditRouter.post(
  '/degree-audit/run',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  degreeAuditController.runDegreeAudit
);

// 4. POST /api/degree-audit/simulate - Run simulation
degreeAuditRouter.post(
  '/degree-audit/simulate',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  degreeAuditController.simulateWhatIf
);

// 5. GET /api/graduation-applications - List applications
degreeAuditRouter.get(
  '/graduation-applications',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  degreeAuditController.getGraduationApplications
);

// 6. POST /api/graduation-applications - Submit application
degreeAuditRouter.post(
  '/graduation-applications',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  degreeAuditController.createGraduationApplication
);

// 7. PUT /api/graduation-applications/:id - Update application general details
degreeAuditRouter.put(
  '/graduation-applications/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  degreeAuditController.updateGraduationApplication
);

// 8. PATCH /api/graduation-applications/:id/approve - Approve application
degreeAuditRouter.patch(
  '/graduation-applications/:id/approve',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  degreeAuditController.approveGraduationApplication
);

// 9. PATCH /api/graduation-applications/:id/reject - Reject application
degreeAuditRouter.patch(
  '/graduation-applications/:id/reject',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  degreeAuditController.rejectGraduationApplication
);

// 10. PATCH /api/graduation-applications/:id/withdraw - Withdraw application
degreeAuditRouter.patch(
  '/graduation-applications/:id/withdraw',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  degreeAuditController.withdrawGraduationApplication
);
