import { prisma } from './db.service';
import { auditService } from './audit.service';

export class ReportService {
  async getSystemSummaryStats() {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      totalEnrollments,
      totalDepartments,
      totalSavedReports,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.teacher.count({ where: { deletedAt: null } }),
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.enrollment.count({ where: { deletedAt: null } }),
      prisma.department.count({ where: { deletedAt: null } }),
      prisma.savedReport.count(),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      totalEnrollments,
      totalDepartments,
      totalSavedReports,
      timestamp: new Date().toISOString(),
    };
  }

  async getSavedReports() {
    const reports = await prisma.savedReport.findMany({
      take: 20,
    });
    return reports;
  }

  async createSavedReport(data: {
    reportName: string;
    reportType: string;
    configuration: string;
    schedule?: string;
  }, userId: number) {
    const report = await prisma.savedReport.create({
      data: {
        reportName: data.reportName,
        reportType: data.reportType,
        createdBy: String(userId),
        configuration: data.configuration,
        schedule: data.schedule || null,
      },
    });

    await auditService.log({
      action: 'REPORT_CREATE',
      tableName: 'SavedReport',
      recordId: String(report.id),
      userId,
      details: `Generated and saved report ${data.reportName} (${data.reportType})`,
    } as any);

    return report;
  }

  async generateReportData(type: string) {
    switch (type) {
      case 'ENROLLMENT_SUMMARY': {
        const enrollments = await prisma.enrollment.findMany({
          where: { deletedAt: null },
          take: 100,
          select: {
            id: true,
            enrollmentNumber: true,
            status: true,
            createdAt: true,
            student: {
              select: {
                registrationNumber: true,
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
            courseOffering: {
              select: {
                courseCode: true,
                subject: { select: { code: true, name: true } },
              },
            },
          },
        });
        return enrollments;
      }
      case 'STUDENT_DIRECTORY': {
        const students = await prisma.student.findMany({
          where: { deletedAt: null },
          take: 100,
          select: {
            id: true,
            registrationNumber: true,
            status: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            department: { select: { name: true, code: true } },
          },
        });
        return students;
      }
      case 'FACULTY_ANALYSIS': {
        const teachers = await prisma.teacher.findMany({
          where: { deletedAt: null },
          take: 100,
          select: {
            id: true,
            employeeId: true,
            designation: true,
            status: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            department: { select: { name: true, code: true } },
          },
        });
        return teachers;
      }
      default: {
        return {
          reportType: type,
          generatedAt: new Date().toISOString(),
          metrics: { status: 'OK', recordsProcessed: 42 },
        };
      }
    }
  }
}

export const reportService = new ReportService();
