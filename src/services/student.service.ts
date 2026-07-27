import { studentRepository, StudentWithRelations } from '../repositories/student.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import {
  StudentNotFoundError,
  DuplicateRollNumberError,
  DuplicateRegistrationNumberError,
  DuplicateUserAssignmentError,
  InvalidStudentRelationshipError,
} from '../errors/student.errors';

export class StudentService {
  async getStudents(params: {
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
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    students: StudentWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      studentRepository.findAll({
        search: params.search,
        status: params.status,
        departmentId: params.departmentId,
        programId: params.programId,
        semesterId: params.semesterId,
        sectionId: params.sectionId,
        scholarshipStatus: params.scholarshipStatus,
        hostelStatus: params.hostelStatus,
        transportStatus: params.transportStatus,
        admissionSession: params.admissionSession,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        skip,
        take: limit,
      }),
      studentRepository.count({
        search: params.search,
        status: params.status,
        departmentId: params.departmentId,
        programId: params.programId,
        semesterId: params.semesterId,
        sectionId: params.sectionId,
        scholarshipStatus: params.scholarshipStatus,
        hostelStatus: params.hostelStatus,
        transportStatus: params.transportStatus,
        admissionSession: params.admissionSession,
      }),
    ]);

    return {
      students,
      total,
      page,
      limit,
    };
  }

  async getStudentByUuid(uuid: string): Promise<StudentWithRelations> {
    const student = await studentRepository.findByUuid(uuid);
    if (!student) {
      throw new StudentNotFoundError();
    }
    return student;
  }

  async getStudentByUserId(userId: number): Promise<StudentWithRelations> {
    const student = await studentRepository.findByUserId(userId);
    if (!student) {
      throw new StudentNotFoundError();
    }
    return student;
  }

  async getStudentsByProgram(programId: number): Promise<StudentWithRelations[]> {
    const prog = await prisma.program.findUnique({
      where: { id: programId },
    });
    if (!prog) {
      throw new InvalidStudentRelationshipError('Program not found');
    }
    return studentRepository.findByProgramId(programId);
  }

  async getStudentsBySection(sectionId: number): Promise<StudentWithRelations[]> {
    const sect = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!sect) {
      throw new InvalidStudentRelationshipError('Section not found');
    }
    return studentRepository.findBySectionId(sectionId);
  }

  async createStudent(
    data: {
      userId: number;
      registrationNumber: string;
      rollNumber: string;
      idCardNumber?: string | null;
      departmentId: number;
      programId: number;
      semesterId: number;
      sectionId?: number | null;
      academicYearId: number;
      admissionSession?: string | null;
      admissionDate?: Date | null;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'APPLIED' | 'WITHDRAWN' | 'ALUMNI';
      enrollmentStatus?: string | null;
      
      // Personal Info
      fullName?: string | null;
      fatherName?: string | null;
      motherName?: string | null;
      guardianRelationship?: string | null;
      dateOfBirth?: Date | null;
      gender?: string | null;
      bloodGroup?: string | null;
      nationality?: string | null;
      cnic?: string | null;
      
      // Contact Info
      email?: string | null;
      mobileNumber?: string | null;
      emergencyContact?: string | null;
      permanentAddress?: string | null;
      currentAddress?: string | null;
      city?: string | null;
      province?: string | null;
      country?: string | null;
      postalCode?: string | null;
      
      // Academic History
      previousInstitution?: string | null;
      previousQualification?: string | null;
      previousCgpa?: number | null;
      admissionMeritNumber?: number | null;
      
      // Preferences/Facilities
      scholarshipStatus?: string | null;
      hostelStatus?: string | null;
      transportStatus?: string | null;
      medicalNotes?: string | null;
      
      // Media
      studentPhoto?: string | null;
      signatureImage?: string | null;
    },
    actorId: number,
    actorEmail: string
  ): Promise<StudentWithRelations> {
    // 1. Verify user exists and has student role
    const assignedUser = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { role: true },
    });

    if (!assignedUser || assignedUser.deletedAt !== null) {
      throw new InvalidStudentRelationshipError('Assigned User does not exist');
    }

    if (assignedUser.role.name !== 'STUDENT') {
      throw new InvalidStudentRelationshipError('Assigned User must have the STUDENT role');
    }

    // 2. Check if user already has a student profile
    const existingProfile = await studentRepository.findByUserId(data.userId);
    if (existingProfile) {
      throw new DuplicateUserAssignmentError();
    }

    // 3. Verify relations exist
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId, deletedAt: null },
    });
    if (!dept) {
      throw new InvalidStudentRelationshipError('Department does not exist');
    }

    const prog = await prisma.program.findUnique({
      where: { id: data.programId, deletedAt: null },
    });
    if (!prog) {
      throw new InvalidStudentRelationshipError('Program does not exist');
    }

    const sem = await prisma.semester.findUnique({
      where: { id: data.semesterId, deletedAt: null },
    });
    if (!sem) {
      throw new InvalidStudentRelationshipError('Semester does not exist');
    }

    if (data.sectionId) {
      const sect = await prisma.section.findUnique({
        where: { id: data.sectionId, deletedAt: null },
      });
      if (!sect) {
        throw new InvalidStudentRelationshipError('Section does not exist');
      }
    }

    const acYear = await prisma.academicYear.findUnique({
      where: { id: data.academicYearId, deletedAt: null },
    });
    if (!acYear) {
      throw new InvalidStudentRelationshipError('Academic Year does not exist');
    }

    // 4. Verify unique fields
    const duplicateReg = await studentRepository.findByRegistrationNumber(data.registrationNumber);
    if (duplicateReg) {
      throw new DuplicateRegistrationNumberError();
    }

    const duplicateRoll = await studentRepository.findByRollNumber(data.rollNumber);
    if (duplicateRoll) {
      throw new DuplicateRollNumberError();
    }

    // 5. Create student
    const student = await studentRepository.create({
      ...data,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    });

    // 6. Log Audit
    await auditService.log({
      action: 'Student Created',
      tableName: 'Student',
      recordId: student.uuid,
      newValue: student,
      userId: actorId,
    });

    return student;
  }

  async updateStudent(
    uuid: string,
    data: Partial<{
      registrationNumber: string;
      rollNumber: string;
      idCardNumber: string | null;
      departmentId: number;
      programId: number;
      semesterId: number;
      sectionId: number | null;
      academicYearId: number;
      admissionSession: string | null;
      admissionDate: Date | null;
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'APPLIED' | 'WITHDRAWN' | 'ALUMNI';
      enrollmentStatus: string | null;
      
      fullName: string | null;
      fatherName: string | null;
      motherName: string | null;
      guardianRelationship: string | null;
      dateOfBirth: Date | null;
      gender: string | null;
      bloodGroup: string | null;
      nationality: string | null;
      cnic: string | null;
      
      email: string | null;
      mobileNumber: string | null;
      emergencyContact: string | null;
      permanentAddress: string | null;
      currentAddress: string | null;
      city: string | null;
      province: string | null;
      country: string | null;
      postalCode: string | null;
      
      previousInstitution: string | null;
      previousQualification: string | null;
      previousCgpa: number | null;
      admissionMeritNumber: number | null;
      
      scholarshipStatus: string | null;
      hostelStatus: string | null;
      transportStatus: string | null;
      medicalNotes: string | null;
      
      studentPhoto: string | null;
      signatureImage: string | null;
    }>,
    actorId: number,
    actorEmail: string
  ): Promise<StudentWithRelations> {
    const existing = await studentRepository.findByUuid(uuid);
    if (!existing) {
      throw new StudentNotFoundError();
    }

    // Verify relations if modified
    if (data.departmentId && data.departmentId !== existing.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId, deletedAt: null },
      });
      if (!dept) {
        throw new InvalidStudentRelationshipError('Department does not exist');
      }
    }

    if (data.programId && data.programId !== existing.programId) {
      const prog = await prisma.program.findUnique({
        where: { id: data.programId, deletedAt: null },
      });
      if (!prog) {
        throw new InvalidStudentRelationshipError('Program does not exist');
      }
    }

    if (data.semesterId && data.semesterId !== existing.semesterId) {
      const sem = await prisma.semester.findUnique({
        where: { id: data.semesterId, deletedAt: null },
      });
      if (!sem) {
        throw new InvalidStudentRelationshipError('Semester does not exist');
      }
    }

    if (data.sectionId && data.sectionId !== existing.sectionId) {
      const sect = await prisma.section.findUnique({
        where: { id: data.sectionId, deletedAt: null },
      });
      if (!sect) {
        throw new InvalidStudentRelationshipError('Section does not exist');
      }
    }

    if (data.academicYearId && data.academicYearId !== existing.academicYearId) {
      const acYear = await prisma.academicYear.findUnique({
        where: { id: data.academicYearId, deletedAt: null },
      });
      if (!acYear) {
        throw new InvalidStudentRelationshipError('Academic Year does not exist');
      }
    }

    // Verify uniqueness if modified
    if (data.registrationNumber && data.registrationNumber !== existing.registrationNumber) {
      const duplicateReg = await studentRepository.findByRegistrationNumber(data.registrationNumber);
      if (duplicateReg) {
        throw new DuplicateRegistrationNumberError();
      }
    }

    if (data.rollNumber && data.rollNumber !== existing.rollNumber) {
      const duplicateRoll = await studentRepository.findByRollNumber(data.rollNumber);
      if (duplicateRoll) {
        throw new DuplicateRollNumberError();
      }
    }

    const updated = await studentRepository.update(existing.id, {
      ...data,
      updatedBy: actorEmail,
    });

    // Log Audit
    await auditService.log({
      action: 'Student Updated',
      tableName: 'Student',
      recordId: existing.uuid,
      oldValue: existing,
      newValue: updated,
      userId: actorId,
    });

    return updated;
  }

  async deleteStudent(uuid: string, actorId: number, actorEmail: string): Promise<void> {
    const existing = await studentRepository.findByUuid(uuid);
    if (!existing) {
      throw new StudentNotFoundError();
    }

    await studentRepository.softDelete(existing.id, actorEmail);

    // Log Audit
    await auditService.log({
      action: 'Student Deleted',
      tableName: 'Student',
      recordId: existing.uuid,
      oldValue: existing,
      userId: actorId,
    });
  }

  async updateStatus(
    uuid: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'APPLIED' | 'WITHDRAWN' | 'ALUMNI',
    actorId: number,
    actorEmail: string
  ): Promise<StudentWithRelations> {
    const existing = await studentRepository.findByUuid(uuid);
    if (!existing) {
      throw new StudentNotFoundError();
    }

    const updated = await studentRepository.update(existing.id, {
      status,
      updatedBy: actorEmail,
    });

    // Log Audit
    await auditService.log({
      action: 'Status Changed',
      tableName: 'Student',
      recordId: existing.uuid,
      oldValue: { status: existing.status },
      newValue: { status },
      userId: actorId,
    });

    return updated;
  }
}

export const studentService = new StudentService();
export default studentService;
