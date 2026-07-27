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
  Book, LayoutDashboard, Bookmark, RefreshCw,
  Layers, ShieldAlert, Award, FileText, Search,
  Plus, Trash2, Edit2, CheckCircle2, XCircle,
  AlertTriangle, QrCode, BookOpen, Clock, DollarSign,
  User, Check, X, Calendar, ArrowRightLeft, Download, ExternalLink, Library
} from 'lucide-react';

// Simulated visual barcode
const BarcodeSVG: React.FC<{ value: string }> = ({ value }) => {
  return (
    <div className="flex flex-col items-center p-2.5 bg-white rounded-xl border border-slate-200">
      <svg width="180" height="50" className="opacity-90">
        <g fill="black">
          {[...Array(30)].map((_, i) => {
            const width = (i % 3 === 0) ? 3.5 : (i % 2 === 0) ? 1.5 : 2.5;
            const x = i * 5.5 + 10;
            return <rect key={i} x={x} y="5" width={width} height="40" />;
          })}
        </g>
      </svg>
      <span className="text-[10px] font-mono font-bold mt-1 tracking-widest uppercase">{value}</span>
    </div>
  );
};

// Simulated visual QR code
const QRCodeSVG: React.FC<{ value: string }> = ({ value }) => {
  return (
    <div className="flex flex-col items-center p-2.5 bg-white rounded-xl border border-slate-200">
      <div className="w-24 h-24 bg-slate-100 flex flex-wrap p-1.5 border border-slate-200 rounded-lg">
        {[...Array(144)].map((_, i) => {
          const row = Math.floor(i / 12);
          const col = i % 12;
          const isMarker =
            (row < 3 && col < 3) ||
            (row < 3 && col >= 9) ||
            (row >= 9 && col < 3);
          const isDark = isMarker || (Math.sin(i * 3.14) > 0);
          return (
            <div
              key={i}
              className={`w-[8.33%] h-[8.33%] ${isDark ? 'bg-slate-900' : 'bg-transparent'}`}
            />
          );
        })}
      </div>
      <span className="text-[9px] font-mono text-slate-500 mt-1.5 max-w-[120px] truncate">{value}</span>
    </div>
  );
};

