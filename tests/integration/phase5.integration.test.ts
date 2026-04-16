import { request, registerUser, getCookieString } from '../helpers.js';
import { prisma } from '../../src/config/database.js';

let staffCookies: string;
let adminCookies: string;
let studentCookies: string;
let studentUserId: string;
let staffUserId: string;
let testCourseId: string;

beforeAll(async () => {
  const { default: bcrypt } = await import('bcrypt');
  const hash = await bcrypt.hash('Password1', 12);

  const staff = await prisma.user.create({
    data: { name: 'P5 Staff', email: `p5staff-${Date.now()}@test.com`, passwordHash: hash, role: 'staff' },
  });
  staffUserId = staff.id;

  const admin = await prisma.user.create({
    data: { name: 'P5 Admin', email: `p5admin-${Date.now()}@test.com`, passwordHash: hash, role: 'admin' },
  });

  const staffLogin = await request.post('/auth/login').send({ email: staff.email, password: 'Password1' });
  staffCookies = getCookieString(staffLogin.headers['set-cookie'] || []);

  const adminLogin = await request.post('/auth/login').send({ email: admin.email, password: 'Password1' });
  adminCookies = getCookieString(adminLogin.headers['set-cookie'] || []);

  const { cookies, user } = await registerUser();
  studentCookies = getCookieString(cookies);
  studentUserId = user.id;

  // Create course + enroll student for certificate tests
  const courseRes = await request.post('/courses').set('Cookie', staffCookies).send({
    title: 'P5 Certificate Course', description: 'Course for certificate tests', price: 50000,
    category: 'Testing', level: 'Beginner', duration: '4 weeks',
  });
  testCourseId = courseRes.body.data.id;
  await request.post('/enrollments').set('Cookie', studentCookies).send({ courseId: testCourseId });
});

afterAll(async () => {
  await prisma.certificate.deleteMany({ where: { studentId: studentUserId } });
  await prisma.enrollment.deleteMany({ where: { studentId: studentUserId } });
  await prisma.blogPost.deleteMany({ where: { author: 'P5 Staff' } });
  await prisma.galleryItem.deleteMany({ where: { title: { contains: 'P5' } } });
  await prisma.course.deleteMany({ where: { instructorId: staffUserId } });
  await prisma.user.deleteMany({ where: { email: { contains: 'p5staff-' } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'p5admin-' } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
  await prisma.$disconnect();
});

// ─── Certificates ────────────────────────────────────────────
describe('Certificates', () => {
  let certNumber: string;

  it('POST /certificates should issue certificate (staff)', async () => {
    const res = await request
      .post('/certificates')
      .set('Cookie', staffCookies)
      .send({ studentId: studentUserId, courseId: testCourseId })
      .expect(201);

    expect(res.body.data.studentName).toBeDefined();
    expect(res.body.data.courseName).toBe('P5 Certificate Course');
    expect(res.body.data.certificateNumber).toMatch(/^MT-\d{4}-\d{6}$/);
    expect(res.body.data.status).toBe('valid');
    certNumber = res.body.data.certificateNumber;
  });

  it('POST /certificates should reject duplicate', async () => {
    await request
      .post('/certificates')
      .set('Cookie', staffCookies)
      .send({ studentId: studentUserId, courseId: testCourseId })
      .expect(409);
  });

  it('GET /certificates/:number/verify should verify by number (public)', async () => {
    const res = await request
      .get(`/certificates/${certNumber}/verify`)
      .expect(200);

    expect(res.body.data.certificateNumber).toBe(certNumber);
    expect(res.body.data.status).toBe('valid');
  });

  it('GET /certificates/:id/verify should return 404 for invalid', async () => {
    await request.get('/certificates/MT-0000-000000/verify').expect(404);
  });

  it('GET /certificates/my should return student certificates', async () => {
    const res = await request
      .get('/certificates/my')
      .set('Cookie', studentCookies)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].certificateNumber).toBe(certNumber);
  });

  it('POST /certificates should reject if not enrolled', async () => {
    // Create another student not enrolled
    const { user: otherStudent } = await registerUser();
    await request
      .post('/certificates')
      .set('Cookie', staffCookies)
      .send({ studentId: otherStudent.id, courseId: testCourseId })
      .expect(400);
  });
});

// ─── Blog ────────────────────────────────────────────────────
describe('Blog', () => {
  it('GET /blog should return empty array initially', async () => {
    const res = await request.get('/blog').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /blog should create post (staff)', async () => {
    const res = await request
      .post('/blog')
      .set('Cookie', staffCookies)
      .send({
        title: 'Test Blog Post',
        content: 'This is a detailed blog post content for testing.',
        excerpt: 'A test blog post excerpt',
        category: 'Tech Updates',
        tags: ['testing', 'nodejs'],
      })
      .expect(201);

    expect(res.body.data.title).toBe('Test Blog Post');
    expect(res.body.data.author).toBe('P5 Staff');
    expect(res.body.data.tags).toContain('testing');
  });

  it('GET /blog should return created posts', async () => {
    const res = await request.get('/blog').expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /blog should reject students', async () => {
    await request
      .post('/blog')
      .set('Cookie', studentCookies)
      .send({ title: 'Nope', content: 'Should not work at all', excerpt: 'No way', category: 'Test' })
      .expect(403);
  });
});

// ─── Gallery ─────────────────────────────────────────────────
describe('Gallery', () => {
  let galleryItemId: string;

  it('GET /gallery should return empty array initially', async () => {
    const res = await request.get('/gallery').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /gallery should add item (staff)', async () => {
    const res = await request
      .post('/gallery')
      .set('Cookie', staffCookies)
      .send({
        title: 'P5 Training Photo',
        category: 'trainings',
        type: 'image',
        url: 'https://example.com/photo.jpg',
      })
      .expect(201);

    expect(res.body.data.title).toBe('P5 Training Photo');
    expect(res.body.data.category).toBe('trainings');
    galleryItemId = res.body.data.id;
  });

  it('GET /gallery should return items', async () => {
    const res = await request.get('/gallery').expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('DELETE /gallery/:id should reject staff (admin only)', async () => {
    await request.delete(`/gallery/${galleryItemId}`).set('Cookie', staffCookies).expect(403);
  });

  it('DELETE /gallery/:id should work for admin', async () => {
    await request.delete(`/gallery/${galleryItemId}`).set('Cookie', adminCookies).expect(200);
  });

  it('DELETE /gallery/:id should 404 after deletion', async () => {
    await request.delete(`/gallery/${galleryItemId}`).set('Cookie', adminCookies).expect(404);
  });
});

// ─── Dashboard Stats ─────────────────────────────────────────
describe('Stats', () => {
  it('GET /stats/dashboard should return stats (admin)', async () => {
    const res = await request
      .get('/stats/dashboard')
      .set('Cookie', adminCookies)
      .expect(200);

    expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(0);
    expect(res.body.data.totalCourses).toBeGreaterThanOrEqual(0);
    expect(res.body.data.totalEnrollments).toBeGreaterThanOrEqual(0);
    expect(res.body.data.totalStaff).toBeGreaterThanOrEqual(0);
    expect(res.body.data.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.body.data.recentEnrollments)).toBe(true);
    expect(Array.isArray(res.body.data.recentPayments)).toBe(true);
  });

  it('GET /stats/dashboard should reject students', async () => {
    await request.get('/stats/dashboard').set('Cookie', studentCookies).expect(403);
  });

  it('GET /stats/dashboard should work for staff', async () => {
    await request.get('/stats/dashboard').set('Cookie', staffCookies).expect(200);
  });
});
