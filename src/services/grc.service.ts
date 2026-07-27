import { prisma } from './db.service';
import { notifyGRCChange } from './socket.service';

export interface AuditEventFilters {
  module?: string;
  entityType?: string;
  action?: string;
  performedBy?: string;
}

export class GRCService {
  /**
   * Log an immutable audit event
   */
  static async logEvent(data: {
    module: string;
    entityType: string;
    entityId?: string | number;
    action: string;
    oldValue?: string;
    newValue?: string;
    performedBy: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const event = await prisma.auditEvent.create({
      data: {
        module: data.module,
        entityType: data.entityType,
        entityId: data.entityId ? String(data.entityId) : null,
        action: data.action,
        oldValue: data.oldValue,
        newValue: data.newValue,
        performedBy: data.performedBy,
        ipAddress: data.ipAddress || '127.0.0.1',
        userAgent: data.userAgent || 'system',
      },
    });

    // Notify realtime sockets
    notifyGRCChange('audit', data.action, event);

    return event;
  }

  /**
   * Fetch all audit events with optional filtering
   */
  static async getEvents(filters: AuditEventFilters = {}) {
    const where: any = {};
    if (filters.module) {
      where.module = filters.module;
    }
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.performedBy) {
      where.performedBy = { contains: filters.performedBy, mode: 'insensitive' };
    }

    return prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000, // Safety limit for performance
    });
  }

  /**
   * Fetch list of users for audit logs dropdown
   */
  static async getAuditUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true,
          }
        }
      },
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: { firstName: 'asc' }
    });
  }

  /**
   * Get all compliance policies
   */
  static async getPolicies(category?: string) {
    const where = category ? { category } : {};
    return prisma.compliancePolicy.findMany({
      where,
      orderBy: { policyCode: 'asc' },
    });
  }

  /**
   * Create a compliance policy
   */
  static async createPolicy(data: {
    policyCode: string;
    policyName: string;
    category: string;
    description: string;
    version: string;
    status: string;
    effectiveDate?: Date;
    performedBy: string;
  }) {
    const policy = await prisma.compliancePolicy.create({
      data: {
        policyCode: data.policyCode,
        policyName: data.policyName,
        category: data.category,
        description: data.description,
        version: data.version,
        status: data.status,
        effectiveDate: data.effectiveDate || new Date(),
      }
    });

    // Log the audit event
    await GRCService.logEvent({
      module: 'Compliance',
      entityType: 'CompliancePolicy',
      entityId: policy.id,
      action: 'POLICY_CREATED',
      newValue: JSON.stringify(policy),
      performedBy: data.performedBy,
    });

    notifyGRCChange('policy', 'CREATED', policy);

    return policy;
  }

  /**
   * Update a compliance policy
   */
  static async updatePolicy(
    id: number,
    data: {
      policyCode?: string;
      policyName?: string;
      category?: string;
      description?: string;
      version?: string;
      status?: string;
      effectiveDate?: Date;
      performedBy: string;
    }
  ) {
    const oldPolicy = await prisma.compliancePolicy.findUnique({ where: { id } });
    if (!oldPolicy) {
      throw new Error(`CompliancePolicy not found with ID ${id}`);
    }

    const { performedBy, ...updateData } = data;

    const policy = await prisma.compliancePolicy.update({
      where: { id },
      data: updateData,
    });

    const isApproval = oldPolicy.status !== 'Active' && policy.status === 'Active';

    // Log the audit event
    await GRCService.logEvent({
      module: 'Compliance',
      entityType: 'CompliancePolicy',
      entityId: policy.id,
      action: isApproval ? 'POLICY_APPROVED' : 'POLICY_UPDATED',
      oldValue: JSON.stringify(oldPolicy),
      newValue: JSON.stringify(policy),
      performedBy: performedBy,
    });

    notifyGRCChange('policy', isApproval ? 'APPROVED' : 'UPDATED', policy);

    return policy;
  }

  /**
   * Get all risks from the Risk Register
   */
  static async getRisks(category?: string) {
    const where = category ? { category } : {};
    return prisma.riskRegister.findMany({
      where,
      orderBy: { riskCode: 'asc' },
    });
  }

  /**
   * Create a new Risk Register entry
   */
  static async createRisk(data: {
    riskCode: string;
    title: string;
    category: string;
    probability: string;
    impact: string;
    severity: string;
    owner: string;
    mitigationPlan: string;
    status: string;
    performedBy: string;
  }) {
    const risk = await prisma.riskRegister.create({
      data: {
        riskCode: data.riskCode,
        title: data.title,
        category: data.category,
        probability: data.probability,
        impact: data.impact,
        severity: data.severity,
        owner: data.owner,
        mitigationPlan: data.mitigationPlan,
        status: data.status,
      }
    });

    // Log the audit event
    await GRCService.logEvent({
      module: 'RiskManagement',
      entityType: 'RiskRegister',
      entityId: risk.id,
      action: 'RISK_CREATED',
      newValue: JSON.stringify(risk),
      performedBy: data.performedBy,
    });

    notifyGRCChange('risk', 'CREATED', risk);

    return risk;
  }

  /**
   * Update a Risk Register entry
   */
  static async updateRisk(
    id: number,
    data: {
      riskCode?: string;
      title?: string;
      category?: string;
      probability?: string;
      impact?: string;
      severity?: string;
      owner?: string;
      mitigationPlan?: string;
      status?: string;
      performedBy: string;
    }
  ) {
    const oldRisk = await prisma.riskRegister.findUnique({ where: { id } });
    if (!oldRisk) {
      throw new Error(`RiskRegister entry not found with ID ${id}`);
    }

    const { performedBy, ...updateData } = data;

    const risk = await prisma.riskRegister.update({
      where: { id },
      data: updateData,
    });

    // Log the audit event
    await GRCService.logEvent({
      module: 'RiskManagement',
      entityType: 'RiskRegister',
      entityId: risk.id,
      action: 'RISK_UPDATED',
      oldValue: JSON.stringify(oldRisk),
      newValue: JSON.stringify(risk),
      performedBy: performedBy,
    });

    notifyGRCChange('risk', 'UPDATED', risk);

    return risk;
  }

  /**
   * Get all evidence documents
   */
  static async getEvidence(auditId?: string) {
    const where = auditId ? { auditId } : {};
    return prisma.auditEvidence.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Upload audit evidence
   */
  static async createEvidence(data: {
    auditId: string;
    title: string;
    description: string;
    fileUrl: string;
    uploadedBy: string;
  }) {
    const evidence = await prisma.auditEvidence.create({
      data: {
        auditId: data.auditId,
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        uploadedBy: data.uploadedBy,
      }
    });

    // Log the audit event
    await GRCService.logEvent({
      module: 'Audit',
      entityType: 'AuditEvidence',
      entityId: evidence.id,
      action: 'EVIDENCE_UPLOADED',
      newValue: JSON.stringify(evidence),
      performedBy: data.uploadedBy,
    });

    notifyGRCChange('evidence', 'UPLOADED', evidence);

    return evidence;
  }
}
