import { prisma } from '../services/db.service';
import { Prisma, Quiz, QuestionBank, QuestionOption, QuizSubmission } from '@prisma/client';

export type QuizWithRelations = Prisma.QuizGetPayload<{
  include: {
    courseOffering: {
      include: {
        subject: true;
        section: true;
        semester: true;
      };
    };
    teacher: {
      include: {
        user: true;
      };
    };
    _count: {
      select: {
        submissions: true;
        questions: true;
      };
    };
  };
}>;

export type QuestionWithRelations = Prisma.QuestionBankGetPayload<{
  include: {
    options: true;
    courseOffering: {
      include: {
        subject: true;
      };
    };
  };
}>;

export type QuizSubmissionWithRelations = Prisma.QuizSubmissionGetPayload<{
  include: {
    quiz: {
      include: {
        courseOffering: {
          include: {
            subject: true;
          };
        };
      };
    };
    student: {
      include: {
        user: true;
      };
    };
    enrollment: true;
  };
}>;

export class QuizRepository {
  // FIND ALL QUIZZES
  async findAll(params: {
    search?: string;
    courseOfferingId?: number;
    teacherId?: number;
    studentId?: number;
    visibilityStatus?: string;
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<QuizWithRelations[]> {
    const {
      search,
      courseOfferingId,
      teacherId,
      studentId,
      visibilityStatus,
      skip,
      take,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.QuizWhereInput = {
      softDelete: false,
    };

    if (courseOfferingId) {
      where.courseOfferingId = courseOfferingId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (studentId) {
      where.courseOffering = {
        enrollments: {
          some: {
            studentId,
            status: 'Enrolled',
          },
        },
      };
    }

    if (visibilityStatus) {
      where.visibilityStatus = visibilityStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { quizCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.quiz.findMany({
      where,
      include: {
        courseOffering: {
          include: {
            subject: true,
            section: true,
            semester: true,
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            questions: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }) as unknown as Promise<QuizWithRelations[]>;
  }

  // COUNT QUIZZES
  async count(params: {
    search?: string;
    courseOfferingId?: number;
    teacherId?: number;
    studentId?: number;
    visibilityStatus?: string;
  }): Promise<number> {
    const { search, courseOfferingId, teacherId, studentId, visibilityStatus } = params;

    const where: Prisma.QuizWhereInput = {
      softDelete: false,
    };

    if (courseOfferingId) {
      where.courseOfferingId = courseOfferingId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (studentId) {
      where.courseOffering = {
        enrollments: {
          some: {
            studentId,
            status: 'Enrolled',
          },
        },
      };
    }

    if (visibilityStatus) {
      where.visibilityStatus = visibilityStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { quizCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.quiz.count({ where });
  }

  // FIND QUIZ BY ID OR UUID WITH QUESTIONS
  async findById(id: number): Promise<(Quiz & { questions: (QuestionBank & { options: QuestionOption[] })[] }) | null> {
    return prisma.quiz.findFirst({
      where: {
        id,
        softDelete: false,
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
        },
      },
    }) as any;
  }

  // CREATE QUIZ
  async create(data: Prisma.QuizUncheckedCreateInput & { questionIds?: number[] }): Promise<Quiz> {
    const { questionIds, ...quizData } = data;
    const connectQuestions = questionIds && questionIds.length > 0
      ? { connect: questionIds.map((id) => ({ id })) }
      : undefined;

    return prisma.quiz.create({
      data: {
        ...quizData,
        questions: connectQuestions,
      },
    });
  }

  // UPDATE QUIZ
  async update(id: number, data: Prisma.QuizUncheckedUpdateInput & { questionIds?: number[] }): Promise<Quiz> {
    const { questionIds, ...quizData } = data;
    let questionsRelation: any = undefined;

    if (questionIds) {
      questionsRelation = {
        set: questionIds.map((id) => ({ id })),
      };
    }

    return prisma.quiz.update({
      where: { id },
      data: {
        ...quizData,
        questions: questionsRelation,
      },
    });
  }

  // DELETE QUIZ (SOFT)
  async delete(id: number, updatedBy?: string): Promise<Quiz> {
    return prisma.quiz.update({
      where: { id },
      data: {
        softDelete: true,
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  // QUESTION BANK - FIND ALL
  async findQuestions(params: {
    courseOfferingId?: number;
    teacherId?: number;
    search?: string;
    topic?: string;
    difficultyLevel?: string;
    questionType?: string;
    skip?: number;
    take?: number;
  }): Promise<QuestionWithRelations[]> {
    const {
      courseOfferingId,
      teacherId,
      search,
      topic,
      difficultyLevel,
      questionType,
      skip,
      take,
    } = params;

    const where: Prisma.QuestionBankWhereInput = {};

    if (courseOfferingId) {
      where.courseOfferingId = courseOfferingId;
    }
    if (teacherId) {
      where.teacherId = teacherId;
    }
    if (topic) {
      where.topic = topic;
    }
    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }
    if (questionType) {
      where.questionType = questionType;
    }
    if (search) {
      where.questionText = { contains: search, mode: 'insensitive' };
    }

    return prisma.questionBank.findMany({
      where,
      include: {
        options: true,
        courseOffering: {
          include: {
            subject: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    }) as unknown as Promise<QuestionWithRelations[]>;
  }

  // QUESTION BANK - COUNT
  async countQuestions(params: {
    courseOfferingId?: number;
    teacherId?: number;
    search?: string;
    topic?: string;
    difficultyLevel?: string;
    questionType?: string;
  }): Promise<number> {
    const { courseOfferingId, teacherId, search, topic, difficultyLevel, questionType } = params;

    const where: Prisma.QuestionBankWhereInput = {};

    if (courseOfferingId) {
      where.courseOfferingId = courseOfferingId;
    }
    if (teacherId) {
      where.teacherId = teacherId;
    }
    if (topic) {
      where.topic = topic;
    }
    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }
    if (questionType) {
      where.questionType = questionType;
    }
    if (search) {
      where.questionText = { contains: search, mode: 'insensitive' };
    }

    return prisma.questionBank.count({ where });
  }

  // CREATE QUESTION
  async createQuestion(
    data: Prisma.QuestionBankUncheckedCreateInput & { options: { optionText: string; isCorrect: boolean }[] }
  ): Promise<QuestionBank & { options: QuestionOption[] }> {
    const { options, ...questionData } = data;

    return prisma.questionBank.create({
      data: {
        ...questionData,
        options: {
          create: options,
        },
      },
      include: {
        options: true,
      },
    });
  }

  // UPDATE QUESTION
  async updateQuestion(
    id: number,
    data: Prisma.QuestionBankUncheckedUpdateInput & { options?: { id?: number; optionText: string; isCorrect: boolean }[] }
  ): Promise<QuestionBank & { options: QuestionOption[] }> {
    const { options, ...questionData } = data;

    // If options are provided, we'll recreate or update them
    if (options) {
      // For simplicity and database rules safety: delete existing, create new
      await prisma.questionOption.deleteMany({
        where: { questionId: id },
      });

      return prisma.questionBank.update({
        where: { id },
        data: {
          ...questionData,
          options: {
            create: options.map(opt => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            })),
          },
        },
        include: {
          options: true,
        },
      });
    }

    return prisma.questionBank.update({
      where: { id },
      data: questionData,
      include: {
        options: true,
      },
    });
  }

  // DELETE QUESTION
  async deleteQuestion(id: number): Promise<void> {
    await prisma.questionBank.delete({
      where: { id },
    });
  }

  // FIND SUBMISSION BY ID
  async findSubmissionById(id: number): Promise<QuizSubmissionWithRelations | null> {
    return prisma.quizSubmission.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            courseOffering: {
              include: {
                subject: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        enrollment: true,
      },
    }) as unknown as Promise<QuizSubmissionWithRelations | null>;
  }

  // FIND ACTIVE SUBMISSION (IN PROGRESS) FOR STUDENT
  async findActiveSubmission(studentId: number, quizId: number): Promise<QuizSubmission | null> {
    return prisma.quizSubmission.findFirst({
      where: {
        studentId,
        quizId,
        submissionStatus: 'In Progress',
      },
    });
  }

  // GET SUBMISSIONS
  async findSubmissions(params: {
    quizId?: number;
    studentId?: number;
    enrollmentId?: number;
    teacherId?: number;
    submissionStatus?: string;
    skip?: number;
    take?: number;
  }): Promise<QuizSubmissionWithRelations[]> {
    const { quizId, studentId, enrollmentId, teacherId, submissionStatus, skip, take } = params;

    const where: Prisma.QuizSubmissionWhereInput = {};

    if (quizId) {
      where.quizId = quizId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (enrollmentId) {
      where.enrollmentId = enrollmentId;
    }
    if (teacherId) {
      where.quiz = {
        teacherId,
      };
    }
    if (submissionStatus) {
      where.submissionStatus = submissionStatus;
    }

    return prisma.quizSubmission.findMany({
      where,
      include: {
        quiz: {
          include: {
            courseOffering: {
              include: {
                subject: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        enrollment: true,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    }) as unknown as Promise<QuizSubmissionWithRelations[]>;
  }

  // COUNT SUBMISSIONS
  async countSubmissions(params: {
    quizId?: number;
    studentId?: number;
    enrollmentId?: number;
    teacherId?: number;
    submissionStatus?: string;
  }): Promise<number> {
    const { quizId, studentId, enrollmentId, teacherId, submissionStatus } = params;

    const where: Prisma.QuizSubmissionWhereInput = {};

    if (quizId) {
      where.quizId = quizId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (enrollmentId) {
      where.enrollmentId = enrollmentId;
    }
    if (teacherId) {
      where.quiz = {
        teacherId,
      };
    }
    if (submissionStatus) {
      where.submissionStatus = submissionStatus;
    }

    return prisma.quizSubmission.count({ where });
  }

  // CREATE SUBMISSION
  async createSubmission(data: Prisma.QuizSubmissionUncheckedCreateInput): Promise<QuizSubmission> {
    return prisma.quizSubmission.create({ data });
  }

  // UPDATE SUBMISSION
  async updateSubmission(id: number, data: Prisma.QuizSubmissionUncheckedUpdateInput): Promise<QuizSubmission> {
    return prisma.quizSubmission.update({
      where: { id },
      data,
    });
  }
}

export const quizRepository = new QuizRepository();
