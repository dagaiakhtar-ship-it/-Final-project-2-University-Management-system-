import { Request, Response, NextFunction } from 'express';
import { alumniService } from '../services/alumni.service';
import { prisma } from '../services/db.service';

export class AlumniController {
  // 1. GET /api/alumni - List & Search Alumni Profiles
  async getAlumniProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, departmentId, programId, graduationYear, company, country, verifiedOnly, visibility } = req.query;

      const profiles = await alumniService.getAlumniProfiles({
        search: search as string,
        departmentId: departmentId ? Number(departmentId) : undefined,
        programId: programId ? Number(programId) : undefined,
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
        company: company as string,
        country: country as string,
        verifiedOnly: verifiedOnly === 'true' ? true : undefined,
        visibility: visibility as string,
      });

      res.status(200).json(profiles);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 2. GET /api/alumni/:id - Individual Alumni Profile
  async getAlumniProfileById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const profile = await alumniService.getAlumniProfileById(id);
      if (!profile) {
        res.status(404).json({ error: 'Alumni profile not found.' });
        return;
      }
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 3. POST /api/alumni - Register/Create Alumni Profile
  async createAlumniProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let studentId = req.body.studentId;

      // If registered by a Student user, resolve their own studentId
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

      const profile = await alumniService.createAlumniProfile({
        studentId: Number(studentId),
        graduationYear: Number(req.body.graduationYear),
        degree: req.body.degree,
        departmentId: Number(req.body.departmentId),
        programId: Number(req.body.programId),
        currentCompany: req.body.currentCompany,
        currentDesignation: req.body.currentDesignation,
        employmentStatus: req.body.employmentStatus || 'Unemployed',
        city: req.body.city,
        country: req.body.country,
        linkedinUrl: req.body.linkedinUrl,
        githubUrl: req.body.githubUrl,
        portfolioUrl: req.body.portfolioUrl,
        biography: req.body.biography,
        profilePhoto: req.body.profilePhoto,
        visibility: req.body.visibility || 'Public',
        actorUserId: user?.userId,
      });

      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 4. PUT /api/alumni/:id - Update Alumni Profile
  async updateAlumniProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const profile = await prisma.alumniProfile.findUnique({
        where: { id },
        include: { student: true },
      });

      if (!profile) {
        res.status(404).json({ error: 'Alumni profile not found.' });
        return;
      }

      // Check permissions: only owner (Student user) or Admin/Super Admin can update
      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student || profile.studentId !== student.id) {
          res.status(403).json({ error: 'Access denied. You can only update your own alumni profile.' });
          return;
        }
      }

      const updated = await alumniService.updateAlumniProfile(id, {
        graduationYear: req.body.graduationYear ? Number(req.body.graduationYear) : undefined,
        degree: req.body.degree,
        departmentId: req.body.departmentId ? Number(req.body.departmentId) : undefined,
        programId: req.body.programId ? Number(req.body.programId) : undefined,
        currentCompany: req.body.currentCompany,
        currentDesignation: req.body.currentDesignation,
        employmentStatus: req.body.employmentStatus,
        city: req.body.city,
        country: req.body.country,
        linkedinUrl: req.body.linkedinUrl,
        githubUrl: req.body.githubUrl,
        portfolioUrl: req.body.portfolioUrl,
        biography: req.body.biography,
        profilePhoto: req.body.profilePhoto,
        visibility: req.body.visibility,
        actorUserId: user?.userId,
      });

      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 5. DELETE /api/alumni/:id - Delete Alumni Profile
  async deleteAlumniProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      await alumniService.deleteAlumniProfile(id, user?.userId);
      res.status(200).json({ success: true, message: 'Alumni profile deleted.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 6. POST /api/alumni/verify - Verify Alumni Profile
  async verifyAlumniProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, verified } = req.body;
      const user = (req as any).user;

      if (!id) {
        res.status(400).json({ error: 'Alumni profile ID is required.' });
        return;
      }

      const verifiedBy = `${user?.firstName || 'Admin'} ${user?.lastName || ''}`.trim();
      const updated = await alumniService.verifyAlumniProfile(
        Number(id),
        verified === true,
        verifiedBy,
        user?.userId
      );

      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 7. GET /api/alumni/events - List Events
  async getAlumniEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await alumniService.getAlumniEvents();
      res.status(200).json(events);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 8. POST /api/alumni/events - Create Alumni Event
  async createAlumniEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const event = await alumniService.createAlumniEvent({
        title: req.body.title,
        description: req.body.description,
        eventType: req.body.eventType,
        venue: req.body.venue,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        organizer: req.body.organizer || 'Alumni Office',
        registrationDeadline: new Date(req.body.registrationDeadline),
        maximumParticipants: Number(req.body.maximumParticipants),
        actorUserId: user?.userId,
      });

      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 9. POST /api/alumni/events/:id/register - Register for Event
  async registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Number(req.params.id);
      const user = (req as any).user;

      let studentId: number | undefined;
      let alumniId: number | undefined;

      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (student) {
          studentId = student.id;
          // Check if this student also has an alumni profile
          const alumni = await prisma.alumniProfile.findUnique({
            where: { studentId: student.id },
          });
          if (alumni) {
            alumniId = alumni.id;
          }
        }
      }

      const participant = await alumniService.registerForEvent({
        eventId,
        studentId,
        alumniId,
        actorUserId: user?.userId,
      });

      res.status(201).json(participant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 10. POST /api/alumni/mentorship - Request Mentorship
  async createMentorshipRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let menteeStudentId = req.body.menteeStudentId;

      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (!student) {
          res.status(400).json({ error: 'No student record associated with this user.' });
          return;
        }
        menteeStudentId = student.id;
      }

      if (!menteeStudentId) {
        res.status(400).json({ error: 'Mentee student ID is required.' });
        return;
      }

      const request = await alumniService.createMentorshipRequest({
        mentorId: Number(req.body.mentorId),
        menteeStudentId: Number(menteeStudentId),
        mentorshipArea: req.body.mentorshipArea,
        actorUserId: user?.userId,
      });

      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 11. GET /api/alumni/mentorship - List Mentorships
  async getMentorships(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let mentorId = req.query.mentorId ? Number(req.query.mentorId) : undefined;
      let menteeStudentId = req.query.menteeStudentId ? Number(req.query.menteeStudentId) : undefined;

      // Limit results if current user is student or alumnus
      if (user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (student) {
          const alumni = await prisma.alumniProfile.findUnique({
            where: { studentId: student.id },
          });
          if (alumni) {
            // They can see mentorships where they are either the mentor or the student
            // By default, if neither filter is provided, resolve according to role
            if (!mentorId && !menteeStudentId) {
              // Fetch as mentor or student
              const list = await prisma.alumniMentorship.findMany({
                where: {
                  OR: [{ mentorId: alumni.id }, { menteeStudentId: student.id }],
                },
                include: {
                  mentor: {
                    include: {
                      student: {
                        include: {
                          user: {
                            select: { firstName: true, lastName: true, email: true },
                          },
                        },
                      },
                    },
                  },
                  menteeStudent: {
                    include: {
                      user: {
                        select: { firstName: true, lastName: true, email: true },
                      },
                    },
                  },
                },
              });
              res.status(200).json(list);
              return;
            }
          } else {
            menteeStudentId = student.id;
          }
        }
      }

      const list = await alumniService.getMentorships({ mentorId, menteeStudentId });
      res.status(200).json(list);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 12. PUT /api/alumni/mentorship/:id/status - Update Status
  async updateMentorshipStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      const user = (req as any).user;

      if (!status) {
        res.status(400).json({ error: 'Status is required.' });
        return;
      }

      const updated = await alumniService.updateMentorshipStatus(id, status, user?.userId);
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 13. GET /api/alumni/donations - Get Donations
  async getDonations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const donations = await alumniService.getDonations();
      res.status(200).json(donations);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 14. POST /api/alumni/donations - Make Donation
  async createDonation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let alumniId = req.body.alumniId ? Number(req.body.alumniId) : undefined;

      if (user?.role === 'STUDENT' && !req.body.isAnonymous) {
        const student = await prisma.student.findFirst({
          where: { userId: user.userId },
        });
        if (student) {
          const alumni = await prisma.alumniProfile.findUnique({
            where: { studentId: student.id },
          });
          if (alumni) {
            alumniId = alumni.id;
          }
        }
      }

      const donation = await alumniService.createDonation({
        alumniId,
        campaignTitle: req.body.campaignTitle,
        amount: Number(req.body.amount),
        currency: req.body.currency || 'USD',
        remarks: req.body.remarks,
        isAnonymous: req.body.isAnonymous === true,
        actorUserId: user?.userId,
      });

      res.status(201).json(donation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 15. GET /api/alumni/analytics - Analytics
  async getAlumniAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await alumniService.getAlumniAnalytics();
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const alumniController = new AlumniController();
export default alumniController;
