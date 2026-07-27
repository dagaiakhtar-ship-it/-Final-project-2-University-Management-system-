import { programRepository, ProgramWithRelations } from '../repositories/program.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import { 
  ProgramNotFoundError, 
  DuplicateProgramError, 
  DepartmentNotFoundError, 
  TeacherNotFoundError 
} from '../errors/program.errors';

export class ProgramService {
  async getPrograms(params: {
    search?: string;
    status?: string;
    departmentId?: number;
    degreeLevel?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    programs: ProgramWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [programs, total] = await Promise.all([
      programRepository.findAll({
        search: params.search,
        status: params.status,
        departmentId: params.departmentId,
        degreeLevel: params.degreeLevel,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      programRepository.count({
        search: params.search,
        status: params.status,
        departmentId: params.departmentId,
        degreeLevel: params.degreeLevel,
      }),
    ]);

    return {
      programs,
      total,
      page,
      limit,
    };
  }

  async getProgramByUuid(uuid: string): Promise<ProgramWithRelations> {
    const program = await programRepository.findByUuid(uuid);
    if (!program) {
      throw new ProgramNotFoundError();
    }
    return program;
  }

  async createProgram(
    data: {
      name: string;
      code: string;
      shortName?: string | null;
      degreeLevel: string;
      departmentId: number;
      duration: number;
      totalSemesters: number;
      creditHours: number;
      description?: string | null;
      coordinatorId?: number | null;
      status?: string;
    },
    userId: number
  ): Promise<ProgramWithRelations> {
    // 1. Verify Department Exists
    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, deletedAt: null },
    });
    if (!department) {
      throw new DepartmentNotFoundError(`Department with ID ${data.departmentId} not found.`);
    }

    // 2. Validate Code Uniqueness
    const duplicateCode = await programRepository.findByCode(data.code);
    if (duplicateCode) {
      throw new DuplicateProgramError(`Program with code "${data.code}" already exists.`);
    }

    // 3. Validate Name Uniqueness within Department
    const duplicateName = await programRepository.findByNameAndDepartment(data.name, data.departmentId);
    if (duplicateName) {
      throw new DuplicateProgramError(`Program with name "${data.name}" already exists in this department.`);
    }

    // 4. Verify Coordinator if provided
    if (data.coordinatorId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: data.coordinatorId, deletedAt: null },
      });
      if (!teacher) {
        throw new TeacherNotFoundError();
      }
    }

    // 5. Create Program
    const created = await programRepository.create({
      name: data.name,
      code: data.code,
      shortName: data.shortName || null,
      degreeLevel: data.degreeLevel,
      departmentId: data.departmentId,
      duration: data.duration,
      totalSemesters: data.totalSemesters,
      creditHours: data.creditHours,
      description: data.description || null,
      coordinatorId: data.coordinatorId || null,
      status: data.status || 'ACTIVE',
      createdBy: String(userId),
    });

    // 6. Log Audit Trail
    await auditService.log({
      action: 'PROGRAM_CREATED',
      tableName: 'Program',
      recordId: String(created.id),
      newValue: created,
      userId,
    });

    return created;
  }

  async updateProgramByUuid(
    uuid: string,
    data: {
      name?: string;
      code?: string;
      shortName?: string | null;
      degreeLevel?: string;
      departmentId?: number;
      duration?: number;
      totalSemesters?: number;
      creditHours?: number;
      description?: string | null;
      coordinatorId?: number | null;
      status?: string;
    },
    userId: number
  ): Promise<ProgramWithRelations> {
    const existing = await programRepository.findByUuid(uuid);
    if (!existing) {
      throw new ProgramNotFoundError();
    }

    const targetDeptId = data.departmentId !== undefined ? data.departmentId : existing.departmentId;

    // Verify Department if changed
    if (data.departmentId !== undefined && data.departmentId !== existing.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: data.departmentId, deletedAt: null },
      });
      if (!department) {
        throw new DepartmentNotFoundError(`Department with ID ${data.departmentId} not found.`);
      }
    }

    // Validate Code Uniqueness if changed
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await programRepository.findByCode(data.code);
      if (duplicateCode && duplicateCode.id !== existing.id) {
        throw new DuplicateProgramError(`Program with code "${data.code}" already exists.`);
      }
    }

    // Validate Name Uniqueness within Department if name or department changed
    if (data.name !== undefined || data.departmentId !== undefined) {
      const targetName = data.name !== undefined ? data.name : existing.name;
      const duplicateName = await programRepository.findByNameAndDepartment(targetName, targetDeptId);
      if (duplicateName && duplicateName.id !== existing.id) {
        throw new DuplicateProgramError(`Program with name "${targetName}" already exists in this department.`);
      }
    }

    // Verify Coordinator if changed
    if (data.coordinatorId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: data.coordinatorId, deletedAt: null },
      });
      if (!teacher) {
        throw new TeacherNotFoundError();
      }
    }

    // Perform Update
    const updated = await programRepository.update(existing.id, {
      ...data,
      updatedBy: String(userId),
    });

    // Log Audit Trail
    await auditService.log({
      action: 'PROGRAM_UPDATED',
      tableName: 'Program',
      recordId: String(existing.id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async deleteProgramByUuid(uuid: string, userId: number): Promise<void> {
    const existing = await programRepository.findByUuid(uuid);
    if (!existing) {
      throw new ProgramNotFoundError();
    }

    // Perform Soft Delete
    await programRepository.softDelete(existing.id, String(userId));

    // Log Audit Trail
    await auditService.log({
      action: 'PROGRAM_DELETED',
      tableName: 'Program',
      recordId: String(existing.id),
      oldValue: existing,
      userId,
    });
  }

  async updateProgramStatusByUuid(
    uuid: string,
    status: 'ACTIVE' | 'INACTIVE',
    userId: number
  ): Promise<ProgramWithRelations> {
    const existing = await programRepository.findByUuid(uuid);
    if (!existing) {
      throw new ProgramNotFoundError();
    }

    const updated = await programRepository.update(existing.id, {
      status,
      updatedBy: String(userId),
    });

    // Log Audit Trail
    await auditService.log({
      action: 'PROGRAM_STATUS_CHANGED',
      tableName: 'Program',
      recordId: String(existing.id),
      oldValue: { status: existing.status },
      newValue: { status },
      userId,
    });

    return updated;
  }

  async getProgramsByDepartmentId(departmentId: number): Promise<ProgramWithRelations[]> {
    return programRepository.findByDepartmentId(departmentId);
  }

  async getPotentialCoordinators() {
    return prisma.teacher.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}

export const programService = new ProgramService();
export default programService;
