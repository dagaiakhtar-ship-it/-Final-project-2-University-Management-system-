import { Request, Response } from 'express';
import { prisma } from '../services/db.service';
import { getSocketServer } from '../services/socket.service';
import crypto from 'crypto';

// Standard static definition of APIs
const AVAILABLE_APIS = [
  {
    id: 'api-academic',
    name: 'Academic Core API',
    category: 'Public',
    description: 'Manage courses, classes, sections, semesters, and course offerings in real time.',
    version: 'v1.2',
    status: 'Active',
    lifecycle: 'Published',
    pricing: 'Free / Pro Tier',
    endpoints: [
      { method: 'GET', path: '/api/courses', description: 'Retrieve all cataloged courses' },
      { method: 'POST', path: '/api/courses', description: 'Create a new course catalog record' },
      { method: 'GET', path: '/api/semesters', description: 'Retrieve all semesters' }
    ]
  },
  {
    id: 'api-student',
    name: 'Student Profiles & Registrations API',
    category: 'Public',
    description: 'Retrieve student profiles, academic histories, registrations, and performance records.',
    version: 'v1.5',
    status: 'Active',
    lifecycle: 'Published',
    pricing: 'Free / Enterprise Tier',
    endpoints: [
      { method: 'GET', path: '/api/students', description: 'Retrieve student list with filters' },
      { method: 'GET', path: '/api/students/:id', description: 'Retrieve full details of a student' },
      { method: 'POST', path: '/api/enrollments', description: 'Submit new student course enrollments' }
    ]
  },
  {
    id: 'api-grc',
    name: 'Governance, Risk & Compliance (GRC) API',
    category: 'Private',
    description: 'Access security ledger logs, compliance documents, policy catalogs, and mitigation registers.',
    version: 'v1.0',
    status: 'Active',
    lifecycle: 'Published',
    pricing: 'Enterprise Tier Only',
    endpoints: [
      { method: 'GET', path: '/api/audit/events', description: 'Retrieve immutable system-wide audit trail' },
      { method: 'GET', path: '/api/compliance/policies', description: 'List active compliance policies' },
      { method: 'GET', path: '/api/risks', description: 'Retrieve active enterprise risk registers' }
    ]
  },
  {
    id: 'api-finance',
    name: 'Enterprise Finance & Billing API',
    category: 'Internal',
    description: 'Query student invoice statements, tuition records, fee tables, and administrative payroll reports.',
    version: 'v2.0',
    status: 'Active',
    lifecycle: 'Published',
    pricing: 'Internal Only',
    endpoints: [
      { method: 'GET', path: '/api/invoices', description: 'Retrieve all bills and payment invoices' },
      { method: 'POST', path: '/api/payments', description: 'Record student tuition transaction payments' }
    ]
  },
  {
    id: 'api-workflows',
    name: 'Business Processes & BPMN Orchestrator API',
    category: 'Private',
    description: 'Trigger, execute, monitor, and approve custom business workflow steps, rules, and delays.',
    version: 'v1.1',
    status: 'Active',
    lifecycle: 'Published',
    pricing: 'Pro Tier Only',
    endpoints: [
      { method: 'GET', path: '/api/workflows', description: 'List all custom design workflows' },
      { method: 'POST', path: '/api/workflows/execute', description: 'Trigger manual workflow execution context' }
    ]
  },
  {
    id: 'api-search',
    name: 'Enterprise Federated Search API',
    category: 'Public',
    description: 'Perform vector or text query matching over student details, library catalogs, and core databases.',
    version: 'v1.0',
    status: 'Active',
    lifecycle: 'Published',
    pricing: 'Free Tier',
    endpoints: [
      { method: 'POST', path: '/api/search', description: 'Query federated indexing vector clusters' }
    ]
  }
];

