import { timeSlotRepository } from '../repositories/timeslot.repository';
import { auditService } from './audit.service';
import { TimeSlotNotFoundError, DuplicateTimeSlotError } from '../errors/timetable.errors';
import { TimeSlot } from '@prisma/client';

export class TimeSlotService {
  async getTimeSlots(params: {
    dayOfWeek?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    timeSlots: TimeSlot[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [timeSlots, total] = await Promise.all([
      timeSlotRepository.findAll({
        dayOfWeek: params.dayOfWeek,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      timeSlotRepository.count({
        dayOfWeek: params.dayOfWeek,
        status: params.status,
      }),
    ]);

    return {
      timeSlots,
      total,
      page,
      limit,
    };
  }

  async getTimeSlotByUuid(uuid: string): Promise<TimeSlot> {
    const timeSlot = await timeSlotRepository.findByUuid(uuid);
    if (!timeSlot) {
      throw new TimeSlotNotFoundError();
    }
    return timeSlot;
  }

  async createTimeSlot(
    data: {
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      periodNumber: number;
      status?: string;
    },
    userId: number,
    userEmail: string
  ): Promise<TimeSlot> {
    // 1. Check duplicate periodNumber on same dayOfWeek
    const existingPeriod = await timeSlotRepository.findByPeriod(data.dayOfWeek, data.periodNumber);
    if (existingPeriod) {
      throw new DuplicateTimeSlotError(`Period ${data.periodNumber} already exists on ${data.dayOfWeek}.`);
    }

    // 2. Check duplicate time range on same dayOfWeek
    const existingRange = await timeSlotRepository.findByTimeRange(data.dayOfWeek, data.startTime, data.endTime);
    if (existingRange) {
      throw new DuplicateTimeSlotError(`Time slot ${data.startTime} - ${data.endTime} already exists on ${data.dayOfWeek}.`);
    }

    const timeSlot = await timeSlotRepository.create({
      ...data,
      createdBy: userEmail,
      updatedBy: userEmail,
    });

    await auditService.log({
      action: 'TIMESLOT_CREATED',
      tableName: 'TimeSlot',
      recordId: timeSlot.uuid,
      newValue: timeSlot,
      userId,
    });

    return timeSlot;
  }

  async updateTimeSlot(
    uuid: string,
    data: {
      dayOfWeek?: string;
      startTime?: string;
      endTime?: string;
      periodNumber?: number;
      status?: string;
    },
    userId: number,
    userEmail: string
  ): Promise<TimeSlot> {
    const existing = await timeSlotRepository.findByUuid(uuid);
    if (!existing) {
      throw new TimeSlotNotFoundError();
    }

    const targetDayOfWeek = data.dayOfWeek ?? existing.dayOfWeek;
    const targetPeriodNumber = data.periodNumber ?? existing.periodNumber;
    const targetStartTime = data.startTime ?? existing.startTime;
    const targetEndTime = data.endTime ?? existing.endTime;

    if (targetDayOfWeek !== existing.dayOfWeek || targetPeriodNumber !== existing.periodNumber) {
      const duplicatePeriod = await timeSlotRepository.findByPeriod(targetDayOfWeek, targetPeriodNumber);
      if (duplicatePeriod && duplicatePeriod.id !== existing.id) {
        throw new DuplicateTimeSlotError(`Period ${targetPeriodNumber} already exists on ${targetDayOfWeek}.`);
      }
    }

    if (targetDayOfWeek !== existing.dayOfWeek || targetStartTime !== existing.startTime || targetEndTime !== existing.endTime) {
      const duplicateRange = await timeSlotRepository.findByTimeRange(targetDayOfWeek, targetStartTime, targetEndTime);
      if (duplicateRange && duplicateRange.id !== existing.id) {
        throw new DuplicateTimeSlotError(`Time slot ${targetStartTime} - ${targetEndTime} already exists on ${targetDayOfWeek}.`);
      }
    }

    const updated = await timeSlotRepository.update(existing.id, {
      ...data,
      updatedBy: userEmail,
    });

    await auditService.log({
      action: 'TIMESLOT_UPDATED',
      tableName: 'TimeSlot',
      recordId: updated.uuid,
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async deleteTimeSlot(uuid: string, userId: number, userEmail: string): Promise<TimeSlot> {
    const existing = await timeSlotRepository.findByUuid(uuid);
    if (!existing) {
      throw new TimeSlotNotFoundError();
    }

    const deleted = await timeSlotRepository.softDelete(existing.id, userEmail);

    await auditService.log({
      action: 'TIMESLOT_DELETED',
      tableName: 'TimeSlot',
      recordId: deleted.uuid,
      oldValue: existing,
      userId,
    });

    return deleted;
  }
}

export const timeSlotService = new TimeSlotService();
export default timeSlotService;
