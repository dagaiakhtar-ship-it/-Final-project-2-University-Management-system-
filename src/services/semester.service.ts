import { SemesterRepository, SemesterWithRelations } from '../repositories/semester.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import { SemesterNotFoundError, DuplicateSemesterError, AcademicYearNotFoundError } from '../errors/semester.errors';
import { ProgramNotFoundError } from '../errors/program.errors';

export const semesterRepository = new SemesterRepository();

export class SemesterService {
  async getSemesters(params: {
    search?: string;
    status?: string;
    programId?: number;
    academicYearId?: number;
    semesterType?: 'REGULAR' | 'SUMMER' | 'WINTER';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    semesters: SemesterWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [semesters, total] = await Promise.all([
      semesterRepository.findAll({
        search: params.search,
        status: params.status,
        programId: params.programId,
        academicYearId: params.academicYearId,
        semesterType: params.semesterType,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      semesterRepository.count({
        search: params.search,
        status: params.status,
        programId: params.programId,
        academicYearId: params.academicYearId,
        semesterType: params.semesterType,
      }),
    ]);

    return {
      semesters,
      total,
      page,
      limit,
    };
  }

  async getSemesterByUuid(uuid: string): Promise<SemesterWithRelations> {
    const semester = await semesterRepository.findByUuid(uuid);
    if (!semester) {
      throw new SemesterNotFoundError();
    }
    return semester;
  }

  async getSemestersByProgramId(programId: number): Promise<SemesterWithRelations[]> {
    return semesterRepository.findAll({ programId });
  }

  async createSemester(
    data: {
      name: string;
      code: string;
      semesterNumber: number;
      programId: number;
      academicYearId: number;
      startDate: Date;
      endDate: Date;
      registrationStartDate: Date;
      registrationEndDate: Date;
      minCreditHours: number;
      maxCreditHours: number;
      semesterType: 'REGULAR' | 'SUMMER' | 'WINTER';
      status?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'ARCHIVED';
      description?: string | null;
    },
    userId: number
  ): Promise<SemesterWithRelations> {
    // 1. Verify Program Exists
    const program = await prisma.program.findFirst({
      where: { id: data.programId, deletedAt: null },
    });
    if (!program) {
      throw new ProgramNotFoundError(`Program with ID ${data.programId} not found.`);
    }

    // 2. Verify Academic Year Exists
    const academicYear = await prisma.academicYear.findFirst({
      where: { id: data.academicYearId, deletedAt: null },
    });
    if (!academicYear) {
      throw new AcademicYearNotFoundError(`Academic Year with ID ${data.academicYearId} not found.`);
    }

    // 3. Verify Code Uniqueness
    const duplicateCode = await semesterRepository.findByCode(data.code);
    if (duplicateCode) {
      throw new DuplicateSemesterError(`Semester with code "${data.code}" already exists.`);
    }

    // 4. Verify Semester Number uniqueness within Program
    const duplicateNumber = await semesterRepository.findByProgramAndSemesterNumber(
      data.programId,
      data.semesterNumber
    );
    if (duplicateNumber) {
      throw new DuplicateSemesterError(
        `Semester number ${data.semesterNumber} already exists in program "${program.name}".`
      );
    }

    // 5. Create Semester
    const created = await semesterRepository.create({
      name: data.name,
      code: data.code,
      semesterNumber: data.semesterNumber,
      programId: data.programId,
      academicYearId: data.academicYearId,
      startDate: data.startDate,
      endDate: data.endDate,
      registrationStartDate: data.registrationStartDate,
      registrationEndDate: data.registrationEndDate,
      minCreditHours: data.minCreditHours,
      maxCreditHours: data.maxCreditHours,
      semesterType: data.semesterType,
      status: data.status || 'UPCOMING',
      description: data.description || null,
      createdBy: String(userId),
    });

    // 6. Log Audit Trail
    await auditService.log({
      action: 'SEMESTER_CREATED',
      tableName: 'Semester',
      recordId: String(created.id),
      newValue: created,
      userId,
    });

    return created;
  }

  async updateSemesterByUuid(
    uuid: string,
    data: {
      name?: string;
      code?: string;
      semesterNumber?: number;
      programId?: number;
      academicYearId?: number;
      startDate?: Date;
      endDate?: Date;
      registrationStartDate?: Date;
      registrationEndDate?: Date;
      minCreditHours?: number;
      maxCreditHours?: number;
      semesterType?: 'REGULAR' | 'SUMMER' | 'WINTER';
      status?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'ARCHIVED';
      description?: string | null;
    },
    userId: number
  ): Promise<SemesterWithRelations> {
    const existing = await semesterRepository.findByUuid(uuid);
    if (!existing) {
      throw new SemesterNotFoundError();
    }

    const updatePayload: any = {
      updatedBy: String(userId),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
    if (data.endDate !== undefined) updatePayload.endDate = data.endDate;
    if (data.registrationStartDate !== undefined) updatePayload.registrationStartDate = data.registrationStartDate;
    if (data.registrationEndDate !== undefined) updatePayload.registrationEndDate = data.registrationEndDate;
    if (data.minCreditHours !== undefined) updatePayload.minCreditHours = data.minCreditHours;
    if (data.maxCreditHours !== undefined) updatePayload.maxCreditHours = data.maxCreditHours;
    if (data.semesterType !== undefined) updatePayload.semesterType = data.semesterType;
    if (data.status !== undefined) updatePayload.status = data.status;

    // Check program if changing
    const finalProgramId = data.programId !== undefined ? data.programId : existing.programId;
    if (data.programId !== undefined && data.programId !== existing.programId) {
      const program = await prisma.program.findFirst({
        where: { id: data.programId, deletedAt: null },
      });
      if (!program) {
        throw new ProgramNotFoundError(`Program with ID ${data.programId} not found.`);
      }
      updatePayload.programId = data.programId;
    }

    // Check academic year if changing
    if (data.academicYearId !== undefined && data.academicYearId !== existing.academicYearId) {
      const academicYear = await prisma.academicYear.findFirst({
        where: { id: data.academicYearId, deletedAt: null },
      });
      if (!academicYear) {
        throw new AcademicYearNotFoundError(`Academic Year with ID ${data.academicYearId} not found.`);
      }
      updatePayload.academicYearId = data.academicYearId;
    }

    // Check code if changing
    if (data.code !== undefined && data.code !== existing.code) {
      const duplicateCode = await semesterRepository.findByCode(data.code);
      if (duplicateCode) {
        throw new DuplicateSemesterError(`Semester with code "${data.code}" already exists.`);
      }
      updatePayload.code = data.code;
    }

    // Check semester number within program if changing
    const finalSemNum = data.semesterNumber !== undefined ? data.semesterNumber : existing.semesterNumber;
    if (
      (data.semesterNumber !== undefined && data.semesterNumber !== existing.semesterNumber) ||
      (data.programId !== undefined && data.programId !== existing.programId)
    ) {
      const duplicateNumber = await semesterRepository.findByProgramAndSemesterNumber(
        finalProgramId,
        finalSemNum
      );
      if (duplicateNumber && duplicateNumber.id !== existing.id) {
        throw new DuplicateSemesterError(
          `Semester number ${finalSemNum} already exists in program.`
        );
      }
      updatePayload.semesterNumber = finalSemNum;
    }

    const updated = await semesterRepository.update(existing.id, updatePayload);

    await auditService.log({
      action: 'SEMESTER_UPDATED',
      tableName: 'Semester',
      recordId: String(updated.id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async updateSemesterStatusByUuid(
    uuid: string,
    status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'ARCHIVED',
    userId: number
  ): Promise<SemesterWithRelations> {
    const existing = await semesterRepository.findByUuid(uuid);
    if (!existing) {
      throw new SemesterNotFoundError();
    }

    const updated = await semesterRepository.update(existing.id, {
      status,
      updatedBy: String(userId),
    });

    await auditService.log({
      action: 'SEMESTER_STATUS_CHANGED',
      tableName: 'Semester',
      recordId: String(updated.id),
      oldValue: { status: existing.status },
      newValue: { status: updated.status },
      userId,
    });

    return updated;
  }

  async deleteSemesterByUuid(uuid: string, userId: number): Promise<void> {
    const existing = await semesterRepository.findByUuid(uuid);
    if (!existing) {
      throw new SemesterNotFoundError();
    }

    await semesterRepository.delete(existing.id, String(userId));

    await auditService.log({
      action: 'SEMESTER_DELETED',
      tableName: 'Semester',
      recordId: String(existing.id),
      oldValue: existing,
      userId,
    });
  }
}

export const semesterService = new SemesterService();
