/**
 * Utilidades para respuestas HTTP consistentes
 */

import { NextResponse } from 'next/server';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Respuesta exitosa
 */
export function successResponse<T>(data: T, status: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(response, { status });
}

/**
 * Respuesta de error
 */
export function errorResponse(error: string, status: number = 400) {
  const response: ApiResponse = {
    success: false,
    error,
  };
  return NextResponse.json(response, { status });
}

/**
 * Manejo centralizado de errores
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Errores conocidos
    if (error.message.includes('Token')) {
      return errorResponse(error.message, 401);
    }
    if (error.message.includes('permisos')) {
      return errorResponse(error.message, 403);
    }
    if (error.message.includes('no encontrado')) {
      return errorResponse(error.message, 404);
    }
    
    return errorResponse(error.message, 400);
  }

  return errorResponse('Error interno del servidor', 500);
}