export const LibraryPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  // State Management
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  // Entities Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);

  // Filters & Search
  const [bookSearch, setBookSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  // Modals / Modifiers
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<any>(null);

  // Setup / Creation Form Inputs
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newAuthor, setNewAuthor] = useState({ fullName: '', biography: '', nationality: '', birthDate: '', website: '' });
  const [newPublisher, setNewPublisher] = useState({ name: '', address: '', phone: '', email: '', website: '' });

  const [newBookForm, setNewBookForm] = useState({
    isbn: '',
    accessionNumber: '',
    barcode: '',
    qrCode: '',
    title: '',
    subtitle: '',
    edition: '',
    language: 'English',
    categoryId: '',
    publisherId: '',
    publicationYear: new Date().getFullYear(),
    totalCopies: 1,
    shelfLocation: '',
    coverImage: '',
    ebookUrl: '',
    description: '',
    authorIds: [] as number[],
  });

  const [issueForm, setIssueForm] = useState({
    studentId: '',
    employeeId: '',
    dueDate: '',
  });

  // Role configuration
  const isLibrarian = ['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'].includes(userRole);

  const tabs = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', name: 'Books Catalogue', icon: Book },
    { id: 'digital', name: 'Digital Library', icon: BookOpen },
    { id: 'circulation', name: 'Loans & Circulation', icon: ArrowRightLeft, librarianOnly: true },
    { id: 'reservations', name: 'Reservations', icon: Bookmark },
    { id: 'fines', name: 'Overdues & Fines', icon: DollarSign },
    { id: 'setup', name: 'Librarian Settings', icon: Layers, librarianOnly: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.librarianOnly || isLibrarian);

  // Fetch API Helper
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        analyticsRes,
        booksRes,
        catsRes,
        pubsRes,
        authorsRes,
        reservationsRes,
        finesRes,
      ] = await Promise.all([
        apiClient.get('/library/analytics'),
        apiClient.get('/library/books'),
        apiClient.get('/library/categories'),
        apiClient.get('/library/publishers'),
        apiClient.get('/library/authors'),
        apiClient.get('/library/reservations'),
        apiClient.get('/library/fines'),
      ]);

      setAnalytics(analyticsRes.data);
      setBooks(booksRes.data);
      setCategories(catsRes.data);
      setPublishers(pubsRes.data);
      setAuthors(authorsRes.data);
      setReservations(reservationsRes.data);
      setFines(finesRes.data);

      if (isLibrarian) {
        const issuesRes = await apiClient.get('/library/issues');
        setIssues(issuesRes.data);
      } else {
        // Fetch reader's individual active issues
        const issuesRes = await apiClient.get('/library/issues');
        setIssues(issuesRes.data);
      }
    } catch (err: any) {
      toast.error('Error fetching library records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  // Handle Book Creation/Editing
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookForm.title || !newBookForm.isbn || !newBookForm.categoryId || !newBookForm.authorIds.length) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        ...newBookForm,
        categoryId: Number(newBookForm.categoryId),
        publisherId: newBookForm.publisherId ? Number(newBookForm.publisherId) : null,
        publicationYear: Number(newBookForm.publicationYear),
        totalCopies: Number(newBookForm.totalCopies),
      };

      if (editingBook) {
        await apiClient.put(`/library/books/${editingBook.id}`, payload);
        toast.success('Book updated successfully');
      } else {
        await apiClient.post('/library/books', payload);
        toast.success('Book registered successfully');
      }

      setIsBookModalOpen(false);
      setEditingBook(null);
      resetBookForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save book record');
    }
  };

  const handleEditBook = (book: any) => {
    setEditingBook(book);
    setNewBookForm({
      isbn: book.isbn,
      accessionNumber: book.accessionNumber,
      barcode: book.barcode || '',
      qrCode: book.qrCode || '',
      title: book.title,
      subtitle: book.subtitle || '',
      edition: book.edition || '',
      language: book.language,
      categoryId: String(book.categoryId),
      publisherId: book.publisherId ? String(book.publisherId) : '',
      publicationYear: book.publicationYear,
      totalCopies: book.totalCopies,
      shelfLocation: book.shelfLocation,
      coverImage: book.coverImage || '',
      ebookUrl: book.ebookUrl || '',
      description: book.description || '',
      authorIds: book.authors?.map((a: any) => a.authorId) || [],
    });
    setIsBookModalOpen(true);
  };

  const handleDeleteBook = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this book from the system?')) return;
    try {
      await apiClient.delete(`/library/books/${id}`);
      toast.success('Book removed from catalogue');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete book');
    }
  };

  const resetBookForm = () => {
    setNewBookForm({
      isbn: '',
      accessionNumber: '',
      barcode: '',
      qrCode: '',
      title: '',
      subtitle: '',
      edition: '',
      language: 'English',
      categoryId: '',
      publisherId: '',
      publicationYear: new Date().getFullYear(),
      totalCopies: 1,
      shelfLocation: '',
      coverImage: '',
      ebookUrl: '',
      description: '',
      authorIds: [],
    });
  };

  // Quick setup creates
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    try {
      await apiClient.post('/library/categories', newCategory);
      toast.success('Category created');
      setNewCategory({ name: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create category');
    }
  };

  const handleCreateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.fullName) return;
    try {
      await apiClient.post('/library/authors', newAuthor);
      toast.success('Author profile created');
      setNewAuthor({ fullName: '', biography: '', nationality: '', birthDate: '', website: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to save author');
    }
  };

  const handleCreatePublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPublisher.name) return;
    try {
      await apiClient.post('/library/publishers', newPublisher);
      toast.success('Publisher registered');
      setNewPublisher({ name: '', address: '', phone: '', email: '', website: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to save publisher');
    }
  };

  // Issue / Return / Renewal Flows
  const handleOpenIssue = (book: any) => {
    setSelectedBookForIssue(book);
    setIsIssueModalOpen(true);
  };

  const handleIssueBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.dueDate || (!issueForm.studentId && !issueForm.employeeId)) {
      toast.error('Please specify a reader ID and due date');
      return;
    }

    try {
      await apiClient.post('/library/issue', {
        bookId: selectedBookForIssue.id,
        studentId: issueForm.studentId ? Number(issueForm.studentId) : null,
        employeeId: issueForm.employeeId ? Number(issueForm.employeeId) : null,
        dueDate: issueForm.dueDate,
      });

      toast.success('Book issued successfully');
      setIsIssueModalOpen(false);
      setIssueForm({ studentId: '', employeeId: '', dueDate: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to issue book');
    }
  };

  const handleReturnBook = async (issueId: number, status: string = 'Returned') => {
    if (!window.confirm(`Process return of book with status: ${status}?`)) return;
    try {
      await apiClient.post('/library/return', { issueId, status });
      toast.success('Return processing complete');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Return processing failed');
    }
  };

  const handleRenewBook = async (issueId: number) => {
    try {
      await apiClient.post('/library/renew', { issueId, daysToAdd: 14 });
      toast.success('Loan renewed for 14 additional days');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Renewal denied');
    }
  };

  // Reservation Flow
  const handleReserveBook = async (bookId: number) => {
    try {
      await apiClient.post('/library/reserve', { bookId });
      toast.success('Reservation processed successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to complete reservation');
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await apiClient.delete(`/library/reservations/${id}`);
      toast.success('Reservation cancelled');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to cancel reservation');
    }
  };

  // Color mapping helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">Available</span>;
      case 'Issued':
        return <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">Issued</span>;
      case 'Reserved':
        return <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full">Reserved</span>;
      case 'Lost':
        return <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full">Lost</span>;
      case 'Damaged':
        return <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">Damaged</span>;
      default:
        return <span className="bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full">{status}</span>;
    }
  };

  // Filter books catalogue
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (book.subtitle && book.subtitle.toLowerCase().includes(bookSearch.toLowerCase())) ||
      book.isbn.toLowerCase().includes(bookSearch.toLowerCase()) ||
      book.shelfLocation.toLowerCase().includes(bookSearch.toLowerCase()) ||
      book.authors.some((a: any) => a.author.fullName.toLowerCase().includes(bookSearch.toLowerCase()));

    const matchesCat = selectedCategory ? book.categoryId === Number(selectedCategory) : true;
    const matchesLang = selectedLanguage ? book.language === selectedLanguage : true;

    return matchesSearch && matchesCat && matchesLang;
  });

  return (
    <PageContainer title="Enterprise Library System">
      <div className="space-y-6" id="library-master-module">
        
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px scrollbar-thin">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px ${
                  isSelected
                    ? 'border-indigo-600 text-indigo-700 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="text-indigo-600 animate-spin mb-4" size={32} />
            <p className="text-sm font-semibold text-slate-400">Loading university library records...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
            {/* Overview Tab */}
            {activeTab === 'overview' && analytics && (
              <div className="space-y-6">
                
                {/* Banner */}
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-950 text-white rounded-xl p-6 relative overflow-hidden shadow-md">
                  <div className="relative z-10 max-w-xl">
                    <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
                      <Library size={24} className="text-indigo-300 animate-pulse" />
                      Smart Library Operations Dashboard
                    </h2>
                    <p className="text-xs text-indigo-150 leading-relaxed">
                      Librarian workspace for books acquisitions, tracking real-time borrow/returns, overdue fine monitoring, and cataloging.
                    </p>
                  </div>
                  <div className="absolute right-6 bottom-0 opacity-10 transform translate-y-6 select-none pointer-events-none">
                    <Book size={200} />
                  </div>
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: 'Total Titles', val: analytics.stats.totalBooks, sub: 'Unique Catalogued Books', icon: Book, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                    { title: 'Circulating Now', val: analytics.stats.issuedBooks, sub: 'Active Book Loans', icon: ArrowRightLeft, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { title: 'Overdue Books', val: analytics.stats.overdueBooks, sub: 'Past Return Date', icon: Clock, color: 'text-rose-600 bg-rose-50 border-rose-100' },
                    { title: 'Active Readers', val: analytics.stats.activeReaders, sub: 'Total Borrowers', icon: User, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between shadow-sm bg-white hover:shadow transition-shadow`}>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                          <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{card.val}</h3>
                          <p className="text-[9px] text-slate-400 mt-0.5">{card.sub}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${card.color}`}>
                          <Icon size={18} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recharts Analysis Graphs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Usage Chart */}
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                    <h3 className="font-extrabold text-slate-800 text-sm mb-1">Catalogue Distribution</h3>
                    <p className="text-[10px] text-slate-400 mb-4">Percentage of total catalogued books grouped by category</p>
                    <div className="h-64">
                      {analytics.categoryUsage && analytics.categoryUsage.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.categoryUsage}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {analytics.categoryUsage.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 6]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any, name: any, props: any) => [`${value} books`, props.payload.name]} />
                            <Legend formatter={(value, entry: any) => <span className="text-xs font-semibold text-slate-600">{value}</span>} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs font-bold text-slate-300">No category statistics available</div>
                      )}
                    </div>
                  </div>

                  {/* Monthly Loan trends */}
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                    <h3 className="font-extrabold text-slate-800 text-sm mb-1">Monthly Borrowing Trends</h3>
                    <p className="text-[10px] text-slate-400 mb-4">Total number of book circulation loans registered monthly</p>
                    <div className="h-64">
                      {analytics.monthlyBorrowing && analytics.monthlyBorrowing.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.monthlyBorrowing}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: '600' }} />
                            <YAxis tick={{ fontSize: 10, fontWeight: '600' }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="borrowings" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs font-bold text-slate-300">No dynamic borrowing history yet</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid for popular books & recent transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Popular Books */}
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                    <h3 className="font-extrabold text-slate-800 text-sm mb-3">Popular Titles / Most Borrowed</h3>
                    <div className="space-y-3">
                      {analytics.popularBooks && analytics.popularBooks.length > 0 ? (
                        analytics.popularBooks.map((book: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-10 bg-slate-100 rounded flex items-center justify-center border text-indigo-600 font-bold text-[10px]">
                                {book.coverImage ? (
                                  <img src={book.coverImage} className="w-full h-full object-cover rounded" />
                                ) : (
                                  'BK'
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{book.title}</h4>
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block">
                                  {book.category?.name || 'General'}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                              {book.borrowCount} Loans
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 font-bold">No checkout statistics logged yet</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Transactions logs */}
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                    <h3 className="font-extrabold text-slate-800 text-sm mb-3">Recent Circulation Transactions</h3>
                    <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
                      {analytics.recentTransactions.issues && analytics.recentTransactions.issues.length > 0 ? (
                        analytics.recentTransactions.issues.map((tx: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 border-b border-slate-50 pb-2 last:border-0">
                            <div className="mt-0.5 p-1 rounded-lg bg-slate-100 text-indigo-600">
                              <ArrowRightLeft size={14} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-800">
                                Book Check-Out: "{tx.book?.title}"
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5">
                                Issued to: {tx.student ? `Student #${tx.student.studentNumber}` : `Employee #${tx.employee?.employeeNumber}`} • Status: {tx.issueStatus}
                              </p>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">
                              {new Date(tx.issueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 font-bold">No active transactions reported</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Books Catalogue View */}
            {activeTab === 'books' && (
              <div className="space-y-6">
                
                {/* Search Bar & Header controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search books by title, author, isbn, shelf location..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white font-semibold text-slate-600"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white font-semibold text-slate-600"
                    >
                      <option value="">All Languages</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>

                    {isLibrarian && (
                      <button
                        onClick={() => {
                          setEditingBook(null);
                          resetBookForm();
                          setIsBookModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm"
                      >
                        <Plus size={14} /> Add New Title
                      </button>
                    )}
                  </div>
                </div>

                {/* Books Grid */}
                {filteredBooks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredBooks.map((book) => (
                      <div key={book.id} className="border border-slate-150 rounded-xl p-4 flex gap-4 bg-white hover:shadow-md transition-shadow relative overflow-hidden">
                        
                        {/* Book Cover */}
                        <div className="w-20 h-28 bg-slate-100 border border-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 font-extrabold relative overflow-hidden">
                          {book.coverImage ? (
                            <img src={book.coverImage} className="w-full h-full object-cover" />
                          ) : (
                            <Book size={28} className="text-slate-300" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">
                                {book.category?.name || 'General'}
                              </span>
                              {getStatusBadge(book.status)}
                            </div>
                            <h3 className="text-xs font-extrabold text-slate-800 truncate" title={book.title}>
                              {book.title}
                            </h3>
                            {book.subtitle && <p className="text-[10px] text-slate-400 truncate mb-1">{book.subtitle}</p>}
                            <p className="text-[10px] text-slate-500 font-bold truncate">
                              By {book.authors?.map((a: any) => a.author?.fullName).join(', ') || 'Unknown'}
                            </p>
                            <p className="text-[9px] font-mono text-slate-400 mt-1">ISBN: {book.isbn}</p>
                          </div>

                          <div className="border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-bold">Shelf: {book.shelfLocation}</span>
                            <span className="font-semibold text-slate-400">
                              Available: <strong className="text-indigo-600">{book.availableCopies}</strong>/{book.totalCopies}
                            </span>
                          </div>
                        </div>

                        {/* Hover Overlay Buttons for Actions */}
                        <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-80">
                          {isLibrarian && (
                            <>
                              <button
                                onClick={() => handleEditBook(book)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                                title="Edit Book"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteBook(book.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                                title="Delete Title"
                              >
                                <Trash2 size={12} />
                              </button>
                              <button
                                onClick={() => handleOpenIssue(book)}
                                disabled={book.availableCopies <= 0}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-600 rounded-lg"
                                title="Issue Book"
                              >
                                <ArrowRightLeft size={12} />
                              </button>
                            </>
                          )}
                          {!isLibrarian && (
                            <button
                              onClick={() => handleReserveBook(book.id)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg"
                              title="Reserve Copy"
                            >
                              <Bookmark size={12} />
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Book size={40} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-400">No matching books found in catalogue</p>
                  </div>
                )}

              </div>
            )}

            {/* Digital Library E-Books View */}
            {activeTab === 'digital' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl p-5 mb-4 shadow-sm">
                  <h3 className="text-base font-extrabold mb-1">Digital Catalog & E-Books Access</h3>
                  <p className="text-[10px] text-blue-100">Instantly read, download or stream PDF literature and digital materials directly from academic publishers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {books.filter(b => b.ebookUrl).map((book) => (
                    <div key={book.id} className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-16 bg-indigo-50 border text-indigo-600 flex items-center justify-center font-bold text-xs rounded-lg">
                          PDF
                        </div>
                        <div>
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded uppercase">
                            Digital Media
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 mt-0.5">{book.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate">By {book.authors?.map((a: any) => a.author?.fullName).join(', ')}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-mono">ISBN: {book.isbn}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={book.ebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold py-2 rounded-lg"
                        >
                          <BookOpen size={12} /> Read Material
                        </a>
                        <a
                          href={book.ebookUrl}
                          download
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                          title="Download Offline Copy"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </div>
                  ))}

                  {books.filter(b => b.ebookUrl).length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <BookOpen size={36} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">No E-Book digital resources linked at this time</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Circulation (Librarian Only) */}
            {activeTab === 'circulation' && isLibrarian && (
              <div className="space-y-6">
                <h3 className="font-extrabold text-sm text-slate-800 mb-3 border-b pb-2">Circulation Desk / Active Loans</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[9px]">
                        <th className="p-3">Title</th>
                        <th className="p-3">Reader / Member</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {issues.map((loan) => {
                        const isOverdue = loan.issueStatus === 'Issued' && new Date() > new Date(loan.dueDate);
                        return (
                          <tr key={loan.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <p className="font-extrabold text-slate-800">{loan.book?.title}</p>
                              <span className="text-[9px] font-mono text-slate-400">Acc: {loan.book?.accessionNumber}</span>
                            </td>
                            <td className="p-3">
                              {loan.student ? (
                                <div>
                                  <p className="font-bold text-slate-800">{loan.student.firstName} {loan.student.lastName}</p>
                                  <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Student #{loan.student.studentNumber}</span>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-bold text-slate-800">{loan.employee?.firstName} {loan.employee?.lastName}</p>
                                  <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Staff #{loan.employee?.employeeNumber}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-3">{new Date(loan.issueDate).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                {new Date(loan.dueDate).toLocaleDateString()}
                              </span>
                              {isOverdue && <span className="ml-1 text-[8px] bg-rose-50 text-rose-600 font-black px-1 rounded">LATE</span>}
                            </td>
                            <td className="p-3">
                              {getStatusBadge(loan.issueStatus)}
                            </td>
                            <td className="p-3 text-right space-x-1.5">
                              {(loan.issueStatus === 'Issued' || loan.issueStatus === 'Overdue') && (
                                <>
                                  <button
                                    onClick={() => handleReturnBook(loan.id, 'Returned')}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded"
                                  >
                                    Return
                                  </button>
                                  <button
                                    onClick={() => handleRenewBook(loan.id)}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded"
                                  >
                                    Renew
                                  </button>
                                  <button
                                    onClick={() => handleReturnBook(loan.id, 'Lost')}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded"
                                  >
                                    Lost
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {issues.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">No books checkouts logged on active sheets</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reservations Tab */}
            {activeTab === 'reservations' && (
              <div className="space-y-6">
                <h3 className="font-extrabold text-sm text-slate-800 mb-3 border-b pb-2">Book Holds & Waiting Queue</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[9px]">
                        <th className="p-3">Book Title</th>
                        <th className="p-3">User Account</th>
                        <th className="p-3">Queue position</th>
                        <th className="p-3">Expires On</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reservations.map((res) => (
                        <tr key={res.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{res.book?.title}</td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-800">{res.user?.firstName} {res.user?.lastName}</p>
                            <span className="text-[9px] text-slate-400 font-mono">{res.user?.email}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              Pos #{res.queuePosition}
                            </span>
                          </td>
                          <td className="p-3">{res.expiryDate ? new Date(res.expiryDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              res.reservationStatus === 'Ready'
                                ? 'bg-emerald-50 text-emerald-700'
                                : res.reservationStatus === 'Pending'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-50 text-slate-500'
                            }`}>
                              {res.reservationStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {(res.reservationStatus === 'Pending' || res.reservationStatus === 'Ready') && (
                              <button
                                onClick={() => handleCancelReservation(res.id)}
                                className="text-rose-600 hover:text-rose-800 text-[10px] font-bold p-1 bg-rose-50 rounded"
                              >
                                Cancel Hold
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}

                      {reservations.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">No active holds on the reservation desk</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Overdue & Fines View */}
            {activeTab === 'fines' && (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm mb-1">Overdue Loans & Fine Balances</h3>
                    <p className="text-[10px] text-slate-400">Track and pay fines incurred on books returned past due date limit</p>
                  </div>
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
                    <DollarSign className="text-rose-600" size={18} />
                    <span className="text-lg font-black text-rose-800">
                      Total Collectable Fines: ${analytics?.stats?.fineCollection || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[9px]">
                        <th className="p-3">Book Title</th>
                        <th className="p-3">Borrower Details</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Days Overdue</th>
                        <th className="p-3">Fine Incurred</th>
                        <th className="p-3">Issue status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {fines.map((fine) => (
                        <tr key={fine.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{fine.book?.title}</td>
                          <td className="p-3">
                            {fine.student ? (
                              <p className="font-bold text-slate-800">Student #{fine.student.studentNumber}</p>
                            ) : (
                              <p className="font-bold text-slate-800">Staff #{fine.employee?.employeeNumber}</p>
                            )}
                          </td>
                          <td className="p-3">{new Date(fine.dueDate).toLocaleDateString()}</td>
                          <td className="p-3 text-rose-600 font-bold">{fine.overdueDays} Days overdue</td>
                          <td className="p-3 text-rose-700 font-extrabold text-sm">${fine.fineAmount?.toFixed(2)}</td>
                          <td className="p-3">{getStatusBadge(fine.issueStatus)}</td>
                        </tr>
                      ))}

                      {fines.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">Excellent! No overdue fine logs in the system ledger</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Librarian Setup Tab */}
            {activeTab === 'setup' && isLibrarian && (
              <div className="space-y-8">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider mb-3">Barcode & QR Code Reference</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-dashed border-slate-200">
                      <BarcodeSVG value="ISBN 9783161484100" />
                      <p className="text-[10px] text-slate-400 mt-2 text-center font-semibold">Standard layout for print labels attached to physical book covers</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-dashed border-slate-200">
                      <QRCodeSVG value="LIBRARY-CATALOG-01" />
                      <p className="text-[10px] text-slate-400 mt-2 text-center font-semibold">Smart QR system for quick check-ins and student scanning</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Category Form */}
                  <form onSubmit={handleCreateCategory} className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-3.5">
                    <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5 border-b pb-1.5">
                      <Layers size={14} className="text-indigo-600" /> Book Categories Setup
                    </h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Category Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Computer Science"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                      <textarea
                        placeholder="Optional details"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white h-20"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg">
                      Create Category
                    </button>
                  </form>

                  {/* Author Form */}
                  <form onSubmit={handleCreateAuthor} className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5 border-b pb-1.5">
                      <User size={14} className="text-indigo-600" /> Authors Profile Directory
                    </h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Robert Martin"
                        value={newAuthor.fullName}
                        onChange={(e) => setNewAuthor({ ...newAuthor, fullName: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Biography</label>
                      <textarea
                        placeholder="Bio overview..."
                        value={newAuthor.biography}
                        onChange={(e) => setNewAuthor({ ...newAuthor, biography: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white h-14"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Nationality</label>
                        <input
                          type="text"
                          placeholder="USA"
                          value={newAuthor.nationality}
                          onChange={(e) => setNewAuthor({ ...newAuthor, nationality: e.target.value })}
                          className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Birth Date</label>
                        <input
                          type="date"
                          value={newAuthor.birthDate}
                          onChange={(e) => setNewAuthor({ ...newAuthor, birthDate: e.target.value })}
                          className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg">
                      Save Author
                    </button>
                  </form>

                  {/* Publisher Form */}
                  <form onSubmit={handleCreatePublisher} className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5 border-b pb-1.5">
                      <FileText size={14} className="text-indigo-600" /> Publisher Registry
                    </h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Publisher Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. O'Reilly Media"
                        value={newPublisher.name}
                        onChange={(e) => setNewPublisher({ ...newPublisher, name: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Address / Contact</label>
                      <input
                        type="text"
                        placeholder="California, USA"
                        value={newPublisher.address}
                        onChange={(e) => setNewPublisher({ ...newPublisher, address: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Email</label>
                        <input
                          type="email"
                          placeholder="press@oreilly.com"
                          value={newPublisher.email}
                          onChange={(e) => setNewPublisher({ ...newPublisher, email: e.target.value })}
                          className="w-full mt-1 p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Website</label>
                        <input
                          type="text"
                          placeholder="oreilly.com"
                          value={newPublisher.website}
                          onChange={(e) => setNewPublisher({ ...newPublisher, website: e.target.value })}
                          className="w-full mt-1 p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg">
                      Register Publisher
                    </button>
                  </form>

                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- MODALS ----------------- */}
        
        {/* Book creation / edit modal */}
        <AnimatePresence>
          {isBookModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-100"
              >
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-sm font-black text-slate-800">
                    {editingBook ? `Edit Book Details: ${editingBook.title}` : 'Catalogue New Book Title'}
                  </h3>
                  <button onClick={() => setIsBookModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveBook} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">ISBN Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="978-3-16-148410-0"
                        value={newBookForm.isbn}
                        onChange={(e) => setNewBookForm({ ...newBookForm, isbn: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Accession Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="ACC-2026-001"
                        value={newBookForm.accessionNumber}
                        onChange={(e) => setNewBookForm({ ...newBookForm, accessionNumber: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Book Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="Core TypeScript Architecture"
                        value={newBookForm.title}
                        onChange={(e) => setNewBookForm({ ...newBookForm, title: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Category *</label>
                      <select
                        required
                        value={newBookForm.categoryId}
                        onChange={(e) => setNewBookForm({ ...newBookForm, categoryId: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-600"
                      >
                        <option value="">Choose category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Publisher</label>
                      <select
                        value={newBookForm.publisherId}
                        onChange={(e) => setNewBookForm({ ...newBookForm, publisherId: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-600"
                      >
                        <option value="">Select publisher</option>
                        {publishers.map((pub) => (
                          <option key={pub.id} value={pub.id}>{pub.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Edition</label>
                      <input
                        type="text"
                        placeholder="3rd Edition"
                        value={newBookForm.edition}
                        onChange={(e) => setNewBookForm({ ...newBookForm, edition: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Authors *</label>
                    <select
                      multiple
                      required
                      value={newBookForm.authorIds.map(String)}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                        setNewBookForm({ ...newBookForm, authorIds: values });
                      }}
                      className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white h-24 text-slate-600"
                    >
                      {authors.map((a) => (
                        <option key={a.id} value={a.id}>{a.fullName}</option>
                      ))}
                    </select>
                    <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Hold Ctrl (or Cmd) to select multiple authors</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Language</label>
                      <input
                        type="text"
                        required
                        value={newBookForm.language}
                        onChange={(e) => setNewBookForm({ ...newBookForm, language: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Publication Year</label>
                      <input
                        type="number"
                        required
                        value={newBookForm.publicationYear}
                        onChange={(e) => setNewBookForm({ ...newBookForm, publicationYear: Number(e.target.value) })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Total Copies</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newBookForm.totalCopies}
                        onChange={(e) => setNewBookForm({ ...newBookForm, totalCopies: Number(e.target.value) })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Shelf location</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rack A-4"
                        value={newBookForm.shelfLocation}
                        onChange={(e) => setNewBookForm({ ...newBookForm, shelfLocation: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Digital Media PDF Link (E-Book)</label>
                      <input
                        type="url"
                        placeholder="https://example.com/literature.pdf"
                        value={newBookForm.ebookUrl}
                        onChange={(e) => setNewBookForm({ ...newBookForm, ebookUrl: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Book Cover Photo URL</label>
                      <input
                        type="url"
                        placeholder="https://example.com/cover.jpg"
                        value={newBookForm.coverImage}
                        onChange={(e) => setNewBookForm({ ...newBookForm, coverImage: e.target.value })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Overview Summary</label>
                    <textarea
                      placeholder="Enter a description..."
                      value={newBookForm.description}
                      onChange={(e) => setNewBookForm({ ...newBookForm, description: e.target.value })}
                      className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white h-16"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setIsBookModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                    >
                      Close Dialog
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    >
                      Commit Catalogue
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Issue Book Modal dialog */}
        <AnimatePresence>
          {isIssueModalOpen && selectedBookForIssue && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100"
              >
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-sm font-black text-slate-800">
                    Checkout Book Loan Desk
                  </h3>
                  <button onClick={() => setIsIssueModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl mb-4 text-xs font-semibold">
                  <p className="text-[10px] uppercase text-indigo-700 tracking-wider">Title to loan:</p>
                  <h4 className="text-sm font-black text-indigo-900 mt-0.5">{selectedBookForIssue.title}</h4>
                  <p className="text-[10px] text-indigo-500 mt-1">
                    Acc #: {selectedBookForIssue.accessionNumber} • Shelf Location: {selectedBookForIssue.shelfLocation}
                  </p>
                </div>

                <form onSubmit={handleIssueBookSubmit} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Student DB ID</label>
                      <input
                        type="number"
                        placeholder="e.g. 1"
                        value={issueForm.studentId}
                        onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value, employeeId: '' })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Or Teacher/Employee ID</label>
                      <input
                        type="number"
                        placeholder="e.g. 3"
                        value={issueForm.employeeId}
                        onChange={(e) => setIssueForm({ ...issueForm, employeeId: e.target.value, studentId: '' })}
                        className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={issueForm.dueDate}
                      onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                      className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsIssueModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                    >
                      Cancel checkout
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                    >
                      Approve & Handover
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </PageContainer>
  );
};

export default LibraryPage;
