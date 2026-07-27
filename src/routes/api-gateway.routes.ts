import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.service';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { getSocketServer } from '../services/socket.service';
import { auditService } from '../services/audit.service';
import crypto from 'crypto';

export const apiGatewayRouter = Router();

// Zod Validation Schemas
const clientSchema = z.object({
  clientName: z.string().min(1),
  contactEmail: z.string().email(),
  organization: z.string().min(1),
  status: z.enum(['Active', 'Suspended', 'Revoked']).optional().default('Active')
});

const keySchema = z.object({
  keyName: z.string().min(1),
  clientId: z.number(),
  expiresInDays: z.number().min(1).max(365).optional().default(30)
});

const webhookSchema = z.object({
  name: z.string().min(1),
  callbackUrl: z.string().url(),
  eventType: z.string().min(1),
  active: z.boolean().optional().default(true)
});

const integrationSchema = z.object({
  providerName: z.string().min(1),
  providerType: z.enum(['Payment', 'LMS', 'Government', 'Identity', 'Email', 'SMS', 'AI', 'Storage']),
  configuration: z.string(), // JSON configuration string
  active: z.boolean().optional().default(true)
});

// Seed default integration providers if they don't exist
async function seedDefaultIntegrations() {
  try {
    const count = await prisma.integrationProvider.count();
    if (count === 0) {
      await prisma.integrationProvider.createMany({
        data: [
          {
            providerName: 'Stripe Payment Gateway',
            providerType: 'Payment',
            configuration: JSON.stringify({
              apiUrl: 'https://api.stripe.com/v1',
              currency: 'USD',
              enableWebhooks: true,
              environment: 'sandbox'
            }),
            active: true
          },
          {
            providerName: 'Moodle LMS Connector',
            providerType: 'LMS',
            configuration: JSON.stringify({
              wstoken: 'moodlestatictokentest123456',
              endpoint: 'https://moodle.university.edu/webservice/rest/server.php',
              syncUsers: true
            }),
            active: true
          },
          {
            providerName: 'HEC Pakistan Portal',
            providerType: 'Government',
            configuration: JSON.stringify({
              portalUrl: 'https://hec.gov.pk/api/verify',
              degreeVerification: true
            }),
            active: true
          },
          {
            providerName: 'Google Workspace Cloud Auth',
            providerType: 'Identity',
            configuration: JSON.stringify({
              domain: 'university.edu',
              clientId: 'google-workspace-oauth-client-id'
            }),
            active: true
          }
        ]
      });
      console.log('[API Gateway Seed] Default integrations seeded.');
    }
  } catch (err) {
    console.error('[API Gateway Seed] Failed to seed default integrations:', err);
  }
}

seedDefaultIntegrations();

// Simple in-memory rate-limit counter for simulated proxy requests
const rateLimitCache: Record<string, { count: number; resetTime: number }> = {};
const REQUEST_LIMIT = 60; // 60 requests per minute
const WINDOW_MS = 60000;

// Gateway Traffic Stats Tracker
const gatewayStats = {
  totalRequests: 145020,
  activeClients: 12,
  activeKeys: 28,
  rpm: 45,
  failedRequests: 213,
  rateLimitViolations: 18,
  webhookDeliveries: 984,
  integrationHealth: 'Healthy'
};

