import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const workflowRouter = Router();

// Secure all workflow endpoints using authentication middleware
workflowRouter.use(authenticate);

// Workflow Definition management
workflowRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  workflowController.getWorkflows
);

workflowRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  workflowController.createWorkflow
);

workflowRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  workflowController.updateWorkflow
);

workflowRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  workflowController.deleteWorkflow
);

// Workflow Templates
workflowRouter.get(
  '/templates',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  workflowController.getTemplates
);

// Workflow Execution & Approvals
workflowRouter.post(
  '/execute',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  workflowController.executeWorkflow
);

workflowRouter.get(
  '/executions',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  workflowController.getExecutions
);

workflowRouter.get(
  '/approvals',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  workflowController.getApprovals
);

workflowRouter.post(
  '/approve',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  workflowController.approveStep
);

workflowRouter.post(
  '/reject',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  workflowController.rejectStep
);
