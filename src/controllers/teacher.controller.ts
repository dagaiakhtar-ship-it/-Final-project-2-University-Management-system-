import { Request, Response, NextFunction } from 'express';
import { teacherService } from '../services/teacher.service';
import { prisma } from '../services/db.service';
import {
  createTeacherSchema,
  updateTeacherSchema,
  updateTeacherStatusSchema,
} from '../validators/teacher.validators';
import { UnauthorizedError, ForbiddenError } from '../errors/auth.errors';

function sanitizeValue(val: any): any {
  if (typeof val === 'string') {
    return val
      .trim()
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Strip script tags
      .replace(/<\/?[^>]+(>|$)/g, ''); // Strip remaining HTML tags
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === 'object') {
    const res: any = {};
    for (const k of Object.keys(val)) {
      res[k] = sanitizeValue(val[k]);
    }
    return res;
  }
  return val;
}

export class TeacherController {
  /**
   * GET /api/teachers/lookup-options
   * Returns departments and users of role TEACHER without a teacher profile
   */
  async getLookupOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [departments, eligibleUsers] = await Promise.all([
        prisma.department.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, code: true },
        }),
        prisma.user.findMany({
          where: {
            deletedAt: null,
            isActive: true,
            role: { name: 'TEACHER' },
            teacher: null, // Only users who don't already have a teacher profile
          },
          select: {
            id: true,
            uuid: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          departments,
          eligibleUsers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/teachers
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const employmentType = req.query.employmentType as string | undefined;
      const designation = req.query.designation as string | undefined;

      const departmentId = req.query.departmentId
        ? parseInt(req.query.departmentId as string, 10)
        : undefined;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await teacherService.getTeachers({
        search,
        status,
        employmentType,
        designation,
        departmentId,
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
   * GET /api/teachers/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const teacher = await teacherService.getTeacherByUuid(id);

      // Super Admin and Admin have full access. Teachers can view their own profile.
      if (req.user?.role === 'TEACHER' && req.user.userId !== teacher.userId) {
        throw new ForbiddenError('You are not authorized to view another teacher\'s profile');
      }

      res.status(200).json({
        status: 'success',
        data: teacher,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/teachers
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const sanitizedBody = sanitizeValue(req.body);
      const parsedBody = createTeacherSchema.parse(sanitizedBody);
      const teacher = await teacherService.createTeacher(parsedBody, req.user.userId, req.user.email);

      res.status(201).json({
        status: 'success',
        data: teacher,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/teachers/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const existing = await teacherService.getTeacherByUuid(id);

      const sanitizedBody = sanitizeValue(req.body);

      // Teachers can edit limited personal information of their own profile
      if (req.user.role === 'TEACHER') {
        if (req.user.userId !== existing.userId) {
          throw new ForbiddenError('You are not authorized to edit this profile');
        }
        // Restrict teacher edits to personal fields
        const restrictedBody = {
          qualification: sanitizedBody.qualification,
          specialization: sanitizedBody.specialization,
          officeLocation: sanitizedBody.officeLocation,
          officePhone: sanitizedBody.officePhone,
          emergencyContact: sanitizedBody.emergencyContact,
          biography: sanitizedBody.biography,
          profilePhoto: sanitizedBody.profilePhoto,
        };
        const parsedBody = updateTeacherSchema.parse(restrictedBody);
        const updated = await teacherService.updateTeacher(id, parsedBody, req.user.userId, req.user.email);
        res.status(200).json({
          status: 'success',
          data: updated,
        });
        return;
      }

      // Admins/Super Admins have full edit capability
      const parsedBody = updateTeacherSchema.parse(sanitizedBody);
      const teacher = await teacherService.updateTeacher(id, parsedBody, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        data: teacher,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/teachers/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await teacherService.deleteTeacher(id, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        message: 'Teacher profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/teachers/:id/status
   */
  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const { status } = updateTeacherStatusSchema.parse(req.body);
      const teacher = await teacherService.updateStatus(id, status, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        data: teacher,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/departments/:departmentId/teachers
   */
  async getByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = parseInt(req.params.departmentId, 10);
      const teachers = await teacherService.getTeachersByDepartment(departmentId);

      res.status(200).json({
        status: 'success',
        data: teachers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:userId/teacher-profile
   */
  async getByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId, 10);
      const teacher = await teacherService.getTeacherByUserId(userId);

      if (req.user?.role === 'TEACHER' && req.user.userId !== userId) {
        throw new ForbiddenError('You are not authorized to view another teacher\'s profile');
      }

      res.status(200).json({
        status: 'success',
        data: teacher,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const teacherController = new TeacherController();
export default teacherController;
