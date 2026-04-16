import { request, registerUser, loginUser, getCookieString } from '../helpers.js';
import { prisma } from '../../src/config/database.js';

afterAll(async () => {
  // Clean up test users
  await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
  await prisma.$disconnect();
});

describe('Auth - Registration', () => {
  it('should register a new user and set cookies', async () => {
    const { res, user, cookies } = await registerUser();

    expect(res.body.success).toBe(true);
    expect(user.email).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.role).toBe('student');
    expect(user.twoFactorEnabled).toBe(false);

    // Should have httpOnly cookies
    expect(cookies.length).toBeGreaterThan(0);
    const cookieStr = cookies.join('; ');
    expect(cookieStr).toContain('access_token');
    expect(cookieStr).toContain('refresh_token');
    expect(cookieStr).toContain('HttpOnly');
  });

  it('should reject duplicate email', async () => {
    const email = `dup-${Date.now()}@example.com`;
    await registerUser({ email });

    const res = await request
      .post('/auth/register')
      .send({ name: 'Dup User', email, password: 'Password1' })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should reject weak password', async () => {
    const res = await request
      .post('/auth/register')
      .send({ name: 'Weak', email: `weak-${Date.now()}@example.com`, password: 'short' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid email', async () => {
    const res = await request
      .post('/auth/register')
      .send({ name: 'Bad', email: 'not-an-email', password: 'Password1' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe('Auth - Login', () => {
  let testEmail: string;
  const testPassword = 'Password1';

  beforeAll(async () => {
    const { credentials } = await registerUser();
    testEmail = credentials.email;
  });

  it('should login with valid credentials and set cookies', async () => {
    const { res, user, cookies } = await loginUser(testEmail, testPassword);

    expect(res.body.success).toBe(true);
    expect(user.email).toBe(testEmail);
    expect(cookies.length).toBeGreaterThan(0);
  });

  it('should reject wrong password', async () => {
    const res = await request
      .post('/auth/login')
      .send({ email: testEmail, password: 'WrongPassword1' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should reject non-existent email', async () => {
    const res = await request
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('Auth - Me (Protected)', () => {
  it('should return user when authenticated via cookie', async () => {
    const { cookies } = await registerUser();
    const cookieStr = getCookieString(cookies);

    const res = await request
      .get('/auth/me')
      .set('Cookie', cookieStr)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBeDefined();
    expect(res.body.data.user.role).toBe('student');
  });

  it('should reject request with no token', async () => {
    const res = await request
      .get('/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Auth - Refresh Token', () => {
  it('should refresh tokens using cookie', async () => {
    const { cookies } = await registerUser();
    const cookieStr = getCookieString(cookies);

    const res = await request
      .post('/auth/refresh')
      .set('Cookie', cookieStr)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();

    // Should have new cookies
    const newCookies = res.headers['set-cookie'] || [];
    expect(newCookies.length).toBeGreaterThan(0);
  });

  it('should reject refresh with no token', async () => {
    const res = await request
      .post('/auth/refresh')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('Auth - Logout', () => {
  it('should clear cookies and invalidate refresh token', async () => {
    const { cookies } = await registerUser();
    const cookieStr = getCookieString(cookies);

    const res = await request
      .post('/auth/logout')
      .set('Cookie', cookieStr)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Cookies should be cleared
    const clearedCookies = (res.headers['set-cookie'] || []).join('; ');
    expect(clearedCookies).toContain('access_token=;');
    expect(clearedCookies).toContain('refresh_token=;');
  });
});

describe('Auth - Change Password', () => {
  it('should change password with correct current password', async () => {
    const { cookies, credentials } = await registerUser();
    const cookieStr = getCookieString(cookies);

    const res = await request
      .post('/auth/change-password')
      .set('Cookie', cookieStr)
      .send({ currentPassword: credentials.password, newPassword: 'NewPassword2' })
      .expect(200);

    expect(res.body.success).toBe(true);

    // Should be able to login with new password
    await request
      .post('/auth/login')
      .send({ email: credentials.email, password: 'NewPassword2' })
      .expect(200);
  });

  it('should reject wrong current password', async () => {
    const { cookies } = await registerUser();
    const cookieStr = getCookieString(cookies);

    const res = await request
      .post('/auth/change-password')
      .set('Cookie', cookieStr)
      .send({ currentPassword: 'WrongPassword1', newPassword: 'NewPassword2' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('Auth - Forgot / Reset Password', () => {
  it('should generate reset token and reset password', async () => {
    const { credentials } = await registerUser();

    // Request reset token
    const forgotRes = await request
      .post('/auth/forgot-password')
      .send({ email: credentials.email })
      .expect(200);

    expect(forgotRes.body.success).toBe(true);
    const resetToken = forgotRes.body.data.resetToken; // available in dev mode
    expect(resetToken).toBeDefined();

    // Reset password
    const resetRes = await request
      .post('/auth/reset-password')
      .send({ token: resetToken, password: 'ResetPassword3' })
      .expect(200);

    expect(resetRes.body.success).toBe(true);

    // Login with new password
    await request
      .post('/auth/login')
      .send({ email: credentials.email, password: 'ResetPassword3' })
      .expect(200);
  });

  it('should not reveal if email exists', async () => {
    const res = await request
      .post('/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('If the email exists');
  });

  it('should reject invalid reset token', async () => {
    const res = await request
      .post('/auth/reset-password')
      .send({ token: 'invalid-token', password: 'NewPassword1' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe('Auth - 2FA Setup Flow', () => {
  it('should setup, enable, and require 2FA on login', async () => {
    const { cookies, credentials } = await registerUser();
    const cookieStr = getCookieString(cookies);

    // Step 1: Setup 2FA
    const setupRes = await request
      .post('/auth/2fa/setup')
      .set('Cookie', cookieStr)
      .expect(200);

    expect(setupRes.body.data.secret).toBeDefined();
    expect(setupRes.body.data.qrCode).toContain('data:image/png;base64');

    // Step 2: Generate a valid TOTP code using the secret
    const { TOTP, Secret } = await import('otpauth');
    const totp = new TOTP({
      issuer: 'MegaTech Solutions',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(setupRes.body.data.secret),
    });
    const validCode = totp.generate();

    // Step 3: Enable 2FA
    const enableRes = await request
      .post('/auth/2fa/enable')
      .set('Cookie', cookieStr)
      .send({ code: validCode })
      .expect(200);

    expect(enableRes.body.data.message).toContain('enabled');

    // Step 4: Login should now require 2FA
    const loginRes = await request
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    expect(loginRes.body.data.requiresTwoFactor).toBe(true);

    // Step 5: Complete login with 2FA code
    const newCode = totp.generate();
    const twoFaLoginRes = await request
      .post('/auth/login/2fa')
      .send({ email: credentials.email, password: credentials.password, twoFactorCode: newCode })
      .expect(200);

    expect(twoFaLoginRes.body.data.user.email).toBe(credentials.email);
    expect(twoFaLoginRes.headers['set-cookie']).toBeDefined();

    // Step 6: Disable 2FA
    const finalCode = totp.generate();
    const twoFaCookies = getCookieString(twoFaLoginRes.headers['set-cookie'] || []);
    const disableRes = await request
      .post('/auth/2fa/disable')
      .set('Cookie', twoFaCookies)
      .send({ code: finalCode })
      .expect(200);

    expect(disableRes.body.data.message).toContain('disabled');
  });
});
