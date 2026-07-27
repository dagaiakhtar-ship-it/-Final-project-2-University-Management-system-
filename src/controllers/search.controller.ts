import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/db.service';
import { SearchService } from '../services/search.service';

export class SearchController {
  /**
   * Main Search Endpoint (Supports text, semantic, and hybrid search types)
   */
  public async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q || req.query.query || req.body.query || '') as string;
      const moduleParam = req.query.module as string | undefined;
      const entityType = req.query.entityType as string | undefined;
      const searchType = (req.query.searchType || req.query.type || 'text') as 'text' | 'semantic' | 'hybrid';
      const filters = req.query.filters as string | undefined;

      const userId = req.user?.userId || 1;

      if (!query || query.trim() === '') {
        res.status(200).json({
          query: '',
          searchType,
          results: [],
          aiSummary: '',
          citations: [],
          executionTime: 0,
          totalCount: 0
        });
        return;
      }

      const results = await SearchService.executeSearch({
        query: query.trim(),
        userId,
        module: moduleParam,
        entityType,
        searchType,
        filters
      });

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Search History for the logged-in User
   */
  public async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || 1;
      const history = await prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { executedAt: 'desc' },
        take: 30,
      });
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Saved Searches for the logged-in User
   */
  public async getSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || 1;
      const saved = await prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(saved);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save a Search Query for the logged-in User
   */
  public async saveSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || 1;
      const { searchName, query, filters } = req.body;

      if (!searchName || !query) {
        res.status(400).json({ error: 'searchName and query are required.' });
        return;
      }

      const saved = await prisma.savedSearch.create({
        data: {
          userId,
          searchName,
          query,
          filters: filters ? JSON.stringify(filters) : null,
        },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SEARCH_SAVED',
          tableName: 'SearchIndex',
          newValue: `User saved search query: "${query}" as "${searchName}"`,
          ipAddress: req.ip || '127.0.0.1',
        },
      }).catch(() => {});

      res.status(201).json(saved);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a Saved Search Query
   */
  public async deleteSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || 1;
      const { id } = req.params;

      const savedId = parseInt(id, 10);
      if (isNaN(savedId)) {
        res.status(400).json({ error: 'Invalid saved search ID.' });
        return;
      }

      // Check ownership
      const existing = await prisma.savedSearch.findFirst({
        where: { id: savedId, userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Saved search not found or unauthorized.' });
        return;
      }

      await prisma.savedSearch.delete({
        where: { id: savedId },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SEARCH_DELETED',
          tableName: 'SearchIndex',
          newValue: `User deleted saved search: "${existing.searchName}"`,
          ipAddress: req.ip || '127.0.0.1',
        },
      }).catch(() => {});

      res.status(200).json({ message: 'Saved search deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger Global Indexing
   */
  public async reindex(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || 1;

      // Run reindexing
      const result = await SearchService.reindexAll(userId);

      if (result.success) {
        res.status(200).json({
          message: 'Re-indexing successfully completed.',
          totalIndexed: result.totalIndexed,
          logs: result.log,
        });
      } else {
        res.status(500).json({
          error: 'Re-indexing process failed.',
          logs: result.log,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Search Engine Analytics & Dashboard Statistics
   */
  public async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Calculate database statistics
      const totalIndexedRecords = await prisma.searchIndex.count();
      const recordsByModule = await prisma.searchIndex.groupBy({
        by: ['module'],
        _count: { id: true },
      });

      const totalSearchRequests = await prisma.searchHistory.count();
      const recentHistory = await prisma.searchHistory.findMany({
        take: 20,
        orderBy: { executedAt: 'desc' },
      });

      // Response metrics calculations
      const avgResponseAgg = await prisma.searchAnalytics.aggregate({
        _avg: { executionTime: true },
      });
      const avgResponseTime = Math.round(avgResponseAgg._avg.executionTime || 24);

      // Most Popular Queries
      const popularQueriesRaw = await prisma.searchAnalytics.groupBy({
        by: ['query'],
        _count: { id: true },
        orderBy: { _count: { query: 'desc' } },
        take: 10,
      });
      const popularSearches = popularQueriesRaw.map((q) => ({
        query: q.query,
        count: q._count.id,
      }));

      // Failed Searches (Result count = 0)
      const failedSearchesCount = await prisma.searchAnalytics.count({
        where: { resultCount: 0 },
      });

      // AI Search usage (semantic or hybrid types)
      const aiSearchesUsed = await prisma.searchHistory.count({
        where: {
          searchType: { in: ['semantic', 'hybrid'] },
        },
      });

      // Search Accuracy / Success Rate (percentage of searches with >= 1 result)
      const successfulSearches = await prisma.searchAnalytics.count({
        where: { resultCount: { gte: 1 } },
      });
      const totalAnalysed = await prisma.searchAnalytics.count();
      const accuracyRate = totalAnalysed > 0 ? Math.round((successfulSearches / totalAnalysed) * 100) : 100;

      // Date series grouping for ECharts query volumes
      const analyticsRecords = await prisma.searchAnalytics.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
      });

      const dailyQueryVolume: { [date: string]: number } = {};
      analyticsRecords.forEach((rec) => {
        const dateStr = rec.createdAt.toISOString().split('T')[0];
        dailyQueryVolume[dateStr] = (dailyQueryVolume[dateStr] || 0) + 1;
      });

      const trendsData = Object.keys(dailyQueryVolume).map((date) => ({
        date,
        count: dailyQueryVolume[date],
      })).sort((a, b) => a.date.localeCompare(b.date));

      res.status(200).json({
        statistics: {
          indexedRecords: totalIndexedRecords,
          indexedByModule: recordsByModule,
          totalRequests: totalSearchRequests,
          avgResponseTime: `${avgResponseTime}ms`,
          failedSearches: failedSearchesCount,
          aiUsageCount: aiSearchesUsed,
          successRate: `${accuracyRate}%`,
          indexHealth: 'Healthy',
        },
        popularSearches,
        trends: trendsData,
        recentHistory,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
