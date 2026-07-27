import { Request, Response, NextFunction } from 'express';
import { programService } from '../services/program.service';
import {
  createProgramSchema,
  updateProgramSchema,
  updateProgramStatusSchema,
} from '../validators/program.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class ProgramController {
  /**
   * GET /api/programs
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const degreeLevel = req.query.degreeLevel as string | undefined;
      
      const departmentId = req.query.departmentId 
        ? parseInt(req.query.departmentId as string, 10) 
        : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await programService.getPrograms({
        search,
        status,
        departmentId,
        degreeLevel,
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
   * GET /api/programs/teachers
   */
  async getTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teachers = await programService.getPotentialCoordinators();
      res.status(200).json({
        status: 'success',
        data: teachers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/programs/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const program = await programService.getProgramByUuid(id);

      res.status(200).json({
        status: 'success',
        data: program,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/programs
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const parsedBody = createProgramSchema.parse(req.body);
      const program = await programService.createProgram(parsedBody, req.user.userId);

      res.status(201).json({
        status: 'success',
        message: 'Program created successfully',
        data: program,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/programs/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateProgramSchema.parse(req.body);
      const program = await programService.updateProgramByUuid(id, parsedBody, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Program updated successfully',
        data: program,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/programs/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      await programService.deleteProgramByUuid(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Program deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/programs/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateProgramStatusSchema.parse(req.body);
      const program = await programService.updateProgramStatusByUuid(
        id,
        parsedBody.status,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        message: 'Program status updated successfully',
        data: program,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/departments/:departmentId/programs
   */
  async getByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = parseInt(req.params.departmentId, 10);
      if (isNaN(departmentId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid department ID',
        });
        return;
      }
      
      const programs = await programService.getProgramsByDepartmentId(departmentId);
      res.status(200).json({
        status: 'success',
        data: programs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const programController = new ProgramController();
export default programController;
