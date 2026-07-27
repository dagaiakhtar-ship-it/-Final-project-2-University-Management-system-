import { prisma } from './db.service';
import { assignmentRepository, AssignmentWithRelations, SubmissionWithRelations } from '../repositories/assignment.repository';
import { auditService } from './audit.service';
import { notifyAssignmentChange } from './socket.service';
import { Prisma, Assignment, AssignmentSubmission } from '@prisma/client';

export class AssignmentService {
  // --- Assignment Management ---

  async createAssignment(data: any, userId: number, userRole: string): Promise<Assignment> {
    const {
      title,
      description,
      instructions,
      courseOfferingId,
      totalMarks,
      passingMarks,
      assignmentType,
      publishDate,
      dueDate,
      allowLateSubmission,
      latePenaltyPercentage,
      maxAttempts,
      attachments,
      visibilityStatus = 'Draft',
    } = data;

    // Validate course offering exists
    const offering = await prisma.courseOffering.findUnique({
      where: { id: parseInt(courseOfferingId) },
    });
    if (!offering) {
      throw new Error('Invalid course offering.');
    }

    // Role check: If teacher, verify they are assigned to this course offering
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || offering.teacherId !== teacher.id) {
        throw new Error('Forbidden: You can only manage assignments for your assigned course offerings.');
      }
    }

    // Validations
    const parsedPublish = new Date(publishDate);
    const parsedDue = new Date(dueDate);

    if (isNaN(parsedPublish.getTime())) {
      throw new Error('Invalid publish date.');
    }
    if (isNaN(parsedDue.getTime())) {
      throw new Error('Invalid due date.');
    }
    if (parsedPublish > parsedDue) {
      throw new Error('Publish date cannot be after due date.');
    }
    if (parseFloat(totalMarks) <= 0) {
      throw new Error('Total marks must be greater than zero.');
    }
    if (parseFloat(passingMarks) < 0 || parseFloat(passingMarks) > parseFloat(totalMarks)) {
      throw new Error('Passing marks must be between 0 and total marks.');
    }
    const penaltyPct = parseFloat(latePenaltyPercentage || 0);
    if (penaltyPct < 0 || penaltyPct > 100) {
      throw new Error('Late penalty percentage must be between 0 and 100.');
    }
    const attemptsCount = parseInt(maxAttempts || 1);
    if (attemptsCount < 1) {
      throw new Error('Maximum attempts must be at least 1.');
    }

    // Resolve teacherId
    let creatorTeacherId = offering.teacherId;
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (teacher) creatorTeacherId = teacher.id;
    }

    // Generate unique assignment code: ASG-YYYY-Random
    const year = new Date(publishDate).getFullYear();
    let assignmentCode = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      assignmentCode = `ASG-${year}-${randomSuffix}`;
      const existing = await prisma.assignment.findUnique({
        where: { assignmentCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }
    if (!isUnique) {
      assignmentCode = `ASG-${year}-${Date.now().toString().slice(-4)}`;
    }

    const assignment = await assignmentRepository.create({
      assignmentCode,
      title,
      description,
      instructions,
      courseOfferingId: parseInt(courseOfferingId),
      teacherId: creatorTeacherId,
      totalMarks: parseFloat(totalMarks),
      passingMarks: parseFloat(passingMarks),
      assignmentType,
      publishDate: new Date(publishDate),
      dueDate: new Date(dueDate),
      allowLateSubmission: !!allowLateSubmission,
      latePenaltyPercentage: parseFloat(latePenaltyPercentage || 0),
      maxAttempts: parseInt(maxAttempts || 1),
      attachments: attachments ? String(attachments) : null,
      visibilityStatus,
      createdBy: String(userId),
    });

    // Audit log
    await auditService.log({
      action: 'Assignment Created',
      tableName: 'Assignment',
      recordId: String(assignment.id),
      newValue: assignment,
      userId,
    });

    // Notify students in course offering if published
    if (visibilityStatus === 'Published') {
      notifyAssignmentChange('PUBLISHED', {
        id: assignment.id,
        title: assignment.title,
        courseOfferingId: assignment.courseOfferingId,
      });
    }

    return assignment;
  }

  async updateAssignment(id: number, data: any, userId: number, userRole: string): Promise<Assignment> {
    const existing = await assignmentRepository.findById(id);
    if (!existing) {
      throw new Error('Assignment not found.');
    }

    // Role check: If teacher, verify they are assigned to this course offering
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || existing.courseOffering.teacherId !== teacher.id) {
        throw new Error('Forbidden: You can only manage assignments for your assigned course offerings.');
      }
    }

    const {
      title,
      description,
      instructions,
      totalMarks,
      passingMarks,
      assignmentType,
      publishDate,
      dueDate,
      allowLateSubmission,
      latePenaltyPercentage,
      maxAttempts,
      attachments,
      visibilityStatus,
    } = data;

    // Validations
    const currentTotalMarks = totalMarks !== undefined ? parseFloat(totalMarks) : existing.totalMarks;
    const currentPassingMarks = passingMarks !== undefined ? parseFloat(passingMarks) : existing.passingMarks;

    if (currentTotalMarks <= 0) {
      throw new Error('Total marks must be greater than zero.');
    }
    if (currentPassingMarks < 0 || currentPassingMarks > currentTotalMarks) {
      throw new Error('Passing marks must be between 0 and total marks.');
    }

    const currentPublishDate = publishDate !== undefined ? new Date(publishDate) : existing.publishDate;
    const currentDueDate = dueDate !== undefined ? new Date(dueDate) : existing.dueDate;

    if (isNaN(currentPublishDate.getTime())) {
      throw new Error('Invalid publish date.');
    }
    if (isNaN(currentDueDate.getTime())) {
      throw new Error('Invalid due date.');
    }
    if (currentPublishDate > currentDueDate) {
      throw new Error('Publish date cannot be after due date.');
    }

    const currentLatePenalty = latePenaltyPercentage !== undefined ? parseFloat(latePenaltyPercentage || 0) : existing.latePenaltyPercentage;
    const currentMaxAttempts = maxAttempts !== undefined ? parseInt(maxAttempts || 1) : existing.maxAttempts;

    if (currentLatePenalty < 0 || currentLatePenalty > 100) {
      throw new Error('Late penalty percentage must be between 0 and 100.');
    }
    if (currentMaxAttempts < 1) {
      throw new Error('Maximum attempts must be at least 1.');
    }

    const updateData: Prisma.AssignmentUncheckedUpdateInput = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (totalMarks !== undefined) updateData.totalMarks = parseFloat(totalMarks);
    if (passingMarks !== undefined) updateData.passingMarks = parseFloat(passingMarks);
    if (assignmentType !== undefined) updateData.assignmentType = assignmentType;
    if (publishDate !== undefined) updateData.publishDate = new Date(publishDate);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (allowLateSubmission !== undefined) updateData.allowLateSubmission = !!allowLateSubmission;
    if (latePenaltyPercentage !== undefined) updateData.latePenaltyPercentage = parseFloat(latePenaltyPercentage || 0);
    if (maxAttempts !== undefined) updateData.maxAttempts = parseInt(maxAttempts || 1);
    if (attachments !== undefined) updateData.attachments = attachments ? String(attachments) : null;
    if (visibilityStatus !== undefined) updateData.visibilityStatus = visibilityStatus;
    updateData.updatedBy = String(userId);

    const updated = await assignmentRepository.update(id, updateData);

    // Audit Log
    await auditService.log({
      action: 'Assignment Updated',
      tableName: 'Assignment',
      recordId: String(updated.id),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    // Socket notify if published
    if (visibilityStatus === 'Published' && existing.visibilityStatus !== 'Published') {
      notifyAssignmentChange('PUBLISHED', {
        id: updated.id,
        title: updated.title,
        courseOfferingId: updated.courseOfferingId,
      });
    }

    return updated;
  }

  async deleteAssignment(id: number, userId: number, userRole: string): Promise<Assignment> {
    const existing = await assignmentRepository.findById(id);
    if (!existing) {
      throw new Error('Assignment not found.');
    }

    // Role check: If teacher, verify they are assigned to this course offering
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || existing.courseOffering.teacherId !== teacher.id) {
        throw new Error('Forbidden: You can only manage assignments for your assigned course offerings.');
      }
    }

    const deleted = await assignmentRepository.delete(id, String(userId));

    // Audit Log
    await auditService.log({
      action: 'Assignment Archived/Deleted',
      tableName: 'Assignment',
      recordId: String(deleted.id),
      oldValue: existing,
      userId,
    });

    return deleted;
  }

  async publishAssignment(id: number, userId: number, userRole: string): Promise<Assignment> {
    return this.updateAssignment(id, { visibilityStatus: 'Published' }, userId, userRole);
  }

  async archiveAssignment(id: number, userId: number, userRole: string): Promise<Assignment> {
    return this.updateAssignment(id, { visibilityStatus: 'Archived' }, userId, userRole);
  }

  // --- Student Submissions ---

  async submitAssignment(assignmentId: number, data: any, userId: number): Promise<AssignmentSubmission> {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found.');
    }

    if (assignment.visibilityStatus !== 'Published') {
      throw new Error('Cannot submit to an unpublished or archived assignment.');
    }

    // Find student associated with userId
    const student = await prisma.student.findFirst({
      where: { userId },
    });
    if (!student) {
      throw new Error('Student profile not found for this user.');
    }

    // Validate enrollment in the offering
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        courseOfferingId: assignment.courseOfferingId,
        status: 'Enrolled',
      },
    });
    if (!enrollment) {
      throw new Error('Student is not enrolled in the course offering for this assignment.');
    }

    // Check existing submissions to calculate attempts and determine eligibility
    const existingSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId,
        studentId: student.id,
      },
      orderBy: { submissionNumber: 'asc' },
    });

    // Check if there is a Draft submission we can overwrite or update
    const draftSubmission = existingSubmissions.find(sub => sub.submissionStatus === 'Draft');

    // Filter out final attempts
    const finalSubmissions = existingSubmissions.filter(sub => sub.submissionStatus !== 'Draft');

    if (finalSubmissions.length >= assignment.maxAttempts && !draftSubmission) {
      throw new Error(`Maximum submission attempts reached. Allowed: ${assignment.maxAttempts}.`);
    }

    const isDraft = data.isDraft === true || data.isDraft === 'true';

    // Deadline checks
    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);
    if (isLate && !isDraft) {
      if (!assignment.allowLateSubmission) {
        throw new Error('Submission deadline has passed, and late submissions are not allowed.');
      }
    }

    const attachments = data.attachments ? String(data.attachments) : null;
    let submissionStatus = isDraft ? 'Draft' : (isLate ? 'Late' : 'Submitted');

    // Future Ready: Autogenerate plagiarism score and suggested grading
    const plagiarismScore = parseFloat((Math.random() * 12).toFixed(1)); // mock score 0-12%

    let submission: AssignmentSubmission;

    if (draftSubmission) {
      // Overwrite/update existing draft submission
      const updatedFields: Prisma.AssignmentSubmissionUncheckedUpdateInput = {
        attachments,
        submissionStatus,
        submittedAt: now,
        plagiarismScore,
      };

      if (!isDraft) {
        // If final submitting, make sure attempt number is set
        updatedFields.submissionNumber = finalSubmissions.length + 1;
      }

      submission = await assignmentRepository.updateSubmission(draftSubmission.id, updatedFields);

      await auditService.log({
        action: 'Submission Updated',
        tableName: 'AssignmentSubmission',
        recordId: String(submission.id),
        newValue: submission,
        userId,
      });
    } else {
      // Create new submission
      const attemptNum = isDraft ? 0 : (finalSubmissions.length + 1);

      submission = await assignmentRepository.createSubmission({
        assignmentId,
        studentId: student.id,
        enrollmentId: enrollment.id,
        submissionNumber: attemptNum,
        submittedAt: now,
        submissionStatus,
        attachments,
        plagiarismScore,
      });

      await auditService.log({
        action: 'Submission Created',
        tableName: 'AssignmentSubmission',
        recordId: String(submission.id),
        newValue: submission,
        userId,
      });
    }

    // Notify teacher of course offering about the new submission
    if (!isDraft) {
      notifyAssignmentChange('SUBMITTED', {
        id: submission.id,
        studentId: student.id,
        studentName: student.fullName || 'Student',
        assignmentId,
        assignmentTitle: assignment.title,
        teacherId: assignment.teacherId,
      });
    }

    return submission;
  }

  // --- Teacher Grading ---

  async gradeSubmission(submissionId: number, data: any, userId: number): Promise<AssignmentSubmission> {
    const submission = await assignmentRepository.findSubmissionById(submissionId);
    if (!submission) {
      throw new Error('Submission not found.');
    }

    if (submission.submissionStatus === 'Draft') {
      throw new Error('Cannot grade a draft submission. The student has not finalized their attempt.');
    }

    const assignment = submission.assignment;

    // Role check: Only teacher of this assignment can grade it
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!teacher || assignment.teacherId !== teacher.id) {
      throw new Error('Forbidden: Only the assigned teacher can grade this submission.');
    }

    const { obtainedMarks, feedback, teacherRemarks, returnAssignment } = data;

    if (returnAssignment === true || returnAssignment === 'true') {
      // Teacher returned the assignment without final grade (or for revision)
      const updated = await assignmentRepository.updateSubmission(submissionId, {
        submissionStatus: 'Returned',
        feedback: feedback || '',
        teacherRemarks: teacherRemarks || '',
        gradedBy: teacher.user?.firstName ? `${teacher.user.firstName} ${teacher.user.lastName || ''}` : String(userId),
        gradedAt: new Date(),
      });

      await auditService.log({
        action: 'Submission Returned',
        tableName: 'AssignmentSubmission',
        recordId: String(submissionId),
        newValue: updated,
        userId,
      });

      return updated;
    }

    const marks = parseFloat(obtainedMarks);
    if (isNaN(marks) || marks < 0 || marks > assignment.totalMarks) {
      throw new Error(`Invalid marks. Must be between 0 and total marks (${assignment.totalMarks}).`);
    }

    // Apply late penalty deduction if late and penalty percentage > 0
    let finalMarks = marks;
    let remarks = teacherRemarks || '';
    if (submission.submissionStatus === 'Late' && assignment.latePenaltyPercentage > 0) {
      const penaltyAmount = marks * (assignment.latePenaltyPercentage / 100);
      finalMarks = marks - penaltyAmount;
      remarks = `(Late submission penalty of ${assignment.latePenaltyPercentage}% applied. Original: ${marks}, Awarded: ${finalMarks}) ${remarks}`.trim();
    }

    const percentage = parseFloat(((finalMarks / assignment.totalMarks) * 100).toFixed(2));

    // Calculate Grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 80) grade = 'A-';
    else if (percentage >= 75) grade = 'B+';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 65) grade = 'C+';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const updated = await assignmentRepository.updateSubmission(submissionId, {
      obtainedMarks: finalMarks,
      percentage,
      grade,
      feedback: feedback || '',
      teacherRemarks: remarks,
      submissionStatus: 'Graded',
      gradedBy: `${teacher.user?.firstName || 'Teacher'} ${teacher.user?.lastName || ''}`.trim(),
      gradedAt: new Date(),
    });

    // Audit log
    await auditService.log({
      action: 'Assignment Graded',
      tableName: 'AssignmentSubmission',
      recordId: String(submissionId),
      newValue: updated,
      userId,
    });

    // Notify student of grading
    notifyAssignmentChange('GRADED', {
      id: updated.id,
      studentId: updated.studentId,
      assignmentId: updated.assignmentId,
      assignmentTitle: assignment.title,
    });

    return updated;
  }

  // --- Analytics & Statistics ---

  async getAssignmentAnalytics(assignmentId: number, userId: number, userRole: string): Promise<any> {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found.');
    }

    // Find all submissions
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId,
        submissionStatus: { not: 'Draft' }, // exclude drafts from official stats
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    // Find total students enrolled in this course offering
    const enrolledCount = await prisma.enrollment.count({
      where: {
        courseOfferingId: assignment.courseOfferingId,
        status: 'Enrolled',
      },
    });

    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.submissionStatus === 'Graded');
    const lateSubmissions = submissions.filter(s => s.submissionStatus === 'Late');

    let totalObtained = 0;
    let passingCount = 0;
    const gradeDistribution: Record<string, number> = {
      'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0,
    };

    gradedSubmissions.forEach(sub => {
      if (sub.obtainedMarks !== null) {
        totalObtained += sub.obtainedMarks;
        if (sub.obtainedMarks >= assignment.passingMarks) {
          passingCount++;
        }
      }
      if (sub.grade && gradeDistribution[sub.grade] !== undefined) {
        gradeDistribution[sub.grade]++;
      }
    });

    const averageMarks = gradedSubmissions.length > 0 ? parseFloat((totalObtained / gradedSubmissions.length).toFixed(2)) : 0;
    const passPercentage = gradedSubmissions.length > 0 ? parseFloat(((passingCount / gradedSubmissions.length) * 100).toFixed(2)) : 0;
    const submissionRate = enrolledCount > 0 ? parseFloat(((totalSubmissions / enrolledCount) * 100).toFixed(2)) : 0;
    const completionRate = enrolledCount > 0 ? parseFloat(((gradedSubmissions.length / enrolledCount) * 100).toFixed(2)) : 0;
    const lateSubmissionRate = totalSubmissions > 0 ? parseFloat(((lateSubmissions.length / totalSubmissions) * 100).toFixed(2)) : 0;

    return {
      assignmentCode: assignment.assignmentCode,
      title: assignment.title,
      totalMarks: assignment.totalMarks,
      passingMarks: assignment.passingMarks,
      stats: {
        enrolledStudents: enrolledCount,
        totalSubmissions,
        gradedSubmissions: gradedSubmissions.length,
        lateSubmissions: lateSubmissions.length,
        averageMarks,
        passPercentage,
        submissionRate,
        completionRate,
        lateSubmissionRate,
      },
      gradeDistribution: Object.keys(gradeDistribution).map(key => ({
        grade: key,
        count: gradeDistribution[key],
      })),
    };
  }
}

export const assignmentService = new AssignmentService();
export default assignmentService;
