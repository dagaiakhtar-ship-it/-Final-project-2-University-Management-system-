import { Request, Response, NextFunction } from 'express';
import { SectionService } from '../services/section.service';
import { prisma } from '../services/db.service';
import {
  createSectionSchema,
  updateSectionSchema,
  updateSectionStatusSchema,
} from '../validators/section.validators';
import { UnauthorizedError } from '../errors/auth.errors';

const sectionService = new SectionService();

export class SectionController {
  /**
   * GET /api/sections
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const shift = req.query.shift as 'MORNING' | 'EVENING' | undefined;

      const semesterId = req.query.semesterId
        ? parseInt(req.query.semesterId as string, 10)
        : undefined;
      const programId = req.query.programId
        ? parseInt(req.query.programId as string, 10)
        : undefined;
      const departmentId = req.query.departmentId
        ? parseInt(req.query.departmentId as string, 10)
        : undefined;
      const academicYearId = req.query.academicYearId
        ? parseInt(req.query.academicYearId as string, 10)
        : undefined;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await sectionService.getSections({
        search,
        status,
        shift,
        semesterId,
        programId,
        departmentId,
        academicYearId,
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
   * GET /api/sections/teachers
   * Retrieves teachers for the class advisor dropdown
   */
  async getTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teachers = await prisma.teacher.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          user: {
            firstName: 'asc',
          },
        },
      });

      res.status(200).json({
        status: 'success',
        data: teachers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sections/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const section = await sectionService.getSectionByUuid(id);

      res.status(200).json({
        status: 'success',
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/semesters/:semesterId/sections
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

      const sections = await sectionService.getSectionsBySemesterId(semId);

      res.status(200).json({
        status: 'success',
        data: sections,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sections
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const parsedBody = createSectionSchema.parse(req.body);
      const section = await sectionService.createSection(parsedBody, req.user.userId);

      res.status(201).json({
        status: 'success',
        message: 'Section created successfully',
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/sections/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateSectionSchema.parse(req.body);
      const section = await sectionService.updateSectionByUuid(id, parsedBody, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Section updated successfully',
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/sections/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateSectionStatusSchema.parse(req.body);
      const section = await sectionService.updateSectionStatusByUuid(
        id,
        parsedBody.status,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        message: 'Section status updated successfully',
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/sections/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await sectionService.deleteSectionByUuid(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Section soft-deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const sectionController = new SectionController();
