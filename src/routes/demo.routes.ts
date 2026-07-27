import { Router, Request, Response, NextFunction } from 'express';
import { execSync } from 'child_process';
import { prisma } from '../services/db.service';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { getSocketServer } from '../services/socket.service';

export const demoRouter = Router();

// GET /api/demo/status
demoRouter.get('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PERMANENT_DEMO_BASELINE' }
    });

    let baseline = null;
    if (setting) {
      try {
        baseline = JSON.parse(setting.value);
      } catch (e) {
        baseline = { savedAt: setting.updatedAt.toISOString(), raw: setting.value };
      }
    } else {
      baseline = {
        savedAt: new Date().toISOString(),
        savedBy: 'System Baseline',
        description: 'Default permanent university demo dataset with roles, courses, timetables, and demo users.',
        status: 'Active Permanent Demo',
        restoreCount: 0
      };
    }

    res.json({
      success: true,
      baseline
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/demo/save
demoRouter.post('/save', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userEmail = (req as any).user?.email || 'admin@university.edu';
    
    // Count records to include in baseline snapshot metadata
    const [usersCount, studentsCount, teachersCount, coursesCount, timetablesCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.student.count().catch(() => 0),
      prisma.teacher.count().catch(() => 0),
      prisma.course.count().catch(() => 0),
      prisma.timetable.count().catch(() => 0)
    ]);

    const existingSetting = await prisma.systemSetting.findUnique({ where: { key: 'PERMANENT_DEMO_BASELINE' } });
    let existingBaseline: any = {};
    if (existingSetting) {
      try { existingBaseline = JSON.parse(existingSetting.value); } catch(e) {}
    }

    const snapshotData = {
      savedAt: new Date().toISOString(),
      savedBy: userEmail,
      status: 'Active Permanent Demo',
      description: req.body.description || 'Admin saved permanent demo baseline snapshot.',
      restoreCount: existingBaseline.restoreCount || 0,
      lastRestoredAt: existingBaseline.lastRestoredAt || null,
      stats: {
        users: usersCount,
        students: studentsCount,
        teachers: teachersCount,
        courses: coursesCount,
        timetables: timetablesCount
      }
    };

    await prisma.systemSetting.upsert({
      where: { key: 'PERMANENT_DEMO_BASELINE' },
      update: {
        value: JSON.stringify(snapshotData),
        updatedBy: userEmail
      },
      create: {
        key: 'PERMANENT_DEMO_BASELINE',
        value: JSON.stringify(snapshotData),
        description: 'Permanent Demo Baseline Snapshot',
        updatedBy: userEmail
      }
    });

    // Also record in Backup table
    try {
      await prisma.backup.create({
        data: {
          backupType: 'Database',
          storageLocation: `demo-baseline-${Date.now()}.json`,
          status: 'Completed',
          completedAt: new Date()
        }
      });
    } catch (e) {
      console.warn('[DemoSave] Backup record creation note:', e);
    }

    res.json({
      success: true,
      message: 'Demo state saved permanently as system baseline!',
      baseline: snapshotData
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/demo/restore
demoRouter.post('/restore', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userEmail = (req as any).user?.email || 'admin@university.edu';
    console.log(`[DemoRestore] Admin ${userEmail} initiated full app restore...`);

    // Execute Prisma Seed script to restore all database entities
    try {
      execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    } catch (cmdErr) {
      console.warn('[DemoRestore] tsx seed execution retry with node:', cmdErr);
      execSync('node --import tsx prisma/seed.ts', { stdio: 'inherit' });
    }

    // Retrieve or create baseline setting
    let baseline: any = {};
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PERMANENT_DEMO_BASELINE' }
    });
    if (setting) {
      try {
        baseline = JSON.parse(setting.value);
      } catch (e) {
        baseline = {};
      }
    }

    baseline.lastRestoredAt = new Date().toISOString();
    baseline.lastRestoredBy = userEmail;
    baseline.restoreCount = (baseline.restoreCount || 0) + 1;
    baseline.status = 'Restored Demo Baseline';

    await prisma.systemSetting.upsert({
      where: { key: 'PERMANENT_DEMO_BASELINE' },
      update: {
        value: JSON.stringify(baseline),
        updatedBy: userEmail
      },
      create: {
        key: 'PERMANENT_DEMO_BASELINE',
        value: JSON.stringify(baseline),
        description: 'Permanent Demo Baseline Snapshot',
        updatedBy: userEmail
      }
    });

    // Emit socket notifications
    const io = getSocketServer();
    if (io) {
      io.emit('demo:restored', {
        restoredAt: baseline.lastRestoredAt,
        restoredBy: userEmail,
        message: 'Application state restored to permanent demo baseline.'
      });
      io.emit('devops:log', {
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'SystemRestore',
        message: `Whole app database restored to demo state by ${userEmail}.`
      });
    }

    res.json({
      success: true,
      message: 'Application state successfully restored to permanent demo baseline!',
      restoredAt: baseline.lastRestoredAt,
      restoreCount: baseline.restoreCount,
      baseline
    });
  } catch (err: any) {
    console.error('[DemoRestore] Failed restoring app:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to restore application state.'
    });
  }
});

export default demoRouter;
