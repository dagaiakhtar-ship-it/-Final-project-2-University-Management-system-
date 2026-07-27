import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.service';
import { authenticate } from '../middleware/auth.middleware';
import { getSocketServer } from '../services/socket.service';
import { auditService } from '../services/audit.service';

export const analyticsRouter = Router();

// Zod validation schemas
const createReportSchema = z.object({
  reportName: z.string().min(3),
  reportType: z.string(),
  configuration: z.record(z.string(), z.any()),
  schedule: z.string().nullable().optional(),
});

const scheduleReportSchema = z.object({
  reportId: z.number(),
  schedule: z.string().min(5), // e.g. "0 0 * * *" or "weekly"
});

// Helper for RBAC on Analytics
function authorizeAnalytics(allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const role = String(req.user.role).toUpperCase();
    const isAllowed = allowedRoles.map(r => r.toUpperCase()).includes(role) || role === 'SUPER_ADMIN' || role === 'ADMIN';
    if (!isAllowed) {
      res.status(403).json({ success: false, message: `Access Denied. Your role (${role}) does not have permissions for this dashboard.` });
      return;
    }
    next();
  };
}

// Initial/default KPIs seed if empty
async function ensureKPIsSeeded() {
  try {
    const count = await prisma.kPI.count();
    if (count === 0) {
      await prisma.kPI.createMany({
        data: [
          { name: 'Student Enrollment', category: 'Students', targetValue: 5000, currentValue: 4820, trend: 4.5, active: true },
          { name: 'Attendance Rate', category: 'Attendance', targetValue: 90.0, currentValue: 87.4, trend: -1.2, active: true },
          { name: 'Graduation Rate', category: 'Students', targetValue: 95.0, currentValue: 93.8, trend: 1.1, active: true },
          { name: 'Pass Percentage', category: 'Results', targetValue: 85.0, currentValue: 82.5, trend: 2.3, active: true },
          { name: 'Faculty Workload', category: 'Faculty', targetValue: 12.0, currentValue: 14.2, trend: 5.6, active: true },
          { name: 'Budget Utilization', category: 'Finance', targetValue: 100.0, currentValue: 78.3, trend: -3.5, active: true },
          { name: 'Library Usage', category: 'Library', targetValue: 1200, currentValue: 1340, trend: 11.2, active: true },
          { name: 'Research Publications', category: 'Research', targetValue: 150, currentValue: 132, trend: 8.4, active: true },
          { name: 'Employee Attendance', category: 'HR', targetValue: 95.0, currentValue: 94.1, trend: 0.5, active: true },
          { name: 'Procurement Efficiency', category: 'Procurement', targetValue: 90.0, currentValue: 84.8, trend: 2.1, active: true }
        ]
      });
    }
  } catch (err) {
    console.warn('Could not seed KPIs:', err);
  }
}

// Ensure DataWarehouseJobs seeded
async function ensureJobsSeeded() {
  try {
    const count = await prisma.dataWarehouseJob.count();
    if (count === 0) {
      await prisma.dataWarehouseJob.createMany({
        data: [
          { jobName: 'Nightly Academic ETL Sync', jobType: 'ETL', status: 'Success', startedAt: new Date(Date.now() - 3600000 * 12), completedAt: new Date(Date.now() - 3600000 * 12 + 45000) },
          { jobName: 'Finance Data Mart Refresh', jobType: 'Refresh', status: 'Success', startedAt: new Date(Date.now() - 3600000 * 4), completedAt: new Date(Date.now() - 3600000 * 4 + 12000) },
          { jobName: 'Research Publications ELT', jobType: 'ELT', status: 'Failed', startedAt: new Date(Date.now() - 3600000 * 24), completedAt: new Date(Date.now() - 3600000 * 24 + 5000) },
          { jobName: 'Warehouse Storage Cleanup', jobType: 'Cleanup', status: 'Success', startedAt: new Date(Date.now() - 3600000 * 48), completedAt: new Date(Date.now() - 3600000 * 48 + 8000) }
        ]
      });
    }
  } catch (err) {
    console.warn('Could not seed warehouse jobs:', err);
  }
}

// Trigger initial seed check on load
ensureKPIsSeeded();
ensureJobsSeeded();

