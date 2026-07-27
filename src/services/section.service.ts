import { SectionRepository, SectionWithRelations } from '../repositories/section.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import { SectionNotFoundError, DuplicateSectionError, CapacityExceededError } from '../errors/section.errors';
import { SemesterNotFoundError } from '../errors/semester.errors';

export const sectionRepository = new SectionRepository();

export class SectionService {
  async getSections(params: {
    search?: string;
    status?: string;
    shift?: 'MORNING' | 'EVENING';
    semesterId?: number;
    programId?: number;
    departmentId?: number;
    academicYearId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    sections: SectionWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [sections, total] = await Promise.all([
      sectionRepository.findAll({
        search: params.search,
        status: params.status,
        shift: params.shift,
        semesterId: params.semesterId,
        programId: params.programId,
        departmentId: params.departmentId,
        academicYearId: params.academicYearId,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      sectionRepository.count({
        search: params.search,
        status: params.status,
        shift: params.shift,
        semesterId: params.semesterId,
        programId: params.programId,
        departmentId: params.departmentId,
        academicYearId: params.academicYearId,
      }),
    ]);

    return {
      sections,
      total,
      page,
      limit,
    };
  }

  async getSectionByUuid(uuid: string): Promise<SectionWithRelations> {
    const section = await sectionRepository.findByUuid(uuid);
    if (!section) {
      throw new SectionNotFoundError();
    }
    return section;
  }

  async getSectionsBySemesterId(semesterId: number): Promise<SectionWithRelations[]> {
    return sectionRepository.findAll({ semesterId });
  }

  async createSection(
    data: {
      code: string;
      name: string;
      semesterId: number;
      classAdvisorId?: number | null;
      capacity: number;
      currentStrength?: number;
      shift: 'MORNING' | 'EVENING';
      status?: 'ACTIVE' | 'INACTIVE';
      description?: string | null;
    },
    userId: number
  ): Promise<SectionWithRelations> {
    // 1. Verify Semester Exists and retrieve derived info
    const semester = await prisma.semester.findFirst({
      where: { id: data.semesterId, deletedAt: null },
      include: {
        program: true,
      },
    });
    if (!semester) {
      throw new SemesterNotFoundError(`Semester with ID ${data.semesterId} not found.`);
    }

    // 2. Verify Capacity limits
    const currentStrength = data.currentStrength || 0;
    if (currentStrength > data.capacity) {
      throw new CapacityExceededError();
    }

    // 3. Verify Code Uniqueness within Semester
    const duplicate = await sectionRepository.findByCodeAndSemester(data.code, data.semesterId);
    if (duplicate) {
      throw new DuplicateSectionError(`Section code "${data.code}" already exists in this semester.`);
    }

    // 4. If Class Advisor is specified, verify Teacher exists
    if (data.classAdvisorId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: data.classAdvisorId, deletedAt: null },
      });
      if (!teacher) {
        throw new Error(`Teacher with ID ${data.classAdvisorId} not found.`);
      }
    }

    // 5. Create Section with derived fields
    const created = await sectionRepository.create({
      code: data.code,
      name: data.name,
      semesterId: data.semesterId,
      programId: semester.programId,
      departmentId: semester.program.departmentId,
      academicYearId: semester.academicYearId,
      classAdvisorId: data.classAdvisorId || null,
      capacity: data.capacity,
      currentStrength: currentStrength,
      shift: data.shift,
      status: data.status || 'ACTIVE',
      description: data.description || null,
      createdBy: String(userId),
    });

    // 6. Log Audit Trail
    await auditService.log({
      action: 'SECTION_CREATED',
      tableName: 'Section',
      recordId: String(created.id),
      newValue: created,
      userId,
    });

    return created;
  }

