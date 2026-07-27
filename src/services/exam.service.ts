import { prisma } from './db.service';
import { auditService } from './audit.service';
import { notifyExamChange } from './socket.service';

export interface CreateExamInput {
  title: string;
  examType: string;
  courseOfferingId: number;
  subjectId: number;
  teacherId: number;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  examDate: Date | string;
  startTime: string;
  endTime: string;
  roomId?: number;
  buildingId?: number;
  session: string;
  academicYear: string;
  instructions?: string;
  createdBy?: string;
}

export interface UpdateExamInput {
  title?: string;
  examType?: string;
  courseOfferingId?: number;
  subjectId?: number;
  teacherId?: number;
  totalMarks?: number;
  passingMarks?: number;
  durationMinutes?: number;
  examDate?: Date | string;
  startTime?: string;
  endTime?: string;
  roomId?: number;
  buildingId?: number;
  session?: string;
  academicYear?: string;
  instructions?: string;
  status?: string;
  updatedBy?: string;
}

export class ExamService {
  private isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
    const [hAStart, mAStart] = startA.split(':').map(Number);
    const [hAEnd, mAEnd] = endA.split(':').map(Number);
    const [hBStart, mBStart] = startB.split(':').map(Number);
    const [hBEnd, mBEnd] = endB.split(':').map(Number);

    const tAStart = hAStart * 60 + mAStart;
    const tAEnd = hAEnd * 60 + mAEnd;
    const tBStart = hBStart * 60 + mBStart;
    const tBEnd = hBEnd * 60 + mBEnd;

