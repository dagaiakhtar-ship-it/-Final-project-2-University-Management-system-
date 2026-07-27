import { prisma } from '../services/db.service';
import { Prisma, Building } from '@prisma/client';

export class BuildingRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<Building[]> {
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc', skip, take } = params;

    const where: Prisma.BuildingWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { campus: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields = ['id', 'uuid', 'name', 'code', 'campus', 'status', 'createdAt', 'updatedAt'];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const orderBy: Prisma.BuildingOrderByWithRelationInput = {
      [validatedSortBy]: sortOrder,
    };

    return prisma.building.findMany({
      where,
      orderBy,
      skip,
      take,
    });
  }

  async count(params: { search?: string; status?: string }): Promise<number> {
    const { search, status } = params;

    const where: Prisma.BuildingWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { campus: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.building.count({ where });
  }

  async findById(id: number): Promise<Building | null> {
    return prisma.building.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByUuid(uuid: string): Promise<Building | null> {
    return prisma.building.findFirst({
      where: { uuid, deletedAt: null },
    });
  }

  async findByCode(code: string): Promise<Building | null> {
    return prisma.building.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async create(data: Prisma.BuildingUncheckedCreateInput): Promise<Building> {
    return prisma.building.create({
      data,
    });
  }

  async update(id: number, data: Prisma.BuildingUncheckedUpdateInput): Promise<Building> {
    return prisma.building.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: number, updatedByUserId: string): Promise<Building> {
    return prisma.building.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: updatedByUserId,
      },
    });
  }
}

export const buildingRepository = new BuildingRepository();
export default buildingRepository;
