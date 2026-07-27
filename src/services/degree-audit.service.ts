import { prisma } from './db.service';
import { auditService } from './audit.service';
import { notifyDegreeAuditChange } from './socket.service';

export class DegreeAuditService {
  /**
   * Helper to ensure a degree requirement exists for a student's program & department.
   * If none exists, we dynamically seed a standard requirement to prevent crashes.
   */
  async ensureDegreeRequirement(programId: number, departmentId: number, curriculumYear: string = '2026') {
    const existing = await prisma.degreeRequirement.findFirst({
      where: {
        programId,
        departmentId,
        curriculumYear,
        active: true,
      },
    });

    if (existing) {
      return existing;
    }

    // Dynamic Seed
    return prisma.degreeRequirement.create({
      data: {
        programId,
        departmentId,
        curriculumYear,
        minimumCreditHours: 120,
        minimumCGPA: 2.0,
        maximumFailedCourses: 3,
        maximumRepeatedCourses: 4,
        minimumCoreCredits: 80,
        minimumElectiveCredits: 20,
        internshipRequired: true,
        projectRequired: true,
        thesisRequired: false,
        comprehensiveExamRequired: false,
        active: true,
      },
    });
  }

  /**
   * Run or update the degree audit for a specific student
   */
  async runDegreeAudit(studentId: number) {
    // 1. Fetch Student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        department: true,
        results: {
          where: { approvalStatus: 'Published' },
          include: {
            courseOffering: {
              include: {
                subject: true,
              },
            },
          },
        },
        cgpaRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found.`);
    }

    // 2. Fetch or seed the degree requirement
    const reqs = await this.ensureDegreeRequirement(student.programId, student.departmentId);

    // 3. Perform Calculations
    const results = student.results || [];

    // Filter passed courses
    const passedResults = results.filter(r => r.passStatus === 'Pass');

    // Credit Hour calculation
    const completedCredits = passedResults.reduce((sum, r) => sum + (r.creditHours || 0), 0);
    const remainingCredits = Math.max(0, reqs.minimumCreditHours - completedCredits);

    // Core / Elective validation
    const completedCoreCredits = passedResults
      .filter(r => r.courseOffering?.subject?.category?.toUpperCase() === 'CORE')
      .reduce((sum, r) => sum + (r.creditHours || 0), 0);

    const completedElectiveCredits = passedResults
      .filter(r => {
        const cat = r.courseOffering?.subject?.category?.toUpperCase();
        return cat === 'ELECTIVE' || cat === 'GENERAL';
      })
      .reduce((sum, r) => sum + (r.creditHours || 0), 0);

    // Keyword detection in passed subjects for experiential requirements
    const completedInternship = passedResults.some(r => {
      const name = r.courseOffering?.subject?.name?.toLowerCase() || '';
      return name.includes('internship') || name.includes('practicum') || name.includes('industrial training');
    });

    const completedProject = passedResults.some(r => {
      const name = r.courseOffering?.subject?.name?.toLowerCase() || '';
      return name.includes('project') || name.includes('fyp') || name.includes('capstone');
    });

    const completedThesis = passedResults.some(r => {
      const name = r.courseOffering?.subject?.name?.toLowerCase() || '';
      return name.includes('thesis') || name.includes('dissertation');
    });

    const completedComprehensiveExam = passedResults.some(r => {
      const name = r.courseOffering?.subject?.name?.toLowerCase() || '';
      return name.includes('comprehensive') || name.includes('viva');
    });

    // Failed & Repeated course calculations
    const failedCourses = results.filter(r => r.passStatus === 'Fail').length;

    // Count repeated courses: any subject id appearing multiple times in results
    const subjectEnrollmentsCount: Record<number, number> = {};
    results.forEach(r => {
      const subId = r.courseOffering?.subject?.id;
      if (subId) {
        subjectEnrollmentsCount[subId] = (subjectEnrollmentsCount[subId] || 0) + 1;
      }
    });
    const repeatedCourses = Object.values(subjectEnrollmentsCount).filter(count => count > 1).length;

    // Retrieve or calculate CGPA
    let currentCGPA = student.cgpaRecords?.[0]?.cgpa || 0.0;
    if (currentCGPA === 0.0 && results.length > 0) {
      const totalPoints = results.reduce((sum, r) => sum + ((r.gradePoint || 0) * (r.creditHours || 0)), 0);
      const totalCredits = results.reduce((sum, r) => sum + (r.creditHours || 0), 0);
      currentCGPA = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;
    }

    // 4. Verify Academic Standing restrictions (Probation/Suspension status)
    const isProbation = currentCGPA < reqs.minimumCGPA;
    const isSuspended = student.status === 'SUSPENDED';

    // 5. Automatic Eligibility Determination
    let isEligible = true;
    const missingReasons: string[] = [];

    if (completedCredits < reqs.minimumCreditHours) {
      isEligible = false;
      missingReasons.push(`Earned credits (${completedCredits}) < Required credits (${reqs.minimumCreditHours})`);
    }
    if (currentCGPA < reqs.minimumCGPA) {
      isEligible = false;
      missingReasons.push(`CGPA (${currentCGPA}) < Required CGPA (${reqs.minimumCGPA})`);
    }
    if (failedCourses > reqs.maximumFailedCourses) {
      isEligible = false;
      missingReasons.push(`Failed courses (${failedCourses}) exceeds allowance (${reqs.maximumFailedCourses})`);
    }
    if (repeatedCourses > reqs.maximumRepeatedCourses) {
      isEligible = false;
      missingReasons.push(`Repeated courses (${repeatedCourses}) exceeds allowance (${reqs.maximumRepeatedCourses})`);
    }
    if (completedCoreCredits < reqs.minimumCoreCredits) {
      isEligible = false;
      missingReasons.push(`Core Credits (${completedCoreCredits}) < Required Core Credits (${reqs.minimumCoreCredits})`);
    }
    if (completedElectiveCredits < reqs.minimumElectiveCredits) {
      isEligible = false;
      missingReasons.push(`Elective Credits (${completedElectiveCredits}) < Required Elective Credits (${reqs.minimumElectiveCredits})`);
    }
    if (reqs.internshipRequired && !completedInternship) {
      isEligible = false;
      missingReasons.push('Internship is required but not completed.');
    }
    if (reqs.projectRequired && !completedProject) {
      isEligible = false;
      missingReasons.push('Final Year Capstone Project is required but not completed.');
    }
    if (reqs.thesisRequired && !completedThesis) {
      isEligible = false;
      missingReasons.push('Thesis is required but not completed.');
    }
    if (reqs.comprehensiveExamRequired && !completedComprehensiveExam) {
      isEligible = false;
      missingReasons.push('Comprehensive Exam is required but not completed.');
    }
    if (isSuspended) {
      isEligible = false;
      missingReasons.push('Student academic standing is under Suspension.');
    }

    const graduationStatus = isEligible ? 'Eligible' : 'Not Eligible';
    const remarks = missingReasons.length > 0 ? `Ineligible due to: ${missingReasons.join(' | ')}` : 'Completed all academic criteria successfully.';

    // 6. Update or Create Audit Record in database
    const existingAudit = await prisma.degreeAudit.findFirst({
      where: { studentId, degreeRequirementId: reqs.id },
    });

    let auditRecord;
    if (existingAudit) {
      auditRecord = await prisma.degreeAudit.update({
        where: { id: existingAudit.id },
        data: {
          completedCredits,
          remainingCredits,
          completedCoreCredits,
          completedElectiveCredits,
          completedInternship,
          completedProject,
          completedThesis,
          completedComprehensiveExam,
          failedCourses,
          repeatedCourses,
          currentCGPA,
          graduationStatus,
          remarks,
        },
      });
    } else {
      auditRecord = await prisma.degreeAudit.create({
        data: {
          studentId,
          degreeRequirementId: reqs.id,
          completedCredits,
          remainingCredits,
          completedCoreCredits,
          completedElectiveCredits,
          completedInternship,
          completedProject,
          completedThesis,
          completedComprehensiveExam,
          failedCourses,
          repeatedCourses,
          currentCGPA,
          graduationStatus,
          remarks,
        },
      });
    }

    const responsePayload = {
      ...auditRecord,
      student: {
        id: student.id,
        fullName: student.fullName,
        registrationNumber: student.registrationNumber,
        departmentName: student.department.name,
        programName: student.program.name,
      },
      requirements: reqs,
      missingReasons,
    };

    // Trigger Realtime Socket notification
    notifyDegreeAuditChange('AUDIT_RUN', responsePayload);

    // Log in Audit Trail
    await auditService.log({
      action: 'AUDIT_GENERATED',
      tableName: 'DegreeAudit',
      userId: student.userId,
      recordId: String(auditRecord.id),
      newValue: responsePayload,
    });

    return responsePayload;
  }

  /**
   * Run What-If graduation simulation
   */
  async simulateWhatIf(studentId: number, simulatedSubjectIds: number[]) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        department: true,
        results: {
          where: { approvalStatus: 'Published' },
          include: {
            courseOffering: {
              include: {
                subject: true,
              },
            },
          },
        },
        cgpaRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found.`);
    }

    const reqs = await this.ensureDegreeRequirement(student.programId, student.departmentId);

    // Fetch simulated subjects
    const simulatedSubjects = await prisma.subject.findMany({
      where: { id: { in: simulatedSubjectIds } },
    });

    // Merge actual and simulated records
    const results = student.results || [];
    const passedResults = results.filter(r => r.passStatus === 'Pass');

    // Keep track of subjects student has already passed so we don't duplicate
    const passedSubjectIds = new Set(passedResults.map(r => r.courseOffering?.subject?.id));

    // Simulated passed results
    const simulatedPasses = simulatedSubjects
      .filter(sub => !passedSubjectIds.has(sub.id))
      .map(sub => ({
        creditHours: sub.creditHours,
        grade: 'A',
        gradePoint: 4.0,
        passStatus: 'Pass',
        courseOffering: {
          subject: sub,
        },
      }));

    const allVirtualPasses = [...passedResults, ...simulatedPasses];

    // Compute metrics
    const completedCredits = allVirtualPasses.reduce((sum, r) => sum + (r.creditHours || 0), 0);
    const remainingCredits = Math.max(0, reqs.minimumCreditHours - completedCredits);

    const completedCoreCredits = allVirtualPasses
      .filter(r => r.courseOffering?.subject?.category?.toUpperCase() === 'CORE')
      .reduce((sum, r) => sum + (r.creditHours || 0), 0);

    const completedElectiveCredits = allVirtualPasses
      .filter(r => {
        const cat = r.courseOffering?.subject?.category?.toUpperCase();
        return cat === 'ELECTIVE' || cat === 'GENERAL';
      })
      .reduce((sum, r) => sum + (r.creditHours || 0), 0);

    const completedInternship = allVirtualPasses.some(r => {
      const name = r.courseOffering?.subject?.name?.toLowerCase() || '';
      return name.includes('internship') || name.includes('practicum') || name.includes('industrial training');
    });

    const completedProject = allVirtualPasses.some(r => {
      const name = r.courseOffering?.subject?.name?.toLowerCase() || '';
      return name.includes('project') || name.includes('fyp') || name.includes('capstone');
    });

    const completedThesis = allVirtualPasses.some(r => {
      const name = r.courseOffering?.subject?.name?.toLowerCase() || '';
      return name.includes('thesis') || name.includes('dissertation');
    });

    const completedComprehensiveExam = allVirtualPasses.some(r => {
      const name = r.courseOffering?.subject?.name?.toLowerCase() || '';
      return name.includes('comprehensive') || name.includes('viva');
    });

    // Simulate CGPA
    const totalActualPoints = results.reduce((sum, r) => sum + ((r.gradePoint || 0) * (r.creditHours || 0)), 0);
    const totalActualCredits = results.reduce((sum, r) => sum + (r.creditHours || 0), 0);

    const totalSimPoints = simulatedPasses.reduce((sum, r) => sum + (r.gradePoint * r.creditHours), 0);
    const totalSimCredits = simulatedPasses.reduce((sum, r) => sum + r.creditHours, 0);

    const currentCGPA = (totalActualCredits + totalSimCredits) > 0
      ? Number(((totalActualPoints + totalSimPoints) / (totalActualCredits + totalSimCredits)).toFixed(2))
      : 0.0;

    // Failed / repeats stay same in simulation unless passing them clears failed ones. We keep simple.
    const failedCourses = results.filter(r => r.passStatus === 'Fail').length;
    const repeatedCourses = 0; // Simulated repeatable stats remain intact.

    // Calculate Graduation Probability
    let score = 0;
    const maxScore = 7;

    if (completedCredits >= reqs.minimumCreditHours) score++;
    if (currentCGPA >= reqs.minimumCGPA) score++;
    if (completedCoreCredits >= reqs.minimumCoreCredits) score++;
    if (completedElectiveCredits >= reqs.minimumElectiveCredits) score++;
    if (!reqs.internshipRequired || completedInternship) score++;
    if (!reqs.projectRequired || completedProject) score++;
    if (!reqs.thesisRequired || completedThesis) score++;

    const probability = Number(((score / maxScore) * 100).toFixed(0));

    // Determine hypothetical eligibility
    let isEligible = true;
    const missingReasons: string[] = [];

    if (completedCredits < reqs.minimumCreditHours) {
      isEligible = false;
      missingReasons.push(`Earned credits (${completedCredits}/${reqs.minimumCreditHours})`);
    }
    if (currentCGPA < reqs.minimumCGPA) {
      isEligible = false;
      missingReasons.push(`CGPA (${currentCGPA}/${reqs.minimumCGPA})`);
    }
    if (completedCoreCredits < reqs.minimumCoreCredits) {
      isEligible = false;
      missingReasons.push(`Core Credits (${completedCoreCredits}/${reqs.minimumCoreCredits})`);
    }
    if (completedElectiveCredits < reqs.minimumElectiveCredits) {
      isEligible = false;
      missingReasons.push(`Elective Credits (${completedElectiveCredits}/${reqs.minimumElectiveCredits})`);
    }
    if (reqs.internshipRequired && !completedInternship) {
      isEligible = false;
      missingReasons.push('Internship completion');
    }
    if (reqs.projectRequired && !completedProject) {
      isEligible = false;
      missingReasons.push('Capstone Project completion');
    }

    const simulationResult = {
      isEligible,
      completedCredits,
      remainingCredits,
      completedCoreCredits,
      completedElectiveCredits,
      completedInternship,
      completedProject,
      completedThesis,
      completedComprehensiveExam,
      failedCourses,
      repeatedCourses,
      currentCGPA,
      probability,
      missingReasons,
      requirements: reqs,
    };

    // Log the simulation event
    await auditService.log({
      action: 'SIMULATION_EXECUTED',
      tableName: 'DegreeAudit',
      userId: student.userId,
      recordId: String(student.id),
      newValue: simulationResult,
    });

    return simulationResult;
  }

  /**
   * Graduation Application methods
   */
  async listGraduationApplications(filters: { studentId?: number; status?: string } = {}) {
    const whereClause: any = {};
    if (filters.studentId) whereClause.studentId = filters.studentId;
    if (filters.status) whereClause.status = filters.status;

    return prisma.graduationApplication.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGraduationApplication(data: { studentId: number; graduationTerm: string; graduationYear: number }) {
    // Check if application already exists for this term/year
    const existing = await prisma.graduationApplication.findFirst({
      where: {
        studentId: data.studentId,
        status: { in: ['Draft', 'Submitted', 'Under Review', 'Approved'] },
      },
    });

    if (existing) {
      throw new Error('You already have an active or pending graduation application.');
    }

    // Generate unique application number
    const rand = Math.floor(1000 + Math.random() * 9000);
    const applicationNumber = `GRAD-${data.graduationYear}-${rand}`;

    const app = await prisma.graduationApplication.create({
      data: {
        studentId: data.studentId,
        applicationNumber,
        graduationTerm: data.graduationTerm,
        graduationYear: data.graduationYear,
        status: 'Submitted',
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
      },
    });

    notifyDegreeAuditChange('APPLICATION_SUBMITTED', app);

    await auditService.log({
      action: 'GRADUATION_APPLICATION_SUBMITTED',
      tableName: 'GraduationApplication',
      userId: app.student.userId,
      recordId: String(app.id),
      newValue: app,
    });

    return app;
  }

  async updateGraduationApplication(id: number, status: string, remarks?: string, reviewerName?: string) {
    const existing = await prisma.graduationApplication.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!existing) {
      throw new Error('Graduation application not found.');
    }

    const updated = await prisma.graduationApplication.update({
      where: { id },
      data: {
        status,
        remarks,
        reviewedBy: reviewerName,
        reviewedAt: new Date(),
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
      },
    });

    const actionType = status === 'Approved' ? 'APPLICATION_APPROVED' : status === 'Rejected' ? 'APPLICATION_REJECTED' : 'APPLICATION_GRADUATED';
    notifyDegreeAuditChange(actionType as any, updated);

    await auditService.log({
      action: status === 'Approved' ? 'GRADUATION_APPROVED' : status === 'Rejected' ? 'GRADUATION_REJECTED' : 'GRADUATION_UPDATED',
      tableName: 'GraduationApplication',
      userId: updated.student.userId,
      recordId: String(updated.id),
      newValue: updated,
    });

    // If application status changed to 'Graduated', update student's academic status to GRADUATED
    if (status === 'Graduated') {
      await prisma.student.update({
        where: { id: updated.studentId },
        data: { status: 'GRADUATED' },
      });
    }

    return updated;
  }
}

export const degreeAuditService = new DegreeAuditService();