    return Math.max(tAStart, tBStart) < Math.min(tAEnd, tBEnd);
  }

  // Generate unique exam code
  private async generateExamCode(): Promise<string> {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const code = `EXAM-${randomNum}`;
    const exists = await prisma.exam.findUnique({ where: { examCode: code } });
    if (exists) {
      return this.generateExamCode();
    }
    return code;
  }

  // Conflict Detection and Validation
  async validateExamSchedule(params: {
    id?: number;
    courseOfferingId: number;
    teacherId: number;
    examDate: Date | string;
    startTime: string;
    endTime: string;
    roomId?: number;
    examType: string;
    subjectId: number;
  }): Promise<{ conflicts: string[] }> {
    const conflicts: string[] = [];
    const { id, courseOfferingId, teacherId, examDate, startTime, endTime, roomId, examType, subjectId } = params;

    const dateObj = new Date(examDate);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Get Course Offering Enrollment Count & Details
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      include: {
        enrollments: {
          where: { status: 'Enrolled' },
          select: { studentId: true, id: true },
        },
      },
    });

    if (!courseOffering) {
      conflicts.push('Course offering not found.');
      return { conflicts };
    }

    const studentIds = courseOffering.enrollments.map((e) => e.studentId);
    const studentCount = studentIds.length;

    // 2. Validate Room Capacity
    if (roomId) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        conflicts.push('Selected room not found.');
      } else if (room.capacity < studentCount) {
        conflicts.push(`Selected room capacity (${room.capacity}) is less than current enrollment strength (${studentCount}).`);
      }
    }

    // 3. Check duplicate exam schedule (same course offering, subject, exam type, active)
    const duplicate = await prisma.exam.findFirst({
      where: {
        courseOfferingId,
        subjectId,
        examType,
        status: { not: 'Cancelled' },
        softDelete: false,
        ...(id ? { id: { not: id } } : {}),
      },
    });
    if (duplicate) {
      conflicts.push(`An active exam of type "${examType}" is already scheduled for this course offering.`);
    }

    // Fetch other active exams scheduled on the same date
    const examsOnSameDay = await prisma.exam.findMany({
      where: {
        examDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'Cancelled' },
        softDelete: false,
        ...(id ? { id: { not: id } } : {}),
      },
      include: {
        courseOffering: {
          include: {
            enrollments: {
              where: { status: 'Enrolled' },
              select: { studentId: true },
            },
          },
        },
        invigilators: true,
      },
    });

    for (const otherExam of examsOnSameDay) {
      const timeOverlaps = this.isTimeOverlapping(startTime, endTime, otherExam.startTime, otherExam.endTime);
      if (!timeOverlaps) continue;

      // 4. Room conflict check
      if (roomId && otherExam.roomId === roomId) {
        conflicts.push(`Room conflict: Selected room is already booked for another exam "${otherExam.title}" during this time.`);
      }

      // 5. Teacher (examiner) conflict check
      if (otherExam.teacherId === teacherId) {
        conflicts.push(`Teacher conflict: Teacher is already scheduled as the examiner for exam "${otherExam.title}" during this time.`);
      }

      // 6. Teacher (invigilator) conflict check
      const isInvigilator = otherExam.invigilators.some((inv) => inv.teacherId === teacherId);
      if (isInvigilator) {
        conflicts.push(`Teacher conflict: Teacher is already assigned as an invigilator for exam "${otherExam.title}" during this time.`);
      }

      // 7. Student conflicts check
      const otherStudentIds = otherExam.courseOffering.enrollments.map((e) => e.studentId);
      const overlappingStudents = studentIds.filter((sid) => otherStudentIds.includes(sid));
      if (overlappingStudents.length > 0) {
        conflicts.push(`Student conflict: ${overlappingStudents.length} student(s) enrolled in this course have another overlapping exam "${otherExam.title}" at this time.`);
      }
    }

    return { conflicts };
  }

  // Create Exam
  async createExam(data: CreateExamInput): Promise<any> {
    const validation = await this.validateExamSchedule({
      courseOfferingId: data.courseOfferingId,
      teacherId: data.teacherId,
      examDate: data.examDate,
      startTime: data.startTime,
      endTime: data.endTime,
      roomId: data.roomId,
      examType: data.examType,
      subjectId: data.subjectId,
    });

    if (validation.conflicts.length > 0) {
      throw new Error(`Scheduling conflict(s) detected:\n${validation.conflicts.join('\n')}`);
    }

    const examCode = await this.generateExamCode();

    const exam = await prisma.exam.create({
      data: {
        examCode,
        title: data.title,
        examType: data.examType,
        courseOfferingId: data.courseOfferingId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        durationMinutes: data.durationMinutes,
        examDate: new Date(data.examDate),
        startTime: data.startTime,
        endTime: data.endTime,
        roomId: data.roomId || null,
        buildingId: data.buildingId || null,
        session: data.session,
        academicYear: data.academicYear,
        instructions: data.instructions || '',
        status: data.roomId ? 'Scheduled' : 'Draft',
        createdBy: data.createdBy || 'System',
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
            teacher: { include: { user: true } },
          },
        },
        room: { include: { building: true } },
      },
    });

    await auditService.log({
      action: 'Exam Created',
      tableName: 'Exam',
      recordId: String(exam.id),
      newValue: exam,
      userId: undefined, // Will be filled in controller
    });

    notifyExamChange('CREATED', {
      id: exam.id,
      title: exam.title,
      examCode: exam.examCode,
      courseOfferingId: exam.courseOfferingId,
    });

    return exam;
  }

  // Update Exam
  async updateExam(id: number, data: UpdateExamInput, userId?: number): Promise<any> {
    const existing = await prisma.exam.findUnique({
      where: { id },
      include: { invigilators: true },
    });

    if (!existing || existing.softDelete) {
      throw new Error('Exam not found.');
    }

    // Validate overlapping schedules if time or place changes
    const courseOfferingId = data.courseOfferingId ?? existing.courseOfferingId;
    const teacherId = data.teacherId ?? existing.teacherId;
    const examDate = data.examDate ?? existing.examDate;
    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;
    const roomId = data.roomId !== undefined ? data.roomId : (existing.roomId ?? undefined);
    const examType = data.examType ?? existing.examType;
    const subjectId = data.subjectId ?? existing.subjectId;

    if (
      data.courseOfferingId ||
      data.teacherId ||
      data.examDate ||
      data.startTime ||
      data.endTime ||
      data.roomId !== undefined ||
      data.examType ||
      data.subjectId
    ) {
      const validation = await this.validateExamSchedule({
        id,
        courseOfferingId,
        teacherId,
        examDate,
        startTime,
        endTime,
        roomId,
        examType,
        subjectId,
      });

      if (validation.conflicts.length > 0) {
        throw new Error(`Scheduling conflict(s) detected:\n${validation.conflicts.join('\n')}`);
      }
    }

    const updateData: any = { ...data };
    if (data.examDate) updateData.examDate = new Date(data.examDate);

    // Auto update status if roomId is assigned and was draft
    if (data.roomId && existing.status === 'Draft' && !data.status) {
      updateData.status = 'Scheduled';
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: {
        courseOffering: {
          include: {
            subject: true,
            teacher: { include: { user: true } },
          },
        },
        room: { include: { building: true } },
      },
    });

    await auditService.log({
      action: 'Exam Updated',
      tableName: 'Exam',
      recordId: String(updated.id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    notifyExamChange('SCHEDULED', {
      id: updated.id,
      title: updated.title,
      examCode: updated.examCode,
      courseOfferingId: updated.courseOfferingId,
    });

    return updated;
  }

  // Delete Exam (Soft Delete)
  async deleteExam(id: number, userId?: number): Promise<any> {
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing || existing.softDelete) {
      throw new Error('Exam not found.');
    }

    const deleted = await prisma.exam.update({
      where: { id },
      data: {
        softDelete: true,
        deletedAt: new Date(),
      },
    });

    await auditService.log({
      action: 'Exam Deleted',
      tableName: 'Exam',
      recordId: String(id),
      oldValue: existing,
      userId,
    });

    return deleted;
  }

  // Get single Exam with detailed relations
  async getExamById(id: number): Promise<any> {
    const exam = await prisma.exam.findFirst({
      where: { id, softDelete: false },
      include: {
        courseOffering: {
          include: {
            department: true,
            program: true,
            semester: true,
            section: true,
            subject: true,
            teacher: { include: { user: true } },
          },
        },
        subject: true,
        teacher: { include: { user: true } },
        room: { include: { building: true } },
        building: true,
        invigilators: {
          include: { teacher: { include: { user: true } } },
        },
        seatPlans: {
          include: {
            student: { include: { user: true } },
            room: true,
          },
        },
      },
    });

    if (!exam) {
      throw new Error('Exam not found.');
    }

    return exam;
  }

  // List all exams with pagination, search, filter
  async getExams(filters: {
    search?: string;
    examType?: string;
    status?: string;
    academicYear?: string;
    session?: string;
    courseOfferingId?: number;
    roomId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ exams: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      softDelete: false,
    };

    if (filters.examType) where.examType = filters.examType;
    if (filters.status) where.status = filters.status;
    if (filters.academicYear) where.academicYear = filters.academicYear;
    if (filters.session) where.session = filters.session;
    if (filters.courseOfferingId) where.courseOfferingId = Number(filters.courseOfferingId);
    if (filters.roomId) where.roomId = Number(filters.roomId);

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { examCode: { contains: filters.search, mode: 'insensitive' } },
        { courseOffering: { subject: { name: { contains: filters.search, mode: 'insensitive' } } } },
        { courseOffering: { subject: { code: { contains: filters.search, mode: 'insensitive' } } } },
      ];
    }

    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        include: {
          courseOffering: {
            include: {
              subject: true,
              section: true,
              teacher: { include: { user: true } },
            },
          },
          subject: true,
          teacher: { include: { user: true } },
          room: { include: { building: true } },
        },
        orderBy: { examDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.exam.count({ where }),
    ]);

    return { exams, total };
  }

  // Schedule an Exam directly (Assign date, time, room)
  async scheduleExam(
    id: number,
    data: {
      examDate: Date | string;
      startTime: string;
      endTime: string;
      roomId: number;
      buildingId?: number;
    },
    userId?: number
  ): Promise<any> {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam || exam.softDelete) {
      throw new Error('Exam not found.');
    }

    const validation = await this.validateExamSchedule({
      id,
      courseOfferingId: exam.courseOfferingId,
      teacherId: exam.teacherId,
      examDate: data.examDate,
      startTime: data.startTime,
      endTime: data.endTime,
      roomId: data.roomId,
      examType: exam.examType,
      subjectId: exam.subjectId,
    });

    if (validation.conflicts.length > 0) {
      throw new Error(`Scheduling conflict(s) detected:\n${validation.conflicts.join('\n')}`);
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        examDate: new Date(data.examDate),
        startTime: data.startTime,
        endTime: data.endTime,
        roomId: data.roomId,
        buildingId: data.buildingId || null,
        status: 'Scheduled',
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
            section: true,
            teacher: { include: { user: true } },
          },
        },
        room: { include: { building: true } },
      },
    });

    await auditService.log({
      action: 'Exam Scheduled',
      tableName: 'Exam',
      recordId: String(id),
      oldValue: exam,
      newValue: updated,
      userId,
    });

    notifyExamChange('SCHEDULED', {
      id: updated.id,
      title: updated.title,
      examCode: updated.examCode,
      courseOfferingId: updated.courseOfferingId,
    });

    return updated;
  }

  // Cancel an Exam
  async cancelExam(id: number, userId?: number): Promise<any> {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam || exam.softDelete) {
      throw new Error('Exam not found.');
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: { status: 'Cancelled' },
    });

    await auditService.log({
      action: 'Exam Cancelled',
      tableName: 'Exam',
      recordId: String(id),
      oldValue: exam,
      newValue: updated,
      userId,
    });

    notifyExamChange('CANCELLED', {
      id: updated.id,
      title: updated.title,
      examCode: updated.examCode,
      courseOfferingId: updated.courseOfferingId,
    });

    return updated;
  }

  // Generate Seat Plan
  async generateSeatPlan(id: number, userId?: number): Promise<any> {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        courseOffering: {
          include: {
            enrollments: {
              where: { status: 'Enrolled' },
              include: { student: true },
            },
          },
        },
        room: true,
      },
    });

    if (!exam || exam.softDelete) {
      throw new Error('Exam not found.');
    }

    if (!exam.roomId || !exam.room) {
      throw new Error('Please schedule the exam and allocate a room before generating a seat plan.');
    }

    const enrollments = exam.courseOffering.enrollments;
    const studentCount = enrollments.length;

    if (studentCount === 0) {
      throw new Error('No enrolled students found in this course offering to generate a seat plan.');
    }

    if (exam.room.capacity < studentCount) {
      throw new Error(`Room capacity (${exam.room.capacity}) is less than current enrollment strength (${studentCount}).`);
    }

    // Delete existing seat plans for this exam to regenerate
    await prisma.examSeatPlan.deleteMany({ where: { examId: id } });

    // Sequentially allocate seats
    // Define rows and columns layout based on room capacity (e.g. 5 columns wide grid)
    const columns = 5;
    const seatPlansData = [];

    for (let i = 0; i < enrollments.length; i++) {
      const enrollment = enrollments[i];
      const seatIndex = i + 1;
      const rowNumber = Math.ceil(seatIndex / columns);
      const columnNumber = seatIndex % columns === 0 ? columns : seatIndex % columns;
      const seatNumber = `R${rowNumber}-C${columnNumber}`;

      seatPlansData.push({
        examId: id,
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        roomId: exam.roomId,
        seatNumber,
        rowNumber,
        columnNumber,
      });
    }

    // Insert seat plans
    await prisma.examSeatPlan.createMany({ data: seatPlansData });

    const seatPlans = await prisma.examSeatPlan.findMany({
      where: { examId: id },
      include: {
        student: { include: { user: true } },
      },
    });

    await auditService.log({
      action: 'Seat Plan Generated',
      tableName: 'ExamSeatPlan',
      recordId: String(id),
      newValue: { count: seatPlans.length },
      userId,
    });

    notifyExamChange('SEAT_PLAN_GENERATED', {
      id: exam.id,
      title: exam.title,
      examCode: exam.examCode,
      courseOfferingId: exam.courseOfferingId,
    });

    return seatPlans;
  }

  // Assign Invigilators
  async assignInvigilators(id: number, teacherAssignments: { teacherId: number; role: string }[], userId?: number): Promise<any> {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam || exam.softDelete) {
      throw new Error('Exam not found.');
    }

    // Validate each teacher for active schedule conflict during this exam date and time
    const startOfDay = new Date(exam.examDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(exam.examDate);
    endOfDay.setHours(23, 59, 59, 999);

    for (const assignment of teacherAssignments) {
      const { teacherId, role } = assignment;

      // 1. Check if teacher is already scheduled for another active exam at overlapping time
      const teacherExams = await prisma.exam.findMany({
        where: {
          teacherId,
          examDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { not: 'Cancelled' },
          softDelete: false,
          id: { not: id },
        },
      });

      for (const tExam of teacherExams) {
        if (this.isTimeOverlapping(exam.startTime, exam.endTime, tExam.startTime, tExam.endTime)) {
          const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId },
            include: { user: true },
          });
          throw new Error(`Teacher conflict: ${teacher?.user?.firstName || 'Teacher'} is already scheduled as an examiner for "${tExam.title}" during this exam.`);
        }
      }

      // 2. Check if teacher is already assigned as an invigilator for another exam at overlapping time
      const otherInvigilations = await prisma.examInvigilator.findMany({
        where: {
          teacherId,
          exam: {
            examDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { not: 'Cancelled' },
            softDelete: false,
            id: { not: id },
          },
        },
        include: { exam: true },
      });

      for (const inv of otherInvigilations) {
        if (this.isTimeOverlapping(exam.startTime, exam.endTime, inv.exam.startTime, inv.exam.endTime)) {
          const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId },
            include: { user: true },
          });
          throw new Error(`Teacher conflict: ${teacher?.user?.firstName || 'Teacher'} is already assigned as an invigilator for exam "${inv.exam.title}" during this exam.`);
        }
      }
    }

    // Clear existing invigilators and write new ones
    await prisma.examInvigilator.deleteMany({ where: { examId: id } });

    const invigilatorsData = teacherAssignments.map((ta) => ({
      examId: id,
      teacherId: ta.teacherId,
      role: ta.role,
    }));

    await prisma.examInvigilator.createMany({ data: invigilatorsData });

    const invigilators = await prisma.examInvigilator.findMany({
      where: { examId: id },
      include: { teacher: { include: { user: true } } },
    });

    await auditService.log({
      action: 'Invigilators Assigned',
      tableName: 'ExamInvigilator',
      recordId: String(id),
      newValue: { count: invigilators.length, list: teacherAssignments },
      userId,
    });

    notifyExamChange('INVIGILATORS_ASSIGNED', {
      id: exam.id,
      title: exam.title,
      examCode: exam.examCode,
      courseOfferingId: exam.courseOfferingId,
      teacherIds: teacherAssignments.map((t) => t.teacherId),
    });

    return invigilators;
  }

  // Generate Admit Cards (returns a list of student admit cards)
  async generateAdmitCards(id: number, userId?: number): Promise<any[]> {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        courseOffering: {
          include: {
            subject: true,
            program: true,
            enrollments: {
              where: { status: 'Enrolled' },
              include: {
                student: {
                  include: { user: true },
                },
              },
            },
          },
        },
        room: { include: { building: true } },
        seatPlans: true,
      },
    });

    if (!exam || exam.softDelete) {
      throw new Error('Exam not found.');
    }

    const seatMap = new Map(exam.seatPlans.map((sp) => [sp.studentId, sp]));
    const admitCards = exam.courseOffering.enrollments.map((enrollment) => {
      const student = enrollment.student;
      const seatPlan = seatMap.get(student.id);

      // Simple QR Code content generation
      const qrData = JSON.stringify({
        studentId: student.id,
        studentName: student.fullName || `${student.user.firstName} ${student.user.lastName}`,
        registrationNumber: student.registrationNumber,
        rollNumber: student.rollNumber,
        examId: exam.id,
        examCode: exam.examCode,
        subject: exam.courseOffering.subject.name,
        seatNumber: seatPlan?.seatNumber || 'N/A',
      });

      // Quick QR Code image generator link
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

      return {
        id: enrollment.id,
        studentName: student.fullName || `${student.user.firstName} ${student.user.lastName}`,
        registrationNumber: student.registrationNumber,
        rollNumber: student.rollNumber,
        program: exam.courseOffering.program.name,
        subject: exam.courseOffering.subject.name,
        subjectCode: exam.courseOffering.subject.code,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        room: exam.room ? `${exam.room.building.name} - ${exam.room.roomNumber}` : 'N/A',
        seatNumber: seatPlan?.seatNumber || 'Not Generated',
        qrCodeUrl,
      };
    });

    await auditService.log({
      action: 'Admit Cards Generated',
      tableName: 'Exam',
      recordId: String(id),
      newValue: { count: admitCards.length },
      userId,
    });

    notifyExamChange('ADMIT_CARDS_GENERATED', {
      id: exam.id,
      title: exam.title,
      examCode: exam.examCode,
      courseOfferingId: exam.courseOfferingId,
    });

    return admitCards;
  }

  // Get specific Student Exam Schedule (own exams)
  async getStudentExams(studentId: number): Promise<any[]> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'Enrolled' },
          select: { courseOfferingId: true },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found.');
    }

    const courseOfferingIds = student.enrollments.map((e) => e.courseOfferingId);

    const exams = await prisma.exam.findMany({
      where: {
        courseOfferingId: { in: courseOfferingIds },
        softDelete: false,
        status: { not: 'Draft' }, // Students should not see draft exams
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
            program: true,
            teacher: { include: { user: true } },
          },
        },
        subject: true,
        teacher: { include: { user: true } },
        room: { include: { building: true } },
        seatPlans: {
          where: { studentId },
          select: { seatNumber: true, rowNumber: true, columnNumber: true },
        },
      },
      orderBy: { examDate: 'asc' },
    });

    return exams.map((exam) => {
      const seatPlan = exam.seatPlans[0] || null;
      return {
        ...exam,
        allocatedSeat: seatPlan ? seatPlan.seatNumber : 'Not Assigned',
      };
    });
  }

  // Get specific Teacher Exam Schedule (either as examiner or invigilator)
  async getTeacherExams(teacherId: number): Promise<any[]> {
    const exams = await prisma.exam.findMany({
      where: {
        softDelete: false,
        OR: [
          { teacherId },
          { invigilators: { some: { teacherId } } },
        ],
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
            section: true,
            program: true,
          },
        },
        subject: true,
        room: { include: { building: true } },
        invigilators: {
          include: { teacher: { include: { user: true } } },
        },
      },
      orderBy: { examDate: 'asc' },
    });

    return exams.map((exam) => {
      const myInvigilation = exam.invigilators.find((inv) => inv.teacherId === teacherId);
      return {
        ...exam,
        myRole: exam.teacherId === teacherId ? 'Examiner' : (myInvigilation ? `Invigilator (${myInvigilation.role})` : 'Assigned'),
      };
    });
  }

  // Exam Analytics
  async getExamAnalytics(): Promise<any> {
    const allExams = await prisma.exam.findMany({
      where: { softDelete: false },
      include: {
        courseOffering: {
          include: {
            enrollments: { where: { status: 'Enrolled' } },
          },
        },
        room: true,
        invigilators: true,
      },
    });

    // 1. Exam counts by status
    const scheduledCount = allExams.filter((e) => e.status === 'Scheduled').length;
    const completedCount = allExams.filter((e) => e.status === 'Completed').length;
    const draftCount = allExams.filter((e) => e.status === 'Draft').length;
    const cancelledCount = allExams.filter((e) => e.status === 'Cancelled').length;
    const ongoingCount = allExams.filter((e) => e.status === 'Ongoing').length;

    // 2. Room utilization (Count of unique exams scheduled per room)
    const roomBookingCounts: { [roomName: string]: number } = {};
    const rooms = await prisma.room.findMany({ include: { building: true } });
    rooms.forEach((r) => {
      roomBookingCounts[`${r.building.code}-${r.roomNumber}`] = 0;
    });

    allExams.forEach((e) => {
      if (e.roomId && e.status !== 'Cancelled') {
        const matchingRoom = rooms.find((r) => r.id === e.roomId);
        if (matchingRoom) {
          const key = `${matchingRoom.building.code}-${matchingRoom.roomNumber}`;
          roomBookingCounts[key] = (roomBookingCounts[key] || 0) + 1;
        }
      }
    });

    const roomUtilization = Object.entries(roomBookingCounts).map(([room, count]) => ({
      room,
      count,
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    // 3. Student Participation (Total enrolled students taking exams)
    const totalParticipation = allExams.reduce((acc, e) => acc + (e.status !== 'Cancelled' ? e.courseOffering.enrollments.length : 0), 0);

    // 4. Invigilator Workload (Exams assigned to each teacher as invigilator)
    const invigilatorWorkloads: { [teacherName: string]: number } = {};
    const teachers = await prisma.teacher.findMany({ include: { user: true } });
    teachers.forEach((t) => {
      invigilatorWorkloads[`${t.user.firstName} ${t.user.lastName}`] = 0;
    });

    const allInvigilators = await prisma.examInvigilator.findMany({
      where: { exam: { softDelete: false, status: { not: 'Cancelled' } } },
      include: { teacher: { include: { user: true } } },
    });

    allInvigilators.forEach((inv) => {
      const key = `${inv.teacher.user.firstName} ${inv.teacher.user.lastName}`;
      invigilatorWorkloads[key] = (invigilatorWorkloads[key] || 0) + 1;
    });

    const invigilatorWorkload = Object.entries(invigilatorWorkloads).map(([teacher, count]) => ({
      teacher,
      count,
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    // 5. Exam distribution by type
    const distributionCounts: { [type: string]: number } = {
      Midterm: 0,
      Final: 0,
      Practical: 0,
      Viva: 0,
      Makeup: 0,
      Retake: 0,
    };

    allExams.forEach((e) => {
      if (distributionCounts[e.examType] !== undefined) {
        distributionCounts[e.examType]++;
      } else {
        distributionCounts[e.examType] = 1;
      }
    });

    const examDistribution = Object.entries(distributionCounts).map(([type, value]) => ({
      type,
      value,
    }));

    return {
      overview: {
        total: allExams.length,
        scheduled: scheduledCount,
        completed: completedCount,
        ongoing: ongoingCount,
        draft: draftCount,
        cancelled: cancelledCount,
        studentParticipation: totalParticipation,
      },
      roomUtilization,
      invigilatorWorkload,
      examDistribution,
    };
  }

  // Verify Admit Card QR Code content
  async verifyAdmitCard(qrDataStr: string): Promise<any> {
    let payload: any;
    try {
      payload = JSON.parse(qrDataStr);
    } catch (err) {
      throw new Error('Invalid QR Code format. Failed to parse verification payload.');
    }

    const { studentId, examId, examCode, rollNumber, seatNumber } = payload;
    if (!studentId || !examId) {
      throw new Error('Verification failed: Missing vital student or exam identifiers in QR Code.');
    }

    // 1. Fetch exam details
    const exam = await prisma.exam.findFirst({
      where: { id: Number(examId), softDelete: false },
      include: {
        courseOffering: {
          include: {
            subject: true,
            program: true,
            section: true,
          },
        },
        room: { include: { building: true } },
      },
    });

    if (!exam) {
      return {
        verified: false,
        reason: 'The exam specified in this pass does not exist or has been deleted.',
      };
    }

    if (exam.examCode !== examCode) {
      return {
        verified: false,
        reason: `Exam code mismatch. Expected ${exam.examCode} but pass contains ${examCode}.`,
      };
    }

    // 2. Fetch student details and active enrollment in this course offering
    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) },
      include: {
        user: true,
        enrollments: {
          where: { courseOfferingId: exam.courseOfferingId, status: 'Enrolled' },
        },
      },
    });

    if (!student) {
      return {
        verified: false,
        reason: 'Student record associated with this pass could not be found.',
      };
    }

    if (student.enrollments.length === 0) {
      return {
        verified: false,
        reason: `Student ${student.fullName || student.user.firstName} is not actively enrolled in the course offering for this exam.`,
      };
    }

    if (student.rollNumber !== rollNumber) {
      return {
        verified: false,
        reason: `Student roll number mismatch. Expected ${student.rollNumber} but pass contains ${rollNumber}.`,
      };
    }

    // 3. Fetch seat plan details
    const seatPlan = await prisma.examSeatPlan.findFirst({
      where: { examId: Number(examId), studentId: Number(studentId) },
      include: { room: { include: { building: true } } },
    });

    if (!seatPlan) {
      return {
        verified: false,
        reason: 'No official seat plan has been generated or allocated for this candidate.',
      };
    }

    if (seatPlan.seatNumber !== seatNumber) {
      return {
        verified: false,
        reason: `Seat allocation mismatch. Expected seat ${seatPlan.seatNumber} but pass contains ${seatNumber}.`,
      };
    }

    // All checks passed!
    return {
      verified: true,
      message: 'Admit Card verified successfully. Candidate is cleared for examination.',
      details: {
        student: {
          id: student.id,
          fullName: student.fullName || `${student.user.firstName} ${student.user.lastName}`,
          rollNumber: student.rollNumber,
          registrationNumber: student.registrationNumber,
          program: exam.courseOffering.program.name,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          examCode: exam.examCode,
          examType: exam.examType,
          subject: exam.courseOffering.subject.name,
          examDate: exam.examDate,
          startTime: exam.startTime,
          endTime: exam.endTime,
        },
        allocation: {
          room: seatPlan.room ? `${seatPlan.room.building.name} - ${seatPlan.room.roomNumber}` : 'N/A',
          seatNumber: seatPlan.seatNumber,
          row: seatPlan.rowNumber,
          column: seatPlan.columnNumber,
        },
      },
    };
  }
}

export const examService = new ExamService();
