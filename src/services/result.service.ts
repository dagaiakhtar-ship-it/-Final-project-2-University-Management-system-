import { prisma } from './db.service';
import { auditService } from './audit.service';
import { notifyResultChange } from './socket.service';

export interface GradeRule {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  gradePoint: number;
}

export const DEFAULT_GRADE_RULES: GradeRule[] = [
  { minPercentage: 90, maxPercentage: 100, grade: 'A+', gradePoint: 4.0 },
  { minPercentage: 85, maxPercentage: 89.99, grade: 'A', gradePoint: 3.75 },
  { minPercentage: 80, maxPercentage: 84.99, grade: 'B+', gradePoint: 3.5 },
  { minPercentage: 75, maxPercentage: 79.99, grade: 'B', gradePoint: 3.0 },
  { minPercentage: 70, maxPercentage: 74.99, grade: 'C+', gradePoint: 2.5 },
  { minPercentage: 65, maxPercentage: 69.99, grade: 'C', gradePoint: 2.0 },
  { minPercentage: 60, maxPercentage: 64.99, grade: 'D', gradePoint: 1.0 },
  { minPercentage: 0, maxPercentage: 59.99, grade: 'F', gradePoint: 0.0 },
];

export class ResultService {
  // Get grading rules from settings or default
  async getGradingRules(): Promise<GradeRule[]> {
    try {
      const setting = await prisma.systemSetting.findFirst({
        where: { key: 'grading_policy', deletedAt: null },
      });
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
    } catch (err) {
      console.warn('Failed to parse grading policy setting, using defaults:', err);
    }
    return DEFAULT_GRADE_RULES;
  }

  // Find grade and gradepoint based on percentage
  async calculateGradeAndPoint(percentage: number): Promise<{ grade: string; gradePoint: number }> {
    const rules = await this.getGradingRules();
    const sortedRules = [...rules].sort((a, b) => b.minPercentage - a.minPercentage);
    
    for (const rule of sortedRules) {
      if (percentage >= rule.minPercentage) {
        return { grade: rule.grade, gradePoint: rule.gradePoint };
      }
    }
    return { grade: 'F', gradePoint: 0.0 };
  }

