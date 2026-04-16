import { Request, Response, NextFunction } from 'express';
import * as coursesService from './courses.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function listCourses(_req: Request, res: Response, next: NextFunction) {
  try {
    const courses = await coursesService.listCourses();
    sendSuccess(res, courses);
  } catch (err) {
    next(err);
  }
}

export async function getCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await coursesService.getCourse(req.params.id as string);
    sendSuccess(res, course);
  } catch (err) {
    next(err);
  }
}

export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await coursesService.createCourse(req.body, req.user!.id);
    sendSuccess(res, course, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await coursesService.updateCourse(req.params.id as string, req.body, req.user!.id, req.user!.role);
    sendSuccess(res, course);
  } catch (err) {
    next(err);
  }
}

export async function deleteCourse(req: Request, res: Response, next: NextFunction) {
  try {
    await coursesService.deleteCourse(req.params.id as string);
    sendSuccess(res, { message: 'Course deleted successfully' });
  } catch (err) {
    next(err);
  }
}