// ==========================================
// CENTRAL API GATEWAY PROXY SIMULATOR
// ==========================================
// Simulates routing to and authentication validation of public/partner APIs
apiGatewayRouter.all('/proxy/:version/*', async (req: Request, res: Response, next: NextFunction) => {
  const version = req.params.version;
  const path = req.params[0] || '';
  const io = getSocketServer();
  const startTime = Date.now();

  gatewayStats.totalRequests += 1;

  // 1. Version Validation
  if (version !== 'v1' && version !== 'v2') {
    gatewayStats.failedRequests += 1;
    if (io) {
      io.emit('api-gateway:error', {
        error: 'Invalid API Version requested',
        path: req.originalUrl,
        timestamp: new Date()
      });
    }
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_VERSION',
      message: `API version "${version}" is unsupported. Supported versions are: v1, v2`
    });
  }

  // 2. Auth Header Check (API Key or Bearer Token)
  const apiKeyHeader = req.headers['x-api-key'] || req.query['api_key'];
  const authHeader = req.headers['authorization'];
  let authType = 'None';
  let verifiedClient: any = null;
  let verifiedKey: any = null;

  if (apiKeyHeader) {
    authType = 'API_KEY';
    verifiedKey = await prisma.apiKey.findUnique({
      where: { apiKey: String(apiKeyHeader) }
    });

    if (verifiedKey) {
      if (verifiedKey.status !== 'Active') {
        gatewayStats.failedRequests += 1;
        return res.status(401).json({ error: `API Key is "${verifiedKey.status}"` });
      }
      if (new Date(verifiedKey.expiresAt) < new Date()) {
        await prisma.apiKey.update({
          where: { id: verifiedKey.id },
          data: { status: 'Expired' }
        });
        gatewayStats.failedRequests += 1;
        return res.status(401).json({ error: 'API Key has Expired' });
      }
      verifiedClient = await prisma.apiClient.findUnique({
        where: { id: verifiedKey.clientId }
      });
    } else {
      // Look up our new ApiApplication model
      const appKeyCheck = await prisma.apiApplication.findFirst({
        where: { apiKey: String(apiKeyHeader) }
      });
      if (appKeyCheck) {
        if (appKeyCheck.status !== 'Active') {
          gatewayStats.failedRequests += 1;
          return res.status(401).json({ error: `Application is "${appKeyCheck.status}"` });
        }
        verifiedClient = {
          clientName: appKeyCheck.applicationName,
          organization: 'Campus Developer Portal',
          clientId: `app_${appKeyCheck.id}`
        };
        // Record Usage
        try {
          await prisma.apiUsage.create({
            data: {
              applicationId: appKeyCheck.id,
              endpoint: `/proxy/${version}/${path}`,
              requestCount: 1,
              errorCount: 0,
              averageLatency: 12.5,
              recordedAt: new Date()
            }
          });
        } catch (uErr) {
          console.error('[Proxy Usage log fail]:', uErr);
        }
      }
    }
  } else if (authHeader && authHeader.toString().startsWith('Bearer ')) {
    authType = 'OAUTH_2_0';
    const token = authHeader.toString().substring(7);
    // Simulate finding client matching OAuth Bearer Token
    verifiedClient = await prisma.apiClient.findFirst({
      where: { clientSecret: token } // Simple simulated check using clientSecret
    });
  }

  if (!verifiedClient) {
    gatewayStats.failedRequests += 1;
    if (io) {
      io.emit('api-gateway:error', {
        error: 'Unauthorized request',
        path: req.originalUrl,
        timestamp: new Date()
      });
    }
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Access Denied. Provide a valid X-API-KEY or Bearer Token.'
    });
  }

  // 3. Rate Limit Enforcement
  const rateLimitKey = verifiedClient.clientId;
  const now = Date.now();
  if (!rateLimitCache[rateLimitKey]) {
    rateLimitCache[rateLimitKey] = { count: 1, resetTime: now + WINDOW_MS };
  } else {
    if (now > rateLimitCache[rateLimitKey].resetTime) {
      rateLimitCache[rateLimitKey] = { count: 1, resetTime: now + WINDOW_MS };
    } else {
      rateLimitCache[rateLimitKey].count += 1;
    }
  }

  if (rateLimitCache[rateLimitKey].count > REQUEST_LIMIT) {
    gatewayStats.rateLimitViolations += 1;
    if (io) {
      io.emit('api-gateway:rate-limit-violation', {
        clientId: verifiedClient.clientId,
        clientName: verifiedClient.clientName,
        limit: REQUEST_LIMIT,
        timestamp: new Date()
      });
    }
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit of ${REQUEST_LIMIT} requests per minute exceeded. Try again in ${Math.ceil((rateLimitCache[rateLimitKey].resetTime - now) / 1000)} seconds.`
    });
  }

  // Update last used timestamp of API Key if present
  if (verifiedKey) {
    await prisma.apiKey.update({
      where: { id: verifiedKey.id },
      data: { lastUsedAt: new Date() }
    });
  }

  // 4. Simulate Proxy Route Logic
  const responseTime = Date.now() - startTime;
  const simulatedResponse: Record<string, any> = {
    version,
    gateway: 'Enterprise API Gateway',
    timestamp: new Date(),
    authenticatedAs: {
      clientName: verifiedClient.clientName,
      organization: verifiedClient.organization,
      authType
    },
    route: path,
    payload: {
      message: `Gateway successfully proxied request for path: "${path}"`,
      performance: {
        latencyMs: responseTime,
        status: 200
      }
    }
  };

  // Live real-time streaming notifications of API requests via Socket.io
  if (io) {
    io.emit('api-gateway:request', {
      clientName: verifiedClient.clientName,
      method: req.method,
      path: req.originalUrl,
      version,
      authType,
      responseTime,
      status: 200,
      timestamp: new Date()
    });
  }

  res.json(simulatedResponse);
});

// ==========================================
// CLIENTS
// ==========================================

// GET /api-gateway/clients
apiGatewayRouter.get('/clients', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.apiClient.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

// POST /api-gateway/clients
apiGatewayRouter.post('/clients', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const parsed = clientSchema.parse(req.body);

    const clientId = 'client_' + crypto.randomBytes(8).toString('hex');
    const clientSecret = 'secret_' + crypto.randomBytes(16).toString('hex');

    const client = await prisma.apiClient.create({
      data: {
        clientName: parsed.clientName,
        clientId,
        clientSecret,
        contactEmail: parsed.contactEmail,
        organization: parsed.organization,
        status: parsed.status
      }
    });

    gatewayStats.activeClients += 1;

    // Audit Log
    await auditService.log({
      action: 'Client Created',
      tableName: 'ApiClient',
      recordId: String(client.id),
      newValue: client,
      userId
    });

    await auditService.log({
      action: 'OAuth Client Created',
      tableName: 'ApiClient',
      recordId: String(client.id),
      newValue: { clientId, clientName: parsed.clientName },
      userId
    });

    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
});

// PUT /api-gateway/clients/:id
apiGatewayRouter.put('/clients/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid client ID' });

    const userId = (req as any).user.userId;
    const parsed = clientSchema.partial().parse(req.body);

    const existing = await prisma.apiClient.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Client not found' });

    const updated = await prisma.apiClient.update({
      where: { id },
      data: parsed
    });

    await auditService.log({
      action: 'Client Updated',
      tableName: 'ApiClient',
      recordId: String(id),
      oldValue: existing,
      newValue: updated,
      userId
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api-gateway/clients/:id
apiGatewayRouter.delete('/clients/:id', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid client ID' });

    const userId = (req as any).user.userId;
    const existing = await prisma.apiClient.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Client not found' });

    await prisma.apiClient.delete({ where: { id } });

    // Revoke associated keys
    await prisma.apiKey.deleteMany({ where: { clientId: id } });

    gatewayStats.activeClients = Math.max(0, gatewayStats.activeClients - 1);

    await auditService.log({
      action: 'Client Deleted',
      tableName: 'ApiClient',
      recordId: String(id),
      oldValue: existing,
      userId
    });

    res.json({ success: true, message: 'Client and all associated API keys removed successfully.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// KEYS
// ==========================================

// GET /api-gateway/keys
apiGatewayRouter.get('/keys', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(keys);
  } catch (err) {
    next(err);
  }
});

// POST /api-gateway/keys
apiGatewayRouter.post('/keys', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const parsed = keySchema.parse(req.body);

    const rawKey = 'usrkey_' + crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parsed.expiresInDays);

    const apiKey = await prisma.apiKey.create({
      data: {
        keyName: parsed.keyName,
        apiKey: rawKey,
        clientId: parsed.clientId,
        expiresAt,
        status: 'Active'
      }
    });

    gatewayStats.activeKeys += 1;

    await auditService.log({
      action: 'API Key Generated',
      tableName: 'ApiKey',
      recordId: String(apiKey.id),
      newValue: { keyName: parsed.keyName, keyId: apiKey.id },
      userId
    });

    res.status(201).json(apiKey);
  } catch (err) {
    next(err);
  }
});

// POST /api-gateway/rotate-key
apiGatewayRouter.post('/rotate-key', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId } = req.body;
    if (!keyId) return res.status(400).json({ error: 'keyId is required' });

    const id = parseInt(keyId, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid key ID' });

    const userId = (req as any).user.userId;
    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'API Key not found' });

    // Rotate the key value and extend duration
    const rotatedRawKey = 'usrkey_rotated_' + crypto.randomBytes(24).toString('hex');
    const newExpires = new Date();
    newExpires.setDate(newExpires.getDate() + 30);

    const updated = await prisma.apiKey.update({
      where: { id },
      data: {
        apiKey: rotatedRawKey,
        status: 'Active',
        expiresAt: newExpires,
        updatedAt: new Date()
      }
    });

    await auditService.log({
      action: 'API Key Rotated',
      tableName: 'ApiKey',
      recordId: String(id),
      oldValue: { keyName: existing.keyName },
      newValue: { keyName: updated.keyName },
      userId
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// WEBHOOKS
// ==========================================

// GET /api-gateway/webhooks
apiGatewayRouter.get('/webhooks', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhooks = await prisma.webhookEndpoint.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(webhooks);
  } catch (err) {
    next(err);
  }
});

// POST /api-gateway/webhooks
apiGatewayRouter.post('/webhooks', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const parsed = webhookSchema.parse(req.body);

    const secretKey = 'whsec_' + crypto.randomBytes(16).toString('hex');

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        name: parsed.name,
        callbackUrl: parsed.callbackUrl,
        secretKey,
        eventType: parsed.eventType,
        active: parsed.active
      }
    });

    await auditService.log({
      action: 'Webhook Created',
      tableName: 'WebhookEndpoint',
      recordId: String(webhook.id),
      newValue: webhook,
      userId
    });

    res.status(201).json(webhook);
  } catch (err) {
    next(err);
  }
});

// POST /api-gateway/test-webhook
apiGatewayRouter.post('/test-webhook', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { webhookId, eventType } = req.body;
    if (!webhookId) return res.status(400).json({ error: 'webhookId is required' });

    const id = parseInt(webhookId, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid webhook ID' });

    const userId = (req as any).user.userId;
    const hook = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!hook) return res.status(404).json({ error: 'Webhook not found' });

    // Generate SHA-256 HMAC signature of mock request payload for enterprise security
    const timestamp = Math.floor(Date.now() / 1000);
    const mockPayload = {
      event: eventType || hook.eventType,
      timestamp,
      data: {
        id: Math.floor(Math.random() * 1000),
        status: 'Processed',
        description: 'Mock webhook event simulated payload'
      }
    };

    const signature = crypto
      .createHmac('sha256', hook.secretKey)
      .update(`${timestamp}.${JSON.stringify(mockPayload)}`)
      .digest('hex');

    gatewayStats.webhookDeliveries += 1;
    const io = getSocketServer();

    // Emit live Webhook delivery logs and details
    if (io) {
      io.emit('api-gateway:webhook-log', {
        webhookName: hook.name,
        callbackUrl: hook.callbackUrl,
        eventType: mockPayload.event,
        signature,
        status: 'Success (200 OK)',
        timestamp: new Date()
      });
    }

    await auditService.log({
      action: 'Webhook Triggered',
      tableName: 'WebhookEndpoint',
      recordId: String(id),
      newValue: { eventType: mockPayload.event, response: '200 OK' },
      userId
    });

    res.json({
      success: true,
      sentPayload: mockPayload,
      headers: {
        'x-signature': signature,
        'x-webhook-timestamp': timestamp
      },
      deliveryStatus: {
        responseCode: 200,
        responseStatus: 'OK',
        durationMs: 42
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// INTEGRATIONS
// ==========================================

// GET /api-gateway/integrations
apiGatewayRouter.get('/integrations', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integrations = await prisma.integrationProvider.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(integrations);
  } catch (err) {
    next(err);
  }
});

// POST /api-gateway/integrations
apiGatewayRouter.post('/integrations', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const parsed = integrationSchema.parse(req.body);

    const integration = await prisma.integrationProvider.create({
      data: {
        providerName: parsed.providerName,
        providerType: parsed.providerType,
        configuration: parsed.configuration,
        active: parsed.active
      }
    });

    // Notify integration update in real-time
    const io = getSocketServer();
    if (io) {
      io.emit('api-gateway:integration-status', {
        providerName: parsed.providerName,
        providerType: parsed.providerType,
        active: parsed.active,
        timestamp: new Date()
      });
    }

    await auditService.log({
      action: 'Integration Added',
      tableName: 'IntegrationProvider',
      recordId: String(integration.id),
      newValue: integration,
      userId
    });

    res.status(201).json(integration);
  } catch (err) {
    next(err);
  }
});

// GET /api-gateway/dashboard-analytics
apiGatewayRouter.get('/dashboard-analytics', authenticate, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientCount = await prisma.apiClient.count();
    const keyCount = await prisma.apiKey.count();
    const webhookCount = await prisma.webhookEndpoint.count();
    const integrationCount = await prisma.integrationProvider.count();

    // Map simulated charts for Recharts
    const apiUsageChart = [
      { date: 'Mon', requests: 12400, errors: 45, latency: 120 },
      { date: 'Tue', requests: 14200, errors: 30, latency: 115 },
      { date: 'Wed', requests: 15100, errors: 52, latency: 130 },
      { date: 'Thu', requests: 13900, errors: 21, latency: 110 },
      { date: 'Fri', requests: 16800, errors: 60, latency: 125 },
      { date: 'Sat', requests: 9200, errors: 10, latency: 95 },
      { date: 'Sun', requests: 8800, errors: 8, latency: 90 }
    ];

    const clientUsageChart = [
      { name: 'Student Mobile App', requests: 48000 },
      { name: 'Faculty Portal', requests: 35000 },
      { name: 'Finance Controller Node', requests: 25000 },
      { name: 'Moodle LMS Connector', requests: 18000 },
      { name: 'Library Self Checkout', requests: 12000 }
    ];

    const integrationChart = [
      { name: 'Stripe Pay', successRate: 99.8 },
      { name: 'Moodle Sync', successRate: 98.4 },
      { name: 'Google Workspace', successRate: 100.0 },
      { name: 'HEC Gov API', successRate: 92.5 }
    ];

    res.json({
      stats: {
        totalRequests: gatewayStats.totalRequests,
        activeClients: clientCount || gatewayStats.activeClients,
        activeKeys: keyCount || gatewayStats.activeKeys,
        rpm: gatewayStats.rpm,
        failedRequests: gatewayStats.failedRequests,
        rateLimitViolations: gatewayStats.rateLimitViolations,
        webhookDeliveries: gatewayStats.webhookDeliveries,
        integrationHealth: gatewayStats.integrationHealth
      },
      apiUsageChart,
      clientUsageChart,
      integrationChart
    });
  } catch (err) {
    next(err);
  }
});