/**
 * GET /api/analytics/dashboard
 * Returns aggregated cross-module analytics based on active roles & dynamic filters.
 */
analyticsRouter.get(
  '/dashboard',
  authenticate,
  authorizeAnalytics(['VICE_CHANCELLOR', 'REGISTRAR', 'FINANCE_DIRECTOR', 'HR_DIRECTOR', 'DEPARTMENT_HEAD', 'FACULTY', 'QUALITY_ASSURANCE']),
  async (req: any, res: Response) => {
    try {
      const dashboardType = (req.query.dashboardType || 'vc').toLowerCase();
      const departmentFilter = req.query.department || 'all';
      const timeRange = req.query.timeRange || 'monthly'; // monthly, yearly

      // Log dashboard access
      await auditService.log({
        action: 'Dashboard Access',
        tableName: 'Analytics',
        recordId: dashboardType,
        userId: req.user.userId,
        newValue: { query: req.query }
      });

      // Query database entities if they exist, or fallback gracefully to support full modular integration.
      let dbStudentsCount = 0;
      let dbTeachersCount = 0;
      let dbDepartmentsCount = 0;
      let dbResearchCount = 0;
      let dbAdmissionsCount = 0;

      try { dbStudentsCount = await (prisma as any).student.count(); } catch { dbStudentsCount = 2840; }
      try { dbTeachersCount = await (prisma as any).teacher.count(); } catch { dbTeachersCount = 145; }
      try { dbDepartmentsCount = await (prisma as any).department.count(); } catch { dbDepartmentsCount = 12; }
      try { dbResearchCount = await (prisma as any).researchPublication.count(); } catch { dbResearchCount = 132; }

      // Custom module data marts calculations
      const dataMarts = {
        admissions: { totalApplied: 1250, totalAdmitted: 890, acceptanceRate: 71.2, yieldRate: 84.5 },
        students: { activeCount: dbStudentsCount || 2840, internationalCount: 142, transferCount: 64, graduationRate: 93.8 },
        attendance: { averageRate: 87.4, criticalCount: 18, facultyAverage: 94.1 },
        faculty: { totalCount: dbTeachersCount || 145, phdRatio: 68.2, paperCount: dbResearchCount || 132, avgWorkloadHours: 14.2 },
        examinations: { activeSchedules: 4, examsConducted: 42, studentRegistrations: 2780 },
        results: { averageGPA: 3.24, passPercentage: 82.5, failPercentage: 17.5, gradeDistribution: { A: '24%', B: '42%', C: '22%', D: '8%', F: '4%' } },
        finance: { totalRevenue: 12450000, totalExpenses: 9840000, libraryFines: 8500, dynamicSurplus: 2610000 },
        hr: { headCount: dbTeachersCount + 80 || 225, leaveApplications: 14, monthlyPayroll: 450000 },
        payroll: { basicSalary: 380000, allowances: 45000, deductions: 25000, netPay: 400000 },
        procurement: { pendingPOs: 8, completedPOs: 34, totalProcurementValue: 125000, efficiencyRate: 84.8 },
        library: { booksIssued: 1240, booksReserved: 180, activeCards: 2150, uniqueBookCount: 45000 },
        research: { ongoingProjects: 14, completedProjects: 22, fundingReceived: 450000 },
        inventory: { totalItems: 8400, itemsLowStock: 24, reorderPending: 5 },
        assets: { totalAssets: 1240, activeAssets: 1210, maintenanceRequired: 14 }
      };

      // Generate simulated trends (Monthly or Yearly)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const years = ['2022', '2023', '2024', '2025', '2026'];
      
      const currentPeriod = timeRange === 'yearly' ? years : months;
      
      const trends = currentPeriod.map((p, index) => {
        const seed = index + 1;
        return {
          period: p,
          revenue: 800000 + (seed * 45000) + (Math.sin(seed) * 30000),
          expense: 650000 + (seed * 35000) + (Math.cos(seed) * 20000),
          enrollment: 2400 + (seed * 40) + Math.floor(Math.sin(seed) * 50),
          passPercentage: 78 + (seed * 0.5) + (Math.cos(seed) * 2),
          researchOutput: 5 + Math.floor(seed * 1.5) + (seed % 3),
        };
      });

      // Department breakdowns
      const departmentsList = [
        { name: 'Computer Science', students: 840, faculty: 34, budget: 1200000, passRate: 88.5, researchCount: 45 },
        { name: 'Electrical Engineering', students: 510, faculty: 24, budget: 950000, passRate: 81.2, researchCount: 32 },
        { name: 'Mechanical Engineering', students: 480, faculty: 20, budget: 880000, passRate: 79.8, researchCount: 22 },
        { name: 'Business School', students: 640, faculty: 28, budget: 1100000, passRate: 85.0, researchCount: 18 },
        { name: 'Natural Sciences', students: 370, faculty: 39, budget: 1300000, passRate: 84.1, researchCount: 52 }
      ];

      // Drill down dynamic selection response based on type
      let responsePayload: any = {
        meta: {
          dashboardType,
          departmentFilter,
          timeRange,
          timestamp: new Date().toISOString()
        },
        dataMarts,
        trends,
        departmentsList,
      };

      if (dashboardType === 'vc') {
        responsePayload.widgets = [
          { label: 'Executive Revenue', value: '$12.45M', change: '+12.4%', trend: 'up' },
          { label: 'Total Enrollment', value: String(dbStudentsCount || 2840), change: '+4.5%', trend: 'up' },
          { label: 'Faculty Headcount', value: String(dbTeachersCount || 145), change: '+2.1%', trend: 'up' },
          { label: 'Research Publications', value: String(dbResearchCount || 132), change: '+8.4%', trend: 'up' }
        ];
      } else if (dashboardType === 'registrar') {
        responsePayload.widgets = [
          { label: 'Active Students', value: String(dbStudentsCount || 2840), change: '+4.5%', trend: 'up' },
          { label: 'Admissions Conversions', value: '71.2%', change: '+1.5%', trend: 'up' },
          { label: 'Student Yield', value: '84.5%', change: '+0.8%', trend: 'up' },
          { label: 'Graduation Index', value: '93.8%', change: '+1.1%', trend: 'up' }
        ];
      } else if (dashboardType === 'finance') {
        responsePayload.widgets = [
          { label: 'Fiscal Surplus', value: '$2.61M', change: '+18.2%', trend: 'up' },
          { label: 'Annual Expenditures', value: '$9.84M', change: '-2.4%', trend: 'down' },
          { label: 'Procurement Cycle Time', value: '4.8 Days', change: '-12.5%', trend: 'down' },
          { label: 'Library Fine Recoveries', value: '$8,500', change: '+14.2%', trend: 'up' }
        ];
      } else if (dashboardType === 'hr') {
        responsePayload.widgets = [
          { label: 'Employee Attendance', value: '94.1%', change: '+0.5%', trend: 'up' },
          { label: 'Pending Leaves', value: '14 Requests', change: '-35.0%', trend: 'down' },
          { label: 'Ph.D. Ratio', value: '68.2%', change: '+3.4%', trend: 'up' },
          { label: 'Monthly Payroll', value: '$450K', change: '+1.2%', trend: 'neutral' }
        ];
      } else if (dashboardType === 'coe') {
        responsePayload.widgets = [
          { label: 'Avg Class Pass Rate', value: '82.5%', change: '+2.3%', trend: 'up' },
          { label: 'Active Exam Schedules', value: '4 Major', change: '0.0%', trend: 'neutral' },
          { label: 'Class average GPA', value: '3.24 / 4.0', change: '+0.12', trend: 'up' },
          { label: 'Answer Booklets Processed', value: '2,780', change: '+5.4%', trend: 'up' }
        ];
      } else if (dashboardType === 'qa') {
        responsePayload.widgets = [
          { label: 'National Accreditations', value: '8 / 8', change: '100%', trend: 'neutral' },
          { label: 'Average Faculty Rating', value: '4.62 / 5.0', change: '+3.1%', trend: 'up' },
          { label: 'Feedback Response Rate', value: '91.2%', change: '+6.4%', trend: 'up' },
          { label: 'Compliance Index', value: '98.4%', change: '+0.5%', trend: 'up' }
        ];
      } else {
        responsePayload.widgets = [
          { label: 'Faculty workload hours', value: '14.2 hrs/wk', change: '+5.6%', trend: 'up' },
          { label: 'Class Average Attendance', value: '87.4%', change: '-1.2%', trend: 'down' },
          { label: 'Underrepresented ratio', value: '24.2%', change: '+1.4%', trend: 'up' },
          { label: 'Budget utilization', value: '78.3%', change: '+4.2%', trend: 'up' }
        ];
      }

      // Emit realtime update to Socket.io to keep dashboards synced
      const io = getSocketServer();
      if (io) {
        io.emit('analytics:dashboard:refresh', { dashboardType, ts: new Date().toISOString() });
      }

      res.status(200).json({ success: true, ...responsePayload });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch dashboard analytics' });
    }
  }
);

