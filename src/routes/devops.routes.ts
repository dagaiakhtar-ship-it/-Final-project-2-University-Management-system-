import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.service';
import { authenticate } from '../middleware/auth.middleware';
import { getSocketServer } from '../services/socket.service';
import { auditService } from '../services/audit.service';

export const devopsRouter = Router();

// Custom RBAC for DevOps roles supporting SUPER_ADMIN, ADMIN, plus custom strings
function requireDevopsRoles(roles: string[]) {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const userRole = req.user.role as string;
    const isAllowed = roles.includes(userRole) || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'INTEGRATION_ADMIN';
    if (!isAllowed) {
      res.status(403).json({ success: false, message: `Access denied. Required roles: ${roles.join(', ')}` });
      return;
    }
    next();
  };
}

// Encryption helper (Base64 + Rot13 obfuscation as a secure-ready placeholder)
function encryptValue(val: string): string {
  const b64 = Buffer.from(val).toString('base64');
  return b64.replace(/[a-zA-Z]/g, (c: string) => {
    const code = c.charCodeAt(0);
    const start = code <= 90 ? 65 : 97;
    return String.fromCharCode(((code - start + 13) % 26) + start);
  });
}

// In-Memory application logs store for real-time visualization
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

export const appLogs: LogEntry[] = [
  { timestamp: new Date(Date.now() - 50000).toISOString(), level: 'info', source: 'AuthService', message: 'JWT validation key refreshed.' },
  { timestamp: new Date(Date.now() - 45000).toISOString(), level: 'info', source: 'Database', message: 'Prisma Client initialized with connection pool.' },
  { timestamp: new Date(Date.now() - 40000).toISOString(), level: 'info', source: 'QueueService', message: 'BullMQ queue "mail-dispatch" connected.' },
  { timestamp: new Date(Date.now() - 35000).toISOString(), level: 'info', source: 'AIService', message: 'Gemini model "gemini-2.5-flash" loaded and ready.' },
  { timestamp: new Date(Date.now() - 30000).toISOString(), level: 'warn', source: 'RateLimiter', message: 'IP 192.168.1.100 is approaching rate limit.' },
  { timestamp: new Date(Date.now() - 25000).toISOString(), level: 'info', source: 'Gateway', message: 'Route /api-gateway proxying request to /api/students.' },
  { timestamp: new Date(Date.now() - 20000).toISOString(), level: 'info', source: 'BackupService', message: 'Scheduled daily database backup check: OK.' }
];

