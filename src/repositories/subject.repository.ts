import { prisma } from '../services/db.service';
import { Prisma, Subject } from '@prisma/client';

export type SubjectWithRelations = Prisma.SubjectGetPayload<{
  include: {
    department: true;
    program: true;
    semester: {
      include: {
        academicYear: true;
      };
    };
    prerequisite: true;
    teacher: {
      include: {
        user: true;
      };
    };
  };
}>;

export class SubjectRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    subjectType?: string;
    category?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<SubjectWithRelations[]> {
    const {
      search,
      status,
      subjectType,
      category,
      departmentId,
      programId,
      semesterId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip,
      take,
    } = params;

    const where: Prisma.SubjectWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (subjectType) {
      where.subjectType = { equals: subjectType, mode: 'insensitive' };
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
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

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
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
      ];
    }

    const orderBy: Prisma.SubjectOrderByWithRelationInput = {};
    if (sortBy === 'department') {
      orderBy.department = { name: sortOrder };
    } else if (sortBy === 'program') {
      orderBy.program = { name: sortOrder };
    } else if (sortBy === 'semester') {
      orderBy.semester = { name: sortOrder };
    } else {
      (orderBy as any)[sortBy] = sortOrder;
    }

    return prisma.subject.findMany({
      where,
      include: {
        department: true,
        program: true,
        semester: {
          include: {
            academicYear: true,
          },
        },
        prerequisite: true,
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
    subjectType?: string;
    category?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
  }): Promise<number> {
    const {
      search,
      status,
      subjectType,
      category,
      departmentId,
      programId,
      semesterId,
    } = params;

    const where: Prisma.SubjectWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (subjectType) {
      where.subjectType = { equals: subjectType, mode: 'insensitive' };
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
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

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
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
      ];
    }

    return prisma.subject.count({ where });
  }

  async findById(id: number): Promise<SubjectWithRelations | null> {
    return prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        program: true,
        semester: {
          include: {
            academicYear: true,
          },
        },
        prerequisite: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByUuid(uuid: string): Promise<SubjectWithRelations | null> {
    return prisma.subject.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        department: true,
        program: true,
        semester: {
          include: {
            academicYear: true,
          },
        },
        prerequisite: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByCode(code: string): Promise<Subject | null> {
    return prisma.subject.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.SubjectUncheckedCreateInput): Promise<SubjectWithRelations> {
    return prisma.subject.create({
      data,
      include: {
        department: true,
        program: true,
        semester: {
          include: {
            academicYear: true,
          },
        },
        prerequisite: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Prisma.SubjectUncheckedUpdateInput): Promise<SubjectWithRelations> {
    return prisma.subject.update({
      where: { id },
      data,
      include: {
        department: true,
        program: true,
        semester: {
          include: {
            academicYear: true,
          },
        },
        prerequisite: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async delete(id: number, deletedBy?: string): Promise<Subject> {
    return prisma.subject.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });
  }
}
