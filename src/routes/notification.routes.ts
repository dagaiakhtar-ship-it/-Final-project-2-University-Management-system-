import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.service';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { notifyNotificationChange } from '../services/socket.service';

export const notificationRouter = Router();

// INPUT VALIDATION SCHEMAS
const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  message: z.string().min(1, 'Message is required').max(4000, 'Message cannot exceed 4000 characters'),
  notificationType: z.string(), // Push, Email, SMS, InApp
  priority: z.string().default('Normal'), // Low, Normal, High, Critical
  scheduledAt: z.string().optional().nullable(),
  status: z.string().default('Draft'), // Draft, Scheduled, Sending, Sent, Failed
});

const templateSchema = z.object({
  templateName: z.string().min(1, 'Template name is required').max(200, 'Template name cannot exceed 200 characters'),
  channel: z.string(), // Push, Email, SMS, InApp
  subject: z.string().optional().nullable().transform(val => val ? val.slice(0, 200) : val),
  body: z.string().min(1, 'Body is required').max(4000, 'Body cannot exceed 4000 characters'),
  variables: z.string().optional().default('[]'),
  active: z.boolean().default(true),
});

const sendNotificationSchema = z.object({
  notificationId: z.number(),
  userIds: z.array(z.number()),
});

const broadcastSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  message: z.string().min(1, 'Message is required').max(4000, 'Message cannot exceed 4000 characters'),
  notificationType: z.string(), // Push, Email, SMS, InApp
  priority: z.string().default('Normal'),
  targetAudience: z.string(), // ALL, ROLE, DEPARTMENT, FACULTY, STUDENT, PARENT, EMPLOYEE
  targetId: z.union([z.string(), z.number()]).optional().nullable(),
});

// SIMULATOR FUNCTION for Background queue processing and retries
function processNotificationQueue(notificationId: number) {
  setTimeout(async () => {
    try {
      console.log(`[Queue] Processing notification ID: ${notificationId}`);
      
      // Update status to Sending
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'Sending' }
      });

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: { recipients: true }
      });

      if (!notification) return;

      notifyNotificationChange('BROADCAST_STARTED', { notificationId, title: notification.title });

      // Process each recipient
      let successCount = 0;
      let failCount = 0;

      for (const rec of notification.recipients) {
        // Randomly simulate a 5% failure rate for SMS/Email to demonstrate retries
        const isSmsOrEmail = ['SMS', 'Email'].includes(notification.notificationType);
        const shouldFail = isSmsOrEmail && Math.random() < 0.08;

        if (shouldFail) {
          await prisma.notificationRecipient.update({
            where: { id: rec.id },
            data: { deliveryStatus: 'Failed' }
          });
          failCount++;
          
          // Audit Log for delivery failure
          await prisma.auditLog.create({
            data: {
              action: 'DELIVERY_FAILURE',
              tableName: 'Notification',
              recordId: `${notificationId}`,
              oldValue: `Delivery failed to user ${rec.userId} via ${notification.notificationType}`,
              userId: notification.senderId || 1,
              ipAddress: '127.0.0.1'
            }
          });

          // Trigger retry in 5 seconds
          triggerDeliveryRetry(rec.id, notification.notificationType, notificationId);
        } else {
          await prisma.notificationRecipient.update({
            where: { id: rec.id },
            data: { deliveryStatus: 'Delivered' }
          });
          successCount++;

          // Live Socket IO update to the specific user
          notifyNotificationChange('NOTIFICATION_RECEIVED', {
            userId: rec.userId,
            id: notificationId,
            title: notification.title,
            message: notification.message,
            notificationType: notification.notificationType,
            priority: notification.priority,
            createdAt: notification.createdAt
          });
        }
      }

      const finalStatus = failCount > 0 ? 'Failed' : 'Sent';
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: finalStatus,
          sentAt: new Date()
        }
      });

      // Audit Log for Broadcast completed
      await prisma.auditLog.create({
        data: {
          action: 'BROADCAST_COMPLETED',
          tableName: 'Notification',
          recordId: `${notificationId}`,
          oldValue: `Broadcast finished. Delivered: ${successCount}, Failed: ${failCount}`,
          userId: notification.senderId || 1,
          ipAddress: '127.0.0.1'
        }
      });

      notifyNotificationChange('BROADCAST_COMPLETED', {
        notificationId,
        title: notification.title,
        status: finalStatus,
        delivered: successCount,
        failed: failCount
      });

    } catch (err) {
      console.error('[Queue Error] Failed to process notification:', err);
    }
  }, 1000);
}

