import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import { generateCertificateNumber } from '../../utils/certificate-number.js';
import type { IssueCertificateInput } from './certificates.schema.js';

function formatCertificate(cert: any) {
  return {
    id: cert.id,
    studentId: cert.studentId,
    studentName: cert.studentName,
    courseId: cert.courseId,
    courseName: cert.courseName,
    issueDate: cert.issueDate,
    certificateNumber: cert.certificateNumber,
    status: cert.status,
  };
}

export async function issueCertificate(input: IssueCertificateInput) {
  const student = await prisma.user.findUnique({ where: { id: input.studentId } });
  if (!student || student.role !== 'student') {
    throw ApiError.notFound('Student not found');
  }

  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Check student is enrolled and completed
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: input.studentId, courseId: input.courseId } },
  });
  if (!enrollment) {
    throw ApiError.badRequest('Student is not enrolled in this course');
  }

  // Check not already issued
  const existing = await prisma.certificate.findFirst({
    where: { studentId: input.studentId, courseId: input.courseId, status: 'valid' },
  });
  if (existing) {
    throw ApiError.conflict('Certificate already issued for this student and course');
  }

  // Generate unique certificate number (retry on collision)
  let certificateNumber: string;
  let attempts = 0;
  do {
    certificateNumber = generateCertificateNumber();
    const exists = await prisma.certificate.findUnique({ where: { certificateNumber } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  const certificate = await prisma.certificate.create({
    data: {
      studentId: input.studentId,
      studentName: student.name,
      courseId: input.courseId,
      courseName: course.title,
      certificateNumber,
      status: 'valid',
    },
  });

  return formatCertificate(certificate);
}

export async function verifyCertificate(idOrNumber: string) {
  // Try by certificate number first (MT-YYYY-NNNNNN), then by UUID
  let certificate = await prisma.certificate.findUnique({ where: { certificateNumber: idOrNumber } });

  if (!certificate) {
    certificate = await prisma.certificate.findUnique({ where: { id: idOrNumber } }).catch(() => null);
  }

  if (!certificate) {
    throw ApiError.notFound('Certificate not found');
  }

  return formatCertificate(certificate);
}

export async function getMyCertificates(studentId: string) {
  const certificates = await prisma.certificate.findMany({
    where: { studentId },
    orderBy: { issueDate: 'desc' },
  });
  return certificates.map(formatCertificate);
}
