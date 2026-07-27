import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../services/db.service';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { getSocketServer } from '../services/socket.service';
import { auditService } from '../services/audit.service';

export const cmsRouter = Router();

// Rate Limiter for CMS write/modify endpoints (POST, PUT, DELETE)
// Protects the server against spamming, rapid creation, and DoS
const cmsWriteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60, // limit each IP to 60 modification requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many modification requests from this IP. Please try again after 5 minutes.',
  },
});

// XSS Input Sanitizer Helper
// Safely strips <script> tags, inline javascript event handlers (e.g. onclick, onerror), and javascript: URLs.
// This allows rich formatting (bold, links, headers) while neutralizing security exploits.
function sanitizeContent(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'])(.*?)\1/gi, '')
    .replace(/javascript:\s*/gi, '');
}

// Socket Helper
function emitCmsEvent(action: string, payload: any) {
  try {
    const io = getSocketServer();
    if (io) {
      io.emit('cms:changed', { action, payload });
    }
  } catch (err) {
    console.error('Failed to emit CMS socket notification:', err);
  }
}

// Slug Generator Helper
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Zod schemas
const cmsPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional().nullable(),
  pageType: z.enum(['Home', 'About', 'Admission', 'Academic', 'Research', 'Department', 'Static', 'Landing', 'Custom']),
  content: z.string().min(1, 'Content is required'),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  published: z.boolean().default(false),
  publishedAt: z.string().optional().nullable(),
});

const newsArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  featuredImage: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  content: z.string().min(1, 'Content is required'),
  authorId: z.coerce.number().optional().nullable(),
  published: z.boolean().default(false),
  publishedAt: z.string().optional().nullable(),
  featured: z.boolean().default(false),
});

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start Date is required'),
  endDate: z.string().min(1, 'End Date is required'),
  organizer: z.string().min(1, 'Organizer is required'),
  registrationRequired: z.boolean().default(false),
  capacity: z.coerce.number().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  published: z.boolean().default(false),
});

const mediaSchema = z.object({
  fileName: z.string().min(1, 'File Name is required'),
  fileType: z.string().min(1, 'File Type is required'),
  fileUrl: z.string().url('Invalid File URL'),
  folder: z.string().default('General'),
  tags: z.string().optional().nullable(),
});

// Helper middleware to allow non-logged-in access on GET but require auth for others
const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await authenticate(req, res, (err?: any) => {
        if (err) {
          console.warn('[OptionalAuth] Auth token failed, proceeding as guest:', err.message || err);
          req.user = undefined;
        }
        next();
      });
    } else {
      next();
    }
  } catch (err) {
    next();
  }
};

// ---------------------------------------------------------
// 1. CMS Page Endpoints
// ---------------------------------------------------------
cmsRouter.get('/cms/pages', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isEditor = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    const filters: any = {};
    if (!isEditor) {
      filters.published = true;
    }

    if (req.query.pageType) {
      filters.pageType = req.query.pageType as string;
    }

    if (req.query.q) {
      filters.OR = [
        { title: { contains: req.query.q as string, mode: 'insensitive' } },
        { content: { contains: req.query.q as string, mode: 'insensitive' } },
      ];
    }

    const pages = await prisma.cmsPage.findMany({
      where: filters,
      orderBy: { title: 'asc' },
    });
    res.status(200).json({ status: 'success', data: pages });
  } catch (err) {
    next(err);
  }
});

cmsRouter.get('/cms/pages/:idOrSlug', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;
    const isEditor = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);

    const isNumeric = /^\d+$/.test(idOrSlug);
    const filter: any = isNumeric ? { id: parseInt(idOrSlug, 10) } : { slug: idOrSlug };

    const page = await prisma.cmsPage.findFirst({
      where: filter,
    });

    if (!page) {
      return res.status(404).json({ status: 'error', message: 'Page not found' });
    }

    if (!page.published && !isEditor) {
      return res.status(403).json({ status: 'error', message: 'Page not published' });
    }

    res.status(200).json({ status: 'success', data: page });
  } catch (err) {
    next(err);
  }
});

