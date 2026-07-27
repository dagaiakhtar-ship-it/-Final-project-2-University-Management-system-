import { Request, Response, NextFunction } from 'express';
import { facilityBookingService, maintenanceRequestService } from '../services/facility.service';
import { createMaintenanceRequestSchema, updateMaintenanceRequestSchema } from '../validators/facility.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class MaintenanceController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as 'Low' | 'Medium' | 'High' | 'Critical' | undefined;
      const buildingId = req.query.buildingId ? parseInt(req.query.buildingId as string, 10) : undefined;
      const roomId = req.query.roomId ? parseInt(req.query.roomId as string, 10) : undefined;
      const assignedTo = req.query.assignedTo as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await maintenanceRequestService.getMaintenanceRequests({
        search,
        status,
        priority,
        buildingId,
        roomId,
        assignedTo,
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
      const request = await maintenanceRequestService.getMaintenanceRequestById(parseInt(id, 10));

      res.status(200).json({
        status: 'success',
        data: request,
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

      const parsedBody = createMaintenanceRequestSchema.parse(req.body);
      const request = await maintenanceRequestService.createMaintenanceRequest(
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(201).json({
        status: 'success',
        message: 'Maintenance request created successfully',
        data: request,
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
      const parsedBody = updateMaintenanceRequestSchema.parse(req.body);
      const request = await maintenanceRequestService.updateMaintenanceRequest(
        parseInt(id, 10),
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Maintenance request updated successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const maintenanceController = new MaintenanceController();
export default maintenanceController;
