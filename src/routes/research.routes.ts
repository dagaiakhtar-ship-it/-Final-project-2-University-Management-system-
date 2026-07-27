import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.service';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { getSocketServer } from '../services/socket.service';
import { auditService } from '../services/audit.service';
import { AppError } from '../errors/auth.errors';

export const researchRouter = Router();

// Zod Validation Schemas
const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  abstract: z.string().min(1, 'Abstract is required'),
  principalInvestigatorId: z.coerce.number(),
  departmentId: z.coerce.number(),
  researchArea: z.string().min(1, 'Research Area is required'),
  startDate: z.string().min(1, 'Start Date is required'),
  endDate: z.string().min(1, 'End Date is required'),
  totalBudget: z.coerce.number().min(0).default(0),
  utilizedBudget: z.coerce.number().min(0).default(0),
  fundingSourceId: z.coerce.number().optional().nullable(),
  status: z.enum(['Draft', 'Submitted', 'Approved', 'Active', 'On Hold', 'Completed', 'Cancelled']).default('Draft'),
});

const updateProjectSchema = createProjectSchema.partial();

const createGrantSchema = z.object({
  fundingAgency: z.string().min(1, 'Funding Agency is required'),
  grantTitle: z.string().min(1, 'Grant Title is required'),
  amount: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  applicationDeadline: z.string().min(1, 'Application Deadline is required'),
  awardDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['Open', 'Applied', 'Awarded', 'Rejected', 'Closed']).default('Open'),
});

const updateGrantSchema = createGrantSchema.partial();

const createPublicationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  publicationType: z.enum(['Journal', 'Conference', 'Book', 'Chapter', 'Patent', 'Thesis']),
  publisher: z.string().optional().nullable(),
  publicationDate: z.string().min(1, 'Publication Date is required'),
  doi: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  indexedIn: z.string().optional().nullable(),
  projectId: z.coerce.number().optional().nullable(),
});