cmsRouter.post('/cms/pages', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = cmsPageSchema.parse(req.body);
    const slug = parsed.slug || generateSlug(parsed.title);

    // Ensure unique slug
    const existing = await prisma.cmsPage.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ status: 'error', message: `Slug "${slug}" is already taken.` });
    }

    const page = await prisma.cmsPage.create({
      data: {
        ...parsed,
        content: sanitizeContent(parsed.content),
        seoTitle: parsed.seoTitle ? sanitizeContent(parsed.seoTitle) : null,
        seoDescription: parsed.seoDescription ? sanitizeContent(parsed.seoDescription) : null,
        slug,
        publishedAt: parsed.published ? new Date() : null,
      },
    });

    await auditService.log({
      action: 'Page Created',
      tableName: 'CmsPage',
      recordId: String(page.id),
      userId: req.user?.userId,
      newValue: { title: page.title, slug: page.slug, published: page.published },
    });

    emitCmsEvent('page_created', page);
    res.status(201).json({ status: 'success', data: page });
  } catch (err) {
    next(err);
  }
});

cmsRouter.put('/cms/pages/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = cmsPageSchema.parse(req.body);
    const pageId = parseInt(req.params.id, 10);
    const slug = parsed.slug || generateSlug(parsed.title);

    // Check unique slug (excluding self)
    const existing = await prisma.cmsPage.findFirst({
      where: { slug, id: { not: pageId } },
    });
    if (existing) {
      return res.status(400).json({ status: 'error', message: `Slug "${slug}" is already taken by another page.` });
    }

    const page = await prisma.cmsPage.update({
      where: { id: pageId },
      data: {
        ...parsed,
        content: sanitizeContent(parsed.content),
        seoTitle: parsed.seoTitle ? sanitizeContent(parsed.seoTitle) : null,
        seoDescription: parsed.seoDescription ? sanitizeContent(parsed.seoDescription) : null,
        slug,
        publishedAt: parsed.published ? new Date() : null,
      },
    });

    await auditService.log({
      action: parsed.published ? 'Page Published' : 'Page Updated',
      tableName: 'CmsPage',
      recordId: String(page.id),
      userId: req.user?.userId,
      newValue: { title: page.title, slug: page.slug, published: page.published },
    });

    emitCmsEvent('page_updated', page);
    res.status(200).json({ status: 'success', data: page });
  } catch (err) {
    next(err);
  }
});

cmsRouter.delete('/cms/pages/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageId = parseInt(req.params.id, 10);
    const page = await prisma.cmsPage.delete({ where: { id: pageId } });

    await auditService.log({
      action: 'Page Deleted',
      tableName: 'CmsPage',
      recordId: String(page.id),
      userId: req.user?.userId,
      newValue: { title: page.title, slug: page.slug },
    });

    emitCmsEvent('page_deleted', { id: pageId });
    res.status(200).json({ status: 'success', message: 'Page deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// 2. News Article Endpoints
// ---------------------------------------------------------
cmsRouter.get('/news', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isEditor = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    const filters: any = {};
    if (!isEditor) {
      filters.published = true;
    }

    if (req.query.category) {
      filters.category = req.query.category as string;
    }

    if (req.query.featured !== undefined) {
      filters.featured = req.query.featured === 'true';
    }

    if (req.query.q) {
      filters.OR = [
        { title: { contains: req.query.q as string, mode: 'insensitive' } },
        { content: { contains: req.query.q as string, mode: 'insensitive' } },
        { summary: { contains: req.query.q as string, mode: 'insensitive' } },
      ];
    }

    const articles = await prisma.newsArticle.findMany({
      where: filters,
      orderBy: { publishedAt: 'desc' },
    });
    res.status(200).json({ status: 'success', data: articles });
  } catch (err) {
    next(err);
  }
});

cmsRouter.get('/news/:idOrSlug', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;
    const isEditor = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);

    const isNumeric = /^\d+$/.test(idOrSlug);
    const filter: any = isNumeric ? { id: parseInt(idOrSlug, 10) } : { slug: idOrSlug };

    const article = await prisma.newsArticle.findFirst({
      where: filter,
    });

    if (!article) {
      return res.status(404).json({ status: 'error', message: 'Article not found' });
    }

    if (!article.published && !isEditor) {
      return res.status(403).json({ status: 'error', message: 'Article not published' });
    }

    res.status(200).json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});

