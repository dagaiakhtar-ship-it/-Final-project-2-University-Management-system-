import { EnrollmentRepository, EnrollmentWithRelations } from '../repositories/enrollment.repository';
import { prisma } from './db.service';
import { auditService } from './audit.service';
import {
  EnrollmentNotFoundError,
  DuplicateEnrollmentError,
  CreditLimitExceededError,
  CourseOfferingFullError,
  InactiveCourseOfferingError,
  InactiveStudentError,
} from '../errors/enrollment.errors';
import { StudentNotFoundError } from '../errors/student.errors';

export class EnrollmentService {
  private enrollmentRepo = new EnrollmentRepository();

  async getAllEnrollments(params: {
    search?: string;
    status?: string;
    enrollmentType?: string;
    session?: string;
    academicYear?: string;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    studentId?: number;
    courseOfferingId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }) {
    return this.enrollmentRepo.findAll(params);
  }

  async getEnrollmentById(id: number): Promise<EnrollmentWithRelations> {
    const enrollment = await this.enrollmentRepo.findById(id);
    if (!enrollment) {
      throw new EnrollmentNotFoundError();
    }
    return enrollment;
  }

  async getEnrollmentByUuid(uuid: string): Promise<EnrollmentWithRelations> {
    const enrollment = await this.enrollmentRepo.findByUuid(uuid);
    if (!enrollment) {
      throw new EnrollmentNotFoundError();
    }
    return enrollment;
  }

  async getEnrollmentsByStudent(studentId: number) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new StudentNotFoundError();

