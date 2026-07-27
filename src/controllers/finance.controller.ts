import { Request, Response } from 'express';
import { FinanceService } from '../services/finance.service';
import {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  generateInvoicesSchema,
  createInvoiceSchema,
  processPaymentSchema,
  createScholarshipSchema,
  updateScholarshipStatusSchema,
  processRefundSchema,
} from '../validators/finance.validators';

const financeService = new FinanceService();

// Helper to get authenticated user ID if any
const getUserId = (req: Request): number | undefined => {
  return (req as any).user?.id;
};

// Helper to get authenticated user email/name for approvedBy
const getUsername = (req: Request): string => {
  return (req as any).user?.fullName || (req as any).user?.email || 'System';
};

// --- Fee Structures ---
export const getFeeStructures = async (req: Request, res: Response) => {
  try {
    const feeStructures = await financeService.getFeeStructures();
    res.json({ success: true, data: feeStructures });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const parsed = createFeeStructureSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const structure = await financeService.createFeeStructure(parsed.data, getUserId(req));
    res.status(201).json({ success: true, data: structure });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateFeeStructure = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const parsed = updateFeeStructureSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const structure = await financeService.updateFeeStructure(id, parsed.data, getUserId(req));
    res.json({ success: true, data: structure });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteFeeStructure = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const result = await financeService.deleteFeeStructure(id, getUserId(req));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Invoices ---
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    if (req.query.studentId) filters.studentId = parseInt(req.query.studentId as string, 10);
    if (req.query.semesterId) filters.semesterId = parseInt(req.query.semesterId as string, 10);
    if (req.query.status) filters.status = req.query.status as string;

    const invoices = await financeService.getInvoices(filters);
    res.json({ success: true, data: invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const invoice = await financeService.getInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const generateSemesterInvoices = async (req: Request, res: Response) => {
  try {
    const parsed = generateInvoicesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const result = await financeService.generateSemesterInvoices(parsed.data, getUserId(req));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const invoice = await financeService.createInvoice(parsed.data, getUserId(req));
    res.status(201).json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Payments ---
export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await financeService.getPayments();
    res.json({ success: true, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const processPayment = async (req: Request, res: Response) => {
  try {
    const parsed = processPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const result = await financeService.processPayment(parsed.data, getUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Refunds ---
export const processRefund = async (req: Request, res: Response) => {
  try {
    const parsed = processRefundSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const result = await financeService.processRefund(parsed.data, getUserId(req));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Scholarships ---
export const getScholarships = async (req: Request, res: Response) => {
  try {
    const scholarships = await financeService.getScholarships();
    res.json({ success: true, data: scholarships });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createScholarship = async (req: Request, res: Response) => {
  try {
    const parsed = createScholarshipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const scholarship = await financeService.createScholarship(parsed.data, getUserId(req));
    res.status(201).json({ success: true, data: scholarship });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateScholarshipStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const parsed = updateScholarshipStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const approvedBy = getUsername(req);
    const scholarship = await financeService.updateScholarshipStatus(id, parsed.data.status, approvedBy, getUserId(req));
    res.json({ success: true, data: scholarship });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Financial Reports ---
export const getFinancialReports = async (req: Request, res: Response) => {
  try {
    const reports = await financeService.getFinancialReports();
    res.json({ success: true, data: reports });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
