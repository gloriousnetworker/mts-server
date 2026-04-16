import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('error', (e) => {
  logger.error(e, 'Prisma error');
});

export { prisma };
