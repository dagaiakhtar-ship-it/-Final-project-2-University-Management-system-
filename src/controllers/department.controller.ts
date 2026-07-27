import { Request, Response, NextFunction } from 'express';
import { departmentService } from '../services/department.service';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  updateStatusSchema,
} from '../validators/department.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class DepartmentController {
  /**
   * GET /api/departments
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await departmentService.getDepartments({
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

  /**
   * GET /api/departments/teachers
   */
  async getTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teachers = await departmentService.getPotentialHeads();
      res.status(200).json({
        status: 'success',
        data: teachers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/departments/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const department = await departmentService.getDepartmentByUuid(id);

      res.status(200).json({
        status: 'success',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/departments
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const parsedBody = createDepartmentSchema.parse(req.body);
      const department = await departmentService.createDepartment(parsedBody, req.user.userId);

      res.status(201).json({
        status: 'success',
        message: 'Department created successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/departments/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateDepartmentSchema.parse(req.body);
      const department = await departmentService.updateDepartmentByUuid(id, parsedBody, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Department updated successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/departments/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await departmentService.deleteDepartmentByUuid(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/departments/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateStatusSchema.parse(req.body);
      const department = await departmentService.updateDepartmentStatusByUuid(
        id,
        parsedBody.status,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        message: 'Department status updated successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
export default departmentController;
