import { Router } from 'express';
import { grcController } from '../controllers/grc.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const grcRouter = Router();

// Ensure all GRC routes require authentication
grcRouter.use(authenticate);

// --- AUDIT TRAIL ENDPOINTS ---
// Read-only audit access: SUPER_ADMIN, ADMIN, INTERNAL_AUDITOR, AUDITOR
grcRouter.get('/audit/events', requireRoles(['SUPER_ADMIN', 'ADMIN', 'INTERNAL_AUDITOR', 'AUDITOR']), grcController.getEvents.bind(grcController));
grcRouter.get('/audit/users', requireRoles(['SUPER_ADMIN', 'ADMIN', 'INTERNAL_AUDITOR', 'AUDITOR']), grcController.getAuditUsers.bind(grcController));

// --- COMPLIANCE POLICIES ENDPOINTS ---
// Read policies: SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER, INTERNAL_AUDITOR, AUDITOR, TEACHER, STUDENT
grcRouter.get('/compliance/policies', grcController.getPolicies.bind(grcController));
// Manage policies: SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER
grcRouter.post('/compliance/policies', requireRoles(['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER']), grcController.createPolicy.bind(grcController));
grcRouter.put('/compliance/policies/:id', requireRoles(['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER']), grcController.updatePolicy.bind(grcController));

// --- RISK REGISTER ENDPOINTS ---
// Read risks: SUPER_ADMIN, ADMIN, RISK_MANAGER, COMPLIANCE_OFFICER, INTERNAL_AUDITOR, AUDITOR
grcRouter.get('/risks', requireRoles(['SUPER_ADMIN', 'ADMIN', 'RISK_MANAGER', 'COMPLIANCE_OFFICER', 'INTERNAL_AUDITOR', 'AUDITOR']), grcController.getRisks.bind(grcController));
// Manage risks: SUPER_ADMIN, ADMIN, RISK_MANAGER
grcRouter.post('/risks', requireRoles(['SUPER_ADMIN', 'ADMIN', 'RISK_MANAGER']), grcController.createRisk.bind(grcController));
grcRouter.put('/risks/:id', requireRoles(['SUPER_ADMIN', 'ADMIN', 'RISK_MANAGER']), grcController.updateRisk.bind(grcController));

// --- AUDIT EVIDENCE ENDPOINTS ---
// Read evidence: SUPER_ADMIN, ADMIN, INTERNAL_AUDITOR, AUDITOR, COMPLIANCE_OFFICER
grcRouter.get('/evidence', requireRoles(['SUPER_ADMIN', 'ADMIN', 'INTERNAL_AUDITOR', 'AUDITOR', 'COMPLIANCE_OFFICER']), grcController.getEvidence.bind(grcController));
// Upload evidence: SUPER_ADMIN, ADMIN, INTERNAL_AUDITOR, COMPLIANCE_OFFICER
grcRouter.post('/evidence', requireRoles(['SUPER_ADMIN', 'ADMIN', 'INTERNAL_AUDITOR', 'COMPLIANCE_OFFICER']), grcController.createEvidence.bind(grcController));
