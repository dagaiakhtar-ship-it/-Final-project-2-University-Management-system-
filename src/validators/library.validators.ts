import { z } from 'zod';

export const createBookSchema = z.object({
  isbn: z.string().min(1, 'ISBN is required').max(50, 'ISBN must be 50 characters or less'),
  accessionNumber: z.string().min(1, 'Accession number is required').max(50, 'Accession number must be 50 characters or less'),
  barcode: z.string().max(100, 'Barcode must be 100 characters or less').optional(),
  qrCode: z.string().max(2000, 'QR Code must be 2000 characters or less').optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  subtitle: z.string().max(300, 'Subtitle must be 300 characters or less').optional().nullable(),
  edition: z.string().max(50, 'Edition must be 50 characters or less').optional().nullable(),
  language: z.string().min(1, 'Language is required').max(50, 'Language must be 50 characters or less'),
  categoryId: z.number({ message: 'Category ID is required' }),
  publisherId: z.number().optional().nullable(),
  publicationYear: z.number().int().min(1000, 'Publication year must be >= 1000').max(3000, 'Publication year must be <= 3000'),
  totalCopies: z.number().int().min(1, 'Total copies must be at least 1').max(10000, 'Total copies cannot exceed 10000'),
  shelfLocation: z.string().min(1, 'Shelf location is required').max(100, 'Shelf location must be 100 characters or less'),
  coverImage: z.string().max(2000, 'Cover image URL must be 2000 characters or less').optional().nullable(),
  ebookUrl: z.string().max(2000, 'E-book URL must be 2000 characters or less').optional().nullable(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional().nullable(),
  authorIds: z.array(z.number()).min(1, 'At least one author is required'),
});

export const updateBookSchema = createBookSchema.partial();

export const createAuthorSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name must be 100 characters or less'),
  biography: z.string().max(2000, 'Biography must be 2000 characters or less').optional().nullable(),
  nationality: z.string().max(100, 'Nationality must be 100 characters or less').optional().nullable(),
  birthDate: z.string().max(50).optional().nullable(), // to be parsed as Date
  website: z.string().max(2000, 'Website URL must be 2000 characters or less').optional().nullable(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().nullable(),
});

export const createPublisherSchema = z.object({
  name: z.string().min(1, 'Publisher name is required').max(150, 'Publisher name must be 150 characters or less'),
  address: z.string().max(500, 'Address must be 500 characters or less').optional().nullable(),
  phone: z.string().max(50, 'Phone must be 50 characters or less').optional().nullable(),
  email: z.string().max(100, 'Email must be 100 characters or less').email('Invalid email address format').optional().nullable(),
  website: z.string().max(2000, 'Website URL must be 2000 characters or less').optional().nullable(),
});

export const issueBookSchema = z.object({
  bookId: z.number({ message: 'Book ID is required' }),
  studentId: z.number().optional().nullable(),
  employeeId: z.number().optional().nullable(),
  dueDate: z.string({ message: 'Due date is required' }).max(50), // parsed as Date
});

export const returnBookSchema = z.object({
  issueId: z.number({ message: 'Issue ID is required' }),
  status: z.enum(['Returned', 'Lost', 'Damaged']).default('Returned'),
});

export const renewBookSchema = z.object({
  issueId: z.number({ message: 'Issue ID is required' }),
  daysToAdd: z.number().int().min(1, 'Days to add must be at least 1').max(180, 'Cannot renew for more than 180 days').default(14),
});

export const reserveBookSchema = z.object({
  bookId: z.number({ message: 'Book ID is required' }),
  userId: z.number().optional().nullable(), // defaults to current user ID if not provided
});

