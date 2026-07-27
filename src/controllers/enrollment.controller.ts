import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import { prisma } from '../services/db.service';
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  patchStatusSchema,
} from '../validators/enrollment.validators';
import { UnauthorizedError, ForbiddenError } from '../errors/auth.errors';

const enrollmentService = new EnrollmentService();

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

export class EnrollmentController {
  /**
   * Helper to fetch student profile of logged in user
   */
  private async getStudentIdByUserId(userId: number): Promise<number | null> {
    const student = await prisma.student.findUnique({
      where: { userId },
    });
    return student ? student.id : null;
  }

  /**
   * GET /api/enrollments
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const queryParams: any = { ...req.query };

      // Pagination
      const page = parseInt(queryParams.page as string, 10) || 1;
      const limit = parseInt(queryParams.limit as string, 10) || 20;
      const skip = (page - 1) * limit;

      const filters: any = {
        search: queryParams.search as string,
        status: queryParams.status as string,
        enrollmentType: queryParams.enrollmentType as string,
        session: queryParams.session as string,
        academicYear: queryParams.academicYear as string,
        departmentId: queryParams.departmentId ? parseInt(queryParams.departmentId as string, 10) : undefined,
        programId: queryParams.programId ? parseInt(queryParams.programId as string, 10) : undefined,
        semesterId: queryParams.semesterId ? parseInt(queryParams.semesterId as string, 10) : undefined,
        sectionId: queryParams.sectionId ? parseInt(queryParams.sectionId as string, 10) : undefined,
        studentId: queryParams.studentId ? parseInt(queryParams.studentId as string, 10) : undefined,
        courseOfferingId: queryParams.courseOfferingId ? parseInt(queryParams.courseOfferingId as string, 10) : undefined,
        sortBy: queryParams.sortBy as string,
        sortOrder: queryParams.sortOrder as 'asc' | 'desc',
        skip,
        take: limit,
      };

      // RBAC Filter Overrides
      if (req.user.role === 'STUDENT') {
        const studentId = await this.getStudentIdByUserId(req.user.userId);
        if (!studentId) {
          res.status(200).json({ status: 'success', data: [], total: 0 });
          return;
        }
        filters.studentId = studentId;
      } else if (req.user.role === 'TEACHER') {
        // Teachers can view enrollments in general, but let's restrict to their offerings if requested or list all.
        // The instructions say: "Teacher: View students enrolled in assigned course offerings".
        // If they don't specify courseOfferingId, we can default to listing their offerings' enrollments.
        const teacher = await prisma.teacher.findUnique({
          where: { userId: req.user.userId },
        });
        if (teacher) {
          if (!filters.courseOfferingId) {
            // Find all course offerings for this teacher
            const offerings = await prisma.courseOffering.findMany({
              where: { teacherId: teacher.id, deletedAt: null },
              select: { id: true },
            });
            const offeringIds = offerings.map((o) => o.id);
            filters.courseOfferingId = { in: offeringIds } as any; // prisma supports `in`
          } else {
            // Verify they teach this course offering
            const offering = await prisma.courseOffering.findFirst({
              where: { id: filters.courseOfferingId, teacherId: teacher.id, deletedAt: null },
            });
            if (!offering) {
              throw new ForbiddenError('You can only view students enrolled in your own course offerings');
            }
          }
        }
      } else if (req.user.role === 'PARENT') {
        throw new ForbiddenError('Parents do not have access to enrollment listings');
      }

      const result = await enrollmentService.getAllEnrollments(filters);

      res.status(200).json({
        status: 'success',
        data: result.data,
        total: result.total,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/enrollments/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const enrollment = await enrollmentService.getEnrollmentByUuid(id);

      // RBAC Check
      if (req.user.role === 'STUDENT') {
        const studentId = await this.getStudentIdByUserId(req.user.userId);
        if (enrollment.studentId !== studentId) {
          throw new ForbiddenError('You are not authorized to view this enrollment record');
        }
      } else if (req.user.role === 'TEACHER') {
        // Ensure they teach this course
        const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.userId } });
        if (!teacher || enrollment.courseOffering.teacherId !== teacher.id) {
          throw new ForbiddenError('You can only view enrollment details of your own course offerings');
        }
      } else if (req.user.role === 'PARENT') {
        throw new ForbiddenError('Parents do not have access to enrollment details');
      }

      res.status(200).json({
        status: 'success',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/enrollments
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      // Parents cannot enroll
      if (req.user.role === 'PARENT' || req.user.role === 'TEACHER') {
        throw new ForbiddenError('You do not have permission to enroll students');
      }

      const sanitizedBody = sanitizeValue(req.body);
      const parsedBody = createEnrollmentSchema.parse(sanitizedBody);

      // If Student, force studentId to be their own studentId
      if (req.user.role === 'STUDENT') {
        const studentId = await this.getStudentIdByUserId(req.user.userId);
        if (!studentId) {
          throw new ForbiddenError('No active student profile found for your account');
        }
        parsedBody.studentId = studentId;
        // Forced statuses for student submissions
        parsedBody.status = 'Pending';
        parsedBody.advisorApproval = false;
        parsedBody.registrarApproval = false;
      }

      const enrollment = await enrollmentService.createEnrollment(
        parsedBody as any,
        req.user.userId,
        req.user.email
      );

      res.status(201).json({
        status: 'success',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/enrollments/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const numericId = parseInt(id, 10);
      const record = await enrollmentService.getEnrollmentById(numericId);

      // RBAC Checks
      if (req.user.role === 'STUDENT') {
        const studentId = await this.getStudentIdByUserId(req.user.userId);
        if (record.studentId !== studentId) {
          throw new ForbiddenError('You can only update your own enrollments');
        }

        // "Cannot modify approved enrollments"
        if (record.status !== 'Pending') {
          throw new ForbiddenError('Cannot modify an enrollment that has been approved or activated');
        }
      } else if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can update enrollment details');
      }

      const sanitizedBody = sanitizeValue(req.body);
      const parsedBody = updateEnrollmentSchema.parse(sanitizedBody);

      const enrollment = await enrollmentService.updateEnrollment(
        numericId,
        parsedBody as any,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/enrollments/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const numericId = parseInt(id, 10);
      const record = await enrollmentService.getEnrollmentById(numericId);

      // RBAC Checks
      if (req.user.role === 'STUDENT') {
        const studentId = await this.getStudentIdByUserId(req.user.userId);
        if (record.studentId !== studentId) {
          throw new ForbiddenError('You can only drop your own enrollments');
        }

        // Students can only drop/delete if it is Pending
        if (record.status !== 'Pending') {
          throw new ForbiddenError('Cannot delete or drop an approved enrollment');
        }
      } else if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can delete enrollment records');
      }

      const enrollment = await enrollmentService.deleteEnrollment(
        numericId,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Enrollment deleted successfully',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/enrollments/:id/status
   */
  async patchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can approve or change enrollment status');
      }

      const { id } = req.params;
      const numericId = parseInt(id, 10);

      const sanitizedBody = sanitizeValue(req.body);
      const { status } = patchStatusSchema.parse(sanitizedBody);

      // Map approvals dynamically based on state
      const updateData: any = { status };
      if (status === 'Approved' || status === 'Enrolled') {
        updateData.advisorApproval = true;
        updateData.registrarApproval = true;
      }

      const enrollment = await enrollmentService.updateEnrollment(
        numericId,
        updateData,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students/:studentId/enrollments
   */
  async getByStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { studentId } = req.params;
      const numericStudentId = parseInt(studentId, 10);

      if (req.user.role === 'STUDENT') {
        const myStudentId = await this.getStudentIdByUserId(req.user.userId);
        if (myStudentId !== numericStudentId) {
          throw new ForbiddenError('You can only view your own enrollment history');
        }
      } else if (req.user.role === 'PARENT') {
        throw new ForbiddenError('Parents do not have access to enrollment history');
      }

      const result = await enrollmentService.getEnrollmentsByStudent(numericStudentId);

      res.status(200).json({
        status: 'success',
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/course-offerings/:courseOfferingId/enrollments
   */
  async getByCourseOffering(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { courseOfferingId } = req.params;
      const numericOfferingId = parseInt(courseOfferingId, 10);

      if (req.user.role === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.userId } });
        const offering = await prisma.courseOffering.findUnique({ where: { id: numericOfferingId } });
        if (!teacher || !offering || offering.teacherId !== teacher.id) {
          throw new ForbiddenError('You can only view student enrollments for courses you teach');
        }
      } else if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
        throw new ForbiddenError('You do not have permission to view course offering rosters');
      }

      const result = await enrollmentService.getEnrollmentsByCourseOffering(numericOfferingId);

      res.status(200).json({
        status: 'success',
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students/:studentId/current-enrollments
   */
  async getCurrentByStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { studentId } = req.params;
      const numericStudentId = parseInt(studentId, 10);

      if (req.user.role === 'STUDENT') {
        const myStudentId = await this.getStudentIdByUserId(req.user.userId);
        if (myStudentId !== numericStudentId) {
          throw new ForbiddenError('You can only view your own active enrollments');
        }
      } else if (req.user.role === 'PARENT') {
        throw new ForbiddenError('Parents do not have access to active enrollments');
      }

      const result = await enrollmentService.getCurrentEnrollmentsByStudent(numericStudentId);

      res.status(200).json({
        status: 'success',
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }
}
