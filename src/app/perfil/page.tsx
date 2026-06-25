/**
 * Página de Perfil de Usuario
 * FASE 2: Gestión de direcciones
 * Estilo: Minimalista tipo Notion - Fondo oscuro, bordes finos, botones naranja
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getUserAddresses, 
  addAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '@/lib/actions/address';
import { useCartStore } from '@/store/cart';

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

interface User {
  nombre: string;
  email: string;
  rol: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    label: 'Casa',
    street: '',
    number: '',
    intNumber: '',
    colony: '',
    city: 'CDMX',
    state: 'CDMX',
    zipCode: '',
    phone: '',
    references: '',
    isDefault: false,
  });

  useEffect(() => {
    loadUserData();
    loadAddresses();
  }, []);

  const loadUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
  };

  const loadAddresses = async () => {
    setLoading(true);
    const result = await getUserAddresses();
    if (result.success && result.data) {
      setAddresses(result.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    
    const result = await addAddress(formData);
    
    if (result.success) {
      setShowForm(false);
      setFormData({
        label: 'Casa',
        street: '',
        number: '',
        intNumber: '',
        colony: '',
        city: 'CDMX',
        state: 'CDMX',
        zipCode: '',
        phone: '',
        references: '',
        isDefault: false,
      });
      loadAddresses();
    } else {
      setError(result.error || 'Error al guardar dirección');
    }
    
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta dirección?')) return;
    
    const result = await deleteAddress(id);
    if (result.success) {
      loadAddresses();
    }
  };

  const handleSetDefault = async (id: string) => {
    const result = await setDefaultAddress(id);
    if (result.success) {
      loadAddresses();
    }
  };

  const clearCart = useCartStore((state) => state.clearCart);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart-user'); // Limpiar asociación de carrito
    localStorage.removeItem('antojitos-cart'); // Limpiar carrito
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    clearCart(); // Limpiar estado del carrito
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/productos" className="text-gray-500 hover:text-gray-800">
              ← Tienda
            </a>
            <h1 className="text-xl font-bold text-gray-800">Mi Perfil</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/pedidos" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
              Mis Pedidos
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info del Usuario */}
        <section className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user.nombre}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-orange-50 text-orange-500 text-xs rounded border border-orange-200">
                {user.rol}
              </span>
            </div>
          </div>
        </section>

        {/* Direcciones */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Mis Direcciones
            </h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
            >
              {showForm ? 'Cancelar' : '+ Nueva Dirección'}
            </button>
          </div>

          {/* Formulario Nueva Dirección */}
          {showForm && (
            <form 
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm"
            >
              <h4 className="text-gray-800 font-medium mb-4">Nueva Dirección</h4>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Etiqueta</label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Casa">Casa</option>
                    <option value="Trabajo">Trabajo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    required
                    placeholder="5512345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">Calle</label>
                  <input
                    type="text"
                    required
                    placeholder="Av. Insurgentes Sur"
                    value={formData.street}
                    onChange={(e) => setFormData({...formData, street: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Número Ext.</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={formData.number}
                    onChange={(e) => setFormData({...formData, number: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Número Int. (opcional)</label>
                  <input
                    type="text"
                    placeholder="4B"
                    value={formData.intNumber}
                    onChange={(e) => setFormData({...formData, intNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Colonia</label>
                  <input
                    type="text"
                    required
                    placeholder="Del Valle"
                    value={formData.colony}
                    onChange={(e) => setFormData({...formData, colony: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Código Postal</label>
                  <input
                    type="text"
                    required
                    placeholder="03100"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Estado</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">Referencias (opcional)</label>
                  <input
                    type="text"
                    placeholder="Entre calles X y Y, edificio azul"
                    value={formData.references}
                    onChange={(e) => setFormData({...formData, references: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 bg-white"
                    />
                    <span className="text-sm text-gray-600">Usar como dirección predeterminada</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {formLoading ? 'Guardando...' : 'Guardar Dirección'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista de Direcciones */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando direcciones...
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white border border-gray-200 border-dashed rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-2">No tienes direcciones guardadas</p>
              <p className="text-sm text-gray-400">
                Agrega una dirección para pedidos a domicilio
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div 
                  key={address.id}
                  className={`bg-white border rounded-lg p-4 shadow-sm ${
                    address.isDefault 
                      ? 'border-orange-500' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{address.label}</span>
                      {address.isDefault && (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-500 text-xs rounded border border-orange-200">
                          Predeterminada
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{address.street} #{address.number}{address.intNumber ? `, Int. ${address.intNumber}` : ''}</p>
                    <p>{address.colony}, {address.city}</p>
                    <p>CP {address.zipCode}, {address.state}</p>
                    <p className="text-gray-400">Tel: {address.phone}</p>
                    {address.references && (
                      <p className="text-gray-400 text-xs mt-2">
                        Ref: {address.references}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs text-orange-500 hover:text-orange-600"
                      >
                        Hacer predeterminada
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-xs text-red-500 hover:text-red-600 ml-auto"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
