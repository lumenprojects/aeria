import { PrismaClient } from '@prisma/client';

// Предотвращаем создание множества экземпляров Prisma Client в режиме разработки
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
