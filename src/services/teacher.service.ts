import { teacherRepository, TeacherWithRelations } from '../repositories/teacher.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import {
  TeacherNotFoundError,
  DuplicateEmployeeIdError,
  DuplicateUserAssignmentError,
  InvalidTeacherRelationshipError,
} from '../errors/teacher.errors';

export class TeacherService {
  async getTeachers(params: {
    search?: string;
    status?: string;
    employmentType?: string;
    designation?: string;
    departmentId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    teachers: TeacherWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [teachers, total] = await Promise.all([
      teacherRepository.findAll({
        search: params.search,
        status: params.status,
        employmentType: params.employmentType,
        designation: params.designation,
        departmentId: params.departmentId,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      teacherRepository.count({
        search: params.search,
        status: params.status,
        employmentType: params.employmentType,
        designation: params.designation,
        departmentId: params.departmentId,
      }),
    ]);

    return {
      teachers,
      total,
      page,
      limit,
    };
  }

  async getTeacherByUuid(uuid: string): Promise<TeacherWithRelations> {
    const teacher = await teacherRepository.findByUuid(uuid);
    if (!teacher) {
      throw new TeacherNotFoundError();
    }
    return teacher;
  }

  async getTeacherByUserId(userId: number): Promise<TeacherWithRelations> {
    const teacher = await teacherRepository.findByUserId(userId);
    if (!teacher) {
      throw new TeacherNotFoundError();
    }
    return teacher;
  }

  async getTeachersByDepartment(departmentId: number): Promise<TeacherWithRelations[]> {
    // Verify department exists first
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!dept) {
      throw new InvalidTeacherRelationshipError('Department not found');
    }
    return teacherRepository.findByDepartmentId(departmentId);
  }

  async createTeacher(
    data: {
      userId: number;
      employeeId: string;
      departmentId: number;
      designation?: string | null;
      employmentType: string;
      qualification?: string | null;
      specialization?: string | null;
      experience?: number | null;
      joiningDate?: Date | null;
      officeLocation?: string | null;
      officePhone?: string | null;
      profilePhoto?: string | null;
      cnic?: string | null;
      emergencyContact?: string | null;
      biography?: string | null;
      status?: string;
    },
    actorId: number,
    actorEmail: string
  ): Promise<TeacherWithRelations> {
    // 1. Verify user exists and has teacher role
    const assignedUser = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { role: true },
    });

    if (!assignedUser || assignedUser.deletedAt !== null) {
      throw new InvalidTeacherRelationshipError('Assigned User does not exist');
    }

    if (assignedUser.role.name !== 'TEACHER') {
      throw new InvalidTeacherRelationshipError('Assigned User must have the TEACHER role');
    }

    // 2. Check if user already has a teacher profile
    const existingProfile = await teacherRepository.findByUserId(data.userId);
    if (existingProfile) {
      throw new DuplicateUserAssignmentError();
    }

    // 3. Verify department exists
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId, deletedAt: null },
    });
    if (!dept) {
      throw new InvalidTeacherRelationshipError('Department does not exist');
    }

    // 4. Verify employee ID is unique
    const duplicateEmp = await teacherRepository.findByEmployeeId(data.employeeId);
    if (duplicateEmp) {
      throw new DuplicateEmployeeIdError();
    }

    // 5. Create the profile
    const teacher = await teacherRepository.create({
      ...data,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    });

    // 6. Log Audit
    await auditService.log({
      action: 'Teacher Created',
      tableName: 'Teacher',
      recordId: teacher.uuid,
      newValue: teacher,
      userId: actorId,
    });

    return teacher;
  }

  async updateTeacher(
    uuid: string,
    data: Partial<{
      departmentId: number;
      designation: string | null;
      employmentType: string;
      qualification: string | null;
      specialization: string | null;
      experience: number | null;
      joiningDate: Date | null;
      officeLocation: string | null;
      officePhone: string | null;
      profilePhoto: string | null;
      cnic: string | null;
      emergencyContact: string | null;
      biography: string | null;
      status: string;
    }>,
    actorId: number,
    actorEmail: string
  ): Promise<TeacherWithRelations> {
    const existing = await teacherRepository.findByUuid(uuid);
    if (!existing) {
      throw new TeacherNotFoundError();
    }

    // If departmentId is updated, verify department exists
    if (data.departmentId && data.departmentId !== existing.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId, deletedAt: null },
      });
      if (!dept) {
        throw new InvalidTeacherRelationshipError('Department does not exist');
      }
    }

    const updated = await teacherRepository.update(existing.id, {
      ...data,
      updatedBy: actorEmail,
    });

    // Log Audit
    await auditService.log({
      action: 'Teacher Updated',
      tableName: 'Teacher',
      recordId: existing.uuid,
      oldValue: existing,
      newValue: updated,
      userId: actorId,
    });

    return updated;
  }

  async deleteTeacher(uuid: string, actorId: number, actorEmail: string): Promise<void> {
    const existing = await teacherRepository.findByUuid(uuid);
    if (!existing) {
      throw new TeacherNotFoundError();
    }

    await teacherRepository.softDelete(existing.id, actorEmail);

    // Log Audit
    await auditService.log({
      action: 'Teacher Deleted',
      tableName: 'Teacher',
      recordId: existing.uuid,
      oldValue: existing,
      userId: actorId,
    });
  }

  async updateStatus(
    uuid: string,
    status: 'Active' | 'On Leave' | 'Retired' | 'Suspended',
    actorId: number,
    actorEmail: string
  ): Promise<TeacherWithRelations> {
    const existing = await teacherRepository.findByUuid(uuid);
    if (!existing) {
      throw new TeacherNotFoundError();
    }

    const updated = await teacherRepository.update(existing.id, {
      status,
      updatedBy: actorEmail,
    });

    // Log Audit
    await auditService.log({
      action: 'Status Changed',
      tableName: 'Teacher',
      recordId: existing.uuid,
      oldValue: { status: existing.status },
      newValue: { status },
      userId: actorId,
    });

    return updated;
  }
}

export const teacherService = new TeacherService();
export default teacherService;
