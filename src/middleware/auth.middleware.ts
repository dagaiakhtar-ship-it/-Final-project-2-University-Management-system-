import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { prisma } from '../services/db.service';
import { UserRole } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';
import {
  UnauthorizedError,
  ForbiddenError,
  ExpiredTokenError,
  InvalidTokenError,
} from '../errors/auth.errors';

/**
 * Authentication Middleware: extracts and validates the JWT Bearer Token from headers.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required. Format: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Malformed authentication token');
    }

    // Verify token and attach user context
    const decoded = authService.verifyToken(token);
    
    // Ensure the user exists and is active in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE' || !user.isActive) {
      throw new UnauthorizedError('User account is inactive or does not exist');
    }

    req.user = {
      userId: user.id,
      userUuid: user.uuid,
      email: user.email,
      role: user.role.name as UserRole,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control Middleware (RBAC): enforces that the user holds one of the specified roles.
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(`Access denied. Allowed roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Fine-Grained Permission-Based Access Control Middleware: checks database role-permissions mapping.
 */
export function requirePermissions(requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      // Look up user's permissions via database RBAC
      const userWithPermissions = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          role: {
            select: {
              permissions: {
                select: {
                  permission: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!userWithPermissions || !userWithPermissions.role) {
        throw new ForbiddenError();
      }

      const assignedPermissions = userWithPermissions.role.permissions.map(
        (rp) => rp.permission.name
      );

      // Verify that all required permissions are met
      const hasAllPermissions = requiredPermissions.every((perm) =>
        assignedPermissions.includes(perm)
      );

      if (!hasAllPermissions) {
        throw new ForbiddenError(`Missing required permission(s): ${requiredPermissions.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Authentication Rate Limiter: mitigates brute force and denial of service attacks.
 * Max 15 attempts per 15 minutes per IP address.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});
