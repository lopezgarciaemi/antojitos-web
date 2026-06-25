/**
 * CartWrapper - Componente que controla cuándo mostrar el carrito
 * Solo se muestra en páginas de cliente (productos, checkout, perfil)
 * El carrito se asocia a cada usuario
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import CartDrawer from './CartDrawer';
import CartButton from './CartButton';
import { useCartStore } from '@/store/cart';

// Rutas donde NO se debe mostrar el carrito
const HIDDEN_ROUTES = [
  '/login',
  '/registro',
  '/cocina',
  '/admin',
];

// Rutas donde SÍ se debe mostrar el carrito
const CART_ROUTES = [
  '/productos',
  '/checkout',
  '/perfil',
];

export default function CartWrapper() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      setIsAuthenticated(true);
      
      // Verificar si cambió el usuario
      const savedCartUser = localStorage.getItem('cart-user');
      
      if (savedCartUser && savedCartUser !== user.email) {
        // Usuario diferente, limpiar carrito
        clearCart();
      }
      
      // Guardar el usuario actual del carrito
      localStorage.setItem('cart-user', user.email);
      setCurrentUserEmail(user.email);
    } else {
      setIsAuthenticated(false);
      setCurrentUserEmail(null);
    }
  }, [pathname, clearCart]);

  // Determinar si debe mostrarse el carrito
  const shouldShowCart = () => {
    // No mostrar si está en rutas ocultas
    if (HIDDEN_ROUTES.some(route => pathname.startsWith(route))) {
      return false;
    }
    
    // Mostrar solo si está autenticado y en rutas permitidas
    if (!isAuthenticated) {
      return false;
    }
    
    // Verificar si está en una ruta de carrito
    return CART_ROUTES.some(route => pathname.startsWith(route));
  };

  if (!shouldShowCart()) {
    return null;
  }

  return (
    <>
      <CartDrawer />
      <div className="fixed bottom-6 right-6 z-30">
        <CartButton />
      </div>
    </>
  );
}