cmsRouter.post('/news', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = newsArticleSchema.parse(req.body);
    const slug = parsed.slug || generateSlug(parsed.title);

    // Unique slug check
    const existing = await prisma.newsArticle.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ status: 'error', message: `Slug "${slug}" is already taken.` });
    }

    const article = await prisma.newsArticle.create({
      data: {
        ...parsed,
        content: sanitizeContent(parsed.content),
        summary: parsed.summary ? sanitizeContent(parsed.summary) : null,
        slug,
        authorId: req.user?.userId,
        publishedAt: parsed.published ? new Date() : null,
      },
    });

    await auditService.log({
      action: 'News Published',
      tableName: 'NewsArticle',
      recordId: String(article.id),
      userId: req.user?.userId,
      newValue: { title: article.title, slug: article.slug, published: article.published },
    });

    emitCmsEvent('news_created', article);
    res.status(201).json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});

cmsRouter.put('/news/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = newsArticleSchema.parse(req.body);
    const articleId = parseInt(req.params.id, 10);
    const slug = parsed.slug || generateSlug(parsed.title);

    const existing = await prisma.newsArticle.findFirst({
      where: { slug, id: { not: articleId } },
    });
    if (existing) {
      return res.status(400).json({ status: 'error', message: `Slug "${slug}" is already taken by another article.` });
    }

    const article = await prisma.newsArticle.update({
      where: { id: articleId },
      data: {
        ...parsed,
        content: sanitizeContent(parsed.content),
        summary: parsed.summary ? sanitizeContent(parsed.summary) : null,
        slug,
        publishedAt: parsed.published ? new Date() : null,
      },
    });

    await auditService.log({
      action: 'News Updated',
      tableName: 'NewsArticle',
      recordId: String(article.id),
      userId: req.user?.userId,
      newValue: { title: article.title, slug: article.slug, published: article.published },
    });

    emitCmsEvent('news_updated', article);
    res.status(200).json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});

cmsRouter.delete('/news/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const articleId = parseInt(req.params.id, 10);
    const article = await prisma.newsArticle.delete({ where: { id: articleId } });

    await auditService.log({
      action: 'News Deleted',
      tableName: 'NewsArticle',
      recordId: String(article.id),
      userId: req.user?.userId,
      newValue: { title: article.title, slug: article.slug },
    });

    emitCmsEvent('news_deleted', { id: articleId });
    res.status(200).json({ status: 'success', message: 'Article deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// 3. Event Endpoints
// ---------------------------------------------------------
cmsRouter.get('/events', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isEditor = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    const filters: any = {};
    if (!isEditor) {
      filters.published = true;
    }

    if (req.query.q) {
      filters.OR = [
        { title: { contains: req.query.q as string, mode: 'insensitive' } },
        { description: { contains: req.query.q as string, mode: 'insensitive' } },
        { location: { contains: req.query.q as string, mode: 'insensitive' } },
      ];
    }

    const events = await prisma.event.findMany({
      where: filters,
      orderBy: { startDate: 'asc' },
    });
    res.status(200).json({ status: 'success', data: events });
  } catch (err) {
    next(err);
  }
});

cmsRouter.get('/events/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const isEditor = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ status: 'error', message: 'Event not found' });
    }

    if (!event.published && !isEditor) {
      return res.status(403).json({ status: 'error', message: 'Event not published' });
    }

    res.status(200).json({ status: 'success', data: event });
  } catch (err) {
    next(err);
  }
});

cmsRouter.post('/events', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = eventSchema.parse(req.body);

    const event = await prisma.event.create({
      data: {
        ...parsed,
        description: sanitizeContent(parsed.description),
        location: sanitizeContent(parsed.location),
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
      },
    });

    await auditService.log({
      action: 'Event Created',
      tableName: 'Event',
      recordId: String(event.id),
      userId: req.user?.userId,
      newValue: { title: event.title, date: event.startDate },
    });

    emitCmsEvent('event_created', event);
    res.status(201).json({ status: 'success', data: event });
  } catch (err) {
    next(err);
  }
});

