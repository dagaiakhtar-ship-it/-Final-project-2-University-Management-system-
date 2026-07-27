import { prisma } from '../services/db.service';
import { Prisma, CourseOffering } from '@prisma/client';

export type CourseOfferingWithRelations = Prisma.CourseOfferingGetPayload<{
  include: {
    department: true;
    program: true;
    semester: true;
    section: true;
    subject: true;
    teacher: {
      include: {
        user: true;
      };
    };
  };
}>;

export class CourseOfferingRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    session?: string;
    academicYear?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    subjectId?: number;
    teacherId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<CourseOfferingWithRelations[]> {
    const {
      search,
      status,
      session,
      academicYear,
      departmentId,
      programId,
      semesterId,
      sectionId,
      subjectId,
      teacherId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip,
      take,
    } = params;

    const where: Prisma.CourseOfferingWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (session) {
      where.session = { equals: session, mode: 'insensitive' };
    }

    if (academicYear) {
      where.academicYear = { equals: academicYear, mode: 'insensitive' };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (search) {
      where.OR = [
        { courseCode: { contains: search, mode: 'insensitive' } },
        { academicYear: { contains: search, mode: 'insensitive' } },
        { session: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          department: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          program: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          semester: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          section: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          subject: {
            name: { contains: search, mode: 'insensitive' },
            code: { contains: search, mode: 'insensitive' },
          },
        },
        {
          teacher: {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const orderBy: Prisma.CourseOfferingOrderByWithRelationInput = {};
    if (sortBy === 'department') {
      orderBy.department = { name: sortOrder };
    } else if (sortBy === 'program') {
      orderBy.program = { name: sortOrder };
    } else if (sortBy === 'semester') {
      orderBy.semester = { name: sortOrder };
    } else if (sortBy === 'section') {
      orderBy.section = { name: sortOrder };
    } else if (sortBy === 'subject') {
      orderBy.subject = { name: sortOrder };
    } else {
      (orderBy as any)[sortBy] = sortOrder;
    }

    return prisma.courseOffering.findMany({
      where,
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    });
  }

  async count(params: {
    search?: string;
    status?: string;
    session?: string;
    academicYear?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    subjectId?: number;
    teacherId?: number;
  }): Promise<number> {
    const {
      search,
      status,
      session,
      academicYear,
      departmentId,
      programId,
      semesterId,
      sectionId,
      subjectId,
      teacherId,
    } = params;

    const where: Prisma.CourseOfferingWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (session) {
      where.session = { equals: session, mode: 'insensitive' };
    }

    if (academicYear) {
      where.academicYear = { equals: academicYear, mode: 'insensitive' };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (search) {
      where.OR = [
        { courseCode: { contains: search, mode: 'insensitive' } },
        { academicYear: { contains: search, mode: 'insensitive' } },
        { session: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          department: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          program: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          semester: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          section: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          subject: {
            name: { contains: search, mode: 'insensitive' },
            code: { contains: search, mode: 'insensitive' },
          },
        },
        {
          teacher: {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    return prisma.courseOffering.count({ where });
  }

  async findById(id: number): Promise<CourseOfferingWithRelations | null> {
    return prisma.courseOffering.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByUuid(uuid: string): Promise<CourseOfferingWithRelations | null> {
    return prisma.courseOffering.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByCourseCode(courseCode: string): Promise<CourseOfferingWithRelations | null> {
    return prisma.courseOffering.findFirst({
      where: { courseCode: { equals: courseCode, mode: 'insensitive' }, deletedAt: null },
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findDuplicate(params: {
    semesterId: number;
    sectionId: number;
    subjectId: number;
    academicYear: string;
    session: string;
    excludeUuid?: string;
  }): Promise<CourseOffering | null> {
    const where: Prisma.CourseOfferingWhereInput = {
      semesterId: params.semesterId,
      sectionId: params.sectionId,
      subjectId: params.subjectId,
      academicYear: { equals: params.academicYear, mode: 'insensitive' },
      session: { equals: params.session, mode: 'insensitive' },
      deletedAt: null,
    };

    if (params.excludeUuid) {
      where.NOT = { uuid: params.excludeUuid };
    }

    return prisma.courseOffering.findFirst({ where });
  }

  async checkTeacherConflict(params: {
    teacherId: number;
    semesterId: number;
    academicYear: string;
    session: string;
    excludeUuid?: string;
  }): Promise<CourseOffering | null> {
    // A teacher can teach multiple courses, but we can have rules if needed.
    // Standard conflict check is just returning null, or checking specific hours.
    // For now we keep it open or check if duplicate.
    return null;
  }

  async create(data: Prisma.CourseOfferingUncheckedCreateInput): Promise<CourseOfferingWithRelations> {
    return prisma.courseOffering.create({
      data,
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Prisma.CourseOfferingUncheckedUpdateInput): Promise<CourseOfferingWithRelations> {
    return prisma.courseOffering.update({
      where: { id },
      data,
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async delete(id: number, deletedBy?: string): Promise<CourseOffering> {
    return prisma.courseOffering.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });
  }

  async findByTeacherId(teacherId: number): Promise<CourseOfferingWithRelations[]> {
    return prisma.courseOffering.findMany({
      where: { teacherId, deletedAt: null },
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySectionId(sectionId: number): Promise<CourseOfferingWithRelations[]> {
    return prisma.courseOffering.findMany({
      where: { sectionId, deletedAt: null },
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySubjectId(subjectId: number): Promise<CourseOfferingWithRelations[]> {
    return prisma.courseOffering.findMany({
      where: { subjectId, deletedAt: null },
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const courseOfferingRepository = new CourseOfferingRepository();
