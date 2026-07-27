import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/db.service';
import { degreeAuditService } from '../services/degree-audit.service';

export class DegreeAuditController {
  /**
   * Helper to verify if the requesting user owns the student record or has staff permissions
   */
  private async authorizeStudentOrStaff(req: Request, studentId: number): Promise<boolean> {
    const user = (req as any).user;
    if (!user) return false;

    // Staff roles have full access
    if (['SUPER_ADMIN', 'ADMIN', 'REGISTRAR', 'TEACHER'].includes(user.role)) {
      return true;
    }

    // Students can only access their own record
    if (user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: user.userId },
      });
      if (!student) return false;
      if (studentId === 0 || student.id === studentId) {
        return true;
      }
    }

    return false;
  }

  // 1. GET /api/degree-audit
  async getDegreeAudits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, programId, graduationStatus } = req.query;
      const user = (req as any).user;

      const whereClause: any = {};
      if (departmentId) whereClause.student = { departmentId: Number(departmentId) };
      if (programId) whereClause.student = { ...whereClause.student, programId: Number(programId) };
      if (graduationStatus) whereClause.graduationStatus = String(graduationStatus);

      // If user is a student, restrict to their own audit only
      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student) {
          res.status(403).json({ error: 'Student profile not found.' });
          return;
        }
        whereClause.studentId = student.id;
      }

      const audits = await prisma.degreeAudit.findMany({
        where: whereClause,
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
              department: true,
              program: true,
            },
          },
          degreeRequirement: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      res.status(200).json(audits);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 2. GET /api/degree-audit/:studentId
  async getDegreeAuditByStudentId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let studentId = Number(req.params.studentId);
      const user = (req as any).user;

      if (!studentId || studentId === 0) {
        if (user?.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: user.userId },
          });
          if (!student) {
            res.status(403).json({ error: 'Student profile not found.' });
            return;
          }
          studentId = student.id;
        } else {
          const firstStudent = await prisma.student.findFirst({ orderBy: { id: 'asc' } });
          if (!firstStudent) {
            res.status(404).json({ error: 'No students found.' });
            return;
          }
          studentId = firstStudent.id;
        }
      }

      const isAuthorized = await this.authorizeStudentOrStaff(req, studentId);
      if (!isAuthorized) {
        res.status(403).json({ error: 'Access denied. You can only view your own degree audit.' });
        return;
      }

      // Automatically run or fetch the latest degree audit to ensure fresh results
      const audit = await degreeAuditService.runDegreeAudit(studentId);
      res.status(200).json(audit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 3. POST /api/degree-audit/run
  async runDegreeAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = Number(req.body.studentId);
      if (!studentId) {
        res.status(400).json({ error: 'studentId is required in the body.' });
        return;
      }

      const isAuthorized = await this.authorizeStudentOrStaff(req, studentId);
      if (!isAuthorized) {
        res.status(403).json({ error: 'Access denied. You can only run your own degree audit.' });
        return;
      }

      const audit = await degreeAuditService.runDegreeAudit(studentId);
      res.status(200).json(audit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 4. POST /api/degree-audit/simulate
  async simulateWhatIf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId, simulatedSubjectIds } = req.body;
      const targetStudentId = Number(studentId);

      if (!targetStudentId || !Array.isArray(simulatedSubjectIds)) {
        res.status(400).json({ error: 'studentId and simulatedSubjectIds array are required.' });
        return;
      }

      const isAuthorized = await this.authorizeStudentOrStaff(req, targetStudentId);
      if (!isAuthorized) {
        res.status(403).json({ error: 'Access denied. You can only run simulation for your own profile.' });
        return;
      }

      const simulation = await degreeAuditService.simulateWhatIf(targetStudentId, simulatedSubjectIds.map(Number));
      res.status(200).json(simulation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 5. GET /api/graduation-applications
  async getGraduationApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { status } = req.query;

      let studentId: number | undefined;

      // Students can only view their own applications
      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student) {
          res.status(403).json({ error: 'Student profile not found.' });
          return;
        }
        studentId = student.id;
      }

      const apps = await degreeAuditService.listGraduationApplications({
        studentId,
        status: status ? String(status) : undefined,
      });

      res.status(200).json(apps);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 6. POST /api/graduation-applications
  async createGraduationApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { graduationTerm, graduationYear, studentId } = req.body;

      let targetStudentId = Number(studentId);

      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student) {
          res.status(403).json({ error: 'Student profile not found.' });
          return;
        }
        targetStudentId = student.id;
      }

      if (!targetStudentId || !graduationTerm || !graduationYear) {
        res.status(400).json({ error: 'graduationTerm, graduationYear, and studentId are required.' });
        return;
      }

      const app = await degreeAuditService.createGraduationApplication({
        studentId: targetStudentId,
        graduationTerm: String(graduationTerm),
        graduationYear: Number(graduationYear),
      });

      res.status(201).json(app);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 7. PUT /api/graduation-applications/:id
  async updateGraduationApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { status, remarks } = req.body;
      const user = (req as any).user;

      const reviewerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System';

      const app = await degreeAuditService.updateGraduationApplication(id, status, remarks, reviewerName);
      res.status(200).json(app);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 8. PATCH /api/graduation-applications/:id/approve
  async approveGraduationApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { remarks, finalizeGraduation } = req.body;
      const user = (req as any).user;

      // Only Admin, Super Admin, and Registrar can approve
      if (user && !['SUPER_ADMIN', 'ADMIN', 'REGISTRAR'].includes(user.role)) {
        res.status(403).json({ error: 'Access denied. Only registrars and administrators can approve graduation.' });
        return;
      }

      const reviewerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System';

      // If registrar decides to directly set status to 'Graduated' or 'Approved'
      const finalStatus = finalizeGraduation ? 'Graduated' : 'Approved';

      const app = await degreeAuditService.updateGraduationApplication(id, finalStatus, remarks, reviewerName);
      res.status(200).json(app);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 9. PATCH /api/graduation-applications/:id/reject
  async rejectGraduationApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { remarks } = req.body;
      const user = (req as any).user;

      // Only Admin, Super Admin, and Registrar can reject
      if (user && !['SUPER_ADMIN', 'ADMIN', 'REGISTRAR'].includes(user.role)) {
        res.status(403).json({ error: 'Access denied. Only registrars and administrators can reject graduation.' });
        return;
      }

      const reviewerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System';

      const app = await degreeAuditService.updateGraduationApplication(id, 'Rejected', remarks, reviewerName);
      res.status(200).json(app);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 10. PATCH /api/graduation-applications/:id/withdraw
  async withdrawGraduationApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const app = await prisma.graduationApplication.findUnique({
        where: { id },
        include: { student: true }
      });

      if (!app) {
        res.status(404).json({ error: 'Graduation application not found.' });
        return;
      }

      // If student, verify they own this application
      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student || app.studentId !== student.id) {
          res.status(403).json({ error: 'Access denied. You can only withdraw your own applications.' });
          return;
        }
      }

      const updated = await degreeAuditService.updateGraduationApplication(
        id,
        'Withdrawn',
        'Withdrawn by student',
        user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System'
      );
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const degreeAuditController = new DegreeAuditController();
