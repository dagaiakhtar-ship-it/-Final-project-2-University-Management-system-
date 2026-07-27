import { z } from 'zod';

// Regex to block HTML tags (XSS / HTML injection protection)
const noHtmlRefine = (val: string) => !/<[^>]*>/g.test(val);
const noHtmlMessage = 'HTML tags or script elements are not allowed';

export const createFeeStructureSchema = z.object({
  departmentId: z.number().optional().nullable(),
  programId: z.number().optional().nullable(),
  semesterId: z.number().optional().nullable(),
  academicYear: z.string().min(1, 'Academic year is required').max(100, 'Academic year is too long').trim().refine(noHtmlRefine, noHtmlMessage),
  admissionFee: z.number().min(0, 'Admission fee cannot be negative').max(10000000, 'Fee amount is extremely large').default(0),
  tuitionFee: z.number().min(0, 'Tuition fee cannot be negative').max(10000000, 'Fee amount is extremely large').default(0),
  registrationFee: z.number().min(0, 'Registration fee cannot be negative').max(10000000, 'Fee amount is extremely large').default(0),
  examinationFee: z.number().min(0, 'Examination fee cannot be negative').max(10000000, 'Fee amount is extremely large').default(0),
  libraryFee: z.number().min(0, 'Library fee cannot be negative').max(10000000, 'Fee amount is extremely large').default(0),
  hostelFee: z.number().min(0, 'Hostel fee cannot be negative').max(10000000, 'Fee amount is extremely large').default(0),
  transportFee: z.number().min(0, 'Transport fee cannot be negative').max(10000000, 'Fee amount is extremely large').default(0),
  miscellaneousFee: z.number().min(0, 'Miscellaneous fee cannot be negative').max(10000000, 'Fee amount is extremely large').default(0),
});

export const updateFeeStructureSchema = createFeeStructureSchema.partial().extend({
  active: z.boolean().optional(),
});

export const generateInvoicesSchema = z.object({
  semesterId: z.number({ message: 'Semester ID is required' }),
  academicYear: z.string().min(1, 'Academic year is required').max(100).trim().refine(noHtmlRefine, noHtmlMessage),
  dueDate: z.string().min(1, 'Due date is required').trim().refine(noHtmlRefine, noHtmlMessage),
});

export const createInvoiceSchema = z.object({
  studentId: z.number({ message: 'Student ID is required' }),
  semesterId: z.number().optional().nullable(),
  dueDate: z.string().min(1, 'Due date is required').trim().refine(noHtmlRefine, noHtmlMessage),
  subtotal: z.number().min(0, 'Subtotal cannot be negative').max(10000000),
  scholarshipAmount: z.number().min(0).max(10000000).optional(),
  discountAmount: z.number().min(0).max(10000000).optional(),
  penaltyAmount: z.number().min(0).max(10000000).optional(),
  remarks: z.string().max(1000, 'Remarks are too long').trim().refine(noHtmlRefine, noHtmlMessage).optional(),
});

export const processPaymentSchema = z.object({
  invoiceId: z.number({ message: 'Invoice ID is required' }),
  paymentMethod: z.enum(['Cash', 'Bank', 'Card', 'JazzCash', 'EasyPaisa', 'Stripe', 'PayPal'], {
    message: 'Invalid payment method',
  }),
  amount: z.number().min(0.01, 'Amount must be greater than zero').max(10000000),
  transactionReference: z.string().max(100, 'Reference is too long').trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
  remarks: z.string().max(1000, 'Remarks are too long').trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
});

export const createScholarshipSchema = z.object({
  studentId: z.number({ message: 'Student ID is required' }),
  scholarshipName: z.string().min(1, 'Scholarship name is required').max(200, 'Scholarship name is too long').trim().refine(noHtmlRefine, noHtmlMessage),
  percentage: z.number().min(0).max(100).optional().nullable(),
  fixedAmount: z.number().min(0).max(10000000).optional().nullable(),
  validFrom: z.string().min(1, 'Valid from date is required').trim().refine(noHtmlRefine, noHtmlMessage),
  validTo: z.string().min(1, 'Valid to date is required').trim().refine(noHtmlRefine, noHtmlMessage),
});

export const updateScholarshipStatusSchema = z.object({
  status: z.enum(['Approved', 'Rejected'], { message: 'Status must be Approved or Rejected' }),
});

export const processRefundSchema = z.object({
  paymentId: z.number({ message: 'Payment transaction ID is required' }),
  remarks: z.string().max(1000, 'Remarks are too long').trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
});
