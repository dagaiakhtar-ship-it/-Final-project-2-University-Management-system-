import { prisma } from './db.service';
import { GoogleGenAI } from '@google/genai';
import { notifyWorkflowChange } from './socket.service';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export class SearchService {
  /**
   * Re-indexes every module inside the Smart University database
   * into a unified SearchIndex model.
   */
  public static async reindexAll(userId?: number): Promise<{ success: boolean; totalIndexed: number; log: string[] }> {
    const logs: string[] = [];
    let count = 0;

    const log = (msg: string) => {
      console.log(`[SearchIndexer] ${msg}`);
      logs.push(msg);
    };

    try {
      log('Starting universal search re-indexing...');
      
      // Delete existing search indexes
      await prisma.searchIndex.deleteMany({});
      log('Cleared existing search index table.');

      // 1. Index Students
      try {
        const students = await prisma.student.findMany();
        const records = students.map((s) => ({
          module: 'Academic',
          entityType: 'Student',
          entityId: String(s.id),
          title: `${s.fullName || ''} (Student)`,
          content: `Roll Number: ${s.rollNumber || ''} Email: ${s.email || ''} Phone: ${s.mobileNumber || ''} Status: ${s.status || ''} Department ID: ${s.departmentId || ''}`,
          metadata: JSON.stringify({ rollNumber: s.rollNumber, email: s.email, status: s.status, departmentId: s.departmentId }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Students.`);
        }
      } catch (err: any) {
        log(`Failed to index Students: ${err.message}`);
      }

      // 2. Index Faculty (Teachers)
      try {
        const teachers = await prisma.teacher.findMany({ include: { user: true } });
        const records = teachers.map((t) => ({
          module: 'HR',
          entityType: 'Teacher',
          entityId: String(t.id),
          title: `${t.user.firstName || ''} ${t.user.lastName || ''} (Faculty)`,
          content: `Designation: ${t.designation || ''} Email: ${t.user.email || ''} Phone: ${t.officePhone || ''} Department ID: ${t.departmentId || ''} Specialization: ${t.specialization || ''}`,
          metadata: JSON.stringify({ designation: t.designation, email: t.user.email, departmentId: t.departmentId }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Teachers.`);
        }
      } catch (err: any) {
        log(`Failed to index Teachers: ${err.message}`);
      }

      // 3. Index Departments
      try {
        const departments = await prisma.department.findMany();
        const records = departments.map((d) => ({
          module: 'Academic',
          entityType: 'Department',
          entityId: String(d.id),
          title: `${d.name} (Department)`,
          content: `Code: ${d.code} Description: ${d.description || ''}`,
          metadata: JSON.stringify({ code: d.code }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Departments.`);
        }
      } catch (err: any) {
        log(`Failed to index Departments: ${err.message}`);
      }

      // 4. Index Courses
      try {
        const courses = await prisma.course.findMany();
        const records = courses.map((c) => ({
          module: 'Academic',
          entityType: 'Course',
          entityId: String(c.id),
          title: `${c.name} (Course: ${c.code})`,
          content: `Code: ${c.code} Description: ${c.description || ''} Credits: ${c.credits || ''}`,
          metadata: JSON.stringify({ code: c.code, credits: c.credits }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Courses.`);
        }
      } catch (err: any) {
        log(`Failed to index Courses: ${err.message}`);
      }

      // 5. Index AttendanceRecords
      try {
        const attendance = await prisma.attendanceRecord.findMany({ take: 200 }); // limit to prevent blowup
        const records = attendance.map((a) => ({
          module: 'Academic',
          entityType: 'AttendanceRecord',
          entityId: String(a.id),
          title: `Attendance #${a.id} (Student ID: ${a.studentId})`,
          content: `Status: ${a.attendanceStatus} Student ID: ${a.studentId} Session ID: ${a.attendanceSessionId} Remarks: ${a.remarks || ''}`,
          metadata: JSON.stringify({ status: a.attendanceStatus, studentId: a.studentId }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Attendance Records.`);
        }
      } catch (err: any) {
        log(`Failed to index Attendance Records: ${err.message}`);
      }

      // 6. Index Results
      try {
        const results = await prisma.result.findMany({ take: 200 });
        const records = results.map((r) => ({
          module: 'Academic',
          entityType: 'Result',
          entityId: String(r.id),
          title: `Exam Result (Student ID: ${r.studentId})`,
          content: `Grade: ${r.grade} Marks: ${r.totalObtainedMarks} GP: ${r.gradePoint} Student ID: ${r.studentId} Course Offering ID: ${r.courseOfferingId}`,
          metadata: JSON.stringify({ grade: r.grade, marks: r.totalObtainedMarks, studentId: r.studentId }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Results.`);
        }
      } catch (err: any) {
        log(`Failed to index Results: ${err.message}`);
      }

      // 7. Index Invoices (Finance)
      try {
        const invoices = await prisma.studentInvoice.findMany();
        const records = invoices.map((i) => ({
          module: 'Finance',
          entityType: 'StudentInvoice',
          entityId: String(i.id),
          title: `Student Invoice #${i.invoiceNumber || i.id}`,
          content: `Invoice ID: ${i.id} Amount: ${i.totalAmount} Paid: ${i.paidAmount} Status: ${i.invoiceStatus} Student ID: ${i.studentId}`,
          metadata: JSON.stringify({ amount: i.totalAmount, status: i.invoiceStatus, studentId: i.studentId }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Student Invoices.`);
        }
      } catch (err: any) {
        log(`Failed to index Invoices: ${err.message}`);
      }

      // 8. Index Purchase Orders (Procurement)
      try {
        const pos = await prisma.purchaseOrder.findMany();
        const records = pos.map((p) => ({
          module: 'Procurement',
          entityType: 'PurchaseOrder',
          entityId: String(p.id),
          title: `Purchase Order ${p.poNumber || p.id}`,
          content: `PO Number: ${p.poNumber} Total Amount: ${p.grandTotal} Status: ${p.status} Vendor ID: ${p.vendorId || ''}`,
          metadata: JSON.stringify({ totalAmount: p.grandTotal, status: p.status, vendorId: p.vendorId }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Purchase Orders.`);
        }
      } catch (err: any) {
        log(`Failed to index Purchase Orders: ${err.message}`);
      }

      // 9. Index Inventory Items
      try {
        const inventory = await prisma.inventoryItem.findMany();
        const records = inventory.map((i) => ({
          module: 'Inventory',
          entityType: 'InventoryItem',
          entityId: String(i.id),
          title: `Inventory Item: ${i.itemName}`,
          content: `Code: ${i.itemCode || ''} Category: ${i.category || ''} Description: ${i.description || ''} Stock: ${i.availableStock}`,
          metadata: JSON.stringify({ sku: i.itemCode, category: i.category, quantity: i.availableStock }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Inventory Items.`);
        }
      } catch (err: any) {
        log(`Failed to index Inventory Items: ${err.message}`);
      }

      // 10. Index Assets
      try {
        const assets = await prisma.asset.findMany();
        const records = assets.map((a) => ({
          module: 'Assets',
          entityType: 'Asset',
          entityId: String(a.id),
          title: `Asset: ${a.assetName}`,
          content: `Code: ${a.assetCode || ''} Category: ${a.category || ''} Location: ${a.location || ''} Status: ${a.status || ''}`,
          metadata: JSON.stringify({ assetCode: a.assetCode, category: a.category, status: a.status }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Assets.`);
        }
      } catch (err: any) {
        log(`Failed to index Assets: ${err.message}`);
      }

      // 11. Index Library Books
      try {
        const books = await prisma.book.findMany();
        const records = books.map((b) => ({
          module: 'Library',
          entityType: 'Book',
          entityId: String(b.id),
          title: `Library Book: ${b.title}`,
          content: `ISBN: ${b.isbn || ''} Shelf Location: ${b.shelfLocation || ''} Description: ${b.description || ''}`,
          metadata: JSON.stringify({ isbn: b.isbn }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Books.`);
        }
      } catch (err: any) {
        log(`Failed to index Library Books: ${err.message}`);
      }

      // 12. Index Research Projects
      try {
        const research = await prisma.researchProject.findMany();
        const records = research.map((r) => ({
          module: 'Research',
          entityType: 'ResearchProject',
          entityId: String(r.id),
          title: `Research Project: ${r.title}`,
          content: `Area: ${r.researchArea || ''} Budget: ${r.totalBudget || ''} Status: ${r.status || ''} Abstract: ${r.abstract || ''}`,
          metadata: JSON.stringify({ status: r.status }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Research Projects.`);
        }
      } catch (err: any) {
        log(`Failed to index Research Projects: ${err.message}`);
      }

      // 13. Index Knowledge Documents
      try {
        const documents = await prisma.knowledgeDocument.findMany();
        const records = documents.map((d) => ({
          module: 'AI',
          entityType: 'KnowledgeDocument',
          entityId: String(d.id),
          title: `AI Knowledge: ${d.title}`,
          content: `Category: ${d.category || ''} Source: ${d.source || ''} Content: ${d.content || ''}`,
          metadata: JSON.stringify({ type: d.category }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Knowledge Documents.`);
        }
      } catch (err: any) {
        log(`Failed to index Knowledge Documents: ${err.message}`);
      }

      // 14. Index Workflows
      try {
        const workflows = await prisma.workflow.findMany();
        const records = workflows.map((w) => ({
          module: 'Workflow',
          entityType: 'Workflow',
          entityId: String(w.id),
          title: `Workflow: ${w.workflowName}`,
          content: `Code: ${w.workflowCode} Module: ${w.module} Description: ${w.description || ''}`,
          metadata: JSON.stringify({ workflowCode: w.workflowCode, module: w.module }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Workflows.`);
        }
      } catch (err: any) {
        log(`Failed to index Workflows: ${err.message}`);
      }

      // 15. Index Notifications
      try {
        const notifications = await prisma.notification.findMany({ take: 100 });
        const records = notifications.map((n) => ({
          module: 'Notifications',
          entityType: 'Notification',
          entityId: String(n.id),
          title: `Notification: ${n.title}`,
          content: `Body: ${n.message} Type: ${n.notificationType}`,
          metadata: JSON.stringify({ type: n.notificationType }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} Notifications.`);
        }
      } catch (err: any) {
        log(`Failed to index Notifications: ${err.message}`);
      }

      // 16. Index CMS Pages
      try {
        const pages = await prisma.cmsPage.findMany();
        const records = pages.map((p) => ({
          module: 'CMS',
          entityType: 'CmsPage',
          entityId: String(p.id),
          title: `CMS Page: ${p.title}`,
          content: `Slug: ${p.slug} Content: ${p.content || ''}`,
          metadata: JSON.stringify({ slug: p.slug }),
        }));
        if (records.length > 0) {
          await prisma.searchIndex.createMany({ data: records });
          count += records.length;
          log(`Indexed ${records.length} CMS Pages.`);
        }
      } catch (err: any) {
        log(`Failed to index CMS Pages: ${err.message}`);
      }

      log(`Indexing complete! Total records added: ${count}`);

      // Track reindex event in Audit log if prisma supports it or write console
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'REINDEX_COMPLETED',
          tableName: 'SearchIndex',
          newValue: `Re-indexed all platform content into unified search store. Indexed ${count} records.`,
          ipAddress: '127.0.0.1'
        }
      }).catch(() => {});

      return { success: true, totalIndexed: count, log: logs };
    } catch (e: any) {
      log(`Severe Indexing failure: ${e.message}`);
      return { success: false, totalIndexed: count, log: logs };
    }
  }

  /**
   * Universal Search execution engine with hybrid FTS & AI summaries.
   */
  public static async executeSearch(params: {
    query: string;
    userId: number;
    module?: string;
    entityType?: string;
    searchType?: 'text' | 'semantic' | 'hybrid';
    filters?: string; // JSON filters
  }) {
    const startTime = Date.now();
    const { query, userId, module, entityType, searchType = 'text', filters } = params;

    // Log query in search history
    await prisma.searchHistory.create({
      data: {
        userId,
        query,
        module,
        searchType
      }
    }).catch(() => {});

    // Parse filters
    let filterObj: any = {};
    if (filters) {
      try {
        filterObj = JSON.parse(filters);
      } catch (err) {}
    }

    // Prepare search index filters
    const searchConditions: any = {};
    if (module) {
      searchConditions.module = module;
    }
    if (entityType) {
      searchConditions.entityType = entityType;
    }

    // Build query conditions
    const orConditions: any[] = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } }
    ];

    // If query has spacing, also tokenize words for better fuzzy search (Hybrid behavior)
    const tokens = query.split(/\s+/).filter(t => t.length > 2);
    if (tokens.length > 1) {
      tokens.forEach(t => {
        orConditions.push({ title: { contains: t, mode: 'insensitive' } });
        orConditions.push({ content: { contains: t, mode: 'insensitive' } });
      });
    }

    searchConditions.OR = orConditions;

    // Query SearchIndex
    let matchedRecords = await prisma.searchIndex.findMany({
      where: searchConditions,
      take: 50,
    });

    // Score and rank results
    const scored = matchedRecords.map(rec => {
      let score = 0;
      const q = query.toLowerCase();
      const title = rec.title.toLowerCase();
      const content = rec.content.toLowerCase();

      // Title exact match
      if (title.includes(q)) score += 50;
      // Content exact match
      if (content.includes(q)) score += 20;

      // Word token boost
      tokens.forEach(t => {
        const tok = t.toLowerCase();
        if (title.includes(tok)) score += 10;
        if (content.includes(tok)) score += 4;
      });

      // Module specific score boost
      if (module && rec.module.toLowerCase() === module.toLowerCase()) {
        score += 15;
      }

      return {
        ...rec,
        score
      };
    });

    // Sort by relevance score desc
    const rankedResults = scored.sort((a, b) => b.score - a.score);

    // AI Synthesis: generate natural language summary context-aware responses!
    let aiSummary = '';
    let citations: string[] = [];

    if ((searchType === 'semantic' || searchType === 'hybrid') && process.env.GEMINI_API_KEY && query.trim().length > 3) {
      try {
        // Collect top 5 context records to feed into RAG prompt
        const ragContext = rankedResults.slice(0, 5).map((r, i) => 
          `[Source ${i+1}] Title: ${r.title}, Module: ${r.module}, Details: ${r.content}`
        ).join('\n');

        const systemPrompt = `You are an AI-powered Enterprise Search Synthesizer for Smart University ERP. 
Based ONLY on the provided sources, synthesize a brief, accurate paragraph answering the search query: "${query}".
Use references/citations like [Source 1], [Source 2] to cite matching entities.
If no sources are relevant or provided, say "No relevant campus records were found to summarize."`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: systemPrompt + '\n\n' + 'Sources:\n' + ragContext,
        });

        if (response.text) {
          aiSummary = response.text;
          citations = rankedResults.slice(0, 5).map(r => `${r.title} (${r.module})`);
        }
      } catch (err: any) {
        console.error('[Gemini AI Search Error]:', err);
        aiSummary = `Failed to generate AI summary: ${err.message || String(err)}`;
      }
    }

    const executionTime = Date.now() - startTime;

    // Save analytics record asynchronously
    await prisma.searchAnalytics.create({
      data: {
        query,
        resultCount: rankedResults.length,
        executionTime,
        userId
      }
    }).catch(() => {});

    return {
      query,
      searchType,
      results: rankedResults,
      aiSummary,
      citations,
      executionTime,
      totalCount: rankedResults.length
    };
  }
}
