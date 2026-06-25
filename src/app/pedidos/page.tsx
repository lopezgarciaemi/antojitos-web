/**
 * Página de Mis Pedidos
 * Muestra el historial de pedidos del usuario
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserOrders } from '@/lib/actions/order';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  options: string | null;
}

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CREADA: { label: 'Creada', color: 'bg-gray-100 text-gray-600' },
  PAGADA: { label: 'Pagada', color: 'bg-blue-100 text-blue-600' },
  EN_PREPARACION: { label: 'En Preparación', color: 'bg-yellow-100 text-yellow-700' },
  LISTA: { label: 'Lista', color: 'bg-green-100 text-green-600' },
  ENTREGADA: { label: 'Entregada', color: 'bg-green-200 text-green-700' },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-600' },
};

export default function PedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const result = await getUserOrders();
    if (result.success && result.data) {
      setOrders(result.data);
    } else {
      setError(result.error || 'Error al cargar pedidos');
    }
    setLoading(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOrderNumber = (num: number) => {
    return `ANT-${num.toString().padStart(6, '0')}`;
  };

  const parseOptions = (optionsJson: string | null) => {
    if (!optionsJson) return [];
    try {
      return JSON.parse(optionsJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/productos')}
                className="text-gray-500 hover:text-gray-800"
              >
                ← Tienda
              </button>
              <h1 className="text-xl font-bold text-gray-800">Mis Pedidos</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/perfil')}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                Perfil
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-500">Cargando pedidos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
            >
              Iniciar Sesión
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No tienes pedidos aún</p>
            <button
              onClick={() => router.push('/productos')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition"
            >
              Ver Menú
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] || STATUS_LABELS.CREADA;
              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                >
                  {/* Header del pedido */}
                  <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-800">
                        {formatOrderNumber(order.orderNumber)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <p className="text-lg font-bold text-orange-500">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Items del pedido */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const options = parseOptions(item.options);
                        return (
                          <div key={item.id} className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-gray-800">
                                <span className="font-medium">{item.quantity}x</span>{' '}
                                {item.productName}
                              </p>
                              {options.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {options.map((opt: any) => 
                                    `${opt.name || opt.grupo}: ${opt.value || opt.opcion}`
                                  ).join(', ')}
                                </p>
                              )}
                            </div>
                            <p className="text-gray-600">
                              ${item.subtotal.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
