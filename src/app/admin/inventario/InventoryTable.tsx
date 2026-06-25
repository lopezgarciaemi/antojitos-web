/**
 * InventoryTable - Componente cliente para la tabla de inventario
 * Permite editar, crear y eliminar ingredientes
 */

'use client';

import { useState } from 'react';
import { restockIngredient, updateIngredient, createIngredient, deleteIngredient } from '@/lib/actions/kitchen';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  cost: number;
}

interface InventoryTableProps {
  initialIngredients: Ingredient[];
}

// Mapeo de unidades para mostrar
const unitLabels: Record<string, string> = {
  KG: 'Kg',
  LT: 'Lt',
  PIEZA: 'Pz',
  GRAMOS: 'g',
  MILILITROS: 'ml',
};

const unitOptions = [
  { value: 'KG', label: 'Kilogramos (Kg)' },
  { value: 'LT', label: 'Litros (Lt)' },
  { value: 'PIEZA', label: 'Piezas (Pz)' },
  { value: 'GRAMOS', label: 'Gramos (g)' },
  { value: 'MILILITROS', label: 'Mililitros (ml)' },
];

export default function InventoryTable({ initialIngredients }: InventoryTableProps) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal de reabastecer
  const [restockModal, setRestockModal] = useState<Ingredient | null>(null);
  const [restockAmount, setRestockAmount] = useState('');
  
  // Modal de edición
  const [editModal, setEditModal] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    unit: 'KG',
    stock: '',
    minStock: '',
    cost: '',
  });

  // Modal de crear nuevo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    unit: 'KG',
    stock: '',
    minStock: '',
    cost: '',
  });

  // Modal de eliminar
  const [deleteModal, setDeleteModal] = useState<Ingredient | null>(null);

  // Reabastecer ingrediente
  const handleRestock = async () => {
    if (!restockModal || !restockAmount) return;
    
    const amount = parseFloat(restockAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setLoading(true);
    setError('');
    console.log('[INVENTORY] Reabasteciendo:', restockModal.name, '+', amount);
    
    const result = await restockIngredient(restockModal.id, amount);
    
    if (result.success && result.data) {
      console.log('[INVENTORY] Reabastecido exitosamente');
      setIngredients(ingredients.map(i => 
        i.id === restockModal.id 
          ? { ...i, stock: result.data!.stock }
          : i
      ));
      setRestockModal(null);
      setRestockAmount('');
    } else {
      console.error('[INVENTORY ERROR]', result.error);
      setError(result.error || 'Error al reabastecer');
    }
    setLoading(false);
  };

  // Abrir modal de edición
  const openEditModal = (ingredient: Ingredient) => {
    setEditModal(ingredient);
    setEditForm({
      name: ingredient.name,
      unit: ingredient.unit,
      stock: ingredient.stock.toString(),
      minStock: ingredient.minStock.toString(),
      cost: ingredient.cost.toString(),
    });
    setError('');
  };

  // Guardar edición
  const handleSaveEdit = async () => {
    if (!editModal) return;
    
    setLoading(true);
    setError('');
    console.log('[INVENTORY] Guardando edicion:', editForm);
    
    const result = await updateIngredient(editModal.id, {
      name: editForm.name,
      unit: editForm.unit,
      stock: parseFloat(editForm.stock) || 0,
      minStock: parseFloat(editForm.minStock) || 0,
      cost: parseFloat(editForm.cost) || 0,
    });
    
    if (result.success && result.data) {
      console.log('[INVENTORY] Editado exitosamente');
      setIngredients(ingredients.map(i => 
        i.id === editModal.id ? result.data! : i
      ));
      setEditModal(null);
    } else {
      console.error('[INVENTORY ERROR]', result.error);
      setError(result.error || 'Error al guardar');
    }
    setLoading(false);
  };

  // Crear nuevo ingrediente
  const handleCreate = async () => {
    setLoading(true);
    setError('');
    console.log('[INVENTORY] Creando ingrediente:', createForm);
    
    const result = await createIngredient({
      name: createForm.name,
      unit: createForm.unit,
      stock: parseFloat(createForm.stock) || 0,
      minStock: parseFloat(createForm.minStock) || 0,
      cost: parseFloat(createForm.cost) || 0,
    });
    
    if (result.success && result.data) {
      console.log('[INVENTORY] Creado exitosamente');
      setIngredients([...ingredients, result.data]);
      setShowCreateModal(false);
      setCreateForm({ name: '', unit: 'KG', stock: '', minStock: '', cost: '' });
    } else {
      console.error('[INVENTORY ERROR]', result.error);
      setError(result.error || 'Error al crear');
    }
    setLoading(false);
  };

  // Eliminar ingrediente
  const handleDelete = async () => {
    if (!deleteModal) return;
    
    setLoading(true);
    setError('');
    console.log('[INVENTORY] Eliminando:', deleteModal.name);
    
    const result = await deleteIngredient(deleteModal.id);
    
    if (result.success) {
      console.log('[INVENTORY] Eliminado exitosamente');
      setIngredients(ingredients.filter(i => i.id !== deleteModal.id));
      setDeleteModal(null);
    } else {
      console.error('[INVENTORY ERROR]', result.error);
      setError(result.error || 'Error al eliminar');
    }
    setLoading(false);
  };

  // Filtrar ingredientes
  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Barra de herramientas */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar ingrediente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 md:max-w-xs px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <button
          onClick={() => {
            setShowCreateModal(true);
            setError('');
          }}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition"
        >
          + Nuevo Ingrediente
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Ingrediente</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Stock</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Unidad</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Mínimo</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Costo</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((ingredient) => {
                const isLowStock = ingredient.stock <= ingredient.minStock;
                return (
                  <tr key={ingredient.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLowStock && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                        <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                          {ingredient.name}
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                      {ingredient.stock.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{unitLabels[ingredient.unit]}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-mono">{ingredient.minStock.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-mono">${ingredient.cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setRestockModal(ingredient)} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded">+Stock</button>
                        <button onClick={() => openEditModal(ingredient)} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded">Editar</button>
                        <button onClick={() => { setDeleteModal(ingredient); setError(''); }} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded">×</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredIngredients.length === 0 && <div className="text-center py-8 text-gray-500">No se encontraron ingredientes</div>}
      </div>

      {/* Modal Reabastecer */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reabastecer: {restockModal.name}</h3>
            <p className="text-sm text-gray-500 mb-2">Stock actual: {restockModal.stock.toFixed(2)} {unitLabels[restockModal.unit]}</p>
            <div className="flex gap-2 mb-4">
              <input type="number" step="0.01" min="0" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} placeholder="Cantidad" className="flex-1 px-3 py-2 border rounded-lg" autoFocus />
              <span className="px-3 py-2 bg-gray-100 rounded-lg">{unitLabels[restockModal.unit]}</span>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="flex gap-3">
              <button onClick={handleRestock} disabled={loading || !restockAmount} className="flex-1 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg">{loading ? 'Guardando...' : 'Confirmar'}</button>
              <button onClick={() => { setRestockModal(null); setRestockAmount(''); setError(''); }} className="px-4 py-2 border text-gray-600 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Ingrediente</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nombre</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Unidad</label>
                <select value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Stock</label>
                  <input type="number" step="0.01" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Mínimo</label>
                  <input type="number" step="0.01" value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Costo ($)</label>
                <input type="number" step="0.01" value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveEdit} disabled={loading || !editForm.name} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg">{loading ? 'Guardando...' : 'Guardar'}</button>
              <button onClick={() => { setEditModal(null); setError(''); }} className="px-4 py-2 border text-gray-600 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nuevo Ingrediente</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nombre *</label>
                <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Ej: Carne de Res" className="w-full px-3 py-2 border rounded-lg" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Unidad</label>
                <select value={createForm.unit} onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Stock Inicial</label>
                  <input type="number" step="0.01" value={createForm.stock} onChange={(e) => setCreateForm({ ...createForm, stock: e.target.value })} placeholder="0" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Stock Mínimo</label>
                  <input type="number" step="0.01" value={createForm.minStock} onChange={(e) => setCreateForm({ ...createForm, minStock: e.target.value })} placeholder="0" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Costo ($)</label>
                <input type="number" step="0.01" value={createForm.cost} onChange={(e) => setCreateForm({ ...createForm, cost: e.target.value })} placeholder="0" className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreate} disabled={loading || !createForm.name} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg">{loading ? 'Creando...' : 'Crear'}</button>
              <button onClick={() => { setShowCreateModal(false); setCreateForm({ name: '', unit: 'KG', stock: '', minStock: '', cost: '' }); setError(''); }} className="px-4 py-2 border text-gray-600 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Eliminar Ingrediente</h3>
            <p className="text-gray-600 mb-2">¿Eliminar <strong>{deleteModal.name}</strong>?</p>
            <p className="text-sm text-gray-500 mb-4">Si está en uso por alguna receta, no podrá ser eliminado.</p>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={loading} className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg">{loading ? 'Eliminando...' : 'Eliminar'}</button>
              <button onClick={() => { setDeleteModal(null); setError(''); }} className="px-4 py-2 border text-gray-600 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
