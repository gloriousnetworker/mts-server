import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import type { EnrollInput } from './enrollments.schema.js';

// Match the frontend Enrollment type shape
function formatEnrollment(enrollment: any) {
  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    enrolledDate: enrollment.enrolledDate,
    progress: enrollment.progress,
    status: enrollment.status,
    course: enrollment.course ? {
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      instructor: enrollment.course.instructor?.name ?? 'Unknown',
      instructorId: enrollment.course.instructorId,
      price: enrollment.course.price,
      category: enrollment.course.category,
      level: enrollment.course.level,
      duration: enrollment.course.duration,
      image: enrollment.course.image,
      curriculum: enrollment.course.curriculum,
      requirements: enrollment.course.requirements,
      learningOutcomes: enrollment.course.learningOutcomes,
      enrolledStudents: enrollment.course.enrolledStudents,
      rating: enrollment.course.rating,
      isFeatured: enrollment.course.isFeatured,
    } : undefined,
  };
}

// ─── Enroll in Course (student) ──────────────────────────────
export async function enroll(studentId: string, input: EnrollInput) {
  // Check course exists
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Check not already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: input.courseId } },
  });
  if (existing) {
    throw ApiError.conflict('Already enrolled in this course');
  }

  // Create enrollment + increment enrolledStudents atomically
  const [enrollment] = await prisma.$transaction([
    prisma.enrollment.create({
      data: {
        studentId,
        courseId: input.courseId,
        status: 'active',
      },
      include: {
        course: { include: { instructor: { select: { id: true, name: true } } } },
      },
    }),
    prisma.course.update({
      where: { id: input.courseId },
      data: { enrolledStudents: { increment: 1 } },
    }),
  ]);

  return formatEnrollment(enrollment);
}

// ─── Get My Enrollments (student) ────────────────────────────
export async function getMyEnrollments(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: { include: { instructor: { select: { id: true, name: true } } } },
    },
    orderBy: { enrolledDate: 'desc' },
  });

  return enrollments.map(formatEnrollment);
}
