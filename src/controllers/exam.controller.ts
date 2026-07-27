import { Request, Response, NextFunction } from 'express';
import { examService } from '../services/exam.service';
import { prisma } from '../services/db.service';

export class ExamController {
  // 1. GET /api/exams
  async getExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        search,
        examType,
        status,
        academicYear,
        session,
        courseOfferingId,
        roomId,
        page = '1',
        limit = '10',
      } = req.query;

      const filters = {
        search: search as string,
        examType: examType as string,
        status: status as string,
        academicYear: academicYear as string,
        session: session as string,
        courseOfferingId: courseOfferingId ? Number(courseOfferingId) : undefined,
        roomId: roomId ? Number(roomId) : undefined,
        page: Number(page),
        limit: Number(limit),
      };

      const result = await examService.getExams(filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 2. GET /api/exams/:id
  async getExamById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid exam ID' });
        return;
      }

      const exam = await examService.getExamById(id);
      res.status(200).json(exam);
    } catch (error: any) {
      if (error.message === 'Exam not found.') {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  // 3. POST /api/exams
  async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        title,
        examType,
        courseOfferingId,
        subjectId,
        teacherId,
        totalMarks,
        passingMarks,
        durationMinutes,
        examDate,
        startTime,
        endTime,
        roomId,
        buildingId,
        session,
        academicYear,
        instructions,
      } = req.body;

      // Basic field validation
      if (
        !title ||
        !examType ||
        !courseOfferingId ||
        !subjectId ||
        !teacherId ||
        !totalMarks ||
        !passingMarks ||
        !durationMinutes ||
        !examDate ||
        !startTime ||
        !endTime ||
        !session ||
        !academicYear
      ) {
        res.status(400).json({ error: 'Missing required fields for exam creation.' });
        return;
      }

      const createdBy = req.user?.email || 'System';

      const exam = await examService.createExam({
        title,
        examType,
        courseOfferingId: Number(courseOfferingId),
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        durationMinutes: Number(durationMinutes),
        examDate,
        startTime,
        endTime,
        roomId: roomId ? Number(roomId) : undefined,
        buildingId: buildingId ? Number(buildingId) : undefined,
        session,
        academicYear,
        instructions,
        createdBy,
      });

      res.status(201).json(exam);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 4. PUT /api/exams/:id
  async updateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid exam ID' });
        return;
      }

      const updatedBy = req.user?.email || 'System';
      const userId = req.user?.userId;

      const updated = await examService.updateExam(id, { ...req.body, updatedBy }, userId);
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 5. DELETE /api/exams/:id
  async deleteExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid exam ID' });
        return;
      }

      const userId = req.user?.userId;

      await examService.deleteExam(id, userId);
      res.status(200).json({ message: 'Exam soft deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 6. PATCH /api/exams/:id/schedule
  async scheduleExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { examDate, startTime, endTime, roomId, buildingId } = req.body;

      if (isNaN(id) || !examDate || !startTime || !endTime || !roomId) {
        res.status(400).json({ error: 'Missing required parameters for exam scheduling.' });
        return;
      }

      const userId = req.user?.userId;

      const exam = await examService.scheduleExam(
        id,
        {
          examDate,
          startTime,
          endTime,
          roomId: Number(roomId),
          buildingId: buildingId ? Number(buildingId) : undefined,
        },
        userId
      );

      res.status(200).json(exam);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 7. PATCH /api/exams/:id/cancel
  async cancelExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid exam ID' });
        return;
      }

      const userId = req.user?.userId;

      const exam = await examService.cancelExam(id, userId);
      res.status(200).json(exam);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 8. POST /api/exams/:id/generate-seat-plan
  async generateSeatPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid exam ID' });
        return;
      }

      const userId = req.user?.userId;

      const seatPlans = await examService.generateSeatPlan(id, userId);
      res.status(200).json({ message: 'Seat plan generated successfully.', seatPlans });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 9. POST /api/exams/:id/generate-admit-cards
  async generateAdmitCards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid exam ID' });
        return;
      }

      const userId = req.user?.userId;

      const admitCards = await examService.generateAdmitCards(id, userId);
      res.status(200).json({ message: 'Admit cards generated successfully.', admitCards });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 10. POST /api/exams/:id/assign-invigilators
  async assignInvigilators(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { invigilators } = req.body; // Array of { teacherId: number, role: string }

      if (isNaN(id) || !Array.isArray(invigilators)) {
        res.status(400).json({ error: 'Invalid parameters: invigilators must be an array.' });
        return;
      }

      const userId = req.user?.userId;

      const result = await examService.assignInvigilators(id, invigilators, userId);
      res.status(200).json({ message: 'Invigilators assigned successfully.', invigilators: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 11. GET /api/students/:id/exams
  async getStudentExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      if (isNaN(studentId)) {
        res.status(400).json({ error: 'Invalid student ID' });
        return;
      }

      const exams = await examService.getStudentExams(studentId);
      res.status(200).json(exams);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 12. GET /api/teachers/:id/exams
  async getTeacherExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = Number(req.params.id);
      if (isNaN(teacherId)) {
        res.status(400).json({ error: 'Invalid teacher ID' });
        return;
      }

      const exams = await examService.getTeacherExams(teacherId);
      res.status(200).json(exams);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 13. GET /api/exams/analytics/overview
  async getExamAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await examService.getExamAnalytics();
      res.status(200).json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // 14. POST /api/exams/verify-admit-card
  async verifyAdmitCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { qrData } = req.body;
      if (!qrData) {
        res.status(400).json({ error: 'Missing QR Code data to verify.' });
        return;
      }

      const verificationResult = await examService.verifyAdmitCard(qrData);
      res.status(200).json(verificationResult);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const examController = new ExamController();
