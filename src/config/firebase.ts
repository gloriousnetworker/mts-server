import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from './logger.js';

let firebaseApp: admin.app.App | null = null;

export function initFirebase() {
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      logger.info('Firebase Admin initialized (push notifications ready)');
    }
  } else {
    logger.info('Firebase credentials not provided — push notifications disabled');
  }
}

export function getFirebaseMessaging() {
  if (!firebaseApp) return null;
  return admin.messaging();
}
