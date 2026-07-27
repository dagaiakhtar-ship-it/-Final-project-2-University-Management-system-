import { Request, Response, NextFunction } from 'express';
import { semesterService } from '../services/semester.service';
import { prisma } from '../services/db.service';
import {
  createSemesterSchema,
  updateSemesterSchema,
  updateSemesterStatusSchema,
} from '../validators/semester.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class SemesterController {
  /**
   * GET /api/semesters
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const semesterType = req.query.semesterType as 'REGULAR' | 'SUMMER' | 'WINTER' | undefined;

      const programId = req.query.programId
        ? parseInt(req.query.programId as string, 10)
        : undefined;
      const academicYearId = req.query.academicYearId
        ? parseInt(req.query.academicYearId as string, 10)
        : undefined;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await semesterService.getSemesters({
        search,
        status,
        programId,
        academicYearId,
        semesterType,
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
   * GET /api/semesters/academic-years
   */
  async getAcademicYears(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const academicYears = await prisma.academicYear.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'desc' },
      });
      res.status(200).json({
        status: 'success',
        data: academicYears,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/semesters/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const semester = await semesterService.getSemesterByUuid(id);

      res.status(200).json({
        status: 'success',
        data: semester,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/programs/:programId/semesters
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

      const semesters = await semesterService.getSemestersByProgramId(progId);

      res.status(200).json({
        status: 'success',
        data: semesters,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/semesters
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const parsedBody = createSemesterSchema.parse(req.body);
      const semester = await semesterService.createSemester(parsedBody, req.user.userId);

      res.status(201).json({
        status: 'success',
        message: 'Semester created successfully',
        data: semester,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/semesters/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateSemesterSchema.parse(req.body);
      const semester = await semesterService.updateSemesterByUuid(id, parsedBody, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Semester updated successfully',
        data: semester,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/semesters/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateSemesterStatusSchema.parse(req.body);
      const semester = await semesterService.updateSemesterStatusByUuid(
        id,
        parsedBody.status,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        message: 'Semester status updated successfully',
        data: semester,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/semesters/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await semesterService.deleteSemesterByUuid(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Semester soft-deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const semesterController = new SemesterController();
