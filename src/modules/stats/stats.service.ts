import { prisma } from '../../config/database.js';

export async function getDashboardStats() {
  const [
    totalStudents,
    totalCourses,
    totalEnrollments,
    totalStaff,
    totalBlogPosts,
    revenueResult,
    recentEnrollments,
    recentPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.user.count({ where: { role: 'staff' } }),
    prisma.blogPost.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'confirmed' },
    }),
    prisma.enrollment.findMany({
      take: 5,
      orderBy: { enrolledDate: 'desc' },
      include: {
        student: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        student: { select: { name: true } },
        course: { select: { title: true } },
      },
    }),
  ]);

  return {
    totalStudents,
    totalCourses,
    totalEnrollments,
    totalStaff,
    totalBlogPosts,
    totalRevenue: revenueResult._sum.amount ?? 0,
    recentEnrollments: recentEnrollments.map(e => ({
      id: e.id,
      studentName: e.student.name,
      courseName: e.course.title,
      enrolledDate: e.enrolledDate,
      status: e.status,
    })),
    recentPayments: recentPayments.map(p => ({
      id: p.id,
      studentName: p.student.name,
      courseName: p.course.title,
      amount: p.amount,
      status: p.status,
      date: p.date,
    })),
  };
}
