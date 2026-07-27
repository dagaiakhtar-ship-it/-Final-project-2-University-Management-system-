import { prisma } from './db.service';
import { auditService } from './audit.service';
import { notifyTranscriptChange } from './socket.service';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

export class TranscriptService {
  /**
   * Helper to enrich a raw transcript object with calculated academic fields
   */
  enrichTranscript(transcript: any) {
    if (!transcript) return null;

    const student = transcript.student;
    if (!student) return transcript;

    // 1. Calculate totalCreditsEarned from published pass results
    const results = student.results || [];
    const totalCreditsEarned = results
      .filter((r: any) => r.passStatus === 'Pass')
      .reduce((sum: number, r: any) => sum + (r.creditHours || 0), 0);

    // 2. Fetch CGPA
    const cgpaRecord = student.cgpaRecords?.[0] || {};
    const cgpa = cgpaRecord.cgpa || 0;

    // 3. Compute academic standing
    let academicStanding = 'Good Standing';
    if (cgpa >= 3.5) academicStanding = 'Honor Roll';
    else if (cgpa < 2.0) academicStanding = 'Academic Probation';

    // 4. Construct gpaHistory
    const gpaHistory = (student.semesterGPAs || []).map((sgpa: any) => ({
      semesterId: sgpa.semesterId,
      semesterName: sgpa.semester?.name || `Semester ${sgpa.semesterId}`,
      gpa: sgpa.semesterGPA,
    }));

    // 5. Construct academicHistory
    const academicHistory = results.map((res: any) => ({
      id: res.id,
      semesterName: res.semester?.name || `Semester ${res.semesterId}`,
      subjectCode: res.courseOffering?.subject?.code || '',
      subjectName: res.courseOffering?.subject?.name || '',
      creditHours: res.creditHours,
      grade: res.grade,
      gradePoint: res.gradePoint,
      passStatus: res.passStatus,
    }));

    return {
      ...transcript,
      totalCreditsEarned,
      cgpa,
      academicStanding,
      gpaHistory,
      academicHistory,
    };
  }

  /**
   * List transcripts with filters and pagination
   */
  async getTranscripts(filters: {
    search?: string;
    status?: string;
    programId?: number;
    departmentId?: number;
    page?: number;
    limit?: number;
  } = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.transcriptStatus = filters.status;
    }
    if (filters.programId) {
      where.programId = Number(filters.programId);
    }
    if (filters.departmentId) {
      where.departmentId = Number(filters.departmentId);
    }

    if (filters.search) {
      where.OR = [
        { transcriptNumber: { contains: filters.search, mode: 'insensitive' } },
        { student: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { student: { rollNumber: { contains: filters.search, mode: 'insensitive' } } },
        { student: { registrationNumber: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.transcript.count({ where }),
      prisma.transcript.findMany({
        where,
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
              results: {
                where: { approvalStatus: 'Published' },
                include: {
                  semester: true,
                  courseOffering: {
                    include: {
                      subject: true,
                    },
                  },
                },
              },
              semesterGPAs: {
                include: { semester: true },
              },
              cgpaRecords: true,
            },
          },
          program: true,
          department: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const enrichedData = data.map(t => this.enrichTranscript(t));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: enrichedData,
    };
  }

  /**
   * Get specific transcript details by ID
   */
  async getTranscriptById(id: number) {
    const transcript = await prisma.transcript.findUnique({
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
            results: {
              where: { approvalStatus: 'Published' },
              include: {
                semester: true,
                courseOffering: {
                  include: {
                    subject: true,
                  },
                },
              },
              orderBy: [
                { semester: { id: 'asc' } },
              ],
            },
            semesterGPAs: {
              include: { semester: true },
              orderBy: { semester: { id: 'asc' } },
            },
            cgpaRecords: true,
          },
        },
        program: true,
        department: true,
      },
    });
    return this.enrichTranscript(transcript);
  }