// Seed DevOps tables if empty
async function seedDevopsData() {
  try {
    const depCount = await prisma.deployment.count();
    if (depCount === 0) {
      await prisma.deployment.createMany({
        data: [
          { version: 'v1.12.0', environment: 'Production', deployedBy: 'sysadmin@university.edu', status: 'Running', deployedAt: new Date(Date.now() - 3600000 * 24 * 3) },
          { version: 'v1.11.4', environment: 'Production', deployedBy: 'devops@university.edu', status: 'RolledBack', deployedAt: new Date(Date.now() - 3600000 * 24 * 7) },
          { version: 'v1.11.3', environment: 'Production', deployedBy: 'devops@university.edu', status: 'Failed', deployedAt: new Date(Date.now() - 3600000 * 24 * 7 - 600000) },
          { version: 'v1.12.1-rc1', environment: 'Staging', deployedBy: 'qa-lead@university.edu', status: 'Running', deployedAt: new Date(Date.now() - 3600000 * 12) },
          { version: 'v1.13.0-alpha', environment: 'Development', deployedBy: 'dev@university.edu', status: 'Running', deployedAt: new Date(Date.now() - 3600000 * 2) }
        ]
      });
    }

    const envCount = await prisma.environmentVariable.count();
    if (envCount === 0) {
      await prisma.environmentVariable.createMany({
        data: [
          { key: 'DATABASE_URL', valueEncrypted: encryptValue('postgresql://postgres:secret@db.supabase.co:5432/postgres'), environment: 'Production', active: true },
          { key: 'GEMINI_API_KEY', valueEncrypted: encryptValue('AIzaSyD-mock-gemini-key-12345'), environment: 'Production', active: true },
          { key: 'JWT_SECRET', valueEncrypted: encryptValue('super-secret-jwt-key-for-jwt-signing'), environment: 'Production', active: true },
          { key: 'REDIS_URL', valueEncrypted: encryptValue('redis://default:redispass@redis.supabase.co:6379'), environment: 'Production', active: true },
          { key: 'SUPABASE_STORAGE_BUCKET', valueEncrypted: encryptValue('smart-campus-assets'), environment: 'Production', active: true }
        ]
      });
    }

    const backupCount = await prisma.backup.count();
    if (backupCount === 0) {
      await prisma.backup.createMany({
        data: [
          { backupType: 'Database', storageLocation: 'supabase-storage/backups/db_20260718_040000.sql.gz', createdAt: new Date(Date.now() - 3600000 * 24), completedAt: new Date(Date.now() - 3600000 * 24 + 45000), status: 'Completed' },
          { backupType: 'Media', storageLocation: 'supabase-storage/backups/media_20260718_040500.tar.gz', createdAt: new Date(Date.now() - 3600000 * 24), completedAt: new Date(Date.now() - 3600000 * 24 + 120000), status: 'Completed' },
          { backupType: 'Configuration', storageLocation: 'supabase-storage/backups/config_20260718_041000.json.gz', createdAt: new Date(Date.now() - 3600000 * 24), completedAt: new Date(Date.now() - 3600000 * 24 + 12000), status: 'Completed' },
          { backupType: 'Database', storageLocation: 'supabase-storage/backups/db_20260717_040000.sql.gz', createdAt: new Date(Date.now() - 3600000 * 48), completedAt: new Date(Date.now() - 3600000 * 48 + 43000), status: 'Completed' }
        ]
      });
    }

    const alertCount = await prisma.infrastructureAlert.count();
    if (alertCount === 0) {
      await prisma.infrastructureAlert.createMany({
        data: [
          { severity: 'Medium', source: 'Queue', message: 'BullMQ active worker count is below target threshold', resolved: false, createdAt: new Date(Date.now() - 1800000) },
          { severity: 'Critical', source: 'Database', message: 'Database query pool utilization exceeds 90%', resolved: false, createdAt: new Date(Date.now() - 600000) },
          { severity: 'Low', source: 'Server', message: 'Vite server connection pool holding 15 transient connections', resolved: true, createdAt: new Date(Date.now() - 7200000) }
        ]
      });
    }
  } catch (err) {
    console.error('[DevOps Seed] Failed to preseed:', err);
  }
}

seedDevopsData();

