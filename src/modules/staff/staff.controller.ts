import { Request, Response, NextFunction } from 'express';
import * as staffService from './staff.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function listStaff(_req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.listStaff();
    sendSuccess(res, staff);
  } catch (err) {
    next(err);
  }
}

export async function createStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.createStaff(req.body);
    sendSuccess(res, staff, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.updateStaff(req.params.id as string, req.body);
    sendSuccess(res, staff);
  } catch (err) {
    next(err);
  }
}

export async function deleteStaff(req: Request, res: Response, next: NextFunction) {
  try {
    await staffService.deleteStaff(req.params.id as string);
    sendSuccess(res, { message: 'Staff member deleted successfully' });
  } catch (err) {
    next(err);
  }
}
