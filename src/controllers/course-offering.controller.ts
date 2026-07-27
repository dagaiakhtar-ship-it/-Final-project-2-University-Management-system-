import { Request, Response, NextFunction } from 'express';
import { courseOfferingService } from '../services/course-offering.service';
import { prisma } from '../services/db.service';
import {
  createCourseOfferingSchema,
  updateCourseOfferingSchema,
  updateCourseOfferingStatusSchema,
} from '../validators/course-offering.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class CourseOfferingController {
  /**
   * GET /api/course-offerings/lookup-options
   */
  async getLookupOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [departments, programs, semesters, sections, subjects, teachers] = await Promise.all([
        prisma.department.findMany({ where: { deletedAt: null }, select: { id: true, name: true, code: true } }),
        prisma.program.findMany({ where: { deletedAt: null }, select: { id: true, name: true, code: true, departmentId: true } }),
        prisma.semester.findMany({ where: { deletedAt: null }, select: { id: true, name: true, code: true, programId: true } }),
        prisma.section.findMany({ where: { deletedAt: null }, select: { id: true, name: true, code: true, semesterId: true } }),
        prisma.subject.findMany({ where: { deletedAt: null }, select: { id: true, name: true, code: true } }),
        prisma.teacher.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            uuid: true,
            employeeId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          departments,
          programs,
          semesters,
          sections,
          subjects,
          teachers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/course-offerings
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const session = req.query.session as string | undefined;
      const academicYear = req.query.academicYear as string | undefined;

      const departmentId = req.query.departmentId
        ? parseInt(req.query.departmentId as string, 10)
        : undefined;
      const programId = req.query.programId
        ? parseInt(req.query.programId as string, 10)
        : undefined;
      const semesterId = req.query.semesterId
        ? parseInt(req.query.semesterId as string, 10)
        : undefined;
      const sectionId = req.query.sectionId
        ? parseInt(req.query.sectionId as string, 10)
        : undefined;
      const subjectId = req.query.subjectId
        ? parseInt(req.query.subjectId as string, 10)
        : undefined;
      const teacherId = req.query.teacherId
        ? parseInt(req.query.teacherId as string, 10)
        : undefined;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await courseOfferingService.getCourseOfferings({
        search,
        status,
        session,
        academicYear,
        departmentId,
        programId,
        semesterId,
        sectionId,
        subjectId,
        teacherId,
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
   * GET /api/course-offerings/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const offering = await courseOfferingService.getCourseOfferingByUuid(id);

      res.status(200).json({
        status: 'success',
        data: offering,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/course-offerings
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const parsedBody = createCourseOfferingSchema.parse(req.body);
      const offering = await courseOfferingService.createCourseOffering(parsedBody, req.user.userId);

      res.status(201).json({
        status: 'success',
        data: offering,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/course-offerings/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateCourseOfferingSchema.parse(req.body);
      const offering = await courseOfferingService.updateCourseOffering(id, parsedBody, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: offering,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/course-offerings/:id/status
   */
  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const { status } = updateCourseOfferingStatusSchema.parse(req.body);
      const offering = await courseOfferingService.toggleCourseOfferingStatus(id, status, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: offering,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/course-offerings/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await courseOfferingService.deleteCourseOffering(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Course offering soft deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/teachers/:teacherId/course-offerings
   */
  async getByTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { teacherId } = req.params;
      const tId = parseInt(teacherId, 10);
      if (isNaN(tId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid Teacher ID',
        });
        return;
      }

      const offerings = await courseOfferingService.getByTeacher(tId);

      res.status(200).json({
        status: 'success',
        data: offerings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sections/:sectionId/course-offerings
   */
  async getBySection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sectionId } = req.params;
      const sId = parseInt(sectionId, 10);
      if (isNaN(sId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid Section ID',
        });
        return;
      }

      const offerings = await courseOfferingService.getBySection(sId);

      res.status(200).json({
        status: 'success',
        data: offerings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subjects/:subjectId/course-offerings
   */
  async getBySubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.params;
      const sId = parseInt(subjectId, 10);
      if (isNaN(sId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid Subject ID',
        });
        return;
      }

      const offerings = await courseOfferingService.getBySubject(sId);

      res.status(200).json({
        status: 'success',
        data: offerings,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const courseOfferingController = new CourseOfferingController();
