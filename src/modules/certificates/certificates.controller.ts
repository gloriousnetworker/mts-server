import { Request, Response, NextFunction } from 'express';
import * as certificatesService from './certificates.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function issueCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const certificate = await certificatesService.issueCertificate(req.body);
    sendSuccess(res, certificate, 201);
  } catch (err) {
    next(err);
  }
}

export async function verifyCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const certificate = await certificatesService.verifyCertificate(req.params.id as string);
    sendSuccess(res, certificate);
  } catch (err) {
    next(err);
  }
}

export async function getMyCertificates(req: Request, res: Response, next: NextFunction) {
  try {
    const certificates = await certificatesService.getMyCertificates(req.user!.id);
    sendSuccess(res, certificates);
  } catch (err) {
    next(err);
  }
}

export async function deleteCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    await certificatesService.deleteCertificate(req.params.id as string);
    sendSuccess(res, { message: 'Certificate deleted successfully' });
  } catch (err) {
    next(err);
  }
}
