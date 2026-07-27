import { Router } from 'express';
import { transcriptController } from '../controllers/transcript.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const transcriptRouter = Router();

// 1. PUBLIC VERIFICATION ENDPOINT (No auth required)
transcriptRouter.get(
  '/verify/:verificationToken',
  transcriptController.verifyTranscript
);

// --- ALL OTHER ENDPOINTS REQUIRE AUTHENTICATION ---
transcriptRouter.use(authenticate);

// 2. Transcripts Requests management
transcriptRouter.get(
  '/requests',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  transcriptController.getRequests
);

transcriptRouter.post(
  '/request',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  transcriptController.requestTranscript
);

transcriptRouter.post(
  '/requests/:id/handle',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transcriptController.handleRequest
);

// 3. Official Transcripts compilation & approval
transcriptRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  transcriptController.getTranscripts
);

transcriptRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transcriptController.createTranscript
);

transcriptRouter.post(
  '/generate',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transcriptController.generateTranscript
);

transcriptRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  transcriptController.getTranscriptById
);

transcriptRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transcriptController.updateTranscript
);

transcriptRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transcriptController.deleteTranscript
);

transcriptRouter.post(
  '/:id/approve',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transcriptController.approveTranscript
);

transcriptRouter.post(
  '/:id/publish',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transcriptController.publishTranscript
);

transcriptRouter.get(
  '/:id/download',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  transcriptController.downloadTranscriptPdf
);


export default transcriptRouter;
