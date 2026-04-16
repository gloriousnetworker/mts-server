import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import type { SubmitAssignmentInput } from './assignments.schema.js';

function formatAssignment(assignment: any) {
  return {
    id: assignment.id,
    courseId: assignment.courseId,
    title: assignment.title,
    description: assignment.description,
    fileUrl: assignment.fileUrl,
    dueDate: assignment.dueDate,
    status: assignment.status,
    grade: assignment.grade,
    submittedDate: assignment.submittedDate,
    course: assignment.course ? { id: assignment.course.id, title: assignment.course.title } : undefined,
  };
}

export async function submitAssignment(studentId: string, input: SubmitAssignmentInput) {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Verify student is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: input.courseId } },
  });
  if (!enrollment) {
    throw ApiError.forbidden('You must be enrolled in this course to submit assignments');
  }

  const assignment = await prisma.assignment.create({
    data: {
      studentId,
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? '',
      fileUrl: input.fileUrl,
      status: 'submitted',
      submittedDate: new Date(),
    },
    include: {
      course: { select: { id: true, title: true } },
    },
  });

  return formatAssignment(assignment);
}

export async function getMyAssignments(studentId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { studentId },
    include: {
      course: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return assignments.map(formatAssignment);
}
