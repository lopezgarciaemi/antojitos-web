/**
 * Server Actions para gestión de Direcciones
 * FASE 2: Gestión de Usuario y Direcciones
 */

'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { cookies } from 'next/headers';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const addressSchema = z.object({
  label: z.string().min(1, 'Etiqueta requerida').max(50),
  street: z.string().min(3, 'Calle requerida').max(200),
  number: z.string().min(1, 'Número requerido').max(20),
  intNumber: z.string().max(20).optional(),
  colony: z.string().min(2, 'Colonia requerida').max(100),
  city: z.string().min(2, 'Ciudad requerida').max(100),
  state: z.string().min(2, 'Estado requerido').max(100),
  zipCode: z.string().regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos'),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos'),
  references: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});

type AddressInput = z.infer<typeof addressSchema>;

// ============================================
// HELPERS
// ============================================

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const payload = verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Obtener todas las direcciones del usuario actual
 */
export async function getUserAddresses() {
  console.log('[ADDRESS] Obteniendo direcciones del usuario...');
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('[ADDRESS ERROR] Usuario no autenticado');
      return { success: false, error: 'No autorizado' };
    }
    console.log('[ADDRESS] Usuario:', user.email);
    
    const addresses = await prisma.address.findMany({
      where: { userId: user.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
    });
    
    console.log('[ADDRESS] Direcciones encontradas:', addresses.length);
    return { success: true, data: addresses };
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    return { success: false, error: 'Error al obtener direcciones' };
  }
}

/**
 * Obtener una dirección específica
 */
export async function getAddress(addressId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }
    
    const address = await prisma.address.findFirst({
      where: { 
        id: addressId,
        userId: user.userId // Solo puede ver sus propias direcciones
      },
    });
    
    if (!address) {
      return { success: false, error: 'Dirección no encontrada' };
    }
    
    return { success: true, data: address };
  } catch (error) {
    console.error('Error al obtener dirección:', error);
    return { success: false, error: 'Error al obtener dirección' };
  }
}

/**
 * Agregar nueva dirección
 */
export async function addAddress(data: AddressInput) {
  console.log('[ADDRESS] Agregando nueva direccion...');
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('[ADDRESS ERROR] Usuario no autenticado');
      return { success: false, error: 'No autorizado' };
    }
    console.log('[ADDRESS] Usuario:', user.email);
    
    // Validar datos
    const validation = addressSchema.safeParse(data);
    if (!validation.success) {
      console.error('[ADDRESS ERROR] Validacion fallida:', validation.error.issues);
      return { 
        success: false, 
        error: validation.error.issues[0].message 
      };
    }
    console.log('[ADDRESS] Datos validados:', { label: data.label, street: data.street });
    
    const validData = validation.data;
    
    // Si es default, quitar default de las demás
    if (validData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.userId },
        data: { isDefault: false },
      });
    }
    
    // Crear dirección
    const address = await prisma.address.create({
      data: {
        userId: user.userId,
        label: validData.label,
        street: validData.street,
        number: validData.number,
        intNumber: validData.intNumber || null,
        colony: validData.colony,
        city: validData.city,
        state: validData.state,
        zipCode: validData.zipCode,
        phone: validData.phone,
        references: validData.references || null,
        isDefault: validData.isDefault || false,
      },
    });
    
    return { success: true, data: address };
  } catch (error) {
    console.error('Error al crear dirección:', error);
    return { success: false, error: 'Error al crear dirección' };
  }
}

/**
 * Actualizar dirección existente
 */
export async function updateAddress(addressId: string, data: Partial<AddressInput>) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }
    
    // Verificar que la dirección pertenece al usuario
    const existingAddress = await prisma.address.findFirst({
      where: { 
        id: addressId,
        userId: user.userId
      },
    });
    
    if (!existingAddress) {
      return { success: false, error: 'Dirección no encontrada' };
    }
    
    // Si se marca como default, quitar default de las demás
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: user.userId,
          id: { not: addressId }
        },
        data: { isDefault: false },
      });
    }
    
    // Actualizar dirección
    const address = await prisma.address.update({
      where: { id: addressId },
      data: {
        ...(data.label && { label: data.label }),
        ...(data.street && { street: data.street }),
        ...(data.number && { number: data.number }),
        ...(data.intNumber !== undefined && { intNumber: data.intNumber || null }),
        ...(data.colony && { colony: data.colony }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.zipCode && { zipCode: data.zipCode }),
        ...(data.phone && { phone: data.phone }),
        ...(data.references !== undefined && { references: data.references || null }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });
    
    return { success: true, data: address };
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    return { success: false, error: 'Error al actualizar dirección' };
  }
}

/**
 * Eliminar dirección
 */
export async function deleteAddress(addressId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }
    
    // Verificar que la dirección pertenece al usuario
    const existingAddress = await prisma.address.findFirst({
      where: { 
        id: addressId,
        userId: user.userId
      },
    });
    
    if (!existingAddress) {
      return { success: false, error: 'Dirección no encontrada' };
    }
    
    // Eliminar dirección
    await prisma.address.delete({
      where: { id: addressId },
    });
    
    // Si era default, hacer otra default
    if (existingAddress.isDefault) {
      const firstAddress = await prisma.address.findFirst({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
      });
      
      if (firstAddress) {
        await prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    return { success: false, error: 'Error al eliminar dirección' };
  }
}

/**
 * Marcar dirección como default
 */
export async function setDefaultAddress(addressId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }
    
    // Verificar que la dirección pertenece al usuario
    const existingAddress = await prisma.address.findFirst({
      where: { 
        id: addressId,
        userId: user.userId
      },
    });
    
    if (!existingAddress) {
      return { success: false, error: 'Dirección no encontrada' };
    }
    
    // Quitar default de todas
    await prisma.address.updateMany({
      where: { userId: user.userId },
      data: { isDefault: false },
    });
    
    // Marcar esta como default
    const address = await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
    
    return { success: true, data: address };
  } catch (error) {
    console.error('Error al establecer dirección predeterminada:', error);
    return { success: false, error: 'Error al establecer dirección predeterminada' };
  }
}
