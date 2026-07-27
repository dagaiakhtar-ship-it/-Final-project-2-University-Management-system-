import { prisma } from './db.service';
import { notifyLibraryChange } from './socket.service';
import { v4 as uuidv4 } from 'uuid';

export class LibraryService {
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
      console.error('[LibraryAuditLog] Error writing audit log:', err);
    }
  }

  // Categories
  async getCategories() {
    return await prisma.bookCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { name: string; description?: string | null }, userId?: number) {
    const existing = await prisma.bookCategory.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new Error('A category with this name already exists.');
    }

    const category = await prisma.bookCategory.create({
      data,
    });
    await this.logAudit('CREATE_CATEGORY', 'BookCategory', String(category.id), null, category, userId);
    return category;
  }

  // Publishers
  async getPublishers() {
    return await prisma.bookPublisher.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createPublisher(
    data: { name: string; address?: string | null; phone?: string | null; email?: string | null; website?: string | null },
    userId?: number
  ) {
    const existing = await prisma.bookPublisher.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new Error('A publisher with this name already exists.');
    }

    const publisher = await prisma.bookPublisher.create({
      data,
    });
    await this.logAudit('CREATE_PUBLISHER', 'BookPublisher', String(publisher.id), null, publisher, userId);
    return publisher;
  }

  // Authors
  async getAuthors() {
    return await prisma.author.findMany({
      orderBy: { fullName: 'asc' },
    });
  }

  async createAuthor(
    data: { fullName: string; biography?: string | null; nationality?: string | null; birthDate?: string | null; website?: string | null },
    userId?: number
  ) {
    const birthDateParsed = data.birthDate ? new Date(data.birthDate) : null;
    const existing = await prisma.author.findFirst({
      where: {
        fullName: { equals: data.fullName, mode: 'insensitive' },
        nationality: data.nationality || null,
        birthDate: birthDateParsed,
      },
    });
    if (existing) {
      throw new Error('An author with this name and profile details already exists.');
    }

    const author = await prisma.author.create({
      data: {
        ...data,
        birthDate: birthDateParsed,
      },
    });
    await this.logAudit('CREATE_AUTHOR', 'Author', String(author.id), null, author, userId);
    return author;
  }

  // Books
  async getBooks(filters: {
    isbn?: string;
    barcode?: string;
    qrCode?: string;
    title?: string;
    categoryId?: number;
    publisherId?: number;
    language?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.isbn) where.isbn = filters.isbn;
    if (filters.barcode) where.barcode = filters.barcode;
    if (filters.qrCode) where.qrCode = filters.qrCode;
    if (filters.categoryId) where.categoryId = Number(filters.categoryId);
    if (filters.publisherId) where.publisherId = Number(filters.publisherId);
    if (filters.language) where.language = filters.language;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { subtitle: { contains: filters.search, mode: 'insensitive' } },
        { isbn: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        {
          authors: {
            some: {
              author: {
                fullName: { contains: filters.search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    return await prisma.book.findMany({
      where,
      include: {
        category: true,
        publisher: true,
        authors: {
          include: {
            author: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBook(
    data: {
      isbn: string;
      accessionNumber: string;
      barcode?: string;
      qrCode?: string;
      title: string;
      subtitle?: string | null;
      edition?: string | null;
      language: string;
      categoryId: number;
      publisherId?: number | null;
      publicationYear: number;
      totalCopies: number;
      shelfLocation: string;
      coverImage?: string | null;
      ebookUrl?: string | null;
      description?: string | null;
      authorIds: number[];
    },
    userId?: number
  ) {
    // 1. Unique constraint checks
    const existingIsbn = await prisma.book.findUnique({ where: { isbn: data.isbn } });
    if (existingIsbn) {
      throw new Error('A book with this ISBN already exists.');
    }
    const existingAccession = await prisma.book.findUnique({ where: { accessionNumber: data.accessionNumber } });
    if (existingAccession) {
      throw new Error('A book with this Accession Number already exists.');
    }

    const barcode = data.barcode || `BAR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const qrCode = data.qrCode || `QR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const existingBarcode = await prisma.book.findUnique({ where: { barcode } });
    if (existingBarcode) {
      throw new Error('A book with this Barcode already exists.');
    }

    // 2. Relation checks (Category, Publisher, Authors)
    const categoryExists = await prisma.bookCategory.findUnique({ where: { id: data.categoryId } });
    if (!categoryExists) {
      throw new Error('The specified category does not exist.');
    }

    if (data.publisherId) {
      const publisherExists = await prisma.bookPublisher.findUnique({ where: { id: data.publisherId } });
      if (!publisherExists) {
        throw new Error('The specified publisher does not exist.');
      }
    }

    if (data.authorIds && data.authorIds.length > 0) {
      const authorsCount = await prisma.author.count({
        where: { id: { in: data.authorIds } },
      });
      if (authorsCount !== data.authorIds.length) {
        throw new Error('One or more specified authors do not exist.');
      }
    }

    const book = await prisma.$transaction(async (tx) => {
      const newBook = await tx.book.create({
        data: {
          isbn: data.isbn,
          accessionNumber: data.accessionNumber,
          barcode,
          qrCode,
          title: data.title,
          subtitle: data.subtitle,
          edition: data.edition,
          language: data.language,
          categoryId: data.categoryId,
          publisherId: data.publisherId,
          publicationYear: data.publicationYear,
          totalCopies: data.totalCopies,
          availableCopies: data.totalCopies,
          shelfLocation: data.shelfLocation,
          coverImage: data.coverImage,
          ebookUrl: data.ebookUrl,
          description: data.description,
          status: 'Available',
        },
      });

      // Map authors
      if (data.authorIds && data.authorIds.length > 0) {
        await tx.bookAuthorRelation.createMany({
          data: data.authorIds.map((authorId) => ({
            bookId: newBook.id,
            authorId,
          })),
        });
      }

      return newBook;
    });

    await this.logAudit('CREATE_BOOK', 'Book', String(book.id), null, book, userId);
    return book;
  }

  async updateBook(
    id: number,
    data: {
      isbn?: string;
      accessionNumber?: string;
      barcode?: string;
      qrCode?: string;
      title?: string;
      subtitle?: string | null;
      edition?: string | null;
      language?: string;
      categoryId?: number;
      publisherId?: number | null;
      publicationYear?: number;
      totalCopies?: number;
      shelfLocation?: string;
      coverImage?: string | null;
      ebookUrl?: string | null;
      description?: string | null;
      authorIds?: number[];
      status?: string;
    },
    userId?: number
  ) {
    const oldBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!oldBook) {
      throw new Error('Book not found');
    }

    // 1. Unique constraint checks for other books
    if (data.isbn && data.isbn !== oldBook.isbn) {
      const existingIsbn = await prisma.book.findUnique({ where: { isbn: data.isbn } });
      if (existingIsbn) {
        throw new Error('A book with this ISBN already exists.');
      }
    }
    if (data.accessionNumber && data.accessionNumber !== oldBook.accessionNumber) {
      const existingAccession = await prisma.book.findUnique({ where: { accessionNumber: data.accessionNumber } });
      if (existingAccession) {
        throw new Error('A book with this Accession Number already exists.');
      }
    }
    if (data.barcode && data.barcode !== oldBook.barcode) {
      const existingBarcode = await prisma.book.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) {
        throw new Error('A book with this Barcode already exists.');
      }
    }
    if (data.qrCode && data.qrCode !== oldBook.qrCode) {
      const existingQrCode = await prisma.book.findFirst({ where: { qrCode: data.qrCode } });
      if (existingQrCode) {
        throw new Error('A book with this QR Code already exists.');
      }
    }

    // 2. Relation checks
    if (data.categoryId && data.categoryId !== oldBook.categoryId) {
      const categoryExists = await prisma.bookCategory.findUnique({ where: { id: data.categoryId } });
      if (!categoryExists) {
        throw new Error('The specified category does not exist.');
      }
    }

    if (data.publisherId) {
      const publisherExists = await prisma.bookPublisher.findUnique({ where: { id: data.publisherId } });
      if (!publisherExists) {
        throw new Error('The specified publisher does not exist.');
      }
    }

    if (data.authorIds && data.authorIds.length > 0) {
      const authorsCount = await prisma.author.count({
        where: { id: { in: data.authorIds } },
      });
      if (authorsCount !== data.authorIds.length) {
        throw new Error('One or more specified authors do not exist.');
      }
    }

    const updatedBook = await prisma.$transaction(async (tx) => {
      let availableCopies = oldBook.availableCopies;
      if (data.totalCopies !== undefined) {
        const diff = data.totalCopies - oldBook.totalCopies;
        availableCopies = Math.max(0, oldBook.availableCopies + diff);
      }

      const updated = await tx.book.update({
        where: { id },
        data: {
          isbn: data.isbn,
          accessionNumber: data.accessionNumber,
          barcode: data.barcode,
          qrCode: data.qrCode,
          title: data.title,
          subtitle: data.subtitle,
          edition: data.edition,
          language: data.language,
          categoryId: data.categoryId,
          publisherId: data.publisherId,
          publicationYear: data.publicationYear,
          totalCopies: data.totalCopies,
          availableCopies,
          shelfLocation: data.shelfLocation,
          coverImage: data.coverImage,
          ebookUrl: data.ebookUrl,
          description: data.description,
          status: data.status,
        },
      });

      if (data.authorIds) {
        await tx.bookAuthorRelation.deleteMany({
          where: { bookId: id },
        });

        if (data.authorIds.length > 0) {
          await tx.bookAuthorRelation.createMany({
            data: data.authorIds.map((authorId) => ({
              bookId: id,
              authorId,
            })),
          });
        }
      }

      return updated;
    });

    await this.logAudit('UPDATE_BOOK', 'Book', String(id), oldBook, updatedBook, userId);
    return updatedBook;
  }

  async deleteBook(id: number, userId?: number) {
    const oldBook = await prisma.book.findUnique({
      where: { id },
    });
    if (!oldBook) throw new Error('Book not found');

    await prisma.book.delete({
      where: { id },
    });

    await this.logAudit('DELETE_BOOK', 'Book', String(id), oldBook, null, userId);
    return { success: true };
  }

  // Book Issuing logic
  async issueBook(
    data: {
      bookId: number;
      studentId?: number | null;
      employeeId?: number | null;
      dueDate: string;
    },
    userId?: number
  ) {
    const book = await prisma.book.findUnique({
      where: { id: data.bookId },
    });

    if (!book) {
      throw new Error('Book not found');
    }

    if (book.availableCopies <= 0) {
      throw new Error('No physical copies available for issue');
    }

    // Check duplicate issue
    const existingIssue = await prisma.bookIssue.findFirst({
      where: {
        bookId: data.bookId,
        studentId: data.studentId || null,
        employeeId: data.employeeId || null,
        issueStatus: 'Issued',
      },
    });

    if (existingIssue) {
      throw new Error('This reader already has an active issue of this book');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create issue record
      const issue = await tx.bookIssue.create({
        data: {
          bookId: data.bookId,
          studentId: data.studentId || null,
          employeeId: data.employeeId || null,
          issueDate: new Date(),
          dueDate: new Date(data.dueDate),
          issueStatus: 'Issued',
          fineAmount: 0.0,
          overdueDays: 0,
        },
        include: {
          book: true,
          student: true,
          employee: true,
        },
      });

      // Update copies count
      await tx.book.update({
        where: { id: data.bookId },
        data: {
          availableCopies: book.availableCopies - 1,
          status: book.availableCopies - 1 === 0 ? 'Issued' : 'Available',
        },
      });

      return issue;
    });

    // Notify reader if student/employee has user account
    let readerUserId: number | undefined;
    if (data.studentId) {
      const st = await prisma.student.findUnique({ where: { id: data.studentId } });
      readerUserId = st?.userId;
    } else if (data.employeeId) {
      const tc = await prisma.teacher.findUnique({ where: { id: data.employeeId } });
      readerUserId = tc?.userId;
    }

    notifyLibraryChange('BOOK_ISSUED', {
      userId: readerUserId,
      bookId: data.bookId,
      message: `Book "${book.title}" has been issued to you. Due date: ${new Date(data.dueDate).toLocaleDateString()}`,
    });

    await this.logAudit('ISSUE_BOOK', 'BookIssue', String(result.id), null, result, userId);
    return result;
  }

  // Return logic
  async returnBook(data: { issueId: number; status: 'Returned' | 'Lost' | 'Damaged' }, userId?: number) {
    const issue = await prisma.bookIssue.findUnique({
      where: { id: data.issueId },
      include: { book: true },
    });

    if (!issue) {
      throw new Error('Issue record not found');
    }

    if (issue.issueStatus !== 'Issued' && issue.issueStatus !== 'Overdue') {
      throw new Error('This issue is already processed or closed');
    }

    const today = new Date();
    let overdueDays = 0;
    let fineAmount = 0.0;

    if (today > issue.dueDate) {
      const diffTime = Math.abs(today.getTime() - issue.dueDate.getTime());
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Standard Fine calculation: $2 or equivalent per day overdue
      fineAmount = overdueDays * 2.0;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update issue record
      const updatedIssue = await tx.bookIssue.update({
        where: { id: data.issueId },
        data: {
          returnDate: today,
          issueStatus: data.status,
          overdueDays,
          fineAmount,
        },
        include: {
          book: true,
          student: true,
          employee: true,
        },
      });

      const bookId = issue.bookId;
      const bookRecord = await tx.book.findUnique({ where: { id: bookId } });

      if (bookRecord) {
        if (data.status === 'Returned' || data.status === 'Damaged') {
          // Check for waiting list/pending reservation
          const pendingReservation = await tx.bookReservation.findFirst({
            where: {
              bookId,
              reservationStatus: 'Pending',
            },
            orderBy: { queuePosition: 'asc' },
          });

          if (pendingReservation) {
            // Set reservation status to 'Ready' and hold copy for reservation
            await tx.bookReservation.update({
              where: { id: pendingReservation.id },
              data: {
                reservationStatus: 'Ready',
                expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Ready for 3 days
              },
            });

            // Adjust queue positions for remaining
            const otherReservations = await tx.bookReservation.findMany({
              where: { bookId, reservationStatus: 'Pending' },
              orderBy: { queuePosition: 'asc' },
            });

            for (let i = 0; i < otherReservations.length; i++) {
              await tx.bookReservation.update({
                where: { id: otherReservations[i].id },
                data: { queuePosition: Math.max(1, otherReservations[i].queuePosition - 1) },
              });
            }

            // Book status changes to reserved
            await tx.book.update({
              where: { id: bookId },
              data: {
                status: 'Reserved',
              },
            });

            // Notify reserved user
            notifyLibraryChange('BOOK_AVAILABLE', {
              userId: pendingReservation.userId,
              bookId,
              message: `The book "${bookRecord.title}" you reserved is now available! Please collect it within 3 days.`,
            });
          } else {
            // No waiting list, return copy to availability pool
            await tx.book.update({
              where: { id: bookId },
              data: {
                availableCopies: bookRecord.availableCopies + 1,
                status: 'Available',
              },
            });
          }
        } else if (data.status === 'Lost') {
          // Lost book - copies count stays reduced
          await tx.book.update({
            where: { id: bookId },
            data: {
              totalCopies: Math.max(0, bookRecord.totalCopies - 1),
              status: bookRecord.availableCopies === 0 ? 'Lost' : bookRecord.status,
            },
          });
        }
      }

      return updatedIssue;
    });

    let readerUserId: number | undefined;
    if (issue.studentId) {
      const st = await prisma.student.findUnique({ where: { id: issue.studentId } });
      readerUserId = st?.userId;
    } else if (issue.employeeId) {
      const tc = await prisma.teacher.findUnique({ where: { id: issue.employeeId } });
      readerUserId = tc?.userId;
    }

    notifyLibraryChange('BOOK_RETURNED', {
      userId: readerUserId,
      bookId: issue.bookId,
      message: `Book "${issue.book.title}" has been successfully marked as ${data.status.toLowerCase()}. Fines incurred: $${fineAmount}`,
    });

    if (fineAmount > 0) {
      notifyLibraryChange('FINE_GENERATED', {
        userId: readerUserId,
        bookId: issue.bookId,
        message: `An overdue fine of $${fineAmount} has been generated for "${issue.book.title}".`,
      });
    }

    await this.logAudit('RETURN_BOOK', 'BookIssue', String(issue.id), issue, result, userId);
    return result;
  }

  // Renewal Logic
  async renewBook(id: number, daysToAdd: number = 14, userId?: number) {
    const issue = await prisma.bookIssue.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!issue) {
      throw new Error('Issue record not found');
    }

    if (issue.issueStatus !== 'Issued' && issue.issueStatus !== 'Overdue') {
      throw new Error('Only active issued books can be renewed');
    }

    // Business Rule check: Prevent renewal if there is a pending reservation list
    const hasReservations = await prisma.bookReservation.findFirst({
      where: {
        bookId: issue.bookId,
        reservationStatus: 'Pending',
      },
    });

    if (hasReservations) {
      throw new Error('This book has a pending reservation waiting list. Renewal is denied.');
    }

    const currentDueDate = new Date(issue.dueDate);
    const newDueDate = new Date(currentDueDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const updated = await prisma.bookIssue.update({
      where: { id },
      data: {
        dueDate: newDueDate,
        renewalCount: issue.renewalCount + 1,
      },
      include: {
        book: true,
        student: true,
        employee: true,
      },
    });

    let readerUserId: number | undefined;
    if (issue.studentId) {
      const st = await prisma.student.findUnique({ where: { id: issue.studentId } });
      readerUserId = st?.userId;
    } else if (issue.employeeId) {
      const tc = await prisma.teacher.findUnique({ where: { id: issue.employeeId } });
      readerUserId = tc?.userId;
    }

    notifyLibraryChange('BOOK_ISSUED', {
      userId: readerUserId,
      bookId: issue.bookId,
      message: `Your loan of "${issue.book.title}" was renewed. New due date: ${newDueDate.toLocaleDateString()}`,
    });

    await this.logAudit('RENEW_BOOK', 'BookIssue', String(id), issue, updated, userId);
    return updated;
  }

  // Reservation Logic
  async reserveBook(bookId: number, resUserId: number, loggedInUserId?: number) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new Error('Book not found');
    }

    // Check duplicate reservation
    const duplicate = await prisma.bookReservation.findFirst({
      where: {
        bookId,
        userId: resUserId,
        reservationStatus: { in: ['Pending', 'Ready'] },
      },
    });

    if (duplicate) {
      throw new Error('You already have an active reservation for this book');
    }

    const today = new Date();
    const expiryDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // Pending holds active for 14 days

    const result = await prisma.$transaction(async (tx) => {
      let reservationStatus = 'Pending';
      let queuePosition = 1;

      if (book.availableCopies > 0) {
        reservationStatus = 'Ready';
        expiryDate.setTime(today.getTime() + 3 * 24 * 60 * 60 * 1000); // Ready hold is 3 days
        queuePosition = 1;

        // Decrement availability
        await tx.book.update({
          where: { id: bookId },
          data: {
            availableCopies: book.availableCopies - 1,
            status: 'Reserved',
          },
        });
      } else {
        const count = await tx.bookReservation.count({
          where: { bookId, reservationStatus: 'Pending' },
        });
        queuePosition = count + 1;
      }

      const reservation = await tx.bookReservation.create({
        data: {
          bookId,
          userId: resUserId,
          reservationStatus,
          queuePosition,
          expiryDate,
        },
        include: {
          book: true,
          user: true,
        },
      });

      return reservation;
    });

    notifyLibraryChange('BOOK_RESERVED', {
      userId: resUserId,
      bookId,
      message: `You successfully reserved "${book.title}". Status: ${result.reservationStatus}. Queue position: ${result.queuePosition}`,
    });

    await this.logAudit('RESERVE_BOOK', 'BookReservation', String(result.id), null, result, loggedInUserId);
    return result;
  }

  async getReservations(userId?: number) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    return await prisma.bookReservation.findMany({
      where,
      include: {
        book: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelReservation(id: number, userId?: number) {
    const reservation = await prisma.bookReservation.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.reservationStatus !== 'Pending' && reservation.reservationStatus !== 'Ready') {
      throw new Error('Cannot cancel reservation in this state');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.bookReservation.update({
        where: { id },
        data: {
          reservationStatus: 'Cancelled',
        },
      });

      if (reservation.reservationStatus === 'Ready') {
        const bookId = reservation.bookId;
        const bookRecord = await tx.book.findUnique({ where: { id: bookId } });

        if (bookRecord) {
          // Check other pending reservations
          const pending = await tx.bookReservation.findFirst({
            where: { bookId, reservationStatus: 'Pending' },
            orderBy: { queuePosition: 'asc' },
          });

          if (pending) {
            await tx.bookReservation.update({
              where: { id: pending.id },
              data: {
                reservationStatus: 'Ready',
                expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              },
            });

            // Re-order queues
            const otherReservations = await tx.bookReservation.findMany({
              where: { bookId, reservationStatus: 'Pending' },
              orderBy: { queuePosition: 'asc' },
            });

            for (let i = 0; i < otherReservations.length; i++) {
              await tx.bookReservation.update({
                where: { id: otherReservations[i].id },
                data: { queuePosition: Math.max(1, otherReservations[i].queuePosition - 1) },
              });
            }
          } else {
            // Restore copies count
            await tx.book.update({
              where: { id: bookId },
              data: {
                availableCopies: bookRecord.availableCopies + 1,
                status: 'Available',
              },
            });
          }
        }
      } else {
        // Shift queue positions up
        const otherReservations = await tx.bookReservation.findMany({
          where: {
            bookId: reservation.bookId,
            reservationStatus: 'Pending',
            queuePosition: { gt: reservation.queuePosition },
          },
          orderBy: { queuePosition: 'asc' },
        });

        for (const res of otherReservations) {
          await tx.bookReservation.update({
            where: { id: res.id },
            data: { queuePosition: Math.max(1, res.queuePosition - 1) },
          });
        }
      }

      return cancelled;
    });

    await this.logAudit('CANCEL_RESERVATION', 'BookReservation', String(id), reservation, updated, userId);
    return updated;
  }

  // General History and active loans/issues
  async getIssues(filters: { studentId?: number; employeeId?: number; status?: string; bookId?: number }) {
    const where: any = {};
    if (filters.studentId) where.studentId = Number(filters.studentId);
    if (filters.employeeId) where.employeeId = Number(filters.employeeId);
    if (filters.bookId) where.bookId = Number(filters.bookId);
    if (filters.status) {
      where.issueStatus = filters.status;
    }

    return await prisma.bookIssue.findMany({
      where,
      include: {
        book: {
          include: {
            category: true,
          },
        },
        student: true,
        employee: true,
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  // Overdue Fines
  async getOverdueFines(userId?: number) {
    const where: any = {
      fineAmount: { gt: 0.0 },
    };

    if (userId) {
      const student = await prisma.student.findUnique({ where: { userId } });
      const teacher = await prisma.teacher.findUnique({ where: { userId } });

      where.OR = [
        ...(student ? [{ studentId: student.id }] : []),
        ...(teacher ? [{ employeeId: teacher.id }] : []),
      ];
    }

    return await prisma.bookIssue.findMany({
      where,
      include: {
        book: true,
        student: true,
        employee: true,
      },
      orderBy: { returnDate: 'desc' },
    });
  }

  // Analytics
  async getLibraryAnalytics() {
    const totalBooks = await prisma.book.count();
    const sumTotalCopies = await prisma.book.aggregate({ _sum: { totalCopies: true } });
    const sumAvailableCopies = await prisma.book.aggregate({ _sum: { availableCopies: true } });

    const totalCopies = sumTotalCopies._sum.totalCopies || 0;
    const availableCopies = sumAvailableCopies._sum.availableCopies || 0;
    const issuedCopies = Math.max(0, totalCopies - availableCopies);

    const reservedBooksCount = await prisma.bookReservation.count({
      where: { reservationStatus: 'Ready' },
    });

    const today = new Date();
    const overdueIssuesCount = await prisma.bookIssue.count({
      where: {
        issueStatus: 'Issued',
        dueDate: { lt: today },
      },
    });

    // Active Readers (unique users issuing or reserving)
    const activeIssueStudentIds = await prisma.bookIssue.findMany({
      where: { issueStatus: 'Issued' },
      select: { studentId: true, employeeId: true },
    });
    const uniqueReaders = new Set();
    activeIssueStudentIds.forEach((i) => {
      if (i.studentId) uniqueReaders.add(`st-${i.studentId}`);
      if (i.employeeId) uniqueReaders.add(`em-${i.employeeId}`);
    });

    const activeReservations = await prisma.bookReservation.findMany({
      where: { reservationStatus: { in: ['Pending', 'Ready'] } },
      select: { userId: true },
    });
    activeReservations.forEach((r) => uniqueReaders.add(`u-${r.userId}`));

    // Fine aggregate
    const finesAggregate = await prisma.bookIssue.aggregate({
      _sum: { fineAmount: true },
    });
    const totalFines = finesAggregate._sum.fineAmount || 0.0;

    // Popular Books (Most Borrowed)
    const issues = await prisma.bookIssue.findMany({
      select: { bookId: true },
    });
    const issueCounts: Record<number, number> = {};
    issues.forEach((i) => {
      issueCounts[i.bookId] = (issueCounts[i.bookId] || 0) + 1;
    });

    const popularBookIds = Object.keys(issueCounts)
      .map(Number)
      .sort((a, b) => issueCounts[b] - issueCounts[a])
      .slice(0, 5);

    const popularBooks = await prisma.book.findMany({
      where: { id: { in: popularBookIds } },
      include: { category: true },
    });

    const popularBooksWithCounts = popularBooks.map((b) => ({
      ...b,
      borrowCount: issueCounts[b.id] || 0,
    }));

    // Recent Transactions (Issues, returns, reservations)
    const recentIssues = await prisma.bookIssue.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        book: true,
        student: true,
        employee: true,
      },
    });

    const recentReservations = await prisma.bookReservation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        book: true,
        user: true,
      },
    });

    // Category usage
    const categories = await prisma.bookCategory.findMany({
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    const categoryUsage = categories.map((c) => ({
      name: c.name,
      value: c._count.books,
    }));

    // Monthly borrowing trends
    const loansByMonth = await prisma.bookIssue.findMany({
      select: { issueDate: true },
    });
    const monthlyBorrowing: Record<string, number> = {};
    loansByMonth.forEach((l) => {
      const monthStr = l.issueDate.toLocaleString('default', { month: 'short' });
      monthlyBorrowing[monthStr] = (monthlyBorrowing[monthStr] || 0) + 1;
    });

    const monthlyData = Object.keys(monthlyBorrowing).map((k) => ({
      month: k,
      borrowings: monthlyBorrowing[k],
    }));

    return {
      stats: {
        totalBooks,
        availableBooks: availableCopies,
        issuedBooks: issuedCopies,
        reservedBooks: reservedBooksCount,
        overdueBooks: overdueIssuesCount,
        activeReaders: uniqueReaders.size,
        fineCollection: totalFines,
      },
      popularBooks: popularBooksWithCounts.sort((a, b) => b.borrowCount - a.borrowCount),
      recentTransactions: {
        issues: recentIssues,
        reservations: recentReservations,
      },
      categoryUsage,
      monthlyBorrowing: monthlyData,
    };
  }
}

export const libraryService = new LibraryService();