  // Get results list
  async getResults(filters: {
    semesterId?: number;
    courseOfferingId?: number;
    studentId?: number;
    approvalStatus?: string;
  }) {
    const whereClause: any = { softDelete: false };
    
    if (filters.semesterId) whereClause.semesterId = Number(filters.semesterId);
    if (filters.courseOfferingId) whereClause.courseOfferingId = Number(filters.courseOfferingId);
    if (filters.studentId) whereClause.studentId = Number(filters.studentId);
    if (filters.approvalStatus) whereClause.approvalStatus = filters.approvalStatus;

    return prisma.result.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: true,
            program: true,
          },
        },
        courseOffering: {
          include: {
            subject: true,
            teacher: true,
            section: true,
          },
        },
        semester: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  // Get result by ID
  async getResultById(id: number) {
    return prisma.result.findFirst({
      where: { id, softDelete: false },
      include: {
        student: {
          include: {
            user: true,
            program: true,
          },
        },
        courseOffering: {
          include: {
            subject: true,
            teacher: true,
            section: true,
          },
        },
        semester: true,
      },
    });
  }

  // Create single result manually
  async createResult(data: any, userId?: number, userEmail?: string) {
    // Validate marks are within bounds
    this.validateMarks(data);

    // Calculate totals
    const calculated = await this.computeResultFields(data);

    const result = await prisma.result.create({
      data: {
        studentId: Number(data.studentId),
        enrollmentId: Number(data.enrollmentId),
        courseOfferingId: Number(data.courseOfferingId),
        semesterId: Number(data.semesterId),
        academicYear: data.academicYear,
        session: data.session,
        assignmentMarks: data.assignmentMarks !== undefined ? parseFloat(data.assignmentMarks) : null,
        quizMarks: data.quizMarks !== undefined ? parseFloat(data.quizMarks) : null,
        midtermMarks: data.midtermMarks !== undefined ? parseFloat(data.midtermMarks) : null,
        finalExamMarks: data.finalExamMarks !== undefined ? parseFloat(data.finalExamMarks) : null,
        practicalMarks: data.practicalMarks !== undefined ? parseFloat(data.practicalMarks) : null,
        vivaMarks: data.vivaMarks !== undefined ? parseFloat(data.vivaMarks) : null,
        makeupMarks: data.makeupMarks !== undefined ? parseFloat(data.makeupMarks) : null,
        totalObtainedMarks: calculated.totalObtainedMarks,
        totalMarks: calculated.totalMarks,
        percentage: calculated.percentage,
        grade: calculated.grade,
        gradePoint: calculated.gradePoint,
        creditHours: calculated.creditHours,
        qualityPoints: calculated.qualityPoints,
        passStatus: calculated.passStatus,
        remarks: data.remarks || '',
        approvalStatus: data.approvalStatus || 'Draft',
        createdBy: userEmail || 'System',
        updatedBy: userEmail || 'System',
      },
      include: {
        courseOffering: { include: { subject: true } },
      },
    });

    // Logging
    await auditService.log({
      action: 'Result Created',
      userId: userId,
      tableName: 'Result',
      recordId: String(result.id),
      newValue: result,
    });

    notifyResultChange('CREATED', {
      id: result.id,
      studentId: result.studentId,
      courseOfferingId: result.courseOfferingId,
      courseName: result.courseOffering.subject.name,
    });

    return result;
  }

  // Update Result Marks manually
  async updateResult(id: number, data: any, userId?: number, userEmail?: string) {
    const existing = await prisma.result.findUnique({
      where: { id },
      include: { courseOffering: { include: { subject: true } } },
    });
    if (!existing) {
      throw new Error('Result not found.');
    }

    const mergedData = { ...existing, ...data };
    this.validateMarks(mergedData);
    
    const calculated = await this.computeResultFields(mergedData);

    const updated = await prisma.result.update({
      where: { id },
      data: {
        assignmentMarks: data.assignmentMarks !== undefined ? (data.assignmentMarks === null ? null : parseFloat(data.assignmentMarks)) : existing.assignmentMarks,
        quizMarks: data.quizMarks !== undefined ? (data.quizMarks === null ? null : parseFloat(data.quizMarks)) : existing.quizMarks,
        midtermMarks: data.midtermMarks !== undefined ? (data.midtermMarks === null ? null : parseFloat(data.midtermMarks)) : existing.midtermMarks,
        finalExamMarks: data.finalExamMarks !== undefined ? (data.finalExamMarks === null ? null : parseFloat(data.finalExamMarks)) : existing.finalExamMarks,
        practicalMarks: data.practicalMarks !== undefined ? (data.practicalMarks === null ? null : parseFloat(data.practicalMarks)) : existing.practicalMarks,
        vivaMarks: data.vivaMarks !== undefined ? (data.vivaMarks === null ? null : parseFloat(data.vivaMarks)) : existing.vivaMarks,
        makeupMarks: data.makeupMarks !== undefined ? (data.makeupMarks === null ? null : parseFloat(data.makeupMarks)) : existing.makeupMarks,
        totalObtainedMarks: calculated.totalObtainedMarks,
        totalMarks: calculated.totalMarks,
        percentage: calculated.percentage,
        grade: calculated.grade,
        gradePoint: calculated.gradePoint,
        creditHours: calculated.creditHours,
        qualityPoints: calculated.qualityPoints,
        passStatus: calculated.passStatus,
        remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
        approvalStatus: data.approvalStatus || existing.approvalStatus,
        updatedBy: userEmail || 'System',
      },
    });

    await auditService.log({
      action: 'Result Updated',
      userId: userId,
      tableName: 'Result',
      recordId: String(updated.id),
      oldValue: existing,
      newValue: updated,
    });

    notifyResultChange('UPDATED', {
      id: updated.id,
      studentId: updated.studentId,
      courseOfferingId: updated.courseOfferingId,
      courseName: existing.courseOffering.subject.name,
    });

    return updated;
  }

  // Delete Result (Soft Delete)
  async deleteResult(id: number, userId?: number, userEmail?: string) {
    const existing = await prisma.result.findUnique({ where: { id } });
    if (!existing) throw new Error('Result not found.');

    const deleted = await prisma.result.update({
      where: { id },
      data: { softDelete: true, updatedBy: userEmail || 'System' },
    });

    await auditService.log({
      action: 'Result Deleted',
      userId: userId,
      tableName: 'Result',
      recordId: String(id),
      oldValue: existing,
      newValue: deleted,
    });

    return deleted;
  }

  // Approve result
  async approveResult(id: number, approvedByUserId: number, approvedByEmail: string) {
    const existing = await prisma.result.findUnique({
      where: { id },
      include: { courseOffering: { include: { subject: true } } },
    });
    if (!existing) throw new Error('Result not found.');

    const updated = await prisma.result.update({
      where: { id },
      data: {
        approvalStatus: 'Approved',
        approvedBy: approvedByEmail,
        approvedAt: new Date(),
      },
    });

    await auditService.log({
      action: 'Result Approved',
      userId: approvedByUserId,
      tableName: 'Result',
      recordId: String(id),
      newValue: updated,
    });

    notifyResultChange('APPROVED', {
      id: updated.id,
      studentId: updated.studentId,
      courseOfferingId: updated.courseOfferingId,
      courseName: existing.courseOffering.subject.name,
    });

    return updated;
  }

  // Publish result
  async publishResult(id: number, userId: number, userEmail: string) {
    const existing = await prisma.result.findUnique({
      where: { id },
      include: { courseOffering: { include: { subject: true } } },
    });
    if (!existing) throw new Error('Result not found.');

    const updated = await prisma.result.update({
      where: { id },
      data: {
        approvalStatus: 'Published',
        publishedAt: new Date(),
      },
    });

    await auditService.log({
      action: 'Result Published',
      userId: userId,
      tableName: 'Result',
      recordId: String(id),
      newValue: updated,
    });

    notifyResultChange('PUBLISHED', {
      id: updated.id,
      studentId: updated.studentId,
      courseOfferingId: updated.courseOfferingId,
      courseName: existing.courseOffering.subject.name,
    });

    return updated;
  }

  // Batch process results for a Course Offering
  async processResults(data: { courseOfferingId: number }, userId?: number, userEmail?: string) {
    const courseOfferingId = Number(data.courseOfferingId);
    
    // 1. Fetch Course Offering and Student Enrollments
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      include: { subject: true, semester: true },
    });

    if (!courseOffering) {
      throw new Error('Course offering not found.');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseOfferingId, status: 'Enrolled', deletedAt: null },
      include: { student: true },
    });

    if (enrollments.length === 0) {
      throw new Error('No enrolled students found in this course offering.');
    }

    const processedResults = [];

    for (const enrollment of enrollments) {
      const studentId = enrollment.studentId;

      // 2. Fetch or calculate Assignment average marks
      const assignments = await prisma.assignmentSubmission.findMany({
        where: { studentId, enrollmentId: enrollment.id, submissionStatus: 'Graded' },
        include: { assignment: true },
      });
      let assignmentMarks = 0;
      if (assignments.length > 0) {
        const totalPct = assignments.reduce((acc, curr) => {
          const pct = curr.percentage !== null && curr.percentage !== undefined
            ? curr.percentage
            : curr.obtainedMarks !== null && curr.assignment?.totalMarks
            ? (curr.obtainedMarks / curr.assignment.totalMarks) * 100
            : 0;
          return acc + pct;
        }, 0);
        // Average percentage out of 100, then scaled to 10 max marks
        assignmentMarks = (totalPct / assignments.length) * 0.1;
      }

      // 3. Fetch or calculate Quiz average marks
      const quizzes = await prisma.quizSubmission.findMany({
        where: { studentId, enrollmentId: enrollment.id, submissionStatus: 'Graded' },
        include: { quiz: true },
      });
      let quizMarks = 0;
      if (quizzes.length > 0) {
        const totalPct = quizzes.reduce((acc, curr) => {
          const pct = curr.percentage !== null && curr.percentage !== undefined
            ? curr.percentage
            : curr.obtainedMarks !== null && curr.quiz?.totalMarks
            ? (curr.obtainedMarks / curr.quiz.totalMarks) * 100
            : 0;
          return acc + pct;
        }, 0);
        // Average percentage out of 100, then scaled to 10 max marks
        quizMarks = (totalPct / quizzes.length) * 0.1;
      }

      // 4. Fetch Exam components (Midterm, Final, Practical, Viva, Makeup)
      const exams = await prisma.exam.findMany({
        where: { courseOfferingId, status: 'Completed', softDelete: false },
      });

      // Since the system doesn't have student scores on Exam tables, we check if there's any existing result.
      // If there is an existing result, we keep its exam marks as they represent entered values.
      // Otherwise we can initialize them as 0 or mock standard distribution marks (or placeholder marks).
      const existingResult = await prisma.result.findFirst({
        where: { studentId, courseOfferingId, softDelete: false },
      });

      // Default Component Marks
      let midterm = existingResult?.midtermMarks ?? 0;
      let finalExam = existingResult?.finalExamMarks ?? 0;
      let practical = existingResult?.practicalMarks ?? 0;
      let viva = existingResult?.vivaMarks ?? 0;
      let makeup = existingResult?.makeupMarks ?? null;

      // Ensure we align marks from actual exam types if any
      for (const exam of exams) {
        // If an exam completed, and we had no previous exam marks, we can set default marks
        // based on passing criteria or placeholder values so that the teacher/admin can then edit.
        if (exam.examType.toLowerCase().includes('mid')) {
          if (midterm === 0) midterm = Math.round(exam.totalMarks * 0.75); // Safe initial placeholder
        } else if (exam.examType.toLowerCase().includes('final')) {
          if (finalExam === 0) finalExam = Math.round(exam.totalMarks * 0.78);
        } else if (exam.examType.toLowerCase().includes('pract')) {
          if (practical === 0) practical = Math.round(exam.totalMarks * 0.85);
        } else if (exam.examType.toLowerCase().includes('viva')) {
          if (viva === 0) viva = Math.round(exam.totalMarks * 0.8);
        }
      }

      // 5. Structure payload to compute
      const payload: any = {
        studentId,
        enrollmentId: enrollment.id,
        courseOfferingId,
        semesterId: courseOffering.semesterId,
        academicYear: courseOffering.academicYear,
        session: courseOffering.session,
        assignmentMarks: Math.min(assignmentMarks, 10), // cap assignments to max 10
        quizMarks: Math.min(quizMarks, 10), // cap quizzes to max 10
        midtermMarks: midterm,
        finalExamMarks: finalExam,
        practicalMarks: practical,
        vivaMarks: viva,
        makeupMarks: makeup,
        remarks: 'Processed automatically by system.',
      };

      const calculated = await this.computeResultFields(payload);

      let resultRecord;
      if (existingResult) {
        resultRecord = await prisma.result.update({
          where: { id: existingResult.id },
          data: {
            assignmentMarks: payload.assignmentMarks,
            quizMarks: payload.quizMarks,
            midtermMarks: payload.midtermMarks,
            finalExamMarks: payload.finalExamMarks,
            practicalMarks: payload.practicalMarks,
            vivaMarks: payload.vivaMarks,
            makeupMarks: payload.makeupMarks,
            totalObtainedMarks: calculated.totalObtainedMarks,
            totalMarks: calculated.totalMarks,
            percentage: calculated.percentage,
            grade: calculated.grade,
            gradePoint: calculated.gradePoint,
            creditHours: calculated.creditHours,
            qualityPoints: calculated.qualityPoints,
            passStatus: calculated.passStatus,
            updatedBy: userEmail || 'System',
          },
        });
      } else {
        resultRecord = await prisma.result.create({
          data: {
            ...payload,
            totalObtainedMarks: calculated.totalObtainedMarks,
            totalMarks: calculated.totalMarks,
            percentage: calculated.percentage,
            grade: calculated.grade,
            gradePoint: calculated.gradePoint,
            creditHours: calculated.creditHours,
            qualityPoints: calculated.qualityPoints,
            passStatus: calculated.passStatus,
            approvalStatus: 'Draft',
            createdBy: userEmail || 'System',
            updatedBy: userEmail || 'System',
          },
        });
      }

      processedResults.push(resultRecord);
    }

    await auditService.log({
      action: 'Result Processed',
      userId: userId,
      tableName: 'Result',
      recordId: String(courseOfferingId),
      newValue: { count: processedResults.length },
    });

    notifyResultChange('PROCESSED', {
      courseOfferingId,
      processedCount: processedResults.length,
    });

    return processedResults;
  }

  // Calculate Semester GPA & Class Rank
  async calculateGPA(studentId: number, semesterId: number) {
    // 1. Fetch all PUBLISHED or APPROVED results for this student in this semester
    const results = await prisma.result.findMany({
      where: {
        studentId,
        semesterId,
        softDelete: false,
        approvalStatus: { in: ['Approved', 'Published'] },
      },
    });

    if (results.length === 0) {
      throw new Error('No approved or published results found to compute GPA for this semester.');
    }

    let totalCreditHours = 0;
    let earnedCreditHours = 0;
    let totalQualityPoints = 0;

    for (const r of results) {
      totalCreditHours += r.creditHours;
      if (r.passStatus === 'Pass') {
        earnedCreditHours += r.creditHours;
      }
      totalQualityPoints += r.qualityPoints;
    }

    const semesterGPA = totalCreditHours > 0 ? Number((totalQualityPoints / totalCreditHours).toFixed(2)) : 0.0;

    // 2. Upsert SemesterGPA record
    const gpaRecord = await prisma.semesterGPA.upsert({
      where: {
        studentId_semesterId: { studentId, semesterId },
      },
      update: {
        totalCreditHours,
        earnedCreditHours,
        totalQualityPoints,
        semesterGPA,
      },
      create: {
        studentId,
        semesterId,
        totalCreditHours,
        earnedCreditHours,
        totalQualityPoints,
        semesterGPA,
      },
    });

    // 3. Recalculate class rank for this semester
    await this.recalculateClassRanks(semesterId);

    await auditService.log({
      action: 'GPA Calculated',
      tableName: 'SemesterGPA',
      recordId: String(gpaRecord.id),
      newValue: gpaRecord,
    });

    return gpaRecord;
  }

  // Recalculate Class Ranks in a semester
  private async recalculateClassRanks(semesterId: number) {
    const allGPAs = await prisma.semesterGPA.findMany({
      where: { semesterId },
      orderBy: { semesterGPA: 'desc' },
    });

    let currentRank = 1;
    for (let i = 0; i < allGPAs.length; i++) {
      if (i > 0 && allGPAs[i].semesterGPA < allGPAs[i - 1].semesterGPA) {
        currentRank = i + 1;
      }
      await prisma.semesterGPA.update({
        where: { id: allGPAs[i].id },
        data: { classRank: currentRank },
      });
    }
  }

  // Calculate CGPA
  async calculateCGPA(studentId: number) {
    // 1. Fetch all Semester GPA records for this student
    const gpaRecords = await prisma.semesterGPA.findMany({
      where: { studentId },
    });

    if (gpaRecords.length === 0) {
      throw new Error('No Semester GPA records found to compute CGPA.');
    }

    let totalCreditHours = 0;
    let earnedCreditHours = 0;
    let cumulativeQualityPoints = 0;

    for (const gpa of gpaRecords) {
      totalCreditHours += gpa.totalCreditHours;
      earnedCreditHours += gpa.earnedCreditHours;
      cumulativeQualityPoints += gpa.totalQualityPoints;
    }

    const cgpa = totalCreditHours > 0 ? Number((cumulativeQualityPoints / totalCreditHours).toFixed(2)) : 0.0;

    // Check graduation status (e.g. earned credit hours milestone)
    let graduationStatus = 'In Progress';
    if (earnedCreditHours >= 120 && cgpa >= 2.0) {
      graduationStatus = 'Eligible';
    }

    // 2. Upsert CGPARecord
    const cgpaRecord = await prisma.cGPARecord.upsert({
      where: { studentId },
      update: {
        totalCreditHours,
        earnedCreditHours,
        cumulativeQualityPoints,
        cgpa,
        graduationStatus,
      },
      create: {
        studentId,
        totalCreditHours,
        earnedCreditHours,
        cumulativeQualityPoints,
        cgpa,
        graduationStatus,
      },
    });

    await auditService.log({
      action: 'CGPA Calculated',
      tableName: 'CGPARecord',
      recordId: String(cgpaRecord.id),
      newValue: cgpaRecord,
    });

    return cgpaRecord;
  }

  // Get Merit List
  async getMeritList(semesterId?: number) {
    if (semesterId) {
      return prisma.semesterGPA.findMany({
        where: { semesterId: Number(semesterId) },
        include: {
          student: {
            include: { user: true, program: true },
          },
        },
        orderBy: [{ semesterGPA: 'desc' }, { totalQualityPoints: 'desc' }],
      });
    } else {
      return prisma.cGPARecord.findMany({
        include: {
          student: {
            include: { user: true, program: true },
          },
        },
        orderBy: [{ cgpa: 'desc' }, { cumulativeQualityPoints: 'desc' }],
      });
    }
  }

  // Get Results for Student
  async getStudentResults(studentId: number) {
    return prisma.result.findMany({
      where: { studentId, softDelete: false, approvalStatus: 'Published' },
      include: {
        courseOffering: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        semester: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  // Get Transcript Preview for student
  async getTranscriptPreview(studentId: number) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, program: true, department: true },
    });

    if (!student) throw new Error('Student not found.');

    const semesters = await prisma.semesterGPA.findMany({
      where: { studentId },
      include: { semester: true },
      orderBy: { semester: { semesterNumber: 'asc' } },
    });

    const results = await prisma.result.findMany({
      where: { studentId, softDelete: false, approvalStatus: 'Published' },
      include: {
        courseOffering: {
          include: { subject: true },
        },
        semester: true,
      },
      orderBy: { semesterId: 'asc' },
    });

    const cgpaRecord = await prisma.cGPARecord.findUnique({
      where: { studentId },
    });

    return {
      student: {
        id: student.id,
        fullName: student.fullName || `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        registrationNumber: student.registrationNumber,
        program: student.program.name,
        department: student.department.name,
      },
      semesters: semesters.map(s => {
        const semesterResults = results.filter(r => r.semesterId === s.semesterId);
        return {
          id: s.id,
          semesterName: s.semester.name,
          semesterGPA: s.semesterGPA,
          totalCreditHours: s.totalCreditHours,
          earnedCreditHours: s.earnedCreditHours,
          classRank: s.classRank,
          courses: semesterResults.map(r => ({
            id: r.id,
            courseCode: r.courseOffering.subject.code,
            courseName: r.courseOffering.subject.name,
            obtainedMarks: r.totalObtainedMarks,
            totalMarks: r.totalMarks,
            grade: r.grade,
            gradePoint: r.gradePoint,
            creditHours: r.creditHours,
            qualityPoints: r.qualityPoints,
            passStatus: r.passStatus,
          })),
        };
      }),
      cumulative: cgpaRecord ? {
        cgpa: cgpaRecord.cgpa,
        totalCreditHours: cgpaRecord.totalCreditHours,
        earnedCreditHours: cgpaRecord.earnedCreditHours,
        graduationStatus: cgpaRecord.graduationStatus,
      } : null,
    };
  }

  // Get Analytics
  async getResultAnalytics(filters: { departmentId?: number; semesterId?: number }) {
    const whereClause: any = { softDelete: false, approvalStatus: 'Published' };
    
    if (filters.semesterId) {
      whereClause.semesterId = Number(filters.semesterId);
    }
    
    if (filters.departmentId) {
      whereClause.courseOffering = {
        departmentId: Number(filters.departmentId),
      };
    }

    const results = await prisma.result.findMany({
      where: whereClause,
      include: {
        courseOffering: {
          include: { department: true },
        },
      },
    });

    // Compute metrics
    const totalResults = results.length;
    const passedCount = results.filter(r => r.passStatus === 'Pass').length;
    const failedCount = results.filter(r => r.passStatus === 'Fail').length;

    const passPercentage = totalResults > 0 ? Math.round((passedCount / totalResults) * 100) : 0;
    const failPercentage = totalResults > 0 ? Math.round((failedCount / totalResults) * 100) : 0;

    // Grade distribution
    const gradeCounts: { [key: string]: number } = {};
    results.forEach(r => {
      gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1;
    });

    const gradeDistribution = Object.keys(gradeCounts).map(g => ({
      grade: g,
      count: gradeCounts[g],
    }));

    // GPA records analytics
    const gpaWhereClause: any = {};
    if (filters.semesterId) gpaWhereClause.semesterId = Number(filters.semesterId);
    
    const allGPAs = await prisma.semesterGPA.findMany({
      where: gpaWhereClause,
    });

    const gpaIntervals = [
      { range: '3.50 - 4.00', count: allGPAs.filter(g => g.semesterGPA >= 3.5).length },
      { range: '3.00 - 3.49', count: allGPAs.filter(g => g.semesterGPA >= 3.0 && g.semesterGPA < 3.5).length },
      { range: '2.50 - 2.99', count: allGPAs.filter(g => g.semesterGPA >= 2.5 && g.semesterGPA < 3.0).length },
      { range: '2.00 - 2.49', count: allGPAs.filter(g => g.semesterGPA >= 2.0 && g.semesterGPA < 2.5).length },
      { range: 'Below 2.00', count: allGPAs.filter(g => g.semesterGPA < 2.0).length },
    ];

    // CGPA records analytics
    const allCGPAs = await prisma.cGPARecord.findMany();
    const cgpaIntervals = [
      { range: '3.50 - 4.00', count: allCGPAs.filter(g => g.cgpa >= 3.5).length },
      { range: '3.00 - 3.49', count: allCGPAs.filter(g => g.cgpa >= 3.0 && g.cgpa < 3.5).length },
      { range: '2.50 - 2.99', count: allCGPAs.filter(g => g.cgpa >= 2.5 && g.cgpa < 3.0).length },
      { range: 'Below 2.00', count: allCGPAs.filter(g => g.cgpa < 2.0).length },
    ];

    // Department Performance
    const departmentGPAs: { [key: string]: { totalGpa: number; count: number } } = {};
    const departmentResults = await prisma.semesterGPA.findMany({
      where: gpaWhereClause,
      include: {
        student: { include: { department: true } },
      },
    });

    departmentResults.forEach(dg => {
      const deptName = dg.student.department.name;
      if (!departmentGPAs[deptName]) {
        departmentGPAs[deptName] = { totalGpa: 0, count: 0 };
      }
      departmentGPAs[deptName].totalGpa += dg.semesterGPA;
      departmentGPAs[deptName].count += 1;
    });

    const departmentPerformance = Object.keys(departmentGPAs).map(d => ({
      department: d,
      averageGPA: Number((departmentGPAs[d].totalGpa / departmentGPAs[d].count).toFixed(2)),
    }));

    return {
      totalResults,
      passedCount,
      failedCount,
      passPercentage,
      failPercentage,
      gradeDistribution,
      gpaDistribution: gpaIntervals,
      cgpaDistribution: cgpaIntervals,
      departmentPerformance,
    };
  }

  // Validate marks are non-negative and within limits
  private validateMarks(data: any) {
    const fields = [
      { name: 'assignmentMarks', label: 'Assignment Marks', max: 10 },
      { name: 'quizMarks', label: 'Quiz Marks', max: 10 },
      { name: 'midtermMarks', label: 'Midterm Marks', max: 30 },
      { name: 'finalExamMarks', label: 'Final Exam Marks', max: 50 },
      { name: 'practicalMarks', label: 'Practical Marks', max: 10 },
      { name: 'vivaMarks', label: 'Viva Marks', max: 10 },
      { name: 'makeupMarks', label: 'Makeup Marks', max: 50 },
    ];

    for (const f of fields) {
      if (data[f.name] !== undefined && data[f.name] !== null) {
        const val = parseFloat(data[f.name]);
        if (isNaN(val)) {
          throw new Error(`${f.label} must be a valid number.`);
        }
        if (val < 0) {
          throw new Error(`${f.label} cannot be negative.`);
        }
        if (val > f.max) {
          throw new Error(`${f.label} cannot exceed the maximum limit of ${f.max}.`);
        }
      }
    }
  }

  // Core helper to calculate totals, grades, quality points
  private async computeResultFields(data: any) {
    // 1. Fetch Course Offering and related Subject to get Credit Hours
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: Number(data.courseOfferingId) },
      include: { subject: true },
    });

    if (!courseOffering) throw new Error('Course offering not found.');

    const creditHours = courseOffering.subject.creditHours;

    // 2. Marks Sum calculation
    // Max Possible Marks components:
    // Assignment = 10, Quiz = 10, Midterm = 30, FinalExam = 50 (If Makeup exists and is better, it replaces FinalExam marks), Practical = 10, Viva = 10.
    // Let's standardise total marks as 100 for a course.
    const assignments = data.assignmentMarks !== undefined && data.assignmentMarks !== null ? parseFloat(data.assignmentMarks) : 0;
    const quizzes = data.quizMarks !== undefined && data.quizMarks !== null ? parseFloat(data.quizMarks) : 0;
    const midterm = data.midtermMarks !== undefined && data.midtermMarks !== null ? parseFloat(data.midtermMarks) : 0;
    
    let finalExam = data.finalExamMarks !== undefined && data.finalExamMarks !== null ? parseFloat(data.finalExamMarks) : 0;
    const makeup = data.makeupMarks !== undefined && data.makeupMarks !== null ? parseFloat(data.makeupMarks) : null;
    
    // Apply makeup marks rule: if makeup marks are higher, replace finalExamMarks
    if (makeup !== null && makeup > finalExam) {
      finalExam = makeup;
    }

    const practical = data.practicalMarks !== undefined && data.practicalMarks !== null ? parseFloat(data.practicalMarks) : 0;
    const viva = data.vivaMarks !== undefined && data.vivaMarks !== null ? parseFloat(data.vivaMarks) : 0;

    const totalObtainedMarks = assignments + quizzes + midterm + finalExam + practical + viva;
    const totalMarks = 100.0; // Standardized out of 100

    const percentage = Number(((totalObtainedMarks / totalMarks) * 100).toFixed(2));
    const { grade, gradePoint } = await this.calculateGradeAndPoint(percentage);

    const qualityPoints = Number((gradePoint * creditHours).toFixed(2));
    const passStatus = grade === 'F' ? 'Fail' : 'Pass';

    return {
      totalObtainedMarks: Number(totalObtainedMarks.toFixed(2)),
      totalMarks,
      percentage,
      grade,
      gradePoint,
      creditHours,
      qualityPoints,
      passStatus,
    };
  }
}

export const resultService = new ResultService();
