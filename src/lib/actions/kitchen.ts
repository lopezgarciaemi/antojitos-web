/**
 * FASE 5: Server Actions para Cocina y Admin
 * Gestión de estados de orden e inventario
 */

'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';

// Obtener usuario actual con validación de rol
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
      email: string;
      rol: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

// Verificar si el usuario tiene rol permitido
function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Obtener órdenes para la cocina (PAGADA o EN_PREPARACION)
 */
export async function getKitchenOrders() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['COCINA', 'ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PAGADA', 'EN_PREPARACION'],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, data: orders };
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return { success: false, error: 'Error al cargar órdenes' };
  }
}

/**
 * Iniciar preparación de una orden
 */
export async function startPreparation(orderId: string) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['COCINA', 'ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'EN_PREPARACION',
        preparedAt: new Date(),
        history: {
          create: {
            status: 'EN_PREPARACION',
            changedBy: user.userId,
            notes: 'Iniciada preparación',
          },
        },
      },
    });

    revalidatePath('/cocina');
    return { success: true, data: order };
  } catch (error) {
    console.error('Error al iniciar preparación:', error);
    return { success: false, error: 'Error al actualizar orden' };
  }
}

/**
 * Marcar orden como lista
 */
export async function finishPreparation(orderId: string) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['COCINA', 'ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'LISTA',
        readyAt: new Date(),
        history: {
          create: {
            status: 'LISTA',
            changedBy: user.userId,
            notes: 'Orden lista para entregar',
          },
        },
      },
    });

    revalidatePath('/cocina');
    return { success: true, data: order };
  } catch (error) {
    console.error('Error al finalizar preparación:', error);
    return { success: false, error: 'Error al actualizar orden' };
  }
}

/**
 * Obtener todos los ingredientes para el inventario
 */
export async function getInventory() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });

    return { success: true, data: ingredients };
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return { success: false, error: 'Error al cargar inventario' };
  }
}

// Schema para reabastecer
const RestockSchema = z.object({
  ingredientId: z.string().min(1),
  amount: z.number().positive('La cantidad debe ser positiva'),
});

/**
 * Reabastecer un ingrediente
 */
export async function restockIngredient(ingredientId: string, amount: number) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  const validation = RestockSchema.safeParse({ ingredientId, amount });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  try {
    const ingredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        stock: {
          increment: amount,
        },
      },
    });

    revalidatePath('/admin/inventario');
    return { success: true, data: ingredient };
  } catch (error) {
    console.error('Error al reabastecer:', error);
    return { success: false, error: 'Error al actualizar stock' };
  }
}

/**
 * Actualizar costo de un ingrediente
 */
export async function updateIngredientCost(ingredientId: string, cost: number) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  if (cost < 0) {
    return { success: false, error: 'El costo no puede ser negativo' };
  }

  try {
    const ingredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { cost },
    });

    revalidatePath('/admin/inventario');
    return { success: true, data: ingredient };
  } catch (error) {
    console.error('Error al actualizar costo:', error);
    return { success: false, error: 'Error al actualizar costo' };
  }
}

// Schema para actualizar ingrediente completo
const UpdateIngredientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  unit: z.enum(['KG', 'LT', 'PIEZA', 'GRAMOS', 'MILILITROS']),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  minStock: z.number().min(0, 'El stock mínimo no puede ser negativo'),
  cost: z.number().min(0, 'El costo no puede ser negativo'),
});

/**
 * Actualizar un ingrediente completo (nombre, unidad, stock, minStock, costo)
 */
