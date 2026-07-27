import { Request, Response, NextFunction } from 'express';
import { parentService } from '../services/parent.service';
import { createParentSchema, updateParentSchema } from '../validators/parent.validators';
import { UnauthorizedError, ForbiddenError } from '../errors/auth.errors';

export class ParentController {
  async getByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const parent = await parentService.getParentByUserId(parseInt(userId, 10));

      if (req.user?.role === 'PARENT' && req.user.userId !== parent.userId) {
        throw new ForbiddenError('You are not authorized to view this parent profile');
      }

      res.status(200).json({
        status: 'success',
        data: parent,
      });
    } catch (error) {
      next(error);
    }
  }
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const relation = req.query.relation as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await parentService.getParents({
        search,
        relation,
        status,
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
      const parent = await parentService.getParentByUuid(id);

      res.status(200).json({
        status: 'success',
        data: parent,
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

      const parsedBody = createParentSchema.parse(req.body);
      const parent = await parentService.createParent(parsedBody, req.user.userId);

      res.status(201).json({
        status: 'success',
        message: 'Parent record created successfully',
        data: parent,
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
      const parsedBody = updateParentSchema.parse(req.body);
      const parent = await parentService.updateParentByUuid(id, parsedBody, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Parent record updated successfully',
        data: parent,
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
      await parentService.deleteParentByUuid(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Parent record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const parentController = new ParentController();
