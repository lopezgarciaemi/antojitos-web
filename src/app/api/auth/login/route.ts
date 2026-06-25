/**
 * POST /api/auth/login
 * 
 * Autentica un usuario existente y devuelve un token JWT
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { generateToken } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

// Schema de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function POST(request: NextRequest) {
  console.log('[API LOGIN] Peticion de login recibida');
  
  try {
    // 1. Parsear y validar el body
    const body = await request.json();
    console.log('[API LOGIN] Email:', body.email);
    
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      console.error('[API LOGIN ERROR] Validacion fallida:', validation.error.issues);
      return errorResponse(
        validation.error.issues[0].message,
        400
      );
    }

    const { email, password } = validation.data;

    // 2. Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('[API LOGIN ERROR] Usuario no encontrado:', email);
      return errorResponse('Credenciales inválidas', 401);
    }
    console.log('[API LOGIN] Usuario encontrado:', { id: user.id, role: user.role });

    // 3. Verificar la contraseña
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      console.error('[API LOGIN ERROR] Contrasena incorrecta para:', email);
      return errorResponse('Credenciales inválidas', 401);
    }
    console.log('[API LOGIN] Contrasena valida');

    // 4. Generar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    console.log('[API LOGIN] Token JWT generado');

    // 5. Respuesta exitosa (sin incluir el password)
    console.log('[API LOGIN] Login exitoso para:', email, 'Rol:', user.role);
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.name,  // Mapear a español
        telefono: user.phone,
        rol: user.role,      // Mapear a español
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('[API LOGIN ERROR]:', error);
    return handleApiError(error);
  }
}
