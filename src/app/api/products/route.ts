/**
 * API Routes para Productos
 * 
 * GET  /api/products  - Listar productos con filtros
 * POST /api/products  - Crear nuevo producto (solo ADMIN)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole } from '@/middleware/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

// Schema de validación para crear producto
const imageUrlSchema = z.string().optional().nullable().refine((value) => {
  if (!value) return true;
  if (/^https?:\/\//.test(value)) return true;
  if (/^[\w-]+\.(png|jpe?g|webp|svg)$/.test(value)) return true;
  if (/^\p{Emoji}+$/u.test(value)) return true;
  return false;
}, 'URL de imagen inválida');

const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  basePrice: z.number().positive('El precio debe ser mayor a 0'),
  imageUrl: imageUrlSchema,
  categoryId: z.string().uuid('ID de categoría inválido'),
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

/**
 * GET /api/products
 * Obtiene productos con filtros opcionales
 * Query params: categoryId, search, includeInactive
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Construir filtros dinámicamente
    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
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
        _count: {
          select: {
            recipes: true,
          },
        },
      },
      orderBy: [
        { category: { order: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Transformar a español para el frontend
    const productsES = products.map((p: any) => ({
      id: p.id,
      nombre: p.name,
      descripcion: p.description || '',
      precioBase: p.basePrice,
      imagen: p.imageUrl || null,
      disponible: p.isAvailable,
      categoria: p.category ? {
        id: p.category.id,
        nombre: p.category.name,
        icono: p.category.imageUrl || '📋',
      } : null,
      optionGroups: p.optionGroups.map((pog: any) => ({
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
    }));

    return successResponse(productsES);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/products
 * Crea un nuevo producto (solo ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar y autorizar
    const user = authenticateRequest(request);
    authorizeRole(user, ['ADMIN']);

    // Validar datos
    const body = await request.json();
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { name, description, basePrice, imageUrl, categoryId, isActive, isAvailable } = validation.data;

    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return errorResponse('La categoría especificada no existe', 404);
    }

    // Crear producto
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        basePrice,
        imageUrl: imageUrl || null,
        categoryId,
        isActive: isActive ?? true,
        isAvailable: isAvailable ?? true,
      },
      include: {
        category: true,
      },
    });

    return successResponse(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
