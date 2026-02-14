import { create } from 'zustand';
import { stockApi } from '../utils/api';

export interface StockItem {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  min_threshold: number;
  location: string | null;
  category: string | null;
  supplier: string | null;
  price_per_unit: number | null;
  barcode: string | null;
  created_at: string;
  updated_at: string;
}

interface StockState {
  items: StockItem[];
  loading: boolean;
  error: string | null;
  fetchItems: (params?: any) => Promise<void>;
  createItem: (item: Partial<StockItem>) => Promise<void>;
  updateItem: (id: number, item: Partial<StockItem>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  adjustQuantity: (id: number, adjustment: number) => Promise<void>;
}

export const useStockStore = create<StockState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  fetchItems: async (params) => {
    set({ loading: true });
    try {
      const response = await stockApi.getAll(params);
      set({ items: response.data, error: null });
    } catch (error) {
      set({ error: 'Erreur lors du chargement du stock' });
    } finally {
      set({ loading: false });
    }
  },
  createItem: async (item) => {
    try {
      await stockApi.create(item);
      get().fetchItems();
    } catch (error) {
      set({ error: 'Erreur lors de la création de l\'article' });
    }
  },
  updateItem: async (id, item) => {
    try {
      await stockApi.update(id, item);
      get().fetchItems();
    } catch (error) {
      set({ error: 'Erreur lors de la mise à jour de l\'article' });
    }
  },
  deleteItem: async (id) => {
    try {
      await stockApi.delete(id);
      get().fetchItems();
    } catch (error) {
      set({ error: 'Erreur lors de la suppression de l\'article' });
    }
  },
  adjustQuantity: async (id, adjustment) => {
    try {
      await stockApi.adjustQuantity(id, adjustment);
      get().fetchItems();
    } catch (error) {
      set({ error: 'Erreur lors de l\'ajustement de la quantité' });
    }
  },
}));