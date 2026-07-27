import { prisma } from '../services/db.service';
import { Prisma } from '@prisma/client';

export class FacilityBookingRepository {
  async findAll(params: {
    search?: string;
    approvalStatus?: string;
    roomId?: number;
    bookedBy?: string;
    skip?: number;
    take?: number;
  }) {
    const { search, approvalStatus, roomId, bookedBy, skip, take } = params;
    const where: Prisma.FacilityBookingWhereInput = {};

    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }
    if (roomId) {
      where.roomId = roomId;
    }
    if (bookedBy) {
      where.bookedBy = { contains: bookedBy, mode: 'insensitive' as const };
    }
    if (search) {
      where.OR = [
        { bookingPurpose: { contains: search, mode: 'insensitive' as const } },
        { bookedBy: { contains: search, mode: 'insensitive' as const } },
        { room: { roomNumber: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    return prisma.facilityBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        room: {
          include: {
            building: true,
          },
        },
      },
    });
  }

  async count(params: {
    search?: string;
    approvalStatus?: string;
    roomId?: number;
    bookedBy?: string;
  }) {
    const { search, approvalStatus, roomId, bookedBy } = params;
    const where: Prisma.FacilityBookingWhereInput = {};

    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }
    if (roomId) {
      where.roomId = roomId;
    }
    if (bookedBy) {
      where.bookedBy = { contains: bookedBy, mode: 'insensitive' as const };
    }
    if (search) {
      where.OR = [
        { bookingPurpose: { contains: search, mode: 'insensitive' as const } },
        { bookedBy: { contains: search, mode: 'insensitive' as const } },
        { room: { roomNumber: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    return prisma.facilityBooking.count({ where });
  }

  async findById(id: number) {
    return prisma.facilityBooking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            building: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.FacilityBookingUncheckedCreateInput) {
    return prisma.facilityBooking.create({
      data,
      include: {
        room: {
          include: {
            building: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Prisma.FacilityBookingUncheckedUpdateInput) {
    return prisma.facilityBooking.update({
      where: { id },
      data,
      include: {
        room: {
          include: {
            building: true,
          },
        },
      },
    });
  }

  async delete(id: number) {
    return prisma.facilityBooking.delete({
      where: { id },
    });
  }
}

export class MaintenanceRequestRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    priority?: string;
    buildingId?: number;
    roomId?: number;
    assignedTo?: string;
    skip?: number;
    take?: number;
  }) {
    const { search, status, priority, buildingId, roomId, assignedTo, skip, take } = params;
    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (buildingId) where.buildingId = buildingId;
    if (roomId) where.roomId = roomId;
    if (assignedTo) where.assignedTo = assignedTo;
    
    if (search) {
      where.OR = [
        { issueDescription: { contains: search, mode: 'insensitive' as const } },
        { requestedBy: { contains: search, mode: 'insensitive' as const } },
        { issueCategory: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    return prisma.maintenanceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        building: true,
        room: true,
      },
    });
  }

  async count(params: {
    search?: string;
    status?: string;
    priority?: string;
    buildingId?: number;
    roomId?: number;
    assignedTo?: string;
  }) {
    const { search, status, priority, buildingId, roomId, assignedTo } = params;
    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (buildingId) where.buildingId = buildingId;
    if (roomId) where.roomId = roomId;
    if (assignedTo) where.assignedTo = assignedTo;

    if (search) {
      where.OR = [
        { issueDescription: { contains: search, mode: 'insensitive' as const } },
        { requestedBy: { contains: search, mode: 'insensitive' as const } },
        { issueCategory: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    return prisma.maintenanceRequest.count({ where });
  }

  async findById(id: number) {
    return prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        building: true,
        room: true,
      },
    });
  }

  async create(data: Prisma.MaintenanceRequestUncheckedCreateInput) {
    return prisma.maintenanceRequest.create({
      data,
      include: {
        building: true,
        room: true,
      },
    });
  }

  async update(id: number, data: Prisma.MaintenanceRequestUncheckedUpdateInput) {
    return prisma.maintenanceRequest.update({
      where: { id },
      data,
      include: {
        building: true,
        room: true,
      },
    });
  }
}

export const facilityBookingRepository = new FacilityBookingRepository();
export const maintenanceRequestRepository = new MaintenanceRequestRepository();