  /**
   * Retrieve transcript requests with filters and pagination
   */
  async getTranscriptRequests(filters: {
    studentId?: number;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.studentId) {
      where.studentId = Number(filters.studentId);
    }
    if (filters.status) {
      where.requestStatus = filters.status;
    }

    const [total, data] = await Promise.all([
      prisma.transcriptRequest.count({ where }),
      prisma.transcriptRequest.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  /**
   * Request a new transcript (Student action)
   */
  async requestTranscript(studentId: number, purpose: string, numberOfCopies: number) {
    // Check if there is an active pending request
    const existingPending = await prisma.transcriptRequest.findFirst({
      where: {
        studentId,
        requestStatus: 'Pending',
      },
    });

    if (existingPending) {
      throw new Error('You already have a pending transcript request.');
    }

    const request = await prisma.transcriptRequest.create({
      data: {
        studentId,
        purpose,
        numberOfCopies: Number(numberOfCopies) || 1,
        requestStatus: 'Pending',
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

    // Notify admins/registrars
    notifyTranscriptChange('REQUESTED', request);

    await auditService.log({
      action: 'TRANSCRIPT_REQUEST_SUBMITTED',
      tableName: 'TranscriptRequest',
      recordId: String(request.id),
      newValue: request,
      userId: request.studentId,
    });

    return request;
  }

  /**
   * Approve or reject transcript request (Admin/Registrar action)
   */
  async handleTranscriptRequest(id: number, status: 'Approved' | 'Rejected', approvedBy: string, remarks?: string) {
    const request = await prisma.transcriptRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new Error('Transcript request not found.');
    }

    // Idempotency validation check: request must be in Pending state
    if (request.requestStatus !== 'Pending') {
      throw new Error(`This request has already been processed (status: ${request.requestStatus}).`);
    }

    const updated = await prisma.transcriptRequest.update({
      where: { id },
      data: {
        requestStatus: status,
        approvedBy,
        approvalDate: new Date(),
        remarks,
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

    // Notify student
    notifyTranscriptChange(status === 'Approved' ? 'APPROVED' : 'REJECTED', updated);

    // If approved, trigger auto generation of the Transcript itself
    if (status === 'Approved') {
      try {
        await this.generateTranscript(updated.studentId, approvedBy);
        // Mark request as Completed
        await prisma.transcriptRequest.update({
          where: { id },
          data: { requestStatus: 'Completed' },
        });
      } catch (err: any) {
        console.error('Failed to auto-generate transcript upon request approval:', err);
      }
    }

    await auditService.log({
      action: `TRANSCRIPT_REQUEST_${status.toUpperCase()}`,
      tableName: 'TranscriptRequest',
      recordId: String(updated.id),
      newValue: updated,
    });

    return updated;
  }

  /**
   * Core logic to compile/generate official transcript record
   */
  async generateTranscript(studentId: number, generatedBy: string) {
    // 1. Fetch student along with program, department, and grades
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        department: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        results: {
          where: { approvalStatus: 'Published' },
          include: {
            semester: true,
            courseOffering: {
              include: {
                subject: true,
              },
            },
          },
        },
        semesterGPAs: {
          include: { semester: true },
        },
        cgpaRecords: true,
      },
    });

    if (!student) {
      throw new Error('Student not found.');
    }

    // 2. Compute academic standing, earned credits, remaining credits
    const earnedCredits = student.results
      .filter((r) => r.passStatus === 'Pass')
      .reduce((sum, r) => sum + (r.creditHours || 0), 0);

    const programCredits = student.program?.creditHours || 0;
    const remainingCredits = Math.max(0, programCredits - earnedCredits);

    const cgpa = student.cgpaRecords[0]?.cgpa || 0;
    let academicStanding = 'Good Standing';
    if (cgpa >= 3.5) academicStanding = 'Honor Roll';
    else if (cgpa < 2.0) academicStanding = 'Academic Probation';

    // 3. Generate transcript metadata
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const transcriptNumber = `TX-${year}-${rand}`;
    const verificationToken = `VER-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Clean up existing Draft transcripts for this student to prevent db bloat
    await prisma.transcript.deleteMany({
      where: {
        studentId,
        transcriptStatus: 'Draft'
      }
    });

    // Host or base verification URL (for preview we point to root router verification tab)
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const verifyUrl = `${cleanBaseUrl}/verify-transcript?token=${verificationToken}`;
    const qrCodeBase64 = await QRCode.toDataURL(verifyUrl);

    // Mock/placeholder digital signature
    const digitalSignature = `DIGI-SIGN-REG-${Buffer.from(`${transcriptNumber}-${student.rollNumber}`).toString('base64')}`;

    // Save to DB (Create or update existing draft)
    const transcript = await prisma.transcript.create({
      data: {
        transcriptNumber,
        studentId,
        programId: student.programId,
        departmentId: student.departmentId,
        generatedBy,
        transcriptStatus: 'Draft',
        verificationToken,
        qrCode: qrCodeBase64,
        digitalSignature,
        remarks: `Earned Credits: ${earnedCredits}, CGPA: ${cgpa}, Standing: ${academicStanding}`,
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
            results: {
              where: { approvalStatus: 'Published' },
              include: {
                semester: true,
                courseOffering: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
            semesterGPAs: {
              include: { semester: true },
            },
            cgpaRecords: true,
          },
        },
        program: true,
        department: true,
      },
    });

    const enriched = this.enrichTranscript(transcript);
    notifyTranscriptChange('GENERATED', enriched);

    await auditService.log({
      action: 'TRANSCRIPT_GENERATED',
      tableName: 'Transcript',
      recordId: String(transcript.id),
      newValue: enriched,
    });

    return enriched;
  }

  /**
   * Approve Transcript (Changes status from Draft to Approved)
   */
  async approveTranscript(id: number, approvedBy: string) {
    const transcript = await prisma.transcript.update({
      where: { id },
      data: {
        transcriptStatus: 'Approved',
        approvedBy,
        approvalDate: new Date(),
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
            results: {
              where: { approvalStatus: 'Published' },
              include: {
                semester: true,
                courseOffering: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
            semesterGPAs: {
              include: { semester: true },
            },
            cgpaRecords: true,
          },
        },
        program: true,
        department: true,
      },
    });

    const enriched = this.enrichTranscript(transcript);
    notifyTranscriptChange('APPROVED', enriched);

    await auditService.log({
      action: 'TRANSCRIPT_APPROVED',
      tableName: 'Transcript',
      recordId: String(transcript.id),
      newValue: enriched,
    });

    return enriched;
  }

  /**
   * Publish Transcript (Changes status from Approved to Published)
   */
  async publishTranscript(id: number) {
    const transcript = await prisma.transcript.update({
      where: { id },
      data: {
        transcriptStatus: 'Published',
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
            results: {
              where: { approvalStatus: 'Published' },
              include: {
                semester: true,
                courseOffering: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
            semesterGPAs: {
              include: { semester: true },
            },
            cgpaRecords: true,
          },
        },
        program: true,
        department: true,
      },
    });

    const enriched = this.enrichTranscript(transcript);
    notifyTranscriptChange('PUBLISHED', enriched);

    await auditService.log({
      action: 'TRANSCRIPT_PUBLISHED',
      tableName: 'Transcript',
      recordId: String(transcript.id),
      newValue: enriched,
    });

    return enriched;
  }

  /**
   * Delete transcript
   */
  async deleteTranscript(id: number) {
    const deleted = await prisma.transcript.delete({
      where: { id },
    });

    await auditService.log({
      action: 'TRANSCRIPT_DELETED',
      tableName: 'Transcript',
      recordId: String(id),
      oldValue: deleted,
    });

    return deleted;
  }

  /**
   * Retrieve transcript by student ID
   */
  async getStudentTranscript(studentId: number) {
    const transcript = await prisma.transcript.findFirst({
      where: { studentId },
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
            results: {
              where: { approvalStatus: 'Published' },
              include: {
                semester: true,
                courseOffering: {
                  include: {
                    subject: true,
                  },
                },
              },
              orderBy: [
                { semester: { id: 'asc' } },
              ],
            },
            semesterGPAs: {
              include: { semester: true },
              orderBy: { semester: { id: 'asc' } },
            },
            cgpaRecords: true,
          },
        },
        program: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrichTranscript(transcript);
  }

  /**
   * Verify verification token
   */
  async verifyTranscript(verificationToken: string) {
    const transcript = await prisma.transcript.findUnique({
      where: { verificationToken },
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
            results: {
              where: { approvalStatus: 'Published' },
              include: {
                semester: true,
                courseOffering: {
                  include: {
                    subject: true,
                  },
                },
              },
              orderBy: [
                { semester: { id: 'asc' } },
              ],
            },
            semesterGPAs: {
              include: { semester: true },
              orderBy: { semester: { id: 'asc' } },
            },
            cgpaRecords: true,
          },
        },
        program: true,
        department: true,
      },
    });

    if (transcript) {
      await auditService.log({
        action: 'TRANSCRIPT_VERIFIED',
        tableName: 'Transcript',
        recordId: String(transcript.id),
      });
    }

    return this.enrichTranscript(transcript);
  }

  /**
   * Generate highly professional print-friendly PDF Transcript using PDFKit
   */
  generatePdfStream(transcript: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // --- BACKGROUND WATERMARK ---
        doc.save();
        doc.opacity(0.04);
        doc.fontSize(70);
        doc.font('Helvetica-Bold');
        doc.fillColor('#0f172a');
        doc.text('OFFICIAL TRANSCRIPT', 50, 350, { align: 'center' });
        doc.text('SMART UNIVERSITY', 50, 480, { align: 'center' });
        doc.restore();

        // --- HEADER BRANDING ---
        doc.fillColor('#0f172a');
        doc.font('Helvetica-Bold');
        doc.fontSize(22);
        doc.text('SMART UNIVERSITY', { align: 'center' });
        doc.fontSize(10);
        doc.font('Helvetica');
        doc.text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', { align: 'center' });
        doc.text('Official Academic Transcript of Records', { align: 'center' });
        doc.moveDown(1.5);

        // Header Border
        doc.strokeColor('#e2e8f0');
        doc.lineWidth(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // --- STUDENT INFO GRID ---
        const student = transcript.student;
        const user = student.user || {};
        const fullName = student.fullName || `${user.firstName || ''} ${user.lastName || ''}`;

        doc.fontSize(10);
        doc.font('Helvetica-Bold');
        doc.text('STUDENT INFORMATION', 50, doc.y);
        doc.moveDown(0.3);

        const gridY = doc.y;
        doc.font('Helvetica');
        doc.text(`Name:`, 50, gridY);
        doc.font('Helvetica-Bold').text(fullName, 120, gridY);

        doc.font('Helvetica').text(`Roll Number:`, 50, gridY + 16);
        doc.font('Helvetica-Bold').text(student.rollNumber, 120, gridY + 16);

        doc.font('Helvetica').text(`Reg. Number:`, 50, gridY + 32);
        doc.font('Helvetica-Bold').text(student.registrationNumber, 120, gridY + 32);

        doc.font('Helvetica').text(`Department:`, 310, gridY);
        doc.font('Helvetica-Bold').text(transcript.department?.name || 'Academic Dept', 400, gridY);

        doc.font('Helvetica').text(`Program:`, 310, gridY + 16);
        doc.font('Helvetica-Bold').text(transcript.program?.name || 'Program', 400, gridY + 16);

        doc.font('Helvetica').text(`Issue Date:`, 310, gridY + 32);
        const formatIssueDate = new Date(transcript.issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        doc.font('Helvetica-Bold').text(formatIssueDate, 400, gridY + 32);

        doc.moveDown(2);

        // --- ACADEMIC CONTENT SECTION ---
        doc.strokeColor('#e2e8f0').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(11).text('ACADEMIC RECORD & COURSEWORK', 50, doc.y);
        doc.moveDown(0.5);

        // Fetch subject details and sort into semester groups
        const results = student.results || [];
        const semestersMap: Record<number, { name: string; courses: any[]; gpa?: number }> = {};

        results.forEach((res: any) => {
          const semId = res.semesterId;
          if (!semestersMap[semId]) {
            semestersMap[semId] = {
              name: res.semester?.name || `Semester ${semId}`,
              courses: [],
            };
          }
          semestersMap[semId].courses.push(res);
        });

        // Add GPA info to each semester block
        const semesterGPAs = student.semesterGPAs || [];
        semesterGPAs.forEach((g: any) => {
          if (semestersMap[g.semesterId]) {
            semestersMap[g.semesterId].gpa = g.semesterGPA;
          }
        });

        const semIds = Object.keys(semestersMap).map(Number).sort((a, b) => a - b);

        if (semIds.length === 0) {
          doc.font('Helvetica-Oblique').fontSize(10).text('No published course records found.', 50, doc.y);
          doc.moveDown(1);
        } else {
          semIds.forEach((semId) => {
            const sem = semestersMap[semId];
            doc.moveDown(0.5);
            doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9).text(sem.name.toUpperCase(), 50, doc.y);
            doc.moveDown(0.3);

            // Table Header
            const tableY = doc.y;
            doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8);
            doc.text('CODE', 50, tableY);
            doc.text('SUBJECT TITLE', 110, tableY);
            doc.text('CREDITS', 370, tableY, { width: 50, align: 'center' });
            doc.text('GRADE', 430, tableY, { width: 50, align: 'center' });
            doc.text('POINTS', 490, tableY, { width: 50, align: 'center' });

            doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, tableY + 12).lineTo(545, tableY + 12).stroke();
            doc.moveDown(0.5);

            let rowY = tableY + 16;
            sem.courses.forEach((c: any) => {
              doc.fillColor('#0f172a').font('Helvetica').fontSize(8);
              doc.text(c.courseOffering?.subject?.code || '', 50, rowY);
              doc.text(c.courseOffering?.subject?.name || '', 110, rowY, { width: 250, lineBreak: false });
              doc.text(String(c.creditHours || 0), 370, rowY, { width: 50, align: 'center' });
              doc.text(c.grade || '', 430, rowY, { width: 50, align: 'center' });
              doc.text(Number(c.gradePoint || 0).toFixed(2), 490, rowY, { width: 50, align: 'center' });
              rowY += 14;
            });

            // Semester footer with GPA
            doc.strokeColor('#e2e8f0').moveTo(50, rowY).lineTo(545, rowY).stroke();
            rowY += 4;
            doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8);
            doc.text(`Semester GPA: ${Number(sem.gpa || 0).toFixed(2)}`, 440, rowY, { align: 'right', width: 100 });
            doc.moveDown(2.5);
          });
        }

        // --- CUMULATIVE SUMMARY BOARD ---
        const cgpaRecord = student.cgpaRecords[0] || {};
        const cgpaVal = cgpaRecord.cgpa || 0;
        const totalEarned = student.results
          .filter((r: any) => r.passStatus === 'Pass')
          .reduce((sum: number, r: any) => sum + (r.creditHours || 0), 0);

        doc.strokeColor('#e2e8f0').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        const summaryY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('CUMULATIVE ACADEMIC SUMMARY', 50, summaryY);
        doc.moveDown(0.4);

        const gridY2 = doc.y;
        doc.font('Helvetica').fontSize(9);
        doc.text('Total Credit Hours Attempted:', 50, gridY2);
        doc.font('Helvetica-Bold').text(String(cgpaRecord.totalCreditHours || totalEarned), 220, gridY2);

        doc.font('Helvetica').text('Total Credit Hours Earned:', 50, gridY2 + 15);
        doc.font('Helvetica-Bold').text(String(totalEarned), 220, gridY2 + 15);

        doc.font('Helvetica').text('Cumulative Quality Points:', 50, gridY2 + 30);
        doc.font('Helvetica-Bold').text(Number(cgpaRecord.cumulativeQualityPoints || 0).toFixed(2), 220, gridY2 + 30);

        doc.fontSize(11).fillColor('#1e3a8a');
        doc.font('Helvetica').text('Cumulative GPA (CGPA):', 310, gridY2);
        doc.font('Helvetica-Bold').fontSize(13).text(Number(cgpaVal).toFixed(2), 460, gridY2);

        doc.fontSize(9).fillColor('#0f172a');
        doc.font('Helvetica').text('Academic Standing:', 310, gridY2 + 22);
        let stand = 'Good Standing';
        if (cgpaVal >= 3.5) stand = 'Honor Roll';
        else if (cgpaVal < 2.0) stand = 'Academic Probation';
        doc.font('Helvetica-Bold').text(stand, 460, gridY2 + 22);

        doc.moveDown(3);

        // --- SIGNATURES & QR SECTION ---
        const sigY = doc.y;

        // QR Code left
        if (transcript.qrCode) {
          try {
            const base64Data = transcript.qrCode.replace(/^data:image\/png;base64,/, '');
            doc.image(Buffer.from(base64Data, 'base64'), 50, sigY, { width: 70, height: 70 });
            doc.fontSize(6).fillColor('#64748b');
            doc.text(`Verification Code:\n${transcript.verificationToken}`, 50, sigY + 75, { width: 150 });
          } catch (e) {
            console.error('Error attaching QR to PDF:', e);
          }
        }

        // Registrar sign right
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
        doc.text('REGISTRAR', 410, sigY + 50, { align: 'center', width: 135 });
        doc.strokeColor('#94a3b8').lineWidth(0.5).moveTo(410, sigY + 45).lineTo(545, sigY + 45).stroke();

        doc.fontSize(7).fillColor('#94a3b8');
        doc.text('Official Seal of Smart University', 410, sigY + 62, { align: 'center', width: 135 });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const transcriptService = new TranscriptService();
export default transcriptService;