cmsRouter.put('/events/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = eventSchema.parse(req.body);
    const eventId = parseInt(req.params.id, 10);

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...parsed,
        description: sanitizeContent(parsed.description),
        location: sanitizeContent(parsed.location),
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
      },
    });

    await auditService.log({
      action: 'Event Updated',
      tableName: 'Event',
      recordId: String(event.id),
      userId: req.user?.userId,
      newValue: { title: event.title, date: event.startDate },
    });

    emitCmsEvent('event_updated', event);
    res.status(200).json({ status: 'success', data: event });
  } catch (err) {
    next(err);
  }
});

cmsRouter.delete('/events/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const event = await prisma.event.delete({ where: { id: eventId } });

    await auditService.log({
      action: 'Event Deleted',
      tableName: 'Event',
      recordId: String(event.id),
      userId: req.user?.userId,
      newValue: { title: event.title },
    });

    emitCmsEvent('event_deleted', { id: eventId });
    res.status(200).json({ status: 'success', message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// 4. Media Library Endpoints
// ---------------------------------------------------------
cmsRouter.get('/media', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folders = await prisma.mediaLibrary.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ status: 'success', data: folders });
  } catch (err) {
    next(err);
  }
});

cmsRouter.post('/media', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = mediaSchema.parse(req.body);

    const media = await prisma.mediaLibrary.create({
      data: {
        ...parsed,
        fileName: sanitizeContent(parsed.fileName),
        folder: sanitizeContent(parsed.folder),
        uploadedBy: `${req.user?.email || 'Admin'}`,
      },
    });

    await auditService.log({
      action: 'Media Uploaded',
      tableName: 'MediaLibrary',
      recordId: String(media.id),
      userId: req.user?.userId,
      newValue: { name: media.fileName, url: media.fileUrl },
    });

    emitCmsEvent('media_uploaded', media);
    res.status(201).json({ status: 'success', data: media });
  } catch (err) {
    next(err);
  }
});

cmsRouter.delete('/media/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), cmsWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mediaId = parseInt(req.params.id, 10);
    const media = await prisma.mediaLibrary.delete({ where: { id: mediaId } });

    await auditService.log({
      action: 'Media Deleted',
      tableName: 'MediaLibrary',
      recordId: String(media.id),
      userId: req.user?.userId,
      newValue: { name: media.fileName },
    });

    emitCmsEvent('media_deleted', { id: mediaId });
    res.status(200).json({ status: 'success', message: 'Media deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// 5. Sitemap and Robots.txt Generative Endpoints
// ---------------------------------------------------------
cmsRouter.get('/cms/sitemap.xml', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = await prisma.cmsPage.findMany({ where: { published: true } });
    const news = await prisma.newsArticle.findMany({ where: { published: true } });
    const events = await prisma.event.findMany({ where: { published: true } });

    const baseUrl = 'https://smart-university.edu';
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static default links
    sitemap += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    sitemap += `  <url>\n    <loc>${baseUrl}/about</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    sitemap += `  <url>\n    <loc>${baseUrl}/admissions</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    sitemap += `  <url>\n    <loc>${baseUrl}/contact</loc>\n    <changefreq>yearly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

    // CMS Pages links
    pages.forEach((page) => {
      sitemap += `  <url>\n    <loc>${baseUrl}/page/${page.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    // News links
    news.forEach((item) => {
      sitemap += `  <url>\n    <loc>${baseUrl}/news/${item.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    // Events links
    events.forEach((evt) => {
      sitemap += `  <url>\n    <loc>${baseUrl}/events/${evt.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    sitemap += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (err) {
    next(err);
  }
});

cmsRouter.get('/cms/robots.txt', (req: Request, res: Response) => {
  const robots = `User-agent: *\nAllow: /\nSitemap: https://smart-university.edu/api/cms/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.status(200).send(robots);
});