export async function updateIngredient(
  ingredientId: string, 
  data: {
    name: string;
    unit: string;
    stock: number;
    minStock: number;
    cost: number;
  }
) {
  console.log('[INVENTORY] Actualizando ingrediente:', ingredientId, data);
  
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['ADMIN'])) {
    console.error('[INVENTORY ERROR] No autorizado');
    return { success: false, error: 'No autorizado' };
  }

  const validation = UpdateIngredientSchema.safeParse(data);
  if (!validation.success) {
    console.error('[INVENTORY ERROR] Validacion fallida:', validation.error.issues);
    return { success: false, error: validation.error.issues[0]?.message };
  }

  try {
    const ingredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        name: validation.data.name,
        unit: validation.data.unit,
        stock: validation.data.stock,
        minStock: validation.data.minStock,
        cost: validation.data.cost,
      },
    });

    console.log('[INVENTORY] Ingrediente actualizado:', ingredient.name);
    revalidatePath('/admin/inventario');
    return { success: true, data: ingredient };
  } catch (error) {
    console.error('[INVENTORY ERROR] Error al actualizar:', error);
    return { success: false, error: 'Error al actualizar ingrediente' };
  }
}

/**
 * Crear un nuevo ingrediente
 */
export async function createIngredient(data: {
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  cost: number;
}) {
  console.log('[INVENTORY] Creando ingrediente:', data);
  
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  const validation = UpdateIngredientSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  try {
    const ingredient = await prisma.ingredient.create({
      data: {
        name: validation.data.name,
        unit: validation.data.unit,
        stock: validation.data.stock,
        minStock: validation.data.minStock,
        cost: validation.data.cost,
      },
    });

    console.log('[INVENTORY] Ingrediente creado:', ingredient.name);
    revalidatePath('/admin/inventario');
    return { success: true, data: ingredient };
  } catch (error) {
    console.error('[INVENTORY ERROR] Error al crear:', error);
    return { success: false, error: 'Error al crear ingrediente' };
  }
}

/**
 * Eliminar un ingrediente
 */
export async function deleteIngredient(ingredientId: string) {
  console.log('[INVENTORY] Eliminando ingrediente:', ingredientId);
  
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    // Verificar si el ingrediente está en uso
    const recipesUsing = await prisma.recipe.count({
      where: { ingredientId },
    });

    if (recipesUsing > 0) {
      return { 
        success: false, 
        error: `Este ingrediente está en uso por ${recipesUsing} receta(s). No se puede eliminar.` 
      };
    }

    await prisma.ingredient.delete({
      where: { id: ingredientId },
    });

    console.log('[INVENTORY] Ingrediente eliminado');
    revalidatePath('/admin/inventario');
    return { success: true };
  } catch (error) {
    console.error('[INVENTORY ERROR] Error al eliminar:', error);
    return { success: false, error: 'Error al eliminar ingrediente' };
  }
}

// ============================================
// GESTIÓN DE USUARIOS (Solo ADMIN)
// ============================================

/**
 * Obtener todos los usuarios (solo ADMIN)
 */
export async function getAllUsers() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('[USERS ERROR] Error al obtener usuarios:', error);
    return { success: false, error: 'Error al obtener usuarios' };
  }
}

/**
 * Cambiar rol de un usuario (solo ADMIN)
 * Los roles válidos son: CLIENTE, ADMIN, COCINA
 */
const updateRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: z.enum(['CLIENTE', 'ADMIN', 'COCINA']),
});

export async function updateUserRole(userId: string, newRole: 'CLIENTE' | 'ADMIN' | 'COCINA') {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.rol, ['ADMIN'])) {
    return { success: false, error: 'No autorizado' };
  }

  // Validar con Zod
  const validation = updateRoleSchema.safeParse({ userId, newRole });
  if (!validation.success) {
    return { success: false, error: 'Rol inválido. Solo se permiten: CLIENTE, ADMIN, COCINA' };
  }

  // No permitir que un admin se quite el rol a sí mismo
  if (userId === user.userId) {
    return { success: false, error: 'No puedes cambiar tu propio rol' };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log('[USERS] Rol actualizado:', updatedUser.email, '->', newRole);
    revalidatePath('/admin/usuarios');
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('[USERS ERROR] Error al actualizar rol:', error);
    return { success: false, error: 'Error al actualizar rol' };
  }
}
