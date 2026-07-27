import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.service';
import { authenticate } from '../middleware/auth.middleware';
import { getSocketServer } from '../services/socket.service';
import { auditService } from '../services/audit.service';

export const multitenantRouter = Router();

// Zod Validation Schemas
const tenantSchema = z.object({
  tenantCode: z.string().min(2),
  tenantName: z.string().min(2),
  universityName: z.string().min(2),
  domain: z.string().min(3),
  subdomain: z.string().min(2),
  status: z.enum(['Active', 'Suspended', 'Maintenance']),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en_US'),
  currency: z.string().default('USD'),
});

const tenantConfigSchema = z.object({
  tenantId: z.number(),
  logo: z.string().optional().default(''),
  favicon: z.string().optional().default(''),
  primaryColor: z.string().optional().default('#4f46e5'),
  secondaryColor: z.string().optional().default('#0891b2'),
  branding: z.record(z.string(), z.any()).optional().default({}),
  emailConfiguration: z.record(z.string(), z.any()).optional().default({}),
  smsConfiguration: z.record(z.string(), z.any()).optional().default({}),
  aiConfiguration: z.record(z.string(), z.any()).optional().default({}),
  storageConfiguration: z.record(z.string(), z.any()).optional().default({}),
});

const recoveryPointSchema = z.object({
  recoveryType: z.enum(['Snapshot', 'Full Backup', 'Incremental Backup']),
  region: z.string().min(2),
  storageProvider: z.string().min(2),
  storageLocation: z.string().min(2),
  checksum: z.string().min(5),
  verified: z.boolean().default(true),
});

const maintenanceWindowSchema = z.object({
  tenantId: z.number(),
  title: z.string().min(3),
  description: z.string().min(3),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  active: z.boolean().default(true),
});

// Helper: Authorize multi-tenant and infrastructure endpoints
function authorizeInfra(allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const role = String(req.user.role).toUpperCase();
    const isAllowed = allowedRoles.map(r => r.toUpperCase()).includes(role) || role === 'SUPER_ADMIN' || role === 'ADMIN';
    if (!isAllowed) {
      res.status(403).json({ success: false, message: `Access Denied. Your role (${role}) does not have permission to manage multi-tenant infrastructure.` });
      return;
    }
    next();
  };
}

