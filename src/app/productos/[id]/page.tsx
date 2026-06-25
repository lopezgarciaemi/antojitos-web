'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '@/store/cart';

interface OptionGroup {
  id: string;
  nombre: string;
  obligatorio: boolean;
  seleccionMultiple: boolean;
  options: {
    id: string;
    nombre: string;
    precioAdicional: number;
  }[];
}

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precioBase: number;
  imagen: string | null;
  disponible: boolean;
  categoria: {
    nombre: string;
    icono: string;
  };
  optionGroups: OptionGroup[];
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { addItem, openCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({} as Record<string, string[]>);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const getSelectedIds = (groupId: string) => selectedOptions[groupId] || [];

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (groupId: string, optionId: string, isMultiple: boolean) => {
    setSelectedOptions((prev) => {
      const currentGroup = prev[groupId] || [];
      
      if (isMultiple) {
        // Multi-selección: toggle
        if (currentGroup.includes(optionId)) {
          return { ...prev, [groupId]: currentGroup.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [groupId]: [...currentGroup, optionId] };
        }
      } else {
        // Selección única: reemplazar
        return { ...prev, [groupId]: [optionId] };
      }
    });
  };

  const calculateTotal = () => {
    if (!product) return 0;
    
    let total = product.precioBase;
    
    // Sumar precios adicionales de opciones seleccionadas
    product.optionGroups.forEach((group) => {
      const selectedIds = getSelectedIds(group.id);
      selectedIds.forEach((optId) => {
        const option = group.options.find((opt) => opt.id === optId);
        if (option && typeof option.precioAdicional === 'number') {
          total += option.precioAdicional;
        }
      });
    });
    
    return total * quantity;
  };

  const handleAddToCart = () => {
    // Verificar si el usuario tiene sesión iniciada
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      const shouldLogin = confirm('Debes iniciar sesión para agregar productos al carrito. ¿Deseas ir a iniciar sesión?');
      if (shouldLogin) {
        router.push('/login');
      }
      return;
    }

    // Verificar que no sea ADMIN (los admins no pueden comprar)
    const user = JSON.parse(storedUser);
    if (user.rol === 'ADMIN') {
      alert('Los administradores no pueden realizar compras. Esta cuenta es solo para gestión.');
      return;
    }

    // Validar opciones obligatorias
    const missingRequired = product?.optionGroups.filter(
      (group) => group.obligatorio && (getSelectedIds(group.id).length === 0)
    );

    if (missingRequired && missingRequired.length > 0) {
      alert(`Por favor selecciona: ${missingRequired.map((g) => g.nombre).join(', ')}`);
      return;
    }

    // Construir opciones para el carrito
    const cartOptions = product?.optionGroups.flatMap((group) => {
      const selectedIds = getSelectedIds(group.id);
      return selectedIds.map((optId) => {
        const option = group.options.find((opt) => opt.id === optId);
        return option ? {
          name: group.nombre,
          value: option.nombre,
          priceModifier: option.precioAdicional || 0,
        } : null;
      }).filter((o): o is NonNullable<typeof o> => o !== null);
    }) || [];

    // Agregar al carrito
    addItem({
      productId: product!.id.toString(),
      name: product!.nombre,
      price: product!.precioBase,
      image: product!.imagen
        ? product!.imagen.startsWith('http://') || product!.imagen.startsWith('https://')
          ? product!.imagen
          : product!.imagen.includes('.')
            ? `/images/productos/${product!.imagen}`
            : undefined
        : undefined,
      quantity,
      options: cartOptions.length > 0 ? cartOptions : undefined,
      notes: notes || undefined,
    });

    // Abrir el drawer del carrito
    openCart();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Producto no encontrado</p>
          <button
            onClick={() => router.push('/productos')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Ver menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/productos')}
            className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-2"
          >
            ← Volver al menú
          </button>
          <span className="text-xl font-bold text-gray-800">Los Antojitos de Misha</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Imagen y info básica */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
            {product.imagen && (product.imagen.startsWith('http://') || product.imagen.startsWith('https://')) ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-9xl">🌮</span>';
                }}
              />
            ) : product.imagen && product.imagen.includes('.') ? (
              <img
                src={`/images/productos/${product.imagen}`}
                alt={product.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-9xl">🌮</span>';
                }}
              />
            ) : (
              <div className="text-9xl">🌮</div>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.nombre}</h1>
                <span className="inline-block bg-orange-100 border border-orange-300 text-orange-600 text-sm font-medium px-3 py-1 rounded-full">
                  {product.categoria.icono} {product.categoria.nombre}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Precio base</p>
                <p className="text-3xl font-bold text-orange-500">${product.precioBase.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-gray-600">{product.descripcion}</p>
          </div>
        </div>

        {/* Grupos de opciones */}
        {product.optionGroups.map((group) => (
          <div key={group.id} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{group.nombre}</h2>
              <div className="flex gap-2">
                {group.obligatorio && (
                  <span className="bg-red-100 border border-red-300 text-red-600 text-xs font-bold px-2 py-1 rounded">
                    OBLIGATORIO
                  </span>
                )}
                <span className="bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                  {group.seleccionMultiple ? 'Multi-selección' : 'Selección única'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {group.options.map((option) => {
                const isSelected = getSelectedIds(group.id).includes(option.id);
                const precioAdicional = option.precioAdicional || 0;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(group.id, option.id, group.seleccionMultiple)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-400'
                        }`}
                      >
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="font-medium text-gray-800">{option.nombre}</span>
                    </div>
                    {precioAdicional > 0 && (
                      <span className="text-orange-500 font-bold">+${precioAdicional.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Notas adicionales */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Notas adicionales</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instrucciones especiales (sin cebolla, extra salsa, etc.)"
            rows={2}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Cantidad y agregar al carrito */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sticky bottom-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Cantidad</p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-300 hover:bg-gray-200 font-bold text-gray-800 transition"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-800 w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-300 hover:bg-gray-200 font-bold text-gray-800 transition"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-3xl font-bold text-orange-500">${calculateTotal().toFixed(2)}</p>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.disponible}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition text-lg"
          >
            {product.disponible ? 'Agregar al carrito' : 'No disponible'}
          </button>
        </div>
      </div>
    </div>
  );
}
