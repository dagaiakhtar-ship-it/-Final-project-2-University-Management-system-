import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, authRateLimiter } from '../middleware/auth.middleware';

const router = Router();

/**
 * Public Authentication Routes
 * Shielded with rate limiting to safeguard against brute-force attacks.
 */
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.post('/resend-verification', authRateLimiter, authController.resendVerification);
router.get('/verify-email', authController.verifyEmail);

/**
 * Authenticated Identity Routes
 * Protected with standard Bearer-Token extraction and verification middleware.
 */
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
export { router as authRouter };