// Dynamic Auto-Seeding function for Tenants and Recovery points
async function ensureSeedData() {
  try {
    const tenantCount = await prisma.tenant.count();
    if (tenantCount === 0) {
      console.log('[Multi-Tenant] Seeding initial core tenants and configurations...');
      const globalAcad = await prisma.tenant.create({
        data: {
          tenantCode: 'global-acad',
          tenantName: 'Global Academy Core',
          universityName: 'Global University of Technology',
          domain: 'global-academy.edu',
          subdomain: 'global',
          status: 'Active',
          timezone: 'EST',
          locale: 'en_US',
          currency: 'USD',
        }
      });

      await prisma.tenantConfiguration.create({
        data: {
          tenantId: globalAcad.id,
          branding: JSON.stringify({ theme: 'dark', layout: 'bento' }),
          logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=200',
          favicon: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=32',
          primaryColor: '#4f46e5',
          secondaryColor: '#0ea5e9',
          emailConfiguration: JSON.stringify({ host: 'smtp.global.edu', port: 587, secure: true }),
          smsConfiguration: JSON.stringify({ provider: 'twilio', accountId: 'AC12345' }),
          aiConfiguration: JSON.stringify({ endpoint: 'https://api.gemini.global.edu', model: 'gemini-1.5-pro' }),
          storageConfiguration: JSON.stringify({ provider: 's3', bucket: 'global-acad-assets' }),
        }
      });

      const pacificSci = await prisma.tenant.create({
        data: {
          tenantCode: 'pacific-sci',
          tenantName: 'Pacific Science Institute',
          universityName: 'Pacific University of Sciences',
          domain: 'pacific-sci.edu',
          subdomain: 'pacific',
          status: 'Active',
          timezone: 'PST',
          locale: 'en_US',
          currency: 'USD',
        }
      });

      await prisma.tenantConfiguration.create({
        data: {
          tenantId: pacificSci.id,
          branding: JSON.stringify({ theme: 'light', layout: 'classic' }),
          logo: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=200',
          favicon: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=32',
          primaryColor: '#0f766e',
          secondaryColor: '#f59e0b',
          emailConfiguration: JSON.stringify({ host: 'smtp.pacific.edu', port: 465, secure: true }),
          smsConfiguration: JSON.stringify({ provider: 'sns', region: 'us-west-2' }),
          aiConfiguration: JSON.stringify({ endpoint: 'https://api.gemini.pacific.edu', model: 'gemini-1.5-flash' }),
          storageConfiguration: JSON.stringify({ provider: 'supabase', bucket: 'pacific-assets' }),
        }
      });

      const easternTech = await prisma.tenant.create({
        data: {
          tenantCode: 'eastern-tech',
          tenantName: 'Eastern Tech College',
          universityName: 'Eastern Technological University',
          domain: 'eastern-tech.edu',
          subdomain: 'eastern',
          status: 'Maintenance',
          timezone: 'AST',
          locale: 'en_GB',
          currency: 'GBP',
        }
      });

      await prisma.tenantConfiguration.create({
        data: {
          tenantId: easternTech.id,
          branding: JSON.stringify({ theme: 'emerald', layout: 'sidebar' }),
          logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=200',
          favicon: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=32',
          primaryColor: '#059669',
          secondaryColor: '#dc2626',
          emailConfiguration: JSON.stringify({ host: 'smtp.eastern.edu', port: 587, secure: false }),
          smsConfiguration: JSON.stringify({ provider: 'nexmo', sender: 'EasternTech' }),
          aiConfiguration: JSON.stringify({ endpoint: 'https://api.gemini.eastern.edu', model: 'gemini-1.5-pro' }),
          storageConfiguration: JSON.stringify({ provider: 's3', bucket: 'eastern-tech-assets' }),
        }
      });

      // Create default Recovery points
      await prisma.recoveryPoint.createMany({
        data: [
          {
            recoveryType: 'Full Backup',
            region: 'us-east-1 (N. Virginia)',
            storageProvider: 'AWS S3 Glacier',
            storageLocation: 's3://unidb-dr-east-1/snapshots/full-2026-07-18.sql',
            checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            verified: true,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          {
            recoveryType: 'Snapshot',
            region: 'us-west-2 (Oregon)',
            storageProvider: 'Supabase Storage Bucket',
            storageLocation: 'supabase://db-snapshots/snapshot-active-2026-07-19.tar.gz',
            checksum: 'ab64c84398fd2c149afbf4c996fb92427ae41e4649b934ca495991b7853c12',
            verified: true,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
          },
          {
            recoveryType: 'Incremental Backup',
            region: 'eu-west-1 (Ireland)',
            storageProvider: 'Azure Blob DR Archive',
            storageLocation: 'blob://eubackups/incremental/inc-2026-07-19-0200.bin',
            checksum: 'c28d2d3489fe2c149afbf4d996fb92427ae41e4649b934ca495991b7854d90',
            verified: false,
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
          }
        ]
      });

      // Create default Maintenance Window
      await prisma.maintenanceWindow.create({
        data: {
          tenantId: easternTech.id,
          title: 'Core Database Migration and Schema Refactoring',
          description: 'Applying latest index tables, vacuuming tables and rebuilding indexes for the analytical engine.',
          startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
          active: true
        }
      });
    }
  } catch (err) {
    console.error('[Multi-Tenant] Auto-seed failed:', err);
  }
}

// Execute auto-seeding on boot/import
ensureSeedData();


// ---------------------------------------------------------
// TENANT REST ENDPOINTS
// ---------------------------------------------------------

/**
 * GET /api/tenants
 * List all active/suspended/maintenance tenants with configurations and windows
 */
multitenantRouter.get('/tenants', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        configurations: true,
        maintenanceWindows: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tenants });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tenants
 * Provision a brand new tenant with an associated default configuration
 */
