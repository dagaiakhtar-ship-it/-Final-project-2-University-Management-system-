import { userRepository } from '../repositories/user.repository';
import { passwordService } from './password.service';
import { tokenService, TokenPayload } from './token.service';
import { firebaseAdminService } from './firebase-admin.service';
import { prisma } from './db.service';
import { UserRole, Gender } from '@prisma/client';
import { UserWithRole } from '../types/auth.types';
import {
  InvalidCredentialsError,
  UserNotFoundError,
  AccountLockedError,
  EmailNotVerifiedError,
  InvalidTokenError,
  ForbiddenError,
} from '../errors/auth.errors';
import jwt from 'jsonwebtoken';

export class AuthService {
  /**
   * Helper to ensure a Role exists in the DB, and get its ID.
   */
  private async ensureRole(roleName: UserRole): Promise<number> {
    const existingRole = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (existingRole) {
      return existingRole.id;
    }

    // Auto-create role if unseeded to avoid breaking the application
    const newRole = await prisma.role.create({
      data: {
        name: roleName,
        description: `Dynamic role for ${roleName}`,
      },
    });
    return newRole.id;
  }

  /**
   * Register Service
   */
  async register(data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    gender: Gender;
    role: UserRole;
  }) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email address is already registered');
    }

    const roleId = await this.ensureRole(data.role);

    // Hash the password if provided
    let passwordHash = '';
    if (data.password) {
      passwordHash = await passwordService.hash(data.password);
    }

    // Register user in Firebase Authentication
    let firebaseUid: string | null = null;
    try {
      const displayName = `${data.firstName} ${data.lastName}`;
      const fbUser = await firebaseAdminService.createUser(data.email, data.password, displayName);
      firebaseUid = fbUser.uid;
    } catch (error: any) {
      console.warn('[AuthService] Firebase registration skipped or failed:', error.message || error);
    }

    // Create user in PostgreSQL database
    const user = await userRepository.create({
      email: data.email,
      password: passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      firebaseUid,
      isEmailVerified: false,
      role: { connect: { id: roleId } },
      status: 'ACTIVE',
    });

    // Generate an email verification link
    let verificationLink = '';
    let verificationToken = '';
    try {
      verificationToken = await this.generateEmailVerificationLink(data.email);
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      verificationLink = `${appUrl}/verify-email?token=${verificationToken}`;
      console.log(`[Email Verification] Verification email dispatched to ${data.email}.`);
      console.log(`[Email Verification] Click Link to verify: ${verificationLink}`);
    } catch (err: any) {
      console.warn('[Email Verification] Link generation skipped:', err.message || err);
    }

    // Generate response tokens
    const tokens = this.generateUserTokens({
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      role: data.role,
      refreshTokenVersion: user.refreshTokenVersion,
    });

    return {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: data.role,
        isEmailVerified: user.isEmailVerified,
      },
      verificationLink,
      verificationToken,
      ...tokens,
    };
  }

  /**
   * Login Service
   */
  async login(credentials: {
    email?: string;
    password?: string;
    firebaseToken?: string;
  }) {
    let user: UserWithRole | null = null;

    if (credentials.firebaseToken) {
      // Login via Firebase SSO (Google, etc.)
      const decodedToken = await firebaseAdminService.verifyIdToken(credentials.firebaseToken);
      const email = decodedToken.email;
      if (!email) {
        throw new InvalidCredentialsError('Firebase token does not contain an email address');
      }

      user = await userRepository.findByFirebaseUid(decodedToken.uid);
      if (!user) {
        // Fallback: search by email to link accounts
        user = await userRepository.findByEmail(email);
        if (user) {
          // Link account with Firebase UID
          user = await userRepository.update(user.id, { firebaseUid: decodedToken.uid });
        } else {
          throw new UserNotFoundError('No account found matching this SSO email. Please register first.');
        }
      }
    } else if (credentials.email && credentials.password) {
      // Standard Email & Password Login
      user = await userRepository.findByEmail(credentials.email);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      // Check account locking
      if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
        throw new AccountLockedError(`Account is locked until ${user.accountLockedUntil.toISOString()}`);
      }

      // Timing-safe password verification
      const isPasswordValid = await passwordService.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        // Handle failed login attempts
        const maxAttempts = 5;
        const attemptsResult = await userRepository.incrementFailedLogins(user.id, maxAttempts);
        if (attemptsResult.failedLoginAttempts >= maxAttempts) {
          throw new AccountLockedError('Too many failed login attempts. Account is locked for 15 minutes.');
        }
        throw new InvalidCredentialsError();
      }

      // Login success: reset failed attempts
      if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
        await userRepository.resetFailedLogins(user.id);
      }
    } else {
      throw new InvalidCredentialsError('Insufficient login parameters');
    }

    // Check account active status
    if (!user.isActive || user.status !== 'ACTIVE') {
      throw new ForbiddenError('This account has been deactivated or suspended');
    }

    // Prevent login until email is verified
    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedError();
    }

    // Update lastLogin
    await userRepository.update(user.id, { lastLogin: new Date() });

    // Generate tokens
    const tokens = this.generateUserTokens({
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role.name,
      refreshTokenVersion: user.refreshTokenVersion,
    });

    return {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  /**
   * Logout Service
   */
  async logout(userId: number): Promise<void> {
    // Increment refreshTokenVersion to instantly invalidate all refresh tokens for this user
    const user = await userRepository.findById(userId);
    if (user) {
      await userRepository.update(userId, {
        refreshTokenVersion: user.refreshTokenVersion + 1,
      });
    }
  }

  /**
   * Refresh Token Service (with Token Rotation and Theft Detection)
   */
  async refresh(refreshToken: string) {
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      throw new InvalidTokenError('User not found');
    }

    // Theft/Reuse Detection:
    // If the token version matches the DB version, everything is fine.
    // If it does not match (e.g. older token reused), somebody else may have intercepted a token!
    // We instantly revoke all active refresh tokens for safety.
    if (decoded.tokenVersion !== user.refreshTokenVersion) {
      await userRepository.update(user.id, {
        refreshTokenVersion: user.refreshTokenVersion + 1,
      });
      throw new InvalidTokenError('Refresh token reuse detected. Revoking all active sessions for security.');
    }

    // Rotate token version and generate new token pair (Refresh Token Rotation!)
    const nextVersion = user.refreshTokenVersion + 1;
    await userRepository.update(user.id, { refreshTokenVersion: nextVersion });

    const tokens = this.generateUserTokens({
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role.name,
      refreshTokenVersion: nextVersion,
    });

    return tokens;
  }

  /**
   * Verify Token Service
   */
  verifyToken(accessToken: string): TokenPayload {
    return tokenService.verifyAccessToken(accessToken);
  }

  /**
   * Forgot Password Service
   */
  async forgotPassword(email: string): Promise<{ resetLink?: string; resetToken?: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Silent pass to prevent user enumeration security vulnerability
      return {};
    }

    // Generate password reset link via Firebase if they have a firebase account
    if (user.firebaseUid) {
      try {
        const link = await firebaseAdminService.generatePasswordResetLink(email);
        return { resetLink: link };
      } catch (error) {
        console.warn('[AuthService] Firebase password reset link generation failed, falling back to custom JWT');
      }
    }

    // Generate secure local reset token
    // We sign it with a combination of secret + user's passwordChangedAt or password hash,
    // so the token is single-use and automatically invalidated once the password changes!
    const secret = (process.env.JWT_ACCESS_SECRET || 'fallback_secret') + user.password;
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '1h' }
    );

    return { resetToken };
  }

  /**
   * Reset Password Service
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Decode first to find user
    const decoded = jwt.decode(token) as { userId?: number; email?: string } | null;
    if (!decoded || !decoded.userId) {
      throw new InvalidTokenError('Invalid or malformed reset token');
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Verify token using the user-specific dynamic secret
    const secret = (process.env.JWT_ACCESS_SECRET || 'fallback_secret') + user.password;
    try {
      jwt.verify(token, secret);
    } catch (error) {
      throw new InvalidTokenError('Expired or invalid reset token');
    }

    // Hash new password
    const newHash = await passwordService.hash(newPassword);

    // Update user: reset attempts, update passwordChangedAt, increment token version
    await userRepository.update(user.id, {
      password: newHash,
      passwordChangedAt: new Date(),
      refreshTokenVersion: user.refreshTokenVersion + 1, // Revoke all sessions on password change
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    });

    // Also update in Firebase Auth if linked
    if (user.firebaseUid) {
      try {
        await firebaseAdminService.updateUser(user.firebaseUid, {
          password: newPassword,
        });
      } catch (error: any) {
        console.warn('[AuthService] Firebase password update failed:', error.message || error);
      }
    }
  }

  /**
   * Email Verification Service
   */
  async generateEmailVerificationLink(email: string): Promise<string> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }

    // If Firebase linked, generate via Firebase Admin SDK
    if (user.firebaseUid) {
      try {
        return await firebaseAdminService.generateEmailVerificationLink(email);
      } catch (error) {
        console.warn('[AuthService] Firebase verification link generation failed, falling back to local JWT link');
      }
    }

    // Local Verification JWT
    return jwt.sign(
      { userId: user.id, email: user.email, action: 'verify-email' },
      process.env.JWT_ACCESS_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_secret') as { userId?: number; email?: string; action?: string } | null;
      if (!decoded || decoded.action !== 'verify-email' || !decoded.userId) {
        throw new InvalidTokenError('Invalid verification token');
      }

      await userRepository.update(decoded.userId, {
        isEmailVerified: true,
      });

      const user = await userRepository.findById(decoded.userId);
      if (user?.firebaseUid) {
        try {
          await firebaseAdminService.updateUser(user.firebaseUid, {
            emailVerified: true,
          });
        } catch (error: any) {
          console.warn('[AuthService] Firebase emailVerified update failed:', error.message || error);
        }
      }
    } catch (error) {
      throw new InvalidTokenError('Expired or invalid verification token');
    }
  }

  /**
   * Resend Verification Link
   */
  async resendVerification(email: string): Promise<{ verificationLink: string; verificationToken: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundError('No account matches this email address');
    }

    if (user.isEmailVerified) {
      throw new Error('This academic account has already been verified');
    }

    const verificationToken = await this.generateEmailVerificationLink(email);
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const verificationLink = `${appUrl}/verify-email?token=${verificationToken}`;

    console.log(`[Email Verification] Re-sent verification email to ${email}.`);
    console.log(`[Email Verification] Verification link: ${verificationLink}`);

    return { verificationLink, verificationToken };
  }

  /**
   * Helper to generate token pairs
   */
  private generateUserTokens(user: {
    id: number;
    uuid: string;
    email: string;
    role: string;
    refreshTokenVersion: number;
  }) {
    const payload: TokenPayload = {
      userId: user.id,
      userUuid: user.uuid,
      email: user.email,
      role: user.role,
    };

    const accessToken = tokenService.generateAccessToken(payload);
    const refreshToken = tokenService.generateRefreshToken(payload, user.refreshTokenVersion);

    return {
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
export { UserRole, Gender };
