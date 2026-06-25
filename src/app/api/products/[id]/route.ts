/**
 * API Routes para Producto Individual
 * 
 * GET    /api/products/[id]  - Obtener producto con todas sus relaciones
 * PUT    /api/products/[id]  - Actualizar producto (solo ADMIN)
 * DELETE /api/products/[id]  - Eliminar producto (solo ADMIN)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole } from '@/middleware/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

// Schema de validación para actualizar
const imageUrlSchema = z.string().optional().nullable().refine((value) => {
  if (!value) return true;
  if (/^https?:\/\//.test(value)) return true;
  if (/^[\w-]+\.(png|jpe?g|webp|svg)$/.test(value)) return true;
  if (/^\p{Emoji}+$/u.test(value)) return true;
  return false;
}, 'URL de imagen inválida');

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  basePrice: z.number().positive().optional(),
  imageUrl: imageUrlSchema,
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/products/[id]
 * Obtiene un producto con todas sus relaciones (categoría, opciones, recetas)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true,
          },
        },
        optionGroups: {
          include: {
            optionGroup: {
              include: {
                options: {
                  where: { isAvailable: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return errorResponse('Producto no encontrado', 404);
    }

    // Transformar a español para el frontend
    const productES = {
      id: product.id,
      nombre: product.name,
      descripcion: product.description || '',
      precioBase: product.basePrice,
      imagen: product.imageUrl || null,
      disponible: product.isAvailable,
      categoria: product.category ? {
        id: product.category.id,
        nombre: product.category.name,
        icono: product.category.imageUrl || '📋',
      } : null,
      optionGroups: product.optionGroups.map((pog: any) => ({
        id: pog.optionGroup.id,
        nombre: pog.optionGroup.name,
        obligatorio: pog.isRequired,
        seleccionMultiple: pog.optionGroup.allowMultiple,
        options: pog.optionGroup.options.map((opt: any) => ({
          id: opt.id,
          nombre: opt.name,
          precioAdicional: opt.priceModifier || 0,
        })),
      })),
    };

    return successResponse(productES);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/products/[id]
 * Actualiza un producto existente (solo ADMIN)
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
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const data = validation.data;

    // Si se actualiza la categoría, verificar que existe
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return errorResponse('La categoría especificada no existe', 404);
      }
    }

    // Actualizar producto
    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });

    return successResponse(product);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return errorResponse('Producto no encontrado', 404);
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/products/[id]
 * Elimina un producto (solo ADMIN)
 * Elimina en cascada: recetas, relaciones con option groups
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

    // Verificar si el producto existe y si está en órdenes
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return errorResponse('Producto no encontrado', 404);
    }

    // Si tiene órdenes, mejor marcar como inactivo en lugar de eliminar
    if (product._count.orderItems > 0) {
      return errorResponse(
        'No se puede eliminar el producto porque tiene órdenes asociadas. Considere marcarlo como inactivo.',
        409
      );
    }

    // Eliminar producto (las recetas y relaciones se eliminan en cascada)
    await prisma.product.delete({
      where: { id },
    });

    return successResponse({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    return handleApiError(error);
  }
}
