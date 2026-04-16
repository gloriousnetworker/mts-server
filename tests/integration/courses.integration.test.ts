import { request, registerUser, getCookieString } from '../helpers.js';
import { prisma } from '../../src/config/database.js';

let staffCookies: string;
let adminCookies: string;
let studentCookies: string;
let staffUserId: string;
let studentUserId: string;
let testCourseId: string;

beforeAll(async () => {
  // Create staff user directly in DB (register only creates students)
  const staffEmail = `staff-${Date.now()}@test.com`;
  const adminEmail = `admin-${Date.now()}@test.com`;

  const { default: bcrypt } = await import('bcrypt');
  const hash = await bcrypt.hash('Password1', 12);

  const staff = await prisma.user.create({
    data: { name: 'Test Staff', email: staffEmail, passwordHash: hash, role: 'staff' },
  });
  staffUserId = staff.id;

  const admin = await prisma.user.create({
    data: { name: 'Test Admin', email: adminEmail, passwordHash: hash, role: 'admin' },
  });

  // Login as staff
  const staffLogin = await request.post('/auth/login').send({ email: staffEmail, password: 'Password1' });
  staffCookies = getCookieString(staffLogin.headers['set-cookie'] || []);

  // Login as admin
  const adminLogin = await request.post('/auth/login').send({ email: adminEmail, password: 'Password1' });
  adminCookies = getCookieString(adminLogin.headers['set-cookie'] || []);

  // Register a student
  const { cookies, user } = await registerUser();
  studentCookies = getCookieString(cookies);
  studentUserId = user.id;
});

afterAll(async () => {
  // Cleanup
  await prisma.enrollment.deleteMany({ where: { studentId: studentUserId } });
  await prisma.course.deleteMany({ where: { instructorId: staffUserId } });
  await prisma.user.deleteMany({ where: { email: { contains: '-test.com' } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
  await prisma.$disconnect();
});

describe('Courses - Public Endpoints', () => {
  it('GET /courses should return empty array initially', async () => {
    const res = await request.get('/courses').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /courses/:id should return 404 for non-existent', async () => {
    const res = await request.get('/courses/00000000-0000-0000-0000-000000000000').expect(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /courses/:id should return 400 for invalid UUID', async () => {
    const res = await request.get('/courses/not-a-uuid').expect(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Courses - Staff CRUD', () => {
  it('POST /courses should create a course as staff', async () => {
    const res = await request
      .post('/courses')
      .set('Cookie', staffCookies)
      .send({
        title: 'Test Course',
        description: 'A test course for integration tests',
        price: 50000,
        category: 'Testing',
        level: 'Beginner',
        duration: '4 weeks',
        curriculum: ['Module 1', 'Module 2'],
        requirements: ['Basic knowledge'],
        learningOutcomes: ['Learn testing'],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Course');
    expect(res.body.data.instructor).toBe('Test Staff');
    expect(res.body.data.instructorId).toBe(staffUserId);
    expect(res.body.data.enrolledStudents).toBe(0);
    testCourseId = res.body.data.id;
  });

  it('GET /courses should now return the created course', async () => {
    const res = await request.get('/courses').expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const course = res.body.data.find((c: any) => c.id === testCourseId);
    expect(course).toBeDefined();
    expect(course.instructor).toBe('Test Staff');
  });

  it('GET /courses/:id should return course detail', async () => {
    const res = await request.get(`/courses/${testCourseId}`).expect(200);
    expect(res.body.data.id).toBe(testCourseId);
    expect(res.body.data.curriculum).toEqual(['Module 1', 'Module 2']);
  });

  it('PUT /courses/:id should update course as staff owner', async () => {
    const res = await request
      .put(`/courses/${testCourseId}`)
      .set('Cookie', staffCookies)
      .send({ title: 'Updated Course Title', price: 75000 })
      .expect(200);

    expect(res.body.data.title).toBe('Updated Course Title');
    expect(res.body.data.price).toBe(75000);
  });

  it('PUT /courses/:id should allow admin to update any course', async () => {
    const res = await request
      .put(`/courses/${testCourseId}`)
      .set('Cookie', adminCookies)
      .send({ isFeatured: true })
      .expect(200);

    expect(res.body.data.isFeatured).toBe(true);
  });
});

describe('Courses - Authorization', () => {
  it('POST /courses should reject students', async () => {
    const res = await request
      .post('/courses')
      .set('Cookie', studentCookies)
      .send({
        title: 'Student Course',
        description: 'Should not be allowed',
        price: 100,
        category: 'Test',
        level: 'Beginner',
        duration: '1 week',
      })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('POST /courses should reject unauthenticated', async () => {
    await request
      .post('/courses')
      .send({ title: 'No Auth' })
      .expect(401);
  });

  it('DELETE /courses/:id should reject staff (admin only)', async () => {
    await request
      .delete(`/courses/${testCourseId}`)
      .set('Cookie', staffCookies)
      .expect(403);
  });
});

describe('Enrollments', () => {
  it('POST /enrollments should enroll student in course', async () => {
    const res = await request
      .post('/enrollments')
      .set('Cookie', studentCookies)
      .send({ courseId: testCourseId })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.studentId).toBe(studentUserId);
    expect(res.body.data.courseId).toBe(testCourseId);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.progress).toBe(0);
    expect(res.body.data.course).toBeDefined();
    expect(res.body.data.course.title).toBe('Updated Course Title');
  });

  it('POST /enrollments should reject duplicate enrollment', async () => {
    const res = await request
      .post('/enrollments')
      .set('Cookie', studentCookies)
      .send({ courseId: testCourseId })
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should have incremented enrolledStudents count', async () => {
    const res = await request.get(`/courses/${testCourseId}`).expect(200);
    expect(res.body.data.enrolledStudents).toBe(1);
  });

  it('GET /enrollments/my should return student enrollments with course data', async () => {
    const res = await request
      .get('/enrollments/my')
      .set('Cookie', studentCookies)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    const enrollment = res.body.data[0];
    expect(enrollment.course).toBeDefined();
    expect(enrollment.course.id).toBe(testCourseId);
    expect(enrollment.course.instructor).toBe('Test Staff');
  });

  it('GET /enrollments/my should reject staff', async () => {
    await request
      .get('/enrollments/my')
      .set('Cookie', staffCookies)
      .expect(403);
  });

  it('POST /enrollments should reject non-existent course', async () => {
    const res = await request
      .post('/enrollments')
      .set('Cookie', studentCookies)
      .send({ courseId: '00000000-0000-0000-0000-000000000000' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Courses - Admin Delete', () => {
  it('DELETE /courses/:id should delete as admin', async () => {
    // First remove enrollment so FK constraint doesn't block
    await prisma.enrollment.deleteMany({ where: { courseId: testCourseId } });

    const res = await request
      .delete(`/courses/${testCourseId}`)
      .set('Cookie', adminCookies)
      .expect(200);

    expect(res.body.data.message).toContain('deleted');
  });

  it('GET /courses/:id should return 404 after delete', async () => {
    await request.get(`/courses/${testCourseId}`).expect(404);
  });
});
