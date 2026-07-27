/**
 * Custom application error hierarchy for modular and centralized handling.
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid email or password') {
    super(message, 401, 'INVALID_CREDENTIALS');
  }
}

export class UserNotFoundError extends AppError {
  constructor(message: string = 'User not found') {
    super(message, 404, 'USER_NOT_FOUND');
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid authentication token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

export class ExpiredTokenError extends AppError {
  constructor(message: string = 'Authentication token has expired') {
    super(message, 401, 'EXPIRED_TOKEN');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied. Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class AccountLockedError extends AppError {
  constructor(message: string = 'Account is temporarily locked. Please try again later') {
    super(message, 403, 'ACCOUNT_LOCKED');
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message: string = 'Please verify your email address to proceed') {
    super(message, 403, 'EMAIL_NOT_VERIFIED');
  }
}