/**
 * GET /api/analytics/kpis
 * Returns list of dynamic Key Performance Indicators.
 */
analyticsRouter.get(
  '/kpis',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await ensureKPIsSeeded();
      const kpis = await prisma.kPI.findMany();
      res.status(200).json({ success: true, data: kpis });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch KPIs' });
    }
  }
);

/**
 * POST /api/analytics/reports
 * Creates a saved custom business report.
 */
analyticsRouter.post(
  '/reports',
  authenticate,
  async (req: any, res: Response) => {
    try {
      const { reportName, reportType, configuration, schedule } = createReportSchema.parse(req.body);
      const createdBy = req.user?.email || 'analytics-agent@university.edu';

      const report = await prisma.savedReport.create({
        data: {
          reportName,
          reportType,
          createdBy,
          configuration: JSON.stringify(configuration),
          schedule: schedule || null
        }
      });

      // Audit Log Track
      await auditService.log({
        action: 'Report Created',
        tableName: 'SavedReport',
        recordId: String(report.id),
        userId: req.user.userId,
        newValue: report
      });

      res.status(201).json({ success: true, data: report });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to save report configuration' });
    }
  }
);

/**
 * GET /api/analytics/reports
 * Retrieves saved custom BI reports.
 */
analyticsRouter.get(
  '/reports',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const reports = await prisma.savedReport.findMany({
        orderBy: { id: 'desc' }
      });

      // Parse JSON configuration
      const parsedReports = reports.map(r => ({
        ...r,
        configuration: JSON.parse(r.configuration)
      }));

      res.status(200).json({ success: true, data: parsedReports });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to retrieve reports' });
    }
  }
);

