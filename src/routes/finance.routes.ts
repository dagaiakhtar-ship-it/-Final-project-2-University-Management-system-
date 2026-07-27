import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getInvoices,
  getInvoiceById,
  generateSemesterInvoices,
  createInvoice,
  getPayments,
  processPayment,
  processRefund,
  getScholarships,
  createScholarship,
  updateScholarshipStatus,
  getFinancialReports,
} from '../controllers/finance.controller';

export const financeRouter = Router();

// Secure all finance routes with token authentication
financeRouter.use(authenticate);

// --- Fee Structures ---
financeRouter.get(
  '/fee-structures',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT']),
  getFeeStructures
);

financeRouter.post(
  '/fee-structures',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  createFeeStructure
);

financeRouter.put(
  '/fee-structures/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  updateFeeStructure
);

financeRouter.delete(
  '/fee-structures/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  deleteFeeStructure
);

// --- Invoices ---
financeRouter.get(
  '/invoices',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT']),
  getInvoices
);

// Bulk generate or custom single invoice
financeRouter.post(
  '/invoices',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  (req, res, next) => {
    if (req.body.studentId !== undefined) {
      return createInvoice(req, res);
    } else {
      return generateSemesterInvoices(req, res);
    }
  }
);

financeRouter.get(
  '/invoices/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT']),
  getInvoiceById
);

// --- Payments ---
financeRouter.get(
  '/payments',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT']),
  getPayments
);

financeRouter.post(
  '/payments',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT']),
  processPayment
);

// --- Refunds ---
financeRouter.post(
  '/refunds',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  processRefund
);

// --- Scholarships ---
financeRouter.get(
  '/scholarships',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT']),
  getScholarships
);

financeRouter.post(
  '/scholarships',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  createScholarship
);

financeRouter.put(
  '/scholarships/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  updateScholarshipStatus
);

// --- Financial Reports ---
financeRouter.get(
  '/financial-reports',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  getFinancialReports
);

