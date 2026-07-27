import { prisma } from './db.service';
import { auditService } from './audit.service';
import { passwordService } from './password.service';

export interface UserFilterParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class UserService {
  async getUsers(params: UserFilterParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.role) {
      where.role = {
        name: params.role,
      };
    }

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          uuid: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          gender: true,
          status: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          admin: true,
          teacher: true,
          student: true,
          parent: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async getUserByUuid(uuid: string) {
    const user = await prisma.user.findFirst({
      where: { uuid, deletedAt: null },
      select: {
        id: true,
        uuid: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        status: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        admin: true,
        teacher: true,
        student: true,
        parent: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async createUser(
    data: {
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      roleName: string;
      status?: string;
    },
    currentUserId: number
  ) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    // Find role ID
    const role = await prisma.role.findFirst({
      where: { name: data.roleName as any },
    });

    if (!role) {
      throw new Error(`Role ${data.roleName} not found`);
    }

    const hashedPassword = await passwordService.hash(data.password || 'ChangeMe123!');

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender || 'MALE',
        roleId: role.id,
        status: data.status || 'ACTIVE',
        createdBy: String(currentUserId),
      },
      select: {
        id: true,
        uuid: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: { select: { name: true } },
      },
    });

    await auditService.log({
      action: 'USER_CREATE',
      tableName: 'User',
      recordId: String(user.id),
      userId: currentUserId,
      details: `Created user ${user.email} (${user.role.name})`,
    } as any);

    return user;
  }

  async updateUserByUuid(
    uuid: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      status?: string;
      roleName?: string;
    },
    currentUserId: number
  ) {
    const user = await this.getUserByUuid(uuid);

    const updateData: any = {
      updatedBy: String(currentUserId),
    };

    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.status) updateData.status = data.status;

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        throw new Error('Email is already in use by another user');
      }
      updateData.email = data.email;
    }

    if (data.roleName) {
      const role = await prisma.role.findFirst({ where: { name: data.roleName as any } });
      if (!role) throw new Error(`Role ${data.roleName} not found`);
      updateData.roleId = role.id;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        uuid: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: { select: { name: true } },
      },
    });

    await auditService.log({
      action: 'USER_UPDATE',
      tableName: 'User',
      recordId: String(user.id),
      userId: currentUserId,
      details: `Updated user profile ${user.email}`,
    } as any);

    return updated;
  }

  async deleteUserByUuid(uuid: string, currentUserId: number) {
    const user = await this.getUserByUuid(uuid);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
        updatedBy: String(currentUserId),
      },
    });

    await auditService.log({
      action: 'USER_DELETE',
      tableName: 'User',
      recordId: String(user.id),
      userId: currentUserId,
      details: `Deleted user account ${user.email}`,
    } as any);
  }
}

export const userService = new UserService();
