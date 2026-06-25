/**
 * FASE 3: CartDrawer Component
 * Sidebar desplegable del carrito de compras
 * Estilo: Minimalista oscuro con acentos naranja
 */

'use client';

import { useEffect, useState } from 'react';
import { useCartStore, useCartHydration, CartItem } from '@/store/cart';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const router = useRouter();
  const hydrated = useCartHydration();
  
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
    getShippingCost,
    getTotal,
  } = useCartStore();

  // Evitar hydration mismatch
  if (!hydrated) {
    return null;
  }

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotal();

  const handleCheckout = () => {
    // Verificar si el usuario tiene sesión iniciada
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      const shouldLogin = confirm('Debes iniciar sesión para proceder al pago. ¿Deseas ir a iniciar sesión?');
      if (shouldLogin) {
        closeCart();
        router.push('/login');
      }
      return;
    }

    // Verificar que no sea ADMIN
    const user = JSON.parse(storedUser);
    if (user.rol === 'ADMIN') {
      alert('Los administradores no pueden realizar compras. Esta cuenta es solo para gestión.');
      return;
    }

    closeCart();
    router.push('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Tu Carrito
            {itemCount > 0 && (
              <span className="px-2 py-0.5 bg-orange-500 text-white text-sm rounded-full">
                {itemCount}
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-500 hover:text-gray-800 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-64px)]">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Agrega algunos antojitos deliciosos
              </p>
              <button
                onClick={() => {
                  closeCart();
                  router.push('/productos');
                }}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition"
              >
                Ver Menú
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.cartItemId}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>

              {/* Footer con totales */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {/* Subtotal y envío */}
                <div className="space-y-2 mb-4">
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
                  {shipping > 0 && (
                    <p className="text-xs text-gray-400">
                      Envío gratis en pedidos mayores a $200
                    </p>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-orange-500">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botones */}
                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition"
                  >
                    Proceder al Pago
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Componente para cada item del carrito
function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  // Calcular precio con opciones
  const itemPrice = item.price + (item.options?.reduce((acc, opt) => acc + (opt.priceModifier || 0), 0) || 0);
  const totalPrice = itemPrice * item.quantity;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex gap-3">
        {/* Imagen */}
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              // Fallback si no existe la imagen
              e.currentTarget.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl';
              fallback.textContent = '🌮';
              e.currentTarget.parentElement!.appendChild(fallback);
            }}
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
            🌮
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
          
          {/* Opciones */}
          {item.options && item.options.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {item.options.map((opt, i) => (
                <span key={i}>
                  {opt.name}: {opt.value}
                  {opt.priceModifier ? ` (+$${opt.priceModifier})` : ''}
                  {i < item.options!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Notas */}
          {item.notes && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              Nota: {item.notes}
            </p>
          )}

          {/* Precio unitario */}
          <p className="text-sm text-orange-500 mt-1">
            ${itemPrice.toFixed(2)} c/u
          </p>
        </div>

        {/* Precio total */}
        <div className="text-right">
          <p className="font-bold text-gray-800">${totalPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
          >
            -
          </button>
          <span className="w-8 text-center text-gray-800 font-medium">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
          >
            +
          </button>
        </div>
        
        <button
          onClick={() => onRemove(item.cartItemId)}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
