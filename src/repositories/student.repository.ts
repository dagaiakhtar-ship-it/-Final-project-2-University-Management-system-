import { prisma } from '../services/db.service';
import { Prisma, Student } from '@prisma/client';

export type StudentWithRelations = Prisma.StudentGetPayload<{
  include: {
    user: true;
    department: true;
    program: true;
    semester: true;
    section: true;
    academicYear: true;
    parent: true;
  };
}>;

export class StudentRepository {
  async findAll(params: {
    search?: string;
    status?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    scholarshipStatus?: string;
    hostelStatus?: string;
    transportStatus?: string;
    admissionSession?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<StudentWithRelations[]> {
    const {
      search,
      status,
      departmentId,
      programId,
      semesterId,
      sectionId,
      scholarshipStatus,
      hostelStatus,
      transportStatus,
      admissionSession,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip,
      take,
    } = params;

    const where: Prisma.StudentWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status as any;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (scholarshipStatus) {
      where.scholarshipStatus = { equals: scholarshipStatus, mode: 'insensitive' };
    }

    if (hostelStatus) {
      where.hostelStatus = { equals: hostelStatus, mode: 'insensitive' };
    }

    if (transportStatus) {
      where.transportStatus = { equals: transportStatus, mode: 'insensitive' };
    }

    if (admissionSession) {
      where.admissionSession = { equals: admissionSession, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search, mode: 'insensitive' } },
        { cnic: { contains: search, mode: 'insensitive' } },
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
      ];
    }

    const orderBy: Prisma.StudentOrderByWithRelationInput = {};
    if (sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'email') {
      orderBy.user = {
        [sortBy]: sortOrder,
      };
    } else if (sortBy === 'departmentName') {
      orderBy.department = {
        name: sortOrder,
      };
    } else if (sortBy === 'programName') {
      orderBy.program = {
        name: sortOrder,
      };
    } else {
      orderBy[sortBy as keyof Prisma.StudentOrderByWithRelationInput] = sortOrder as any;
    }

    return prisma.student.findMany({
      where,
      include: {
        user: true,
        department: true,
        program: true,
        semester: true,
        section: true,
        academicYear: true,
        parent: true,
      },
      orderBy,
      skip,
      take,
    });
  }

  async count(params: {
    search?: string;
    status?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    scholarshipStatus?: string;
    hostelStatus?: string;
    transportStatus?: string;
    admissionSession?: string;
  }): Promise<number> {
    const {
      search,
      status,
      departmentId,
      programId,
      semesterId,
      sectionId,
      scholarshipStatus,
      hostelStatus,
      transportStatus,
      admissionSession,
    } = params;

    const where: Prisma.StudentWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status as any;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (scholarshipStatus) {
      where.scholarshipStatus = { equals: scholarshipStatus, mode: 'insensitive' };
    }

    if (hostelStatus) {
      where.hostelStatus = { equals: hostelStatus, mode: 'insensitive' };
    }

    if (transportStatus) {
      where.transportStatus = { equals: transportStatus, mode: 'insensitive' };
    }

    if (admissionSession) {
      where.admissionSession = { equals: admissionSession, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search, mode: 'insensitive' } },
        { cnic: { contains: search, mode: 'insensitive' } },
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
      ];
    }

    return prisma.student.count({ where });
  }

  async findById(id: number): Promise<StudentWithRelations | null> {
    return prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: true,
        department: true,
        program: true,
        semester: true,
        section: true,
        academicYear: true,
        parent: true,
      },
    });
  }

  async findByUuid(uuid: string): Promise<StudentWithRelations | null> {
    return prisma.student.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        user: true,
        department: true,
        program: true,
        semester: true,
        section: true,
        academicYear: true,
        parent: true,
      },
    });
  }

  async findByUserId(userId: number): Promise<StudentWithRelations | null> {
    return prisma.student.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: true,
        department: true,
        program: true,
        semester: true,
        section: true,
        academicYear: true,
        parent: true,
      },
    });
  }

  async findByRollNumber(rollNumber: string): Promise<Student | null> {
    return prisma.student.findFirst({
      where: { rollNumber: { equals: rollNumber, mode: 'insensitive' }, deletedAt: null },
    });
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<Student | null> {
    return prisma.student.findFirst({
      where: { registrationNumber: { equals: registrationNumber, mode: 'insensitive' }, deletedAt: null },
    });
  }

  async create(data: Prisma.StudentUncheckedCreateInput): Promise<StudentWithRelations> {
    return prisma.student.create({
      data,
      include: {
        user: true,
        department: true,
        program: true,
        semester: true,
        section: true,
        academicYear: true,
        parent: true,
      },
    });
  }

  async update(id: number, data: Prisma.StudentUncheckedUpdateInput): Promise<StudentWithRelations> {
    return prisma.student.update({
      where: { id },
      data,
      include: {
        user: true,
        department: true,
        program: true,
        semester: true,
        section: true,
        academicYear: true,
        parent: true,
      },
    });
  }

  async softDelete(id: number, updatedBy?: string): Promise<Student> {
    return prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  async findByProgramId(programId: number): Promise<StudentWithRelations[]> {
    return prisma.student.findMany({
      where: { programId, deletedAt: null },
      include: {
        user: true,
        department: true,
        program: true,
        semester: true,
        section: true,
        academicYear: true,
        parent: true,
      },
    });
  }

  async findBySectionId(sectionId: number): Promise<StudentWithRelations[]> {
    return prisma.student.findMany({
      where: { sectionId, deletedAt: null },
      include: {
        user: true,
        department: true,
        program: true,
        semester: true,
        section: true,
        academicYear: true,
        parent: true,
      },
    });
  }
}

export const studentRepository = new StudentRepository();
export default studentRepository;
