import { Request, Response, NextFunction } from 'express';
import { facilityBookingService } from '../services/facility.service';
import { createBookingSchema, updateBookingSchema } from '../validators/facility.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class BookingController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const approvalStatus = req.query.approvalStatus as string | undefined;
      const roomId = req.query.roomId ? parseInt(req.query.roomId as string, 10) : undefined;
      const bookedBy = req.query.bookedBy as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await facilityBookingService.getBookings({
        search,
        approvalStatus,
        roomId,
        bookedBy,
        page,
        limit,
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
      const booking = await facilityBookingService.getBookingById(parseInt(id, 10));

      res.status(200).json({
        status: 'success',
        data: booking,
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

      const parsedBody = createBookingSchema.parse(req.body);
      const booking = await facilityBookingService.createBooking(
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(201).json({
        status: 'success',
        message: 'Booking created successfully',
        data: booking,
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
      const parsedBody = updateBookingSchema.parse(req.body);
      const booking = await facilityBookingService.updateBooking(
        parseInt(id, 10),
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Booking updated successfully',
        data: booking,
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
      await facilityBookingService.deleteBooking(
        parseInt(id, 10),
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Booking deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
export default bookingController;
