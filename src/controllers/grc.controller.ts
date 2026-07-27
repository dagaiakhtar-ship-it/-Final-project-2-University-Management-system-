import { Request, Response, NextFunction } from 'express';
import { GRCService } from '../services/grc.service';

export class GRCController {
  /**
   * GET /api/audit/events
   */
  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { module, entityType, action, performedBy } = req.query;
      const events = await GRCService.getEvents({
        module: module as string,
        entityType: entityType as string,
        action: action as string,
        performedBy: performedBy as string,
      });
      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit/users
   */
  public async getAuditUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await GRCService.getAuditUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/compliance/policies
   */
  public async getPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const policies = await GRCService.getPolicies(category);
      res.status(200).json(policies);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/compliance/policies
   */
  public async createPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { policyCode, policyName, category, description, version, status, effectiveDate } = req.body;
      const performedBy = req.user?.email || 'system_administrator';

      if (!policyCode || !policyName || !category || !description || !version || !status) {
        res.status(400).json({ error: 'Missing required fields for policy creation' });
        return;
      }

      const policy = await GRCService.createPolicy({
        policyCode,
        policyName,
        category,
        description,
        version,
        status,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        performedBy,
      });

      res.status(201).json(policy);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Policy code already exists' });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/compliance/policies/:id
   */
  public async updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid policy ID' });
        return;
      }

      const performedBy = req.user?.email || 'system_administrator';
      const { policyCode, policyName, category, description, version, status, effectiveDate } = req.body;

      const policy = await GRCService.updatePolicy(id, {
        policyCode,
        policyName,
        category,
        description,
        version,
        status,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        performedBy,
      });

      res.status(200).json(policy);
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/risks
   */
  public async getRisks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const risks = await GRCService.getRisks(category);
      res.status(200).json(risks);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/risks
   */
  public async createRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { riskCode, title, category, probability, impact, severity, owner, mitigationPlan, status } = req.body;
      const performedBy = req.user?.email || 'system_administrator';

      if (!riskCode || !title || !category || !probability || !impact || !severity || !owner || !mitigationPlan || !status) {
        res.status(400).json({ error: 'Missing required fields for risk registration' });
        return;
      }

      const risk = await GRCService.createRisk({
        riskCode,
        title,
        category,
        probability,
        impact,
        severity,
        owner,
        mitigationPlan,
        status,
        performedBy,
      });

      res.status(201).json(risk);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Risk code already exists' });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/risks/:id
   */
  public async updateRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid risk ID' });
        return;
      }

      const performedBy = req.user?.email || 'system_administrator';
      const { riskCode, title, category, probability, impact, severity, owner, mitigationPlan, status } = req.body;

      const risk = await GRCService.updateRisk(id, {
        riskCode,
        title,
        category,
        probability,
        impact,
        severity,
        owner,
        mitigationPlan,
        status,
        performedBy,
      });

      res.status(200).json(risk);
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/evidence
   */
  public async getEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auditId = req.query.auditId as string | undefined;
      const evidence = await GRCService.getEvidence(auditId);
      res.status(200).json(evidence);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/evidence
   */
  public async createEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { auditId, title, description, fileUrl } = req.body;
      const uploadedBy = req.user?.email || 'system_administrator';

      if (!auditId || !title || !description || !fileUrl) {
        res.status(400).json({ error: 'Missing required fields for evidence upload' });
        return;
      }

      const evidence = await GRCService.createEvidence({
        auditId,
        title,
        description,
        fileUrl,
        uploadedBy,
      });

      res.status(201).json(evidence);
    } catch (error) {
      next(error);
    }
  }
}

export const grcController = new GRCController();
