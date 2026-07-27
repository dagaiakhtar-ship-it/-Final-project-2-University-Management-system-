import { prisma } from './db.service';

export class AuditService {
  async log(params: {
    action: string;
    tableName: string;
    recordId?: string;
    oldValue?: any;
    newValue?: any;
    userId?: number;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: params.action,
          tableName: params.tableName,
          recordId: params.recordId,
          oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
          newValue: params.newValue ? JSON.stringify(params.newValue) : null,
          userId: params.userId,
          ipAddress: params.ipAddress,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async getLogs(): Promise<any[]> {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 100, // Limit to recent logs for performance
    });
  }
}

export const auditService = new AuditService();
export default auditService;
