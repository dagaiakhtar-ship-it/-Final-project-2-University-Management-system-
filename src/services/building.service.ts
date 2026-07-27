import { buildingRepository } from '../repositories/building.repository';
import { auditService } from './audit.service';
import { BuildingNotFoundError, DuplicateBuildingCodeError } from '../errors/timetable.errors';
import { Building } from '@prisma/client';

export class BuildingService {
  async getBuildings(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    buildings: Building[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [buildings, total] = await Promise.all([
      buildingRepository.findAll({
        search: params.search,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      buildingRepository.count({
        search: params.search,
        status: params.status,
      }),
    ]);

    return {
      buildings,
      total,
      page,
      limit,
    };
  }

  async getBuildingByUuid(uuid: string): Promise<Building> {
    const building = await buildingRepository.findByUuid(uuid);
    if (!building) {
      throw new BuildingNotFoundError();
    }
    return building;
  }

  async createBuilding(
    data: {
      name: string;
      code: string;
      campus: string;
      status?: string;
    },
    userId: number,
    userEmail: string
  ): Promise<Building> {
    // Validate uniqueness of code
    const existing = await buildingRepository.findByCode(data.code);
    if (existing) {
      throw new DuplicateBuildingCodeError(`Building with code "${data.code}" already exists.`);
    }

    const building = await buildingRepository.create({
      ...data,
      createdBy: userEmail,
      updatedBy: userEmail,
    });

    await auditService.log({
      action: 'BUILDING_CREATED',
      tableName: 'Building',
      recordId: building.uuid,
      newValue: building,
      userId,
    });

    return building;
  }

  async updateBuilding(
    uuid: string,
    data: {
      name?: string;
      code?: string;
      campus?: string;
      status?: string;
    },
    userId: number,
    userEmail: string
  ): Promise<Building> {
    const existing = await buildingRepository.findByUuid(uuid);
    if (!existing) {
      throw new BuildingNotFoundError();
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await buildingRepository.findByCode(data.code);
      if (duplicate) {
        throw new DuplicateBuildingCodeError(`Building with code "${data.code}" already exists.`);
      }
    }

    const updated = await buildingRepository.update(existing.id, {
      ...data,
      updatedBy: userEmail,
    });

    await auditService.log({
      action: 'BUILDING_UPDATED',
      tableName: 'Building',
      recordId: updated.uuid,
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async deleteBuilding(uuid: string, userId: number, userEmail: string): Promise<Building> {
    const existing = await buildingRepository.findByUuid(uuid);
    if (!existing) {
      throw new BuildingNotFoundError();
    }

    const deleted = await buildingRepository.softDelete(existing.id, userEmail);

    await auditService.log({
      action: 'BUILDING_DELETED',
      tableName: 'Building',
      recordId: deleted.uuid,
      oldValue: existing,
      userId,
    });

    return deleted;
  }
}

export const buildingService = new BuildingService();
export default buildingService;