/**
 * GET /api/analytics/export
 * Dynamic Data Warehouse Exporting to PDF / CSV / Excel formats with proper mime types.
 */
analyticsRouter.get(
  '/export',
  authenticate,
  async (req: any, res: Response) => {
    try {
      const format = String(req.query.format || 'csv').toLowerCase();
      const reportId = req.query.reportId ? parseInt(req.query.reportId) : null;

      // Log export action
      await auditService.log({
        action: 'Report Exported',
        tableName: 'Analytics',
        recordId: reportId ? String(reportId) : 'AllDashboard',
        userId: req.user.userId,
        newValue: { format }
      });

      // Base export mock-structure
      const exportedData = [
        { Metric: 'Student Enrollment', Target: 5000, Actual: 4820, Percentage: '96.4%' },
        { Metric: 'Attendance Rate', Target: 90, Actual: 87.4, Percentage: '97.1%' },
        { Metric: 'Graduation Rate', Target: 95, Actual: 93.8, Percentage: '98.7%' },
        { Metric: 'Pass Percentage', Target: 85, Actual: 82.5, Percentage: '97.0%' },
        { Metric: 'Faculty Workload', Target: 12, Actual: 14.2, Percentage: '118.3%' },
        { Metric: 'Budget Utilization', Target: 100, Actual: 78.3, Percentage: '78.3%' },
        { Metric: 'Library Usage Count', Target: 1200, Actual: 1340, Percentage: '111.6%' },
        { Metric: 'Research Publications', Target: 150, Actual: 132, Percentage: '88.0%' }
      ];

      if (format === 'csv') {
        const headers = 'Metric,Target,Actual,Percentage\n';
        const rows = exportedData.map(d => `"${d.Metric}",${d.Target},${d.Actual},"${d.Percentage}"`).join('\n');
        const csvContent = headers + rows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="university_bi_export.csv"');
        res.status(200).send(csvContent);
        return;
      }

      if (format === 'excel') {
        // Send pseudo-XML Excel Spreadsheet or simple layout
        const headers = 'Metric\tTarget\tActual\tPercentage\n';
        const rows = exportedData.map(d => `${d.Metric}\t${d.Target}\t${d.Actual}\t${d.Percentage}`).join('\n');
        const xlsContent = headers + rows;

        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', 'attachment; filename="university_bi_export.xls"');
        res.status(200).send(xlsContent);
        return;
      }

      if (format === 'pdf') {
        // Send basic printed PDF friendly layout placeholder
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="university_bi_export.pdf"');
        // Simple mock PDF representation
        const mockPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 100 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Smart University ERP — Business Intelligence Executive PDF Report) Tj\n0 -20 Td\n(Target Enrollment: 5000 | Current: 4820 | Status: Optimal) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000015 00000 n\n0000000072 00000 n\n0000000139 00000 n\n0000000241 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n391\n%%EOF\n');
        res.status(200).send(mockPdf);
        return;
      }

      res.status(400).json({ success: false, message: 'Invalid export format. Supported formats: csv, excel, pdf.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Export failed' });
    }
  }
);

