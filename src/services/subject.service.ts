import { SubjectRepository, SubjectWithRelations } from '../repositories/subject.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import {
  SubjectNotFoundError,
  DuplicateSubjectError,
  InvalidSubjectHoursError,
} from '../errors/subject.errors';

export const subjectRepository = new SubjectRepository();

export class SubjectService {
  async getSubjects(params: {
    search?: string;
    status?: string;
    subjectType?: string;
    category?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    subjects: SubjectWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      subjectRepository.findAll({
        search: params.search,
        status: params.status,
        subjectType: params.subjectType,
        category: params.category,
        departmentId: params.departmentId,
        programId: params.programId,
        semesterId: params.semesterId,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      subjectRepository.count({
        search: params.search,
        status: params.status,
        subjectType: params.subjectType,
        category: params.category,
        departmentId: params.departmentId,
        programId: params.programId,
        semesterId: params.semesterId,
      }),
    ]);

    return {
      subjects,
      total,
      page,
      limit,
    };
  }

  async getSubjectByUuid(uuid: string): Promise<SubjectWithRelations> {
    const subject = await subjectRepository.findByUuid(uuid);
    if (!subject) {
      throw new SubjectNotFoundError();
    }
    return subject;
  }

  async getSubjectsByProgramId(programId: number): Promise<SubjectWithRelations[]> {
    return subjectRepository.findAll({ programId });
  }

  async getSubjectsBySemesterId(semesterId: number): Promise<SubjectWithRelations[]> {
    return subjectRepository.findAll({ semesterId });
  }

  async createSubject(
    data: {
      code: string;
      name: string;
      shortName?: string | null;
      departmentId: number;
      programId: number;
      semesterId: number;
      creditHours: number;
      theoryHours: number;
      labHours: number;
      subjectType: string;
      category: string;
      prerequisiteId?: number | null;
      description?: string | null;
      status?: string;
    },
    userId: number
  ): Promise<SubjectWithRelations> {
    // 1. Verify credit hours equation: Theory Hours + Lab Hours = Credit Hours
    if (data.theoryHours + data.labHours !== data.creditHours) {
      throw new InvalidSubjectHoursError();
    }

    // 2. Verify unique code
    const existingCode = await subjectRepository.findByCode(data.code);
    if (existingCode) {
      throw new DuplicateSubjectError(`Subject code "${data.code}" is already in use.`);
    }

    // 3. Verify Department, Program, Semester exist
    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, deletedAt: null },
    });
    if (!department) {
      throw new Error(`Department with ID ${data.departmentId} not found.`);
    }

    const program = await prisma.program.findFirst({
      where: { id: data.programId, deletedAt: null },
    });
    if (!program) {
      throw new Error(`Program with ID ${data.programId} not found.`);
    }

    const semester = await prisma.semester.findFirst({
      where: { id: data.semesterId, deletedAt: null },
    });
    if (!semester) {
      throw new Error(`Semester with ID ${data.semesterId} not found.`);
    }

    // 4. Verify Prerequisite exists if provided
    if (data.prerequisiteId) {
      const prereq = await prisma.subject.findFirst({
        where: { id: data.prerequisiteId, deletedAt: null },
      });
      if (!prereq) {
        throw new Error(`Prerequisite Subject with ID ${data.prerequisiteId} not found.`);
      }
    }

    // 5. Create
    const created = await subjectRepository.create({
      code: data.code.toUpperCase(),
      name: data.name,
      shortName: data.shortName || null,
      departmentId: data.departmentId,
      programId: data.programId,
      semesterId: data.semesterId,
      creditHours: data.creditHours,
      theoryHours: data.theoryHours,
      labHours: data.labHours,
      subjectType: data.subjectType,
      category: data.category,
      prerequisiteId: data.prerequisiteId || null,
      description: data.description || null,
      status: data.status || 'ACTIVE',
      createdBy: String(userId),
    });

    // 6. Audit Logging
    await auditService.log({
      action: 'SUBJECT_CREATED',
      tableName: 'Subject',
      recordId: String(created.id),
      newValue: created,
      userId,
    });

    return created;
  }

  async updateSubjectByUuid(
    uuid: string,
    data: {
      code?: string;
      name?: string;
      shortName?: string | null;
      departmentId?: number;
      programId?: number;
      semesterId?: number;
      creditHours?: number;
      theoryHours?: number;
      labHours?: number;
      subjectType?: string;
      category?: string;
      prerequisiteId?: number | null;
      description?: string | null;
      status?: string;
    },
    userId: number
  ): Promise<SubjectWithRelations> {
    const existing = await subjectRepository.findByUuid(uuid);
    if (!existing) {
      throw new SubjectNotFoundError();
    }

    const updatedPayload: any = {
      updatedBy: String(userId),
    };

    if (data.name !== undefined) updatedPayload.name = data.name;
    if (data.shortName !== undefined) updatedPayload.shortName = data.shortName;
    if (data.description !== undefined) updatedPayload.description = data.description;
    if (data.subjectType !== undefined) updatedPayload.subjectType = data.subjectType;
    if (data.category !== undefined) updatedPayload.category = data.category;
    if (data.status !== undefined) updatedPayload.status = data.status;

    // Validate and update credit, theory, lab hours
    const finalCredit = data.creditHours !== undefined ? data.creditHours : existing.creditHours;
    const finalTheory = data.theoryHours !== undefined ? data.theoryHours : existing.theoryHours;
    const finalLab = data.labHours !== undefined ? data.labHours : existing.labHours;

    if (data.creditHours !== undefined || data.theoryHours !== undefined || data.labHours !== undefined) {
      if (finalTheory + finalLab !== finalCredit) {
        throw new InvalidSubjectHoursError();
      }
      updatedPayload.creditHours = finalCredit;
      updatedPayload.theoryHours = finalTheory;
      updatedPayload.labHours = finalLab;
    }

    // Validate code duplicate
    if (data.code !== undefined && data.code.toUpperCase() !== existing.code) {
      const existingCode = await subjectRepository.findByCode(data.code);
      if (existingCode) {
        throw new DuplicateSubjectError(`Subject code "${data.code}" is already in use.`);
      }
      updatedPayload.code = data.code.toUpperCase();
    }

    // Validate relationships if changed
    if (data.departmentId !== undefined && data.departmentId !== existing.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: data.departmentId, deletedAt: null },
      });
      if (!dept) {
        throw new Error(`Department with ID ${data.departmentId} not found.`);
      }
      updatedPayload.departmentId = data.departmentId;
    }

    if (data.programId !== undefined && data.programId !== existing.programId) {
      const prog = await prisma.program.findFirst({
        where: { id: data.programId, deletedAt: null },
      });
      if (!prog) {
        throw new Error(`Program with ID ${data.programId} not found.`);
      }
      updatedPayload.programId = data.programId;
    }

    if (data.semesterId !== undefined && data.semesterId !== existing.semesterId) {
      const sem = await prisma.semester.findFirst({
        where: { id: data.semesterId, deletedAt: null },
      });
      if (!sem) {
        throw new Error(`Semester with ID ${data.semesterId} not found.`);
      }
      updatedPayload.semesterId = data.semesterId;
    }

    if (data.prerequisiteId !== undefined) {
      if (data.prerequisiteId) {
        if (data.prerequisiteId === existing.id) {
          throw new Error('A subject cannot be its own prerequisite.');
        }
        const prereq = await prisma.subject.findFirst({
          where: { id: data.prerequisiteId, deletedAt: null },
        });
        if (!prereq) {
          throw new Error(`Prerequisite Subject with ID ${data.prerequisiteId} not found.`);
        }
      }
      updatedPayload.prerequisiteId = data.prerequisiteId || null;
    }

    const updated = await subjectRepository.update(existing.id, updatedPayload);

    // Audit Log
    await auditService.log({
      action: 'SUBJECT_UPDATED',
      tableName: 'Subject',
      recordId: String(updated.id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async deleteSubjectByUuid(uuid: string, userId: number): Promise<void> {
    const existing = await subjectRepository.findByUuid(uuid);
    if (!existing) {
      throw new SubjectNotFoundError();
    }

    await subjectRepository.delete(existing.id, String(userId));

    // Audit Log
    await auditService.log({
      action: 'SUBJECT_DELETED',
      tableName: 'Subject',
      recordId: String(existing.id),
      oldValue: existing,
      userId,
    });
  }

  async toggleSubjectStatus(uuid: string, status: string, userId: number): Promise<SubjectWithRelations> {
    const existing = await subjectRepository.findByUuid(uuid);
    if (!existing) {
      throw new SubjectNotFoundError();
    }

    const updated = await subjectRepository.update(existing.id, {
      status,
      updatedBy: String(userId),
    });

    // Audit Log
    await auditService.log({
      action: 'SUBJECT_STATUS_CHANGED',
      tableName: 'Subject',
      recordId: String(updated.id),
      oldValue: { status: existing.status },
      newValue: { status: updated.status },
      userId,
    });

    return updated;
  }
}

export const subjectService = new SubjectService();
