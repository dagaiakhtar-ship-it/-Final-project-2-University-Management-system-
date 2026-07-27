import { prisma } from '../services/db.service';
import { Prisma, Department } from '@prisma/client';

export type DepartmentWithHead = Prisma.DepartmentGetPayload<{
  include: {
    headOfDepartment: {
      include: {
        user: true;
      };
    };
  };
}>;

export class DepartmentRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<DepartmentWithHead[]> {
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc', skip, take } = params;

    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null, // Soft delete filter
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { faculty: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields = [
      'id', 'uuid', 'name', 'code', 'shortName', 'description', 
      'faculty', 'officeLocation', 'officePhone', 'officeEmail', 
      'status', 'createdAt', 'updatedAt'
    ];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const orderBy: Prisma.DepartmentOrderByWithRelationInput = {};
    if (sortBy === 'headOfDepartment') {
      orderBy.headOfDepartment = {
        user: {
          firstName: sortOrder,
        },
      };
    } else {
      (orderBy as any)[validatedSortBy] = sortOrder;
    }

    return prisma.department.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        headOfDepartment: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async count(params: { search?: string; status?: string }): Promise<number> {
    const { search, status } = params;

    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { faculty: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.department.count({ where });
  }

  async findById(id: number): Promise<DepartmentWithHead | null> {
    return prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        headOfDepartment: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByUuid(uuid: string): Promise<DepartmentWithHead | null> {
    return prisma.department.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        headOfDepartment: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByCode(code: string): Promise<Department | null> {
    return prisma.department.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async findByName(name: string): Promise<Department | null> {
    return prisma.department.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async create(data: Prisma.DepartmentUncheckedCreateInput): Promise<DepartmentWithHead> {
    return prisma.department.create({
      data,
      include: {
        headOfDepartment: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Prisma.DepartmentUncheckedUpdateInput): Promise<DepartmentWithHead> {
    return prisma.department.update({
      where: { id },
      data,
      include: {
        headOfDepartment: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async softDelete(id: number, updatedByUserId: string): Promise<Department> {
    return prisma.department.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: updatedByUserId,
      },
    });
  }
}

export const departmentRepository = new DepartmentRepository();
export default departmentRepository;
