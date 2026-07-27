import { Request, Response, NextFunction } from 'express';
import { attendanceService } from '../services/attendance.service';
import { prisma } from '../services/db.service';

export class AttendanceController {
  /**
   * GET /api/attendance
   * Fetch attendance sessions
   */
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string, 10) : undefined;
      const sectionId = req.query.sectionId ? parseInt(req.query.sectionId as string, 10) : undefined;
      const courseOfferingId = req.query.courseOfferingId ? parseInt(req.query.courseOfferingId as string, 10) : undefined;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const status = req.query.status as string | undefined;

      const sessions = await attendanceService.getSessions({
        teacherId,
        sectionId,
        courseOfferingId,
        date,
        status,
      });

      res.status(200).json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to fetch sessions.' });
    }
  }

  /**
   * GET /api/attendance/:id
   * Fetch specific session with detailed records
   */
  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid session ID.' });
        return;
      }

      const session = await attendanceService.getSessionDetails(id);
      
      // Ownership check for Student role
      const currentUser = (req as any).user;
      if (currentUser && currentUser.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: currentUser.userId, deletedAt: null },
        });
        if (!studentProfile) {
          res.status(403).json({ success: false, message: 'Forbidden: Student profile not found.' });
          return;
        }

        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: studentProfile.id,
            courseOfferingId: session.courseOfferingId,
            status: 'Enrolled',
            deletedAt: null,
          },
        });

        if (!enrollment) {
          res.status(403).json({ success: false, message: 'Forbidden: You are not enrolled in this course offering.' });
          return;
        }

        // Strip other students' record details from the response for privacy!
        // Only return student's own attendance record
        session.attendanceRecords = session.attendanceRecords.filter(
          (rec: any) => rec.student.id === studentProfile.id
        );
      }

      res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Session not found.' });
    }
  }

  /**
   * POST /api/attendance/session
   * Create/Start a new attendance session
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        timetableId,
        courseOfferingId,
        teacherId,
        sectionId,
        roomId,
        attendanceDate,
        startTime,
        endTime,
        attendanceMethod,
        notes,
      } = req.body;

      if (!courseOfferingId || !teacherId || !sectionId || !roomId || !attendanceDate || !startTime || !endTime) {
        res.status(400).json({ success: false, message: 'Missing required session parameters.' });
        return;
      }

      const userId = (req as any).user?.id || 1; // Fallback for safety

      const session = await attendanceService.createSession({
        timetableId: timetableId ? parseInt(timetableId, 10) : undefined,
        courseOfferingId: parseInt(courseOfferingId, 10),
        teacherId: parseInt(teacherId, 10),
        sectionId: parseInt(sectionId, 10),
        roomId: parseInt(roomId, 10),
        attendanceDate: new Date(attendanceDate),
        startTime,
        endTime,
        attendanceMethod,
        notes,
        userId,
      });

      res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create session.' });
    }
  }

  /**
   * POST /api/attendance/mark
   * Mark attendance for a single student
   */
  async markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        attendanceSessionId,
        studentId,
        attendanceStatus,
        remarks,
        arrivalTime,
        editReason,
      } = req.body;

      if (!attendanceSessionId || !studentId || !attendanceStatus) {
        res.status(400).json({ success: false, message: 'Missing required marking parameters.' });
        return;
      }

      const userId = (req as any).user?.id || 1;

      const record = await attendanceService.markAttendance({
        attendanceSessionId: parseInt(attendanceSessionId, 10),
        studentId: parseInt(studentId, 10),
        attendanceStatus,
        remarks,
        arrivalTime,
        userId,
        editReason,
      });

      res.status(200).json({ success: true, data: record });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to mark attendance.' });
    }
  }

  /**
   * POST /api/attendance/bulk
   * Mark attendance in bulk
   */
  async bulkMarkAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attendanceSessionId, records } = req.body;

      if (!attendanceSessionId || !Array.isArray(records)) {
        res.status(400).json({ success: false, message: 'Invalid bulk parameters.' });
        return;
      }

      const userId = (req as any).user?.id || 1;

      const updated = await attendanceService.bulkMarkAttendance({
        attendanceSessionId: parseInt(attendanceSessionId, 10),
        records,
        userId,
      });

      res.status(200).json({ success: true, count: updated.length, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed bulk marking.' });
    }
  }

  /**
   * PUT /api/attendance/:id
   * Update an individual record or session
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid ID.' });
        return;
      }

      const { attendanceStatus, remarks, arrivalTime, editReason, studentId } = req.body;

      const userId = (req as any).user?.id || 1;

      if (studentId) {
        // Assume editing an attendance record where ID is session ID or record ID
        // If studentId is supplied, we edit that record in the session
        const record = await attendanceService.markAttendance({
          attendanceSessionId: id,
          studentId: parseInt(studentId, 10),
          attendanceStatus,
          remarks,
          arrivalTime,
          userId,
          editReason,
        });
        res.status(200).json({ success: true, data: record });
      } else {
        res.status(400).json({ success: false, message: 'Incomplete update parameters.' });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Update failed.' });
    }
  }

  /**
   * DELETE /api/attendance/:id
   * Soft delete a session
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid ID.' });
        return;
      }

      const userId = (req as any).user?.id || 1;
      const deleted = await attendanceService.deleteSession(id, userId);

      res.status(200).json({ success: true, data: deleted });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete.' });
    }
  }

  /**
   * PATCH /api/attendance/lock
   * Lock a session
   */
  async lock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ success: false, message: 'Missing sessionId.' });
        return;
      }

      const userId = (req as any).user?.id || 1;
      const updated = await attendanceService.setLockStatus(parseInt(sessionId, 10), true, userId);

      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to lock.' });
    }
  }

  /**
   * PATCH /api/attendance/unlock
   * Unlock a session
   */
  async unlock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ success: false, message: 'Missing sessionId.' });
        return;
      }

      const userId = (req as any).user?.id || 1;
      const updated = await attendanceService.setLockStatus(parseInt(sessionId, 10), false, userId);

      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to unlock.' });
    }
  }

  /**
   * POST /api/attendance/session/:id/qr
   * Generate QR token for a session
   */
  async generateQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid session ID.' });
        return;
      }

      const expiryMinutes = req.body.expiryMinutes ? parseInt(req.body.expiryMinutes, 10) : 5;
      const tokenInfo = await attendanceService.generateQrToken(id, expiryMinutes);

      res.status(200).json({ success: true, data: tokenInfo });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed QR generation.' });
    }
  }

  /**
   * POST /api/attendance/scan
   * Student scans QR to mark present
   */
  async scanQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { qrToken, studentId } = req.body;

      if (!qrToken || !studentId) {
        res.status(400).json({ success: false, message: 'Missing token or studentId.' });
        return;
      }

      const record = await attendanceService.scanQrCode({
        qrToken,
        studentId: parseInt(studentId, 10),
      });

      res.status(200).json({ success: true, message: 'Checked in successfully!', data: record });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Scan verification failed.' });
    }
  }

  /**
   * GET /api/students/:id/attendance
   */
  async getStudentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = parseInt(req.params.id, 10);
      if (isNaN(studentId)) {
        res.status(400).json({ success: false, message: 'Invalid student ID.' });
        return;
      }

      // Security check for Student role
      const currentUser = (req as any).user;
      if (currentUser && currentUser.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: currentUser.userId, deletedAt: null },
        });
        if (!studentProfile || studentProfile.id !== studentId) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only view your own attendance history.' });
          return;
        }
      }

      const stats = await attendanceService.getStudentAttendance(studentId);
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed student attendance.' });
    }
  }

  /**
   * GET /api/teachers/:id/attendance
   */
  async getTeacherHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = parseInt(req.params.id, 10);
      if (isNaN(teacherId)) {
        res.status(400).json({ success: false, message: 'Invalid teacher ID.' });
        return;
      }

      // Security check for Teacher role
      const currentUser = (req as any).user;
      if (currentUser && currentUser.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: currentUser.userId, deletedAt: null },
        });
        if (!teacherProfile || teacherProfile.id !== teacherId) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only view your own attendance teaching logs.' });
          return;
        }
      }

      const sessions = await attendanceService.getTeacherAttendance(teacherId);
      res.status(200).json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed teacher attendance.' });
    }
  }

  /**
   * GET /api/sections/:id/attendance
   */
  async getSectionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sectionId = parseInt(req.params.id, 10);
      if (isNaN(sectionId)) {
        res.status(400).json({ success: false, message: 'Invalid section ID.' });
        return;
      }

      const sessions = await attendanceService.getSectionAttendance(sectionId);
      res.status(200).json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed section attendance.' });
    }
  }

  /**
   * GET /api/course-offerings/:id/attendance
   */
  async getCourseOfferingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid ID.' });
        return;
      }

      const sessions = await attendanceService.getCourseOfferingAttendance(id);
      res.status(200).json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed course offering attendance.' });
    }
  }

  /**
   * GET /api/attendance/analytics
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseOfferingId = req.query.courseOfferingId ? parseInt(req.query.courseOfferingId as string, 10) : undefined;
      const sectionId = req.query.sectionId ? parseInt(req.query.sectionId as string, 10) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const analytics = await attendanceService.getAnalytics({
        courseOfferingId,
        sectionId,
        startDate,
        endDate,
      });

      res.status(200).json({ success: true, data: analytics });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to get analytics.' });
    }
  }
}

export const attendanceController = new AttendanceController();
export default attendanceController;
