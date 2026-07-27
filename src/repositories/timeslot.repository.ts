import { prisma } from '../services/db.service';
import { Prisma, TimeSlot } from '@prisma/client';

export class TimeSlotRepository {
  async findAll(params: {
    dayOfWeek?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<TimeSlot[]> {
    const { dayOfWeek, status, sortBy = 'periodNumber', sortOrder = 'asc', skip, take } = params;

    const where: Prisma.TimeSlotWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek;
    }

    const allowedSortFields = ['id', 'uuid', 'dayOfWeek', 'startTime', 'endTime', 'periodNumber', 'status', 'createdAt', 'updatedAt'];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'periodNumber';

    const orderBy: Prisma.TimeSlotOrderByWithRelationInput = {
      [validatedSortBy]: sortOrder,
    };

    return prisma.timeSlot.findMany({
      where,
      orderBy,
      skip,
      take,
    });
  }

  async count(params: { dayOfWeek?: string; status?: string }): Promise<number> {
    const { dayOfWeek, status } = params;

    const where: Prisma.TimeSlotWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek;
    }

    return prisma.timeSlot.count({ where });
  }

  async findById(id: number): Promise<TimeSlot | null> {
    return prisma.timeSlot.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByUuid(uuid: string): Promise<TimeSlot | null> {
    return prisma.timeSlot.findFirst({
      where: { uuid, deletedAt: null },
    });
  }

  async findByPeriod(dayOfWeek: string, periodNumber: number): Promise<TimeSlot | null> {
    return prisma.timeSlot.findFirst({
      where: { dayOfWeek, periodNumber, deletedAt: null },
    });
  }

  async findByTimeRange(dayOfWeek: string, startTime: string, endTime: string): Promise<TimeSlot | null> {
    return prisma.timeSlot.findFirst({
      where: { dayOfWeek, startTime, endTime, deletedAt: null },
    });
  }

  async create(data: Prisma.TimeSlotUncheckedCreateInput): Promise<TimeSlot> {
    return prisma.timeSlot.create({
      data,
    });
  }

  async update(id: number, data: Prisma.TimeSlotUncheckedUpdateInput): Promise<TimeSlot> {
    return prisma.timeSlot.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: number, updatedByUserId: string): Promise<TimeSlot> {
    return prisma.timeSlot.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: updatedByUserId,
      },
    });
  }
}

export const timeSlotRepository = new TimeSlotRepository();
export default timeSlotRepository;
