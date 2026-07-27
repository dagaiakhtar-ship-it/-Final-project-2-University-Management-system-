import { Request, Response, NextFunction } from 'express';
import { resultService } from '../services/result.service';

export class ResultController {
  // 1. GET /api/results
  async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { semesterId, courseOfferingId, studentId, approvalStatus } = req.query;
      
      const filters = {
        semesterId: semesterId ? Number(semesterId) : undefined,
        courseOfferingId: courseOfferingId ? Number(courseOfferingId) : undefined,
        studentId: studentId ? Number(studentId) : undefined,
        approvalStatus: approvalStatus as string,
      };

      const results = await resultService.getResults(filters);
      res.status(200).json(results);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 2. GET /api/results/:id
  async getResultById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const result = await resultService.getResultById(id);
      if (!result) {
        res.status(404).json({ error: 'Result record not found.' });
        return;
      }
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 3. POST /api/results
  async createResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userEmail = (req as any).user?.email || 'Admin';
      const result = await resultService.createResult(req.body, userId, userEmail);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 4. PUT /api/results/:id
  async updateResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.userId;
      const userEmail = (req as any).user?.email || 'Admin';
      const result = await resultService.updateResult(id, req.body, userId, userEmail);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 5. DELETE /api/results/:id
  async deleteResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.userId;
      const userEmail = (req as any).user?.email || 'Admin';
      await resultService.deleteResult(id, userId, userEmail);
      res.status(200).json({ message: 'Result record deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 6. PATCH /api/results/:id/approve
  async approveResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.userId || 0;
      const userEmail = (req as any).user?.email || 'Admin';
      const result = await resultService.approveResult(id, userId, userEmail);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 7. PATCH /api/results/:id/publish
  async publishResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.userId || 0;
      const userEmail = (req as any).user?.email || 'Admin';
      const result = await resultService.publishResult(id, userId, userEmail);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 8. POST /api/results/process
  async processResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseOfferingId } = req.body;
      if (!courseOfferingId) {
        res.status(400).json({ error: 'Missing courseOfferingId parameter.' });
        return;
      }
      const userId = (req as any).user?.userId;
      const userEmail = (req as any).user?.email || 'Admin';
      const results = await resultService.processResults({ courseOfferingId }, userId, userEmail);
      res.status(200).json({
        message: `Successfully processed results for ${results.length} students.`,
        results,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 9. POST /api/results/calculate-gpa
  async calculateGPA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId, semesterId } = req.body;
      if (!studentId || !semesterId) {
        res.status(400).json({ error: 'Missing studentId or semesterId parameters.' });
        return;
      }
      const record = await resultService.calculateGPA(Number(studentId), Number(semesterId));
      res.status(200).json({
        message: 'GPA Calculated successfully.',
        record,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 10. POST /api/results/calculate-cgpa
  async calculateCGPA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.body;
      if (!studentId) {
        res.status(400).json({ error: 'Missing studentId parameter.' });
        return;
      }
      const record = await resultService.calculateCGPA(Number(studentId));
      res.status(200).json({
        message: 'CGPA Calculated successfully.',
        record,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 11. GET /api/students/:id/results
  async getStudentResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const results = await resultService.getStudentResults(studentId);
      res.status(200).json(results);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 12. GET /api/students/:id/transcript-preview
  async getTranscriptPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const preview = await resultService.getTranscriptPreview(studentId);
      res.status(200).json(preview);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 13. GET /api/results/analytics
  async getResultAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, semesterId } = req.query;
      const analytics = await resultService.getResultAnalytics({
        departmentId: departmentId ? Number(departmentId) : undefined,
        semesterId: semesterId ? Number(semesterId) : undefined,
      });
      res.status(200).json(analytics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 14. GET /api/results/merit-list
  async getMeritList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { semesterId } = req.query;
      const meritList = await resultService.getMeritList(semesterId ? Number(semesterId) : undefined);
      res.status(200).json(meritList);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const resultController = new ResultController();
