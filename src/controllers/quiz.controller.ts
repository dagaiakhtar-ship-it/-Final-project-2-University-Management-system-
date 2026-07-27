import { Request, Response, NextFunction } from 'express';
import { quizService } from '../services/quiz.service';
import { quizRepository } from '../repositories/quiz.repository';
import { prisma } from '../services/db.service';

export class QuizController {
  // 1. GET /api/quizzes
  async getQuizzes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        search,
        courseOfferingId,
        teacherId,
        studentId,
        visibilityStatus,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      let filterTeacherId = teacherId ? parseInt(teacherId as string) : undefined;
      let filterStudentId = studentId ? parseInt(studentId as string) : undefined;
      let filterCourseOfferingId = courseOfferingId ? parseInt(courseOfferingId as string) : undefined;

      const user = req.user;
      if (user) {
        if (user.role === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: user.userId },
          });
          if (teacher) {
            filterTeacherId = teacher.id;
          }
        } else if (user.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (student) {
            filterStudentId = student.id;
          }
        }
      }

      const quizzes = await quizRepository.findAll({
        search: search as string,
        courseOfferingId: filterCourseOfferingId,
        teacherId: filterTeacherId,
        studentId: filterStudentId,
        visibilityStatus: visibilityStatus as string,
        skip,
        take,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      const total = await quizRepository.count({
        search: search as string,
        courseOfferingId: filterCourseOfferingId,
        teacherId: filterTeacherId,
        studentId: filterStudentId,
        visibilityStatus: visibilityStatus as string,
      });

      res.json({
        success: true,
        data: quizzes,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. GET /api/quizzes/:id
  async getQuizById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid quiz ID.' });
        return;
      }

      const quiz = await quizRepository.findById(id);
      if (!quiz) {
        res.status(404).json({ success: false, message: 'Quiz not found.' });
        return;
      }

      // Security / Role restrictions:
      const user = req.user;
      if (user) {
        if (user.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (!student) {
            res.status(403).json({ success: false, message: 'Forbidden: Student profile not found' });
            return;
          }

          // Check if enrolled
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              studentId: student.id,
              courseOfferingId: quiz.courseOfferingId,
              status: 'Enrolled',
            },
          });
          if (!enrollment) {
            res.status(403).json({ success: false, message: 'Forbidden: You are not enrolled in this course.' });
            return;
          }

          if (quiz.visibilityStatus !== 'Published') {
            res.status(403).json({ success: false, message: 'Forbidden: Quiz is not published yet.' });
            return;
          }

          // Check if active or completed attempt exists
          const submissions = await prisma.quizSubmission.findMany({
            where: { quizId: id, studentId: student.id },
            orderBy: { attemptNumber: 'desc' },
          });

          const activeSubmission = submissions.find((sub) => sub.submissionStatus === 'In Progress');

          // If student has NOT started yet, or is not in active attempt, hide correct options and explanation
          if (!activeSubmission) {
            const hasFinished = submissions.some((sub) => ['Submitted', 'Auto Submitted', 'Graded'].includes(sub.submissionStatus));
            const shouldReveal = hasFinished && quiz.showResultImmediately && quiz.showCorrectAnswers;

            // Hide answers/options isCorrect unless they should be revealed
            const safeQuestions = quiz.questions.map((q) => ({
              ...q,
              options: q.options.map((o) => ({
                id: o.id,
                optionText: o.optionText,
                isCorrect: shouldReveal ? o.isCorrect : undefined,
              })),
              explanation: shouldReveal ? q.explanation : undefined,
            }));

            res.json({
              success: true,
              data: {
                ...quiz,
                questions: safeQuestions,
                submissions,
              },
            });
            return;
          } else {
            // Student is currently in active attempt, hide isCorrect!
            const safeQuestions = quiz.questions.map((q) => ({
              ...q,
              options: q.options.map((o) => ({
                id: o.id,
                optionText: o.optionText,
              })),
              explanation: undefined,
            }));

            res.json({
              success: true,
              data: {
                ...quiz,
                questions: safeQuestions,
                activeSubmission,
                submissions,
              },
            });
            return;
          }
        } else if (user.role === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: user.userId },
          });
          if (!teacher || quiz.teacherId !== teacher.id) {
            res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this quiz.' });
            return;
          }
        }
      }

      res.json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  }

  // 3. POST /api/quizzes
  async createQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const quiz = await quizService.createQuiz(req.body, user.userId, user.role);
      res.status(201).json({ success: true, data: quiz });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 4. PUT /api/quizzes/:id
  async updateQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid quiz ID.' });
        return;
      }
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const quiz = await quizService.updateQuiz(id, req.body, user.userId, user.role);
      res.json({ success: true, data: quiz });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 5. DELETE /api/quizzes/:id
  async deleteQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid quiz ID.' });
        return;
      }
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await quizService.deleteQuiz(id, user.userId, user.role);
      res.json({ success: true, message: 'Quiz deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 6. PATCH /api/quizzes/:id/publish
  async publishQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (isNaN(id) || !user) {
        res.status(400).json({ success: false, message: 'Invalid parameters.' });
        return;
      }

      const quiz = await quizService.updateQuiz(id, { visibilityStatus: 'Published' }, user.userId, user.role);
      res.json({ success: true, data: quiz });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 7. PATCH /api/quizzes/:id/archive
  async archiveQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (isNaN(id) || !user) {
        res.status(400).json({ success: false, message: 'Invalid parameters.' });
        return;
      }

      const quiz = await quizService.updateQuiz(id, { visibilityStatus: 'Archived' }, user.userId, user.role);
      res.json({ success: true, data: quiz });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 8. POST /api/quizzes/:id/questions (create/add question)
  async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const question = await quizService.createQuestion(req.body, user.userId, user.role);
      res.status(201).json({ success: true, data: question });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET Questions list (for Question Bank view)
  async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        courseOfferingId,
        teacherId,
        search,
        topic,
        difficultyLevel,
        questionType,
        page = '1',
        limit = '10',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      let filterTeacherId = teacherId ? parseInt(teacherId as string) : undefined;
      const user = req.user;

      if (user && user.role === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: user.userId },
        });
        if (teacher) {
          filterTeacherId = teacher.id;
        }
      }

      const questions = await quizRepository.findQuestions({
        courseOfferingId: courseOfferingId ? parseInt(courseOfferingId as string) : undefined,
        teacherId: filterTeacherId,
        search: search as string,
        topic: topic as string,
        difficultyLevel: difficultyLevel as string,
        questionType: questionType as string,
        skip,
        take,
      });

      const total = await quizRepository.countQuestions({
        courseOfferingId: courseOfferingId ? parseInt(courseOfferingId as string) : undefined,
        teacherId: filterTeacherId,
        search: search as string,
        topic: topic as string,
        difficultyLevel: difficultyLevel as string,
        questionType: questionType as string,
      });

      res.json({
        success: true,
        data: questions,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/quizzes/questions/:qid
  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qid = parseInt(req.params.qid);
      const user = req.user;
      if (isNaN(qid) || !user) {
        res.status(400).json({ success: false, message: 'Invalid parameters.' });
        return;
      }

      const question = await quizService.updateQuestion(qid, req.body, user.userId, user.role);
      res.json({ success: true, data: question });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/quizzes/questions/:qid
  async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qid = parseInt(req.params.qid);
      const user = req.user;
      if (isNaN(qid) || !user) {
        res.status(400).json({ success: false, message: 'Invalid parameters.' });
        return;
      }

      // Check teacher ownership
      const existing = await prisma.questionBank.findUnique({
        where: { id: qid },
      });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Question not found.' });
        return;
      }

      if (user.role === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: user.userId },
        });
        if (!teacher || existing.teacherId !== teacher.id) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own questions.' });
          return;
        }
      }

      await quizRepository.deleteQuestion(qid);
      res.json({ success: true, message: 'Question deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 9. POST /api/quizzes/:id/start
  async startQuizAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (isNaN(id) || !user) {
        res.status(400).json({ success: false, message: 'Invalid parameters.' });
        return;
      }

      const attempt = await quizService.startQuizAttempt(id, user.userId);
      res.json({ success: true, data: attempt });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 10. POST /api/quizzes/:id/submit
  async submitQuizAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id); // submissionId (from URL / body, let's allow both)
      const { submissionId, answers, isAutoSubmit, currentAnswers } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const subId = parseInt(submissionId || req.params.id);
      if (isNaN(subId)) {
        res.status(400).json({ success: false, message: 'Invalid submission ID.' });
        return;
      }

      // If they specify saving progress (auto-save answers)
      if (req.query.saveProgress === 'true') {
        const submission = await quizService.saveAnswersProgress(subId, currentAnswers || answers, user.userId);
        res.json({ success: true, data: submission });
        return;
      }

      // Final submit
      const submission = await quizService.submitQuizAttempt(subId, answers || {}, user.userId, !!isAutoSubmit);
      res.json({ success: true, data: submission });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET Submissions List
  async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        quizId,
        studentId,
        enrollmentId,
        teacherId,
        submissionStatus,
        page = '1',
        limit = '10',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      let filterTeacherId = teacherId ? parseInt(teacherId as string) : undefined;
      let filterStudentId = studentId ? parseInt(studentId as string) : undefined;

      const user = req.user;
      if (user) {
        if (user.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (!student) {
            res.status(403).json({ success: false, message: 'Student profile not found.' });
            return;
          }
          filterStudentId = student.id;
        } else if (user.role === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: user.userId },
          });
          if (teacher) {
            filterTeacherId = teacher.id;
          }
        }
      }

      const submissions = await quizRepository.findSubmissions({
        quizId: quizId ? parseInt(quizId as string) : undefined,
        studentId: filterStudentId || (studentId ? parseInt(studentId as string) : undefined),
        enrollmentId: enrollmentId ? parseInt(enrollmentId as string) : undefined,
        teacherId: filterTeacherId,
        submissionStatus: submissionStatus as string,
        skip,
        take,
      });

      const total = await quizRepository.countSubmissions({
        quizId: quizId ? parseInt(quizId as string) : undefined,
        studentId: filterStudentId || (studentId ? parseInt(studentId as string) : undefined),
        enrollmentId: enrollmentId ? parseInt(enrollmentId as string) : undefined,
        teacherId: filterTeacherId,
        submissionStatus: submissionStatus as string,
      });

      res.json({
        success: true,
        data: submissions,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET Submission Details
  async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid submission ID.' });
        return;
      }

      const submission = await quizRepository.findSubmissionById(id);
      if (!submission) {
        res.status(404).json({ success: false, message: 'Submission not found.' });
        return;
      }

      // Security checking
      const user = req.user;
      if (user) {
        if (user.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (!student || submission.studentId !== student.id) {
            res.status(403).json({ success: false, message: 'Forbidden: You can only view your own submissions.' });
            return;
          }
        } else if (user.role === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: user.userId },
          });
          if (!teacher || submission.quiz.teacherId !== teacher.id) {
            res.status(403).json({ success: false, message: 'Forbidden: You can only view submissions for your assigned quizzes.' });
            return;
          }
        }
      }

      res.json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  }

  // 11. GET /api/students/:id/quizzes
  async getStudentQuizzes(req: Request, res: Response, next: NextFunction): Promise<void> {
    req.query.studentId = req.params.id;
    return this.getQuizzes(req, res, next);
  }

  // 12. GET /api/teachers/:id/quizzes
  async getTeacherQuizzes(req: Request, res: Response, next: NextFunction): Promise<void> {
    req.query.teacherId = req.params.id;
    return this.getQuizzes(req, res, next);
  }
}

export const quizController = new QuizController();
