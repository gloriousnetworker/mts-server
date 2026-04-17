import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import type { UpdateStudentInput } from './students.schema.js';

function formatStudent(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    createdAt: user.createdAt,
    enrollments: user.enrollments?.length ?? 0,
  };
}

export async function listStudents() {
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: { enrollments: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return students.map(formatStudent);
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'student') {
    throw ApiError.notFound('Student not found');
  }

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict('Email already in use');
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: input,
    include: { enrollments: { select: { id: true } } },
  });

  return formatStudent(updated);
}

export async function deleteStudent(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'student') {
    throw ApiError.notFound('Student not found');
  }

  await prisma.assignment.deleteMany({ where: { studentId: id } });
  await prisma.certificate.deleteMany({ where: { studentId: id } });
  await prisma.payment.deleteMany({ where: { studentId: id } });
  await prisma.enrollment.deleteMany({ where: { studentId: id } });
  await prisma.user.delete({ where: { id } });
}
