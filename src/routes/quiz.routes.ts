import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const quizRouter = Router();

// Apply auth middleware to all quiz routes
quizRouter.use(authenticate);

// 1. Quiz CRUD & Queries
quizRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  quizController.getQuizzes
);

quizRouter.get(
  '/questions',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.getQuestions
);

quizRouter.get(
  '/submissions/list',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  quizController.getSubmissions
);

quizRouter.get(
  '/submissions/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  quizController.getSubmissionById
);

quizRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  quizController.getQuizById
);

quizRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.createQuiz
);

quizRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.updateQuiz
);

quizRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.deleteQuiz
);

// 2. Publish & Archive
quizRouter.patch(
  '/:id/publish',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.publishQuiz
);

quizRouter.patch(
  '/:id/archive',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.archiveQuiz
);

// 3. Question Bank inside Quiz or general
quizRouter.post(
  '/:id/questions',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.createQuestion
);

quizRouter.put(
  '/questions/:qid',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.updateQuestion
);

quizRouter.delete(
  '/questions/:qid',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.deleteQuestion
);

// 4. Student quiz attempt flow
quizRouter.post(
  '/:id/start',
  requireRoles(['STUDENT']),
  quizController.startQuizAttempt
);

quizRouter.post(
  '/:id/submit',
  requireRoles(['STUDENT']),
  quizController.submitQuizAttempt
);

// 5. Special role specific routers
quizRouter.get(
  '/student/:id/quizzes',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  quizController.getStudentQuizzes
);

quizRouter.get(
  '/teacher/:id/quizzes',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  quizController.getTeacherQuizzes
);
