import { roomRepository, RoomWithBuilding } from '../repositories/room.repository';
import { buildingRepository } from '../repositories/building.repository';
import { auditService } from './audit.service';
import { RoomNotFoundError, BuildingNotFoundError, DuplicateRoomNumberError } from '../errors/timetable.errors';
import { Room } from '@prisma/client';

export class RoomService {
  async getRooms(params: {
    search?: string;
    status?: string;
    buildingId?: number;
    roomType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    rooms: RoomWithBuilding[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      roomRepository.findAll({
        search: params.search,
        status: params.status,
        buildingId: params.buildingId,
        roomType: params.roomType,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      roomRepository.count({
        search: params.search,
        status: params.status,
        buildingId: params.buildingId,
        roomType: params.roomType,
      }),
    ]);

    return {
      rooms,
      total,
      page,
      limit,
    };
  }

  async getRoomByUuid(uuid: string): Promise<RoomWithBuilding> {
    const room = await roomRepository.findByUuid(uuid);
    if (!room) {
      throw new RoomNotFoundError();
    }
    return room;
  }

  async createRoom(
    data: {
      buildingId: number;
      roomNumber: string;
      roomType: string;
      capacity: number;
      status?: string;
      departmentId?: number | null;
    },
    userId: number,
    userEmail: string
  ): Promise<RoomWithBuilding> {
    // Check if building exists
    const building = await buildingRepository.findById(data.buildingId);
    if (!building) {
      throw new BuildingNotFoundError();
    }

    // Check if duplicate roomNumber in the same building
    const duplicate = await roomRepository.findByRoomNumberAndBuilding(data.roomNumber, data.buildingId);
    if (duplicate) {
      throw new DuplicateRoomNumberError(`Room "${data.roomNumber}" already exists in building "${building.name}".`);
    }

    const room = await roomRepository.create({
      ...data,
      createdBy: userEmail,
      updatedBy: userEmail,
    });

    await auditService.log({
      action: 'ROOM_CREATED',
      tableName: 'Room',
      recordId: room.uuid,
      newValue: room,
      userId,
    });

    return room;
  }

  async updateRoom(
    uuid: string,
    data: {
      buildingId?: number;
      roomNumber?: string;
      roomType?: string;
      capacity?: number;
      status?: string;
      departmentId?: number | null;
    },
    userId: number,
    userEmail: string
  ): Promise<RoomWithBuilding> {
    const existing = await roomRepository.findByUuid(uuid);
    if (!existing) {
      throw new RoomNotFoundError();
    }

    const targetBuildingId = data.buildingId ?? existing.buildingId;
    const targetRoomNumber = data.roomNumber ?? existing.roomNumber;

    if (data.buildingId && data.buildingId !== existing.buildingId) {
      const building = await buildingRepository.findById(data.buildingId);
      if (!building) {
        throw new BuildingNotFoundError();
      }
    }

    if (targetRoomNumber !== existing.roomNumber || targetBuildingId !== existing.buildingId) {
      const duplicate = await roomRepository.findByRoomNumberAndBuilding(targetRoomNumber, targetBuildingId);
      if (duplicate) {
        throw new DuplicateRoomNumberError(`Room "${targetRoomNumber}" already exists in this building.`);
      }
    }

    const updated = await roomRepository.update(existing.id, {
      ...data,
      updatedBy: userEmail,
    });

    await auditService.log({
      action: 'ROOM_UPDATED',
      tableName: 'Room',
      recordId: updated.uuid,
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async deleteRoom(uuid: string, userId: number, userEmail: string): Promise<Room> {
    const existing = await roomRepository.findByUuid(uuid);
    if (!existing) {
      throw new RoomNotFoundError();
    }

    const deleted = await roomRepository.softDelete(existing.id, userEmail);

    await auditService.log({
      action: 'ROOM_DELETED',
      tableName: 'Room',
      recordId: deleted.uuid,
      oldValue: existing,
      userId,
    });

    return deleted;
  }
}

export const roomService = new RoomService();
export default roomService;
