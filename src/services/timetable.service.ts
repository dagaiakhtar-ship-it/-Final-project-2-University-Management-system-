import { timetableRepository, TimetableWithDetails } from '../repositories/timetable.repository';
import { auditService } from './audit.service';
import { notifyTimetableChange } from './socket.service';
import { prisma } from './db.service';
import {
  TimetableNotFoundError,
  TeacherConflictError,
  RoomConflictError,
  SectionConflictError,
  RoomFullError,
  LaboratoryRequirementError,
  InactiveCourseOfferingError,
} from '../errors/timetable.errors';
import { Timetable } from '@prisma/client';

export class TimetableService {
  async getTimetables(params: {
    search?: string;
    teacherId?: number;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    roomId?: number;
    buildingId?: number;
    subjectId?: number;
    academicYear?: string;
    status?: string;
    dayOfWeek?: string;
    timeSlotId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    timetables: TimetableWithDetails[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [timetables, total] = await Promise.all([
      timetableRepository.findAll({
        ...params,
        skip,
        take: limit,
      }),
      timetableRepository.count(params),
    ]);

    return {
      timetables,
      total,
      page,
      limit,
    };
  }

  async getTimetableByUuid(uuid: string): Promise<TimetableWithDetails> {
    const timetable = await timetableRepository.findByUuid(uuid);
    if (!timetable) {
      throw new TimetableNotFoundError();
    }
    return timetable;
  }

  async createTimetable(
    data: {
      courseOfferingId: number;
      teacherId: number;
      subjectId: number;
      sectionId: number;
      roomId: number;
      timeSlotId: number;
      academicYear: string;
      session: string;
      weeklyRepeat?: boolean;
      effectiveFrom: Date | string;
      effectiveTo: Date | string;
      status?: string;
      notes?: string | null;
    },
    userId: number,
    userEmail: string
  ): Promise<TimetableWithDetails> {
    // 1. Fetch related Course Offering
    const courseOffering = await prisma.courseOffering.findFirst({
      where: { id: data.courseOfferingId, deletedAt: null },
      include: { subject: true, section: true },
    });
    if (!courseOffering) {
      throw new InactiveCourseOfferingError('Associated course offering not found');
    }

    // Check Course Offering status
    if (courseOffering.status === 'Cancelled') {
      throw new InactiveCourseOfferingError('Cannot create a timetable for a cancelled course offering.');
    }

    // 2. Fetch Room
    const room = await prisma.room.findFirst({
      where: { id: data.roomId, deletedAt: null },
    });
    if (!room) {
      throw new RoomFullError('Associated room not found');
    }

    // 3. Room Capacity Check
    const studentsCount = Math.max(courseOffering.currentEnrollment, courseOffering.section?.currentStrength || 0);
    if (room.capacity < studentsCount) {
      throw new RoomFullError(
        `Room capacity (${room.capacity}) is too small for this section/enrollment size (${studentsCount}).`
      );
    }

    // 4. Lab Requirement Check
    if (
      (courseOffering.subject?.subjectType === 'Lab' || courseOffering.subject?.labHours > 0) &&
      room.roomType !== 'Laboratory'
    ) {
      throw new LaboratoryRequirementError(
        `Laboratory room type is required for practical/lab course offering "${courseOffering.courseCode}".`
      );
    }

    // 5. Conflict checks in active schedules
    // Teacher Conflict
    const teacherConflict = await timetableRepository.findTeacherConflict(data.teacherId, data.timeSlotId);
    if (teacherConflict) {
      throw new TeacherConflictError();
    }

    // Room Conflict
    const roomConflict = await timetableRepository.findRoomConflict(data.roomId, data.timeSlotId);
    if (roomConflict) {
      throw new RoomConflictError();
    }

    // Section Conflict
    const sectionConflict = await timetableRepository.findSectionConflict(data.sectionId, data.timeSlotId);
    if (sectionConflict) {
      throw new SectionConflictError();
    }

    // 6. Create Timetable record
    const created = await timetableRepository.create({
      ...data,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: new Date(data.effectiveTo),
      createdBy: userEmail,
      updatedBy: userEmail,
    });

    // Write to audit logs
    await auditService.log({
      action: 'TIMETABLE_CREATED',
      tableName: 'Timetable',
      recordId: created.uuid,
      newValue: created,
      userId,
    });

    // Real-time broadcast
    notifyTimetableChange('CREATED', created);

    return created;
  }

  async updateTimetable(
    uuid: string,
    data: {
      courseOfferingId?: number;
      teacherId?: number;
      subjectId?: number;
      sectionId?: number;
      roomId?: number;
      timeSlotId?: number;
      academicYear?: string;
      session?: string;
      weeklyRepeat?: boolean;
      effectiveFrom?: Date | string;
      effectiveTo?: Date | string;
      status?: string;
      notes?: string | null;
    },
    userId: number,
    userEmail: string
  ): Promise<TimetableWithDetails> {
    const existing = await timetableRepository.findByUuid(uuid);
    if (!existing) {
      throw new TimetableNotFoundError();
    }

    const updatedData: any = { ...data };

    if (data.effectiveFrom) updatedData.effectiveFrom = new Date(data.effectiveFrom);
    if (data.effectiveTo) updatedData.effectiveTo = new Date(data.effectiveTo);

    const targetCourseOfferingId = data.courseOfferingId ?? existing.courseOfferingId;
    const targetRoomId = data.roomId ?? existing.roomId;
    const targetTeacherId = data.teacherId ?? existing.teacherId;
    const targetSectionId = data.sectionId ?? existing.sectionId;
    const targetTimeSlotId = data.timeSlotId ?? existing.timeSlotId;

    // Validate relations if changed
    const courseOffering = await prisma.courseOffering.findFirst({
      where: { id: targetCourseOfferingId, deletedAt: null },
      include: { subject: true, section: true },
    });
    if (!courseOffering) {
      throw new InactiveCourseOfferingError('Associated course offering not found');
    }

    if (courseOffering.status === 'Cancelled') {
      throw new InactiveCourseOfferingError('Associated course offering is cancelled.');
    }

    const room = await prisma.room.findFirst({
      where: { id: targetRoomId, deletedAt: null },
    });
    if (!room) {
      throw new RoomFullError('Associated room not found');
    }

    // Room Capacity check
    const studentsCount = Math.max(courseOffering.currentEnrollment, courseOffering.section?.currentStrength || 0);
    if (room.capacity < studentsCount) {
      throw new RoomFullError(
        `Room capacity (${room.capacity}) is too small for this section/enrollment size (${studentsCount}).`
      );
    }

    // Lab requirement check
    if (
      (courseOffering.subject?.subjectType === 'Lab' || courseOffering.subject?.labHours > 0) &&
      room.roomType !== 'Laboratory'
    ) {
      throw new LaboratoryRequirementError(
        `Laboratory room type is required for practical/lab course offering "${courseOffering.courseCode}".`
      );
    }

    // Conflict Checks
    const teacherConflict = await timetableRepository.findTeacherConflict(targetTeacherId, targetTimeSlotId, existing.id);
    if (teacherConflict) {
      throw new TeacherConflictError();
    }

    const roomConflict = await timetableRepository.findRoomConflict(targetRoomId, targetTimeSlotId, existing.id);
    if (roomConflict) {
      throw new RoomConflictError();
    }

    const sectionConflict = await timetableRepository.findSectionConflict(targetSectionId, targetTimeSlotId, existing.id);
    if (sectionConflict) {
      throw new SectionConflictError();
    }

    const updated = await timetableRepository.update(existing.id, {
      ...updatedData,
      updatedBy: userEmail,
    });

    // Detect specific changes for granular auditing
    let auditAction = 'TIMETABLE_UPDATED';
    if (data.status && data.status !== existing.status) {
      auditAction = 'TIMETABLE_STATUS_CHANGED';
    } else if (data.roomId && data.roomId !== existing.roomId) {
      auditAction = 'TIMETABLE_ROOM_CHANGED';
    } else if (data.teacherId && data.teacherId !== existing.teacherId) {
      auditAction = 'TIMETABLE_TEACHER_CHANGED';
    }

    await auditService.log({
      action: auditAction,
      tableName: 'Timetable',
      recordId: updated.uuid,
      oldValue: existing,
      newValue: updated,
      userId,
    });

    // Real-time broadcast
    notifyTimetableChange('UPDATED', updated);

    return updated;
  }

  async deleteTimetable(uuid: string, userId: number, userEmail: string): Promise<Timetable> {
    const existing = await timetableRepository.findByUuid(uuid);
    if (!existing) {
      throw new TimetableNotFoundError();
    }

    const deleted = await timetableRepository.softDelete(existing.id, userEmail);

    await auditService.log({
      action: 'TIMETABLE_DELETED',
      tableName: 'Timetable',
      recordId: deleted.uuid,
      oldValue: existing,
      userId,
    });

    // Real-time broadcast
    notifyTimetableChange('DELETED', existing);

    return deleted;
  }

  async patchTimetableStatus(
    uuid: string,
    status: string,
    userId: number,
    userEmail: string
  ): Promise<TimetableWithDetails> {
    const existing = await timetableRepository.findByUuid(uuid);
    if (!existing) {
      throw new TimetableNotFoundError();
    }

    const updated = await timetableRepository.update(existing.id, {
      status,
      updatedBy: userEmail,
    });

    await auditService.log({
      action: 'TIMETABLE_STATUS_CHANGED',
      tableName: 'Timetable',
      recordId: updated.uuid,
      oldValue: existing,
      newValue: updated,
      userId,
    });

    notifyTimetableChange('UPDATED', updated);

    return updated;
  }
}

export const timetableService = new TimetableService();
export default timetableService;
