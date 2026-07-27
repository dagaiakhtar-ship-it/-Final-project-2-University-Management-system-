import { prisma } from '../services/db.service';
import { Prisma, Enrollment } from '@prisma/client';

export type EnrollmentWithRelations = Prisma.EnrollmentGetPayload<{
  include: {
    student: {
      include: {
        user: true;
        department: true;
        program: true;
        semester: true;
        section: true;
      };
    };
    courseOffering: {
      include: {
        subject: true;
        teacher: {
          include: {
            user: true;
          };
        };
        section: true;
        semester: true;
        program: true;
        department: true;
      };
    };
  };
}>;

export class EnrollmentRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    enrollmentType?: string;
    session?: string;
    academicYear?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    studentId?: number;
    courseOfferingId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }) {
    const {
      search,
      status,
      enrollmentType,
      session,
      academicYear,
      departmentId,
      programId,
      semesterId,
      sectionId,
      studentId,
      courseOfferingId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip = 0,
      take = 20,
    } = params;

    const where: Prisma.EnrollmentWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }
    if (enrollmentType) {
      where.enrollmentType = enrollmentType;
    }
    if (session) {
      where.session = session;
    }
    if (academicYear) {
      where.academicYear = academicYear;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (courseOfferingId) {
      where.courseOfferingId = courseOfferingId;
    }

    if (departmentId || programId || semesterId || sectionId || search) {
      where.student = {};
      if (departmentId) where.student.departmentId = departmentId;
      if (programId) where.student.programId = programId;
      if (semesterId) where.student.semesterId = semesterId;
      if (sectionId) where.student.sectionId = sectionId;

      if (search) {
        where.student.OR = [
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { rollNumber: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }
    }

    const [data, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          student: {
            include: {
              user: true,
              department: true,
              program: true,
              semester: true,
              section: true,
            },
          },
          courseOffering: {
            include: {
              subject: true,
              teacher: {
                include: {
                  user: true,
                },
              },
              section: true,
              semester: true,
              program: true,
              department: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number): Promise<EnrollmentWithRelations | null> {
    return prisma.enrollment.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            user: true,
            department: true,
            program: true,
            semester: true,
            section: true,
          },
        },
        courseOffering: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
            section: true,
            semester: true,
            program: true,
            department: true,
          },
        },
      },
    }) as any;
  }

  async findByUuid(uuid: string): Promise<EnrollmentWithRelations | null> {
    return prisma.enrollment.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        student: {
          include: {
            user: true,
            department: true,
            program: true,
            semester: true,
            section: true,
          },
        },
        courseOffering: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
            section: true,
            semester: true,
            program: true,
            department: true,
          },
        },
      },
    }) as any;
  }

  async findByStudentAndCourseOffering(
    studentId: number,
    courseOfferingId: number
  ): Promise<Enrollment | null> {
    return prisma.enrollment.findFirst({
      where: {
        studentId,
        courseOfferingId,
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.EnrollmentUncheckedCreateInput): Promise<Enrollment> {
    return prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data,
      });

      await tx.courseOffering.update({
        where: { id: data.courseOfferingId },
        data: {
          currentEnrollment: {
            increment: 1,
          },
        },
      });

      return enrollment;
    });
  }

  async update(id: number, data: Prisma.EnrollmentUpdateInput): Promise<Enrollment> {
    return prisma.enrollment.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, courseOfferingId: number): Promise<Enrollment> {
    return prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.courseOffering.update({
        where: { id: courseOfferingId },
        data: {
          currentEnrollment: {
            decrement: 1,
          },
        },
      });

      return enrollment;
    });
  }

  async getSumCreditsByStudent(studentId: number, academicYear: string, session: string): Promise<number> {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
        academicYear,
        session,
        status: {
          in: ['Pending', 'Approved', 'Enrolled'],
        },
        deletedAt: null,
      },
    });

    return enrollments.reduce((sum, e) => sum + e.creditsRegistered, 0);
  }
}
