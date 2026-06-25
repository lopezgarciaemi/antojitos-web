/**
 * FASE 5: KDS (Kitchen Display System)
 * Panel de cocina para gestionar pedidos
 * Solo accesible para roles COCINA y ADMIN
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import KitchenBoard from './KitchenBoard';

// Verificar autenticación y rol en el servidor
async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
      email: string;
      role: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

// Obtener órdenes para la cocina
async function getKitchenOrders() {
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
  
  return orders;
}

export default async function CocinaPage() {
  const user = await getUser();
  
  // Verificar autenticación
  if (!user) {
    redirect('/login');
  }
  
  // Verificar rol
  if (!['COCINA', 'ADMIN'].includes(user.role)) {
    redirect('/productos');
  }
  
  const orders = await getKitchenOrders();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {user.role === 'ADMIN' ? (
              <a href="/admin/inventario" className="text-gray-500 hover:text-gray-800">
                ← Admin
              </a>
            ) : (
              <a href="/productos" className="text-gray-500 hover:text-gray-800">
                ← Tienda
              </a>
            )}
            <h1 className="text-2xl font-bold text-gray-800">
              Cocina
            </h1>
            <span className="px-3 py-1 bg-orange-50 text-orange-500 text-sm rounded-full border border-orange-200">
              KDS
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user.role === 'ADMIN' && (
              <a href="/admin/inventario" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                Inventario
              </a>
            )}
            <span className="text-gray-500 text-sm">
              {user.email}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Conectado" />
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              Sin pedidos pendientes
            </h2>
            <p className="text-gray-500">
              Los pedidos nuevos aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <KitchenBoard initialOrders={orders} />
        )}
      </main>
    </div>
  );
}
