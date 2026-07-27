import { Request, Response, NextFunction } from 'express';
import { buildingService } from '../services/building.service';
import { createBuildingSchema, updateBuildingSchema } from '../validators/timetable.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class BuildingController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await buildingService.getBuildings({
        search,
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
      const building = await buildingService.getBuildingByUuid(id);

      res.status(200).json({
        status: 'success',
        data: building,
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

      const parsedBody = createBuildingSchema.parse(req.body);
      const building = await buildingService.createBuilding(
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(201).json({
        status: 'success',
        message: 'Building created successfully',
        data: building,
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
      const parsedBody = updateBuildingSchema.parse(req.body);
      const building = await buildingService.updateBuilding(
        id,
        parsedBody,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: 'success',
        message: 'Building updated successfully',
        data: building,
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
      await buildingService.deleteBuilding(id, req.user.userId, req.user.email);

      res.status(200).json({
        status: 'success',
        message: 'Building deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const buildingController = new BuildingController();
export default buildingController;
