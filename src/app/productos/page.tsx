'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: number;
  nombre: string;
  icono: string;
}

interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  imagen: string;
  disponible: boolean;
  categoria?: {
    nombre: string;
    icono: string;
  };
}

export default function ProductosPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar si hay usuario logueado
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadProducts = async (categoryId?: number, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (search) params.append('search', search);

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      if (data.success) {
        // Filtrar productos que tengan categoria
        const validProducts = data.data.filter((p: Product) => p.categoria);
        setProducts(validProducts);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategory(categoryId);
    loadProducts(categoryId, searchTerm);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    loadProducts(selectedCategory || undefined, term);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-orange-500">Los Antojitos de Misha</h1>
              <p className="text-xs text-gray-500">Menú de Antojitos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/pedidos')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Mis Pedidos
                </button>
                <button
                  onClick={() => router.push('/perfil')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Perfil
                </button>
                {user.rol === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => router.push('/admin/inventario')}
                      className="px-3 py-1.5 bg-orange-100 text-orange-600 text-sm rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      Inventario
                    </button>
                    <button
                      onClick={() => router.push('/cocina')}
                      className="px-3 py-1.5 bg-orange-100 text-orange-600 text-sm rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      Cocina
                    </button>
                  </>
                )}
                {user.rol === 'COCINA' && (
                  <button
                    onClick={() => router.push('/cocina')}
                    className="px-3 py-1.5 bg-orange-100 text-orange-600 text-sm rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    Cocina
                  </button>
                )}
              </nav>
            )}
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{user.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {user.rol === 'ADMIN' ? 'Admin' : user.rol === 'COCINA' ? 'Cocina' : 'Cliente'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Búsqueda */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar antojitos..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Categorías */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Categorías</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => {
                setSelectedCategory(null);
                loadProducts(undefined, searchTerm);
              }}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
                selectedCategory === null
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.icono} {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Productos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-500">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/productos/${product.id}`)}
                className="bg-white border border-gray-200 rounded-xl hover:border-orange-500 transition cursor-pointer overflow-hidden shadow-sm"
              >
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={`/images/productos/${product.imagen}`}
                    alt={product.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback a emoji si no existe la imagen
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-6xl">🌮</span>';
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{product.nombre}</h3>
                    {product.categoria && (
                      <span className="bg-orange-50 border border-orange-200 text-orange-500 text-xs font-bold px-2 py-1 rounded">
                        {product.categoria.icono}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-500">
                      ${product.precioBase.toFixed(2)}
                    </span>
                    {!product.disponible && (
                      <span className="text-xs text-red-500 font-medium">No disponible</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
