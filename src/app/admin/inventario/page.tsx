/**
 * FASE 5: Panel de Inventario (Admin)
 * Gestión de ingredientes y stock
 * Solo accesible para rol ADMIN
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import InventoryTable from './InventoryTable';

// Verificar autenticación y rol
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

// Obtener todos los ingredientes
async function getIngredients() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: 'asc' },
  });
  return ingredients;
}

// Estadísticas rápidas
async function getStats() {
  const [totalIngredients, lowStock, totalValue] = await Promise.all([
    prisma.ingredient.count(),
    prisma.ingredient.count({
      where: {
        stock: {
          lte: prisma.ingredient.fields.minStock,
        },
      },
    }),
    prisma.ingredient.aggregate({
      _sum: {
        cost: true,
      },
    }),
  ]);

  return {
    totalIngredients,
    lowStock,
    totalValue: totalValue._sum.cost || 0,
  };
}

export default async function InventarioPage() {
  const user = await getUser();
  
  // Verificar autenticación
  if (!user) {
    redirect('/login');
  }
  
  // Verificar rol ADMIN
  if (user.role !== 'ADMIN') {
    redirect('/productos');
  }
  
  const [ingredients, stats] = await Promise.all([
    getIngredients(),
    getStats(),
  ]);

  // Contar ingredientes con stock bajo
  const lowStockCount = ingredients.filter(i => i.stock <= i.minStock).length;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/productos" className="text-gray-500 hover:text-gray-800">
                ← Tienda
              </a>
              <h1 className="text-2xl font-bold text-gray-800">
                Panel Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg font-medium">
                  Inventario
                </span>
                <a href="/admin/usuarios" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  Usuarios
                </a>
                <a href="/cocina" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  Cocina
                </a>
                <a href="/pedidos" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  Mis Pedidos
                </a>
              </nav>
              <span className="px-3 py-1 bg-orange-50 text-orange-500 text-sm rounded-full border border-orange-200">
                Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Ingredientes</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalIngredients}</p>
          </div>
          <div className={`bg-white border rounded-lg p-4 shadow-sm ${
            lowStockCount > 0 ? 'border-red-300' : 'border-gray-200'
          }`}>
            <p className="text-sm text-gray-500">Stock Bajo</p>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {lowStockCount}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Costo Total Inventario</p>
            <p className="text-2xl font-bold text-gray-800">
              ${ingredients.reduce((acc, i) => acc + (i.stock * i.cost), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Alerta de stock bajo */}
        {lowStockCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <p className="text-red-600 font-medium">
                {lowStockCount} ingrediente{lowStockCount > 1 ? 's' : ''} con stock bajo
              </p>
            </div>
          </div>
        )}

        {/* Tabla de inventario */}
        <InventoryTable initialIngredients={ingredients} />
      </main>
    </div>
  );
}
