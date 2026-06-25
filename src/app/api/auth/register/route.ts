/**
 * POST /api/auth/register
 * 
 * Registra un nuevo usuario en el sistema
 * Por defecto, los usuarios nuevos tienen rol CLIENTE
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { generateToken } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

// Schema de validación con Zod
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.issues[0].message,
        400
      );
    }

    const { email, nombre, telefono, password } = validation.data;

    // 2. Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse('El email ya está registrado', 409);
    }

    // 3. Hashear la contraseña
    const hashedPassword = await hashPassword(password);

    // 4. Crear el usuario
    const user = await prisma.user.create({
      data: {
        email,
        name: nombre,
        phone: telefono || null,
        password: hashedPassword,
        role: 'CLIENTE', // Rol por defecto
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // 5. Generar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. Respuesta exitosa
    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          nombre: user.name,   // Mapear a español
          telefono: user.phone,
          rol: user.role,       // Mapear a español
          createdAt: user.createdAt,
        },
        token,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
