import { prisma } from '../services/db.service';
import { Prisma, Semester } from '@prisma/client';

export type SemesterWithRelations = Prisma.SemesterGetPayload<{
  include: {
    program: {
      include: {
        department: true;
      };
    };
    academicYear: true;
  };
}>;

export class SemesterRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    programId?: number;
    academicYearId?: number;
    semesterType?: 'REGULAR' | 'SUMMER' | 'WINTER';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<SemesterWithRelations[]> {
    const {
      search,
      status,
      programId,
      academicYearId,
      semesterType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip,
      take,
    } = params;

    const where: Prisma.SemesterWhereInput = {
      deletedAt: null, // Soft delete filter
    };

    if (status) {
      where.status = status as any;
    }

    if (programId) {
      where.programId = programId;
    }

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (semesterType) {
      where.semesterType = semesterType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          program: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          academicYear: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const allowedSortFields = [
      'id',
      'uuid',
      'name',
      'code',
      'semesterNumber',
      'semesterType',
      'status',
      'startDate',
      'endDate',
      'registrationStartDate',
      'registrationEndDate',
      'minCreditHours',
      'maxCreditHours',
      'createdAt',
      'updatedAt',
    ];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const orderBy: Prisma.SemesterOrderByWithRelationInput = {};
    if (sortBy === 'program') {
      orderBy.program = {
        name: sortOrder,
      };
    } else if (sortBy === 'academicYear') {
      orderBy.academicYear = {
        name: sortOrder,
      };
    } else {
      (orderBy as any)[validatedSortBy] = sortOrder;
    }

    return prisma.semester.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        program: {
          include: {
            department: true,
          },
        },
        academicYear: true,
      },
    });
  }

  async count(params: {
    search?: string;
    status?: string;
    programId?: number;
    academicYearId?: number;
    semesterType?: 'REGULAR' | 'SUMMER' | 'WINTER';
  }): Promise<number> {
    const { search, status, programId, academicYearId, semesterType } = params;

    const where: Prisma.SemesterWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status as any;
    }

    if (programId) {
      where.programId = programId;
    }

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (semesterType) {
      where.semesterType = semesterType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          program: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          academicYear: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    return prisma.semester.count({ where });
  }

  async findById(id: number): Promise<SemesterWithRelations | null> {
    return prisma.semester.findFirst({
      where: { id, deletedAt: null },
      include: {
        program: {
          include: {
            department: true,
          },
        },
        academicYear: true,
      },
    });
  }

  async findByUuid(uuid: string): Promise<SemesterWithRelations | null> {
    return prisma.semester.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        program: {
          include: {
            department: true,
          },
        },
        academicYear: true,
      },
    });
  }

  async findByProgramAndSemesterNumber(
    programId: number,
    semesterNumber: number
  ): Promise<Semester | null> {
    return prisma.semester.findFirst({
      where: {
        programId,
        semesterNumber,
        deletedAt: null,
      },
    });
  }

  async findByCode(code: string): Promise<Semester | null> {
    return prisma.semester.findFirst({
      where: {
        code,
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.SemesterUncheckedCreateInput): Promise<SemesterWithRelations> {
    return prisma.semester.create({
      data,
      include: {
        program: {
          include: {
            department: true,
          },
        },
        academicYear: true,
      },
    });
  }

  async update(id: number, data: Prisma.SemesterUncheckedUpdateInput): Promise<SemesterWithRelations> {
    return prisma.semester.update({
      where: { id },
      data,
      include: {
        program: {
          include: {
            department: true,
          },
        },
        academicYear: true,
      },
    });
  }

  async delete(id: number, deletedBy?: string): Promise<Semester> {
    return prisma.semester.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });
  }
}
