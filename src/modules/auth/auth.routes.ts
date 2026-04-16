import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rate-limiter.js';
import {
  registerSchema,
  loginSchema,
  verifyLoginTwoFactorSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  enableTwoFactorSchema,
  disableTwoFactorSchema,
  changePasswordSchema,
} from './auth.schema.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: "Must contain uppercase, lowercase, and number"
 *                 example: Password1
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *     responses:
 *       201:
 *         description: Account created. Auth cookies set.
 *         headers:
 *           Set-Cookie:
 *             description: "access_token and refresh_token httpOnly cookies"
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     description: |
 *       If 2FA is not enabled, returns user data and sets auth cookies.
 *       If 2FA is enabled, returns `requiresTwoFactor: true` — then call `/auth/login/2fa`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password1
 *     responses:
 *       200:
 *         description: Login successful or 2FA required
 *         headers:
 *           Set-Cookie:
 *             description: "access_token and refresh_token httpOnly cookies (only if 2FA not required)"
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         requiresTwoFactor:
 *                           type: boolean
 *                           example: true
 *                         message:
 *                           type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/login/2fa:
 *   post:
 *     summary: Complete login with 2FA code
 *     tags: [Auth]
 *     description: Called after `/auth/login` returns `requiresTwoFactor: true`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, twoFactorCode]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               twoFactorCode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful. Auth cookies set.
 *       401:
 *         description: Invalid credentials or 2FA code
 */
router.post('/login/2fa', authLimiter, validate(verifyLoginTwoFactorSchema), authController.verifyLoginTwoFactor);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Auth]
 *     description: Uses the refresh_token cookie. Can also accept refreshToken in body as fallback.
 *     responses:
 *       200:
 *         description: New tokens issued. Auth cookies updated.
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', authController.refreshToken);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset token
 *     tags: [Auth]
 *     description: In dev mode, the reset token is returned in the response. In production, it would be sent via email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset instructions sent (always succeeds to prevent email enumeration)
 */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully. All sessions invalidated.
 *       400:
 *         description: Invalid or expired reset token
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout and clear auth cookies
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out. Cookies cleared. Refresh token invalidated.
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change password (requires current password)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password incorrect
 */
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

/**
 * @openapi
 * /auth/2fa/setup:
 *   post:
 *     summary: Generate 2FA secret and QR code
 *     tags: [2FA]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Returns a TOTP secret and a QR code data URL. User scans the QR with an authenticator app, then calls `/auth/2fa/enable` with the code.
 *     responses:
 *       200:
 *         description: QR code and secret returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     secret:
 *                       type: string
 *                       description: Base32 TOTP secret (manual entry backup)
 *                     qrCode:
 *                       type: string
 *                       description: Data URL of the QR code image
 *       400:
 *         description: 2FA already enabled
 */
router.post('/2fa/setup', authenticate, authController.setupTwoFactor);

/**
 * @openapi
 * /auth/2fa/enable:
 *   post:
 *     summary: Enable 2FA by verifying a TOTP code
 *     tags: [2FA]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Must call `/auth/2fa/setup` first. Verifies the user scanned the QR correctly.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Invalid code or setup not called first
 */
router.post('/2fa/enable', authenticate, validate(enableTwoFactorSchema), authController.enableTwoFactor);

/**
 * @openapi
 * /auth/2fa/disable:
 *   post:
 *     summary: Disable 2FA (requires valid TOTP code)
 *     tags: [2FA]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: 2FA disabled
 *       401:
 *         description: Invalid 2FA code
 */
router.post('/2fa/disable', authenticate, validate(disableTwoFactorSchema), authController.disableTwoFactor);

export default router;
