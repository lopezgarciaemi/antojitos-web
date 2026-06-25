/**
 * API Routes para Categoría Individual
 * 
 * GET    /api/categories/[id]  - Obtener categoría por ID
 * PUT    /api/categories/[id]  - Actualizar categoría (solo ADMIN)
 * DELETE /api/categories/[id]  - Eliminar categoría (solo ADMIN)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole } from '@/middleware/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

// Schema de validación para actualizar
const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/categories/[id]
 * Obtiene una categoría específica con sus productos
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            imageUrl: true,
            isAvailable: true,
          },
        },
      },
    });

    if (!category) {
      return errorResponse('Categoría no encontrada', 404);
    }

    return successResponse(category);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/categories/[id]
 * Actualiza una categoría existente (solo ADMIN)
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Autenticar y autorizar
    const user = authenticateRequest(request);
    authorizeRole(user, ['ADMIN']);

    const { id } = await context.params;

    // Validar datos
    const body = await request.json();
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const data = validation.data;

    // Si se actualiza el nombre, verificar que no exista
    if (data.name) {
      const existing = await prisma.category.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
      });

      if (existing) {
        return errorResponse('Ya existe una categoría con ese nombre', 409);
      }
    }

    // Actualizar categoría
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return successResponse(category);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return errorResponse('Categoría no encontrada', 404);
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/categories/[id]
 * Elimina una categoría (solo ADMIN)
 * Nota: Si tiene productos, se debe manejar la eliminación en cascada o prevenir
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Autenticar y autorizar
    const user = authenticateRequest(request);
    authorizeRole(user, ['ADMIN']);

    const { id } = await context.params;

    // Verificar si tiene productos
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return errorResponse('Categoría no encontrada', 404);
    }

    if (category._count.products > 0) {
      return errorResponse(
        `No se puede eliminar la categoría porque tiene ${category._count.products} producto(s) asociado(s)`,
        409
      );
    }

    // Eliminar categoría
    await prisma.category.delete({
      where: { id },
    });

    return successResponse({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    return handleApiError(error);
  }
}