  async updateSectionByUuid(
    uuid: string,
    data: {
      code?: string;
      name?: string;
      semesterId?: number;
      classAdvisorId?: number | null;
      capacity?: number;
      currentStrength?: number;
      shift?: 'MORNING' | 'EVENING';
      status?: 'ACTIVE' | 'INACTIVE';
      description?: string | null;
    },
    userId: number
  ): Promise<SectionWithRelations> {
    const existing = await sectionRepository.findByUuid(uuid);
    if (!existing) {
      throw new SectionNotFoundError();
    }

    const updatePayload: any = {
      updatedBy: String(userId),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.shift !== undefined) updatePayload.shift = data.shift;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.classAdvisorId !== undefined) updatePayload.classAdvisorId = data.classAdvisorId;

    // Check Capacity and Strength rules
    const finalCapacity = data.capacity !== undefined ? data.capacity : existing.capacity;
    const finalStrength = data.currentStrength !== undefined ? data.currentStrength : existing.currentStrength;
    if (finalStrength > finalCapacity) {
      throw new CapacityExceededError();
    }
    if (data.capacity !== undefined) updatePayload.capacity = data.capacity;
    if (data.currentStrength !== undefined) updatePayload.currentStrength = data.currentStrength;

    // Handle Semester change (requires updating derived fields)
    const finalSemesterId = data.semesterId !== undefined ? data.semesterId : existing.semesterId;
    if (data.semesterId !== undefined && data.semesterId !== existing.semesterId) {
      const semester = await prisma.semester.findFirst({
        where: { id: data.semesterId, deletedAt: null },
        include: {
          program: true,
        },
      });
      if (!semester) {
        throw new SemesterNotFoundError(`Semester with ID ${data.semesterId} not found.`);
      }
      updatePayload.semesterId = data.semesterId;
      updatePayload.programId = semester.programId;
      updatePayload.departmentId = semester.program.departmentId;
      updatePayload.academicYearId = semester.academicYearId;
    }

    // Handle Code change (requires check for uniqueness within final semester)
    const finalCode = data.code !== undefined ? data.code : existing.code;
    if (
      (data.code !== undefined && data.code !== existing.code) ||
      (data.semesterId !== undefined && data.semesterId !== existing.semesterId)
    ) {
      const duplicate = await sectionRepository.findByCodeAndSemester(finalCode, finalSemesterId);
      if (duplicate && duplicate.id !== existing.id) {
        throw new DuplicateSectionError(`Section code "${finalCode}" already exists in this semester.`);
      }
    }
    if (data.code !== undefined) updatePayload.code = data.code;

    // If advisor is changed, verify Teacher exists
    if (data.classAdvisorId !== undefined && data.classAdvisorId !== null) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: data.classAdvisorId, deletedAt: null },
      });
      if (!teacher) {
        throw new Error(`Teacher with ID ${data.classAdvisorId} not found.`);
      }
    }

    // Update Section
    const updated = await sectionRepository.update(existing.id, updatePayload);

    // Audit Log
    await auditService.log({
      action: 'SECTION_UPDATED',
      tableName: 'Section',
      recordId: String(updated.id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async updateSectionStatusByUuid(
    uuid: string,
    status: 'ACTIVE' | 'INACTIVE',
    userId: number
  ): Promise<SectionWithRelations> {
    const existing = await sectionRepository.findByUuid(uuid);
    if (!existing) {
      throw new SectionNotFoundError();
    }

    const updated = await sectionRepository.update(existing.id, {
      status,
      updatedBy: String(userId),
    });

    await auditService.log({
      action: 'SECTION_STATUS_CHANGED',
      tableName: 'Section',
      recordId: String(updated.id),
      oldValue: { status: existing.status },
      newValue: { status: updated.status },
      userId,
    });

    return updated;
  }

  async deleteSectionByUuid(uuid: string, userId: number): Promise<void> {
    const existing = await sectionRepository.findByUuid(uuid);
    if (!existing) {
      throw new SectionNotFoundError();
    }

    await sectionRepository.delete(existing.id, String(userId));

    await auditService.log({
      action: 'SECTION_DELETED',
      tableName: 'Section',
      recordId: String(existing.id),
      oldValue: existing,
      userId,
    });
  }
}
