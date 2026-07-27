import { departmentRepository, DepartmentWithHead } from '../repositories/department.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import { DepartmentNotFoundError, DuplicateDepartmentError, TeacherNotFoundError } from '../errors/department.errors';

export class DepartmentService {
  private async ensureDefaultUniversity(): Promise<number> {
    const existing = await prisma.university.findFirst();
    if (existing) {
      return existing.id;
    }
    const defaultUni = await prisma.university.create({
      data: {
        name: 'Smart University',
        code: 'SMART-UNI',
        address: '123 University Ave',
        contactEmail: 'admin@smartuniversity.edu',
        contactPhone: '+1234567890',
      },
    });
    return defaultUni.id;
  }

  async getDepartments(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    departments: DepartmentWithHead[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      departmentRepository.findAll({
        search: params.search,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      departmentRepository.count({
        search: params.search,
        status: params.status,
      }),
    ]);

    return {
      departments,
      total,
      page,
      limit,
    };
  }

  async getDepartmentByUuid(uuid: string): Promise<DepartmentWithHead> {
    const department = await departmentRepository.findByUuid(uuid);
    if (!department) {
      throw new DepartmentNotFoundError();
    }
    return department;
  }

  async createDepartment(
    data: {
      name: string;
      code: string;
      shortName?: string | null;
      description?: string | null;
      faculty?: string | null;
      officeLocation?: string | null;
      officePhone?: string | null;
      officeEmail?: string | null;
      headOfDepartmentId?: number | null;
      status?: string;
    },
    userId: number
  ): Promise<DepartmentWithHead> {
    const universityId = await this.ensureDefaultUniversity();

    // 1. Validate Code Uniqueness
    const duplicateCode = await departmentRepository.findByCode(data.code);
    if (duplicateCode) {
      throw new DuplicateDepartmentError(`Department with code "${data.code}" already exists.`);
    }

    // 2. Validate Name Uniqueness
    const duplicateName = await departmentRepository.findByName(data.name);
    if (duplicateName) {
      throw new DuplicateDepartmentError(`Department with name "${data.name}" already exists.`);
    }

    // 3. Verify Head of Department if provided
    if (data.headOfDepartmentId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: data.headOfDepartmentId, deletedAt: null },
      });
      if (!teacher) {
        throw new TeacherNotFoundError();
      }
    }

    // 4. Create Department
    const created = await departmentRepository.create({
      name: data.name,
      code: data.code,
      shortName: data.shortName || null,
      description: data.description || null,
      faculty: data.faculty || null,
      officeLocation: data.officeLocation || null,
      officePhone: data.officePhone || null,
      officeEmail: data.officeEmail || null,
      headOfDepartmentId: data.headOfDepartmentId || null,
      status: data.status || 'ACTIVE',
      universityId,
      createdBy: String(userId),
    });

    // 5. Log Audit Trail
    await auditService.log({
      action: 'DEPARTMENT_CREATED',
      tableName: 'Department',
      recordId: String(created.id),
      newValue: created,
      userId,
    });

    return created;
  }

  async updateDepartmentByUuid(
    uuid: string,
    data: {
      name?: string;
      code?: string;
      shortName?: string | null;
      description?: string | null;
      faculty?: string | null;
      officeLocation?: string | null;
      officePhone?: string | null;
      officeEmail?: string | null;
      headOfDepartmentId?: number | null;
      status?: string;
    },
    userId: number
  ): Promise<DepartmentWithHead> {
    const existing = await departmentRepository.findByUuid(uuid);
    if (!existing) {
      throw new DepartmentNotFoundError();
    }

    // Validate Code Uniqueness if changed
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await departmentRepository.findByCode(data.code);
      if (duplicateCode && duplicateCode.id !== existing.id) {
        throw new DuplicateDepartmentError(`Department with code "${data.code}" already exists.`);
      }
    }

    // Validate Name Uniqueness if changed
    if (data.name && data.name !== existing.name) {
      const duplicateName = await departmentRepository.findByName(data.name);
      if (duplicateName && duplicateName.id !== existing.id) {
        throw new DuplicateDepartmentError(`Department with name "${data.name}" already exists.`);
      }
    }

    // Verify Head of Department if changed
    if (data.headOfDepartmentId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: data.headOfDepartmentId, deletedAt: null },
      });
      if (!teacher) {
        throw new TeacherNotFoundError();
      }
    }

    // Perform Update
    const updated = await departmentRepository.update(existing.id, {
      ...data,
      updatedBy: String(userId),
    });

    // Log Audit Trail
    await auditService.log({
      action: 'DEPARTMENT_UPDATED',
      tableName: 'Department',
      recordId: String(existing.id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async deleteDepartmentByUuid(uuid: string, userId: number): Promise<void> {
    const existing = await departmentRepository.findByUuid(uuid);
    if (!existing) {
      throw new DepartmentNotFoundError();
    }

    // Perform Soft Delete
    await departmentRepository.softDelete(existing.id, String(userId));

    // Log Audit Trail
    await auditService.log({
      action: 'DEPARTMENT_DELETED',
      tableName: 'Department',
      recordId: String(existing.id),
      oldValue: existing,
      userId,
    });
  }

  async updateDepartmentStatusByUuid(
    uuid: string,
    status: 'ACTIVE' | 'INACTIVE',
    userId: number
  ): Promise<DepartmentWithHead> {
    const existing = await departmentRepository.findByUuid(uuid);
    if (!existing) {
      throw new DepartmentNotFoundError();
    }

    const updated = await departmentRepository.update(existing.id, {
      status,
      updatedBy: String(userId),
    });

    // Log Audit Trail
    await auditService.log({
      action: 'DEPARTMENT_STATUS_CHANGED',
      tableName: 'Department',
      recordId: String(existing.id),
      oldValue: { status: existing.status },
      newValue: { status },
      userId,
    });

    return updated;
  }

  async getPotentialHeads() {
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

export const departmentService = new DepartmentService();
export default departmentService;
