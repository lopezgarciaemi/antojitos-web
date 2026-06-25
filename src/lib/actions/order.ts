/**
 * FASE 4: Motor de Pedidos (Checkout)
 * Server Action con transacciones Prisma y validación de stock
 */

'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Schema de validación
const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  options: z.array(z.object({
    name: z.string(),
    value: z.string(),
    priceModifier: z.number().optional(),
  })).optional(),
  notes: z.string().optional(),
});

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'El carrito está vacío'),
  addressId: z.string().min(1, 'Selecciona una dirección de entrega'),
  paymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']),
  notes: z.string().optional(),
});

type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

interface OrderResult {
  success: boolean;
  data?: {
    orderId: string;
    orderNumber: string;
    total: number;
  };
  error?: string;
  stockErrors?: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }>;
}

// Obtener usuario actual
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

// Generar número de orden único
function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ANT-${dateStr}-${random}`;
}

// Costo de envío
const SHIPPING_COST = 35;
const FREE_SHIPPING_THRESHOLD = 200;

/**
 * Crear pedido con validación de stock y transacción atómica
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  console.log('[ORDER] Iniciando creacion de pedido...');
  
  // Validar autenticación
  const user = await getCurrentUser();
  if (!user) {
    console.error('[ORDER ERROR] Usuario no autenticado');
    return { success: false, error: 'Debes iniciar sesión para realizar un pedido' };
  }
  console.log('[ORDER] Usuario autenticado:', user.email);

  // Verificar que no sea ADMIN (los admins no pueden comprar)
  if (user.rol === 'ADMIN') {
    console.error('[ORDER ERROR] Los administradores no pueden realizar compras');
    return { success: false, error: 'Los administradores no pueden realizar compras. Esta cuenta es solo para gestión.' };
  }

  // Validar input
  const validation = CreateOrderSchema.safeParse(input);
  if (!validation.success) {
    console.error('[ORDER ERROR] Validacion fallida:', validation.error.issues);
    return { 
      success: false, 
      error: validation.error.issues[0]?.message || 'Datos inválidos' 
    };
  }
  console.log('[ORDER] Datos validados:', { items: input.items.length, addressId: input.addressId });

  const { items, addressId, paymentMethod, notes } = validation.data;

  try {
    // Verificar que la dirección pertenece al usuario
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.userId,
      },
    });

    if (!address) {
      return { success: false, error: 'Dirección no encontrada o no te pertenece' };
    }

    // Obtener productos con sus recetas
    const productIds = items.map(item => item.productId);
    type ProductWithRecipes = {
      id: string;
      name: string;
      basePrice: number;
      recipes: {
        ingredientId: string;
        quantity: number;
        ingredient: {
          name: string;
          stock: number;
          unit: string;
        };
      }[];
    };
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
    }) as ProductWithRecipes[];

    // Verificar que todos los productos existen
    if (products.length !== productIds.length) {
      return { success: false, error: 'Algunos productos no existen' };
    }

    // Calcular ingredientes necesarios y verificar stock
    const ingredientRequirements: Map<string, {
      ingredientId: string;
      ingredientName: string;
      required: number;
      available: number;
      unit: string;
    }> = new Map();

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      for (const recipe of product.recipes) {
        const required = recipe.quantity * item.quantity;
        const existing = ingredientRequirements.get(recipe.ingredientId);
        
        if (existing) {
          existing.required += required;
        } else {
          ingredientRequirements.set(recipe.ingredientId, {
            ingredientId: recipe.ingredientId,
            ingredientName: recipe.ingredient.name,
            required,
            available: recipe.ingredient.stock,
            unit: recipe.ingredient.unit,
          });
        }
      }
    }

    // Verificar stock de ingredientes
    const stockErrors: OrderResult['stockErrors'] = [];
    for (const [, requirement] of ingredientRequirements) {
      if (requirement.required > requirement.available) {
        // Buscar qué productos usan este ingrediente
        for (const item of items) {
          const product = products.find(p => p.id === item.productId);
          if (!product) continue;
          
          const usesIngredient = product.recipes.some(
            r => r.ingredientId === requirement.ingredientId
          );
          
          if (usesIngredient) {
            stockErrors.push({
              productId: product.id,
              productName: product.name,
              requested: item.quantity,
              available: Math.floor(requirement.available / (
                product.recipes.find(r => r.ingredientId === requirement.ingredientId)?.quantity || 1
              )),
            });
          }
        }
      }
    }

    if (stockErrors.length > 0) {
      console.error('[ORDER ERROR] Stock insuficiente:', stockErrors);
      return {
        success: false,
        error: 'Stock insuficiente para algunos productos',
        stockErrors,
      };
    }
    console.log('[ORDER] Stock verificado, suficiente para todos los productos');

    // Calcular totales
    let subtotal = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!;
      let itemPrice = product.basePrice;
      
      // Sumar modificadores de opciones
      if (item.options) {
        itemPrice += item.options.reduce((acc, opt) => acc + (opt.priceModifier || 0), 0);
      }
      
      subtotal += itemPrice * item.quantity;
    }

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shippingCost;

    // Crear snapshot de dirección
    const addressSnapshot = JSON.stringify({
      label: address.label,
      street: address.street,
      number: address.number,
      intNumber: address.intNumber,
      colony: address.colony,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phone: address.phone,
      references: address.references,
    });

    // Obtener el último número de orden para generar uno nuevo
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

    // Preparar items de la orden con todos los campos requeridos
    const orderItemsData = items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      let itemPrice = product.basePrice;
      
      if (item.options) {
        itemPrice += item.options.reduce((acc, opt) => acc + (opt.priceModifier || 0), 0);
      }
      
      return {
        productId: product.id,
        productName: product.name,
        productPrice: product.basePrice,
        quantity: item.quantity,
        options: item.options ? JSON.stringify(item.options) : null,
        unitPrice: itemPrice,
        subtotal: itemPrice * item.quantity,
      };
    });

    // TRANSACCIÓN: Crear orden y descontar stock
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Crear la orden (estado PAGADA para que aparezca en cocina)
      const order = await tx.order.create({
        data: {
          orderNumber: nextOrderNumber,
          userId: user.userId,
          type: 'DOMICILIO',
          status: 'PAGADA', // Cambiado de CREADA a PAGADA para que aparezca en cocina
          paymentMethod,
          subtotal,
          shippingCost,
          total,
          addressId,
          deliveryAddress: addressSnapshot,
          customerNotes: notes,
          paidAt: new Date(), // Marcar como pagado
          items: {
            create: orderItemsData,
          },
        },
      });

      // 2. Descontar stock de ingredientes
      for (const [ingredientId, requirement] of ingredientRequirements) {
        await tx.ingredient.update({
          where: { id: ingredientId },
          data: {
            stock: {
              decrement: requirement.required,
            },
          },
        });
      }

      return order;
    });

    console.log('[ORDER] Pedido creado exitosamente:', {
      orderId: result.id,
      orderNumber: result.orderNumber,
      total: result.total
    });

    return {
      success: true,
      data: {
        orderId: result.id,
        orderNumber: `ANT-${result.orderNumber.toString().padStart(6, '0')}`,
        total: result.total,
      },
    };

  } catch (error) {
    console.error('Error al crear pedido:', error);
    return { 
      success: false, 
      error: 'Error al procesar el pedido. Intenta de nuevo.' 
    };
  }
}

/**
 * Obtener pedidos del usuario actual
 */
export async function getUserOrders() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'No autenticado' };
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: orders };
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return { success: false, error: 'Error al cargar pedidos' };
  }
}

/**
 * Obtener detalle de un pedido
 */
export async function getOrderDetail(orderId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'No autenticado' };
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Pedido no encontrado' };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return { success: false, error: 'Error al cargar pedido' };
  }
}
