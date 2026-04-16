import crypto from 'crypto';

/**
 * Generates a certificate number in the format MT-YYYY-NNNNNN
 * e.g. MT-2026-004821
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomInt(0, 999999).toString().padStart(6, '0');
  return `MT-${year}-${random}`;
}
