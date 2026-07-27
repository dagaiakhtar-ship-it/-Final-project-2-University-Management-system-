import { prisma } from './db.service';
import { notifyFinanceChange } from './socket.service';
import { v4 as uuidv4 } from 'uuid';

export class FinanceService {
  // Audit Logger Helper
  private async logAudit(action: string, tableName: string, recordId: string, oldValue?: any, newValue?: any, userId?: number) {
    try {
      await prisma.auditLog.create({
        data: {
          uuid: uuidv4(),
          action,
          tableName,
          recordId: String(recordId),
          oldValue: oldValue ? JSON.stringify(oldValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
          userId: userId || null,
        },
      });
    } catch (err) {
      console.error('[FinanceAuditLog] Error writing audit log:', err);
    }
  }

  // --- Fee Structures ---
  async getFeeStructures() {
    return await prisma.feeStructure.findMany({
      include: {
        department: true,
        program: true,
        semester: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async createFeeStructure(data: {
    departmentId?: number | null;
    programId?: number | null;
    semesterId?: number | null;
    academicYear: string;
    admissionFee: number;
    tuitionFee: number;
    registrationFee: number;
    examinationFee: number;
    libraryFee: number;
    hostelFee: number;
    transportFee: number;
    miscellaneousFee: number;
  }, userId?: number) {
    const totalFee =
      (data.admissionFee || 0) +
      (data.tuitionFee || 0) +
      (data.registrationFee || 0) +
      (data.examinationFee || 0) +
      (data.libraryFee || 0) +
      (data.hostelFee || 0) +
      (data.transportFee || 0) +
      (data.miscellaneousFee || 0);

    const feeStructure = await prisma.feeStructure.create({
      data: {
        departmentId: data.departmentId || null,
        programId: data.programId || null,
        semesterId: data.semesterId || null,
        academicYear: data.academicYear,
        admissionFee: data.admissionFee,
        tuitionFee: data.tuitionFee,
        registrationFee: data.registrationFee,
        examinationFee: data.examinationFee,
        libraryFee: data.libraryFee,
        hostelFee: data.hostelFee,
        transportFee: data.transportFee,
        miscellaneousFee: data.miscellaneousFee,
        totalFee,
        active: true,
      },
    });

    await this.logAudit('CREATE_FEE_STRUCTURE', 'FeeStructure', String(feeStructure.id), null, feeStructure, userId);
    return feeStructure;
  }

  async updateFeeStructure(id: number, data: {
    departmentId?: number | null;
    programId?: number | null;
    semesterId?: number | null;
    academicYear?: string;
    admissionFee?: number;
    tuitionFee?: number;
    registrationFee?: number;
    examinationFee?: number;
    libraryFee?: number;
    hostelFee?: number;
    transportFee?: number;
    miscellaneousFee?: number;
    active?: boolean;
  }, userId?: number) {
    const oldStructure = await prisma.feeStructure.findUnique({ where: { id } });
    if (!oldStructure) {
      throw new Error('Fee Structure not found');
    }

    const admissionFee = data.admissionFee !== undefined ? data.admissionFee : oldStructure.admissionFee;
    const tuitionFee = data.tuitionFee !== undefined ? data.tuitionFee : oldStructure.tuitionFee;
    const registrationFee = data.registrationFee !== undefined ? data.registrationFee : oldStructure.registrationFee;
    const examinationFee = data.examinationFee !== undefined ? data.examinationFee : oldStructure.examinationFee;
    const libraryFee = data.libraryFee !== undefined ? data.libraryFee : oldStructure.libraryFee;
    const hostelFee = data.hostelFee !== undefined ? data.hostelFee : oldStructure.hostelFee;
    const transportFee = data.transportFee !== undefined ? data.transportFee : oldStructure.transportFee;
    const miscellaneousFee = data.miscellaneousFee !== undefined ? data.miscellaneousFee : oldStructure.miscellaneousFee;

    const totalFee =
      admissionFee +
      tuitionFee +
      registrationFee +
      examinationFee +
      libraryFee +
      hostelFee +
      transportFee +
      miscellaneousFee;

    const updated = await prisma.feeStructure.update({
      where: { id },
      data: {
        departmentId: data.departmentId !== undefined ? data.departmentId : oldStructure.departmentId,
        programId: data.programId !== undefined ? data.programId : oldStructure.programId,
        semesterId: data.semesterId !== undefined ? data.semesterId : oldStructure.semesterId,
        academicYear: data.academicYear !== undefined ? data.academicYear : oldStructure.academicYear,
        admissionFee,
        tuitionFee,
        registrationFee,
        examinationFee,
        libraryFee,
        hostelFee,
        transportFee,
        miscellaneousFee,
        totalFee,
        active: data.active !== undefined ? data.active : oldStructure.active,
      },
    });

    await this.logAudit('UPDATE_FEE_STRUCTURE', 'FeeStructure', String(id), oldStructure, updated, userId);
    return updated;
  }

  async deleteFeeStructure(id: number, userId?: number) {
    const oldStructure = await prisma.feeStructure.findUnique({ where: { id } });
    if (!oldStructure) {
      throw new Error('Fee Structure not found');
    }

    await prisma.feeStructure.delete({ where: { id } });
    await this.logAudit('DELETE_FEE_STRUCTURE', 'FeeStructure', String(id), oldStructure, null, userId);
    return { success: true };
  }

  // --- Student Invoices ---
  async getInvoices(filters: { studentId?: number; semesterId?: number; status?: string } = {}) {
    const whereClause: any = {};
    if (filters.studentId) whereClause.studentId = filters.studentId;
    if (filters.semesterId) whereClause.semesterId = filters.semesterId;
    if (filters.status) whereClause.invoiceStatus = filters.status;

    return await prisma.studentInvoice.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            department: true,
            program: true,
            user: true,
          }
        },
        semester: true,
        payments: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async getInvoiceById(id: number) {
    return await prisma.studentInvoice.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            department: true,
            program: true,
            user: true,
          }
        },
        semester: true,
        payments: true,
      },
    });
  }

  async generateSemesterInvoices(data: { semesterId: number; academicYear: string; dueDate: string }, userId?: number) {
    const { semesterId, academicYear, dueDate } = data;

    // 1. Fetch all students in this semester
    const students = await prisma.student.findMany({
      where: { semesterId, status: 'ACTIVE' },
      include: {
        scholarships: {
          where: { status: 'Approved' },
        },
      },
    });

    if (students.length === 0) {
      throw new Error('No active students found in this semester.');
    }

    // 2. Fetch all active fee structures for this semester or matching program/department
    const feeStructures = await prisma.feeStructure.findMany({
      where: { active: true },
    });

    const generatedInvoices: any[] = [];

    // Begin transaction
    await prisma.$transaction(async (tx) => {
      for (const student of students) {
        // Find matching fee structure
        // Order of specificity:
        // 1. Matches programId, departmentId, semesterId
        // 2. Matches programId, semesterId
        // 3. Matches programId
        let matchingFs = feeStructures.find(
          (fs) => fs.programId === student.programId && fs.departmentId === student.departmentId && fs.semesterId === semesterId
        );

        if (!matchingFs) {
          matchingFs = feeStructures.find(
            (fs) => fs.programId === student.programId && fs.semesterId === semesterId
          );
        }

        if (!matchingFs) {
          matchingFs = feeStructures.find(
            (fs) => fs.programId === student.programId
          );
        }

        if (!matchingFs) {
          // Skip if no matching fee structure
          continue;
        }

        // Calculate subtotal
        const subtotal = matchingFs.totalFee;

        // Apply scholarships
        let scholarshipAmount = 0;
        const activeScholarship = student.scholarships.find(
          (s) => new Date(s.validFrom) <= new Date() && new Date(s.validTo) >= new Date()
        );

        if (activeScholarship) {
          if (activeScholarship.percentage) {
            // Scholarship percentage applied to tuition fee
            scholarshipAmount = (matchingFs.tuitionFee * activeScholarship.percentage) / 100;
          } else if (activeScholarship.fixedAmount) {
            scholarshipAmount = activeScholarship.fixedAmount;
          }
        }

        // Apply discount based on student scholarshipStatus string (e.g. "Full Waiver", "Half Waiver", etc.)
        let discountAmount = 0;
        if (student.scholarshipStatus === 'Full Waiver' || student.scholarshipStatus === '100%') {
          discountAmount = matchingFs.tuitionFee;
        } else if (student.scholarshipStatus === 'Half Waiver' || student.scholarshipStatus === '50%') {
          discountAmount = matchingFs.tuitionFee * 0.5;
        }

        // Ensure total discount and scholarship doesn't exceed subtotal
        if (scholarshipAmount + discountAmount > subtotal) {
          discountAmount = Math.max(0, subtotal - scholarshipAmount);
        }

        const penaltyAmount = 0; // initially zero
        const totalAmount = Math.max(0, subtotal - scholarshipAmount - discountAmount);
        const paidAmount = 0;
        const remainingAmount = totalAmount;

        const invoiceNumber = `INV-${academicYear.replace(/\s+/g, '')}-${semesterId}-${student.id}-${Date.now().toString().slice(-4)}`;

        // Verify if invoice already exists for this student, semester
        const existingInvoice = await tx.studentInvoice.findFirst({
          where: { studentId: student.id, semesterId, invoiceStatus: { not: 'Cancelled' } },
        });

        if (existingInvoice) {
          continue; // skip duplicate invoice generation
        }

        const newInvoice = await tx.studentInvoice.create({
          data: {
            invoiceNumber,
            studentId: student.id,
            semesterId,
            dueDate: new Date(dueDate),
            subtotal,
            scholarshipAmount,
            discountAmount,
            penaltyAmount,
            totalAmount,
            paidAmount,
            remainingAmount,
            invoiceStatus: 'Pending',
          },
        });

        generatedInvoices.push(newInvoice);

        // Realtime notification
        notifyFinanceChange('INVOICE_GENERATED', {
          studentId: student.id,
          message: `Semester fee invoice ${invoiceNumber} of amount $${totalAmount.toFixed(2)} has been generated. Due date: ${new Date(dueDate).toLocaleDateString()}.`,
          invoice: newInvoice,
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            uuid: uuidv4(),
            action: 'GENERATE_INVOICE',
            tableName: 'StudentInvoice',
            recordId: String(newInvoice.id),
            newValue: JSON.stringify(newInvoice),
            userId: userId || null,
          }
        });
      }
    });

    return { count: generatedInvoices.length, invoices: generatedInvoices };
  }

  // Create single custom manual invoice
  async createInvoice(data: {
    studentId: number;
    semesterId?: number | null;
    dueDate: string;
    subtotal: number;
    scholarshipAmount?: number;
    discountAmount?: number;
    penaltyAmount?: number;
    remarks?: string;
  }, userId?: number) {
    const studentExists = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!studentExists) {
      throw new Error('Student not found');
    }

    const subtotal = data.subtotal || 0;
    const scholarshipAmount = data.scholarshipAmount || 0;
    const discountAmount = data.discountAmount || 0;
    const penaltyAmount = data.penaltyAmount || 0;
    const totalAmount = Math.max(0, subtotal - scholarshipAmount - discountAmount + penaltyAmount);
    const invoiceNumber = `INV-MAN-${Date.now()}`;

    const invoice = await prisma.studentInvoice.create({
      data: {
        invoiceNumber,
        studentId: data.studentId,
        semesterId: data.semesterId || null,
        dueDate: new Date(data.dueDate),
        subtotal,
        scholarshipAmount,
        discountAmount,
        penaltyAmount,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        invoiceStatus: 'Pending',
      },
    });

    notifyFinanceChange('INVOICE_GENERATED', {
      studentId: data.studentId,
      message: `A new custom invoice ${invoiceNumber} of amount $${totalAmount.toFixed(2)} has been generated.`,
      invoice,
    });

    await this.logAudit('CREATE_INVOICE', 'StudentInvoice', String(invoice.id), null, invoice, userId);
    return invoice;
  }

  // --- Payments ---
  async getPayments() {
    return await prisma.paymentTransaction.findMany({
      include: {
        invoice: {
          include: {
            student: {
              include: {
                department: true,
                program: true,
                user: true,
              }
            }
          }
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async processPayment(data: {
    invoiceId: number;
    paymentMethod: string;
    amount: number;
    transactionReference?: string | null;
    remarks?: string | null;
  }, userId?: number) {
    const { invoiceId, paymentMethod, amount, transactionReference, remarks } = data;

    // 1. Verify invoice exists
    const invoice = await prisma.studentInvoice.findUnique({
      where: { id: invoiceId },
      include: { student: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.invoiceStatus === 'Cancelled') {
      throw new Error('Cannot collect payments on a cancelled invoice.');
    }

    // 2. Prevent duplicate payment reference
    if (transactionReference) {
      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { transactionReference },
      });
      if (existingTx && existingTx.paymentStatus === 'Successful') {
        throw new Error('A payment transaction with this reference already exists.');
      }
    }

    // 3. Prevent overpayment
    if (amount > invoice.remainingAmount + 0.01) {
      throw new Error(`Amount exceeds remaining balance. Max payable is $${invoice.remainingAmount.toFixed(2)}.`);
    }

    const receiptNumber = `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create payment transaction
      const payment = await tx.paymentTransaction.create({
        data: {
          invoiceId,
          paymentMethod,
          amount,
          transactionReference: transactionReference || null,
          paymentDate: new Date(),
          paymentStatus: 'Successful',
          receiptNumber,
          remarks: remarks || null,
        },
      });

      // Update invoice paid and remaining amounts
      const updatedPaidAmount = invoice.paidAmount + amount;
      const updatedRemainingAmount = Math.max(0, invoice.totalAmount - updatedPaidAmount);
      let newStatus = invoice.invoiceStatus;

      if (updatedRemainingAmount <= 0.01) {
        newStatus = 'Paid';
      } else {
        newStatus = 'Partially Paid';
      }

      const updatedInvoice = await tx.studentInvoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: updatedPaidAmount,
          remainingAmount: updatedRemainingAmount,
          invoiceStatus: newStatus,
        },
      });

      return { payment, updatedInvoice };
    });

    // Realtime notification
    notifyFinanceChange('PAYMENT_RECEIVED', {
      studentId: invoice.studentId,
      message: `Payment of $${amount.toFixed(2)} received for invoice ${invoice.invoiceNumber}. Receipt generated: ${receiptNumber}.`,
      payment: result.payment,
      invoice: result.updatedInvoice,
    });

    notifyFinanceChange('RECEIPT_GENERATED', {
      studentId: invoice.studentId,
      message: `Receipt ${receiptNumber} has been successfully generated for your payment.`,
      payment: result.payment,
    });

    await this.logAudit('PROCESS_PAYMENT', 'PaymentTransaction', String(result.payment.id), null, result.payment, userId);
    await this.logAudit('UPDATE_INVOICE_PAYMENT', 'StudentInvoice', String(invoiceId), invoice, result.updatedInvoice, userId);

    return result;
  }

  // --- Refunds ---
  async processRefund(data: { paymentId: number; remarks?: string | null }, userId?: number) {
    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: data.paymentId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new Error('Payment transaction not found');
    }

    if (payment.paymentStatus !== 'Successful') {
      throw new Error(`Only successful payments can be refunded. Current status: ${payment.paymentStatus}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark transaction as Refunded
      const updatedPayment = await tx.paymentTransaction.update({
        where: { id: data.paymentId },
        data: {
          paymentStatus: 'Refunded',
          remarks: data.remarks ? `${payment.remarks || ''} [Refund: ${data.remarks}]` : payment.remarks,
        },
      });

      // 2. Adjust StudentInvoice amounts
      const updatedPaid = Math.max(0, payment.invoice.paidAmount - payment.amount);
      const updatedRemaining = payment.invoice.totalAmount - updatedPaid;
      let newStatus = payment.invoice.invoiceStatus;

      if (updatedPaid <= 0.01) {
        newStatus = 'Pending';
      } else {
        newStatus = 'Partially Paid';
      }

      // Check if due date is passed
      if (new Date() > new Date(payment.invoice.dueDate) && newStatus !== 'Paid') {
        newStatus = 'Overdue';
      }

      const updatedInvoice = await tx.studentInvoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: updatedPaid,
          remainingAmount: updatedRemaining,
          invoiceStatus: newStatus,
        },
      });

      return { updatedPayment, updatedInvoice };
    });

    notifyFinanceChange('REFUND_APPROVED', {
      studentId: payment.invoice.studentId,
      message: `Your payment refund of $${payment.amount.toFixed(2)} has been approved. Invoice updated.`,
      payment: result.updatedPayment,
      invoice: result.updatedInvoice,
    });

    await this.logAudit('REFUND_PAYMENT', 'PaymentTransaction', String(data.paymentId), payment, result.updatedPayment, userId);

    return result;
  }

  // --- Scholarships ---
  async getScholarships() {
    return await prisma.scholarship.findMany({
      include: {
        student: {
          include: {
            department: true,
            program: true,
            user: true,
          }
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async createScholarship(data: {
    studentId: number;
    scholarshipName: string;
    percentage?: number | null;
    fixedAmount?: number | null;
    validFrom: string;
    validTo: string;
  }, userId?: number) {
    const studentExists = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!studentExists) {
      throw new Error('Student not found');
    }

    const scholarship = await prisma.scholarship.create({
      data: {
        studentId: data.studentId,
        scholarshipName: data.scholarshipName,
        percentage: data.percentage || null,
        fixedAmount: data.fixedAmount || null,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        status: 'Pending',
      },
    });

    await this.logAudit('CREATE_SCHOLARSHIP', 'Scholarship', String(scholarship.id), null, scholarship, userId);
    return scholarship;
  }

  async updateScholarshipStatus(id: number, status: 'Approved' | 'Rejected', approvedBy?: string, userId?: number) {
    const oldScholarship = await prisma.scholarship.findUnique({ where: { id } });
    if (!oldScholarship) {
      throw new Error('Scholarship record not found');
    }

    const updated = await prisma.scholarship.update({
      where: { id },
      data: {
        status,
        approvedBy: approvedBy || null,
      },
    });

    if (status === 'Approved') {
      notifyFinanceChange('SCHOLARSHIP_APPROVED', {
        studentId: updated.studentId,
        message: `Your scholarship application "${updated.scholarshipName}" has been APPROVED.`,
        scholarship: updated,
      });
    }

    await this.logAudit('UPDATE_SCHOLARSHIP_STATUS', 'Scholarship', String(id), oldScholarship, updated, userId);
    return updated;
  }

  // --- Financial Reports & Analytics ---
  async getFinancialReports() {
    // 1. Basic Stats
    const successfulPayments = await prisma.paymentTransaction.findMany({
      where: { paymentStatus: 'Successful' },
    });

    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    const invoices = await prisma.studentInvoice.findMany({
      where: { invoiceStatus: { not: 'Cancelled' } },
    });

    const outstandingBalance = invoices.reduce((sum, i) => sum + i.remainingAmount, 0);
    const totalScholarshipAwarded = invoices.reduce((sum, i) => sum + i.scholarshipAmount + i.discountAmount, 0);

    const pendingInvoicesCount = invoices.filter((i) => i.invoiceStatus === 'Pending').length;
    const paidInvoicesCount = invoices.filter((i) => i.invoiceStatus === 'Paid').length;
    const overdueInvoicesCount = invoices.filter((i) => i.invoiceStatus === 'Overdue').length;

    // Refund stats
    const refundedPayments = await prisma.paymentTransaction.findMany({
      where: { paymentStatus: 'Refunded' },
    });
    const totalRefunded = refundedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Collection rate
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const collectionRate = totalInvoiced > 0 ? ((totalRevenue / totalInvoiced) * 100) : 0;

    // 2. Payments by Method
    const methodMap: Record<string, number> = {};
    successfulPayments.forEach((p) => {
      methodMap[p.paymentMethod] = (methodMap[p.paymentMethod] || 0) + p.amount;
    });
    const paymentMethodsReport = Object.entries(methodMap).map(([method, amount]) => ({
      method,
      amount,
    }));

    // 3. Monthly Collections
    const monthlyMap: Record<string, number> = {};
    successfulPayments.forEach((p) => {
      const monthStr = p.paymentDate.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + p.amount;
    });
    const monthlyCollectionsReport = Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount,
    })).sort((a, b) => a.month.localeCompare(b.month));

    // 4. Department and Program Revenue
    const studentInvoices = await prisma.studentInvoice.findMany({
      where: { paidAmount: { gt: 0 } },
      include: {
        student: {
          include: {
            department: true,
            program: true,
          }
        }
      }
    });

    const deptRevenueMap: Record<string, number> = {};
    const progRevenueMap: Record<string, number> = {};

    studentInvoices.forEach((inv) => {
      const deptName = inv.student?.department?.name || 'Unknown Department';
      const progName = inv.student?.program?.name || 'Unknown Program';
      deptRevenueMap[deptName] = (deptRevenueMap[deptName] || 0) + inv.paidAmount;
      progRevenueMap[progName] = (progRevenueMap[progName] || 0) + inv.paidAmount;
    });

    const departmentRevenueReport = Object.entries(deptRevenueMap).map(([department, amount]) => ({
      department,
      amount,
    }));

    const programRevenueReport = Object.entries(progRevenueMap).map(([program, amount]) => ({
      program,
      amount,
    }));

    return {
      summary: {
        totalRevenue,
        outstandingBalance,
        totalScholarshipAwarded,
        totalRefunded,
        collectionRate,
        pendingInvoicesCount,
        paidInvoicesCount,
        overdueInvoicesCount,
      },
      reports: {
        paymentMethods: paymentMethodsReport,
        monthlyCollections: monthlyCollectionsReport,
        departmentRevenue: departmentRevenueReport,
        programRevenue: programRevenueReport,
      },
    };
  }
}
