import { Request, Response, NextFunction } from 'express';
import { placementService } from '../services/placement.service';
import { prisma } from '../services/db.service';

export class PlacementController {
  // =========================================================================
  // COMPANY CONTROLLER METHODS
  // =========================================================================

  async getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string;
      const verified = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;

      const companies = await placementService.getCompanies({ search, verified });
      res.status(200).json(companies);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const company = await placementService.getCompanyById(id);
      res.status(200).json(company);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = (req as any).user?.userId;
      const company = await placementService.createCompany({
        ...req.body,
        actorUserId,
      });
      res.status(201).json(company);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const actorUserId = (req as any).user?.userId;
      const company = await placementService.updateCompany(id, req.body, actorUserId);
      res.status(200).json(company);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const actorUserId = (req as any).user?.userId;
      const result = await placementService.deleteCompany(id, actorUserId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // =========================================================================
  // RECRUITER CONTROLLER METHODS
  // =========================================================================

  async createRecruiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = (req as any).user?.userId;
      const recruiter = await placementService.createRecruiter({
        ...req.body,
        actorUserId,
      });
      res.status(201).json(recruiter);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async verifyRecruiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { verified } = req.body;
      const actorUserId = (req as any).user?.userId;

      if (verified === undefined) {
        res.status(400).json({ error: 'Verified flag is required.' });
        return;
      }

      const recruiter = await placementService.verifyRecruiter(id, !!verified, actorUserId);
      res.status(200).json(recruiter);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRecruiters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;
      const search = req.query.search as string;

      const recruiters = await placementService.getRecruiters({ companyId, search });
      res.status(200).json(recruiters);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // =========================================================================
  // JOB POSTINGS CONTROLLER METHODS
  // =========================================================================

  async getJobPostings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, jobType, status, companyId, departmentId } = req.query;

      const postings = await placementService.getJobPostings({
        search: search as string,
        jobType: jobType as string,
        status: status as string,
        companyId: companyId ? Number(companyId) : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
      });

      res.status(200).json(postings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getJobPostingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const posting = await placementService.getJobPostingById(id);
      res.status(200).json(posting);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async createJobPosting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = (req as any).user?.userId;
      
      // If signed in as recruiter, automatically assign their recruiterId and companyId
      const user = (req as any).user;
      let companyId = req.body.companyId;
      let recruiterId = req.body.recruiterId;

      if (user?.role === 'RECRUITER') {
        const recruiter = await prisma.recruiter.findFirst({
          where: { userId: user.userId },
        });
        if (!recruiter) {
          res.status(400).json({ error: 'Recruiter profile not found for this user.' });
          return;
        }
        companyId = recruiter.companyId;
        recruiterId = recruiter.id;
      }

      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required to create a job posting.' });
        return;
      }

      const posting = await placementService.createJobPosting({
        ...req.body,
        companyId: Number(companyId),
        recruiterId: recruiterId ? Number(recruiterId) : undefined,
        actorUserId,
      });

      res.status(201).json(posting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateJobPosting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const actorUserId = (req as any).user?.userId;
      const posting = await placementService.updateJobPosting(id, req.body, actorUserId);
      res.status(200).json(posting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteJobPosting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const actorUserId = (req as any).user?.userId;
      const result = await placementService.deleteJobPosting(id, actorUserId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // =========================================================================
  // ELIGIBILITY & APPLICATIONS CONTROLLER METHODS
  // =========================================================================

  async checkEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      const jobPostingId = Number(req.query.jobPostingId);

      if (!jobPostingId) {
        res.status(400).json({ error: 'Job Posting ID is required.' });
        return;
      }

      // If actor is STUDENT, resolve their own studentId
      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student) {
          res.status(400).json({ error: 'No student record associated with this user.' });
          return;
        }
        studentId = student.id;
      }

      if (!studentId) {
        res.status(400).json({ error: 'Student ID is required.' });
        return;
      }

      const eligibility = await placementService.checkStudentEligibility(studentId, jobPostingId);
      res.status(200).json(eligibility);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async applyForJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let studentId = req.body.studentId ? Number(req.body.studentId) : undefined;
      const jobPostingId = Number(req.body.jobPostingId);
      const { resumeUrl, coverLetter } = req.body;

      if (!jobPostingId) {
        res.status(400).json({ error: 'Job Posting ID is required.' });
        return;
      }
      if (!resumeUrl || resumeUrl.trim() === '') {
        res.status(400).json({ error: 'Resume URL or upload is required.' });
        return;
      }

      // If actor is STUDENT, resolve their own studentId
      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student) {
          res.status(400).json({ error: 'No student record associated with this user.' });
          return;
        }
        studentId = student.id;
      }

      if (!studentId) {
        res.status(400).json({ error: 'Student ID is required.' });
        return;
      }

      const application = await placementService.applyForJob({
        studentId,
        jobPostingId,
        resumeUrl,
        coverLetter,
        actorUserId: user?.userId,
      });

      res.status(201).json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      const jobPostingId = req.query.jobPostingId ? Number(req.query.jobPostingId) : undefined;
      const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;
      const status = req.query.status as string;
      const search = req.query.search as string;

      // If signed in as STUDENT, restrict queries to only their own applications
      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student) {
          res.status(200).json([]);
          return;
        }
        studentId = student.id;
      }

      // If signed in as RECRUITER, automatically restrict to their company's applications
      let resolvedCompanyId = companyId;
      if (user?.role === 'RECRUITER') {
        const recruiter = await prisma.recruiter.findFirst({
          where: { userId: user.userId },
        });
        if (!recruiter) {
          res.status(200).json([]);
          return;
        }
        resolvedCompanyId = recruiter.companyId;
      }

      const applications = await placementService.getApplications({
        studentId,
        jobPostingId,
        companyId: resolvedCompanyId,
        status,
        search,
      });

      res.status(200).json(applications);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const application = await placementService.getApplicationById(id);
      res.status(200).json(application);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { applicationStatus, ...otherFields } = req.body;
      const actorUserId = (req as any).user?.userId;

      if (!applicationStatus) {
        res.status(400).json({ error: 'Application status is required.' });
        return;
      }

      const application = await placementService.updateApplicationStatus(
        id,
        applicationStatus,
        otherFields,
        actorUserId
      );

      res.status(200).json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // =========================================================================
  // RELATIONAL PLACEMENT RECORDS FOR STUDENT
  // =========================================================================

  async getStudentPlacements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const data = await placementService.getStudentPlacementHistory(studentId);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // =========================================================================
  // ANALYTICS CONTROLLER METHOD
  // =========================================================================

  async getPlacementAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await placementService.getPlacementAnalytics();
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const placementController = new PlacementController();
export default placementController;
