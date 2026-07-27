import { Request, Response, NextFunction } from 'express';
import { timetableService } from '../services/timetable.service';
import { prisma } from '../services/db.service';
import { createTimetableSchema, updateTimetableSchema, patchTimetableStatusSchema } from '../validators/timetable.validators';
import { UnauthorizedError } from '../errors/auth.errors';
import { TimetableNotFoundError, RoomNotFoundError } from '../errors/timetable.errors';
import { TeacherNotFoundError } from '../errors/department.errors';
import { StudentNotFoundError } from '../errors/student.errors';
import { SectionNotFoundError } from '../errors/section.errors';

export class TimetableController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string, 10) : undefined;
      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string, 10) : undefined;
      const programId = req.query.programId ? parseInt(req.query.programId as string, 10) : undefined;
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId as string, 10) : undefined;
      const sectionId = req.query.sectionId ? parseInt(req.query.sectionId as string, 10) : undefined;
      const roomId = req.query.roomId ? parseInt(req.query.roomId as string, 10) : undefined;
      const buildingId = req.query.buildingId ? parseInt(req.query.buildingId as string, 10) : undefined;
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string, 10) : undefined;
      const academicYear = req.query.academicYear as string | undefined;
      const dayOfWeek = req.query.dayOfWeek as string | undefined;
      const timeSlotId = req.query.timeSlotId ? parseInt(req.query.timeSlotId as string, 10) : undefined;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await timetableService.getTimetables({
        search,
        status,
        teacherId,
        departmentId,
        programId,
        semesterId,
        sectionId,
        roomId,
        buildingId,
        subjectId,
        academicYear,
        dayOfWeek,
        timeSlotId,
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

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const timetable = await timetableService.getTimetableByUuid(id);

      res.status(200).json({
        status: 'success',
        data: timetable,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const parsedBody = createTimetableSchema.parse(req.body);
      const timetable = await timetableService.createTimetable(
        parsedBody as any,
        req.user.userId,
        req.user.email
      );

      res.status(201).json({
        status: 'success',
        message: 'Timetable created successfully',
        data: timetable,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateTimetableSchema.parse(req.body);
      const timetable = await timetableService.updateTimetable(
        id,
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Timetable updated successfully',
        data: timetable,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await timetableService.deleteTimetable(id, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        message: 'Timetable deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async patchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const { status } = patchTimetableStatusSchema.parse(req.body);
      const timetable = await timetableService.patchTimetableStatus(
        id,
        status,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Timetable status updated successfully',
        data: timetable,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/teachers/:id/timetable
  async getByTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // teacher UUID
      const teacher = await prisma.teacher.findFirst({
        where: { uuid: id, deletedAt: null },
      });
      if (!teacher) {
        throw new TeacherNotFoundError();
      }

      const result = await timetableService.getTimetables({
        teacherId: teacher.id,
        limit: 100, // retrieve full schedule
      });

      res.status(200).json({
        status: 'success',
        data: result.timetables,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/sections/:id/timetable
  async getBySection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // section UUID
      const section = await prisma.section.findFirst({
        where: { uuid: id, deletedAt: null },
      });
      if (!section) {
        throw new SectionNotFoundError();
      }

      const result = await timetableService.getTimetables({
        sectionId: section.id,
        limit: 100,
      });

      res.status(200).json({
        status: 'success',
        data: result.timetables,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/students/:id/timetable
  async getByStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // student UUID
      const student = await prisma.student.findFirst({
        where: { uuid: id, deletedAt: null },
      });
      if (!student) {
        throw new StudentNotFoundError();
      }

      if (!student.sectionId) {
        res.status(200).json({
          status: 'success',
          data: [],
        });
        return;
      }

      const result = await timetableService.getTimetables({
        sectionId: student.sectionId,
        limit: 100,
      });

      res.status(200).json({
        status: 'success',
        data: result.timetables,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/rooms/:id/timetable
  async getByRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // room UUID
      const room = await prisma.room.findFirst({
        where: { uuid: id, deletedAt: null },
      });
      if (!room) {
        throw new RoomNotFoundError();
      }

      const result = await timetableService.getTimetables({
        roomId: room.id,
        limit: 100,
      });

      res.status(200).json({
        status: 'success',
        data: result.timetables,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const timetableController = new TimetableController();
export default timetableController;