// Simulated retry execution
function triggerDeliveryRetry(recipientId: number, channel: string, notificationId: number) {
  setTimeout(async () => {
    try {
      console.log(`[Queue Retry] Retrying recipient ID: ${recipientId} via ${channel}`);
      
      const recipient = await prisma.notificationRecipient.findUnique({
        where: { id: recipientId },
        include: { notification: true }
      });

      if (!recipient || recipient.deliveryStatus === 'Delivered') return;

      const title = recipient.notification?.title || 'Alert';
      const message = recipient.notification?.message || '';
      const notificationType = recipient.notification?.notificationType || channel;
      const priority = recipient.notification?.priority || 'Normal';
      const createdAt = recipient.notification?.createdAt || new Date();

      // Retry always succeeds in simulator
      await prisma.notificationRecipient.update({
        where: { id: recipientId },
        data: { deliveryStatus: 'Delivered' }
      });

      // Log successful retry
      await prisma.auditLog.create({
        data: {
          action: 'RETRY_EXECUTED',
          tableName: 'Notification',
          recordId: `${notificationId}`,
          oldValue: `Retry successful for user ${recipient.userId} via ${channel}`,
          userId: 1,
          ipAddress: '127.0.0.1'
        }
      });

      // Live Socket update
      notifyNotificationChange('NOTIFICATION_RECEIVED', {
        userId: recipient.userId,
        id: notificationId,
        title,
        message,
        notificationType,
        priority,
        createdAt
      });

      // If all are now delivered, mark notification as fully Sent
      const pendingOrFailed = await prisma.notificationRecipient.count({
        where: {
          notificationId,
          deliveryStatus: { not: 'Delivered' }
        }
      });

      if (pendingOrFailed === 0) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { status: 'Sent' }
        });
        notifyNotificationChange('BROADCAST_COMPLETED', {
          notificationId,
          title,
          status: 'Sent'
        });
      }

    } catch (err) {
      console.error('[Queue Retry Error] Failed during retry execution:', err);
    }
  }, 5000);
}

