import { Request, Response, NextFunction } from 'express';
import { assignmentService } from '../services/assignment.service';
import { assignmentRepository } from '../repositories/assignment.repository';
import { prisma } from '../services/db.service';

export class AssignmentController {
  // 1. Get assignments list with search, sorting, pagination, and role filters
  async getAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        search,
        courseOfferingId,
        teacherId,
        studentId,
        visibilityStatus,
        assignmentType,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      let filterTeacherId = teacherId ? parseInt(teacherId as string) : undefined;
      let filterStudentId = studentId ? parseInt(studentId as string) : undefined;
      let filterCourseOfferingId = courseOfferingId ? parseInt(courseOfferingId as string) : undefined;

      // Automatically apply role restrictions if not Admin/SuperAdmin
      const user = req.user;
      if (user) {
        if (user.role === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: user.userId },
          });
          if (teacher) {
            filterTeacherId = teacher.id;
          }
        } else if (user.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (student) {
            filterStudentId = student.id;
          }
        }
      }

      const assignments = await assignmentRepository.findAll({
        search: search as string,
        courseOfferingId: filterCourseOfferingId,
        teacherId: filterTeacherId,
        studentId: filterStudentId,
        visibilityStatus: visibilityStatus as string,
        assignmentType: assignmentType as string,
        skip,
        take,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      const total = await assignmentRepository.count({
        search: search as string,
        courseOfferingId: filterCourseOfferingId,
        teacherId: filterTeacherId,
        studentId: filterStudentId,
        visibilityStatus: visibilityStatus as string,
        assignmentType: assignmentType as string,
      });

      res.json({
        success: true,
        data: assignments,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Get single assignment details
  async getAssignmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid assignment ID' });
        return;
      }

      const assignment = await assignmentRepository.findById(id);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }

      const user = req.user;
      if (user) {
        if (user.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (!student) {
            res.status(403).json({ success: false, message: 'Forbidden: Student profile not found' });
            return;
          }
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              studentId: student.id,
              courseOfferingId: assignment.courseOfferingId,
              status: 'Enrolled',
            },
          });
          if (!enrollment) {
            res.status(403).json({ success: false, message: 'Forbidden: You are not enrolled in this course.' });
            return;
          }
          if (assignment.visibilityStatus !== 'Published') {
            res.status(403).json({ success: false, message: 'Forbidden: Assignment is not published yet.' });
            return;
          }
        } else if (user.role === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: user.userId },
          });
          if (!teacher || assignment.courseOffering.teacherId !== teacher.id) {
            res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this course.' });
            return;
          }
        }
      }

      res.json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }

  // 3. Create assignment
  async createAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const assignment = await assignmentService.createAssignment(req.body, req.user.userId, req.user.role);
      res.status(201).json({ success: true, data: assignment, message: 'Assignment created successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 4. Update assignment
  async updateAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid assignment ID' });
        return;
      }

      const assignment = await assignmentService.updateAssignment(id, req.body, req.user.userId, req.user.role);
      res.json({ success: true, data: assignment, message: 'Assignment updated successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 5. Delete assignment (soft delete)
  async deleteAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid assignment ID' });
        return;
      }

      await assignmentService.deleteAssignment(id, req.user.userId, req.user.role);
      res.json({ success: true, message: 'Assignment deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 6. Publish assignment
  async publishAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid assignment ID' });
        return;
      }

      const assignment = await assignmentService.publishAssignment(id, req.user.userId, req.user.role);
      res.json({ success: true, data: assignment, message: 'Assignment published successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 7. Archive assignment
  async archiveAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid assignment ID' });
        return;
      }

      const assignment = await assignmentService.archiveAssignment(id, req.user.userId, req.user.role);
      res.json({ success: true, data: assignment, message: 'Assignment archived successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 8. Submit assignment (Student attempt creation)
  async createSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const assignmentId = parseInt(req.params.id);
      if (isNaN(assignmentId)) {
        res.status(400).json({ success: false, message: 'Invalid assignment ID' });
        return;
      }

      const submission = await assignmentService.submitAssignment(assignmentId, req.body, req.user.userId);
      res.status(201).json({ success: true, data: submission, message: 'Submission saved successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 9. Get student submissions for a specific assignment
  async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assignmentId, studentId, enrollmentId, submissionStatus, page = '1', limit = '10' } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const routeId = parseInt(req.params.id);
      let targetAssignmentId = assignmentId ? parseInt(assignmentId as string) : undefined;
      // Fallback from route id if not hardcoded / default to 1 on UI
      if (!targetAssignmentId && !isNaN(routeId) && routeId !== 1) {
        targetAssignmentId = routeId;
      }

      let filterTeacherId: number | undefined = undefined;
      let filterStudentId: number | undefined = undefined;

      const user = req.user;
      if (user) {
        if (user.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (!student) {
            res.status(403).json({ success: false, message: 'Student profile not found.' });
            return;
          }
          filterStudentId = student.id;
        } else if (user.role === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: user.userId },
          });
          if (!teacher) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
          }

          if (targetAssignmentId) {
            const assignment = await prisma.assignment.findFirst({
              where: { id: targetAssignmentId, softDelete: false },
            });
            if (assignment && assignment.teacherId !== teacher.id) {
              res.status(403).json({ success: false, message: 'Forbidden: You can only view submissions for your own assignments.' });
              return;
            }
          } else {
            filterTeacherId = teacher.id;
          }
        }
      }

      const submissions = await assignmentRepository.findSubmissions({
        assignmentId: targetAssignmentId,
        studentId: filterStudentId || (studentId ? parseInt(studentId as string) : undefined),
        enrollmentId: enrollmentId ? parseInt(enrollmentId as string) : undefined,
        teacherId: filterTeacherId,
        submissionStatus: submissionStatus as string,
        skip,
        take,
      });

      const total = await assignmentRepository.countSubmissions({
        assignmentId: targetAssignmentId,
        studentId: filterStudentId || (studentId ? parseInt(studentId as string) : undefined),
        enrollmentId: enrollmentId ? parseInt(enrollmentId as string) : undefined,
        teacherId: filterTeacherId,
        submissionStatus: submissionStatus as string,
      });

      res.json({
        success: true,
        data: submissions,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 10. Get single submission details
  async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid submission ID' });
        return;
      }

      const submission = await assignmentRepository.findSubmissionById(id);
      if (!submission) {
        res.status(404).json({ success: false, message: 'Submission not found' });
        return;
      }

      const user = req.user;
      if (user) {
        if (user.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (!student || submission.studentId !== student.id) {
            res.status(403).json({ success: false, message: 'Forbidden: You can only view your own submissions.' });
            return;
          }
        } else if (user.role === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: user.userId },
          });
          if (!teacher || submission.assignment.teacherId !== teacher.id) {
            res.status(403).json({ success: false, message: 'Forbidden: You can only view submissions for your assigned courses.' });
            return;
          }
        }
      }

      res.json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  }

  // 11. Grade or return submission
  async gradeSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const submissionId = parseInt(req.params.id);
      if (isNaN(submissionId)) {
        res.status(400).json({ success: false, message: 'Invalid submission ID' });
        return;
      }

      const submission = await assignmentService.gradeSubmission(submissionId, req.body, req.user.userId);
      res.json({ success: true, data: submission, message: 'Submission graded successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 12. Update submission details (e.g. modify draft attachments)
  async updateSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const submissionId = parseInt(req.params.id);
      if (isNaN(submissionId)) {
        res.status(400).json({ success: false, message: 'Invalid submission ID' });
        return;
      }

      const submission = await assignmentRepository.findSubmissionById(submissionId);
      if (!submission) {
        res.status(404).json({ success: false, message: 'Submission not found' });
        return;
      }

      // Check if student profile matches this user
      const student = await prisma.student.findFirst({
        where: { userId: req.user.userId },
      });
      if (!student || submission.studentId !== student.id) {
        res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own submissions' });
        return;
      }

      if (submission.submissionStatus !== 'Draft') {
        res.status(400).json({ success: false, message: 'Cannot edit an already finalized submission' });
        return;
      }

      const updated = await assignmentRepository.updateSubmission(submissionId, {
        attachments: req.body.attachments ? String(req.body.attachments) : submission.attachments,
        submissionStatus: req.body.isDraft === false ? 'Submitted' : 'Draft',
        submittedAt: new Date(),
      });

      res.json({ success: true, data: updated, message: 'Draft updated successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 13. Get student assignments by studentId parameter
  async getStudentAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        res.status(400).json({ success: false, message: 'Invalid student ID' });
        return;
      }

      const user = req.user;
      if (user && user.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student || student.id !== studentId) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only view your own assignments.' });
          return;
        }
      }

      const assignments = await assignmentRepository.findAll({
        studentId,
        visibilityStatus: 'Published',
      });

      res.json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }

  // 14. Get teacher assignments by teacherId parameter
  async getTeacherAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = parseInt(req.params.id);
      if (isNaN(teacherId)) {
        res.status(400).json({ success: false, message: 'Invalid teacher ID' });
        return;
      }

      const user = req.user;
      if (user && user.role === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: user.userId },
        });
        if (!teacher || teacher.id !== teacherId) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only view your own assignments.' });
          return;
        }
      }

      const assignments = await assignmentRepository.findAll({
        teacherId,
      });

      res.json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }

  // 15. Get analytics and grade distribution for an assignment
  async getAssignmentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid assignment ID' });
        return;
      }

      const analytics = await assignmentService.getAssignmentAnalytics(id, req.user.userId, req.user.role);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const assignmentController = new AssignmentController();
export default assignmentController;
