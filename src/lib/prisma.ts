/**
 * Cliente de Prisma con patrón Singleton
 * 
 * En desarrollo, Next.js reinicia el servidor frecuentemente (hot reload)
 * lo que puede crear múltiples instancias de PrismaClient y agotar las conexiones.
 * Este patrón asegura que solo haya una instancia global.
 */

import { PrismaClient } from '@prisma/client';

// Declaración global para TypeScript
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Crear instancia de Prisma o reutilizar la existente
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// En desarrollo, guardar la instancia en global para reutilizarla
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
