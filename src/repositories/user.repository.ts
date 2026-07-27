import { prisma } from '../services/db.service';
import { Prisma, User } from '@prisma/client';
import { UserWithRole } from '../types/auth.types';

export class UserRepository {
  async findByEmail(email: string): Promise<UserWithRole | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findById(id: number): Promise<UserWithRole | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findByUuid(uuid: string): Promise<UserWithRole | null> {
    return prisma.user.findUnique({
      where: { uuid },
      include: { role: true },
    });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<UserWithRole | null> {
    return prisma.user.findUnique({
      where: { firebaseUid },
      include: { role: true },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithRole> {
    return prisma.user.create({
      data,
      include: { role: true },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<UserWithRole> {
    return prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async incrementFailedLogins(id: number, maxAttempts: number = 5): Promise<{ failedLoginAttempts: number; accountLockedUntil: Date | null }> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    const nextAttempts = user.failedLoginAttempts + 1;
    let lockUntil: Date | null = null;

    if (nextAttempts >= maxAttempts) {
      // Lock account for 15 minutes
      lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: nextAttempts,
        ...(lockUntil ? { accountLockedUntil: lockUntil } : {}),
      },
    });

    return {
      failedLoginAttempts: updated.failedLoginAttempts,
      accountLockedUntil: updated.accountLockedUntil,
    };
  }

  async resetFailedLogins(id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });
  }
}

export const userRepository = new UserRepository();
