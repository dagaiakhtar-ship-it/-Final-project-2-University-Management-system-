import { prisma } from './db.service';
import { quizRepository, QuizWithRelations, QuizSubmissionWithRelations, QuestionWithRelations } from '../repositories/quiz.repository';
import { auditService } from './audit.service';
import { notifyQuizChange } from './socket.service';
import { Prisma, Quiz, QuizSubmission, QuestionBank, QuestionOption } from '@prisma/client';

export class QuizService {
  // --- Quiz Management ---

  async createQuiz(data: any, userId: number, userRole: string): Promise<Quiz> {
    const {
      title,
      description,
      instructions,
      courseOfferingId,
      totalMarks,
      passingMarks,
      durationMinutes,
      availableFrom,
      availableUntil,
      maximumAttempts = 1,
      shuffleQuestions = false,
      shuffleOptions = false,
      negativeMarkingEnabled = false,
      negativeMarksPerQuestion = 0,
      showResultImmediately = true,
      showCorrectAnswers = true,
      visibilityStatus = 'Draft',
      questionIds = [],
    } = data;

    // Validate course offering exists
    const offering = await prisma.courseOffering.findUnique({
      where: { id: parseInt(courseOfferingId) },
    });
    if (!offering) {
      throw new Error('Invalid course offering.');
    }

    // Role check: If teacher, verify they are assigned to this course offering
    let resolvedTeacherId = offering.teacherId;
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || offering.teacherId !== teacher.id) {
        throw new Error('Forbidden: You can only manage quizzes for your assigned course offerings.');
      }
      resolvedTeacherId = teacher.id;
    }

    // Validations
    const parsedFrom = new Date(availableFrom);
    const parsedUntil = new Date(availableUntil);

    if (isNaN(parsedFrom.getTime()) || isNaN(parsedUntil.getTime())) {
      throw new Error('Invalid availability dates.');
    }
    if (parsedFrom > parsedUntil) {
      throw new Error('Availability start date cannot be after end date.');
    }
    if (parseFloat(totalMarks) <= 0) {
      throw new Error('Total marks must be greater than zero.');
    }
    if (parseFloat(passingMarks) < 0 || parseFloat(passingMarks) > parseFloat(totalMarks)) {
      throw new Error('Passing marks must be between 0 and total marks.');
    }
    if (parseInt(durationMinutes) <= 0) {
      throw new Error('Duration must be greater than zero.');
    }
    if (parseInt(maximumAttempts) < 1) {
      throw new Error('Maximum attempts must be at least 1.');
    }
    if (parseFloat(negativeMarksPerQuestion) < 0) {
      throw new Error('Negative marks per question cannot be negative.');
    }

    // Generate unique quiz code: QZ-YYYY-Random
    const year = new Date(availableFrom).getFullYear();
    let quizCode = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      quizCode = `QZ-${year}-${randomSuffix}`;
      const existing = await prisma.quiz.findUnique({
        where: { quizCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }
    if (!isUnique) {
      quizCode = `QZ-${year}-${Date.now().toString().slice(-4)}`;
    }

    const quiz = await quizRepository.create({
      quizCode,
      title,
      description,
      instructions,
      courseOfferingId: parseInt(courseOfferingId),
      teacherId: resolvedTeacherId,
      totalMarks: parseFloat(totalMarks),
      passingMarks: parseFloat(passingMarks),
      durationMinutes: parseInt(durationMinutes),
      availableFrom: parsedFrom,
      availableUntil: parsedUntil,
      maximumAttempts: parseInt(maximumAttempts),
      shuffleQuestions: !!shuffleQuestions,
      shuffleOptions: !!shuffleOptions,
      negativeMarkingEnabled: !!negativeMarkingEnabled,
      negativeMarksPerQuestion: parseFloat(negativeMarksPerQuestion),
      showResultImmediately: !!showResultImmediately,
      showCorrectAnswers: !!showCorrectAnswers,
      visibilityStatus,
      createdBy: String(userId),
      questionIds: questionIds.map((id: any) => parseInt(id)),
    });

    // Write Audit Log
    await auditService.log({
      action: 'QUIZ_CREATED',
      tableName: 'Quiz',
      recordId: String(quiz.id),
      newValue: quiz,
      userId,
    });

    // Notify Realtime if Published
    if (visibilityStatus === 'Published') {
      notifyQuizChange('PUBLISHED', {
        id: quiz.id,
        title: quiz.title,
        courseOfferingId: quiz.courseOfferingId,
      });
    }

    return quiz;
  }

  async updateQuiz(id: number, data: any, userId: number, userRole: string): Promise<Quiz> {
    const existing = await prisma.quiz.findFirst({
      where: { id, softDelete: false },
    });
    if (!existing) {
      throw new Error('Quiz not found.');
    }

    // Role check: Only assigned teacher or admin can modify
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || existing.teacherId !== teacher.id) {
        throw new Error('Forbidden: You can only modify your own quizzes.');
      }
    }

    const {
      title,
      description,
      instructions,
      totalMarks,
      passingMarks,
      durationMinutes,
      availableFrom,
      availableUntil,
      maximumAttempts,
      shuffleQuestions,
      shuffleOptions,
      negativeMarkingEnabled,
      negativeMarksPerQuestion,
      showResultImmediately,
      showCorrectAnswers,
      visibilityStatus,
      questionIds,
    } = data;

    // Validate values (fallbacks to existing)
    const currentTotalMarks = totalMarks !== undefined ? parseFloat(totalMarks) : existing.totalMarks;
    const currentPassingMarks = passingMarks !== undefined ? parseFloat(passingMarks) : existing.passingMarks;
    const currentFrom = availableFrom !== undefined ? new Date(availableFrom) : existing.availableFrom;
    const currentUntil = availableUntil !== undefined ? new Date(availableUntil) : existing.availableUntil;
    const currentDuration = durationMinutes !== undefined ? parseInt(durationMinutes) : existing.durationMinutes;
    const currentMaxAttempts = maximumAttempts !== undefined ? parseInt(maximumAttempts) : existing.maximumAttempts;

    if (isNaN(currentFrom.getTime()) || isNaN(currentUntil.getTime())) {
      throw new Error('Invalid availability dates.');
    }
    if (currentFrom > currentUntil) {
      throw new Error('Availability start date cannot be after end date.');
    }
    if (currentTotalMarks <= 0) {
      throw new Error('Total marks must be greater than zero.');
    }
    if (currentPassingMarks < 0 || currentPassingMarks > currentTotalMarks) {
      throw new Error('Passing marks must be between 0 and total marks.');
    }
    if (currentDuration <= 0) {
      throw new Error('Duration must be greater than zero.');
    }
    if (currentMaxAttempts < 1) {
      throw new Error('Maximum attempts must be at least 1.');
    }

    const updateData: Prisma.QuizUncheckedUpdateInput = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (totalMarks !== undefined) updateData.totalMarks = parseFloat(totalMarks);
    if (passingMarks !== undefined) updateData.passingMarks = parseFloat(passingMarks);
    if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes);
    if (availableFrom !== undefined) updateData.availableFrom = currentFrom;
    if (availableUntil !== undefined) updateData.availableUntil = currentUntil;
    if (maximumAttempts !== undefined) updateData.maximumAttempts = currentMaxAttempts;
    if (shuffleQuestions !== undefined) updateData.shuffleQuestions = !!shuffleQuestions;
    if (shuffleOptions !== undefined) updateData.shuffleOptions = !!shuffleOptions;
    if (negativeMarkingEnabled !== undefined) updateData.negativeMarkingEnabled = !!negativeMarkingEnabled;
    if (negativeMarksPerQuestion !== undefined) updateData.negativeMarksPerQuestion = parseFloat(negativeMarksPerQuestion);
    if (showResultImmediately !== undefined) updateData.showResultImmediately = !!showResultImmediately;
    if (showCorrectAnswers !== undefined) updateData.showCorrectAnswers = !!showCorrectAnswers;
    if (visibilityStatus !== undefined) updateData.visibilityStatus = visibilityStatus;

    updateData.updatedBy = String(userId);

    const updated = await quizRepository.update(id, {
      ...updateData,
      questionIds: questionIds ? questionIds.map((qid: any) => parseInt(qid)) : undefined,
    });

    // Audit log
    await auditService.log({
      action: 'QUIZ_UPDATED',
      tableName: 'Quiz',
      recordId: String(id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    // Realtime Notifications
    if (visibilityStatus === 'Published' && existing.visibilityStatus !== 'Published') {
      notifyQuizChange('PUBLISHED', {
        id: updated.id,
        title: updated.title,
        courseOfferingId: updated.courseOfferingId,
      });
    }

    return updated;
  }

  async deleteQuiz(id: number, userId: number, userRole: string): Promise<Quiz> {
    const existing = await prisma.quiz.findFirst({
      where: { id, softDelete: false },
    });
    if (!existing) {
      throw new Error('Quiz not found.');
    }

    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || existing.teacherId !== teacher.id) {
        throw new Error('Forbidden: You can only delete your own quizzes.');
      }
    }

    const deleted = await quizRepository.delete(id, String(userId));

    // Audit Log
    await auditService.log({
      action: 'QUIZ_DELETED',
      tableName: 'Quiz',
      recordId: String(id),
      oldValue: existing,
      userId,
    });

    return deleted;
  }

  // --- Question Bank Operations ---

  async createQuestion(data: any, userId: number, userRole: string): Promise<QuestionBank> {
    const {
      courseOfferingId,
      title,
      topic,
      difficultyLevel = 'Medium',
      questionType = 'MCQ',
      questionText,
      explanation,
      marks = 1,
      negativeMarks = 0,
      attachments,
      options = [],
    } = data;

    const offering = await prisma.courseOffering.findUnique({
      where: { id: parseInt(courseOfferingId) },
    });
    if (!offering) {
      throw new Error('Invalid course offering.');
    }

    let resolvedTeacherId = offering.teacherId;
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || offering.teacherId !== teacher.id) {
        throw new Error('Forbidden: You can only manage questions for your assigned course offerings.');
      }
      resolvedTeacherId = teacher.id;
    }

    if (!questionText || questionText.trim() === '') {
      throw new Error('Question text is required.');
    }

    if (parseFloat(marks) <= 0) {
      throw new Error('Marks must be greater than zero.');
    }

    // Require options for objective types
    if (['MCQ', 'TrueFalse', 'MultipleSelect'].includes(questionType)) {
      if (!options || options.length === 0) {
        throw new Error(`Options are required for ${questionType} question types.`);
      }
      const correctCount = options.filter((o: any) => o.isCorrect).length;
      if (correctCount === 0) {
        throw new Error('At least one correct answer option is required.');
      }
      if (questionType === 'MCQ' && correctCount > 1) {
        throw new Error('MCQ question type can only have one correct answer.');
      }
      if (questionType === 'TrueFalse' && options.length !== 2) {
        throw new Error('True/False questions must have exactly 2 options.');
      }
    }

    const question = await quizRepository.createQuestion({
      courseOfferingId: parseInt(courseOfferingId),
      teacherId: resolvedTeacherId,
      title,
      topic,
      difficultyLevel,
      questionType,
      questionText,
      explanation,
      marks: parseFloat(marks),
      negativeMarks: parseFloat(negativeMarks),
      attachments,
      options: options.map((opt: any) => ({
        optionText: opt.optionText,
        isCorrect: !!opt.isCorrect,
      })),
    });

    return question;
  }

  async updateQuestion(id: number, data: any, userId: number, userRole: string): Promise<QuestionBank> {
    const existing = await prisma.questionBank.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error('Question not found.');
    }

    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || existing.teacherId !== teacher.id) {
        throw new Error('Forbidden: You can only modify your own questions.');
      }
    }

    const {
      title,
      topic,
      difficultyLevel,
      questionType,
      questionText,
      explanation,
      marks,
      negativeMarks,
      attachments,
      options,
    } = data;

    const updateData: Prisma.QuestionBankUncheckedUpdateInput = {};
    if (title !== undefined) updateData.title = title;
    if (topic !== undefined) updateData.topic = topic;
    if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;
    if (questionType !== undefined) updateData.questionType = questionType;
    if (questionText !== undefined) updateData.questionText = questionText;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (marks !== undefined) updateData.marks = parseFloat(marks);
    if (negativeMarks !== undefined) updateData.negativeMarks = parseFloat(negativeMarks);
    if (attachments !== undefined) updateData.attachments = attachments;

    const updated = await quizRepository.updateQuestion(id, {
      ...updateData,
      options,
    });

    return updated;
  }

  // --- Quiz Attempt / Submissions Flow ---

  async startQuizAttempt(quizId: number, userId: number): Promise<{ submission: QuizSubmission; questions: any[] }> {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, softDelete: false },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found.');
    }

    if (quiz.visibilityStatus !== 'Published') {
      throw new Error('Quiz is not open for attempts.');
    }

    const now = new Date();
    if (now < quiz.availableFrom) {
      throw new Error('Quiz attempt period has not started yet.');
    }
    if (now > quiz.availableUntil) {
      throw new Error('Quiz attempt period has ended.');
    }

    // Retrieve Student profile
    const student = await prisma.student.findFirst({
      where: { userId },
    });
    if (!student) {
      throw new Error('Student profile not found.');
    }

    // Verify student's enrollment in the quiz's Course Offering
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        courseOfferingId: quiz.courseOfferingId,
        status: 'Enrolled',
      },
    });
    if (!enrollment) {
      throw new Error('Forbidden: You are not enrolled in this course.');
    }

    // Check existing attempts
    const previousAttempts = await prisma.quizSubmission.findMany({
      where: {
        quizId,
        studentId: student.id,
      },
      orderBy: { attemptNumber: 'desc' },
    });

    const activeAttempt = previousAttempts.find((sub) => sub.submissionStatus === 'In Progress');
    if (activeAttempt) {
      const elapsedSeconds = Math.floor((now.getTime() - activeAttempt.startedAt.getTime()) / 1000);
      const timeLimitSeconds = quiz.durationMinutes * 60;
      if (elapsedSeconds > timeLimitSeconds + 60) {
        // Active attempt has expired. Auto-submit it.
        await this.submitQuizAttempt(activeAttempt.id, activeAttempt.answers || {}, userId, true);
        // Refresh previousAttempts to check limit
        const reloadedAttempts = await prisma.quizSubmission.findMany({
          where: {
            quizId,
            studentId: student.id,
          },
          orderBy: { attemptNumber: 'desc' },
        });
        if (reloadedAttempts.length >= quiz.maximumAttempts) {
          throw new Error('Maximum attempt limit reached for this quiz.');
        }
      } else {
        // Return existing active attempt and its shuffled questions
        const questions = this.prepareQuizQuestions(quiz.questions, quiz.shuffleQuestions, quiz.shuffleOptions);
        return { submission: activeAttempt, questions };
      }
    }

    if (previousAttempts.length >= quiz.maximumAttempts) {
      throw new Error('Maximum attempt limit reached for this quiz.');
    }

    const nextAttemptNumber = previousAttempts.length + 1;

    // Create fresh attempt
    const submission = await quizRepository.createSubmission({
      quizId,
      studentId: student.id,
      enrollmentId: enrollment.id,
      startedAt: now,
      submissionStatus: 'In Progress',
      attemptNumber: nextAttemptNumber,
    });

    // Write Audit Log
    await auditService.log({
      action: 'QUIZ_STARTED',
      tableName: 'QuizSubmission',
      recordId: String(submission.id),
      newValue: submission,
      userId,
    });

    // Realtime Notification
    notifyQuizChange('STARTED', {
      quizId: quiz.id,
      quizTitle: quiz.title,
      studentId: student.id,
      studentName: student.fullName,
      teacherId: quiz.teacherId,
    });

    const questions = this.prepareQuizQuestions(quiz.questions, quiz.shuffleQuestions, quiz.shuffleOptions);
    return { submission, questions };
  }

  // Intermediate Answers Save (Auto Save)
  async saveAnswersProgress(submissionId: number, answers: any, userId: number): Promise<QuizSubmission> {
    const submission = await prisma.quizSubmission.findUnique({
      where: { id: submissionId },
      include: { quiz: true },
    });

    if (!submission) {
      throw new Error('Quiz submission not found.');
    }

    const student = await prisma.student.findFirst({
      where: { userId },
    });
    if (!student || submission.studentId !== student.id) {
      throw new Error('Forbidden: You cannot modify this attempt.');
    }

    if (submission.submissionStatus !== 'In Progress') {
      throw new Error('Quiz submission is already finalized.');
    }

    // Verify time limit
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - submission.startedAt.getTime()) / 1000);
    const timeLimitSeconds = submission.quiz.durationMinutes * 60;

    if (elapsedSeconds > timeLimitSeconds + 60) { // 1 min grace period
      // Force auto submit instead!
      return this.submitQuizAttempt(submissionId, answers, userId, true);
    }

    return quizRepository.updateSubmission(submissionId, {
      answers,
    });
  }

  // Submit and Auto-Grade Attempt
  async submitQuizAttempt(submissionId: number, answers: any, userId: number, isAutoSubmit = false): Promise<QuizSubmission> {
    const submission = await prisma.quizSubmission.findUnique({
      where: { id: submissionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found.');
    }

    if (submission.submissionStatus !== 'In Progress') {
      return submission; // Already submitted
    }

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - submission.startedAt.getTime()) / 1000);

    // 1. GRADE OBJECTIVE QUESTIONS
    let obtainedMarks = 0;
    const gradingLog: any[] = [];

    const quiz = submission.quiz;
    for (const question of quiz.questions) {
      const studentAnswer = answers[question.id];
      const correctOptions = question.options.filter((o) => o.isCorrect);
      const correctOptionIds = correctOptions.map((o) => o.id);

      let isCorrect = false;

      if (studentAnswer !== undefined && studentAnswer !== null) {
        if (question.questionType === 'MCQ' || question.questionType === 'TrueFalse') {
          // MCQ and True/False is single option selected (id of correct option)
          const chosenOptionId = parseInt(studentAnswer);
          isCorrect = correctOptionIds.includes(chosenOptionId);
        } else if (question.questionType === 'MultipleSelect') {
          // MultipleSelect should be an array of correct options
          if (Array.isArray(studentAnswer)) {
            const chosenOptionIds = studentAnswer.map((id) => parseInt(id));
            // Check if sizes are same and every correct option is in chosen options
            isCorrect =
              chosenOptionIds.length === correctOptionIds.length &&
              correctOptionIds.every((id) => chosenOptionIds.includes(id));
          }
        }
      }

      if (isCorrect) {
        obtainedMarks += question.marks;
      } else if (studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '' && (!Array.isArray(studentAnswer) || studentAnswer.length > 0)) {
        // Apply negative marking if enabled
        if (quiz.negativeMarkingEnabled) {
          const penalty = question.negativeMarks > 0 ? question.negativeMarks : quiz.negativeMarksPerQuestion;
          obtainedMarks -= penalty;
        }
      }
    }

    // Keep marks non-negative
    if (obtainedMarks < 0) {
      obtainedMarks = 0;
    }

    // 2. CALCULATE PERCENTAGE AND GRADE
    const percentage = parseFloat(((obtainedMarks / quiz.totalMarks) * 100).toFixed(2));
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 80) grade = 'A-';
    else if (percentage >= 75) grade = 'B+';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 65) grade = 'B-';
    else if (percentage >= 60) grade = 'C+';
    else if (percentage >= 55) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const updatedSubmission = await quizRepository.updateSubmission(submissionId, {
      submittedAt: now,
      timeTaken: elapsedSeconds,
      obtainedMarks,
      percentage,
      grade,
      answers,
      submissionStatus: isAutoSubmit ? 'Auto Submitted' : 'Submitted',
    });

    // Write Audit Log
    await auditService.log({
      action: isAutoSubmit ? 'QUIZ_AUTO_SUBMITTED' : 'QUIZ_SUBMITTED',
      tableName: 'QuizSubmission',
      recordId: String(submissionId),
      newValue: updatedSubmission,
      userId,
    });

    // Realtime Notifications
    notifyQuizChange(isAutoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED', {
      submissionId,
      quizId: quiz.id,
      quizTitle: quiz.title,
      studentId: submission.studentId,
      obtainedMarks,
      percentage,
      grade,
      teacherId: quiz.teacherId,
    });

    return updatedSubmission;
  }

  // Helpers

  private prepareQuizQuestions(questions: any[], shuffleQuestions: boolean, shuffleOptions: boolean): any[] {
    let prepared = [...questions];

    if (shuffleQuestions) {
      prepared = this.shuffleArray(prepared);
    }

    return prepared.map((q) => {
      // Hide correct answers in responses
      let options = q.options.map((o: any) => ({
        id: o.id,
        optionText: o.optionText,
      }));

      if (shuffleOptions) {
        options = this.shuffleArray(options);
      }

      return {
        id: q.id,
        questionType: q.questionType,
        questionText: q.questionText,
        difficultyLevel: q.difficultyLevel,
        topic: q.topic,
        marks: q.marks,
        attachments: q.attachments,
        options,
      };
    });
  }

  private shuffleArray(array: any[]): any[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

export const quizService = new QuizService();
