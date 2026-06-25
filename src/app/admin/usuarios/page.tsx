/**
 * Panel de Gestión de Usuarios (Admin)
 * Permite cambiar roles de usuarios
 * Solo accesible para rol ADMIN
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UsersTable from './UsersTable';

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

// Obtener todos los usuarios
async function getUsers() {
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
  return users;
}

export default async function UsuariosPage() {
  const user = await getUser();
  
  // Verificar autenticación
  if (!user) {
    redirect('/login');
  }
  
  // Verificar rol ADMIN
  if (user.role !== 'ADMIN') {
    redirect('/productos');
  }
  
  const users = await getUsers();
  
  // Estadísticas
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    cocina: users.filter(u => u.role === 'COCINA').length,
    clientes: users.filter(u => u.role === 'CLIENTE').length,
  };
  
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
                <a href="/admin/inventario" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  Inventario
                </a>
                <span className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg font-medium">
                  Usuarios
                </span>
                <a href="/cocina" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  Cocina
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Administradores</p>
            <p className="text-2xl font-bold text-orange-500">{stats.admins}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cocina</p>
            <p className="text-2xl font-bold text-blue-500">{stats.cocina}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Clientes</p>
            <p className="text-2xl font-bold text-green-500">{stats.clientes}</p>
          </div>
        </div>

        {/* Info sobre roles */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">Roles disponibles:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>CLIENTE</strong> - Puede comprar productos y ver sus pedidos</li>
            <li><strong>COCINA</strong> - Puede ver y gestionar pedidos en el KDS</li>
            <li><strong>ADMIN</strong> - Acceso completo: inventario, usuarios, cocina</li>
          </ul>
        </div>

        {/* Tabla de usuarios */}
        <UsersTable 
          initialUsers={users} 
          currentUserId={user.userId} 
        />
      </main>
    </div>
  );
}
