import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import type { CreatePaymentInput } from './payments.schema.js';

function formatPayment(payment: any) {
  return {
    id: payment.id,
    studentId: payment.studentId,
    courseId: payment.courseId,
    amount: payment.amount,
    date: payment.date,
    status: payment.status,
    method: payment.method,
    student: payment.student ? { id: payment.student.id, name: payment.student.name, email: payment.student.email } : undefined,
    course: payment.course ? { id: payment.course.id, title: payment.course.title } : undefined,
  };
}

export async function createPayment(studentId: string, input: CreatePaymentInput) {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  const payment = await prisma.payment.create({
    data: {
      studentId,
      courseId: input.courseId,
      amount: input.amount,
      method: input.method,
      status: 'pending',
    },
    include: {
      course: { select: { id: true, title: true } },
    },
  });

  return formatPayment(payment);
}

export async function getMyPayments(studentId: string) {
  const payments = await prisma.payment.findMany({
    where: { studentId },
    include: {
      course: { select: { id: true, title: true } },
    },
    orderBy: { date: 'desc' },
  });
  return payments.map(formatPayment);
}

export async function getAllPayments() {
  const payments = await prisma.payment.findMany({
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
    orderBy: { date: 'desc' },
  });
  return payments.map(formatPayment);
}
