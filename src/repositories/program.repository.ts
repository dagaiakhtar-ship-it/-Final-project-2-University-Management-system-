import { prisma } from '../services/db.service';
import { Prisma, Program } from '@prisma/client';

export type ProgramWithRelations = Prisma.ProgramGetPayload<{
  include: {
    department: true;
    coordinator: {
      include: {
        user: true;
      };
    };
  };
}>;

export class ProgramRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    departmentId?: number;
    degreeLevel?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<ProgramWithRelations[]> {
    const { search, status, departmentId, degreeLevel, sortBy = 'createdAt', sortOrder = 'desc', skip, take } = params;

    const where: Prisma.ProgramWhereInput = {
      deletedAt: null, // Soft delete filter
    };

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (degreeLevel) {
      where.degreeLevel = degreeLevel;
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
      ];
    }

    const allowedSortFields = [
      'id', 'uuid', 'name', 'code', 'shortName', 'degreeLevel', 
      'duration', 'totalSemesters', 'creditHours', 'status', 'createdAt', 'updatedAt'
    ];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const orderBy: Prisma.ProgramOrderByWithRelationInput = {};
    if (sortBy === 'department') {
      orderBy.department = {
        name: sortOrder,
      };
    } else if (sortBy === 'coordinator') {
      orderBy.coordinator = {
        user: {
          firstName: sortOrder,
        },
      };
    } else {
      (orderBy as any)[validatedSortBy] = sortOrder;
    }

    return prisma.program.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        department: true,
        coordinator: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async count(params: {
    search?: string;
    status?: string;
    departmentId?: number;
    degreeLevel?: string;
  }): Promise<number> {
    const { search, status, departmentId, degreeLevel } = params;

    const where: Prisma.ProgramWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (degreeLevel) {
      where.degreeLevel = degreeLevel;
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
      ];
    }

    return prisma.program.count({ where });
  }

  async findById(id: number): Promise<ProgramWithRelations | null> {
    return prisma.program.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        coordinator: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByUuid(uuid: string): Promise<ProgramWithRelations | null> {
    return prisma.program.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        department: true,
        coordinator: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByCode(code: string): Promise<Program | null> {
    return prisma.program.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async findByNameAndDepartment(name: string, departmentId: number): Promise<Program | null> {
    return prisma.program.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        departmentId,
        deletedAt: null,
      },
    });
  }

  async findByDepartmentId(departmentId: number): Promise<ProgramWithRelations[]> {
    return prisma.program.findMany({
      where: { departmentId, deletedAt: null },
      include: {
        department: true,
        coordinator: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.ProgramUncheckedCreateInput): Promise<ProgramWithRelations> {
    return prisma.program.create({
      data,
      include: {
        department: true,
        coordinator: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Prisma.ProgramUncheckedUpdateInput): Promise<ProgramWithRelations> {
    return prisma.program.update({
      where: { id },
      data,
      include: {
        department: true,
        coordinator: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async softDelete(id: number, updatedByUserId: string): Promise<Program> {
    return prisma.program.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: updatedByUserId,
      },
    });
  }
}

export const programRepository = new ProgramRepository();
export default programRepository;
