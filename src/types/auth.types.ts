import { UserRole, Prisma } from '@prisma/client';
import { Request } from 'express';

export type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

export interface UserContext {
  userId: number;
  userUuid: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}
