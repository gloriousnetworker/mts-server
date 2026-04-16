import { Request, Response, NextFunction } from 'express';
import * as galleryService from './gallery.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function listItems(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await galleryService.listItems();
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await galleryService.addItem(req.body);
    sendSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    await galleryService.deleteItem(req.params.id as string);
    sendSuccess(res, { message: 'Gallery item deleted successfully' });
  } catch (err) {
    next(err);
  }
}
