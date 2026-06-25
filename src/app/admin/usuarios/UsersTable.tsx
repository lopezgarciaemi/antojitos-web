/**
 * Tabla de Usuarios con cambio de roles
 */

'use client';

import { useState } from 'react';
import { updateUserRole } from '@/lib/actions/kitchen';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
}

interface UsersTableProps {
  initialUsers: User[];
  currentUserId: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-orange-100 text-orange-700 border-orange-300',
  COCINA: 'bg-blue-100 text-blue-700 border-blue-300',
  CLIENTE: 'bg-green-100 text-green-700 border-green-300',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COCINA: 'Cocina',
  CLIENTE: 'Cliente',
};

export default function UsersTable({ initialUsers, currentUserId }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRoleChange = async (userId: string, newRole: 'CLIENTE' | 'ADMIN' | 'COCINA') => {
    setLoading(userId);
    setError('');
    setSuccess('');

    const result = await updateUserRole(userId, newRole);

    if (result.success && result.data) {
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setSuccess(`Rol actualizado a ${ROLE_LABELS[newRole]}`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Error al cambiar rol');
    }

    setLoading(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Mensajes */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border-b border-green-200 text-green-600 text-sm">
          {success}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rol Actual
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Registrado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cambiar Rol
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              return (
                <tr key={user.id} className={isCurrentUser ? 'bg-orange-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="font-medium text-gray-800">
                        {user.name || 'Usuario'}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-orange-500">(Tú)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {isCurrentUser ? (
                      <span className="text-xs text-gray-400">No puedes cambiar tu propio rol</span>
                    ) : (
                      <div className="flex gap-1">
                        {(['CLIENTE', 'COCINA', 'ADMIN'] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(user.id, role)}
                            disabled={loading === user.id || user.role === role}
                            className={`px-2 py-1 text-xs rounded transition ${
                              user.role === role
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${loading === user.id ? 'opacity-50' : ''}`}
                          >
                            {loading === user.id ? '...' : role}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No hay usuarios registrados
        </div>
      )}
    </div>
  );
}