// 1. GET /api/notifications
notificationRouter.get('/notifications/analytics', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      sentToday,
      totalRecipients,
      deliveredRecipients,
      failedRecipients,
      pendingRecipients,
      activeTemplatesCount,
      notificationsByType,
      recentAuditLogs
    ] = await Promise.all([
      prisma.notification.count({
        where: {
          status: 'Sent',
          sentAt: { gte: startOfToday }
        }
      }),
      prisma.notificationRecipient.count(),
      prisma.notificationRecipient.count({
        where: { deliveryStatus: 'Delivered' }
      }),
      prisma.notificationRecipient.count({
        where: { deliveryStatus: 'Failed' }
      }),
      prisma.notificationRecipient.count({
        where: { deliveryStatus: 'Pending' }
      }),
      prisma.notificationTemplate.count({
        where: { active: true }
      }),
      prisma.notification.groupBy({
        by: ['notificationType', 'status'],
        _count: {
          id: true
        }
      }),
      prisma.auditLog.findMany({
        where: {
          action: {
            in: ['NOTIFICATION_CREATED', 'NOTIFICATION_SENT', 'BROADCAST_STARTED', 'BROADCAST_COMPLETED', 'TEMPLATE_UPDATED', 'DELIVERY_FAILURE', 'RETRY_EXECUTED']
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const successRate = totalRecipients > 0 ? (deliveredRecipients / totalRecipients) * 100 : 100;

    // Compile trend datasets for the charts
    const typeStats = {
      Push: { sent: 0, failed: 0, pending: 0 },
      Email: { sent: 0, failed: 0, pending: 0 },
      SMS: { sent: 0, failed: 0, pending: 0 },
      InApp: { sent: 0, failed: 0, pending: 0 }
    };

    const recTrend = await prisma.notificationRecipient.findMany({
      take: 100,
      orderBy: { id: 'desc' },
      include: { notification: true }
    });

    const dailyTrendMap: Record<string, { date: string, Email: number, SMS: number, Push: number, InApp: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTrendMap[dateStr] = { date: dateStr, Email: 0, SMS: 0, Push: 0, InApp: 0 };
    }

    recTrend.forEach(rec => {
      if (!rec.notification) return;
      const type = rec.notification.notificationType as 'Email' | 'SMS' | 'Push' | 'InApp';
      if (typeStats[type]) {
        if (rec.deliveryStatus === 'Delivered') typeStats[type].sent++;
        else if (rec.deliveryStatus === 'Failed') typeStats[type].failed++;
        else typeStats[type].pending++;
      }

      const dateStr = new Date(rec.notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyTrendMap[dateStr] && dailyTrendMap[dateStr][type] !== undefined) {
        dailyTrendMap[dateStr][type]++;
      }
    });

    res.json({
      summary: {
        sentToday,
        deliverySuccessRate: parseFloat(successRate.toFixed(1)),
        failedNotifications: failedRecipients,
        pendingQueue: pendingRecipients,
        activeTemplates: activeTemplatesCount,
        totalRecipients
      },
      byType: typeStats,
      dailyTrend: Object.values(dailyTrendMap),
      recentAuditLogs
    });
  } catch (err) {
    next(err);
  }
});

// 1. GET /api/notifications
notificationRouter.get('/notifications', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, type, status, limit = '20', page = '1' } = req.query;
    const limitVal = parseInt(limit as string, 10);
    const pageVal = parseInt(page as string, 10);
    const take = isNaN(limitVal) || limitVal <= 0 ? 20 : limitVal;
    const pageNum = isNaN(pageVal) || pageVal <= 0 ? 1 : pageVal;
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.notificationType = type as string;
    }

    if (status) {
      where.status = status as string;
    }

    // Role-based filtering: students and parents can only see their own notifications
    const userRole = req.user?.role;
    if (userRole === 'STUDENT' || userRole === 'PARENT') {
      where.recipients = {
        some: {
          userId: req.user?.userId
        }
      };
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          recipients: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: take });
  } catch (err) {
    next(err);
  }
});

// 2. POST /api/notifications (Create Draft/Scheduled)
notificationRouter.post('/notifications', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = notificationSchema.parse(req.body);
    let scheduledAtDate: Date | null = null;
    if (parsed.scheduledAt) {
      const parsedDate = new Date(parsed.scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduled date format' });
      }
      scheduledAtDate = parsedDate;
    }

    const notification = await prisma.notification.create({
      data: {
        title: parsed.title,
        message: parsed.message,
        notificationType: parsed.notificationType,
        priority: parsed.priority,
        scheduledAt: scheduledAtDate,
        status: parsed.status,
        senderId: req.user?.userId || null,
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'NOTIFICATION_CREATED',
        tableName: 'Notification',
        recordId: `${notification.id}`,
        oldValue: `Created notification: "${notification.title}"`,
        userId: req.user?.userId || 1,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
});

// 3. PUT /api/notifications/:id
notificationRouter.put('/notifications/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    const parsed = notificationSchema.parse(req.body);
    let scheduledAtDate: Date | null = null;
    if (parsed.scheduledAt) {
      const parsedDate = new Date(parsed.scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduled date format' });
      }
      scheduledAtDate = parsedDate;
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        title: parsed.title,
        message: parsed.message,
        notificationType: parsed.notificationType,
        priority: parsed.priority,
        scheduledAt: scheduledAtDate,
        status: parsed.status,
      }
    });

    res.json(notification);
  } catch (err) {
    next(err);
  }
});