// GET /api/devops/dashboard
devopsRouter.get(
  '/dashboard',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'DEVOPS_ENGINEER', 'SYSTEM_ADMINISTRATOR', 'SECURITY_ADMINISTRATOR', 'AUDITOR']),
  async (req: any, res: Response) => {
    try {
      const activeAlerts = await prisma.infrastructureAlert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' }
      });

      const currentDeployment = await prisma.deployment.findFirst({
        where: { environment: 'Production' },
        orderBy: { deployedAt: 'desc' }
      });

      const buildCount = await prisma.deployment.count();

      const stats = {
        cpuUsage: Math.floor(Math.random() * 25) + 15,
        memoryUsage: Math.floor(Math.random() * 20) + 45,
        storageUsage: 62,
        activeAlertsCount: activeAlerts.length,
        queueStatus: 'Healthy',
        apiHealth: '100% Operational',
        databaseHealth: 'Connected (0ms Latency)',
        aiServiceHealth: 'Gemini-2.5-Flash Online',
        websocketConnections: getSocketServer()?.engine.clientsCount || 0
      };

      res.status(200).json({
        success: true,
        currentDeployment,
        buildCount,
        stats,
        activeAlerts,
        logs: appLogs.slice(-15)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/devops/deployments
devopsRouter.get(
  '/deployments',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'DEVOPS_ENGINEER', 'SYSTEM_ADMINISTRATOR', 'AUDITOR']),
  async (req: any, res: Response) => {
    try {
      const deployments = await prisma.deployment.findMany({
        orderBy: { deployedAt: 'desc' }
      });
      res.status(200).json(deployments);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/devops/deployments
const deploymentSchema = z.object({
  version: z.string().min(1),
  environment: z.enum(['Development', 'Staging', 'Production'])
});

devopsRouter.post(
  '/deployments',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'DEVOPS_ENGINEER']),
  async (req: any, res: Response) => {
    try {
      const { version, environment } = deploymentSchema.parse(req.body);
      const userEmail = req.user?.email || 'sysadmin@university.edu';

      // 1. Version Format Check (standard SemVer regex)
      const versionRegex = /^v?\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
      if (!versionRegex.test(version)) {
        res.status(400).json({ success: false, message: 'Invalid version format. Must match standard SemVer tag (e.g., v1.12.0 or v1.13.0-alpha.1).' });
        return;
      }

      // 2. Duplicate Check: Block if a deployment with the exact same version is already running in the target cluster
      const duplicate = await prisma.deployment.findFirst({
        where: {
          version,
          environment,
          status: 'Running'
        }
      });
      if (duplicate) {
        res.status(400).json({ success: false, message: `Duplicate deployment error: Version ${version} is already running in the ${environment} environment.` });
        return;
      }

      // 3. Simultaneous Deployment Prevention (cooldown check)
      const simultaneous = await prisma.deployment.findFirst({
        where: {
          environment,
          deployedAt: {
            gte: new Date(Date.now() - 15000) // 15 seconds limit
          }
        }
      });
      if (simultaneous) {
        res.status(429).json({ success: false, message: 'Simultaneous deployment blocked. A build is already in progress for this cluster. Please wait 15 seconds.' });
        return;
      }

      const deployment = await prisma.deployment.create({
        data: {
          version,
          environment,
          deployedBy: userEmail,
          status: 'Running'
        }
      });

      await auditService.log({
        action: 'Deployment Started',
        tableName: 'Deployment',
        recordId: deployment.id.toString(),
        newValue: { version, environment, deployedBy: userEmail },
        userId: req.user?.userId
      });

      setTimeout(async () => {
        try {
          const success = Math.random() > 0.05; // 95% success rate
          const finalStatus = success ? 'Running' : 'Failed';
          
          await prisma.deployment.update({
            where: { id: deployment.id },
            data: { status: finalStatus }
          });

          appLogs.push({
            timestamp: new Date().toISOString(),
            level: success ? 'info' : 'error',
            source: 'DeployEngine',
            message: `Deployment ${version} to ${environment} completed with status: ${finalStatus}.`
          });

          const io = getSocketServer();
          if (io) {
            io.emit('devops:deployment', {
              id: deployment.id,
              version,
              environment,
              status: finalStatus,
              deployedBy: userEmail
            });
            io.emit('devops:log', appLogs[appLogs.length - 1]);
          }

          await auditService.log({
            action: 'Deployment Completed',
            tableName: 'Deployment',
            recordId: deployment.id.toString(),
            newValue: { id: deployment.id, version, status: finalStatus },
            userId: req.user?.userId
          });
        } catch (innerErr) {
          console.error('[Deployment Finish Simulation Failed]:', innerErr);
        }
      }, 3000);

      res.status(201).json({
        success: true,
        message: 'Deployment triggered successfully.',
        deployment
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// POST /api/devops/rollback
const rollbackSchema = z.object({
  targetDeploymentId: z.number()
});

devopsRouter.post(
  '/rollback',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'DEVOPS_ENGINEER']),
  async (req: any, res: Response) => {
    try {
      const { targetDeploymentId } = rollbackSchema.parse(req.body);
      const target = await prisma.deployment.findUnique({
        where: { id: targetDeploymentId }
      });

      if (!target) {
        res.status(404).json({ success: false, message: 'Target deployment not found.' });
        return;
      }

      const userEmail = req.user?.email || 'sysadmin@university.edu';

      const rollbackRecord = await prisma.deployment.create({
        data: {
          version: `${target.version}-rollback`,
          environment: target.environment,
          deployedBy: userEmail,
          status: 'Running'
        }
      });

      await prisma.deployment.update({
        where: { id: target.id },
        data: { status: 'RolledBack' }
      });

      await auditService.log({
        action: 'Rollback',
        tableName: 'Deployment',
        recordId: rollbackRecord.id.toString(),
        oldValue: { id: target.id, version: target.version },
        newValue: { id: rollbackRecord.id, version: rollbackRecord.version, status: 'Running' },
        userId: req.user?.userId
      });

      const io = getSocketServer();
      if (io) {
        io.emit('devops:deployment', rollbackRecord);
        io.emit('devops:log', {
          timestamp: new Date().toISOString(),
          level: 'warn',
          source: 'DeployEngine',
          message: `Emergency rollback to ${target.version} initiated. Deployment set to ${rollbackRecord.version}.`
        });
      }

      res.status(200).json({
        success: true,
        message: `Rollback to deployment ${target.version} initiated successfully.`,
        deployment: rollbackRecord
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// GET /api/devops/backups
devopsRouter.get(
  '/backups',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'SYSTEM_ADMINISTRATOR', 'AUDITOR']),
  async (req: any, res: Response) => {
    try {
      const backups = await prisma.backup.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(backups);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/devops/backups
const backupSchema = z.object({
  backupType: z.enum(['Database', 'Media', 'Configuration'])
});

devopsRouter.post(
  '/backups',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'SYSTEM_ADMINISTRATOR']),
  async (req: any, res: Response) => {
    try {
      const { backupType } = backupSchema.parse(req.body);

      // 1. Simultaneous Backup Cooldown check to prevent DB load spikes
      const concurrentBackup = await prisma.backup.findFirst({
        where: {
          status: 'Pending',
          createdAt: {
            gte: new Date(Date.now() - 30000) // 30s limit
          }
        }
      });
      if (concurrentBackup) {
        res.status(400).json({ success: false, message: 'Simultaneous backup blocked. A backup process is already initialized and pending.' });
        return;
      }

      const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const filename = `backup_${backupType.toLowerCase()}_${ts}.tar.gz`;
      const storageLocation = `supabase-storage/backups/${filename}`;

      const backup = await prisma.backup.create({
        data: {
          backupType,
          storageLocation,
          status: 'Pending'
        }
      });

      await auditService.log({
        action: 'Backup Created',
        tableName: 'Backup',
        recordId: backup.id.toString(),
        newValue: backup,
        userId: req.user?.userId
      });

      setTimeout(async () => {
        try {
          // Simulate failure specifically for "Configuration" backups for disaster recovery simulation
          const simulateSuccess = backupType !== 'Configuration';
          const finalStatus = simulateSuccess ? 'Completed' : 'Failed';

          await prisma.backup.update({
            where: { id: backup.id },
            data: {
              status: finalStatus,
              completedAt: new Date()
            }
          });

          const io = getSocketServer();
          if (io) {
            io.emit('devops:backup', { id: backup.id, status: finalStatus, backupType, storageLocation });
            io.emit('devops:log', {
              timestamp: new Date().toISOString(),
              level: simulateSuccess ? 'info' : 'error',
              source: 'BackupEngine',
              message: simulateSuccess
                ? `Backup "${filename}" completed successfully and uploaded to storage bucket.`
                : `Disaster Recovery Simulation: Backup "${filename}" failed during verification phase.`
            });
          }
        } catch (innerErr) {
          console.error('[Backup Simulation Complete Error]:', innerErr);
        }
      }, 4000);

      res.status(201).json({
        success: true,
        message: 'Backup process initialized.',
        backup
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// GET /api/devops/alerts
devopsRouter.get(
  '/alerts',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'SECURITY_ADMINISTRATOR', 'AUDITOR', 'DEVOPS_ENGINEER', 'SYSTEM_ADMINISTRATOR']),
  async (req: any, res: Response) => {
    try {
      const alerts = await prisma.infrastructureAlert.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(alerts);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/devops/alerts/:id/resolve
devopsRouter.post(
  '/alerts/:id/resolve',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'SECURITY_ADMINISTRATOR', 'DEVOPS_ENGINEER', 'SYSTEM_ADMINISTRATOR']),
  async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const alert = await prisma.infrastructureAlert.findUnique({ where: { id } });

      if (!alert) {
        res.status(404).json({ success: false, message: 'Alert not found.' });
        return;
      }

      const updated = await prisma.infrastructureAlert.update({
        where: { id },
        data: { resolved: true }
      });

      await auditService.log({
        action: 'Alert Resolved',
        tableName: 'InfrastructureAlert',
        recordId: alert.id.toString(),
        oldValue: { resolved: false },
        newValue: { resolved: true },
        userId: req.user?.userId
      });

      const io = getSocketServer();
      if (io) {
        io.emit('devops:alert-resolved', updated);
        io.emit('devops:log', {
          timestamp: new Date().toISOString(),
          level: 'info',
          source: 'AlertManager',
          message: `Infrastructure alert resolved: "${alert.message}"`
        });
      }

      res.status(200).json({ success: true, alert: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// GET /api/devops/environment
devopsRouter.get(
  '/environment',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'SYSTEM_ADMINISTRATOR']),
  async (req: any, res: Response) => {
    try {
      const variables = await prisma.environmentVariable.findMany({
        where: { active: true }
      });
      
      const safeVars = variables.map(v => ({
        id: v.id,
        key: v.key,
        environment: v.environment,
        active: v.active,
        valueObfuscated: '••••••••••••••••••••'
      }));

      res.status(200).json(safeVars);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/devops/environment
const envSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  environment: z.enum(['Development', 'Staging', 'Production'])
});

devopsRouter.post(
  '/environment',
  authenticate,
  requireDevopsRoles(['SUPER_ADMIN', 'ADMIN', 'SYSTEM_ADMINISTRATOR']),
  async (req: any, res: Response) => {
    try {
      const { key, value, environment } = envSchema.parse(req.body);

      // Validate POSIX-compliant key names to avoid syntax errors in container runtimes
      const keyRegex = /^[A-Z_][A-Z0-9_]*$/;
      if (!keyRegex.test(key)) {
        res.status(400).json({
          success: false,
          message: 'Invalid environment variable key name. Must be POSIX-compliant: only uppercase alphanumeric characters and underscores, and cannot start with a digit (e.g., DATABASE_URL).'
        });
        return;
      }

      const encrypted = encryptValue(value);

      const existing = await prisma.environmentVariable.findFirst({
        where: { key, environment }
      });

      let record;
      if (existing) {
        record = await prisma.environmentVariable.update({
          where: { id: existing.id },
          data: { valueEncrypted: encrypted, active: true }
        });
      } else {
        record = await prisma.environmentVariable.create({
          data: { key, valueEncrypted: encrypted, environment, active: true }
        });
      }

      await auditService.log({
        action: 'Environment Updated',
        tableName: 'EnvironmentVariable',
        recordId: record.id.toString(),
        newValue: { key, environment },
        userId: req.user?.userId
      });

      res.status(200).json({
        success: true,
        message: 'Environment variable saved.',
        variable: {
          id: record.id,
          key: record.key,
          environment: record.environment,
          active: record.active
        }
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);
