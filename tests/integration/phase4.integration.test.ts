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
    data: { name: 'P4 Staff', email: `p4staff-${Date.now()}@test.com`, passwordHash: hash, role: 'staff' },
  });
  staffUserId = staff.id;

  await prisma.staffProfile.create({
    data: { userId: staff.id, position: 'Test Instructor', bio: 'Test bio', skills: ['Node.js', 'React'] },
  });

  const admin = await prisma.user.create({
    data: { name: 'P4 Admin', email: `p4admin-${Date.now()}@test.com`, passwordHash: hash, role: 'admin' },
  });

  const staffLogin = await request.post('/auth/login').send({ email: staff.email, password: 'Password1' });
  staffCookies = getCookieString(staffLogin.headers['set-cookie'] || []);

  const adminLogin = await request.post('/auth/login').send({ email: admin.email, password: 'Password1' });
  adminCookies = getCookieString(adminLogin.headers['set-cookie'] || []);

  const { cookies, user } = await registerUser();
  studentCookies = getCookieString(cookies);
  studentUserId = user.id;

  // Create a course for payments/assignments tests
  const courseRes = await request.post('/courses').set('Cookie', staffCookies).send({
    title: 'P4 Test Course', description: 'Course for phase 4 tests', price: 50000,
    category: 'Testing', level: 'Beginner', duration: '4 weeks',
  });
  testCourseId = courseRes.body.data.id;

  // Enroll student so they can submit assignments
  await request.post('/enrollments').set('Cookie', studentCookies).send({ courseId: testCourseId });
});

afterAll(async () => {
  await prisma.assignment.deleteMany({ where: { studentId: studentUserId } });
  await prisma.payment.deleteMany({ where: { studentId: studentUserId } });
  await prisma.enrollment.deleteMany({ where: { studentId: studentUserId } });
  await prisma.course.deleteMany({ where: { instructorId: staffUserId } });
  await prisma.staffProfile.deleteMany({ where: { userId: staffUserId } });
  await prisma.user.deleteMany({ where: { email: { contains: 'p4staff-' } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'p4admin-' } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
  await prisma.$disconnect();
});

// ─── Students ────────────────────────────────────────────────
describe('Students', () => {
  it('GET /students should list students (staff)', async () => {
    const res = await request.get('/students').set('Cookie', staffCookies).expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const student = res.body.data.find((s: any) => s.id === studentUserId);
    expect(student).toBeDefined();
    expect(student.enrollments).toBeGreaterThanOrEqual(0);
  });

  it('GET /students should reject students', async () => {
    await request.get('/students').set('Cookie', studentCookies).expect(403);
  });

  it('PUT /students/:id should update student (admin)', async () => {
    const res = await request
      .put(`/students/${studentUserId}`)
      .set('Cookie', adminCookies)
      .send({ phone: '+2348012345678' })
      .expect(200);
    expect(res.body.data.phone).toBe('+2348012345678');
  });

  it('PUT /students/:id should return 404 for non-student', async () => {
    await request
      .put(`/students/${staffUserId}`)
      .set('Cookie', adminCookies)
      .send({ name: 'Nope' })
      .expect(404);
  });
});

// ─── Staff ───────────────────────────────────────────────────
describe('Staff', () => {
  it('GET /staff should list staff (admin)', async () => {
    const res = await request.get('/staff').set('Cookie', adminCookies).expect(200);
    expect(res.body.success).toBe(true);
    const member = res.body.data.find((s: any) => s.id === staffUserId);
    expect(member).toBeDefined();
    expect(member.position).toBe('Test Instructor');
    expect(member.skills).toContain('Node.js');
  });

  it('GET /staff/public should work without auth', async () => {
    const res = await request.get('/staff/public').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /staff should reject students', async () => {
    await request.get('/staff').set('Cookie', studentCookies).expect(403);
  });

  it('POST /staff should create staff member (admin)', async () => {
    const res = await request
      .post('/staff')
      .set('Cookie', adminCookies)
      .send({
        name: 'New Instructor',
        email: `newinstructor-${Date.now()}@test.com`,
        password: 'Password1',
        position: 'Junior Instructor',
        bio: 'Fresh hire',
        skills: ['JavaScript'],
      })
      .expect(201);

    expect(res.body.data.name).toBe('New Instructor');
    expect(res.body.data.position).toBe('Junior Instructor');
    expect(res.body.data.skills).toContain('JavaScript');
  });

  it('POST /staff should reject duplicate email', async () => {
    const email = `dupstaff-${Date.now()}@test.com`;
    await request.post('/staff').set('Cookie', adminCookies).send({
      name: 'Dup1', email, password: 'Password1', position: 'Test',
    }).expect(201);

    await request.post('/staff').set('Cookie', adminCookies).send({
      name: 'Dup2', email, password: 'Password1', position: 'Test',
    }).expect(409);
  });
});

// ─── Payments ────────────────────────────────────────────────
describe('Payments', () => {
  it('POST /payments should create payment (student)', async () => {
    const res = await request
      .post('/payments')
      .set('Cookie', studentCookies)
      .send({ courseId: testCourseId, amount: 50000, method: 'Bank Transfer' })
      .expect(201);

    expect(res.body.data.studentId).toBe(studentUserId);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.amount).toBe(50000);
    expect(res.body.data.course.title).toBe('P4 Test Course');
  });

  it('GET /payments/my should return student payments', async () => {
    const res = await request.get('/payments/my').set('Cookie', studentCookies).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].method).toBe('Bank Transfer');
  });

  it('GET /payments should return all payments (admin)', async () => {
    const res = await request.get('/payments').set('Cookie', adminCookies).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].student).toBeDefined();
    expect(res.body.data[0].course).toBeDefined();
  });

  it('GET /payments should reject students', async () => {
    await request.get('/payments').set('Cookie', studentCookies).expect(403);
  });

  it('POST /payments should reject staff', async () => {
    await request
      .post('/payments')
      .set('Cookie', staffCookies)
      .send({ courseId: testCourseId, amount: 100, method: 'Card' })
      .expect(403);
  });
});

// ─── Assignments ─────────────────────────────────────────────
describe('Assignments', () => {
  it('POST /assignments should submit assignment (enrolled student)', async () => {
    const res = await request
      .post('/assignments')
      .set('Cookie', studentCookies)
      .send({
        courseId: testCourseId,
        title: 'My First Assignment',
        description: 'Built a REST API',
      })
      .expect(201);

    expect(res.body.data.title).toBe('My First Assignment');
    expect(res.body.data.status).toBe('submitted');
    expect(res.body.data.submittedDate).toBeDefined();
    expect(res.body.data.course.title).toBe('P4 Test Course');
  });

  it('GET /assignments/my should return student assignments', async () => {
    const res = await request.get('/assignments/my').set('Cookie', studentCookies).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].course).toBeDefined();
  });

  it('POST /assignments should reject if not enrolled', async () => {
    // Create another course that the student is NOT enrolled in
    const courseRes = await request.post('/courses').set('Cookie', staffCookies).send({
      title: 'Unenrolled Course', description: 'Student not in this one',
      price: 10000, category: 'Test', level: 'Beginner', duration: '1 week',
    });

    const res = await request
      .post('/assignments')
      .set('Cookie', studentCookies)
      .send({ courseId: courseRes.body.data.id, title: 'Should Fail' })
      .expect(403);

    expect(res.body.error.message).toContain('enrolled');
  });

  it('POST /assignments should reject staff', async () => {
    await request
      .post('/assignments')
      .set('Cookie', staffCookies)
      .send({ courseId: testCourseId, title: 'Nope' })
      .expect(403);
  });
});
