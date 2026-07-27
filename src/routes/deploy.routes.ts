/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/db.service';
import { authenticate } from '../middleware/auth.middleware';
import { getSocketServer } from '../services/socket.service';
import { appLogs } from './devops.routes';

export const deployRouter = Router();

// GET /api/deploy/status
deployRouter.get('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deployments = await prisma.deployment.findMany({
      orderBy: { deployedAt: 'desc' },
      take: 10
    });
    const current = deployments.find(d => d.environment === 'Production') || deployments[0] || null;
    res.json({
      success: true,
      current,
      all: deployments
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/deploy/start
deployRouter.post('/start', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { version, environment = 'Production' } = req.body;
    if (!version) {
      return res.status(400).json({ success: false, message: 'Version tag is required' });
    }

    const userEmail = (req as any).user?.email || 'sysadmin@university.edu';
    
    // Simulate deployment entry
    const deployment = await prisma.deployment.create({
      data: {
        version,
        environment,
        deployedBy: userEmail,
        status: 'Running'
      }
    });

    const io = getSocketServer();
    if (io) {
      io.emit('devops:deployment', deployment);
    }

    // After 3 seconds, mark as running/completed
    setTimeout(async () => {
      try {
        await prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: 'Running' }
        });
        const updated = await prisma.deployment.findUnique({ where: { id: deployment.id } });
        if (io && updated) {
          io.emit('devops:deployment', updated);
          io.emit('devops:log', {
            timestamp: new Date().toISOString(),
            level: 'info',
            source: 'DeployEngine',
            message: `Deployment ${version} to ${environment} succeeded.`
          });
        }
      } catch (e) {
        console.error('Simulation update failed', e);
      }
    }, 3000);

    res.json({
      success: true,
      message: 'Deployment triggered successfully.',
      deployment
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/deploy/rollback
deployRouter.post('/rollback', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetDeploymentId } = req.body;
    let target;
    if (targetDeploymentId) {
      target = await prisma.deployment.findUnique({
        where: { id: Number(targetDeploymentId) }
      });
    } else {
      // Rollback to previous successful deployment
      const running = await prisma.deployment.findMany({
        where: { environment: 'Production', status: 'Running' },
        orderBy: { deployedAt: 'desc' },
        take: 2
      });
      target = running[1];
    }

    if (!target) {
      return res.status(404).json({ success: false, message: 'No target deployment found for rollback.' });
    }

    const userEmail = (req as any).user?.email || 'sysadmin@university.edu';
    const rollback = await prisma.deployment.create({
      data: {
        version: `${target.version}-rollback`,
        environment: target.environment,
        deployedBy: userEmail,
        status: 'Running'
      }
    });

    const io = getSocketServer();
    if (io) {
      io.emit('devops:deployment', rollback);
      io.emit('devops:log', {
        timestamp: new Date().toISOString(),
        level: 'warn',
        source: 'DeployEngine',
        message: `Rollback triggered to ${target.version}.`
      });
    }

    setTimeout(async () => {
      try {
        await prisma.deployment.update({
          where: { id: rollback.id },
          data: { status: 'Running' }
        });
        const updated = await prisma.deployment.findUnique({ where: { id: rollback.id } });
        if (io && updated) {
          io.emit('devops:deployment', updated);
        }
      } catch (e) {
        console.error('Simulation rollback update failed', e);
      }
    }, 3000);

    res.json({
      success: true,
      message: `Rollback to ${target.version} initiated successfully.`,
      deployment: rollback
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/deploy/logs
deployRouter.get('/logs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      logs: appLogs
    });
  } catch (err) {
    next(err);
  }
});