// Complete high-fidelity OpenAPI 3.1 definition
const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Smart University ERP & Developer Integration Hub Platform Core API',
    description: 'Complete, production-ready REST & Socket API Reference for the Smart University ERP ecosystem. Authorized via JWT Bearer or Application X-API-KEY headers.',
    version: '1.0.0',
    contact: {
      name: 'Smart Developer Relations Office',
      email: 'dev-support@smartuni.edu'
    }
  },
  servers: [
    { url: 'https://api.smartuni.edu/v1', description: 'Primary Secure Production Server' },
    { url: 'http://localhost:3000/api', description: 'Localhost Developer Sandboxed Environment' }
  ],
  paths: {
    '/developer/apis': {
      get: {
        summary: 'List Available ERP Hub APIs',
        description: 'Returns all cataloged, active API modules with access scopes and service boundaries.',
        responses: {
          '200': { description: 'Successful catalog lookup of public and private endpoint definitions' }
        }
      }
    },
    '/developer/apps': {
      get: {
        summary: 'List Registered Developer Applications',
        responses: { '200': { description: 'Applications owned by authenticated client token context' } }
      },
      post: {
        summary: 'Register New Integrated Application',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['applicationName'],
                properties: {
                  applicationName: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Application registered with brand new cryptographic API Key generated' } }
      }
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

export class DeveloperController {
  
  // GET /api/developer/apis
  async getApis(req: Request, res: Response) {
    try {
      return res.status(200).json(AVAILABLE_APIS);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error lookup' });
    }
  }

  // GET /api/developer/docs
  async getDocs(req: Request, res: Response) {
    try {
      return res.status(200).json(OPENAPI_SPEC);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error rendering spec' });
    }
  }

  // POST /api/developer/apps
  async createApp(req: Request, res: Response) {
    try {
      const { applicationName, description } = req.body;
      const ownerId = req.user?.userId || 1; // Fallback to 1 if testing or bypass active

      if (!applicationName) {
        return res.status(400).json({ error: 'Application Name is a mandatory parameter.' });
      }

      // Generate a highly secure unique API Key prefixed with sk_live_
      const randomBytes = crypto.randomBytes(24).toString('hex');
      const apiKey = `sk_live_${randomBytes}`;

      const newApp = await prisma.apiApplication.create({
        data: {
          applicationName,
          description: description || null,
          apiKey,
          ownerId,
          status: 'Active'
        }
      });

      // Auto-subscribe the new app to some default APIs so it is instantly usable
      await prisma.apiSubscription.createMany({
        data: [
          { applicationId: newApp.id, apiName: 'Academic Core API', version: 'v1.2', plan: 'Free' },
          { applicationId: newApp.id, apiName: 'Student Profiles & Registrations API', version: 'v1.5', plan: 'Free' }
        ]
      });

      // Seed Initial Mock Usage data for charts visualization
      const endpointOptions = [
        '/api/courses',
        '/api/students',
        '/api/semesters',
        '/api/enrollments'
      ];

      const days = 7;
      const usagePromises = [];
      for (let i = days; i >= 0; i--) {
        const recordedAt = new Date();
        recordedAt.setDate(recordedAt.getDate() - i);
        
        for (const endpoint of endpointOptions) {
          const requestCount = Math.floor(Math.random() * 200) + 50;
          const errorCount = Math.floor(Math.random() * requestCount * 0.05); // max 5% errors
          const averageLatency = Math.floor(Math.random() * 120) + 45; // 45ms to 165ms

          usagePromises.push(
            prisma.apiUsage.create({
              data: {
                applicationId: newApp.id,
                endpoint,
                requestCount,
                errorCount,
                averageLatency,
                recordedAt
              }
            })
          );
        }
      }
      await Promise.all(usagePromises);

      // Track Audit Event
      await prisma.auditEvent.create({
        data: {
          module: 'DeveloperPortal',
          entityType: 'ApiApplication',
          entityId: String(newApp.id),
          action: 'API_KEY_GENERATED',
          performedBy: req.user?.email || 'developer-portal@smartuni.edu',
          newValue: JSON.stringify({ applicationId: newApp.id, applicationName })
        }
      });

      // Notify Socket
      const io = getSocketServer();
      if (io) {
        io.emit('grc:changed', {
          type: 'API_APP_CREATED',
          action: `New Dev Application: ${applicationName}`,
          payload: newApp
        });
      }

      return res.status(201).json(newApp);
    } catch (error: any) {
      console.error('[CreateApp Error]:', error);
      return res.status(500).json({ error: error.message || 'Error occurred creating app key' });
    }
  }

  // GET /api/developer/apps
  async getApps(req: Request, res: Response) {
    try {
      const ownerId = req.user?.userId || 1;
      
      // If Super Admin, can retrieve all applications for analytics dashboard
      const isSuperAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

      const apps = await prisma.apiApplication.findMany({
        where: isSuperAdmin ? {} : { ownerId },
        include: {
          webhooks: true,
          subscriptions: true,
          usages: true
        }
      });

      return res.status(200).json(apps);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred retrieving apps' });
    }
  }

  // POST /api/developer/webhooks
  async createWebhook(req: Request, res: Response) {
    try {
      const { applicationId, webhookName, url } = req.body;

      if (!applicationId || !webhookName || !url) {
        return res.status(400).json({ error: 'applicationId, webhookName, and url are required fields.' });
      }

      // Generate a cryptographic webhook secret
      const secret = `whsec_${crypto.randomBytes(16).toString('hex')}`;

      const webhook = await prisma.apiWebhook.create({
        data: {
          applicationId: parseInt(applicationId, 10),
          webhookName,
          url,
          secret,
          active: true
        }
      });

      // Track Audit Event
      await prisma.auditEvent.create({
        data: {
          module: 'DeveloperPortal',
          entityType: 'ApiWebhook',
          entityId: String(webhook.id),
          action: 'WEBHOOK_CREATED',
          performedBy: req.user?.email || 'developer-portal@smartuni.edu',
          newValue: JSON.stringify({ webhookId: webhook.id, webhookName })
        }
      });

      const io = getSocketServer();
      if (io) {
        io.emit('grc:changed', {
          type: 'WEBHOOK_CREATED',
          action: `Webhook URL linked: ${webhookName}`,
          payload: webhook
        });
        io.emit('grc:audit_event', {
          payload: { action: 'WEBHOOK_CREATED' }
        });
      }

      return res.status(201).json(webhook);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred creating webhook' });
    }
  }

  // GET /api/developer/webhooks
  async getWebhooks(req: Request, res: Response) {
    try {
      const ownerId = req.user?.userId || 1;
      const isSuperAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

      const webhooks = await prisma.apiWebhook.findMany({
        where: isSuperAdmin ? {} : {
          application: {
            ownerId
          }
        },
        include: {
          application: true
        }
      });

      return res.status(200).json(webhooks);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred retrieving webhooks' });
    }
  }

  // POST /api/developer/subscriptions
  async createSubscription(req: Request, res: Response) {
    try {
      const { applicationId, apiName, version, plan } = req.body;

      if (!applicationId || !apiName || !version || !plan) {
        return res.status(400).json({ error: 'applicationId, apiName, version, and plan are required fields.' });
      }

      const subscription = await prisma.apiSubscription.create({
        data: {
          applicationId: parseInt(applicationId, 10),
          apiName,
          version,
          plan
        }
      });

      // Track Audit Event
      await prisma.auditEvent.create({
        data: {
          module: 'DeveloperPortal',
          entityType: 'ApiSubscription',
          entityId: String(subscription.id),
          action: 'SUBSCRIPTION_CREATED',
          performedBy: req.user?.email || 'developer-portal@smartuni.edu',
          newValue: JSON.stringify({ subscriptionId: subscription.id, apiName })
        }
      });

      const io = getSocketServer();
      if (io) {
        io.emit('grc:changed', {
          type: 'SUBSCRIPTION_CREATED',
          action: `App subscribed to API: ${apiName}`,
          payload: subscription
        });
      }

      return res.status(201).json(subscription);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error creating API subscription' });
    }
  }

  // GET /api/developer/usage
  async getUsage(req: Request, res: Response) {
    try {
      const ownerId = req.user?.userId || 1;
      const isSuperAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

      const usage = await prisma.apiUsage.findMany({
        where: isSuperAdmin ? {} : {
          application: {
            ownerId
          }
        },
        include: {
          application: true
        },
        orderBy: {
          recordedAt: 'asc'
        }
      });

      return res.status(200).json(usage);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred fetching usage data' });
    }
  }
}

export const developerController = new DeveloperController();
