import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { UnauthorizedError } from '../errors/auth.errors';

export class ReportController {
  async getSummaryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await reportService.getSystemSummaryStats();
      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSavedReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await reportService.getSavedReports();
      res.status(200).json({
        status: 'success',
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSavedReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { reportName, reportType, configuration, schedule } = req.body;
      if (!reportName || !reportType) {
        res.status(400).json({ status: 'error', message: 'reportName and reportType are required' });
        return;
      }

      const report = await reportService.createSavedReport(
        {
          reportName,
          reportType,
          configuration: configuration ? JSON.stringify(configuration) : '{}',
          schedule,
        },
        req.user.userId
      );

      res.status(201).json({
        status: 'success',
        message: 'Report saved successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type } = req.params;
      const data = await reportService.generateReportData(type);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
