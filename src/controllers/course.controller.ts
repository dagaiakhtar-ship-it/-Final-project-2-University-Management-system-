import { Request, Response, NextFunction } from 'express';
import { courseService } from '../services/course.service';
import { createCourseSchema, updateCourseSchema, updateCourseStatusSchema } from '../validators/course.validators';
import { UnauthorizedError } from '../errors/auth.errors';

export class CourseController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await courseService.getCourses({
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
      const course = await courseService.getCourseByUuid(id);

      res.status(200).json({
        status: 'success',
        data: course,
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

      const parsedBody = createCourseSchema.parse(req.body);
      const course = await courseService.createCourse(parsedBody, req.user.userId);

      res.status(201).json({
        status: 'success',
        message: 'Course created successfully',
        data: course,
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
      const parsedBody = updateCourseSchema.parse(req.body);
      const course = await courseService.updateCourseByUuid(id, parsedBody, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Course updated successfully',
        data: course,
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
      await courseService.deleteCourseByUuid(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Course deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      const parsedBody = updateCourseStatusSchema.parse(req.body);
      const course = await courseService.updateCourseByUuid(id, { status: parsedBody.status }, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Course status updated successfully',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const courseController = new CourseController();
