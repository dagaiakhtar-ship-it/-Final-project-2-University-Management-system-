import jwt from 'jsonwebtoken';
import { ExpiredTokenError, InvalidTokenError } from '../errors/auth.errors';

export interface TokenPayload {
  userId: number;
  userUuid: string;
  email: string;
  role: string;
  tokenVersion?: number;
}

export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'fallback_default_access_secret_long_random_13579';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_default_refresh_secret_long_random_24680';
    this.accessExpiration = process.env.JWT_ACCESS_EXPIRATION || '15m';
    this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';
  }

  /**
   * Generates a new access token for a user.
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        userId: payload.userId,
        userUuid: payload.userUuid,
        email: payload.email,
        role: payload.role,
      },
      this.accessSecret as any,
      { expiresIn: this.accessExpiration as any }
    );
  }

  /**
   * Generates a new refresh token for a user.
   */
  generateRefreshToken(payload: TokenPayload, version: number): string {
    return jwt.sign(
      {
        userId: payload.userId,
        userUuid: payload.userUuid,
        email: payload.email,
        role: payload.role,
        tokenVersion: version,
      },
      this.refreshSecret as any,
      { expiresIn: this.refreshExpiration as any }
    );
  }

  /**
   * Verifies an access token.
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessSecret) as TokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ExpiredTokenError();
      }
      throw new InvalidTokenError();
    }
  }

  /**
   * Verifies a refresh token.
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.refreshSecret) as TokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ExpiredTokenError('Refresh token has expired');
      }
      throw new InvalidTokenError('Invalid refresh token');
    }
  }
}

export const tokenService = new TokenService();
