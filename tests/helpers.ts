import supertest from 'supertest';
import { app } from '../src/app.js';

export const request = supertest(app);

export async function registerUser(overrides = {}) {
  const defaultUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Password1',
    ...overrides,
  };

  const res = await request
    .post('/auth/register')
    .send(defaultUser)
    .expect(201);

  // Extract cookies from response
  const cookies = res.headers['set-cookie'] || [];

  return { res, user: res.body.data.user, cookies, credentials: defaultUser };
}

export async function loginUser(email: string, password: string) {
  const res = await request
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const cookies = res.headers['set-cookie'] || [];
  return { res, user: res.body.data.user, cookies };
}

export function getCookieString(cookies: string[]): string {
  return cookies.map((c: string) => c.split(';')[0]).join('; ');
}
