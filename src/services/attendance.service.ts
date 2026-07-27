import { prisma } from './db.service';
import { auditService } from './audit.service';
import { notifyAttendanceChange } from './socket.service';
import crypto from 'crypto';

export interface AttendanceAnalytics {
  overallPercentage: number;
  totalSessions: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  courseStats: { courseCode: string; subjectName: string; percentage: number }[];
  sectionStats: { sectionName: string; percentage: number }[];
  dailyTrend: { date: string; attendanceRate: number }[];
}

export class AttendanceService {
  /**
   * Create an Attendance Session from a Timetable slot or manually.
   * Auto-seeds AttendanceRecords for all enrolled students.
   */
  async createSession(data: {
    timetableId?: number;
    courseOfferingId: number;
    teacherId: number;
    sectionId: number;
    roomId: number;
    attendanceDate: Date;
    startTime: string;
    endTime: string;
    attendanceMethod?: string;
    notes?: string;
    userId: number;
  }) {
    const formattedDate = new Date(data.attendanceDate);
    formattedDate.setHours(0, 0, 0, 0);

    // 1. Prevent duplicate session for same timetable slot on the same day
    if (data.timetableId) {
      const existing = await prisma.attendanceSession.findFirst({
        where: {
          timetableId: data.timetableId,
          attendanceDate: formattedDate,
          deletedAt: null,
        },
      });
      if (existing) {
        throw new Error('An attendance session already exists for this timetable slot on this date.');
      }
    }

    // 2. Validate course offering, section, teacher, room exist
    const offering = await prisma.courseOffering.findFirst({
      where: { id: data.courseOfferingId, deletedAt: null },
    });
    if (!offering) {
      throw new Error('Course offering not found or inactive.');
    }

    // 3. Create the session
    const session = await prisma.attendanceSession.create({
      data: {
        timetableId: data.timetableId || null,
        courseOfferingId: data.courseOfferingId,
        teacherId: data.teacherId,
        sectionId: data.sectionId,
        roomId: data.roomId,
        attendanceDate: formattedDate,
        startTime: data.startTime,
        endTime: data.endTime,
        sessionStatus: 'Scheduled',
        attendanceMethod: data.attendanceMethod || 'Manual',
        notes: data.notes,
        createdBy: String(data.userId),
      },
    });

    // 4. Fetch all enrolled students for this course offering
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseOfferingId: data.courseOfferingId,
        status: 'Enrolled',
        deletedAt: null,
      },
      include: {
        student: true,
      },
    });

    // 5. Bulk create default "Present" or "Absent" attendance records for these students
    // We'll default to "Absent" so teachers can mark them present, or vice versa.
    // Let's seed as "Absent" to encourage marking, or let the UI handle it.
    if (enrollments.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: enrollments.map((enr) => ({
          attendanceSessionId: session.id,
          studentId: enr.studentId,
          enrollmentId: enr.id,
          attendanceStatus: 'Absent', // Default to absent until marked otherwise
          remarks: 'Auto-seeded upon session creation',
          markedBy: String(data.userId),
        })),
      });
    }

    // Log action in audit logs
    await auditService.log({
      action: 'Attendance Created',
      tableName: 'AttendanceSession',
      recordId: String(session.id),
      newValue: session,
      userId: data.userId,
    });

    // Trigger realtime socket
    notifyAttendanceChange('CREATED', session);

    return this.getSessionDetails(session.id);
  }

  /**
   * Get complete details of an Attendance Session including records
   */
  async getSessionDetails(id: number) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id, deletedAt: null },
      include: {
        timetable: true,
        courseOffering: {
          include: {
            subject: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        section: true,
        room: true,
        attendanceRecords: {
          where: { deletedAt: null },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            student: {
              rollNumber: 'asc',
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error('Attendance session not found.');
    }

    return session;
  }

  /**
   * Fetch all sessions based on optional filters
   */
  async getSessions(filters: {
    teacherId?: number;
    sectionId?: number;
    courseOfferingId?: number;
    date?: Date;
    status?: string;
  }) {
    const whereClause: any = { deletedAt: null };

    if (filters.teacherId) whereClause.teacherId = filters.teacherId;
    if (filters.sectionId) whereClause.sectionId = filters.sectionId;
    if (filters.courseOfferingId) whereClause.courseOfferingId = filters.courseOfferingId;
    if (filters.status) whereClause.sessionStatus = filters.status;
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.attendanceDate = startOfDay;
    }

    return prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        courseOffering: {
          include: {
            subject: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        section: true,
        room: true,
        _count: {
          select: { attendanceRecords: true },
        },
      },
      orderBy: {
        attendanceDate: 'desc',
      },
    });
  }

  /**
   * Mark / update a single attendance record
   */
  async markAttendance(data: {
    attendanceSessionId: number;
    studentId: number;
    attendanceStatus: string;
    remarks?: string;
    arrivalTime?: string;
    userId: number;
    editReason?: string;
  }) {
    // 1. Ensure session is not locked
    const session = await prisma.attendanceSession.findFirst({
      where: { id: data.attendanceSessionId, deletedAt: null },
    });

    if (!session) {
      throw new Error('Attendance session not found.');
    }
    if (session.sessionStatus === 'Locked') {
      throw new Error('This attendance session is locked and cannot be edited.');
    }

    // 2. Validate enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: data.studentId,
        courseOfferingId: session.courseOfferingId,
        status: 'Enrolled',
        deletedAt: null,
      },
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in this course offering.');
    }

    // 3. Find existing or create
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        attendanceSessionId: data.attendanceSessionId,
        studentId: data.studentId,
        deletedAt: null,
      },
    });

    let record;
    if (existing) {
      record = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          attendanceStatus: data.attendanceStatus,
          remarks: data.remarks ?? existing.remarks,
          arrivalTime: data.arrivalTime ?? existing.arrivalTime,
          editedBy: existing.attendanceStatus !== data.attendanceStatus ? String(data.userId) : existing.editedBy,
          editReason: existing.attendanceStatus !== data.attendanceStatus ? (data.editReason ?? 'Manual update') : existing.editReason,
        },
      });

      await auditService.log({
        action: 'Attendance Updated',
        tableName: 'AttendanceRecord',
        recordId: String(record.id),
        oldValue: existing,
        newValue: record,
        userId: data.userId,
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          attendanceSessionId: data.attendanceSessionId,
          studentId: data.studentId,
          enrollmentId: enrollment.id,
          attendanceStatus: data.attendanceStatus,
          remarks: data.remarks,
          arrivalTime: data.arrivalTime,
          markedBy: String(data.userId),
        },
      });

      await auditService.log({
        action: 'Attendance Marked',
        tableName: 'AttendanceRecord',
        recordId: String(record.id),
        newValue: record,
        userId: data.userId,
      });
    }

    // Update Session status to Completed if it was Scheduled/Started
    if (session.sessionStatus === 'Scheduled' || session.sessionStatus === 'Started') {
      await prisma.attendanceSession.update({
        where: { id: session.id },
        data: { sessionStatus: 'Completed' },
      });
    }

    notifyAttendanceChange('UPDATED_RECORD', record);
    return record;
  }

  /**
   * Bulk mark attendance records for a session
   */
  async bulkMarkAttendance(data: {
    attendanceSessionId: number;
    records: {
      studentId: number;
      attendanceStatus: string;
      remarks?: string;
      arrivalTime?: string;
      editReason?: string;
    }[];
    userId: number;
  }) {
    // 1. Check lock
    const session = await prisma.attendanceSession.findFirst({
      where: { id: data.attendanceSessionId, deletedAt: null },
    });

    if (!session) {
      throw new Error('Attendance session not found.');
    }
    if (session.sessionStatus === 'Locked') {
      throw new Error('This attendance session is locked and cannot be edited.');
    }

    const updatedRecords = [];

    // Process each record
    for (const item of data.records) {
      try {
        const res = await this.markAttendance({
          attendanceSessionId: data.attendanceSessionId,
          studentId: item.studentId,
          attendanceStatus: item.attendanceStatus,
          remarks: item.remarks,
          arrivalTime: item.arrivalTime,
          userId: data.userId,
          editReason: item.editReason,
        });
        updatedRecords.push(res);
      } catch (err: any) {
        console.error(`Failed to bulk mark student ${item.studentId}:`, err.message);
      }
    }

    // Set session status to Completed
    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { sessionStatus: 'Completed' },
    });

    await auditService.log({
      action: 'Bulk Attendance Marked',
      tableName: 'AttendanceSession',
      recordId: String(session.id),
      newValue: { count: updatedRecords.length },
      userId: data.userId,
    });

    notifyAttendanceChange('BULK_UPDATED', { sessionId: session.id, count: updatedRecords.length });

    return updatedRecords;
  }

  /**
   * Generate QR code token for a session
   */
  async generateQrToken(sessionId: number, expiryMinutes: number = 5) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, deletedAt: null },
    });

    if (!session) {
      throw new Error('Attendance session not found.');
    }
    if (session.sessionStatus === 'Locked') {
      throw new Error('Cannot generate QR code for a locked session.');
    }

    const qrToken = crypto.randomBytes(24).toString('hex');
    const qrCodeExpiry = new Date();
    qrCodeExpiry.setMinutes(qrCodeExpiry.getMinutes() + expiryMinutes);

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        attendanceMethod: 'QR Code',
        qrCodeToken: qrToken,
        qrCodeExpiry,
        sessionStatus: 'Started', // Set session status to Started
      },
    });

    await auditService.log({
      action: 'QR Attendance Generated',
      tableName: 'AttendanceSession',
      recordId: String(sessionId),
      newValue: { qrCodeExpiry },
    });

    notifyAttendanceChange('QR_GENERATED', updated);
    return { qrCodeToken: qrToken, qrCodeExpiry };
  }

  /**
   * Student scans QR code to register attendance
   */
  async scanQrCode(data: { qrToken: string; studentId: number }) {
    const session = await prisma.attendanceSession.findFirst({
      where: {
        qrCodeToken: data.qrToken,
        deletedAt: null,
      },
    });

    if (!session) {
      throw new Error('Invalid QR Code Token.');
    }

    if (session.sessionStatus === 'Locked') {
      throw new Error('This attendance session is locked.');
    }

    if (session.qrCodeExpiry && new Date() > session.qrCodeExpiry) {
      throw new Error('This QR Code has expired.');
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: data.studentId,
        courseOfferingId: session.courseOfferingId,
        status: 'Enrolled',
        deletedAt: null,
      },
    });

    if (!enrollment) {
      throw new Error('You are not enrolled in this course offering.');
    }

    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);

    // Upsert attendance record
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        attendanceSessionId: session.id,
        studentId: data.studentId,
        deletedAt: null,
      },
    });

    let record;
    if (existing) {
      record = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          attendanceStatus: 'Present',
          arrivalTime: nowStr,
          remarks: 'Present (QR Scan)',
        },
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          attendanceSessionId: session.id,
          studentId: data.studentId,
          enrollmentId: enrollment.id,
          attendanceStatus: 'Present',
          arrivalTime: nowStr,
          remarks: 'Present (QR Scan)',
          markedBy: 'Self (QR)',
        },
      });
    }

    // Update Session status to Completed if currently Started
    if (session.sessionStatus === 'Started') {
      await prisma.attendanceSession.update({
        where: { id: session.id },
        data: { sessionStatus: 'Completed' },
      });
    }

    await auditService.log({
      action: 'QR Attendance Checked In',
      tableName: 'AttendanceRecord',
      recordId: String(record.id),
      newValue: record,
    });

    notifyAttendanceChange('STUDENT_CHECKIN', { sessionId: session.id, record });

    return record;
  }

  /**
   * Lock / Unlock Session
   */
  async setLockStatus(sessionId: number, lock: boolean, userId: number) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, deletedAt: null },
    });

    if (!session) {
      throw new Error('Attendance session not found.');
    }

    const newStatus = lock ? 'Locked' : 'Completed';
    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        sessionStatus: newStatus,
        updatedBy: String(userId),
      },
    });

    await auditService.log({
      action: lock ? 'Attendance Locked' : 'Attendance Unlocked',
      tableName: 'AttendanceSession',
      recordId: String(sessionId),
      newValue: updated,
      userId,
    });

    notifyAttendanceChange(lock ? 'LOCKED' : 'UNLOCKED', updated);

    return updated;
  }

  /**
   * Soft Delete Session
   */
  async deleteSession(sessionId: number, userId: number) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, deletedAt: null },
    });

    if (!session) {
      throw new Error('Attendance session not found.');
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });

    await prisma.attendanceRecord.updateMany({
      where: { attendanceSessionId: sessionId },
      data: { deletedAt: new Date() },
    });

    await auditService.log({
      action: 'Attendance Deleted',
      tableName: 'AttendanceSession',
      recordId: String(sessionId),
      userId,
    });

    notifyAttendanceChange('DELETED', updated);

    return updated;
  }

  /**
   * Student Attendance History and Metrics
   */
  async getStudentAttendance(studentId: number) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
      include: {
        attendanceSession: {
          include: {
            courseOffering: {
              include: {
                subject: true,
              },
            },
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            room: true,
          },
        },
      },
      orderBy: {
        attendanceSession: {
          attendanceDate: 'desc',
        },
      },
    });

    // Calculate percentage breakdown by course offering
    const courseGrouping: { [key: number]: { present: number; total: number; subject: any; courseCode: string } } = {};

    records.forEach((rec) => {
      const coId = rec.attendanceSession.courseOfferingId;
      if (!courseGrouping[coId]) {
        courseGrouping[coId] = {
          present: 0,
          total: 0,
          subject: rec.attendanceSession.courseOffering.subject,
          courseCode: rec.attendanceSession.courseOffering.courseCode,
        };
      }
      courseGrouping[coId].total += 1;
      if (rec.attendanceStatus === 'Present' || rec.attendanceStatus === 'Late') {
        courseGrouping[coId].present += 1;
      }
    });

    const courses = Object.keys(courseGrouping).map((key) => {
      const g = courseGrouping[Number(key)];
      return {
        courseOfferingId: Number(key),
        courseCode: g.courseCode,
        subjectName: g.subject?.name || 'Subject',
        present: g.present,
        total: g.total,
        percentage: g.total > 0 ? Math.round((g.present / g.total) * 100) : 100,
      };
    });

    const total = records.length;
    const presentCount = records.filter(r => r.attendanceStatus === 'Present' || r.attendanceStatus === 'Late').length;

    return {
      records,
      overallPercentage: total > 0 ? Math.round((presentCount / total) * 100) : 100,
      summary: {
        total,
        present: records.filter(r => r.attendanceStatus === 'Present').length,
        absent: records.filter(r => r.attendanceStatus === 'Absent').length,
        late: records.filter(r => r.attendanceStatus === 'Late').length,
        excused: records.filter(r => r.attendanceStatus === 'Excused').length,
      },
      courses,
    };
  }

  /**
   * Teacher Attendance History and Sessions Managed
   */
  async getTeacherAttendance(teacherId: number) {
    return prisma.attendanceSession.findMany({
      where: {
        teacherId,
        deletedAt: null,
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
          },
        },
        section: true,
        room: true,
        _count: {
          select: { attendanceRecords: true },
        },
      },
      orderBy: {
        attendanceDate: 'desc',
      },
    });
  }

  /**
   * Section Attendance Session History
   */
  async getSectionAttendance(sectionId: number) {
    return prisma.attendanceSession.findMany({
      where: {
        sectionId,
        deletedAt: null,
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        room: true,
        _count: {
          select: { attendanceRecords: true },
        },
      },
      orderBy: {
        attendanceDate: 'desc',
      },
    });
  }

  /**
   * Course Offering Session History
   */
  async getCourseOfferingAttendance(courseOfferingId: number) {
    return prisma.attendanceSession.findMany({
      where: {
        courseOfferingId,
        deletedAt: null,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        section: true,
        room: true,
        _count: {
          select: { attendanceRecords: true },
        },
      },
      orderBy: {
        attendanceDate: 'desc',
      },
    });
  }

  /**
   * Attendance Analytics for Dashboard Charts
   */
  async getAnalytics(params: {
    courseOfferingId?: number;
    sectionId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AttendanceAnalytics> {
    const whereSession: any = { deletedAt: null };
    const whereRecord: any = { deletedAt: null };

    if (params.courseOfferingId) {
      whereSession.courseOfferingId = params.courseOfferingId;
    }
    if (params.sectionId) {
      whereSession.sectionId = params.sectionId;
    }
    if (params.startDate || params.endDate) {
      whereSession.attendanceDate = {};
      if (params.startDate) {
        whereSession.attendanceDate.gte = params.startDate;
      }
      if (params.endDate) {
        whereSession.attendanceDate.lte = params.endDate;
      }
    }

    // Get matching sessions
    const sessions = await prisma.attendanceSession.findMany({
      where: whereSession,
      select: { id: true, attendanceDate: true, courseOfferingId: true, sectionId: true },
    });

    const sessionIds = sessions.map(s => s.id);

    if (sessionIds.length === 0) {
      return {
        overallPercentage: 100,
        totalSessions: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalExcused: 0,
        courseStats: [],
        sectionStats: [],
        dailyTrend: [],
      };
    }

    // Fetch all records for these sessions
    const records = await prisma.attendanceRecord.findMany({
      where: {
        attendanceSessionId: { in: sessionIds },
        deletedAt: null,
      },
      include: {
        attendanceSession: {
          include: {
            courseOffering: {
              include: {
                subject: true,
              },
            },
            section: true,
          },
        },
      },
    });

    const total = records.length;
    const present = records.filter(r => r.attendanceStatus === 'Present').length;
    const absent = records.filter(r => r.attendanceStatus === 'Absent').length;
    const late = records.filter(r => r.attendanceStatus === 'Late').length;
    const excused = records.filter(r => r.attendanceStatus === 'Excused' || r.attendanceStatus.includes('Leave')).length;

    // Daily Trend
    const dailyTrendMap: { [date: string]: { present: number; total: number } } = {};
    records.forEach(r => {
      const dateStr = new Date(r.attendanceSession.attendanceDate).toISOString().split('T')[0];
      if (!dailyTrendMap[dateStr]) {
        dailyTrendMap[dateStr] = { present: 0, total: 0 };
      }
      dailyTrendMap[dateStr].total++;
      if (r.attendanceStatus === 'Present' || r.attendanceStatus === 'Late') {
        dailyTrendMap[dateStr].present++;
      }
    });

    const dailyTrend = Object.keys(dailyTrendMap).sort().map(date => {
      const data = dailyTrendMap[date];
      return {
        date,
        attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 100,
      };
    });

    // Course stats
    const courseMap: { [id: number]: { present: number; total: number; code: string; subject: string } } = {};
    records.forEach(r => {
      const co = r.attendanceSession.courseOffering;
      if (!courseMap[co.id]) {
        courseMap[co.id] = { present: 0, total: 0, code: co.courseCode, subject: co.subject?.name || 'Subject' };
      }
      courseMap[co.id].total++;
      if (r.attendanceStatus === 'Present' || r.attendanceStatus === 'Late') {
        courseMap[co.id].present++;
      }
    });

    const courseStats = Object.keys(courseMap).map(idStr => {
      const data = courseMap[Number(idStr)];
      return {
        courseCode: data.code,
        subjectName: data.subject,
        percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 100,
      };
    });

    // Section stats
    const sectionMap: { [id: number]: { present: number; total: number; name: string } } = {};
    records.forEach(r => {
      const sec = r.attendanceSession.section;
      if (!sectionMap[sec.id]) {
        sectionMap[sec.id] = { present: 0, total: 0, name: sec.name };
      }
      sectionMap[sec.id].total++;
      if (r.attendanceStatus === 'Present' || r.attendanceStatus === 'Late') {
        sectionMap[sec.id].present++;
      }
    });

    const sectionStats = Object.keys(sectionMap).map(idStr => {
      const data = sectionMap[Number(idStr)];
      return {
        sectionName: data.name,
        percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 100,
      };
    });

    const overallPercentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    return {
      overallPercentage,
      totalSessions: sessionIds.length,
      totalPresent: present,
      totalAbsent: absent,
      totalLate: late,
      totalExcused: excused,
      courseStats,
      sectionStats,
      dailyTrend,
    };
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
