import { Request, Response, NextFunction } from 'express';
import { studentService } from '../services/student.service';
import { prisma } from '../services/db.service';
import {
  createStudentSchema,
  updateStudentSchema,
  updateStudentStatusSchema,
} from '../validators/student.validators';
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

export class StudentController {
  /**
   * GET /api/students/lookup-options
   * Returns departments, programs, semesters, sections, academic years, and users of role STUDENT without a profile
   */
  async getLookupOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [departments, programs, semesters, sections, academicYears, eligibleUsers] = await Promise.all([
        prisma.department.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, code: true },
        }),
        prisma.program.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, code: true, departmentId: true, totalSemesters: true },
        }),
        prisma.semester.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, code: true, programId: true, semesterNumber: true },
        }),
        prisma.section.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, code: true, semesterId: true },
        }),
        prisma.academicYear.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, status: true },
        }),
        prisma.user.findMany({
          where: {
            deletedAt: null,
            isActive: true,
            role: { name: 'STUDENT' },
            student: null, // Only users who don't already have a student profile
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
          programs,
          semesters,
          sections,
          academicYears,
          eligibleUsers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      
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

      const scholarshipStatus = req.query.scholarshipStatus as string | undefined;
      const hostelStatus = req.query.hostelStatus as string | undefined;
      const transportStatus = req.query.transportStatus as string | undefined;
      const admissionSession = req.query.admissionSession as string | undefined;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await studentService.getStudents({
        search,
        status,
        departmentId,
        programId,
        semesterId,
        sectionId,
        scholarshipStatus,
        hostelStatus,
        transportStatus,
        admissionSession,
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
   * GET /api/students/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const student = await studentService.getStudentByUuid(id);

      // Super Admin, Admin, and Teacher can view. Students can only view their own profile.
      if (req.user?.role === 'STUDENT' && req.user.userId !== student.userId) {
        throw new ForbiddenError('You are not authorized to view another student\'s profile');
      }

      res.status(200).json({
        status: 'success',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/students
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const sanitizedBody = sanitizeValue(req.body);
      const parsedBody = createStudentSchema.parse(sanitizedBody);
      const student = await studentService.createStudent(parsedBody as any, req.user.userId, req.user.email);

      res.status(201).json({
        status: 'success',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/students/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const existing = await studentService.getStudentByUuid(id);
      const sanitizedBody = sanitizeValue(req.body);

      // Students can edit limited personal information of their own profile
      if (req.user.role === 'STUDENT') {
        if (req.user.userId !== existing.userId) {
          throw new ForbiddenError('You are not authorized to edit this profile');
        }
        
        // Restrict student edits to personal and contact fields
        const restrictedBody = {
          fullName: sanitizedBody.fullName,
          fatherName: sanitizedBody.fatherName,
          motherName: sanitizedBody.motherName,
          guardianRelationship: sanitizedBody.guardianRelationship,
          dateOfBirth: sanitizedBody.dateOfBirth,
          gender: sanitizedBody.gender,
          bloodGroup: sanitizedBody.bloodGroup,
          nationality: sanitizedBody.nationality,
          cnic: sanitizedBody.cnic,
          email: sanitizedBody.email,
          mobileNumber: sanitizedBody.mobileNumber,
          emergencyContact: sanitizedBody.emergencyContact,
          permanentAddress: sanitizedBody.permanentAddress,
          currentAddress: sanitizedBody.currentAddress,
          city: sanitizedBody.city,
          province: sanitizedBody.province,
          country: sanitizedBody.country,
          postalCode: sanitizedBody.postalCode,
          studentPhoto: sanitizedBody.studentPhoto,
          signatureImage: sanitizedBody.signatureImage,
        };

        const parsedBody = updateStudentSchema.parse(restrictedBody);
        const updated = await studentService.updateStudent(id, parsedBody, req.user.userId, req.user.email);
        
        res.status(200).json({
          status: 'success',
          data: updated,
        });
        return;
      }

      // Admins/Super Admins have full edit capability
      const parsedBody = updateStudentSchema.parse(sanitizedBody);
      const student = await studentService.updateStudent(id, parsedBody, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/students/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await studentService.deleteStudent(id, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        message: 'Student profile soft-deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/students/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const { status } = updateStudentStatusSchema.parse(req.body);
      const student = await studentService.updateStatus(id, status, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/programs/:programId/students
   */
  async getByProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { programId } = req.params;
      const students = await studentService.getStudentsByProgram(parseInt(programId, 10));

      res.status(200).json({
        status: 'success',
        data: students,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sections/:sectionId/students
   */
  async getBySection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sectionId } = req.params;
      const students = await studentService.getStudentsBySection(parseInt(sectionId, 10));

      res.status(200).json({
        status: 'success',
        data: students,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:userId/student-profile
   */
  async getByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const student = await studentService.getStudentByUserId(parseInt(userId, 10));

      // Student can only access their own profile
      if (req.user?.role === 'STUDENT' && req.user.userId !== student.userId) {
        throw new ForbiddenError('You are not authorized to view this profile');
      }

      res.status(200).json({
        status: 'success',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
export default studentController;
