import { Request, Response, NextFunction } from 'express';
import { timeSlotService } from '../services/timeslot.service';
import { createTimeSlotSchema, updateTimeSlotSchema } from '../validators/timetable.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class TimeSlotController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dayOfWeek = req.query.dayOfWeek as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await timeSlotService.getTimeSlots({
        dayOfWeek,
        status,
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
      const timeSlot = await timeSlotService.getTimeSlotByUuid(id);

      res.status(200).json({
        status: 'success',
        data: timeSlot,
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

      const parsedBody = createTimeSlotSchema.parse(req.body);
      const timeSlot = await timeSlotService.createTimeSlot(
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(201).json({
        status: 'success',
        message: 'Time slot created successfully',
        data: timeSlot,
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
      const parsedBody = updateTimeSlotSchema.parse(req.body);
      const timeSlot = await timeSlotService.updateTimeSlot(
        id,
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Time slot updated successfully',
        data: timeSlot,
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
      await timeSlotService.deleteTimeSlot(id, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        message: 'Time slot deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const timeSlotController = new TimeSlotController();
export default timeSlotController;
