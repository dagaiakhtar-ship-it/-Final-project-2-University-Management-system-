import { Request, Response } from 'express';
import { prisma } from '../services/db.service';
import { notifyWorkflowChange } from '../services/socket.service';

export class WorkflowController {
  // 1. Get all workflows
  async getWorkflows(req: Request, res: Response): Promise<void> {
    try {
      const { module } = req.query;
      const workflows = await prisma.workflow.findMany({
        where: module ? { module: String(module) } : undefined,
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(workflows);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to retrieve workflows', details: msg });
    }
  }

  // 2. Create a workflow
  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowCode, workflowName, module, version, description, active, steps } = req.body;

      if (!workflowCode || !workflowName || !module) {
        res.status(400).json({ error: 'Missing required workflow fields' });
        return;
      }

      // Check for duplicate workflowCode
      const existing = await prisma.workflow.findUnique({
        where: { workflowCode },
      });

      if (existing) {
        res.status(400).json({ error: `Workflow with code '${workflowCode}' already exists.` });
        return;
      }

      const workflow = await prisma.workflow.create({
        data: {
          workflowCode,
          workflowName,
          module,
          version: version || '1.0.0',
          description,
          active: active !== undefined ? active : true,
          createdBy: req.user?.email || 'System',
          steps: {
            create: (steps || []).map((step: { stepName: string; stepType: string; configuration?: string; order: number }) => ({
              stepName: step.stepName,
              stepType: step.stepType,
              configuration: step.configuration || '{}',
              order: step.order,
            })),
          },
        },
        include: {
          steps: { orderBy: { order: 'asc' } },
        },
      });

      notifyWorkflowChange('CREATED', workflow);
      res.status(201).json(workflow);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to create workflow', details: msg });
    }
  }

  // 3. Update an existing workflow
  async updateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { workflowName, module, version, description, active, steps } = req.body;

      // Delete existing steps first, then recreate
      await prisma.$transaction([
        prisma.workflowStep.deleteMany({
          where: { workflowId: Number(id) },
        }),
        prisma.workflow.update({
          where: { id: Number(id) },
          data: {
            workflowName,
            module,
            version,
            description,
            active,
            steps: {
              create: (steps || []).map((step: { stepName: string; stepType: string; configuration?: string; order: number }) => ({
                stepName: step.stepName,
                stepType: step.stepType,
                configuration: step.configuration || '{}',
                order: step.order,
              })),
            },
          },
        }),
      ]);

      const updatedWorkflow = await prisma.workflow.findUnique({
        where: { id: Number(id) },
        include: { steps: { orderBy: { order: 'asc' } } },
      });

      if (!updatedWorkflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      notifyWorkflowChange('UPDATED', updatedWorkflow);
      res.json(updatedWorkflow);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to update workflow', details: msg });
    }
  }

  // 4. Delete workflow
  async deleteWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.workflow.delete({
        where: { id: Number(id) },
      });
      res.json({ message: 'Workflow deleted successfully' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to delete workflow', details: msg });
    }
  }

  // 5. Get workflow templates
  async getTemplates(req: Request, res: Response): Promise<void> {
    const templates = [
      {
        workflowCode: 'STUDENT_ADMISSION_FLOW',
        workflowName: 'Student Admission Approval Workflow',
        module: 'Student Admissions',
        version: '1.0.0',
        description: 'Multi-level approval process for new student admissions involving department screening, committee review, and final Dean sign-off.',
        steps: [
          { order: 1, stepName: 'Start Submission', stepType: 'Start', configuration: '{}' },
          { order: 2, stepName: 'Department Verification', stepType: 'Approval', configuration: JSON.stringify({ role: 'DEPARTMENT_HEAD', label: 'Department Head Verification' }) },
          { order: 3, stepName: 'Committee Screening', stepType: 'Approval', configuration: JSON.stringify({ role: 'REGISTRAR', label: 'Registrar Committee screening' }) },
          { order: 4, stepName: 'Dean Endorsement', stepType: 'Approval', configuration: JSON.stringify({ role: 'DEAN', label: 'Dean Approval' }) },
          { order: 5, stepName: 'Notify Enrollment Success', stepType: 'Notification', configuration: JSON.stringify({ message: 'Admission approved and finalized.' }) },
          { order: 6, stepName: 'End Admission Process', stepType: 'End', configuration: '{}' },
        ],
      },
      {
        workflowCode: 'COURSE_REGISTRATION_OVERLOAD',
        workflowName: 'Course Registration Overload Approval Workflow',
        module: 'Student Registration',
        version: '1.0.0',
        description: 'Workflow to handle registration overload requests beyond maximum credits limit.',
        steps: [
          { order: 1, stepName: 'Start Registration Overload', stepType: 'Start', configuration: '{}' },
          { order: 2, stepName: 'Faculty Advisor Recommendation', stepType: 'Approval', configuration: JSON.stringify({ role: 'FACULTY', label: 'Faculty Advisor Review' }) },
          { order: 3, stepName: 'Department Head Endorsement', stepType: 'Approval', configuration: JSON.stringify({ role: 'DEPARTMENT_HEAD', label: 'Department Head Approval' }) },
          { order: 4, stepName: 'Registrar Final Approval', stepType: 'Approval', configuration: JSON.stringify({ role: 'REGISTRAR', label: 'Registrar Approval' }) },
          { order: 5, stepName: 'Notify Student Status', stepType: 'Notification', configuration: JSON.stringify({ message: 'Course overload request status changed.' }) },
          { order: 6, stepName: 'End Registration Process', stepType: 'End', configuration: '{}' },
        ],
      },
      {
        workflowCode: 'LEAVE_REQUEST_APPROVAL',
        workflowName: 'Faculty & Staff Leave Request Workflow',
        module: 'Leave Management',
        version: '1.0.0',
        description: 'Leaves request workflow requiring department head screening and HR Manager processing.',
        steps: [
          { order: 1, stepName: 'Leave Request Initiated', stepType: 'Start', configuration: '{}' },
          { order: 2, stepName: 'Department Head Screen', stepType: 'Approval', configuration: JSON.stringify({ role: 'DEPARTMENT_HEAD', label: 'Department Head approval' }) },
          { order: 3, stepName: 'HR Audit & Validation', stepType: 'Approval', configuration: JSON.stringify({ role: 'HR_MANAGER', label: 'HR Manager clearance' }) },
          { order: 4, stepName: 'Notify Approvals', stepType: 'Notification', configuration: JSON.stringify({ message: 'Leave request has been approved.' }) },
          { order: 5, stepName: 'End Leave Request', stepType: 'End', configuration: '{}' },
        ],
      },
      {
        workflowCode: 'PROCUREMENT_ORDER_FLOW',
        workflowName: 'Procurement Order Authorization',
        module: 'Procurement',
        version: '1.0.0',
        description: 'Corporate procurement authorization with sequential thresholds for Department heads and Finance Managers.',
        steps: [
          { order: 1, stepName: 'Requisition Initiated', stepType: 'Start', configuration: '{}' },
          { order: 2, stepName: 'Department Head Sign-off', stepType: 'Approval', configuration: JSON.stringify({ role: 'DEPARTMENT_HEAD', label: 'Department Head sign-off' }) },
          { order: 3, stepName: 'Finance Manager Release', stepType: 'Approval', configuration: JSON.stringify({ role: 'FINANCE_MANAGER', label: 'Finance Manager release' }) },
          { order: 4, stepName: 'Notify Purchase Team', stepType: 'Notification', configuration: JSON.stringify({ message: 'Purchase order is fully authorized.' }) },
          { order: 5, stepName: 'End Requisition', stepType: 'End', configuration: '{}' },
        ],
      },
    ];
    res.json(templates);
  }

  // 6. Execute a workflow
  async executeWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, entityId } = req.body;

      if (!workflowId) {
        res.status(400).json({ error: 'Missing workflowId' });
        return;
      }

      const workflow = await prisma.workflow.findUnique({
        where: { id: Number(workflowId) },
        include: { steps: { orderBy: { order: 'asc' } } },
      });

      if (!workflow) {
        res.status(404).json({ error: 'Workflow template not found' });
        return;
      }

      // Create workflow execution
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          entityId: entityId ? String(entityId) : null,
          status: 'Running',
          startedAt: new Date(),
        },
      });

      notifyWorkflowChange('EXECUTED', {
        executionId: execution.id,
        workflowId: workflow.id,
        workflowName: workflow.workflowName,
        status: 'Running',
      });

      // Run execution engine
      await runWorkflowEngine(execution.id);

      const updatedExec = await prisma.workflowExecution.findUnique({
        where: { id: execution.id },
        include: { approvals: true, workflow: true },
      });

      res.status(201).json(updatedExec);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to execute workflow', details: msg });
    }
  }

  // 7. Get all workflow executions
  async getExecutions(req: Request, res: Response): Promise<void> {
    try {
      const executions = await prisma.workflowExecution.findMany({
        include: {
          workflow: {
            include: { steps: { orderBy: { order: 'asc' } } },
          },
          approvals: true,
        },
        orderBy: { startedAt: 'desc' },
      });
      res.json(executions);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to retrieve workflow executions', details: msg });
    }
  }

  // 8. Get all approvals
  async getApprovals(req: Request, res: Response): Promise<void> {
    try {
      const approvals = await prisma.workflowApproval.findMany({
        include: {
          execution: {
            include: { workflow: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(approvals);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to retrieve approvals', details: msg });
    }
  }

  // 9. Approve a step
  async approveStep(req: Request, res: Response): Promise<void> {
    try {
      const { approvalId, comments } = req.body;

      if (!approvalId) {
        res.status(400).json({ error: 'Missing approvalId' });
        return;
      }

      const approval = await prisma.workflowApproval.findUnique({
        where: { id: Number(approvalId) },
        include: { execution: true },
      });

      if (!approval) {
        res.status(404).json({ error: 'Approval record not found' });
        return;
      }

      if (approval.decision !== 'Pending') {
        res.status(400).json({ error: 'This approval request has already been processed.' });
        return;
      }

      // Update approval decision
      await prisma.workflowApproval.update({
        where: { id: Number(approvalId) },
        data: {
          decision: 'Approved',
          comments,
          approvedAt: new Date(),
        },
      });

      notifyWorkflowChange('APPROVED', {
        executionId: approval.executionId,
        approvalId: approval.id,
        level: approval.approvalLevel,
        comments,
      });

      // Advance workflow execution
      await runWorkflowEngine(approval.executionId);

      const updatedExec = await prisma.workflowExecution.findUnique({
        where: { id: approval.executionId },
        include: { approvals: true, workflow: true },
      });

      res.json(updatedExec);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to approve step', details: msg });
    }
  }

  // 10. Reject a step
  async rejectStep(req: Request, res: Response): Promise<void> {
    try {
      const { approvalId, comments } = req.body;

      if (!approvalId) {
        res.status(400).json({ error: 'Missing approvalId' });
        return;
      }

      const approval = await prisma.workflowApproval.findUnique({
        where: { id: Number(approvalId) },
        include: { execution: true },
      });

      if (!approval) {
        res.status(404).json({ error: 'Approval record not found' });
        return;
      }

      if (approval.decision !== 'Pending') {
        res.status(400).json({ error: 'This approval request has already been processed.' });
        return;
      }

      // Update approval decision
      await prisma.workflowApproval.update({
        where: { id: Number(approvalId) },
        data: {
          decision: 'Rejected',
          comments,
          approvedAt: new Date(),
        },
      });

      // Mark workflow execution as rejected
      await prisma.workflowExecution.update({
        where: { id: approval.executionId },
        data: {
          status: 'Rejected',
          completedAt: new Date(),
        },
      });

      notifyWorkflowChange('REJECTED', {
        executionId: approval.executionId,
        approvalId: approval.id,
        level: approval.approvalLevel,
        comments,
      });

      const updatedExec = await prisma.workflowExecution.findUnique({
        where: { id: approval.executionId },
        include: { approvals: true, workflow: true },
      });

      res.json(updatedExec);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to reject step', details: msg });
    }
  }
}

// BPMN-inspired workflow execution engine core logic
async function runWorkflowEngine(executionId: number): Promise<void> {
  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        include: { steps: { orderBy: { order: 'asc' } } },
      },
      approvals: true,
    },
  });

  if (!execution || execution.status === 'Completed' || execution.status === 'Rejected' || execution.status === 'Cancelled' || execution.status === 'Failed') {
    return;
  }

  const steps = execution.workflow.steps;
  const approvals = execution.approvals;

  // Find any active pending approval
  const pendingApproval = approvals.find((a) => a.decision === 'Pending');
  if (pendingApproval) {
    // We are actively waiting for an approval, halt execution progression
    if (execution.status !== 'WaitingApproval') {
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: 'WaitingApproval' },
      });
    }
    return;
  }

  // Count approvals and identify completed steps
  const approvedLevels = approvals.filter((a) => a.decision === 'Approved').map((a) => a.approvalLevel);
  const maxApprovedLevel = approvedLevels.length > 0 ? Math.max(...approvedLevels) : 0;

  let currentApprovalCount = 0;

  for (const step of steps) {
    if (step.stepType === 'Start') {
      continue;
    }

    if (step.stepType === 'Approval') {
      currentApprovalCount++;
      if (currentApprovalCount > maxApprovedLevel) {
        // We found the next required approval level! Trigger approval request
        let stepConfig: { role?: string; approverId?: number } = {};
        try {
          stepConfig = JSON.parse(step.configuration);
        } catch {
          stepConfig = {};
        }

        // Assign to a standard user ID or role mock-up (e.g. default ID 1)
        const approverId = stepConfig.approverId || 1;

        await prisma.workflowApproval.create({
          data: {
            executionId,
            approverId,
            approvalLevel: currentApprovalCount,
            decision: 'Pending',
          },
        });

        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { status: 'WaitingApproval' },
        });

        notifyWorkflowChange('APPROVAL_REQUESTED', {
          executionId,
          approverId,
          level: currentApprovalCount,
          stepName: step.stepName,
        });

        return; // Halt execution until approved
      }
      continue; // Skip already approved steps
    }

    if (step.stepType === 'Notification') {
      let config: { message?: string } = {};
      try {
        config = JSON.parse(step.configuration);
      } catch {
        config = {};
      }
      console.log(`[Workflow Engine Notification]: ${config.message || 'Workflow step milestone reached'}`);
      continue;
    }

    if (step.stepType === 'Timer' || step.stepType === 'Delay') {
      // Simulate real delay logs
      console.log(`[Workflow Engine Timer/Delay]: Active delay simulated on step ${step.stepName}`);
      continue;
    }

    if (step.stepType === 'End') {
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'Completed',
          completedAt: new Date(),
        },
      });

      notifyWorkflowChange('UPDATED', {
        executionId,
        status: 'Completed',
      });
      return;
    }
  }

  // Fallback: If we parsed all steps successfully
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      status: 'Completed',
      completedAt: new Date(),
    },
  });

  notifyWorkflowChange('UPDATED', {
    executionId,
    status: 'Completed',
  });
}

export const workflowController = new WorkflowController();