const createEthicsSchema = z.object({
  projectId: z.coerce.number(),
  applicationDate: z.string().optional(),
  committeeDecision: z.enum(['Pending', 'Approved', 'Rejected', 'Revision Required']).default('Pending'),
  approvalNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

const updateEthicsSchema = createEthicsSchema.partial();

// Socket Helper
function emitResearchNotification(action: string, payload: any) {
  try {
    const io = getSocketServer();
    if (io) {
      io.emit('research:changed', { action, payload });
    }
  } catch (err) {
    console.error('Failed to emit socket notification:', err);
  }
}

// ---------------------------------------------------------
// Research Projects Endpoints
// ---------------------------------------------------------

researchRouter.get(
  '/projects',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId, status, search } = req.query;

      const whereClause: any = {};
      if (departmentId) {
        whereClause.departmentId = parseInt(departmentId as string, 10);
      }
      if (status) {
        whereClause.status = status as string;
      }
      if (search) {
        whereClause.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { projectCode: { contains: search as string, mode: 'insensitive' } },
          { researchArea: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const projects = await prisma.researchProject.findMany({
        where: whereClause,
        include: {
          principalInvestigator: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          department: true,
          fundingSource: true,
          publications: true,
          ethicsApprovals: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: projects });
    } catch (err) {
      next(err);
    }
  }
);

researchRouter.post(
  '/projects',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = createProjectSchema.parse(req.body);

      // Auto generate code
      const count = await prisma.researchProject.count();
      const projectCode = `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const dataToCreate = {
        projectCode,
        title: parsedBody.title,
        abstract: parsedBody.abstract,
        principalInvestigatorId: parsedBody.principalInvestigatorId,
        departmentId: parsedBody.departmentId,
        researchArea: parsedBody.researchArea,
        startDate: new Date(parsedBody.startDate),
        endDate: new Date(parsedBody.endDate),
        totalBudget: parsedBody.totalBudget,
        utilizedBudget: parsedBody.utilizedBudget,
        fundingSourceId: parsedBody.fundingSourceId || null,
        status: parsedBody.status,
      };

      const project = await prisma.researchProject.create({
        data: dataToCreate,
        include: {
          principalInvestigator: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          department: true,
          fundingSource: true,
        },
      });

      // Audit log & Notifications
      await auditService.log({
        action: parsedBody.status === 'Submitted' ? 'Proposal Submitted' : 'Project Created',
        tableName: 'ResearchProject',
        recordId: project.id.toString(),
        newValue: project,
        userId: req.user?.userId,
      });

      emitResearchNotification(
        parsedBody.status === 'Submitted' ? 'PROPOSAL_SUBMITTED' : 'PROJECT_CREATED',
        project
      );

      res.status(201).json({ status: 'success', data: project });
    } catch (err) {
      next(err);
    }
  }
);

researchRouter.put(
  '/projects/:id',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.id, 10);
      const original = await prisma.researchProject.findUnique({
        where: { id: projectId },
      });

      if (!original) {
        throw new AppError('Research project not found', 404, 'NOT_FOUND');
      }

      const parsedBody = updateProjectSchema.parse(req.body);

      const dataToUpdate: any = {};
      if (parsedBody.title !== undefined) dataToUpdate.title = parsedBody.title;
      if (parsedBody.abstract !== undefined) dataToUpdate.abstract = parsedBody.abstract;
      if (parsedBody.principalInvestigatorId !== undefined) dataToUpdate.principalInvestigatorId = parsedBody.principalInvestigatorId;
      if (parsedBody.departmentId !== undefined) dataToUpdate.departmentId = parsedBody.departmentId;
      if (parsedBody.researchArea !== undefined) dataToUpdate.researchArea = parsedBody.researchArea;
      if (parsedBody.startDate !== undefined) dataToUpdate.startDate = new Date(parsedBody.startDate);
      if (parsedBody.endDate !== undefined) dataToUpdate.endDate = new Date(parsedBody.endDate);
      if (parsedBody.totalBudget !== undefined) dataToUpdate.totalBudget = parsedBody.totalBudget;
      if (parsedBody.utilizedBudget !== undefined) dataToUpdate.utilizedBudget = parsedBody.utilizedBudget;
      if (parsedBody.fundingSourceId !== undefined) dataToUpdate.fundingSourceId = parsedBody.fundingSourceId || null;
      if (parsedBody.status !== undefined) dataToUpdate.status = parsedBody.status;

      const updated = await prisma.researchProject.update({
        where: { id: projectId },
        data: dataToUpdate,
        include: {
          principalInvestigator: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          department: true,
          fundingSource: true,
        },
      });

      // Track actions for Audit Log and Sockets
      let actionName = 'Project Updated';
      let socketEvent = 'PROJECT_UPDATED';

      if (original.status !== updated.status) {
        if (updated.status === 'Approved') {
          actionName = 'Proposal Approved';
          socketEvent = 'PROPOSAL_APPROVED';
        } else if (updated.status === 'Submitted') {
          actionName = 'Proposal Submitted';
          socketEvent = 'PROPOSAL_SUBMITTED';
        }
      }

      if (original.utilizedBudget !== updated.utilizedBudget) {
        actionName = 'Budget Updated';
        socketEvent = 'BUDGET_UPDATED';
      }

      await auditService.log({
        action: actionName,
        tableName: 'ResearchProject',
        recordId: updated.id.toString(),
        oldValue: original,
        newValue: updated,
        userId: req.user?.userId,
      });

      emitResearchNotification(socketEvent, updated);

      res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  }
);

researchRouter.delete(
  '/projects/:id',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.id, 10);
      const original = await prisma.researchProject.findUnique({
        where: { id: projectId },
      });

      if (!original) {
        throw new AppError('Research project not found', 404, 'NOT_FOUND');
      }

      await prisma.researchProject.delete({
        where: { id: projectId },
      });

      await auditService.log({
        action: 'Project Deleted',
        tableName: 'ResearchProject',
        recordId: projectId.toString(),
        oldValue: original,
        userId: req.user?.userId,
      });

      emitResearchNotification('PROJECT_DELETED', { id: projectId });

      res.status(200).json({ status: 'success', message: 'Project deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------
// Grants Endpoints
// ---------------------------------------------------------

researchRouter.get(
  '/grants',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, search } = req.query;

      const whereClause: any = {};
      if (status) {
        whereClause.status = status as string;
      }
      if (search) {
        whereClause.OR = [
          { grantTitle: { contains: search as string, mode: 'insensitive' } },
          { fundingAgency: { contains: search as string, mode: 'insensitive' } },
          { grantCode: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const grants = await prisma.grant.findMany({
        where: whereClause,
        include: {
          projects: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: grants });
    } catch (err) {
      next(err);
    }
  }
);

researchRouter.post(
  '/grants',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = createGrantSchema.parse(req.body);

      // Auto generate code
      const count = await prisma.grant.count();
      const grantCode = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const dataToCreate = {
        grantCode,
        fundingAgency: parsedBody.fundingAgency,
        grantTitle: parsedBody.grantTitle,
        amount: parsedBody.amount,
        currency: parsedBody.currency,
        applicationDeadline: new Date(parsedBody.applicationDeadline),
        awardDate: parsedBody.awardDate ? new Date(parsedBody.awardDate) : null,
        startDate: parsedBody.startDate ? new Date(parsedBody.startDate) : null,
        endDate: parsedBody.endDate ? new Date(parsedBody.endDate) : null,
        status: parsedBody.status,
      };

      const grant = await prisma.grant.create({
        data: dataToCreate,
      });

      await auditService.log({
        action: parsedBody.status === 'Awarded' ? 'Grant Awarded' : 'Grant Created',
        tableName: 'Grant',
        recordId: grant.id.toString(),
        newValue: grant,
        userId: req.user?.userId,
      });

      emitResearchNotification(parsedBody.status === 'Awarded' ? 'GRANT_AWARDED' : 'GRANT_CREATED', grant);

      res.status(201).json({ status: 'success', data: grant });
    } catch (err) {
      next(err);
    }
  }
);

researchRouter.put(
  '/grants/:id',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const grantId = parseInt(req.params.id, 10);
      const original = await prisma.grant.findUnique({
        where: { id: grantId },
      });

      if (!original) {
        throw new AppError('Grant not found', 404, 'NOT_FOUND');
      }

      const parsedBody = updateGrantSchema.parse(req.body);

      const dataToUpdate: any = {};
      if (parsedBody.fundingAgency !== undefined) dataToUpdate.fundingAgency = parsedBody.fundingAgency;
      if (parsedBody.grantTitle !== undefined) dataToUpdate.grantTitle = parsedBody.grantTitle;
      if (parsedBody.amount !== undefined) dataToUpdate.amount = parsedBody.amount;
      if (parsedBody.currency !== undefined) dataToUpdate.currency = parsedBody.currency;
      if (parsedBody.applicationDeadline !== undefined) dataToUpdate.applicationDeadline = new Date(parsedBody.applicationDeadline);
      if (parsedBody.awardDate !== undefined) dataToUpdate.awardDate = parsedBody.awardDate ? new Date(parsedBody.awardDate) : null;
      if (parsedBody.startDate !== undefined) dataToUpdate.startDate = parsedBody.startDate ? new Date(parsedBody.startDate) : null;
      if (parsedBody.endDate !== undefined) dataToUpdate.endDate = parsedBody.endDate ? new Date(parsedBody.endDate) : null;
      if (parsedBody.status !== undefined) dataToUpdate.status = parsedBody.status;

      const updated = await prisma.grant.update({
        where: { id: grantId },
        data: dataToUpdate,
      });

      let actionName = 'Grant Updated';
      let socketEvent = 'GRANT_UPDATED';

      if (original.status !== updated.status && updated.status === 'Awarded') {
        actionName = 'Grant Awarded';
        socketEvent = 'GRANT_AWARDED';
      }

      await auditService.log({
        action: actionName,
        tableName: 'Grant',
        recordId: updated.id.toString(),
        oldValue: original,
        newValue: updated,
        userId: req.user?.userId,
      });

      emitResearchNotification(socketEvent, updated);

      res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------
// Publications Endpoints
// ---------------------------------------------------------

researchRouter.get(
  '/publications',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, search } = req.query;

      const whereClause: any = {};
      if (projectId) {
        whereClause.projectId = parseInt(projectId as string, 10);
      }
      if (search) {
        whereClause.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { publisher: { contains: search as string, mode: 'insensitive' } },
          { doi: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const publications = await prisma.publication.findMany({
        where: whereClause,
        include: {
          project: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: publications });
    } catch (err) {
      next(err);
    }
  }
);

researchRouter.post(
  '/publications',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = createPublicationSchema.parse(req.body);

      const dataToCreate = {
        title: parsedBody.title,
        publicationType: parsedBody.publicationType,
        publisher: parsedBody.publisher || null,
        publicationDate: new Date(parsedBody.publicationDate),
        doi: parsedBody.doi || null,
        isbn: parsedBody.isbn || null,
        indexedIn: parsedBody.indexedIn || null,
        projectId: parsedBody.projectId || null,
      };

      const publication = await prisma.publication.create({
        data: dataToCreate,
        include: {
          project: true,
        },
      });

      await auditService.log({
        action: 'Publication Added',
        tableName: 'Publication',
        recordId: publication.id.toString(),
        newValue: publication,
        userId: req.user?.userId,
      });

      emitResearchNotification('PUBLICATION_ADDED', publication);

      res.status(201).json({ status: 'success', data: publication });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------
// Research Ethics Endpoints
// ---------------------------------------------------------

researchRouter.get(
  '/ethics',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, committeeDecision } = req.query;

      const whereClause: any = {};
      if (projectId) {
        whereClause.projectId = parseInt(projectId as string, 10);
      }
      if (committeeDecision) {
        whereClause.committeeDecision = committeeDecision as string;
      }

      const ethics = await prisma.researchEthics.findMany({
        where: whereClause,
        include: {
          project: {
            include: {
              principalInvestigator: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: ethics });
    } catch (err) {
      next(err);
    }
  }
);

researchRouter.post(
  '/ethics',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = createEthicsSchema.parse(req.body);

      const dataToCreate = {
        projectId: parsedBody.projectId,
        applicationDate: parsedBody.applicationDate ? new Date(parsedBody.applicationDate) : new Date(),
        committeeDecision: parsedBody.committeeDecision,
        approvalNumber: parsedBody.approvalNumber || null,
        expiryDate: parsedBody.expiryDate ? new Date(parsedBody.expiryDate) : null,
      };

      const ethics = await prisma.researchEthics.create({
        data: dataToCreate,
        include: {
          project: true,
        },
      });

      await auditService.log({
        action: 'Ethics Application Submitted',
        tableName: 'ResearchEthics',
        recordId: ethics.id.toString(),
        newValue: ethics,
        userId: req.user?.userId,
      });

      emitResearchNotification('ETHICS_SUBMITTED', ethics);

      res.status(201).json({ status: 'success', data: ethics });
    } catch (err) {
      next(err);
    }
  }
);

researchRouter.put(
  '/ethics/:id',
  authenticate,
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ethicsId = parseInt(req.params.id, 10);
      const original = await prisma.researchEthics.findUnique({
        where: { id: ethicsId },
      });

      if (!original) {
        throw new AppError('Ethics application not found', 404, 'NOT_FOUND');
      }

      const parsedBody = updateEthicsSchema.parse(req.body);

      const dataToUpdate: any = {};
      if (parsedBody.projectId !== undefined) dataToUpdate.projectId = parsedBody.projectId;
      if (parsedBody.applicationDate !== undefined) dataToUpdate.applicationDate = parsedBody.applicationDate ? new Date(parsedBody.applicationDate) : new Date();
      if (parsedBody.committeeDecision !== undefined) dataToUpdate.committeeDecision = parsedBody.committeeDecision;
      if (parsedBody.approvalNumber !== undefined) dataToUpdate.approvalNumber = parsedBody.approvalNumber || null;
      if (parsedBody.expiryDate !== undefined) dataToUpdate.expiryDate = parsedBody.expiryDate ? new Date(parsedBody.expiryDate) : null;

      const updated = await prisma.researchEthics.update({
        where: { id: ethicsId },
        data: dataToUpdate,
        include: {
          project: true,
        },
      });

      let actionName = 'Ethics Application Updated';
      let socketEvent = 'ETHICS_UPDATED';

      if (original.committeeDecision !== updated.committeeDecision) {
        if (updated.committeeDecision === 'Approved') {
          actionName = 'Ethics Approved';
          socketEvent = 'ETHICS_APPROVED';
        } else {
          actionName = 'Ethics Review Status';
          socketEvent = 'ETHICS_REVIEW_STATUS';
        }
      }

      await auditService.log({
        action: actionName,
        tableName: 'ResearchEthics',
        recordId: updated.id.toString(),
        oldValue: original,
        newValue: updated,
        userId: req.user?.userId,
      });

      emitResearchNotification(socketEvent, updated);

      res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  }
);