    return this.enrollmentRepo.findAll({ studentId, take: 100 });
  }

  async getEnrollmentsByCourseOffering(courseOfferingId: number) {
    return this.enrollmentRepo.findAll({ courseOfferingId, take: 200 });
  }

  async getCurrentEnrollmentsByStudent(studentId: number) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new StudentNotFoundError();

    return this.enrollmentRepo.findAll({
      studentId,
      status: 'Enrolled',
      take: 50,
    });
  }

  async createEnrollment(
    data: {
      studentId: number;
      courseOfferingId: number;
      academicYear: string;
      session: string;
      enrollmentType?: string;
      creditsRegistered?: number;
      tuitionStatus?: string;
      advisorApproval?: boolean;
      registrarApproval?: boolean;
      remarks?: string | null;
      status?: string;
    },
    actorUserId: number,
    actorEmail: string
  ) {
    // 1. Verify student exists and is ACTIVE
    const student = await prisma.student.findUnique({
      where: { id: data.studentId, deletedAt: null },
      include: { user: true },
    });
    if (!student) {
      throw new StudentNotFoundError();
    }
    if (student.status !== 'ACTIVE') {
      throw new InactiveStudentError(`Cannot enroll student. Student status is: ${student.status}`);
    }

    // 2. Verify course offering exists and is ACTIVE (not Cancelled)
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: data.courseOfferingId, deletedAt: null },
      include: { subject: true },
    });
    if (!courseOffering) {
      throw new Error('Course Offering not found');
    }
    if (courseOffering.status === 'Cancelled') {
      throw new InactiveCourseOfferingError('Cannot enroll in a cancelled Course Offering');
    }

    // 3. Prevent duplicate enrollment / Handle soft-delete restoration
    const existingWithDeleted = await prisma.enrollment.findFirst({
      where: {
        studentId: data.studentId,
        courseOfferingId: data.courseOfferingId,
      },
    });

    // 4. Validate course offering capacity
    if (courseOffering.currentEnrollment >= courseOffering.maxStudents) {
      throw new CourseOfferingFullError();
    }

    // 5. Validate credit hours limits (standard limit is 18, or customizable)
    const incomingCredits = data.creditsRegistered ?? courseOffering.subject.creditHours;
    const currentCredits = await this.enrollmentRepo.getSumCreditsByStudent(
      data.studentId,
      data.academicYear,
      data.session
    );

    const maxAllowedCredits = 18; // Standard academic credit limit per session
    if (currentCredits + incomingCredits > maxAllowedCredits) {
      throw new CreditLimitExceededError(
        `Credit hour limit exceeded. Current: ${currentCredits} credits, trying to add: ${incomingCredits} credits. Maximum allowed: ${maxAllowedCredits} credits.`
      );
    }

    if (existingWithDeleted) {
      if (existingWithDeleted.deletedAt === null) {
        throw new DuplicateEnrollmentError();
      } else {
        // If it was soft-deleted, we can restore and reactivate it!
        const restored = await prisma.$transaction(async (tx) => {
          const restoredEnrollment = await tx.enrollment.update({
            where: { id: existingWithDeleted.id },
            data: {
              deletedAt: null,
              status: data.status ?? 'Enrolled',
              enrollmentType: data.enrollmentType ?? 'Regular',
              creditsRegistered: incomingCredits,
              tuitionStatus: data.tuitionStatus ?? 'Pending',
              advisorApproval: data.advisorApproval ?? false,
              registrarApproval: data.registrarApproval ?? false,
              remarks: data.remarks ?? null,
              updatedBy: actorEmail,
            },
          });

          await tx.courseOffering.update({
            where: { id: data.courseOfferingId },
            data: {
              currentEnrollment: {
                increment: 1,
              },
            },
          });

          return restoredEnrollment;
        });

        // Log Audit Trails for Restoration
        await auditService.log({
          action: 'ENROLLMENT_RESTORED',
          tableName: 'Enrollment',
          recordId: restored.uuid,
          newValue: restored,
          userId: actorUserId,
        });

        return restored;
      }
    }

    // 6. Auto-generate a unique enrollment number
    const normalizedYear = data.academicYear.replace(/[^0-9]/g, '').substring(0, 4);
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const enrollmentNumber = `ENR-${normalizedYear}-${randomSuffix}`;

    // 7. Create the enrollment
    const enrollment = await this.enrollmentRepo.create({
      enrollmentNumber,
      studentId: data.studentId,
      courseOfferingId: data.courseOfferingId,
      academicYear: data.academicYear,
      session: data.session,
      enrollmentType: data.enrollmentType ?? 'Regular',
      creditsRegistered: incomingCredits,
      tuitionStatus: data.tuitionStatus ?? 'Pending',
      advisorApproval: data.advisorApproval ?? false,
      registrarApproval: data.registrarApproval ?? false,
      remarks: data.remarks ?? null,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    });

    // 8. Log Audit Trails
    await auditService.log({
      action: 'ENROLLMENT_CREATED',
      tableName: 'Enrollment',
      recordId: enrollment.uuid,
      newValue: enrollment,
      userId: actorUserId,
    });

    return enrollment;
  }

  async updateEnrollment(
    id: number,
    data: {
      enrollmentType?: string;
      creditsRegistered?: number;
      tuitionStatus?: string;
      advisorApproval?: boolean;
      registrarApproval?: boolean;
      remarks?: string | null;
      status?: string;
    },
    actorUserId: number,
    actorEmail: string
  ) {
    const existing = await this.enrollmentRepo.findById(id);
    if (!existing) {
      throw new EnrollmentNotFoundError();
    }

    let updated;
    if (data.status && data.status !== existing.status) {
      const wasActive = ['Pending', 'Approved', 'Enrolled'].includes(existing.status);
      const isActive = ['Pending', 'Approved', 'Enrolled'].includes(data.status);

      updated = await prisma.$transaction(async (tx) => {
        const up = await tx.enrollment.update({
          where: { id },
          data: {
            ...data,
            updatedBy: actorEmail,
          },
        });

        if (wasActive && !isActive) {
          await tx.courseOffering.update({
            where: { id: existing.courseOfferingId },
            data: { currentEnrollment: { decrement: 1 } },
          });
        } else if (!wasActive && isActive) {
          await tx.courseOffering.update({
            where: { id: existing.courseOfferingId },
            data: { currentEnrollment: { increment: 1 } },
          });
        }

        return up;
      });
    } else {
      updated = await this.enrollmentRepo.update(id, {
        ...data,
        updatedBy: actorEmail,
      });
    }

    await auditService.log({
      action: 'ENROLLMENT_UPDATED',
      tableName: 'Enrollment',
      recordId: existing.uuid,
      oldValue: existing,
      newValue: updated,
      userId: actorUserId,
    });

    return updated;
  }

  async patchEnrollmentStatus(
    id: number,
    status: string,
    actorUserId: number,
    actorEmail: string
  ) {
    const existing = await this.enrollmentRepo.findById(id);
    if (!existing) {
      throw new EnrollmentNotFoundError();
    }

    if (status === existing.status) {
      return existing;
    }

    const wasActive = ['Pending', 'Approved', 'Enrolled'].includes(existing.status);
    const isActive = ['Pending', 'Approved', 'Enrolled'].includes(status);

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.enrollment.update({
        where: { id },
        data: {
          status,
          updatedBy: actorEmail,
        },
      });

      if (wasActive && !isActive) {
        await tx.courseOffering.update({
          where: { id: existing.courseOfferingId },
          data: { currentEnrollment: { decrement: 1 } },
        });
      } else if (!wasActive && isActive) {
        await tx.courseOffering.update({
          where: { id: existing.courseOfferingId },
          data: { currentEnrollment: { increment: 1 } },
        });
      }

      return up;
    });

    await auditService.log({
      action: `ENROLLMENT_${status.toUpperCase()}`,
      tableName: 'Enrollment',
      recordId: existing.uuid,
      oldValue: existing,
      newValue: updated,
      userId: actorUserId,
    });

    return updated;
  }

  async deleteEnrollment(id: number, actorUserId: number, actorEmail: string) {
    const existing = await this.enrollmentRepo.findById(id);
    if (!existing) {
      throw new EnrollmentNotFoundError();
    }

    const enrollment = await this.enrollmentRepo.delete(id, existing.courseOfferingId);

    await auditService.log({
      action: 'ENROLLMENT_DELETED',
      tableName: 'Enrollment',
      recordId: existing.uuid,
      oldValue: existing,
      userId: actorUserId,
    });

    return enrollment;
  }
}
