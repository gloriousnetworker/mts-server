import { Request, Response, NextFunction } from 'express';
import * as enrollmentsService from './enrollments.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function enroll(req: Request, res: Response, next: NextFunction) {
  try {
    const enrollment = await enrollmentsService.enroll(req.user!.id, req.body);
    sendSuccess(res, enrollment, 201);
  } catch (err) {
    next(err);
  }
}

export async function getMyEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const enrollments = await enrollmentsService.getMyEnrollments(req.user!.id);
    sendSuccess(res, enrollments);
  } catch (err) {
    next(err);
  }
}
