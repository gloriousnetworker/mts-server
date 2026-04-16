import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import type { CreateCourseInput, UpdateCourseInput } from './courses.schema.js';

// Transforms Prisma course + instructor relation into the frontend Course shape
function formatCourse(course: any) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    instructor: course.instructor?.name ?? 'Unknown',
    instructorId: course.instructorId,
    price: course.price,
    category: course.category,
    level: course.level,
    duration: course.duration,
    image: course.image,
    curriculum: course.curriculum,
    requirements: course.requirements,
    learningOutcomes: course.learningOutcomes,
    enrolledStudents: course.enrolledStudents,
    rating: course.rating,
    isFeatured: course.isFeatured,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

const includeInstructor = { instructor: { select: { id: true, name: true } } };

// ─── List Courses (public) ───────────────────────────────────
export async function listCourses() {
  const courses = await prisma.course.findMany({
    include: includeInstructor,
    orderBy: { createdAt: 'desc' },
  });
  return courses.map(formatCourse);
}

// ─── Get Single Course (public) ──────────────────────────────
export async function getCourse(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: includeInstructor,
  });

  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  return formatCourse(course);
}

// ─── Create Course (staff/admin) ─────────────────────────────
export async function createCourse(input: CreateCourseInput, instructorId: string) {
  const course = await prisma.course.create({
    data: {
      ...input,
      instructorId,
    },
    include: includeInstructor,
  });

  return formatCourse(course);
}

// ─── Update Course (staff who owns it, or admin) ─────────────
export async function updateCourse(id: string, input: UpdateCourseInput, userId: string, userRole: string) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Course not found');
  }

  // Staff can only update their own courses, admin can update any
  if (userRole === 'staff' && existing.instructorId !== userId) {
    throw ApiError.forbidden('You can only update your own courses');
  }

  const course = await prisma.course.update({
    where: { id },
    data: input,
    include: includeInstructor,
  });

  return formatCourse(course);
}

// ─── Delete Course (admin only) ──────────────────────────────
export async function deleteCourse(id: string) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Course not found');
  }

  await prisma.course.delete({ where: { id } });
}
