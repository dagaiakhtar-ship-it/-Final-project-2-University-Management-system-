import React, { useEffect, useState } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import {
  LayoutDashboard, RefreshCw, Layers, ShieldAlert, Award, FileText, Search,
  Plus, Trash2, Edit2, CheckCircle2, XCircle, AlertTriangle, QrCode,
  Clock, DollarSign, User, Check, X, Calendar, ArrowRightLeft, Download,
  ExternalLink, CreditCard, Receipt, Percent, FileCheck, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

// Simulated visual QR code for receipt / payment
const QRCodeSVG: React.FC<{ value: string }> = ({ value }) => {
  return (
    <div className="flex flex-col items-center p-2.5 bg-white rounded-xl border border-slate-200">
      <div className="w-28 h-28 bg-slate-100 flex flex-wrap p-1.5 border border-slate-200 rounded-lg">
        {[...Array(144)].map((_, i) => {
          const row = Math.floor(i / 12);
          const col = i % 12;
          const isMarker =
            (row < 3 && col < 3) ||
            (row < 3 && col >= 9) ||
            (row >= 9 && col < 3);
          const isDark = isMarker || (Math.sin(i * 3.5) > 0);
          return (
            <div
              key={i}
              className={`w-[8.33%] h-[8.33%] ${isDark ? 'bg-slate-900' : 'bg-transparent'}`}
            />
          );
        })}
      </div>
      <span className="text-[10px] font-mono text-slate-500 mt-2 max-w-[130px] truncate">{value}</span>
    </div>
  );
};

export const FeesPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';
  const isStudent = userRole === 'STUDENT';
  const isParent = userRole === 'PARENT';
  const isStaff = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>(isStudent ? 'student_portal' : isParent ? 'parent_portal' : 'overview');
  const [loading, setLoading] = useState<boolean>(true);

  // Core Data Lists
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);

  // Dropdown options from other modules
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Search & Filter State
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>('');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('');

  // Modal control states
  const [isStructureModalOpen, setIsStructureModalOpen] = useState<boolean>(false);
  const [editingStructure, setEditingStructure] = useState<any>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [isBulkInvoiceModalOpen, setIsBulkInvoiceModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<any>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);

  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState<boolean>(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<any>(null);

  // Form states
  const [feeStructureForm, setFeeStructureForm] = useState({
    departmentId: '',
    programId: '',
    semesterId: '',
    academicYear: '2026-2027',
    admissionFee: 0,
    tuitionFee: 0,
    registrationFee: 0,
    examinationFee: 0,
    libraryFee: 0,
    hostelFee: 0,
    transportFee: 0,
    miscellaneousFee: 0,
  });

  const [singleInvoiceForm, setSingleInvoiceForm] = useState({
    studentId: '',
    semesterId: '',
    subtotal: 0,
    dueDate: '',
    remarks: '',
  });

  const [bulkInvoiceForm, setBulkInvoiceForm] = useState({
    semesterId: '',
    academicYear: '2026-2027',
    dueDate: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'Bank',
    transactionReference: '',
    remarks: '',
  });

  const [scholarshipForm, setScholarshipForm] = useState({
    studentId: '',
    scholarshipName: 'Academic Excellence Scholarship',
    percentage: 50,
    fixedAmount: 0,
    validFrom: '',
    validTo: '',
  });

  const [refundForm, setRefundForm] = useState({
    remarks: '',
  });

  // Load everything
  useEffect(() => {
    fetchCoreData();
  }, [userRole]);

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      // Parallel fetch for speed & accuracy
      const promises = [
        apiClient.get('/fee-structures').then(res => setFeeStructures(res.data.data)).catch(() => {}),
        apiClient.get('/invoices').then(res => setInvoices(res.data.data)).catch(() => {}),
        apiClient.get('/payments').then(res => setPayments(res.data.data)).catch(() => {}),
        apiClient.get('/scholarships').then(res => setScholarships(res.data.data)).catch(() => {}),
      ];

      if (isStaff) {
        promises.push(apiClient.get('/financial-reports').then(res => setReports(res.data.data)).catch(() => {}));
        promises.push(apiClient.get('/departments').then(res => setDepartments(res.data.data || res.data)).catch(() => {}));
        promises.push(apiClient.get('/programs').then(res => setPrograms(res.data.data || res.data)).catch(() => {}));
        promises.push(apiClient.get('/semesters').then(res => setSemesters(res.data.data || res.data)).catch(() => {}));
        promises.push(apiClient.get('/students').then(res => setStudents(res.data.data || res.data)).catch(() => {}));
      }

      await Promise.all(promises);
    } catch (err) {
      toast.error('Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Fee Structure
  const handleSaveFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        departmentId: feeStructureForm.departmentId ? parseInt(feeStructureForm.departmentId) : null,
        programId: feeStructureForm.programId ? parseInt(feeStructureForm.programId) : null,
        semesterId: feeStructureForm.semesterId ? parseInt(feeStructureForm.semesterId) : null,
        academicYear: feeStructureForm.academicYear,
        admissionFee: Number(feeStructureForm.admissionFee),
        tuitionFee: Number(feeStructureForm.tuitionFee),
        registrationFee: Number(feeStructureForm.registrationFee),
        examinationFee: Number(feeStructureForm.examinationFee),
        libraryFee: Number(feeStructureForm.libraryFee),
        hostelFee: Number(feeStructureForm.hostelFee),
        transportFee: Number(feeStructureForm.transportFee),
        miscellaneousFee: Number(feeStructureForm.miscellaneousFee),
      };

      if (editingStructure) {
        await apiClient.put(`/fee-structures/${editingStructure.id}`, data);
        toast.success('Fee structure updated successfully.');
      } else {
        await apiClient.post('/fee-structures', data);
        toast.success('Fee structure created successfully.');
      }

      setIsStructureModalOpen(false);
      setEditingStructure(null);
      fetchCoreData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save fee structure.');
    }
  };

  const handleDeleteStructure = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await apiClient.delete(`/fee-structures/${id}`);
      toast.success('Fee structure deleted.');
      fetchCoreData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete fee structure.');
    }
  };

  // Custom Invoice creation
  const handleCreateSingleInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        studentId: parseInt(singleInvoiceForm.studentId),
        semesterId: singleInvoiceForm.semesterId ? parseInt(singleInvoiceForm.semesterId) : null,
        dueDate: singleInvoiceForm.dueDate,
        subtotal: Number(singleInvoiceForm.subtotal),
        remarks: singleInvoiceForm.remarks,
      };

      await apiClient.post('/invoices', data);
      toast.success('Manual custom invoice generated.');
      setIsInvoiceModalOpen(false);
      fetchCoreData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice.');
    }
  };

  // Bulk Invoice Generation
  const handleBulkInvoiceGen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        semesterId: parseInt(bulkInvoiceForm.semesterId),
        academicYear: bulkInvoiceForm.academicYear,
        dueDate: bulkInvoiceForm.dueDate,
      };

      const res = await apiClient.post('/invoices', data);
      toast.success(`Success! Generated ${res.data.data?.count || 0} invoices.`);
      setIsBulkInvoiceModalOpen(false);
      fetchCoreData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to bulk generate invoices.');
    }
  };

  // Process manual/online payment
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        invoiceId: selectedInvoiceForPayment.id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference || null,
        remarks: paymentForm.remarks || null,
      };

      await apiClient.post('/payments', data);
      toast.success('Payment successfully captured & registered.');
      setIsPaymentModalOpen(false);
      setSelectedInvoiceForPayment(null);
      setPaymentForm({ amount: 0, paymentMethod: 'Bank', transactionReference: '', remarks: '' });
      fetchCoreData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process payment.');
    }
  };

  // Refund Processor
  const handleRefundPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        paymentId: selectedPaymentForRefund.id,
        remarks: refundForm.remarks,
      };

      await apiClient.post('/refunds', data);
      toast.success('Refund processed successfully.');
      setIsRefundModalOpen(false);
      setSelectedPaymentForRefund(null);
      setRefundForm({ remarks: '' });
      fetchCoreData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process refund.');
    }
  };

  // Apply Scholarship Form
  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        studentId: parseInt(scholarshipForm.studentId),
        scholarshipName: scholarshipForm.scholarshipName,
        percentage: scholarshipForm.percentage ? Number(scholarshipForm.percentage) : null,
        fixedAmount: scholarshipForm.fixedAmount ? Number(scholarshipForm.fixedAmount) : null,
        validFrom: scholarshipForm.validFrom,
        validTo: scholarshipForm.validTo,
      };

      await apiClient.post('/scholarships', data);
      toast.success('Scholarship application submitted.');
      setIsScholarshipModalOpen(false);
      fetchCoreData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply scholarship.');
    }
  };

  const handleUpdateScholarshipStatus = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      await apiClient.put(`/scholarships/${id}`, { status });
      toast.success(`Scholarship status updated to ${status}.`);
      fetchCoreData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update scholarship status.');
    }
  };

  // Filtered lists
  const filteredInvoices = invoices.filter(inv => {
    const studentName = `${inv.student?.user?.firstName || ''} ${inv.student?.user?.lastName || ''}`.toLowerCase();
    const studentRoll = (inv.student?.registrationNumber || '').toLowerCase();
    const invNo = (inv.invoiceNumber || '').toLowerCase();
    const searchMatch =
      studentName.includes(invoiceSearch.toLowerCase()) ||
      studentRoll.includes(invoiceSearch.toLowerCase()) ||
      invNo.includes(invoiceSearch.toLowerCase());

    const statusMatch = !selectedInvoiceStatus || inv.invoiceStatus === selectedInvoiceStatus;
    const semesterMatch = !selectedSemesterFilter || String(inv.semesterId) === selectedSemesterFilter;

    return searchMatch && statusMatch && semesterMatch;
  });

  // Quick statistics
  const totalCollections = payments
    .filter(p => p.paymentStatus === 'Successful')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = invoices
    .filter(i => i.invoiceStatus !== 'Cancelled')
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  const activeScholarshipsCount = scholarships.filter(s => s.status === 'Approved').length;

  return (
    <PageContainer>
      <div className="flex flex-col space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-emerald-600" />
              Enterprise Finance & Fee Management System
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time student fee ledgers, automated billing rules, scholarship workflows, and detailed cashflow analytics.
            </p>
          </div>
          <button
            onClick={fetchCoreData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-3">
          {isStaff && (
            <>
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Executive Dashboard
              </button>
              <button
                onClick={() => setActiveTab('fee_structures')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'fee_structures' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Layers className="w-4 h-4" />
                Fee Structures
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'invoices' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <FileText className="w-4 h-4" />
                Student Invoices
              </button>
              <button
                onClick={() => setActiveTab('payments_receipts')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'payments_receipts' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Receipt className="w-4 h-4" />
                Payments & Receipts
              </button>
              <button
                onClick={() => setActiveTab('scholarships')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'scholarships' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Award className="w-4 h-4" />
                Scholarship Workflows
              </button>
            </>
          )}

          {isStudent && (
            <button
              onClick={() => setActiveTab('student_portal')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'student_portal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <User className="w-4 h-4" />
              Student Finance Portal
            </button>
          )}

          {isParent && (
            <button
              onClick={() => setActiveTab('parent_portal')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'parent_portal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <User className="w-4 h-4" />
              Parent Payment Portal
            </button>
          )}
        </div>

        {/* Core Tab Views */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-slate-500 font-medium mt-3">Loading secure finance logs...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* ========================================================= */}
              {/* EXECUTIVE DASHBOARD VIEW */}
              {/* ========================================================= */}
              {activeTab === 'overview' && reports && (
                <div className="flex flex-col space-y-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Total Revenue Collected</span>
                        <span className="text-2xl font-extrabold text-slate-900 mt-2 block">${reports.summary?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                        <ArrowUpRight className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Outstanding Receivable</span>
                        <span className="text-2xl font-extrabold text-slate-900 mt-2 block">${reports.summary?.outstandingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl">
                        <ArrowDownLeft className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Collection Rate</span>
                        <span className="text-2xl font-extrabold text-slate-900 mt-2 block">{reports.summary?.collectionRate?.toFixed(1)}%</span>
                      </div>
                      <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl">
                        <Percent className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Scholarships Awarded</span>
                        <span className="text-2xl font-extrabold text-slate-900 mt-2 block">${reports.summary?.totalScholarshipAwarded?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl">
                        <Award className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Operational Invoices Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/80 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-emerald-800">Paid Invoices</span>
                        <span className="text-3xl font-extrabold text-emerald-900 mt-1 block">{reports.summary?.paidInvoicesCount || 0}</span>
                      </div>
                      <CheckCircle2 className="w-10 h-10 text-emerald-500/60" />
                    </div>

                    <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/80 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-amber-800">Pending Invoices</span>
                        <span className="text-3xl font-extrabold text-amber-900 mt-1 block">{reports.summary?.pendingInvoicesCount || 0}</span>
                      </div>
                      <Clock className="w-10 h-10 text-amber-500/60" />
                    </div>

                    <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100/80 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-rose-800">Overdue Invoices</span>
                        <span className="text-3xl font-extrabold text-rose-900 mt-1 block">{reports.summary?.overdueInvoicesCount || 0}</span>
                      </div>
                      <AlertTriangle className="w-10 h-10 text-rose-500/60" />
                    </div>
                  </div>

                  {/* Recharts Analytics Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Monthly Collection Trends */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Monthly Cashflow trends</h3>
                      <div className="h-72">
                        {reports.reports?.monthlyCollections?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={reports.reports.monthlyCollections}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                              <YAxis stroke="#94a3b8" fontSize={11} />
                              <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Collection']} />
                              <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400 text-sm">No transaction history detected.</div>
                        )}
                      </div>
                    </div>

                    {/* Department Revenue Contribution */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Departmental Fee Contribution</h3>
                      <div className="h-72">
                        {reports.reports?.departmentRevenue?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reports.reports.departmentRevenue}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} />
                              <YAxis stroke="#94a3b8" fontSize={11} />
                              <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Contribution']} />
                              <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400 text-sm">No department collections captured yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* FEE STRUCTURES TAB */}
              {/* ========================================================= */}
              {activeTab === 'fee_structures' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Programmatic Billing & Fee Configs</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Configure institutional fee models based on program pathways and semesters.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingStructure(null);
                        setFeeStructureForm({
                          departmentId: '',
                          programId: '',
                          semesterId: '',
                          academicYear: '2026-2027',
                          admissionFee: 0,
                          tuitionFee: 0,
                          registrationFee: 0,
                          examinationFee: 0,
                          libraryFee: 0,
                          hostelFee: 0,
                          transportFee: 0,
                          miscellaneousFee: 0,
                        });
                        setIsStructureModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Configure New Fee Structure
                    </button>
                  </div>

                  {feeStructures.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No custom fee structures exist yet. Click above to define your first billing rule.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 tracking-wider">
                            <th className="py-4 px-4 rounded-l-xl">Program & Department</th>
                            <th className="py-4 px-4">Semester</th>
                            <th className="py-4 px-4">Academic Year</th>
                            <th className="py-4 px-4">Tuition Fee</th>
                            <th className="py-4 px-4">Registration</th>
                            <th className="py-4 px-4">Exam Fee</th>
                            <th className="py-4 px-4">Total Amount</th>
                            <th className="py-4 px-4 rounded-r-xl text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                          {feeStructures.map((fs) => (
                            <tr key={fs.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-4 font-semibold">
                                <div>{fs.program?.name || 'All Programs'}</div>
                                <span className="text-xs font-normal text-slate-400">{fs.department?.name || 'All Departments'}</span>
                              </td>
                              <td className="py-4 px-4">{fs.semester?.name || 'All Semesters'}</td>
                              <td className="py-4 px-4 text-xs font-mono bg-slate-50/80 px-2 py-0.5 rounded-md inline-block mt-3">{fs.academicYear}</td>
                              <td className="py-4 px-4 font-mono font-medium">${fs.tuitionFee?.toFixed(2)}</td>
                              <td className="py-4 px-4 font-mono text-slate-500">${fs.registrationFee?.toFixed(2)}</td>
                              <td className="py-4 px-4 font-mono text-slate-500">${fs.examinationFee?.toFixed(2)}</td>
                              <td className="py-4 px-4 font-bold text-slate-900">${fs.totalFee?.toFixed(2)}</td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingStructure(fs);
                                      setFeeStructureForm({
                                        departmentId: fs.departmentId || '',
                                        programId: fs.programId || '',
                                        semesterId: fs.semesterId || '',
                                        academicYear: fs.academicYear,
                                        admissionFee: fs.admissionFee,
                                        tuitionFee: fs.tuitionFee,
                                        registrationFee: fs.registrationFee,
                                        examinationFee: fs.examinationFee,
                                        libraryFee: fs.libraryFee,
                                        hostelFee: fs.hostelFee,
                                        transportFee: fs.transportFee,
                                        miscellaneousFee: fs.miscellaneousFee,
                                      });
                                      setIsStructureModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStructure(fs.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* STUDENT INVOICES TAB */}
              {/* ========================================================= */}
              {activeTab === 'invoices' && (
                <div className="space-y-6">
                  {/* Filter Rail */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                      <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student name, registration ID or invoice #"
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div className="flex flex-wrap w-full md:w-auto gap-3">
                      <select
                        value={selectedInvoiceStatus}
                        onChange={(e) => setSelectedInvoiceStatus(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>

                      <button
                        onClick={() => {
                          setSingleInvoiceForm({
                            studentId: '',
                            semesterId: '',
                            subtotal: 0,
                            dueDate: '',
                            remarks: '',
                          });
                          setIsInvoiceModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Create Manual Invoice
                      </button>

                      <button
                        onClick={() => {
                          setBulkInvoiceForm({
                            semesterId: '',
                            academicYear: '2026-2027',
                            dueDate: '',
                          });
                          setIsBulkInvoiceModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                      >
                        <Layers className="w-4 h-4" />
                        Bulk Semester Generate
                      </button>
                    </div>
                  </div>

                  {/* List View */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    {filteredInvoices.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">No student invoices match the current search filters.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 tracking-wider">
                              <th className="py-4 px-4 rounded-l-xl">Invoice Number</th>
                              <th className="py-4 px-4">Student & program</th>
                              <th className="py-4 px-4">Due Date</th>
                              <th className="py-4 px-4">Total Fee</th>
                              <th className="py-4 px-4">Scholarships</th>
                              <th className="py-4 px-4">Paid Amount</th>
                              <th className="py-4 px-4">Outstanding</th>
                              <th className="py-4 px-4">Status</th>
                              <th className="py-4 px-4 rounded-r-xl text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {filteredInvoices.map((inv) => {
                              const isOverdue = new Date() > new Date(inv.dueDate) && inv.invoiceStatus !== 'Paid';
                              return (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-4 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                                  <td className="py-4 px-4">
                                    <div className="font-semibold text-slate-800">{inv.student?.user?.firstName} {inv.student?.user?.lastName}</div>
                                    <span className="text-xs text-slate-400">{inv.student?.registrationNumber} • {inv.student?.program?.name}</span>
                                  </td>
                                  <td className="py-4 px-4 text-slate-500">
                                    {new Date(inv.dueDate).toLocaleDateString()}
                                    {isOverdue && (
                                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md ml-2 inline-block">Overdue</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 font-mono font-bold text-slate-900">${inv.totalAmount?.toFixed(2)}</td>
                                  <td className="py-4 px-4 text-amber-600 font-mono">-${(inv.scholarshipAmount + inv.discountAmount)?.toFixed(2)}</td>
                                  <td className="py-4 px-4 text-emerald-600 font-mono">${inv.paidAmount?.toFixed(2)}</td>
                                  <td className="py-4 px-4 text-rose-600 font-mono font-bold">${inv.remainingAmount?.toFixed(2)}</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${
                                      inv.invoiceStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      inv.invoiceStatus === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                      inv.invoiceStatus === 'Overdue' || isOverdue ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                      'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                      {isOverdue && inv.invoiceStatus !== 'Paid' ? 'Overdue' : inv.invoiceStatus}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => setSelectedInvoiceForDetail(inv)}
                                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                      >
                                        Inspect
                                      </button>
                                      {inv.remainingAmount > 0 && (
                                        <button
                                          onClick={() => {
                                            setSelectedInvoiceForPayment(inv);
                                            setPaymentForm({ ...paymentForm, amount: inv.remainingAmount });
                                            setIsPaymentModalOpen(true);
                                          }}
                                          className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                                        >
                                          Collect
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* PAYMENTS & RECEIPTS TAB */}
              {/* ========================================================= */}
              {activeTab === 'payments_receipts' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Historic Payment Registry</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Audit log of all processed student fees, receipts, and electronic refund transactions.</p>
                  </div>

                  {payments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No historic payments registered yet in the system.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 tracking-wider">
                            <th className="py-4 px-4 rounded-l-xl">Receipt #</th>
                            <th className="py-4 px-4">Student & Invoice</th>
                            <th className="py-4 px-4">Payment Method</th>
                            <th className="py-4 px-4">Tx Reference</th>
                            <th className="py-4 px-4">Date</th>
                            <th className="py-4 px-4">Amount</th>
                            <th className="py-4 px-4">Status</th>
                            <th className="py-4 px-4 rounded-r-xl text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                          {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-800">{p.invoice?.student?.user?.firstName} {p.invoice?.student?.user?.lastName}</div>
                                <span className="text-xs text-slate-400">{p.invoice?.invoiceNumber}</span>
                              </td>
                              <td className="py-4 px-4 text-slate-600 font-semibold">{p.paymentMethod}</td>
                              <td className="py-4 px-4 font-mono text-xs text-slate-500">{p.transactionReference || 'N/A'}</td>
                              <td className="py-4 px-4 text-slate-500">{new Date(p.paymentDate).toLocaleString()}</td>
                              <td className="py-4 px-4 font-mono font-bold text-slate-900">${p.amount?.toFixed(2)}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                                  p.paymentStatus === 'Successful' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  {p.paymentStatus}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                {p.paymentStatus === 'Successful' && (
                                  <button
                                    onClick={() => {
                                      setSelectedPaymentForRefund(p);
                                      setIsRefundModalOpen(true);
                                    }}
                                    className="px-2 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all"
                                  >
                                    Initiate Refund
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* SCHOLARSHIP WORKFLOWS TAB */}
              {/* ========================================================= */}
              {activeTab === 'scholarships' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Scholarship Approval Desk</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Approve, deny or view student scholarship applications and fee-waiver statuses.</p>
                    </div>
                    <button
                      onClick={() => {
                        setScholarshipForm({
                          studentId: '',
                          scholarshipName: 'Academic Excellence Scholarship',
                          percentage: 50,
                          fixedAmount: 0,
                          validFrom: '',
                          validTo: '',
                        });
                        setIsScholarshipModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Grant Scholarship / Waiver
                    </button>
                  </div>

                  {scholarships.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No active or pending scholarship records found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 tracking-wider">
                            <th className="py-4 px-4 rounded-l-xl">Student name</th>
                            <th className="py-4 px-4">Scholarship / Waiver Description</th>
                            <th className="py-4 px-4">Waiver Value</th>
                            <th className="py-4 px-4">Validity Horizon</th>
                            <th className="py-4 px-4">Approved By</th>
                            <th className="py-4 px-4">Status</th>
                            <th className="py-4 px-4 rounded-r-xl text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                          {scholarships.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-800">{s.student?.user?.firstName} {s.student?.user?.lastName}</div>
                                <span className="text-xs text-slate-400">{s.student?.registrationNumber}</span>
                              </td>
                              <td className="py-4 px-4 font-medium text-slate-700">{s.scholarshipName}</td>
                              <td className="py-4 px-4 font-mono font-bold text-slate-900">
                                {s.percentage ? `${s.percentage}% Tuition Waiver` : `$${s.fixedAmount?.toFixed(2)} Fixed`}
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-500">
                                {new Date(s.validFrom).toLocaleDateString()} - {new Date(s.validTo).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 text-slate-500">{s.approvedBy || 'N/A'}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${
                                  s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  s.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                  'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                {s.status === 'Pending' && (
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handleUpdateScholarshipStatus(s.id, 'Approved')}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                                      title="Approve"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateScholarshipStatus(s.id, 'Rejected')}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                                      title="Reject"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* STUDENT FINANCE PORTAL */}
              {/* ========================================================= */}
              {activeTab === 'student_portal' && (
                <div className="space-y-8">
                  {/* Student Stats Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Outstanding Receivable</span>
                        <span className="text-2xl font-extrabold text-rose-600 mt-2 block">
                          ${invoices
                            .filter(i => i.studentId === user?.id && i.invoiceStatus !== 'Cancelled')
                            .reduce((sum, i) => sum + i.remainingAmount, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl animate-pulse">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Total Paid to Date</span>
                        <span className="text-2xl font-extrabold text-emerald-600 mt-2 block">
                          ${invoices
                            .filter(i => i.studentId === user?.id && i.invoiceStatus !== 'Cancelled')
                            .reduce((sum, i) => sum + i.paidAmount, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Active Scholarships</span>
                        <span className="text-2xl font-extrabold text-slate-900 mt-2 block">
                          {scholarships.filter(s => s.studentId === user?.id && s.status === 'Approved').length}
                        </span>
                      </div>
                      <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl">
                        <Award className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Student Invoices Section */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">My Student Ledger</h3>

                    {invoices.filter(i => i.studentId === user?.id).length === 0 ? (
                      <div className="text-center py-12 text-slate-400">No student invoices generated for your account.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 tracking-wider">
                              <th className="py-4 px-4 rounded-l-xl">Invoice No.</th>
                              <th className="py-4 px-4">Due Date</th>
                              <th className="py-4 px-4">Subtotal</th>
                              <th className="py-4 px-4">Waivers/Scholarship</th>
                              <th className="py-4 px-4">Total Amount</th>
                              <th className="py-4 px-4">Paid Amount</th>
                              <th className="py-4 px-4">Outstanding</th>
                              <th className="py-4 px-4">Status</th>
                              <th className="py-4 px-4 rounded-r-xl text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {invoices
                              .filter(i => i.studentId === user?.id)
                              .map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-4 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                                  <td className="py-4 px-4 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                  <td className="py-4 px-4 font-mono text-slate-500">${inv.subtotal?.toFixed(2)}</td>
                                  <td className="py-4 px-4 text-amber-600 font-mono">-${(inv.scholarshipAmount + inv.discountAmount)?.toFixed(2)}</td>
                                  <td className="py-4 px-4 font-mono font-bold text-slate-900">${inv.totalAmount?.toFixed(2)}</td>
                                  <td className="py-4 px-4 text-emerald-600 font-mono">${inv.paidAmount?.toFixed(2)}</td>
                                  <td className="py-4 px-4 text-rose-600 font-mono font-bold">${inv.remainingAmount?.toFixed(2)}</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${
                                      inv.invoiceStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      inv.invoiceStatus === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                      'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                      {inv.invoiceStatus}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => setSelectedInvoiceForDetail(inv)}
                                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                      >
                                        Receipt
                                      </button>
                                      {inv.remainingAmount > 0 && (
                                        <button
                                          onClick={() => {
                                            setSelectedInvoiceForPayment(inv);
                                            setPaymentForm({ ...paymentForm, amount: inv.remainingAmount });
                                            setIsPaymentModalOpen(true);
                                          }}
                                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all"
                                        >
                                          Pay Online
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* PARENT PAYMENT PORTAL */}
              {/* ========================================================= */}
              {activeTab === 'parent_portal' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">My Child's Academic Fees</h2>
                    <p className="text-xs text-slate-500 mb-6">Review outstanding semesters invoices, access payment history, and checkout securely.</p>

                    {invoices.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">No academic fee invoices mapped under your parenting profile.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 tracking-wider">
                              <th className="py-4 px-4 rounded-l-xl">Child Name</th>
                              <th className="py-4 px-4">Invoice No.</th>
                              <th className="py-4 px-4">Due Date</th>
                              <th className="py-4 px-4">Total Amount</th>
                              <th className="py-4 px-4">Paid</th>
                              <th className="py-4 px-4">Outstanding</th>
                              <th className="py-4 px-4">Status</th>
                              <th className="py-4 px-4 rounded-r-xl text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {invoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 font-semibold text-slate-800">
                                  {inv.student?.user?.firstName} {inv.student?.user?.lastName}
                                  <span className="text-xs font-normal text-slate-400 block">{inv.student?.registrationNumber}</span>
                                </td>
                                <td className="py-4 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                                <td className="py-4 px-4 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                <td className="py-4 px-4 font-mono font-bold text-slate-900">${inv.totalAmount?.toFixed(2)}</td>
                                <td className="py-4 px-4 text-emerald-600 font-mono">${inv.paidAmount?.toFixed(2)}</td>
                                <td className="py-4 px-4 text-rose-600 font-mono font-bold">${inv.remainingAmount?.toFixed(2)}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${
                                    inv.invoiceStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    inv.invoiceStatus === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    {inv.invoiceStatus}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedInvoiceForDetail(inv)}
                                      className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                    >
                                      Receipt
                                    </button>
                                    {inv.remainingAmount > 0 && (
                                      <button
                                        onClick={() => {
                                          setSelectedInvoiceForPayment(inv);
                                          setPaymentForm({ ...paymentForm, amount: inv.remainingAmount });
                                          setIsPaymentModalOpen(true);
                                        }}
                                        className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all"
                                      >
                                        Settle Payment
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================= */}
      {/* MODAL / OVERLAY FOR CREATE/EDIT FEE STRUCTURE */}
      {/* ========================================================= */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">{editingStructure ? 'Edit Fee Config Rule' : 'Configure New Fee Structure'}</h3>
              <button onClick={() => setIsStructureModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeeStructure} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Target Department</label>
                  <select
                    value={feeStructureForm.departmentId}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Target Academic Pathway</label>
                  <select
                    value={feeStructureForm.programId}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, programId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">All Academic Programs</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Target Semester</label>
                  <select
                    value={feeStructureForm.semesterId}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, semesterId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">All Semesters</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={feeStructureForm.academicYear}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Admission Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeStructureForm.admissionFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, admissionFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tuition Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeStructureForm.tuitionFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, tuitionFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Registration Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeStructureForm.registrationFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, registrationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Examination Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeStructureForm.examinationFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, examinationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Library Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeStructureForm.libraryFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, libraryFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Hostel Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeStructureForm.hostelFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, hostelFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Transport Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeStructureForm.transportFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, transportFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Miscellaneous ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeStructureForm.miscellaneousFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, miscellaneousFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL FOR SINGLE MANUAL INVOICE GENERATION */}
      {/* ========================================================= */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Generate Manual Student Invoice</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleInvoice} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Select Student</label>
                <select
                  required
                  value={singleInvoiceForm.studentId}
                  onChange={(e) => setSingleInvoiceForm({ ...singleInvoiceForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.user?.firstName} {s.user?.lastName} ({s.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Select Semester (Optional)</label>
                <select
                  value={singleInvoiceForm.semesterId}
                  onChange={(e) => setSingleInvoiceForm({ ...singleInvoiceForm, semesterId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Not Specified</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Invoice Total Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={singleInvoiceForm.subtotal}
                    onChange={(e) => setSingleInvoiceForm({ ...singleInvoiceForm, subtotal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={singleInvoiceForm.dueDate}
                    onChange={(e) => setSingleInvoiceForm({ ...singleInvoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Remarks / Items Description</label>
                <textarea
                  value={singleInvoiceForm.remarks}
                  onChange={(e) => setSingleInvoiceForm({ ...singleInvoiceForm, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g. Fine/Penalty for damaged library asset"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL FOR BULK SEMESTER INVOICES GENERATION */}
      {/* ========================================================= */}
      {isBulkInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Bulk Semester Invoice Generator</h3>
              <button onClick={() => setIsBulkInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkInvoiceGen} className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs text-emerald-800 leading-relaxed">
                <strong>Important Rule Check:</strong> This wizard automatically evaluates active students in the selected semester, maps their customized tuition rates against configured Fee Rules, applies active scholarships/discounts, and structures pending billing invoices.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Target Semester</label>
                <select
                  required
                  value={bulkInvoiceForm.semesterId}
                  onChange={(e) => setBulkInvoiceForm({ ...bulkInvoiceForm, semesterId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">-- Choose Target Semester --</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={bulkInvoiceForm.academicYear}
                    onChange={(e) => setBulkInvoiceForm({ ...bulkInvoiceForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={bulkInvoiceForm.dueDate}
                    onChange={(e) => setBulkInvoiceForm({ ...bulkInvoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkInvoiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  Initiate Generation Flow
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL FOR COLLECTING / PROCESSING PAYMENTS */}
      {/* ========================================================= */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Secure Gateway Check Out</h3>
              <button onClick={() => {
                setIsPaymentModalOpen(false);
                setSelectedInvoiceForPayment(null);
              }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Student Name:</span>
                  <strong className="text-slate-800">{selectedInvoiceForPayment.student?.user?.firstName} {selectedInvoiceForPayment.student?.user?.lastName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Invoice Reference:</span>
                  <strong className="text-slate-800 font-mono">{selectedInvoiceForPayment.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <span>Outstanding Receivable:</span>
                  <strong className="text-rose-600 font-mono">${selectedInvoiceForPayment.remainingAmount?.toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Enter Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={selectedInvoiceForPayment.remainingAmount}
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Payment Channel</label>
                  <select
                    required
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Bank">Bank Deposit</option>
                    <option value="Card">Visa / MasterCard</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="JazzCash">JazzCash Wallet</option>
                    <option value="EasyPaisa">EasyPaisa Wallet</option>
                    <option value="Stripe">Stripe Checkout</option>
                    <option value="PayPal">PayPal Core</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Transaction Ref / Cheque #</label>
                  <input
                    type="text"
                    placeholder="TXN-xxxxxxx"
                    value={paymentForm.transactionReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Additional context on the payment proof"
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedInvoiceForPayment(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                >
                  Process Checkout
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL FOR DETAILED INVOICE INSPECTOR & RECEIPT DOWNLOAD */}
      {/* ========================================================= */}
      {selectedInvoiceForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Invoice Ledger Statement</h3>
              <button onClick={() => setSelectedInvoiceForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">SMART UNIVERSITY ERP</h4>
                  <span className="text-xs text-slate-500">Official Fee Receipt & Ledger Statement</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Receipt Number</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedInvoiceForDetail.invoiceNumber}</span>
                </div>
              </div>

              {/* Student info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                <div>
                  <span className="font-bold text-slate-500 block mb-0.5">Billed Student</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {selectedInvoiceForDetail.student?.user?.firstName} {selectedInvoiceForDetail.student?.user?.lastName}
                  </div>
                  <span className="text-slate-500">{selectedInvoiceForDetail.student?.registrationNumber}</span>
                  <span className="text-slate-500 block mt-0.5">{selectedInvoiceForDetail.student?.program?.name}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block mb-0.5">Billing Information</span>
                  <div className="text-slate-700">Due Date: <strong>{new Date(selectedInvoiceForDetail.dueDate).toLocaleDateString()}</strong></div>
                  <div className="text-slate-700">Semester Term: <strong>{selectedInvoiceForDetail.semester?.name || 'Academic Term'}</strong></div>
                  <div className="text-slate-700 mt-1">Status: <strong className="text-emerald-700">{selectedInvoiceForDetail.invoiceStatus}</strong></div>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Itemized Ledger Account</span>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Base Semester Tuition Fees</span>
                    <strong className="font-mono text-slate-800">${selectedInvoiceForDetail.subtotal?.toFixed(2)}</strong>
                  </div>

                  {(selectedInvoiceForDetail.scholarshipAmount > 0 || selectedInvoiceForDetail.discountAmount > 0) && (
                    <div className="flex justify-between py-1 text-emerald-600">
                      <span>Scholarship & Institutional Waivers Applied</span>
                      <strong className="font-mono">-${(selectedInvoiceForDetail.scholarshipAmount + selectedInvoiceForDetail.discountAmount)?.toFixed(2)}</strong>
                    </div>
                  )}

                  {selectedInvoiceForDetail.penaltyAmount > 0 && (
                    <div className="flex justify-between py-1 text-rose-600">
                      <span>Overdue Fines & Late Payment Charges</span>
                      <strong className="font-mono">+${selectedInvoiceForDetail.penaltyAmount?.toFixed(2)}</strong>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-250 pt-2 font-bold text-slate-900 text-base">
                    <span>Total Billable Fee</span>
                    <strong className="font-mono">${selectedInvoiceForDetail.totalAmount?.toFixed(2)}</strong>
                  </div>

                  <div className="flex justify-between py-1 text-emerald-600 font-semibold">
                    <span>Total Settled Paid Amount</span>
                    <strong className="font-mono">${selectedInvoiceForDetail.paidAmount?.toFixed(2)}</strong>
                  </div>

                  <div className="flex justify-between border-t border-slate-200/80 pt-2 font-extrabold text-slate-900 text-lg">
                    <span>Outstanding Balance</span>
                    <strong className="font-mono text-rose-600">${selectedInvoiceForDetail.remainingAmount?.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Visual QR Verification & PDF mock buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-150 gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Verify Authenticity</span>
                  <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed max-w-[280px]">Scan the secure ledger QR code to verify this financial statement's encryption hash against university central database logs.</p>
                </div>
                <QRCodeSVG value={`https://smart-university.edu/verify/fees/${selectedInvoiceForDetail.invoiceNumber}`} />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    toast.success('Initiating PDF file compiler rendering...');
                    setTimeout(() => {
                      toast.success('PDF ledger receipt downloaded successfully!');
                    }, 1200);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  Compile & Export PDF
                </button>

                <button
                  onClick={() => setSelectedInvoiceForDetail(null)}
                  className="px-4 py-2 text-sm font-bold text-white bg-slate-950 hover:bg-slate-900 rounded-xl transition-all"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL FOR REGISTERING SCHOLARSHIPS */}
      {/* ========================================================= */}
      {isScholarshipModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Grant Scholarship & Tuition Waiver</h3>
              <button onClick={() => setIsScholarshipModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateScholarship} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Recipient Student</label>
                <select
                  required
                  value={scholarshipForm.studentId}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.user?.firstName} {s.user?.lastName} ({s.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Scholarship / Waiver Name</label>
                <input
                  type="text"
                  required
                  value={scholarshipForm.scholarshipName}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, scholarshipName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g. Athletic Excellence Waiver"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tuition Waiver Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={scholarshipForm.percentage || ''}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, percentage: e.target.value ? Number(e.target.value) : null, fixedAmount: null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                    placeholder="e.g. 50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Or Fixed Waiver Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={scholarshipForm.fixedAmount || ''}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, fixedAmount: e.target.value ? Number(e.target.value) : null, percentage: null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                    placeholder="e.g. 1500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={scholarshipForm.validFrom}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={scholarshipForm.validTo}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, validTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScholarshipModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  Grant Benefit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL FOR PROPOSING PAYMENT REFUNDS */}
      {/* ========================================================= */}
      {isRefundModalOpen && selectedPaymentForRefund && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Refund Payment Receipt</h3>
              <button onClick={() => {
                setIsRefundModalOpen(false);
                setSelectedPaymentForRefund(null);
              }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefundPayment} className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1 text-rose-800">
                <p><strong>Warning!</strong> You are processing an institutional refund of <strong>${selectedPaymentForRefund.amount?.toFixed(2)}</strong> for receipt <strong>{selectedPaymentForRefund.receiptNumber}</strong>.</p>
                <p className="mt-1">This operation will flag the transaction state as <strong>Refunded</strong> and restore outstanding dues on the associated invoice ledger.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Reason for Refund Action</label>
                <textarea
                  required
                  rows={3}
                  value={refundForm.remarks}
                  onChange={(e) => setRefundForm({ ...refundForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g. Erroneous bank wire transfer, double payments captured"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsRefundModalOpen(false);
                    setSelectedPaymentForRefund(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  Approve & Issue Refund
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </PageContainer>
  );
};
export default FeesPage;
