import { Request, Response, NextFunction } from 'express';
import { subjectService } from '../services/subject.service';
import { prisma } from '../services/db.service';
import {
  createSubjectSchema,
  updateSubjectSchema,
  updateSubjectStatusSchema,
} from '../validators/subject.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class SubjectController {
  /**
   * GET /api/subjects
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const subjectType = req.query.subjectType as string | undefined;
      const category = req.query.category as string | undefined;

      const departmentId = req.query.departmentId
        ? parseInt(req.query.departmentId as string, 10)
        : undefined;
      const programId = req.query.programId
        ? parseInt(req.query.programId as string, 10)
        : undefined;
      const semesterId = req.query.semesterId
        ? parseInt(req.query.semesterId as string, 10)
        : undefined;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await subjectService.getSubjects({
        search,
        status,
        subjectType,
        category,
        departmentId,
        programId,
        semesterId,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subjects/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const subject = await subjectService.getSubjectByUuid(id);

      res.status(200).json({
        status: 'success',
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/programs/:programId/subjects
   */
  async getByProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { programId } = req.params;
      const progId = parseInt(programId, 10);
      if (isNaN(progId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid Program ID',
        });
        return;
      }

      const subjects = await subjectService.getSubjectsByProgramId(progId);

      res.status(200).json({
        status: 'success',
        data: subjects,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/semesters/:semesterId/subjects
   */
  async getBySemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { semesterId } = req.params;
      const semId = parseInt(semesterId, 10);
      if (isNaN(semId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid Semester ID',
        });
        return;
      }

      const subjects = await subjectService.getSubjectsBySemesterId(semId);

      res.status(200).json({
        status: 'success',
        data: subjects,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subjects-list/all
   * Fetches potential prerequisite subjects
   */
  async getPrerequisites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjects = await prisma.subject.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        select: {
          id: true,
          uuid: true,
          name: true,
          code: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.status(200).json({
        status: 'success',
        data: subjects,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subjects
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const parsedBody = createSubjectSchema.parse(req.body);
      const subject = await subjectService.createSubject(parsedBody, req.user.userId);

      res.status(201).json({
        status: 'success',
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/subjects/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateSubjectSchema.parse(req.body);
      const subject = await subjectService.updateSubjectByUuid(id, parsedBody, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/subjects/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await subjectService.deleteSubjectByUuid(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Subject deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/subjects/:id/status
   */
  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const { status } = updateSubjectStatusSchema.parse(req.body);
      const subject = await subjectService.toggleSubjectStatus(id, status, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subjectController = new SubjectController();
