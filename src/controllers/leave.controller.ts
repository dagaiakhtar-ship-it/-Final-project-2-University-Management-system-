import { Request, Response, NextFunction } from 'express';
import { leaveService } from '../services/leave.service';
import { prisma } from '../services/db.service';

export class LeaveController {
  /**
   * Get all leave requests with filters, search, sorting, and pagination
   */
  async getLeaveRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const filters: any = { ...req.query };

      // Role boundaries
      if (user.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!studentProfile) {
          res.status(403).json({ success: false, message: 'Student profile not found.' });
          return;
        }
        filters.applicantType = 'Student';
        filters.studentId = studentProfile.id;
      } else if (user.role === 'TEACHER') {
        // Teacher can see:
        // 1. Their own leaves (if applicantType is Teacher)
        // 2. Student leaves that they can approve (belong to same department or their course offerings)
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile) {
          res.status(403).json({ success: false, message: 'Teacher profile not found.' });
          return;
        }

        const scope = req.query.scope || 'own'; // 'own', 'student', or 'all' for admin

        if (scope === 'own') {
          filters.applicantType = 'Teacher';
          filters.teacherId = teacherProfile.id;
        } else if (scope === 'student') {
          filters.applicantType = 'Student';
          // Limit to students in the teacher's department
          filters.departmentId = teacherProfile.departmentId;
        } else {
          // Default to teacher's own leaves
          filters.applicantType = 'Teacher';
          filters.teacherId = teacherProfile.id;
        }
      } else if (user.role === 'PARENT') {
        res.status(403).json({ success: false, message: 'Forbidden: Parents do not have access to leave requests.' });
        return;
      }

      const result = await leaveService.getLeaveRequests(filters);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch leave requests.' });
    }
  }

  /**
   * Get leave request details
   */
  async getLeaveDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const leave = await leaveService.getLeaveDetails(Number(id));

      // RBAC check
      if (user.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!studentProfile || leave.studentId !== studentProfile.id) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only view your own leave requests.' });
          return;
        }
      } else if (user.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile) {
          res.status(403).json({ success: false, message: 'Teacher profile not found.' });
          return;
        }

        // Teacher can view their own leave, OR any student leave in their department
        const isOwnLeave = leave.teacherId === teacherProfile.id;
        const isStudentInDept = leave.applicantType === 'Student' && leave.departmentId === teacherProfile.departmentId;

        if (!isOwnLeave && !isStudentInDept) {
          res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to view this leave request.' });
          return;
        }
      } else if (user.role === 'PARENT') {
        res.status(403).json({ success: false, message: 'Forbidden: Parents do not have access to leave requests.' });
        return;
      }

      res.status(200).json({ success: true, data: leave });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Leave request not found.' });
    }
  }

  /**
   * Create a new leave request
   */
  async createLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const payload = { ...req.body };

      // Security validation: force applicant details based on authenticated user
      if (user.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!studentProfile) {
          res.status(403).json({ success: false, message: 'Student profile not found.' });
          return;
        }
        payload.applicantType = 'Student';
        payload.studentId = studentProfile.id;
        payload.teacherId = null;
      } else if (user.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile) {
          res.status(403).json({ success: false, message: 'Teacher profile not found.' });
          return;
        }
        payload.applicantType = 'Teacher';
        payload.teacherId = teacherProfile.id;
        payload.studentId = null;
        payload.courseOfferingId = null; // Teachers don't apply for leaves for specific course offerings
      } else if (user.role === 'PARENT') {
        res.status(403).json({ success: false, message: 'Forbidden: Parents cannot create leave requests.' });
        return;
      } else {
        // Admins must specify studentId or teacherId
        if (payload.applicantType === 'Student' && !payload.studentId) {
          res.status(400).json({ success: false, message: 'Student ID is required for student leave request.' });
          return;
        }
        if (payload.applicantType === 'Teacher' && !payload.teacherId) {
          res.status(400).json({ success: false, message: 'Teacher ID is required for teacher leave request.' });
          return;
        }
      }

      const leave = await leaveService.createLeaveRequest(payload, user.email, user.userId);
      res.status(201).json({ success: true, data: leave });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create leave request.' });
    }
  }

  /**
   * Update a leave request (only when PENDING)
   */
  async updateLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const existingLeave = await prisma.leaveRequest.findUnique({
        where: { id: Number(id) }
      });

      if (!existingLeave || existingLeave.deletedAt) {
        res.status(404).json({ success: false, message: 'Leave request not found.' });
        return;
      }

      // Security check: Only the owner or an admin can update PENDING leave
      if (user.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!studentProfile || existingLeave.studentId !== studentProfile.id) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only update your own leave requests.' });
          return;
        }
      } else if (user.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile || existingLeave.teacherId !== teacherProfile.id) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only update your own leave requests.' });
          return;
        }
      } else if (user.role === 'PARENT') {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const updated = await leaveService.updateLeaveRequest(Number(id), req.body, user.email, user.userId);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update leave request.' });
    }
  }

  /**
   * Soft delete a leave request
   */
  async deleteLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const existingLeave = await prisma.leaveRequest.findUnique({
        where: { id: Number(id) }
      });

      if (!existingLeave || existingLeave.deletedAt) {
        res.status(404).json({ success: false, message: 'Leave request not found.' });
        return;
      }

      // Security check: Owner or admin
      if (user.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!studentProfile || existingLeave.studentId !== studentProfile.id) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own leave requests.' });
          return;
        }
      } else if (user.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile || existingLeave.teacherId !== teacherProfile.id) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own leave requests.' });
          return;
        }
      } else if (user.role === 'PARENT') {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const deleted = await leaveService.deleteLeaveRequest(Number(id), user.email, user.userId);
      res.status(200).json({ success: true, data: deleted });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete leave request.' });
    }
  }

  /**
   * Approve a leave request (Admin/SuperAdmin, or Teacher with same department)
   */
  async approveLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const leave = await prisma.leaveRequest.findUnique({
        where: { id: Number(id) }
      });

      if (!leave) {
        res.status(404).json({ success: false, message: 'Leave request not found.' });
        return;
      }

      // RBAC boundary
      if (user.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile) {
          res.status(403).json({ success: false, message: 'Teacher profile not found.' });
          return;
        }

        // Teachers can only approve STUDENT leaves from the SAME department
        if (leave.applicantType !== 'Student' || leave.departmentId !== teacherProfile.departmentId) {
          res.status(403).json({ success: false, message: 'Forbidden: You are only authorized to approve student leaves within your department.' });
          return;
        }
      } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to approve leaves.' });
        return;
      }

      const approved = await leaveService.approveLeaveRequest(Number(id), user.email, user.userId);
      res.status(200).json({ success: true, data: approved });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to approve leave request.' });
    }
  }

  /**
   * Reject a leave request (Admin/SuperAdmin, or Teacher with same department)
   */
  async rejectLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const user = (req as any).user;

      if (!rejectionReason) {
        res.status(400).json({ success: false, message: 'Rejection reason is required.' });
        return;
      }

      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const leave = await prisma.leaveRequest.findUnique({
        where: { id: Number(id) }
      });

      if (!leave) {
        res.status(404).json({ success: false, message: 'Leave request not found.' });
        return;
      }

      // RBAC boundary
      if (user.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile) {
          res.status(403).json({ success: false, message: 'Teacher profile not found.' });
          return;
        }

        if (leave.applicantType !== 'Student' || leave.departmentId !== teacherProfile.departmentId) {
          res.status(403).json({ success: false, message: 'Forbidden: You are only authorized to reject student leaves within your department.' });
          return;
        }
      } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to reject leaves.' });
        return;
      }

      const rejected = await leaveService.rejectLeaveRequest(Number(id), user.email, rejectionReason, user.userId);
      res.status(200).json({ success: true, data: rejected });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to reject leave request.' });
    }
  }

  /**
   * Cancel a leave request (Owner can cancel if PENDING; Admin/SuperAdmin can cancel any)
   */
  async cancelLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const leave = await prisma.leaveRequest.findUnique({
        where: { id: Number(id) }
      });

      if (!leave) {
        res.status(404).json({ success: false, message: 'Leave request not found.' });
        return;
      }

      // RBAC / Ownership boundary
      if (user.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!studentProfile || leave.studentId !== studentProfile.id) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only cancel your own leave requests.' });
          return;
        }
      } else if (user.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile || leave.teacherId !== teacherProfile.id) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only cancel your own leave requests.' });
          return;
        }
      } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const cancelled = await leaveService.cancelLeaveRequest(Number(id), user.email, user.userId);
      res.status(200).json({ success: true, data: cancelled });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to cancel leave request.' });
    }
  }

  /**
   * Get student specific leaves
   */
  async getStudentLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Check access
      if (user.role === 'STUDENT') {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!studentProfile || studentProfile.id !== Number(id)) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only view your own leaves.' });
          return;
        }
      } else if (user.role === 'PARENT') {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const leaves = await leaveService.getStudentLeaves(Number(id));
      res.status(200).json({ success: true, data: leaves });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch student leaves.' });
    }
  }

  /**
   * Get teacher specific leaves
   */
  async getTeacherLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Check access
      if (user.role === 'TEACHER') {
        const teacherProfile = await prisma.teacher.findFirst({
          where: { userId: user.userId, deletedAt: null }
        });
        if (!teacherProfile || teacherProfile.id !== Number(id)) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only view your own leaves.' });
          return;
        }
      } else if (user.role === 'STUDENT' || user.role === 'PARENT') {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const leaves = await leaveService.getTeacherLeaves(Number(id));
      res.status(200).json({ success: true, data: leaves });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch teacher leaves.' });
    }
  }
}

export const leaveController = new LeaveController();
export default leaveController;
