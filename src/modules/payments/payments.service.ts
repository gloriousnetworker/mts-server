import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import { env } from '../../config/env.js';
import * as paystack from '../../utils/paystack.js';
import type { InitializePaymentInput, CreatePaymentInput } from './payments.schema.js';

function formatPayment(payment: any) {
  return {
    id: payment.id,
    studentId: payment.studentId,
    courseId: payment.courseId,
    amount: payment.amount,
    date: payment.date,
    status: payment.status,
    method: payment.method,
    reference: payment.reference ?? null,
    currency: payment.currency ?? 'NGN',
    student: payment.student ? { id: payment.student.id, name: payment.student.name, email: payment.student.email } : undefined,
    course: payment.course ? { id: payment.course.id, title: payment.course.title } : undefined,
  };
}

// ─── Initialize Paystack Transaction ─────────────────────────
export async function initializePayment(studentId: string, studentEmail: string, input: InitializePaymentInput) {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw ApiError.badRequest('Paystack is not configured');
  }

  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  const reference = paystack.generateReference();
  const amountInKobo = Math.round(course.price * 100);

  // Create pending payment record
  const payment = await prisma.payment.create({
    data: {
      studentId,
      courseId: input.courseId,
      amount: course.price,
      method: 'paystack',
      reference,
      status: 'pending',
    },
    include: { course: { select: { id: true, title: true } } },
  });

  // Initialize Paystack transaction
  const paystackRes = await paystack.initializeTransaction({
    email: studentEmail,
    amount: amountInKobo,
    reference,
    callbackUrl: input.callbackUrl,
    metadata: {
      paymentId: payment.id,
      courseId: input.courseId,
      studentId,
    },
  });

  if (!paystackRes.status) {
    // Rollback payment record
    await prisma.payment.delete({ where: { id: payment.id } });
    throw ApiError.badRequest(paystackRes.message || 'Failed to initialize Paystack transaction');
  }

  return {
    payment: formatPayment(payment),
    authorizationUrl: paystackRes.data.authorization_url,
    accessCode: paystackRes.data.access_code,
    reference: paystackRes.data.reference,
  };
}

// ─── Verify Paystack Payment ─────────────────────────────────
export async function verifyPayment(reference: string) {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw ApiError.badRequest('Paystack is not configured');
  }

  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  // Already confirmed — no need to re-verify
  if (payment.status === 'confirmed') {
    return formatPayment(payment);
  }

  const paystackRes = await paystack.verifyTransaction(reference);

  if (paystackRes.status && paystackRes.data.status === 'success') {
    const updated = await prisma.payment.update({
      where: { reference },
      data: {
        status: 'confirmed',
        paystackId: String(paystackRes.data.id),
        channel: paystackRes.data.channel,
        method: `paystack-${paystackRes.data.channel}`,
      },
      include: {
        course: { select: { id: true, title: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    return formatPayment(updated);
  }

  if (paystackRes.data?.status === 'failed') {
    await prisma.payment.update({ where: { reference }, data: { status: 'failed' } });
  }

  return { ...formatPayment(payment), paystackStatus: paystackRes.data?.status };
}

// ─── Paystack Webhook Handler ────────────────────────────────
export async function handleWebhook(event: string, data: any) {
  if (event === 'charge.success') {
    const reference = data.reference;
    if (!reference) return;

    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment || payment.status === 'confirmed') return;

    await prisma.payment.update({
      where: { reference },
      data: {
        status: 'confirmed',
        paystackId: String(data.id),
        channel: data.channel,
        method: `paystack-${data.channel}`,
      },
    });
  }
}

// ─── Manual Payment (non-Paystack) ───────────────────────────
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
    include: { course: { select: { id: true, title: true } } },
  });

  return formatPayment(payment);
}

// ─── Get My Payments ─────────────────────────────────────────
export async function getMyPayments(studentId: string) {
  try {
    const payments = await prisma.payment.findMany({
      where: { studentId },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { date: 'desc' },
    });
    return payments.map(formatPayment);
  } catch {
    return [];
  }
}

// ─── Get All Payments (admin) ────────────────────────────────
export async function getAllPayments() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { date: 'desc' },
    });
    return payments.map(formatPayment);
  } catch {
    return [];
  }
}
