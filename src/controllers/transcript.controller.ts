import { Request, Response, NextFunction } from 'express';
import { transcriptService } from '../services/transcript.service';

export class TranscriptController {
  // 1. GET /api/transcripts
  async getTranscripts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, programId, departmentId, page, limit } = req.query;
      const filters = {
        search: search as string,
        status: status as string,
        programId: programId ? Number(programId) : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      };

      const result = await transcriptService.getTranscripts(filters);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 2. GET /api/transcripts/:id
  async getTranscriptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const transcript = await transcriptService.getTranscriptById(id);
      if (!transcript) {
        res.status(404).json({ error: 'Transcript not found.' });
        return;
      }

      // Authorization guard: Student can only access their own transcript
      if ((req as any).user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: (req as any).user?.userId }
        });
        if (!student || transcript.studentId !== student.id) {
          res.status(403).json({ error: 'Access denied. You can only view your own transcript.' });
          return;
        }
      }

      res.status(200).json(transcript);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 3. POST /api/transcripts
  // (Standard create that routes to generateTranscript)
  async createTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.body;
      const userEmail = (req as any).user?.email || 'System';
      if (!studentId) {
        res.status(400).json({ error: 'Student ID is required.' });
        return;
      }
      const transcript = await transcriptService.generateTranscript(Number(studentId), userEmail);
      res.status(201).json(transcript);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 4. PUT /api/transcripts/:id
  async updateTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { transcriptStatus, remarks } = req.body;
      const userEmail = (req as any).user?.email || 'System';

      const updated = await prisma.transcript.update({
        where: { id },
        data: {
          transcriptStatus,
          remarks,
          approvedBy: transcriptStatus === 'Approved' ? userEmail : undefined,
          approvalDate: transcriptStatus === 'Approved' ? new Date() : undefined,
        },
      });

      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 5. DELETE /api/transcripts/:id
  async deleteTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await transcriptService.deleteTranscript(id);
      res.status(200).json({ message: 'Transcript deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 6. POST /api/transcripts/generate
  async generateTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.body;
      const userEmail = (req as any).user?.email || 'Registrar';
      if (!studentId) {
        res.status(400).json({ error: 'Student ID is required.' });
        return;
      }
      const transcript = await transcriptService.generateTranscript(Number(studentId), userEmail);
      res.status(200).json(transcript);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 7. POST /api/transcripts/:id/approve
  async approveTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userEmail = (req as any).user?.email || 'Registrar';
      const approved = await transcriptService.approveTranscript(id, userEmail);
      res.status(200).json(approved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 8. POST /api/transcripts/:id/publish
  async publishTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const published = await transcriptService.publishTranscript(id);
      res.status(200).json(published);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 9. POST /api/transcripts/request
  async requestTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId, purpose, numberOfCopies } = req.body;
      let resolvedStudentId = studentId;

      if (!resolvedStudentId) {
        const student = await prisma.student.findFirst({
          where: { userId: (req as any).user?.userId }
        });
        if (!student) {
          res.status(404).json({ error: 'Student profile not found for the authenticated user.' });
          return;
        }
        resolvedStudentId = student.id;
      }

      const request = await transcriptService.requestTranscript(Number(resolvedStudentId), purpose, numberOfCopies);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 10. GET /api/students/:id/transcript
  async getStudentTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let studentId: number;
      if (req.params.id === 'me') {
        const student = await prisma.student.findFirst({
          where: { userId: (req as any).user?.userId }
        });
        if (!student) {
          res.status(404).json({ error: 'Student record not found for this user.' });
          return;
        }
        studentId = student.id;
      } else {
        studentId = Number(req.params.id);
        
        // Authorization guard: Student can only retrieve their own student profile transcript
        if ((req as any).user?.role === 'STUDENT') {
          const student = await prisma.student.findFirst({
            where: { userId: (req as any).user?.userId }
          });
          if (!student || student.id !== studentId) {
            res.status(403).json({ error: 'Access denied. You can only view your own transcript.' });
            return;
          }
        }
      }

      const transcript = await transcriptService.getStudentTranscript(studentId);
      if (!transcript) {
        res.status(404).json({ error: 'No transcript found for this student.' });
        return;
      }
      res.status(200).json(transcript);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 11. GET /api/transcripts/verify/:verificationToken
  async verifyTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { verificationToken } = req.params;
      const transcript = await transcriptService.verifyTranscript(verificationToken);
      if (!transcript) {
        res.status(404).json({ error: 'Transcript verification failed. Token is invalid or expired.' });
        return;
      }
      res.status(200).json(transcript);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 12. GET /api/transcripts/requests
  async getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, studentId, page, limit } = req.query;
      let resolvedStudentId = studentId ? Number(studentId) : undefined;

      if (!resolvedStudentId && (req as any).user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: (req as any).user?.userId }
        });
        if (student) {
          resolvedStudentId = student.id;
        }
      }

      const filters = {
        studentId: resolvedStudentId,
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      };

      const result = await transcriptService.getTranscriptRequests(filters);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 13. POST /api/transcripts/requests/:id/handle
  async handleRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { status, remarks } = req.body; // status is 'Approved' or 'Rejected'
      const userEmail = (req as any).user?.email || 'Registrar';

      if (!status || !['Approved', 'Rejected'].includes(status)) {
        res.status(400).json({ error: 'Valid status (Approved or Rejected) is required.' });
        return;
      }

      const updated = await transcriptService.handleTranscriptRequest(id, status, userEmail, remarks);
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 14. GET /api/transcripts/:id/download
  async downloadTranscriptPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const transcript = await transcriptService.getTranscriptById(id);
      if (!transcript) {
        res.status(404).json({ error: 'Transcript record not found.' });
        return;
      }

      // Authorization guard: Student can only download their own transcript
      if ((req as any).user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: (req as any).user?.userId }
        });
        if (!student || transcript.studentId !== student.id) {
          res.status(403).json({ error: 'Access denied. You can only download your own transcript.' });
          return;
        }
      }

      const pdfBuffer = await transcriptService.generatePdfStream(transcript);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="transcript-${transcript.transcriptNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

import { prisma } from '../services/db.service';

export const transcriptController = new TranscriptController();
export default transcriptController;
