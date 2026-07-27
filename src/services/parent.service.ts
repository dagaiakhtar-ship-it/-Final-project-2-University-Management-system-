import { prisma } from './db.service';
import { auditService } from './audit.service';

export interface ParentFilterParams {
  search?: string;
  relation?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class ParentService {
  async getParents(params: ParentFilterParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { occupation: { contains: params.search, mode: 'insensitive' } },
        { relation: { contains: params.search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.relation) {
      where.relation = params.relation;
    }

    const [parents, total] = await Promise.all([
      prisma.parent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
          students: {
            select: {
              id: true,
              uuid: true,
              registrationNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.parent.count({ where }),
    ]);

    return {
      parents,
      total,
      page,
      limit,
    };
  }

  async getParentByUserId(userId: number) {
    const parent = await prisma.parent.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        students: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            department: { select: { id: true, name: true, code: true } },
            program: { select: { id: true, name: true, code: true } },
            section: { select: { id: true, name: true, code: true } },
            semester: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!parent) {
      throw new Error('Parent record not found');
    }

    return parent;
  }

  async getParentByUuid(uuid: string) {
    const parent = await prisma.parent.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        students: {
          select: {
            id: true,
            uuid: true,
            registrationNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            department: { select: { name: true, code: true } },
          },
        },
      },
    });

    if (!parent) {
      throw new Error('Parent record not found');
    }

    return parent;
  }

  async createParent(
    data: {
      userId: number;
      relation: string;
      occupation?: string;
      studentIds?: number[];
    },
    currentUserId: number
  ) {
    const existing = await prisma.parent.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      throw new Error('This user account is already linked to a parent record');
    }

    const parent = await prisma.parent.create({
      data: {
        userId: data.userId,
        relation: data.relation,
        occupation: data.occupation || null,
        createdBy: String(currentUserId),
        students: data.studentIds
          ? {
              connect: data.studentIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await auditService.log({
      action: 'PARENT_CREATE',
      tableName: 'Parent',
      recordId: String(parent.id),
      userId: currentUserId,
      details: `Created parent record for user ${parent.user.email}`,
    } as any);

    return parent;
  }

  async updateParentByUuid(
    uuid: string,
    data: {
      relation?: string;
      occupation?: string;
      status?: string;
    },
    currentUserId: number
  ) {
    const parent = await this.getParentByUuid(uuid);

    const updated = await prisma.parent.update({
      where: { id: parent.id },
      data: {
        ...data,
        updatedBy: String(currentUserId),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await auditService.log({
      action: 'PARENT_UPDATE',
      tableName: 'Parent',
      recordId: String(parent.id),
      userId: currentUserId,
      details: `Updated parent record ${(parent as any).user?.email || ''}`,
    } as any);

    return updated;
  }

  async deleteParentByUuid(uuid: string, currentUserId: number) {
    const parent = await this.getParentByUuid(uuid);

    await prisma.parent.update({
      where: { id: parent.id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
        updatedBy: String(currentUserId),
      },
    });

    await auditService.log({
      action: 'PARENT_DELETE',
      tableName: 'Parent',
      recordId: String(parent.id),
      userId: currentUserId,
      details: `Deleted parent record ${(parent as any).user?.email || ''}`,
    } as any);
  }
}

export const parentService = new ParentService();
