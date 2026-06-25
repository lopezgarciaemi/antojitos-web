/**
 * KitchenBoard - Componente cliente para el tablero de cocina
 * Maneja las interacciones de iniciar/terminar pedidos
 */

'use client';

import { useState } from 'react';
import { startPreparation, finishPreparation } from '@/lib/actions/kitchen';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  options: string | null;
  product: {
    name: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  type: string;
  createdAt: Date;
  customerNotes: string | null;
  items: OrderItem[];
  user: {
    name: string;
    phone: string | null;
  };
}

interface KitchenBoardProps {
  initialOrders: Order[];
}

export default function KitchenBoard({ initialOrders }: KitchenBoardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState<string | null>(null);

  const handleStart = async (orderId: string) => {
    setLoading(orderId);
    const result = await startPreparation(orderId);
    
    if (result.success) {
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: 'EN_PREPARACION' } : o
      ));
    }
    setLoading(null);
  };

  const handleFinish = async (orderId: string) => {
    setLoading(orderId);
    const result = await finishPreparation(orderId);
    
    if (result.success) {
      setOrders(orders.filter(o => o.id !== orderId));
    }
    setLoading(null);
  };

  // Separar por estado
  const pendingOrders = orders.filter(o => o.status === 'PAGADA');
  const inProgressOrders = orders.filter(o => o.status === 'EN_PREPARACION');

  // Calcular tiempo transcurrido
  const getElapsedTime = (createdAt: Date) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  // Parsear opciones JSON
  const parseOptions = (optionsJson: string | null): string[] => {
    if (!optionsJson) return [];
    try {
      const options = JSON.parse(optionsJson);
      return options.map((opt: { grupo?: string; opcion?: string; name?: string; value?: string }) => 
        opt.opcion || opt.value || ''
      ).filter(Boolean);
    } catch {
      return [];
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Columna: Pendientes */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <h2 className="text-lg font-semibold text-gray-800">
            Pendientes ({pendingOrders.length})
          </h2>
        </div>
        
        <div className="space-y-4">
          {pendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              elapsedTime={getElapsedTime(order.createdAt)}
              parseOptions={parseOptions}
              actionLabel="Empezar"
              actionColor="bg-yellow-500 hover:bg-yellow-600"
              onAction={() => handleStart(order.id)}
              isLoading={loading === order.id}
            />
          ))}
        </div>
      </div>

      {/* Columna: En Preparación */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
          <h2 className="text-lg font-semibold text-gray-800">
            En Preparación ({inProgressOrders.length})
          </h2>
        </div>
        
        <div className="space-y-4">
          {inProgressOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              elapsedTime={getElapsedTime(order.createdAt)}
              parseOptions={parseOptions}
              actionLabel="Terminar"
              actionColor="bg-green-500 hover:bg-green-600"
              onAction={() => handleFinish(order.id)}
              isLoading={loading === order.id}
              highlighted
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente de tarjeta de orden
function OrderCard({
  order,
  elapsedTime,
  parseOptions,
  actionLabel,
  actionColor,
  onAction,
  isLoading,
  highlighted = false,
}: {
  order: Order;
  elapsedTime: string;
  parseOptions: (options: string | null) => string[];
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
  isLoading: boolean;
  highlighted?: boolean;
}) {
  return (
    <div 
      className={`bg-white border rounded-lg overflow-hidden shadow-sm ${
        highlighted ? 'border-orange-500' : 'border-gray-200'
      }`}
    >
      {/* Header de la tarjeta */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-orange-500">
            #{order.orderNumber.toString().padStart(3, '0')}
          </span>
          <span className="text-sm text-gray-500">
            {order.type === 'DOMICILIO' ? 'Domicilio' : order.type === 'MESA' ? 'Mesa' : 'Recoger'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500">{elapsedTime}</span>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {order.items.map((item) => {
          const options = parseOptions(item.options);
          return (
            <div key={item.id} className="flex gap-3">
              <span className="text-lg font-bold text-orange-500 w-6">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.productName}</p>
                {options.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {options.join(', ')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notas del cliente */}
      {order.customerNotes && (
        <div className="px-4 pb-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <p className="text-sm text-yellow-700">
              Nota: {order.customerNotes}
            </p>
          </div>
        </div>
      )}

      {/* Footer con acción */}
      <div className="px-4 pb-4">
        <button
          onClick={onAction}
          disabled={isLoading}
          className={`w-full py-3 ${actionColor} text-white font-bold rounded-lg transition disabled:opacity-50`}
        >
          {isLoading ? 'Procesando...' : actionLabel}
        </button>
      </div>
    </div>
  );
}
