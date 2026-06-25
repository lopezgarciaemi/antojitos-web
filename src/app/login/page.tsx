'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[LOGIN] Iniciando login...', { email: formData.email });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('[LOGIN] Respuesta del servidor:', { status: response.status, data });

      if (!response.ok) {
        console.error('[LOGIN ERROR]', data.error);
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      // Guardar token y usuario en localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      console.log('[LOGIN] Token guardado en localStorage');
      
      // Guardar token en cookie para Server Actions
      document.cookie = `token=${data.data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      console.log('[LOGIN] Token guardado en cookie');
      
      // Redirigir según el rol del usuario
      const userRole = data.data.user.rol;
      console.log('[LOGIN] Rol del usuario:', userRole);
      
      if (userRole === 'ADMIN') {
        console.log('[LOGIN] Redirigiendo a /admin/inventario');
        router.push('/admin/inventario');
      } else if (userRole === 'COCINA') {
        console.log('[LOGIN] Redirigiendo a /cocina');
        router.push('/cocina');
      } else {
        console.log('[LOGIN] Redirigiendo a /productos');
        router.push('/productos');
      }
    } catch (err) {
      console.error('[LOGIN ERROR] Conexión:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setFormData({ email: 'admin@antojitos.com', password: 'admin123' });
  };

  const fillCliente = () => {
    setFormData({ email: 'cliente@test.com', password: 'cliente123' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Los Antojitos de Misha</h2>
          <p className="text-gray-500 mt-2">Iniciar Sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3 text-center">Credenciales de prueba:</p>
          <div className="flex gap-2">
            <button
              onClick={fillAdmin}
              className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-orange-500 py-2 rounded-lg text-sm font-medium transition"
            >
              Admin
            </button>
            <button
              onClick={fillCliente}
              className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-orange-500 py-2 rounded-lg text-sm font-medium transition"
            >
              Cliente
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <a href="/registro" className="text-sm text-orange-500 hover:text-orange-600">
            ¿No tienes cuenta? Regístrate
          </a>
        </div>
      </div>
    </div>
  );
}
