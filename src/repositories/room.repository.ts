import { prisma } from '../services/db.service';
import { Prisma, Room } from '@prisma/client';

export type RoomWithBuilding = Prisma.RoomGetPayload<{
  include: {
    building: true;
    department: true;
  };
}>;

export class RoomRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    buildingId?: number;
    roomType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<RoomWithBuilding[]> {
    const { search, status, buildingId, roomType, sortBy = 'createdAt', sortOrder = 'desc', skip, take } = params;

    const where: Prisma.RoomWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (buildingId) {
      where.buildingId = buildingId;
    }

    if (roomType) {
      where.roomType = roomType;
    }

    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: 'insensitive' } },
        { roomType: { contains: search, mode: 'insensitive' } },
        { building: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const allowedSortFields = ['id', 'uuid', 'roomNumber', 'roomType', 'capacity', 'status', 'createdAt', 'updatedAt'];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const orderBy: Prisma.RoomOrderByWithRelationInput = {
      [validatedSortBy]: sortOrder,
    };

    return prisma.room.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        building: true,
        department: true,
      },
    });
  }

  async count(params: {
    search?: string;
    status?: string;
    buildingId?: number;
    roomType?: string;
  }): Promise<number> {
    const { search, status, buildingId, roomType } = params;

    const where: Prisma.RoomWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (buildingId) {
      where.buildingId = buildingId;
    }

    if (roomType) {
      where.roomType = roomType;
    }

    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: 'insensitive' } },
        { roomType: { contains: search, mode: 'insensitive' } },
        { building: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return prisma.room.count({ where });
  }

  async findById(id: number): Promise<RoomWithBuilding | null> {
    return prisma.room.findFirst({
      where: { id, deletedAt: null },
      include: {
        building: true,
        department: true,
      },
    });
  }

  async findByUuid(uuid: string): Promise<RoomWithBuilding | null> {
    return prisma.room.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        building: true,
        department: true,
      },
    });
  }

  async findByRoomNumberAndBuilding(roomNumber: string, buildingId: number): Promise<Room | null> {
    return prisma.room.findFirst({
      where: { roomNumber, buildingId, deletedAt: null },
    });
  }

  async create(data: Prisma.RoomUncheckedCreateInput): Promise<RoomWithBuilding> {
    return prisma.room.create({
      data,
      include: {
        building: true,
        department: true,
      },
    });
  }

  async update(id: number, data: Prisma.RoomUncheckedUpdateInput): Promise<RoomWithBuilding> {
    return prisma.room.update({
      where: { id },
      data,
      include: {
        building: true,
        department: true,
      },
    });
  }

  async softDelete(id: number, updatedByUserId: string): Promise<Room> {
    return prisma.room.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: updatedByUserId,
      },
    });
  }
}

export const roomRepository = new RoomRepository();
export default roomRepository;
