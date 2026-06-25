/**
 * FASE 3: Carrito de Compras Inteligente
 * Store de Zustand con persistencia en localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos
export interface CartItemOption {
  name: string;
  value: string;
  priceModifier?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  options?: CartItemOption[];
  notes?: string;
  // Identificador único para items con diferentes opciones
  cartItemId: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  
  // Acciones
  addItem: (item: Omit<CartItem, 'cartItemId'>) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemNotes: (cartItemId: string, notes: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Getters computados
  getItemCount: () => number;
  getSubtotal: () => number;
  getShippingCost: () => number;
  getTotal: () => number;
}

// Genera un ID único para items del carrito
const generateCartItemId = (productId: string, options?: CartItemOption[]): string => {
  const optionsString = options 
    ? JSON.stringify(options.sort((a, b) => a.name.localeCompare(b.name)))
    : '';
  return `${productId}-${optionsString || 'no-options'}-${Date.now()}`;
};

// Verifica si dos arrays de opciones son iguales
const areOptionsEqual = (opts1?: CartItemOption[], opts2?: CartItemOption[]): boolean => {
  if (!opts1 && !opts2) return true;
  if (!opts1 || !opts2) return false;
  if (opts1.length !== opts2.length) return false;
  
  const sorted1 = [...opts1].sort((a, b) => a.name.localeCompare(b.name));
  const sorted2 = [...opts2].sort((a, b) => a.name.localeCompare(b.name));
  
  return sorted1.every((opt, i) => 
    opt.name === sorted2[i].name && opt.value === sorted2[i].value
  );
};

// Costo de envío fijo
const SHIPPING_COST = 35;
const FREE_SHIPPING_THRESHOLD = 200;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (newItem) => {
        console.log('[CART] Agregando item:', { name: newItem.name, quantity: newItem.quantity, options: newItem.options });
        set((state) => {
          // Buscar si ya existe un item con el mismo producto Y las mismas opciones
          const existingIndex = state.items.findIndex(
            item => item.productId === newItem.productId && 
                    areOptionsEqual(item.options, newItem.options) &&
                    item.notes === newItem.notes
          );
          
          if (existingIndex !== -1) {
            // Incrementar cantidad
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + newItem.quantity
            };
            console.log('[CART] Item existente, cantidad actualizada:', updatedItems[existingIndex].quantity);
            return { items: updatedItems };
          }
          
          // Agregar nuevo item
          const cartItem: CartItem = {
            ...newItem,
            cartItemId: generateCartItemId(newItem.productId, newItem.options)
          };
          
          console.log('[CART] Nuevo item agregado. Total items:', state.items.length + 1);
          return { items: [...state.items, cartItem] };
        });
      },
      
      removeItem: (cartItemId) => {
        console.log('[CART] Eliminando item:', cartItemId);
        set((state) => {
          const newItems = state.items.filter(item => item.cartItemId !== cartItemId);
          console.log('[CART] Items restantes:', newItems.length);
          return { items: newItems };
        });
      },
      
      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.cartItemId === cartItemId
              ? { ...item, quantity }
              : item
          )
        }));
      },
      
      updateItemNotes: (cartItemId, notes) => {
        set((state) => ({
          items: state.items.map(item =>
            item.cartItemId === cartItemId
              ? { ...item, notes }
              : item
          )
        }));
      },
      
      clearCart: () => {
        console.log('[CART] Limpiando carrito completamente');
        set({ items: [] });
      },
      
      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },
      
      openCart: () => {
        set({ isOpen: true });
      },
      
      closeCart: () => {
        set({ isOpen: false });
      },
      
      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce((acc, item) => {
          // Precio base
          let itemPrice = item.price;
          
          // Sumar modificadores de opciones
          if (item.options) {
            itemPrice += item.options.reduce(
              (optAcc, opt) => optAcc + (opt.priceModifier || 0), 
              0
            );
          }
          
          return acc + (itemPrice * item.quantity);
        }, 0);
      },
      
      getShippingCost: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      },
      
      getTotal: () => {
        return get().getSubtotal() + get().getShippingCost();
      },
    }),
    {
      name: 'antojitos-cart',
      // Solo persistir items, no el estado del drawer
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Hook para verificar hidratación (SSR)
export const useCartHydration = () => {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    setHydrated(true);
  }, []);
  
  return hydrated;
};

// Imports necesarios para el hook de hidratación
import { useState, useEffect } from 'react';
