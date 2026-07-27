import { Request, Response, NextFunction } from 'express';
import { roomService } from '../services/room.service';
import { createRoomSchema, updateRoomSchema } from '../validators/timetable.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class RoomController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const buildingId = req.query.buildingId ? parseInt(req.query.buildingId as string, 10) : undefined;
      const roomType = req.query.roomType as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await roomService.getRooms({
        search,
        status,
        buildingId,
        roomType,
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
      const room = await roomService.getRoomByUuid(id);

      res.status(200).json({
        status: 'success',
        data: room,
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

      const parsedBody = createRoomSchema.parse(req.body);
      const room = await roomService.createRoom(
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(201).json({
        status: 'success',
        message: 'Room created successfully',
        data: room,
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
      const parsedBody = updateRoomSchema.parse(req.body);
      const room = await roomService.updateRoom(
        id,
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Room updated successfully',
        data: room,
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
      await roomService.deleteRoom(id, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        message: 'Room deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const roomController = new RoomController();
export default roomController;
