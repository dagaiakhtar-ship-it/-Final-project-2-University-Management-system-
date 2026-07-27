import { prisma } from './db.service';
import { auditService } from './audit.service';
import { notifyAlumniChange } from './socket.service';

// Helpers for input sanitization and validation
function sanitize(str: string | undefined | null): string | null {
  if (!str) return null;
  return str.replace(/<[^>]*>/g, '').trim();
}

function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return true; // Optional fields
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export class AlumniService {
  // 1. Create Alumni Profile
  async createAlumniProfile(data: {
    studentId: number;
    graduationYear: number;
    degree: string;
    departmentId: number;
    programId: number;
    currentCompany?: string;
    currentDesignation?: string;
    employmentStatus: string;
    city?: string;
    country?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    biography?: string;
    profilePhoto?: string;
    visibility?: string;
    actorUserId?: number;
  }) {
    // Validate inputs
    if (!data.studentId) {
      throw new Error('Student ID is required.');
    }
    if (!data.degree || data.degree.trim() === '') {
      throw new Error('Degree is required.');
    }
    if (!data.graduationYear || data.graduationYear < 1950 || data.graduationYear > 2100) {
      throw new Error('Please enter a valid graduation year between 1950 and 2100.');
    }
    if (data.linkedinUrl && !isValidUrl(data.linkedinUrl)) {
      throw new Error('LinkedIn URL must be a valid URL starting with http:// or https://.');
    }
    if (data.githubUrl && !isValidUrl(data.githubUrl)) {
      throw new Error('GitHub URL must be a valid URL starting with http:// or https://.');
    }
    if (data.portfolioUrl && !isValidUrl(data.portfolioUrl)) {
      throw new Error('Portfolio URL must be a valid URL starting with http:// or https://.');
    }

    // Prevent duplicate alumni accounts
    const existing = await prisma.alumniProfile.findUnique({
      where: { studentId: data.studentId },
    });
    if (existing) {
      throw new Error('An alumni profile already exists for this student.');
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: {
        graduationApplications: true,
        degreeAudits: true,
        user: true,
      },
    });
    if (!student) {
      throw new Error('Student not found.');
    }

    // Auto-verify if they have an approved graduation application or an eligible degree audit
    const hasApprovedGraduation = student.graduationApplications.some(
      (app) => app.status === 'Approved' || app.status === 'Graduated'
    );
    const hasEligibleAudit = student.degreeAudits.some(
      (audit) => audit.graduationStatus === 'Eligible'
    );
    const autoVerify = hasApprovedGraduation || hasEligibleAudit;

    const profile = await prisma.alumniProfile.create({
      data: {
        studentId: data.studentId,
        graduationYear: data.graduationYear,
        degree: sanitize(data.degree) || 'Degree',
        departmentId: data.departmentId,
        programId: data.programId,
        currentCompany: sanitize(data.currentCompany) || null,
        currentDesignation: sanitize(data.currentDesignation) || null,
        employmentStatus: sanitize(data.employmentStatus) || 'Unemployed',
        city: sanitize(data.city) || null,
        country: sanitize(data.country) || null,
        linkedinUrl: data.linkedinUrl || null,
        githubUrl: data.githubUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        biography: sanitize(data.biography) || null,
        profilePhoto: data.profilePhoto || null,
        visibility: data.visibility || 'Public',
        verified: autoVerify,
        verifiedBy: autoVerify ? 'System (Auto-Eligible)' : null,
        verifiedAt: autoVerify ? new Date() : null,
      },
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
        department: true,
        program: true,
      },
    });

    // Log event in Audit Trail
    await auditService.log({
      action: 'ALUMNI_PROFILE_CREATED',
      tableName: 'AlumniProfile',
      recordId: String(profile.id),
      newValue: profile,
      userId: data.actorUserId || student.userId,
    });

    // Notify via Socket
    notifyAlumniChange('REGISTERED', {
      alumniId: profile.id,
      studentId: profile.studentId,
      verified: profile.verified,
    });

    return profile;
  }

  // 2. Update Alumni Profile
  async updateAlumniProfile(
    id: number,
    data: {
      graduationYear?: number;
      degree?: string;
      departmentId?: number;
      programId?: number;
      currentCompany?: string;
      currentDesignation?: string;
      employmentStatus?: string;
      city?: string;
      country?: string;
      linkedinUrl?: string;
      githubUrl?: string;
      portfolioUrl?: string;
      biography?: string;
      profilePhoto?: string;
      visibility?: string;
      actorUserId?: number;
    }
  ) {
    // Validate inputs
    if (data.graduationYear !== undefined && (data.graduationYear < 1950 || data.graduationYear > 2100)) {
      throw new Error('Please enter a valid graduation year between 1950 and 2100.');
    }
    if (data.degree !== undefined && data.degree.trim() === '') {
      throw new Error('Degree cannot be empty.');
    }
    if (data.linkedinUrl !== undefined && data.linkedinUrl !== '' && data.linkedinUrl !== null && !isValidUrl(data.linkedinUrl)) {
      throw new Error('LinkedIn URL must be a valid URL starting with http:// or https://.');
    }
    if (data.githubUrl !== undefined && data.githubUrl !== '' && data.githubUrl !== null && !isValidUrl(data.githubUrl)) {
      throw new Error('GitHub URL must be a valid URL starting with http:// or https://.');
    }
    if (data.portfolioUrl !== undefined && data.portfolioUrl !== '' && data.portfolioUrl !== null && !isValidUrl(data.portfolioUrl)) {
      throw new Error('Portfolio URL must be a valid URL starting with http:// or https://.');
    }

    const profile = await prisma.alumniProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new Error('Alumni profile not found.');
    }

    const updated = await prisma.alumniProfile.update({
      where: { id },
      data: {
        graduationYear: data.graduationYear !== undefined ? data.graduationYear : undefined,
        degree: data.degree !== undefined ? (sanitize(data.degree) || undefined) : undefined,
        departmentId: data.departmentId !== undefined ? data.departmentId : undefined,
        programId: data.programId !== undefined ? data.programId : undefined,
        currentCompany: data.currentCompany !== undefined ? (sanitize(data.currentCompany) || null) : undefined,
        currentDesignation: data.currentDesignation !== undefined ? (sanitize(data.currentDesignation) || null) : undefined,
        employmentStatus: data.employmentStatus !== undefined ? (sanitize(data.employmentStatus) || undefined) : undefined,
        city: data.city !== undefined ? (sanitize(data.city) || null) : undefined,
        country: data.country !== undefined ? (sanitize(data.country) || null) : undefined,
        linkedinUrl: data.linkedinUrl !== undefined ? (data.linkedinUrl || null) : undefined,
        githubUrl: data.githubUrl !== undefined ? (data.githubUrl || null) : undefined,
        portfolioUrl: data.portfolioUrl !== undefined ? (data.portfolioUrl || null) : undefined,
        biography: data.biography !== undefined ? (sanitize(data.biography) || null) : undefined,
        profilePhoto: data.profilePhoto !== undefined ? data.profilePhoto : undefined,
        visibility: data.visibility !== undefined ? data.visibility : undefined,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        department: true,
        program: true,
      },
    });

    await auditService.log({
      action: 'ALUMNI_PROFILE_UPDATED',
      tableName: 'AlumniProfile',
      recordId: String(id),
      oldValue: profile,
      newValue: updated,
      userId: data.actorUserId,
    });

    notifyAlumniChange('EVENT_UPDATED', {
      alumniId: updated.id,
      studentId: updated.studentId,
    });

    return updated;
  }

  // 3. Verify Alumni Profile (Admin/Registrar)
  async verifyAlumniProfile(id: number, verified: boolean, verifiedBy: string, actorUserId: number) {
    const profile = await prisma.alumniProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new Error('Alumni profile not found.');
    }

    const updated = await prisma.alumniProfile.update({
      where: { id },
      data: {
        verified,
        verifiedBy: verified ? verifiedBy : null,
        verifiedAt: verified ? new Date() : null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    await auditService.log({
      action: verified ? 'ALUMNI_VERIFIED' : 'ALUMNI_UNVERIFIED',
      tableName: 'AlumniProfile',
      recordId: String(id),
      newValue: updated,
      userId: actorUserId,
    });

    notifyAlumniChange('VERIFIED', {
      alumniId: updated.id,
      studentId: updated.studentId,
      verified,
    });

    return updated;
  }

  // 4. Delete/Archive Alumni Profile
  async deleteAlumniProfile(id: number, actorUserId: number) {
    const profile = await prisma.alumniProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new Error('Alumni profile not found.');
    }

    await prisma.alumniProfile.delete({
      where: { id },
    });

    await auditService.log({
      action: 'ALUMNI_PROFILE_DELETED',
      tableName: 'AlumniProfile',
      recordId: String(id),
      oldValue: profile,
      userId: actorUserId,
    });

    return { success: true };
  }

  // 5. Get List / Search Profiles
  async getAlumniProfiles(filters: {
    search?: string;
    departmentId?: number;
    programId?: number;
    graduationYear?: number;
    company?: string;
    country?: string;
    verifiedOnly?: boolean;
    visibility?: string; // Public, Alumni Only, etc.
  }) {
    const whereClause: any = {};

    if (filters.departmentId) {
      whereClause.departmentId = filters.departmentId;
    }
    if (filters.programId) {
      whereClause.programId = filters.programId;
    }
    if (filters.graduationYear) {
      whereClause.graduationYear = filters.graduationYear;
    }
    if (filters.country) {
      whereClause.country = { contains: filters.country, mode: 'insensitive' };
    }
    if (filters.company) {
      whereClause.currentCompany = { contains: filters.company, mode: 'insensitive' };
    }
    if (filters.verifiedOnly !== undefined) {
      whereClause.verified = filters.verifiedOnly;
    }
    if (filters.visibility) {
      whereClause.visibility = filters.visibility;
    }

    if (filters.search) {
      whereClause.OR = [
        {
          student: {
            fullName: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          currentCompany: { contains: filters.search, mode: 'insensitive' },
        },
        {
          currentDesignation: { contains: filters.search, mode: 'insensitive' },
        },
        {
          degree: { contains: filters.search, mode: 'insensitive' },
        },
      ];
    }

    return prisma.alumniProfile.findMany({
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
          },
        },
        department: true,
        program: true,
      },
      orderBy: { graduationYear: 'desc' },
    });
  }

  // 6. Get Alumni Profile By ID
  async getAlumniProfileById(id: number) {
    return prisma.alumniProfile.findUnique({
      where: { id },
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
        department: true,
        program: true,
        mentorshipsAsMentor: {
          include: {
            menteeStudent: {
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
        },
        donations: true,
      },
    });
  }

  // 7. Events Management
  async createAlumniEvent(data: {
    title: string;
    description: string;
    eventType: string;
    venue: string;
    startDate: Date;
    endDate: Date;
    organizer: string;
    registrationDeadline: Date;
    maximumParticipants: number;
    actorUserId: number;
  }) {
    if (!data.title || data.title.trim() === '') {
      throw new Error('Event title is required.');
    }
    if (!data.description || data.description.trim() === '') {
      throw new Error('Event description is required.');
    }
    if (!data.venue || data.venue.trim() === '') {
      throw new Error('Event venue is required.');
    }
    if (isNaN(new Date(data.startDate).getTime())) {
      throw new Error('Invalid start date.');
    }
    if (isNaN(new Date(data.endDate).getTime())) {
      throw new Error('Invalid end date.');
    }
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error('Event end date cannot be before start date.');
    }
    if (isNaN(new Date(data.registrationDeadline).getTime())) {
      throw new Error('Invalid registration deadline.');
    }
    if (new Date(data.registrationDeadline) > new Date(data.startDate)) {
      throw new Error('Registration deadline cannot be after the event start date.');
    }
    if (!data.maximumParticipants || data.maximumParticipants <= 0) {
      throw new Error('Maximum participants must be at least 1.');
    }

    const event = await prisma.alumniEvent.create({
      data: {
        title: sanitize(data.title) || 'Event',
        description: sanitize(data.description) || '',
        eventType: sanitize(data.eventType) || 'Reunion',
        venue: sanitize(data.venue) || 'Campus',
        startDate: data.startDate,
        endDate: data.endDate,
        organizer: sanitize(data.organizer) || 'Alumni Office',
        registrationDeadline: data.registrationDeadline,
        maximumParticipants: data.maximumParticipants,
      },
    });

    await auditService.log({
      action: 'ALUMNI_EVENT_CREATED',
      tableName: 'AlumniEvent',
      recordId: String(event.id),
      newValue: event,
      userId: data.actorUserId,
    });

    notifyAlumniChange('EVENT_UPDATED', {
      eventId: event.id,
      title: event.title,
    });

    return event;
  }

  async getAlumniEvents() {
    return prisma.alumniEvent.findMany({
      include: {
        participants: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            alumni: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async registerForEvent(params: {
    eventId: number;
    studentId?: number;
    alumniId?: number;
    actorUserId: number;
  }) {
    if (!params.studentId && !params.alumniId) {
      throw new Error('Only students or alumni can register for events.');
    }

    const event = await prisma.alumniEvent.findUnique({
      where: { id: params.eventId },
      include: {
        participants: {
          where: { status: 'Registered' },
        },
      },
    });

    if (!event) {
      throw new Error('Alumni event not found.');
    }

    // Check if registration deadline has passed
    if (new Date() > new Date(event.registrationDeadline)) {
      throw new Error('The registration deadline for this event has passed.');
    }

    // Check if already registered
    const alreadyRegistered = await prisma.alumniEventParticipant.findFirst({
      where: {
        eventId: params.eventId,
        OR: [
          params.studentId ? { studentId: params.studentId } : undefined,
          params.alumniId ? { alumniId: params.alumniId } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (alreadyRegistered) {
      throw new Error('You are already registered for this event.');
    }

    // Determine status (Registered vs Waitlisted)
    const isFull = event.participants.length >= event.maximumParticipants;
    const status = isFull ? 'Waitlisted' : 'Registered';

    const participant = await prisma.alumniEventParticipant.create({
      data: {
        eventId: params.eventId,
        studentId: params.studentId || null,
        alumniId: params.alumniId || null,
        status,
      },
    });

    await auditService.log({
      action: 'ALUMNI_EVENT_REGISTERED',
      tableName: 'AlumniEventParticipant',
      recordId: String(participant.id),
      newValue: participant,
      userId: params.actorUserId,
    });

    notifyAlumniChange('EVENT_REGISTERED', {
      eventId: params.eventId,
      status,
      alumniId: params.alumniId,
      studentId: params.studentId,
    });

    return participant;
  }

  // 8. Mentorship Program
  async createMentorshipRequest(data: {
    mentorId: number;
    menteeStudentId: number;
    mentorshipArea: string;
    actorUserId: number;
  }) {
    if (!data.mentorId) {
      throw new Error('Mentor ID is required.');
    }
    if (!data.menteeStudentId) {
      throw new Error('Mentee Student ID is required.');
    }
    if (!data.mentorshipArea || data.mentorshipArea.trim() === '') {
      throw new Error('Mentorship focus area is required.');
    }

    // Verify mentor profile
    const mentor = await prisma.alumniProfile.findUnique({
      where: { id: data.mentorId },
    });
    if (!mentor) {
      throw new Error('Mentor profile not found.');
    }
    if (mentor.studentId === data.menteeStudentId) {
      throw new Error('You cannot request mentorship from yourself.');
    }

    // Prevent duplicate active/pending mentorships
    const existing = await prisma.alumniMentorship.findFirst({
      where: {
        mentorId: data.mentorId,
        menteeStudentId: data.menteeStudentId,
        status: { in: ['Pending', 'Active'] },
      },
    });

    if (existing) {
      throw new Error('You already have an active or pending mentorship request with this mentor.');
    }

    const mentorship = await prisma.alumniMentorship.create({
      data: {
        mentorId: data.mentorId,
        menteeStudentId: data.menteeStudentId,
        mentorshipArea: sanitize(data.mentorshipArea) || 'General',
        status: 'Pending',
      },
      include: {
        mentor: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        menteeStudent: {
          include: {
            user: true,
          },
        },
      },
    });

    await auditService.log({
      action: 'MENTORSHIP_REQUESTED',
      tableName: 'AlumniMentorship',
      recordId: String(mentorship.id),
      newValue: mentorship,
      userId: data.actorUserId,
    });

    notifyAlumniChange('MENTORSHIP_REQUESTED', {
      mentorshipId: mentorship.id,
      mentorId: mentorship.mentorId,
      menteeStudentId: mentorship.menteeStudentId,
    });

    return mentorship;
  }

  async getMentorships(params: { mentorId?: number; menteeStudentId?: number }) {
    return prisma.alumniMentorship.findMany({
      where: {
        mentorId: params.mentorId,
        menteeStudentId: params.menteeStudentId,
      },
      include: {
        mentor: {
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
        },
        menteeStudent: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMentorshipStatus(id: number, status: string, actorUserId: number) {
    if (!status || !['Pending', 'Active', 'Completed', 'Cancelled'].includes(status)) {
      throw new Error('Invalid status option.');
    }

    const mentorship = await prisma.alumniMentorship.findUnique({
      where: { id },
      include: {
        mentor: {
          include: {
            student: true,
          }
        }
      }
    });
    if (!mentorship) {
      throw new Error('Mentorship relationship not found.');
    }

    // Verify actor permissions: Admin, Super Admin, or the assigned Mentor (owner)
    const actorUser = await prisma.user.findUnique({
      where: { id: actorUserId },
      include: { role: true },
    });
    const isSpecialRole = actorUser?.role?.name === 'SUPER_ADMIN' || actorUser?.role?.name === 'ADMIN';
    const isMentor = mentorship.mentor.student.userId === actorUserId;

    if (!isSpecialRole && !isMentor) {
      throw new Error('Access denied. Only the assigned mentor or an administrator can update the mentorship status.');
    }

    const updated = await prisma.alumniMentorship.update({
      where: { id },
      data: { status },
      include: {
        mentor: {
          include: {
            student: true,
          },
        },
        menteeStudent: {
          include: {
            user: true,
          },
        },
      },
    });

    await auditService.log({
      action: 'MENTORSHIP_UPDATED',
      tableName: 'AlumniMentorship',
      recordId: String(id),
      oldValue: mentorship,
      newValue: updated,
      userId: actorUserId,
    });

    notifyAlumniChange('MENTORSHIP_UPDATED', {
      mentorshipId: id,
      status,
      mentorId: updated.mentorId,
      menteeStudentId: updated.menteeStudentId,
    });

    return updated;
  }

  // 9. Donations & Fundraising
  async createDonation(data: {
    alumniId?: number;
    campaignTitle: string;
    amount: number;
    currency?: string;
    remarks?: string;
    isAnonymous?: boolean;
    actorUserId?: number;
  }) {
    if (!data.campaignTitle || data.campaignTitle.trim() === '') {
      throw new Error('Fundraising campaign title is required.');
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error('Donation amount must be greater than zero.');
    }

    if (data.alumniId) {
      const alumniExists = await prisma.alumniProfile.findUnique({
        where: { id: data.alumniId },
      });
      if (!alumniExists) {
        throw new Error('Specified alumni profile not found.');
      }
    }

    const donation = await prisma.donation.create({
      data: {
        alumniId: data.isAnonymous ? null : (data.alumniId || null),
        campaignTitle: sanitize(data.campaignTitle) || 'General Fund',
        amount: data.amount,
        currency: sanitize(data.currency) || 'USD',
        paymentStatus: 'Completed', // Pre-confirming payments for this demo module
        remarks: sanitize(data.remarks) || null,
        isAnonymous: data.isAnonymous || false,
      },
      include: {
        alumni: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await auditService.log({
      action: 'DONATION_MADE',
      tableName: 'Donation',
      recordId: String(donation.id),
      newValue: donation,
      userId: data.actorUserId,
    });

    notifyAlumniChange('DONATION_CONFIRMED', {
      donationId: donation.id,
      amount: donation.amount,
      campaignTitle: donation.campaignTitle,
    });

    return donation;
  }

  async getDonations() {
    return prisma.donation.findMany({
      include: {
        alumni: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { donatedAt: 'desc' },
    });
  }

  // 10. Analytics
  async getAlumniAnalytics() {
    const totalAlumni = await prisma.alumniProfile.count();
    const verifiedAlumni = await prisma.alumniProfile.count({ where: { verified: true } });

    // Countries distribution
    const countries = await prisma.alumniProfile.groupBy({
      by: ['country'],
      _count: { _all: true },
    });

    // Employed vs Unemployed
    const employment = await prisma.alumniProfile.groupBy({
      by: ['employmentStatus'],
      _count: { _all: true },
    });

    // Donations
    const totalDonations = await prisma.donation.aggregate({
      _sum: { amount: true },
    });

    // Events
    const totalEvents = await prisma.alumniEvent.count();

    // Mentorship statistics
    const activeMentors = await prisma.alumniProfile.count({
      where: {
        mentorshipsAsMentor: { some: {} },
      },
    });

    const mentorshipStatus = await prisma.alumniMentorship.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    // Department Performance
    const depts = await prisma.department.findMany({
      include: {
        alumniProfiles: true,
      },
    });

    const departmentStats = depts.map((d) => ({
      name: d.shortName || d.name,
      alumniCount: d.alumniProfiles.length,
    }));

    return {
      totalAlumni,
      verifiedAlumni,
      countries: countries.map((c) => ({
        country: c.country || 'Unknown',
        count: c._count._all,
      })),
      employment: employment.map((e) => ({
        status: e.employmentStatus,
        count: e._count._all,
      })),
      totalDonationsAmount: totalDonations._sum.amount || 0,
      totalEvents,
      activeMentors,
      mentorshipStats: mentorshipStatus.map((m) => ({
        status: m.status,
        count: m._count._all,
      })),
      departmentStats,
    };
  }
}

export const alumniService = new AlumniService();
export default alumniService;
