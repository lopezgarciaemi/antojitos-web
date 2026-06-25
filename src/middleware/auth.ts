/**
 * Middleware de autenticación para API Routes de Next.js
 * 
 * Valida el token JWT y agrega la información del usuario
 * a la request para uso posterior
 */

import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/auth';

// Extender el tipo NextRequest para incluir user
declare module 'next/server' {
  interface NextRequest {
    user?: JWTPayload;
  }
}

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

/**
 * Valida el token JWT de la request
 * @throws Error si no hay token o es inválido
 */
export function authenticateRequest(request: NextRequest): JWTPayload {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    throw new Error('Token de autenticación requerido');
  }

  try {
    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Token inválido');
  }
}

/**
 * Verifica que el usuario tenga el rol requerido
 */
export function authorizeRole(user: JWTPayload, allowedRoles: string[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error('No tienes permisos para realizar esta acción');
  }
}
