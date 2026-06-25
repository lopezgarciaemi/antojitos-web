/**
 * Botón flotante del carrito
 * Muestra contador de items y abre el drawer
 */

'use client';

import { useCartStore, useCartHydration } from '@/store/cart';

export default function CartButton() {
  const hydrated = useCartHydration();
  const { openCart, getItemCount } = useCartStore();
  
  // Evitar hydration mismatch
  if (!hydrated) {
    return (
      <button className="relative p-3 bg-orange-500 text-white rounded-full shadow-lg">
        🛒
      </button>
    );
  }

  const itemCount = getItemCount();

  return (
    <button
      onClick={openCart}
      className="relative p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-transform hover:scale-105"
      aria-label="Abrir carrito"
    >
      <span className="text-xl">🛒</span>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
