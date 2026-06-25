'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-orange-500 mb-4">
            Los Antojitos de Misha
          </h1>
          <p className="text-2xl text-gray-700 mb-2">
            Sistema de Gestión de Pedidos
          </p>
          <p className="text-gray-500">
            Bienvenido. Explora nuestro menú de antojitos mexicanos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push('/productos')}
            className="bg-white hover:bg-gray-50 rounded-xl border border-gray-200 p-8 transition shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ver Menú</h2>
            <p className="text-gray-500">Explora nuestros antojitos y bebidas</p>
          </button>

          <button
            onClick={() => router.push('/login')}
            className="bg-white hover:bg-gray-50 rounded-xl border border-gray-200 p-8 transition shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-500">Accede a tu cuenta o regístrate</p>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Sistema Funcionando
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm font-bold text-orange-500">Autenticación JWT</p>
              <p className="text-xs text-gray-500">Seguridad implementada</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm font-bold text-orange-500">API REST</p>
              <p className="text-xs text-gray-500">Endpoints documentados</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm font-bold text-orange-500">Base de Datos</p>
              <p className="text-xs text-gray-500">SQLite con Prisma</p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-bold text-orange-600 mb-2">Credenciales de prueba:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Administrador:</p>
                <p className="text-gray-500">admin@antojitos.com</p>
                <p className="text-gray-500">admin123</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Cliente:</p>
                <p className="text-gray-500">cliente@test.com</p>
                <p className="text-gray-500">cliente123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}