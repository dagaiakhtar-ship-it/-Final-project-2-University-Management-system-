import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';

export class AuthController {
  /**
   * Register API: POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedBody = registerSchema.parse(req.body);
      const result = await authService.register({
        email: parsedBody.email,
        password: parsedBody.password,
        firstName: parsedBody.firstName,
        lastName: parsedBody.lastName,
        gender: parsedBody.gender,
        role: parsedBody.role,
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login API: POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedBody = loginSchema.parse(req.body);
      const result = await authService.login(parsedBody);

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout API: POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await authService.logout(req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully from all active sessions',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Token API: POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedBody = refreshTokenSchema.parse(req.body);
      const result = await authService.refresh(parsedBody.refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Tokens refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot Password API: POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedBody = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(parsedBody.email);

      res.status(200).json({
        status: 'success',
        message: 'If an account is associated with this email, a password reset instruction has been generated.',
        data: result, // In development/testing, it returns the link/token for verification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password API: POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedBody = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(parsedBody.token, parsedBody.newPassword);

      res.status(200).json({
        status: 'success',
        message: 'Password reset successfully. Please sign in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Current User API: GET /api/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Email API: GET /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(400).json({ status: 'error', message: 'Verification token is required' });
        return;
      }

      await authService.verifyEmail(token);

      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend Verification API: POST /api/auth/resend-verification
   */
  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = req.body.email as string;
      if (!email) {
        res.status(400).json({ status: 'error', message: 'Email address is required' });
        return;
      }

      const result = await authService.resendVerification(email);

      res.status(200).json({
        status: 'success',
        message: 'A fresh verification email has been dispatched to your inbox.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
