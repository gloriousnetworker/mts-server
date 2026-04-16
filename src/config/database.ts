import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from './logger.js';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  logger.info('Firebase Admin initialized');
}

export const db = admin.firestore();
export const auth = admin.auth();
export { admin };
