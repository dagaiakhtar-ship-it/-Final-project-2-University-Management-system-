import { prisma } from '../services/db.service';
import { Prisma, Assignment, AssignmentSubmission } from '@prisma/client';

export type AssignmentWithRelations = Prisma.AssignmentGetPayload<{
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
      };
    };
  };
}>;

export type SubmissionWithRelations = Prisma.AssignmentSubmissionGetPayload<{
  include: {
    assignment: {
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

export class AssignmentRepository {
  async findAll(params: {
    search?: string;
    courseOfferingId?: number;
    teacherId?: number;
    studentId?: number; // for finding student assignments
    visibilityStatus?: string;
    assignmentType?: string;
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<AssignmentWithRelations[]> {
    const {
      search,
      courseOfferingId,
      teacherId,
      studentId,
      visibilityStatus,
      assignmentType,
      skip,
      take,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.AssignmentWhereInput = {
      softDelete: false,
      deletedAt: null,
    };

    if (courseOfferingId) {
      where.courseOfferingId = courseOfferingId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (studentId) {
      // Filter assignments for a student's enrolled course offerings
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

    if (assignmentType) {
      where.assignmentType = assignmentType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { assignmentCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.AssignmentOrderByWithRelationInput = {};
    const allowedSortFields = ['id', 'assignmentCode', 'title', 'totalMarks', 'passingMarks', 'publishDate', 'dueDate', 'createdAt'];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    (orderBy as any)[validatedSortBy] = sortOrder;

    return prisma.assignment.findMany({
      where,
      orderBy,
      skip,
      take,
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
          },
        },
      },
    });
  }

  async count(params: {
    search?: string;
    courseOfferingId?: number;
    teacherId?: number;
    studentId?: number;
    visibilityStatus?: string;
    assignmentType?: string;
  }): Promise<number> {
    const { search, courseOfferingId, teacherId, studentId, visibilityStatus, assignmentType } = params;

    const where: Prisma.AssignmentWhereInput = {
      softDelete: false,
      deletedAt: null,
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

    if (assignmentType) {
      where.assignmentType = assignmentType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { assignmentCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.assignment.count({ where });
  }

  async findById(id: number): Promise<AssignmentWithRelations | null> {
    return prisma.assignment.findFirst({
      where: { id, softDelete: false, deletedAt: null },
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
          },
        },
      },
    });
  }

  async findByCode(assignmentCode: string): Promise<AssignmentWithRelations | null> {
    return prisma.assignment.findFirst({
      where: { assignmentCode, softDelete: false, deletedAt: null },
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
          },
        },
      },
    });
  }

  async create(data: Prisma.AssignmentUncheckedCreateInput): Promise<Assignment> {
    return prisma.assignment.create({ data });
  }

  async update(id: number, data: Prisma.AssignmentUncheckedUpdateInput): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, userId?: string): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data: {
        softDelete: true,
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // --- Submissions ---

  async findSubmissionById(id: number): Promise<SubmissionWithRelations | null> {
    return prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
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
    });
  }

  async findSubmissions(params: {
    assignmentId?: number;
    studentId?: number;
    enrollmentId?: number;
    teacherId?: number;
    submissionStatus?: string;
    skip?: number;
    take?: number;
  }): Promise<SubmissionWithRelations[]> {
    const { assignmentId, studentId, enrollmentId, teacherId, submissionStatus, skip, take } = params;

    const where: Prisma.AssignmentSubmissionWhereInput = {};

    if (assignmentId) {
      where.assignmentId = assignmentId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (enrollmentId) {
      where.enrollmentId = enrollmentId;
    }
    if (teacherId) {
      where.assignment = {
        teacherId,
      };
    }
    if (submissionStatus) {
      where.submissionStatus = submissionStatus;
    }

    return prisma.assignmentSubmission.findMany({
      where,
      orderBy: [
        { submittedAt: 'desc' },
        { submissionNumber: 'desc' },
      ],
      skip,
      take,
      include: {
        assignment: {
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
    });
  }

  async countSubmissions(params: {
    assignmentId?: number;
    studentId?: number;
    enrollmentId?: number;
    teacherId?: number;
    submissionStatus?: string;
  }): Promise<number> {
    const { assignmentId, studentId, enrollmentId, teacherId, submissionStatus } = params;

    const where: Prisma.AssignmentSubmissionWhereInput = {};

    if (assignmentId) {
      where.assignmentId = assignmentId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (enrollmentId) {
      where.enrollmentId = enrollmentId;
    }
    if (teacherId) {
      where.assignment = {
        teacherId,
      };
    }
    if (submissionStatus) {
      where.submissionStatus = submissionStatus;
    }

    return prisma.assignmentSubmission.count({ where });
  }

  async createSubmission(data: Prisma.AssignmentSubmissionUncheckedCreateInput): Promise<AssignmentSubmission> {
    return prisma.assignmentSubmission.create({ data });
  }

  async updateSubmission(id: number, data: Prisma.AssignmentSubmissionUncheckedUpdateInput): Promise<AssignmentSubmission> {
    return prisma.assignmentSubmission.update({
      where: { id },
      data,
    });
  }
}

export const assignmentRepository = new AssignmentRepository();
