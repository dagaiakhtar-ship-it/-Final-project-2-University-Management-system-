import { Request, Response, NextFunction } from 'express';
import { libraryService } from '../services/library.service';
import {
  createBookSchema,
  updateBookSchema,
  createAuthorSchema,
  createCategorySchema,
  createPublisherSchema,
  issueBookSchema,
  returnBookSchema,
  renewBookSchema,
  reserveBookSchema,
} from '../validators/library.validators';

export class LibraryController {
  // Categories
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await libraryService.getCategories();
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createCategorySchema.parse(req.body);
      const category = await libraryService.createCategory(validated, (req as any).user?.id);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  // Publishers
  async getPublishers(req: Request, res: Response, next: NextFunction) {
    try {
      const publishers = await libraryService.getPublishers();
      res.status(200).json(publishers);
    } catch (error) {
      next(error);
    }
  }

  async createPublisher(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createPublisherSchema.parse(req.body);
      const publisher = await libraryService.createPublisher(validated, (req as any).user?.id);
      res.status(201).json(publisher);
    } catch (error) {
      next(error);
    }
  }

  // Authors
  async getAuthors(req: Request, res: Response, next: NextFunction) {
    try {
      const authors = await libraryService.getAuthors();
      res.status(200).json(authors);
    } catch (error) {
      next(error);
    }
  }

  async createAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createAuthorSchema.parse(req.body);
      const author = await libraryService.createAuthor(validated, (req as any).user?.id);
      res.status(201).json(author);
    } catch (error) {
      next(error);
    }
  }

  // Books
  async getBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const { isbn, barcode, qrCode, title, categoryId, publisherId, language, status, search } = req.query;
      const books = await libraryService.getBooks({
        isbn: isbn as string,
        barcode: barcode as string,
        qrCode: qrCode as string,
        title: title as string,
        categoryId: categoryId ? Number(categoryId) : undefined,
        publisherId: publisherId ? Number(publisherId) : undefined,
        language: language as string,
        status: status as string,
        search: search as string,
      });
      res.status(200).json(books);
    } catch (error) {
      next(error);
    }
  }

  async createBook(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createBookSchema.parse(req.body);
      const book = await libraryService.createBook(validated, (req as any).user?.id);
      res.status(201).json(book);
    } catch (error) {
      next(error);
    }
  }

  async updateBook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateBookSchema.parse(req.body);
      const book = await libraryService.updateBook(Number(id), validated, (req as any).user?.id);
      res.status(200).json(book);
    } catch (error) {
      next(error);
    }
  }

  async deleteBook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await libraryService.deleteBook(Number(id), (req as any).user?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Issuing
  async issueBook(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = issueBookSchema.parse(req.body);
      const issue = await libraryService.issueBook(validated, (req as any).user?.id);
      res.status(201).json(issue);
    } catch (error) {
      next(error);
    }
  }

  async returnBook(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = returnBookSchema.parse(req.body);
      const issue = await libraryService.returnBook(
        {
          issueId: validated.issueId,
          status: validated.status,
        },
        (req as any).user?.id
      );
      res.status(200).json(issue);
    } catch (error) {
      next(error);
    }
  }

  async renewBook(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = renewBookSchema.parse(req.body);
      const issue = await libraryService.renewBook(validated.issueId, validated.daysToAdd, (req as any).user?.id);
      res.status(200).json(issue);
    } catch (error) {
      next(error);
    }
  }

  // Reservation
  async reserveBook(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = reserveBookSchema.parse(req.body);
      const resUserId = validated.userId || (req as any).user?.id;
      if (!resUserId) {
        return res.status(400).json({ error: 'User ID is required for reservation' });
      }
      const reservation = await libraryService.reserveBook(validated.bookId, resUserId, (req as any).user?.id);
      res.status(201).json(reservation);
    } catch (error) {
      next(error);
    }
  }

  async getReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.query;
      const reservations = await libraryService.getReservations(userId ? Number(userId) : undefined);
      res.status(200).json(reservations);
    } catch (error) {
      next(error);
    }
  }

  async cancelReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const reservation = await libraryService.cancelReservation(Number(id), (req as any).user?.id);
      res.status(200).json(reservation);
    } catch (error) {
      next(error);
    }
  }

  // Issues and Loans history
  async getIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, employeeId, status, bookId } = req.query;
      const loans = await libraryService.getIssues({
        studentId: studentId ? Number(studentId) : undefined,
        employeeId: employeeId ? Number(employeeId) : undefined,
        bookId: bookId ? Number(bookId) : undefined,
        status: status as string,
      });
      res.status(200).json(loans);
    } catch (error) {
      next(error);
    }
  }

  // Fines
  async getOverdueFines(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.query;
      const fines = await libraryService.getOverdueFines(userId ? Number(userId) : undefined);
      res.status(200).json(fines);
    } catch (error) {
      next(error);
    }
  }

  // Analytics
  async getLibraryAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await libraryService.getLibraryAnalytics();
      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }
}

export const libraryController = new LibraryController();
