import { Request, Response, NextFunction } from 'express';
import * as studentsService from './students.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function listStudents(_req: Request, res: Response, next: NextFunction) {
  try {
    const students = await studentsService.listStudents();
    sendSuccess(res, students);
  } catch (err) {
    next(err);
  }
}

export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.updateStudent(req.params.id as string, req.body);
    sendSuccess(res, student);
  } catch (err) {
    next(err);
  }
}