// 4. DELETE /api/notifications/:id
notificationRouter.delete('/notifications/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    await prisma.notification.delete({ where: { id } });
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// 5. POST /api/notifications/send (Send to specific users)
notificationRouter.post('/notifications/send', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = sendNotificationSchema.parse(req.body);

    const notification = await prisma.notification.findUnique({
      where: { id: parsed.notificationId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // High-performance batch insert/update recipients
    const recipientData = parsed.userIds.map((userId) => ({
      notificationId: notification.id,
      userId,
      deliveryStatus: 'Pending',
      readStatus: false,
    }));

    await prisma.notificationRecipient.createMany({
      data: recipientData,
      skipDuplicates: true,
    });

    await prisma.notificationRecipient.updateMany({
      where: {
        notificationId: notification.id,
        userId: { in: parsed.userIds },
      },
      data: {
        deliveryStatus: 'Pending',
      },
    });

    // Queue in background
    processNotificationQueue(notification.id);

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'NOTIFICATION_SENT',
        tableName: 'Notification',
        recordId: `${notification.id}`,
        oldValue: `Sent notification ID ${notification.id} to ${parsed.userIds.length} users.`,
        userId: req.user?.userId || 1,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    res.json({ success: true, message: 'Notification queued for sending' });
  } catch (err) {
    next(err);
  }
});

// 6. POST /api/notifications/broadcast (Role, Dept, Faculty broadcast)
notificationRouter.post('/notifications/broadcast', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PLACEMENT_OFFICER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = broadcastSchema.parse(req.body);

    // Role-based checks on broadcast capabilities
    const userRole = req.user?.role;
    // Note: requireRoles already filters basic permissions, here we enforce additional domain rules
    if (userRole === 'TEACHER' && parsed.targetAudience !== 'STUDENT' && parsed.targetAudience !== 'DEPARTMENT') {
      return res.status(403).json({ error: 'Faculty can only broadcast to Students or Departments' });
    }

    // Resolve list of users
    let users: { id: number }[] = [];

    if (parsed.targetAudience === 'ALL') {
      users = await prisma.user.findMany({ select: { id: true } });
    } else if (parsed.targetAudience === 'ROLE' && parsed.targetId) {
      // Find role record first
      const roleName = String(parsed.targetId).toUpperCase();
      const roleRecord = await prisma.role.findFirst({
        where: { name: roleName as any }
      });
      if (roleRecord) {
        users = await prisma.user.findMany({
          where: { roleId: roleRecord.id },
          select: { id: true }
        });
      }
    } else if (parsed.targetAudience === 'STUDENT') {
      const roleRecord = await prisma.role.findFirst({
        where: { name: 'STUDENT' }
      });
      if (roleRecord) {
        users = await prisma.user.findMany({
          where: { roleId: roleRecord.id },
          select: { id: true }
        });
      }
    } else if (parsed.targetAudience === 'PARENT') {
      const roleRecord = await prisma.role.findFirst({
        where: { name: 'PARENT' }
      });
      if (roleRecord) {
        users = await prisma.user.findMany({
          where: { roleId: roleRecord.id },
          select: { id: true }
        });
      }
    } else if (parsed.targetAudience === 'EMPLOYEE') {
      const roleRecords = await prisma.role.findMany({
        where: {
          name: {
            in: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PLACEMENT_OFFICER', 'HOSTEL_WARDEN', 'SECURITY_STAFF', 'LIBRARIAN']
          }
        }
      });
      users = await prisma.user.findMany({
        where: { roleId: { in: roleRecords.map(r => r.id) } },
        select: { id: true }
      });
    } else if (parsed.targetAudience === 'DEPARTMENT' && parsed.targetId) {
      const deptId = typeof parsed.targetId === 'number' ? parsed.targetId : parseInt(parsed.targetId as string, 10);
      if (isNaN(deptId)) {
        return res.status(400).json({ error: 'Invalid department ID specified' });
      }
      // Find students and teachers in this department
      const [deptStudents, deptTeachers] = await Promise.all([
        prisma.student.findMany({
          where: { departmentId: deptId },
          select: { userId: true }
        }),
        prisma.teacher.findMany({
          where: { departmentId: deptId },
          select: { userId: true }
        })
      ]);
      const userIds = [
        ...deptStudents.map(s => s.userId),
        ...deptTeachers.map(t => t.userId)
      ];
      users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true }
      });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'No matching recipients found for target audience' });
    }

    // 1. Create central Notification record
    const notification = await prisma.notification.create({
      data: {
        title: parsed.title,
        message: parsed.message,
        notificationType: parsed.notificationType,
        priority: parsed.priority,
        status: 'Sending',
        senderId: req.user?.userId || null,
      }
    });

    // 2. Create recipient records
    const recipientData = users.map(u => ({
      notificationId: notification.id,
      userId: u.id,
      deliveryStatus: 'Pending',
      readStatus: false,
    }));

    await prisma.notificationRecipient.createMany({
      data: recipientData,
      skipDuplicates: true,
    });

    // 3. Process sending queue in background
    processNotificationQueue(notification.id);

    // 4. Log Audit Event
    await prisma.auditLog.create({
      data: {
        action: 'BROADCAST_STARTED',
        tableName: 'Notification',
        recordId: `${notification.id}`,
        oldValue: `Broadcast to ${parsed.targetAudience} (${users.length} users): "${notification.title}"`,
        userId: req.user?.userId || 1,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    res.status(201).json({
      success: true,
      notificationId: notification.id,
      recipientsCount: users.length,
      message: `Broadcast queued successfully to ${users.length} recipients.`
    });

  } catch (err) {
    next(err);
  }
});

