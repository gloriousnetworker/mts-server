import { Request, Response, NextFunction } from 'express';
import * as assignmentsService from './assignments.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function submitAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentsService.submitAssignment(req.user!.id, req.body);
    sendSuccess(res, assignment, 201);
  } catch (err) {
    next(err);
  }
}

export async function getMyAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const assignments = await assignmentsService.getMyAssignments(req.user!.id);
    sendSuccess(res, assignments);
  } catch (err) {
    next(err);
  }
}