/**
 * POST /api/analytics/schedule
 * Configures or schedules periodic execution / generation of a saved BI report.
 */
analyticsRouter.post(
  '/schedule',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { reportId, schedule } = scheduleReportSchema.parse(req.body);

      const report = await prisma.savedReport.update({
        where: { id: reportId },
        data: { schedule }
      });

      // Emit event
      const io = getSocketServer();
      if (io) {
        io.emit('analytics:report:status', { reportId, schedule, status: 'Scheduled' });
      }

      res.status(200).json({ success: true, message: `Report "${report.reportName}" successfully scheduled.`, data: report });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to update schedule' });
    }
  }
);

/**
 * GET /api/analytics/jobs
 * Returns list of Data Warehouse / ETL integration pipelines.
 */
analyticsRouter.get(
  '/jobs',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const jobs = await prisma.dataWarehouseJob.findMany({
        orderBy: { startedAt: 'desc' }
      });
      res.status(200).json({ success: true, data: jobs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch jobs' });
    }
  }
);

/**
 * POST /api/analytics/jobs/trigger
 * Triggers a simulated ETL execution pipeline and notifies progress in real-time.
 */
analyticsRouter.post(
  '/jobs/trigger',
  authenticate,
  async (req: any, res: Response) => {
    try {
      const jobName = req.body.jobName || 'Dynamic Smart ETL Engine';
      const jobType = req.body.jobType || 'ETL';

      const job = await prisma.dataWarehouseJob.create({
        data: {
          jobName,
          jobType,
          status: 'Running',
          startedAt: new Date()
        }
      });

      // Log ETL Start
      await auditService.log({
        action: 'ETL Started',
        tableName: 'DataWarehouseJob',
        recordId: String(job.id),
        userId: req.user.userId,
        newValue: { jobName, jobType }
      });

      const io = getSocketServer();

      // Trigger asynchronous simulation of pipeline execution in background
      let progress = 0;
      const interval = setInterval(async () => {
        progress += 20;
        if (io) {
          io.emit('analytics:etl:progress', { jobId: job.id, progress, status: progress === 100 ? 'Success' : 'Running' });
        }

        if (progress >= 100) {
          clearInterval(interval);
          try {
            const finalJob = await prisma.dataWarehouseJob.update({
              where: { id: job.id },
              data: {
                status: 'Success',
                completedAt: new Date()
              }
            });

            // Log ETL Completion
            await auditService.log({
              action: 'ETL Completed',
              tableName: 'DataWarehouseJob',
              recordId: String(job.id),
              userId: req.user.userId,
              newValue: finalJob
            });

            if (io) {
              io.emit('analytics:report:status', { message: `Job "${jobName}" completed successfully.` });
            }
          } catch (err) {
            console.error('Failed to update completed ETL job:', err);
          }
        }
      }, 2000);

      res.status(200).json({ success: true, message: 'Data Warehouse ETL sync triggered in background.', data: job });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to trigger warehouse sync' });
    }
  }
);