// 7. GET /api/notification-templates
notificationRouter.get('/notification-templates', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { templateName: 'asc' }
    });
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

// 8. POST /api/notification-templates
notificationRouter.post('/notification-templates', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = templateSchema.parse(req.body);

    // Check duplicate templateName
    const existing = await prisma.notificationTemplate.findUnique({
      where: { templateName: parsed.templateName }
    });
    if (existing) {
      return res.status(400).json({ error: 'Notification template name already exists' });
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        templateName: parsed.templateName,
        channel: parsed.channel,
        subject: parsed.subject,
        body: parsed.body,
        variables: parsed.variables,
        active: parsed.active,
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'TEMPLATE_CREATED',
        tableName: 'NotificationTemplate',
        recordId: `${template.id}`,
        oldValue: `Created template: "${template.templateName}"`,
        userId: req.user?.userId || 1,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

// 9. PUT /api/notification-templates/:id
notificationRouter.put('/notification-templates/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    const parsed = templateSchema.parse(req.body);

    // Check duplicate templateName for other templates
    const existing = await prisma.notificationTemplate.findFirst({
      where: {
        templateName: parsed.templateName,
        id: { not: id }
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Notification template name already exists' });
    }

    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        templateName: parsed.templateName,
        channel: parsed.channel,
        subject: parsed.subject,
        body: parsed.body,
        variables: parsed.variables,
        active: parsed.active,
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'TEMPLATE_UPDATED',
        tableName: 'NotificationTemplate',
        recordId: `${template.id}`,
        oldValue: `Updated template: "${template.templateName}"`,
        userId: req.user?.userId || 1,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    res.json(template);
  } catch (err) {
    next(err);
  }
});

// 10. GET /api/notification-history (Track deliveries and reads)
notificationRouter.get('/notification-history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '50', page = '1', status, read } = req.query;
    const limitVal = parseInt(limit as string, 10);
    const pageVal = parseInt(page as string, 10);
    const take = isNaN(limitVal) || limitVal <= 0 ? 50 : limitVal;
    const pageNum = isNaN(pageVal) || pageVal <= 0 ? 1 : pageVal;
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (status) {
      where.deliveryStatus = status as string;
    }
    if (read) {
      where.readStatus = read === 'true';
    }

    // Role check: Students and Parents only see their own history
    const userRole = req.user?.role;
    if (userRole === 'STUDENT' || userRole === 'PARENT') {
      where.userId = req.user?.userId;
    }

    const [items, total] = await Promise.all([
      prisma.notificationRecipient.findMany({
        where,
        take,
        skip,
        orderBy: { id: 'desc' },
        include: {
          notification: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      }),
      prisma.notificationRecipient.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: take });
  } catch (err) {
    next(err);
  }
});

// 11. PUT /api/notifications/recipients/:id/read (Track read action)
notificationRouter.put('/notifications/recipients/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);

    const recipient = await prisma.notificationRecipient.findUnique({
      where: { id }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient record not found' });
    }

    // Ensure users can only mark their own notifications as read (unless admin)
    if (recipient.userId !== req.user?.userId && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to mark this notification as read' });
    }

    const updated = await prisma.notificationRecipient.update({
      where: { id },
      data: {
        readStatus: true,
        readAt: new Date()
      },
      include: {
        notification: true
      }
    });

    notifyNotificationChange('READ_STATUS_UPDATED', {
      recipientId: id,
      userId: recipient.userId,
      readStatus: true,
      readAt: updated.readAt
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});
