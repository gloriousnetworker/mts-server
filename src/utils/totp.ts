import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const ISSUER = 'MegaTech Solutions';

export function generateTOTPSecret(email: string) {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // delta allows 1 period window (30 seconds before/after)
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export async function generateQRCode(uri: string): Promise<string> {
  return QRCode.toDataURL(uri);
}
