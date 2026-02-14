import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Minus, Plus as PlusIcon, AlertTriangle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { useStockStore, StockItem } from '../stores/stockStore';

export function Stock() {
  const { items, loading, fetchItems, createItem, updateItem, deleteItem, adjustQuantity } = useStockStore();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [adjustModal, setAdjustModal] = useState<{ show: boolean; item: StockItem | null; value: string }>({
    show: false,
    item: null,
    value: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit: 'unit',
    min_threshold: 10,
    location: '',
    category: '',
    supplier: '',
    price_per_unit: '',
    barcode: '',
  });

  useEffect(() => {
    fetchItems({ low_stock: showLowStock || undefined });
  }, [showLowStock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      price_per_unit: formData.price_per_unit ? parseFloat(formData.price_per_unit) : null,
    };
    
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
    
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: 0,
      unit: 'unit',
      min_threshold: 10,
      location: '',
      category: '',
      supplier: '',
      price_per_unit: '',
      barcode: '',
    });
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit,
      min_threshold: item.min_threshold,
      location: item.location || '',
      category: item.category || '',
      supplier: item.supplier || '',
      price_per_unit: item.price_per_unit?.toString() || '',
      barcode: item.barcode || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      await deleteItem(id);
    }
  };

  const handleAdjustQuantity = async () => {
    if (adjustModal.item && adjustModal.value) {
      await adjustQuantity(adjustModal.item.id, parseFloat(adjustModal.value));
      setAdjustModal({ show: false, item: null, value: '' });
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLowStock = (item: StockItem) => item.quantity <= item.min_threshold;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock</h1>
          <p className="text-slate-500">Gérez votre inventaire et les alertes de stock</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Stock faible uniquement</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Grid */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Chargement...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Aucun article trouvé</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className={isLowStock(item) ? 'border-red-300' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-slate-900">{item.name}</h3>
                    {item.category && (
                      <span className="text-xs text-slate-500">{item.category}</span>
                    )}
                  </div>
                  {isLowStock(item) && (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAdjustModal({ show: true, item, value: '-1' })}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className={`text-lg font-bold ${isLowStock(item) ? 'text-red-600' : 'text-slate-900'}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setAdjustModal({ show: true, item, value: '1' })}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-500">{item.unit}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Min: {item.min_threshold}
                  </span>
                </div>

                {item.location && (
                  <p className="text-xs text-slate-500 mb-2">📍 {item.location}</p>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold">
                {editingItem ? 'Modifier l\'article' : 'Nouvel article'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Nom"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantité"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Unité"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="unit, kg, L..."
                />
              </div>
              <Input
                label="Seuil d'alerte"
                type="number"
                step="0.01"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: parseFloat(e.target.value) || 0 })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Emplacement"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <Input
                  label="Catégorie"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Fournisseur"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
                <Input
                  label="Prix par unité"
                  type="number"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                />
              </div>
              <Input
                label="Code-barres"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingItem ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Quantity Modal */}
      {adjustModal.show && adjustModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Ajuster la quantité</h3>
            <p className="text-slate-500 mb-4">{adjustModal.item.name}</p>
            <p className="text-sm text-slate-500 mb-4">
              Quantité actuelle: <strong>{adjustModal.item.quantity}</strong>
            </p>
            <Input
              label="Ajustement (+ ou -)"
              type="number"
              step="0.01"
              value={adjustModal.value}
              onChange={(e) => setAdjustModal({ ...adjustModal, value: e.target.value })}
              placeholder="Ex: -5 ou +10"
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="secondary"
                onClick={() => setAdjustModal({ show: false, item: null, value: '' })}
              >
                Annuler
              </Button>
              <Button onClick={handleAdjustQuantity}>
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}