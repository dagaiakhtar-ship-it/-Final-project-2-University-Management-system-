import { Router } from 'express';
import { libraryController } from '../controllers/library.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const libraryRouter = Router();

// Secure all library routes with token authentication
libraryRouter.use(authenticate);

// =========================================================================
// ANALYTICS
// =========================================================================
libraryRouter.get(
  '/library/analytics',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.getLibraryAnalytics
);

// =========================================================================
// CATEGORIES
// =========================================================================
libraryRouter.get(
  '/library/categories',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.getCategories
);

libraryRouter.post(
  '/library/categories',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.createCategory
);

// =========================================================================
// PUBLISHERS
// =========================================================================
libraryRouter.get(
  '/library/publishers',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.getPublishers
);

libraryRouter.post(
  '/library/publishers',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.createPublisher
);

// =========================================================================
// AUTHORS
// =========================================================================
libraryRouter.get(
  '/library/authors',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.getAuthors
);

libraryRouter.post(
  '/library/authors',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.createAuthor
);

// =========================================================================
// BOOKS
// =========================================================================
libraryRouter.get(
  '/library/books',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.getBooks
);

libraryRouter.post(
  '/library/books',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.createBook
);

libraryRouter.put(
  '/library/books/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.updateBook
);

libraryRouter.delete(
  '/library/books/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.deleteBook
);

// =========================================================================
// ISSUES & LOANS (BOOK CIRCULATION)
// =========================================================================
libraryRouter.get(
  '/library/issues',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.getIssues
);

libraryRouter.post(
  '/library/issue',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.issueBook
);

libraryRouter.post(
  '/library/return',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.returnBook
);

libraryRouter.post(
  '/library/renew',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN']),
  libraryController.renewBook
);

// =========================================================================
// RESERVATIONS
// =========================================================================
libraryRouter.post(
  '/library/reserve',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.reserveBook
);

libraryRouter.get(
  '/library/reservations',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.getReservations
);

libraryRouter.delete(
  '/library/reservations/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.cancelReservation
);

// =========================================================================
// FINES & AUDITING
// =========================================================================
libraryRouter.get(
  '/library/fines',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT']),
  libraryController.getOverdueFines
);

export default libraryRouter;