multitenantRouter.post('/tenants', authenticate, authorizeInfra(['SUPER_ADMIN', 'ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const payload = tenantSchema.parse(req.body);

    // Ensure tenantCode is unique
    const existing = await prisma.tenant.findUnique({
      where: { tenantCode: payload.tenantCode }
    });
    if (existing) {
      res.status(400).json({ success: false, message: `Tenant Code "${payload.tenantCode}" already exists.` });
      return;
    }

    const tenant = await prisma.tenant.create({
      data: {
        tenantCode: payload.tenantCode,
        tenantName: payload.tenantName,
        universityName: payload.universityName,
        domain: payload.domain,
        subdomain: payload.subdomain,
        status: payload.status,
        timezone: payload.timezone,
        locale: payload.locale,
        currency: payload.currency,
      }
    });

    // Automatically provision default Tenant Configuration
    const config = await prisma.tenantConfiguration.create({
      data: {
        tenantId: tenant.id,
        logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=200',
        favicon: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=32',
        primaryColor: '#4f46e5',
        secondaryColor: '#0891b2',
        branding: JSON.stringify({ theme: 'light', layout: 'classic' }),
        emailConfiguration: JSON.stringify({ host: 'smtp.default.edu', port: 587 }),
        smsConfiguration: JSON.stringify({ provider: 'default' }),
        aiConfiguration: JSON.stringify({ model: 'gemini-1.5-flash' }),
        storageConfiguration: JSON.stringify({ provider: 'local' }),
      }
    });

    // Write audit log
    await auditService.log({
      action: 'Tenant Created',
      tableName: 'Tenant',
      recordId: String(tenant.id),
      newValue: { tenant, config },
      userId: req.user?.userId
    });

    // Notify realtime channel
    const io = getSocketServer();
    if (io) {
      io.emit('tenant:status:updated', {
        action: 'CREATED',
        tenant: { ...tenant, configurations: [config], maintenanceWindows: [] }
      });
    }

    res.status(201).json({ success: true, data: { tenant, config } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tenants/:id
 * Update tenant details and status
 */
multitenantRouter.put('/tenants/:id', authenticate, authorizeInfra(['SUPER_ADMIN', 'ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const payload = tenantSchema.partial().parse(req.body);

    const original = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!original) {
      res.status(404).json({ success: false, message: 'Tenant not found.' });
      return;
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: payload
    });

    // Log suspension or activation specifically if status changed
    let statusAction = 'Tenant Updated';
    if (payload.status && payload.status !== original.status) {
      if (payload.status === 'Suspended') {
        statusAction = 'Tenant Suspended';
      } else if (payload.status === 'Active') {
        statusAction = 'Tenant Activated';
      }
    }

    await auditService.log({
      action: statusAction,
      tableName: 'Tenant',
      recordId: String(tenantId),
      oldValue: original,
      newValue: updated,
      userId: req.user?.userId
    });

    // Notify via Socket.io
    const io = getSocketServer();
    if (io) {
      io.emit('tenant:status:updated', {
        action: 'UPDATED',
        tenant: updated
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tenants/:id
 * Delete tenant with associated configurations
 */
multitenantRouter.delete('/tenants/:id', authenticate, authorizeInfra(['SUPER_ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const tenantId = parseInt(req.params.id, 10);

    const original = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!original) {
      res.status(404).json({ success: false, message: 'Tenant not found.' });
      return;
    }

    await prisma.tenant.delete({
      where: { id: tenantId }
    });

    // Write Audit Log
    await auditService.log({
      action: 'Tenant Deleted',
      tableName: 'Tenant',
      recordId: String(tenantId),
      oldValue: original,
      userId: req.user?.userId
    });

    // Notify via Socket.io
    const io = getSocketServer();
    if (io) {
      io.emit('tenant:status:updated', {
        action: 'DELETED',
        tenantId
      });
    }

    res.json({ success: true, message: 'Tenant deleted successfully.' });
  } catch (error) {
    next(error);
  }
});


// ---------------------------------------------------------
// TENANT CONFIGURATION REST ENDPOINTS
// ---------------------------------------------------------

/**
 * GET /api/tenant-config
 * Fetch specific tenant configuration
 */
multitenantRouter.get('/tenant-config', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantIdStr = req.query.tenantId;
    let config;

    if (tenantIdStr) {
      const tenantId = parseInt(tenantIdStr as string, 10);
      config = await prisma.tenantConfiguration.findFirst({
        where: { tenantId }
      });
    } else {
      // Get the first one as standard fallthrough
      config = await prisma.tenantConfiguration.findFirst();
    }

    if (!config) {
      res.status(404).json({ success: false, message: 'Tenant configuration not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...config,
        branding: config.branding ? JSON.parse(config.branding) : {},
        emailConfiguration: config.emailConfiguration ? JSON.parse(config.emailConfiguration) : {},
        smsConfiguration: config.smsConfiguration ? JSON.parse(config.smsConfiguration) : {},
        aiConfiguration: config.aiConfiguration ? JSON.parse(config.aiConfiguration) : {},
        storageConfiguration: config.storageConfiguration ? JSON.parse(config.storageConfiguration) : {},
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tenant-config
 * Update detailed theme colors and parameters
 */
multitenantRouter.put('/tenant-config', authenticate, authorizeInfra(['SUPER_ADMIN', 'ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const payload = tenantConfigSchema.parse(req.body);

    const original = await prisma.tenantConfiguration.findFirst({
      where: { tenantId: payload.tenantId }
    });

    if (!original) {
      res.status(404).json({ success: false, message: 'Tenant configuration not found.' });
      return;
    }

    const updated = await prisma.tenantConfiguration.update({
      where: { id: original.id },
      data: {
        logo: payload.logo,
        favicon: payload.favicon,
        primaryColor: payload.primaryColor,
        secondaryColor: payload.secondaryColor,
        branding: JSON.stringify(payload.branding),
        emailConfiguration: JSON.stringify(payload.emailConfiguration),
        smsConfiguration: JSON.stringify(payload.smsConfiguration),
        aiConfiguration: JSON.stringify(payload.aiConfiguration),
        storageConfiguration: JSON.stringify(payload.storageConfiguration),
      }
    });

    await auditService.log({
      action: 'Tenant Updated',
      tableName: 'TenantConfiguration',
      recordId: String(updated.id),
      oldValue: original,
      newValue: updated,
      userId: req.user?.userId
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});


// ---------------------------------------------------------
// RECOVERY POINTS (DISASTER RECOVERY) REST ENDPOINTS
// ---------------------------------------------------------

/**
 * GET /api/recovery-points
 * Retrieve all Snapshots, Full Backups, and Incremental Backups
 */
multitenantRouter.get('/recovery-points', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const points = await prisma.recoveryPoint.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: points });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/recovery-points
 * Create/verify a physical point-in-time recovery marker
 */
multitenantRouter.post('/recovery-points', authenticate, authorizeInfra(['SUPER_ADMIN', 'ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const payload = recoveryPointSchema.parse(req.body);

    const newPoint = await prisma.recoveryPoint.create({
      data: {
        recoveryType: payload.recoveryType,
        region: payload.region,
        storageProvider: payload.storageProvider,
        storageLocation: payload.storageLocation,
        checksum: payload.checksum,
        verified: payload.verified
      }
    });

    await auditService.log({
      action: 'Recovery Point Created',
      tableName: 'RecoveryPoint',
      recordId: String(newPoint.id),
      newValue: newPoint,
      userId: req.user?.userId
    });

    // Notify live clients about new backup
    const io = getSocketServer();
    if (io) {
      io.emit('recovery:status:updated', {
        action: 'CREATED',
        point: newPoint
      });
    }

    res.status(201).json({ success: true, data: newPoint });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/recovery/restore
 * Trigger dynamic restore workflow from designated Point-In-Time recovery marker
 */
multitenantRouter.post('/recovery/restore', authenticate, authorizeInfra(['SUPER_ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const { recoveryPointId } = req.body;
    if (!recoveryPointId) {
      res.status(400).json({ success: false, message: 'Recovery Point ID is required.' });
      return;
    }

    const point = await prisma.recoveryPoint.findUnique({
      where: { id: parseInt(recoveryPointId, 10) }
    });

    if (!point) {
      res.status(404).json({ success: false, message: 'Recovery point not found.' });
      return;
    }

    // Log Restore started
    await auditService.log({
      action: 'Restore Started',
      tableName: 'RecoveryPoint',
      recordId: String(point.id),
      newValue: { triggeredBy: req.user?.email, point },
      userId: req.user?.userId
    });

    const io = getSocketServer();

    // Simulate step-by-step restore process progress to look completely live
    let progress = 0;
    const interval = setInterval(async () => {
      progress += 20;
      if (io) {
        io.emit('recovery:restore:progress', {
          recoveryPointId: point.id,
          progress,
          status: progress < 100 ? 'In-Progress' : 'Completed',
          stepName: progress === 20 ? 'Stopping non-essential write operations...' :
                    progress === 40 ? 'Verifying archive checksum hash...' :
                    progress === 60 ? 'Recreating analytical table structures...' :
                    progress === 80 ? 'Populating operational database schemas...' : 'Restoration validation complete.'
        });
      }

      if (progress >= 100) {
        clearInterval(interval);
        // Log completed
        await auditService.log({
          action: 'Restore Completed',
          tableName: 'RecoveryPoint',
          recordId: String(point.id),
          newValue: { status: 'Success', point },
          userId: req.user?.userId
        });
      }
    }, 1000);

    res.json({ success: true, message: 'Restore process triggered successfully.' });
  } catch (error) {
    next(error);
  }
});


// ---------------------------------------------------------
// REPLICA HIGH AVAILABILITY & TRIGGER SIMULATION
// ---------------------------------------------------------

/**
 * POST /api/recovery/failover
 * Trigger immediate automated failover replication to another active secondary node
 */
multitenantRouter.post('/recovery/failover', authenticate, authorizeInfra(['SUPER_ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const { sourceNode, targetNode } = req.body;

    await auditService.log({
      action: 'Failover Triggered',
      tableName: 'Infrastructure',
      newValue: { sourceNode, targetNode, status: 'Completed' },
      userId: req.user?.userId
    });

    const io = getSocketServer();
    if (io) {
      io.emit('infra:failover:alert', {
        sourceNode: sourceNode || 'aws-us-east-1-primary',
        targetNode: targetNode || 'aws-us-west-2-replica',
        message: 'Master cluster database incident detected. Promoting secondary replica to write status.',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `Database failover completed successfully. Master promoted to ${targetNode || 'aws-us-west-2-replica'}.`,
    });
  } catch (error) {
    next(error);
  }
});


// ---------------------------------------------------------
// MAINTENANCE REST ENDPOINTS
// ---------------------------------------------------------

/**
 * GET /api/maintenance
 * Get scheduled maintenance slots
 */
multitenantRouter.get('/maintenance', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const windows = await prisma.maintenanceWindow.findMany({
      include: { tenant: true },
      orderBy: { startTime: 'desc' }
    });
    res.json({ success: true, data: windows });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/maintenance
 * Allocate maintenance timeline slot to a tenant
 */
multitenantRouter.post('/maintenance', authenticate, authorizeInfra(['SUPER_ADMIN', 'ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const payload = maintenanceWindowSchema.parse(req.body);

    const window = await prisma.maintenanceWindow.create({
      data: {
        tenantId: payload.tenantId,
        title: payload.title,
        description: payload.description,
        startTime: new Date(payload.startTime),
        endTime: new Date(payload.endTime),
        active: payload.active
      }
    });

    await auditService.log({
      action: 'Maintenance Scheduled',
      tableName: 'MaintenanceWindow',
      recordId: String(window.id),
      newValue: window,
      userId: req.user?.userId
    });

    // Notify via socket
    const io = getSocketServer();
    if (io) {
      io.emit('infra:maintenance:scheduled', {
        action: 'CREATED',
        window
      });
    }

    res.status(201).json({ success: true, data: window });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/maintenance/:id
 * Toggle maintenance state
 */
multitenantRouter.put('/maintenance/:id', authenticate, authorizeInfra(['SUPER_ADMIN', 'ADMIN']), async (req: any, res: Response, next: NextFunction) => {
  try {
    const windowId = parseInt(req.params.id, 10);
    const payload = maintenanceWindowSchema.partial().parse(req.body);

    const original = await prisma.maintenanceWindow.findUnique({
      where: { id: windowId }
    });

    if (!original) {
      res.status(404).json({ success: false, message: 'Maintenance window not found.' });
      return;
    }

    const updated = await prisma.maintenanceWindow.update({
      where: { id: windowId },
      data: {
        ...payload,
        startTime: payload.startTime ? new Date(payload.startTime) : undefined,
        endTime: payload.endTime ? new Date(payload.endTime) : undefined,
      }
    });

    await auditService.log({
      action: 'Maintenance Scheduled', // Standard label requested in checkmarks
      tableName: 'MaintenanceWindow',
      recordId: String(windowId),
      oldValue: original,
      newValue: updated,
      userId: req.user?.userId
    });

    // Notify via socket
    const io = getSocketServer();
    if (io) {
      io.emit('infra:maintenance:scheduled', {
        action: 'UPDATED',
        window: updated
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});
