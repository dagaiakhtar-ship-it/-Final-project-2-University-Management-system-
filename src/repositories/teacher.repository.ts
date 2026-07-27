import { prisma } from '../services/db.service';
import { Prisma, Teacher } from '@prisma/client';

export type TeacherWithRelations = Prisma.TeacherGetPayload<{
  include: {
    user: true;
    department: true;
  };
}>;

export class TeacherRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    employmentType?: string;
    designation?: string;
    departmentId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<TeacherWithRelations[]> {
    const {
      search,
      status,
      employmentType,
      designation,
      departmentId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip,
      take,
    } = params;

    const where: Prisma.TeacherWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (designation) {
      where.designation = { equals: designation, mode: 'insensitive' };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { qualification: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { officeLocation: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          department: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const orderBy: Prisma.TeacherOrderByWithRelationInput = {};
    if (sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'email') {
      orderBy.user = {
        [sortBy]: sortOrder,
      };
    } else if (sortBy === 'departmentName') {
      orderBy.department = {
        name: sortOrder,
      };
    } else {
      orderBy[sortBy as keyof Prisma.TeacherOrderByWithRelationInput] = sortOrder as any;
    }

    return prisma.teacher.findMany({
      where,
      include: {
        user: true,
        department: true,
      },
      orderBy,
      skip,
      take,
    });
  }

  async count(params: {
    search?: string;
    status?: string;
    employmentType?: string;
    designation?: string;
    departmentId?: number;
  }): Promise<number> {
    const { search, status, employmentType, designation, departmentId } = params;

    const where: Prisma.TeacherWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (designation) {
      where.designation = { equals: designation, mode: 'insensitive' };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { qualification: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { officeLocation: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          department: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return prisma.teacher.count({ where });
  }

  async findById(id: number): Promise<TeacherWithRelations | null> {
    return prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findByUuid(uuid: string): Promise<TeacherWithRelations | null> {
    return prisma.teacher.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findByUserId(userId: number): Promise<TeacherWithRelations | null> {
    return prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<Teacher | null> {
    return prisma.teacher.findFirst({
      where: { employeeId: { equals: employeeId, mode: 'insensitive' }, deletedAt: null },
    });
  }

  async findDeletedByEmployeeId(employeeId: string): Promise<Teacher | null> {
    return prisma.teacher.findFirst({
      where: { employeeId: { equals: employeeId, mode: 'insensitive' }, NOT: { deletedAt: null } },
    });
  }

  async create(data: Prisma.TeacherUncheckedCreateInput): Promise<TeacherWithRelations> {
    return prisma.teacher.create({
      data,
      include: {
        user: true,
        department: true,
      },
    });
  }

  async update(id: number, data: Prisma.TeacherUncheckedUpdateInput): Promise<TeacherWithRelations> {
    return prisma.teacher.update({
      where: { id },
      data,
      include: {
        user: true,
        department: true,
      },
    });
  }

  async softDelete(id: number, updatedBy?: string): Promise<Teacher> {
    return prisma.teacher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  async findByDepartmentId(departmentId: number): Promise<TeacherWithRelations[]> {
    return prisma.teacher.findMany({
      where: { departmentId, deletedAt: null },
      include: {
        user: true,
        department: true,
      },
    });
  }
}

export const teacherRepository = new TeacherRepository();
export default teacherRepository;
