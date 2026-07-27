import { courseOfferingRepository, CourseOfferingWithRelations } from '../repositories/course-offering.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import {
  CourseOfferingNotFoundError,
  DuplicateCourseOfferingError,
  InvalidCourseOfferingRelationshipError,
  InvalidDatesError,
} from '../errors/course-offering.errors';

export class CourseOfferingService {
  async getCourseOfferings(params: {
    search?: string;
    status?: string;
    session?: string;
    academicYear?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    subjectId?: number;
    teacherId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    courseOfferings: CourseOfferingWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [courseOfferings, total] = await Promise.all([
      courseOfferingRepository.findAll({
        search: params.search,
        status: params.status,
        session: params.session,
        academicYear: params.academicYear,
        departmentId: params.departmentId,
        programId: params.programId,
        semesterId: params.semesterId,
        sectionId: params.sectionId,
        subjectId: params.subjectId,
        teacherId: params.teacherId,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      courseOfferingRepository.count({
        search: params.search,
        status: params.status,
        session: params.session,
        academicYear: params.academicYear,
        departmentId: params.departmentId,
        programId: params.programId,
        semesterId: params.semesterId,
        sectionId: params.sectionId,
        subjectId: params.subjectId,
        teacherId: params.teacherId,
      }),
    ]);

    return {
      courseOfferings,
      total,
      page,
      limit,
    };
  }

  async getCourseOfferingByUuid(uuid: string): Promise<CourseOfferingWithRelations> {
    const offering = await courseOfferingRepository.findByUuid(uuid);
    if (!offering) {
      throw new CourseOfferingNotFoundError();
    }
    return offering;
  }

  async createCourseOffering(
    data: {
      departmentId: number;
      programId: number;
      semesterId: number;
      sectionId: number;
      subjectId: number;
      teacherId: number;
      academicYear: string;
      session: string;
      startDate: Date;
      endDate: Date;
      weeklyLectureHours: number;
      weeklyLabHours: number;
      maxStudents: number;
      status?: string;
      description?: string | null;
    },
    userId: number
  ): Promise<CourseOfferingWithRelations> {
    // 1. Validate dates
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new InvalidDatesError();
    }

    // 2. Validate relations exist and are active
    const [dept, prog, sem, sect, subj, teach] = await Promise.all([
      prisma.department.findFirst({ where: { id: data.departmentId, deletedAt: null } }),
      prisma.program.findFirst({ where: { id: data.programId, deletedAt: null } }),
      prisma.semester.findFirst({ where: { id: data.semesterId, deletedAt: null } }),
      prisma.section.findFirst({ where: { id: data.sectionId, deletedAt: null } }),
      prisma.subject.findFirst({ where: { id: data.subjectId, deletedAt: null } }),
      prisma.teacher.findFirst({ where: { id: data.teacherId, deletedAt: null } }),
    ]);

    if (!dept || !prog || !sem || !sect || !subj || !teach) {
      throw new InvalidCourseOfferingRelationshipError(
        'One or more of the selected Department, Program, Semester, Section, Subject, or Teacher do not exist.'
      );
    }

    // 3. Prevent duplicate offering of same subject to same section in same semester & session & academicYear
    const duplicate = await courseOfferingRepository.findDuplicate({
      semesterId: data.semesterId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
      academicYear: data.academicYear,
      session: data.session,
    });

    if (duplicate) {
      throw new DuplicateCourseOfferingError(
        `This Subject is already offered to the selected Section for the ${data.session} ${data.academicYear} semester.`
      );
    }

    // 4. Generate unique Course Code
    let courseCode = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      courseCode = `CO-${randomSuffix}`;
      const existingCode = await courseOfferingRepository.findByCourseCode(courseCode);
      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!courseCode) {
      courseCode = `CO-${Date.now().toString().slice(-6)}`;
    }

    // 5. Create
    const created = await courseOfferingRepository.create({
      ...data,
      courseCode,
      currentEnrollment: 0,
      createdBy: String(userId),
    });

    // 6. Audit Log
    await auditService.log({
      action: 'COURSE_OFFERING_CREATED',
      tableName: 'CourseOffering',
      recordId: String(created.id),
      newValue: created,
      userId,
    });

    return created;
  }

  async updateCourseOffering(
    uuid: string,
    data: {
      departmentId?: number;
      programId?: number;
      semesterId?: number;
      sectionId?: number;
      subjectId?: number;
      teacherId?: number;
      academicYear?: string;
      session?: string;
      startDate?: Date;
      endDate?: Date;
      weeklyLectureHours?: number;
      weeklyLabHours?: number;
      maxStudents?: number;
      status?: string;
      description?: string | null;
    },
    userId: number
  ): Promise<CourseOfferingWithRelations> {
    const existing = await courseOfferingRepository.findByUuid(uuid);
    if (!existing) {
      throw new CourseOfferingNotFoundError();
    }

    // Date validation if both are updated, or comparison with existing
    const newStart = data.startDate ? new Date(data.startDate) : new Date(existing.startDate);
    const newEnd = data.endDate ? new Date(data.endDate) : new Date(existing.endDate);
    if (newStart >= newEnd) {
      throw new InvalidDatesError();
    }

    // Relations validation if updated
    if (data.departmentId || data.programId || data.semesterId || data.sectionId || data.subjectId || data.teacherId) {
      const [dept, prog, sem, sect, subj, teach] = await Promise.all([
        data.departmentId ? prisma.department.findFirst({ where: { id: data.departmentId, deletedAt: null } }) : true,
        data.programId ? prisma.program.findFirst({ where: { id: data.programId, deletedAt: null } }) : true,
        data.semesterId ? prisma.semester.findFirst({ where: { id: data.semesterId, deletedAt: null } }) : true,
        data.sectionId ? prisma.section.findFirst({ where: { id: data.sectionId, deletedAt: null } }) : true,
        data.subjectId ? prisma.subject.findFirst({ where: { id: data.subjectId, deletedAt: null } }) : true,
        data.teacherId ? prisma.teacher.findFirst({ where: { id: data.teacherId, deletedAt: null } }) : true,
      ]);

      if (!dept || !prog || !sem || !sect || !subj || !teach) {
        throw new InvalidCourseOfferingRelationshipError();
      }
    }

    // Duplicate prevention if key fields change
    const semId = data.semesterId ?? existing.semesterId;
    const sectId = data.sectionId ?? existing.sectionId;
    const subjId = data.subjectId ?? existing.subjectId;
    const acadYear = data.academicYear ?? existing.academicYear;
    const sess = data.session ?? existing.session;

    if (
      data.semesterId ||
      data.sectionId ||
      data.subjectId ||
      data.academicYear ||
      data.session
    ) {
      const duplicate = await courseOfferingRepository.findDuplicate({
        semesterId: semId,
        sectionId: sectId,
        subjectId: subjId,
        academicYear: acadYear,
        session: sess,
        excludeUuid: uuid,
      });

      if (duplicate) {
        throw new DuplicateCourseOfferingError(
          `This Subject is already offered to the selected Section for the ${sess} ${acadYear} semester.`
        );
      }
    }

    // Update
    const updated = await courseOfferingRepository.update(existing.id, {
      ...data,
      updatedBy: String(userId),
    });

    // Audit Log
    await auditService.log({
      action: 'COURSE_OFFERING_UPDATED',
      tableName: 'CourseOffering',
      recordId: String(existing.id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async deleteCourseOffering(uuid: string, userId: number): Promise<void> {
    const existing = await courseOfferingRepository.findByUuid(uuid);
    if (!existing) {
      throw new CourseOfferingNotFoundError();
    }

    await courseOfferingRepository.delete(existing.id, String(userId));

    // Audit Log
    await auditService.log({
      action: 'COURSE_OFFERING_DELETED',
      tableName: 'CourseOffering',
      recordId: String(existing.id),
      oldValue: existing,
      userId,
    });
  }

  async toggleCourseOfferingStatus(uuid: string, status: string, userId: number): Promise<CourseOfferingWithRelations> {
    const existing = await courseOfferingRepository.findByUuid(uuid);
    if (!existing) {
      throw new CourseOfferingNotFoundError();
    }

    const updated = await courseOfferingRepository.update(existing.id, {
      status,
      updatedBy: String(userId),
    });

    // Audit Log
    await auditService.log({
      action: 'COURSE_OFFERING_STATUS_CHANGED',
      tableName: 'CourseOffering',
      recordId: String(updated.id),
      oldValue: { status: existing.status },
      newValue: { status: updated.status },
      userId,
    });

    return updated;
  }

  async getByTeacher(teacherId: number): Promise<CourseOfferingWithRelations[]> {
    return courseOfferingRepository.findByTeacherId(teacherId);
  }

  async getBySection(sectionId: number): Promise<CourseOfferingWithRelations[]> {
    return courseOfferingRepository.findBySectionId(sectionId);
  }

  async getBySubject(subjectId: number): Promise<CourseOfferingWithRelations[]> {
    return courseOfferingRepository.findBySubjectId(subjectId);
  }
}

export const courseOfferingService = new CourseOfferingService();
