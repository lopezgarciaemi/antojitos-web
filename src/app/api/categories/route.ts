/**
 * API Routes para Categorías
 * 
 * GET    /api/categories       - Listar todas las categorías activas
 * POST   /api/categories       - Crear nueva categoría (solo ADMIN)
 * PUT    /api/categories/:id   - Actualizar categoría (solo ADMIN)
 * DELETE /api/categories/:id   - Eliminar categoría (solo ADMIN)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole } from '@/middleware/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

// Schema de validación para crear/actualizar categoría
const imageUrlSchema = z.string().optional().nullable().refine((value) => {
  if (!value) return true;
  if (/^https?:\/\//.test(value)) return true;
  if (/^[\w-]+\.(png|jpe?g|webp|svg)$/.test(value)) return true;
  if (/^\p{Emoji}+$/u.test(value)) return true;
  return false;
}, 'URL de imagen inválida');

const categorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  imageUrl: imageUrlSchema,
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/categories
 * Obtiene todas las categorías activas ordenadas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Transformar a español para el frontend
    const categoriesES = categories.map((cat: any) => ({
      id: cat.id,
      nombre: cat.name,
      descripcion: cat.description || '',
      icono: cat.imageUrl || '📋',
      orden: cat.order,
      activa: cat.isActive,
      _count: cat._count,
    }));

    return successResponse(categoriesES);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/categories
 * Crea una nueva categoría (solo ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar y autorizar
    const user = authenticateRequest(request);
    authorizeRole(user, ['ADMIN']);

    // Validar datos
    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { name, description, imageUrl, order, isActive } = validation.data;

    // Verificar que no exista una categoría con el mismo nombre
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      return errorResponse('Ya existe una categoría con ese nombre', 409);
    }

    // Crear categoría
    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    return successResponse(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
