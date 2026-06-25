/**
 * FASE 4: Página de Checkout
 * Selección de dirección, método de pago y confirmación
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useCartHydration } from '@/store/cart';
import { getUserAddresses } from '@/lib/actions/address';
import { createOrder } from '@/lib/actions/order';

interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  intNumber?: string | null;
  colony: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  references?: string | null;
  isDefault: boolean;
}

type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useCartHydration();
  
  const { 
    items, 
    getSubtotal, 
    getShippingCost, 
    getTotal, 
    clearCart 
  } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockErrors, setStockErrors] = useState<Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }>>([]);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    orderNumber: string;
    total: number;
  } | null>(null);

  useEffect(() => {
    // Verificar si el usuario está logueado
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    loadAddresses();
  }, [router]);

  // Redirect si el carrito está vacío (después de hidratación)
  useEffect(() => {
    if (hydrated && items.length === 0 && !orderSuccess) {
      router.push('/productos');
    }
  }, [hydrated, items.length, router, orderSuccess]);

  const loadAddresses = async () => {
    console.log('[CHECKOUT] Cargando direcciones...');
    const result = await getUserAddresses();
    if (result.success && result.data) {
      console.log('[CHECKOUT] Direcciones cargadas:', result.data.length);
      setAddresses(result.data);
      // Seleccionar dirección por defecto
      const defaultAddr = result.data.find((a: Address) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (result.data.length > 0) {
        setSelectedAddressId(result.data[0].id);
      }
    } else {
      console.error('[CHECKOUT ERROR] Cargando direcciones:', result.error);
    }
    setAddressLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStockErrors([]);
    setLoading(true);

    console.log('[CHECKOUT] Iniciando pedido...', {
      items: items.length,
      addressId: selectedAddressId,
      paymentMethod
    });

    const orderItems = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      options: item.options,
      notes: item.notes,
    }));

    const result = await createOrder({
      items: orderItems,
      addressId: selectedAddressId,
      paymentMethod,
      notes: notes || undefined,
    });

    if (result.success && result.data) {
      console.log('[CHECKOUT] Pedido creado:', result.data);
      setOrderSuccess(result.data);
      clearCart();
    } else {
      console.error('[CHECKOUT ERROR]', result.error, result.stockErrors);
      setError(result.error || 'Error al procesar el pedido');
      if (result.stockErrors) {
        setStockErrors(result.stockErrors);
      }
    }

    setLoading(false);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  // Pantalla de éxito
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Pedido Confirmado
          </h1>
          <p className="text-gray-500 mb-6">
            Tu pedido ha sido recibido y está siendo preparado.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Número de orden</p>
            <p className="text-lg font-bold text-orange-500">
              {orderSuccess.orderNumber}
            </p>
            <p className="text-sm text-gray-500 mt-3">Total</p>
            <p className="text-2xl font-bold text-gray-800">
              ${orderSuccess.total.toFixed(2)}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/pedidos')}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition"
            >
              Ver Mis Pedidos
            </button>
            <button
              onClick={() => router.push('/productos')}
              className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Seguir Comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-800"
            >
              ← Volver
            </button>
            <h1 className="text-xl font-bold text-gray-800">Checkout</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Formulario */}
          <div className="lg:col-span-2 space-y-6">
            {/* Errores */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-medium">{error}</p>
                {stockErrors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-500 space-y-1">
                    {stockErrors.map((err, i) => (
                      <li key={i}>
                        • {err.productName}: pediste {err.requested}, disponible {err.available}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Dirección de entrega */}
            <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Dirección de Entrega
              </h2>

              {addressLoading ? (
                <div className="text-gray-500 text-center py-4">Cargando direcciones...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No tienes direcciones guardadas</p>
                  <button
                    type="button"
                    onClick={() => router.push('/perfil')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
                  >
                    Agregar Dirección
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 rounded-lg cursor-pointer transition ${
                        selectedAddressId === address.id
                          ? 'bg-orange-50 border-2 border-orange-500'
                          : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-1 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">{address.label}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-500 text-xs rounded">
                                Predeterminada
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.street} #{address.number}
                            {address.intNumber ? `, Int. ${address.intNumber}` : ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            {address.colony}, CP {address.zipCode}
                          </p>
                          <p className="text-sm text-gray-400">Tel: {address.phone}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* Método de pago */}
            <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Método de Pago
              </h2>

              <div className="space-y-3">
                {[
                  { value: 'EFECTIVO', label: 'Efectivo', desc: 'Pago al recibir' },
                  { value: 'TARJETA', label: 'Tarjeta', desc: 'Débito o crédito' },
                  { value: 'TRANSFERENCIA', label: 'Transferencia', desc: 'SPEI o depósito' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`block p-4 rounded-lg cursor-pointer transition ${
                      paymentMethod === method.value
                        ? 'bg-orange-50 border-2 border-orange-500'
                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Notas */}
            <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Notas del Pedido (opcional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones especiales para tu pedido..."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </section>
          </div>

          {/* Columna derecha - Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Resumen del Pedido
              </h2>

              {/* Items */}
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {items.map((item) => {
                  const itemPrice = item.price + (item.options?.reduce((acc, opt) => acc + (opt.priceModifier || 0), 0) || 0);
                  return (
                    <div key={item.cartItemId} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="text-gray-800">
                          {item.quantity}x {item.name}
                        </p>
                        {item.options && item.options.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {item.options.map(o => o.value).join(', ')}
                          </p>
                        )}
                      </div>
                      <p className="text-gray-500">
                        ${(itemPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <hr className="border-gray-200 my-4" />

              {/* Totales */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  {shipping === 0 ? (
                    <span className="text-green-500">¡Gratis!</span>
                  ) : (
                    <span className="text-gray-500">${shipping.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-orange-500">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón de confirmar */}
              <button
                type="submit"
                disabled={loading || addresses.length === 0 || !selectedAddressId}
                className="w-full mt-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                Al confirmar aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
