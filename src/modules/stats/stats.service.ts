import { prisma } from '../../config/database.js';

export async function getDashboardStats() {
  const [
    totalStudents,
    totalCourses,
    totalEnrollments,
    totalStaff,
    totalBlogPosts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.user.count({ where: { role: 'staff' } }),
    prisma.blogPost.count(),
  ]);

  let totalRevenue = 0;
  try {
    const revenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'confirmed' },
    });
    totalRevenue = revenueResult._sum.amount ?? 0;
  } catch {
    totalRevenue = 0;
  }

  let recentEnrollments: any[] = [];
  try {
    const enrollments = await prisma.enrollment.findMany({
      take: 5,
      orderBy: { enrolledDate: 'desc' },
      include: {
        student: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });
    recentEnrollments = enrollments.map(e => ({
      id: e.id,
      studentName: e.student.name,
      courseName: e.course.title,
      enrolledDate: e.enrolledDate,
      status: e.status,
    }));
  } catch {}

  let recentPayments: any[] = [];
  try {
    const payments = await prisma.payment.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        student: { select: { name: true } },
        course: { select: { title: true } },
      },
    });
    recentPayments = payments.map(p => ({
      id: p.id,
      studentName: p.student.name,
      courseName: p.course.title,
      amount: p.amount,
      status: p.status,
      date: p.date,
    }));
  } catch {}

  return {
    totalStudents,
    totalCourses,
    totalEnrollments,
    totalStaff,
    totalBlogPosts,
    totalRevenue,
    recentEnrollments,
    recentPayments,
  };
}
