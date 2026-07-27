import { prisma } from '../services/db.service';
import { Prisma, Section } from '@prisma/client';

export type SectionWithRelations = Prisma.SectionGetPayload<{
  include: {
    semester: {
      include: {
        academicYear: true;
      };
    };
    program: true;
    department: true;
    academicYear: true;
    classAdvisor: {
      include: {
        user: true;
      };
    };
  };
}>;

export class SectionRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    shift?: 'MORNING' | 'EVENING';
    semesterId?: number;
    programId?: number;
    departmentId?: number;
    academicYearId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<SectionWithRelations[]> {
    const {
      search,
      status,
      shift,
      semesterId,
      programId,
      departmentId,
      academicYearId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip,
      take,
    } = params;

    const where: Prisma.SectionWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (shift) {
      where.shift = shift;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          semester: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          program: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          classAdvisor: {
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

    const allowedSortFields = [
      'id',
      'uuid',
      'code',
      'name',
      'status',
      'capacity',
      'currentStrength',
      'shift',
      'createdAt',
      'updatedAt',
    ];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const orderBy: Prisma.SectionOrderByWithRelationInput = {};
    if (sortBy === 'semester') {
      orderBy.semester = {
        name: sortOrder,
      };
    } else if (sortBy === 'program') {
      orderBy.program = {
        name: sortOrder,
      };
    } else {
      (orderBy as any)[validatedSortBy] = sortOrder;
    }

    return prisma.section.findMany({
      where,
      include: {
        semester: {
          include: {
            academicYear: true,
          },
        },
        program: true,
        department: true,
        academicYear: true,
        classAdvisor: {
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
    shift?: 'MORNING' | 'EVENING';
    semesterId?: number;
    programId?: number;
    departmentId?: number;
    academicYearId?: number;
  }): Promise<number> {
    const {
      search,
      status,
      shift,
      semesterId,
      programId,
      departmentId,
      academicYearId,
    } = params;

    const where: Prisma.SectionWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (shift) {
      where.shift = shift;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          semester: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          program: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    return prisma.section.count({ where });
  }

  async findById(id: number): Promise<SectionWithRelations | null> {
    return prisma.section.findFirst({
      where: { id, deletedAt: null },
      include: {
        semester: {
          include: {
            academicYear: true,
          },
        },
        program: true,
        department: true,
        academicYear: true,
        classAdvisor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByUuid(uuid: string): Promise<SectionWithRelations | null> {
    return prisma.section.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        semester: {
          include: {
            academicYear: true,
          },
        },
        program: true,
        department: true,
        academicYear: true,
        classAdvisor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByCodeAndSemester(code: string, semesterId: number): Promise<Section | null> {
    return prisma.section.findFirst({
      where: {
        code,
        semesterId,
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.SectionUncheckedCreateInput): Promise<SectionWithRelations> {
    return prisma.section.create({
      data,
      include: {
        semester: {
          include: {
            academicYear: true,
          },
        },
        program: true,
        department: true,
        academicYear: true,
        classAdvisor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Prisma.SectionUncheckedUpdateInput): Promise<SectionWithRelations> {
    return prisma.section.update({
      where: { id },
      data,
      include: {
        semester: {
          include: {
            academicYear: true,
          },
        },
        program: true,
        department: true,
        academicYear: true,
        classAdvisor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async delete(id: number, deletedBy?: string): Promise<Section> {
    return prisma.section.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });
  }
}
