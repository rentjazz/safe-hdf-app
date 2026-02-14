import { create } from 'zustand';
import { dashboardApi } from '../utils/api';

interface DashboardStats {
  total_tasks: number;
  tasks_by_status: Record<string, number>;
  tasks_overdue: number;
  total_stock_items: number;
  low_stock_items: number;
  total_appointments: number;
  upcoming_appointments: number;
  appointments_next_3_days: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async () => {
    set({ loading: true });
    try {
      const response = await dashboardApi.getStats();
      set({ stats: response.data, error: null });
    } catch (error) {
      set({ error: 'Erreur lors du chargement des statistiques' });
    } finally {
      set({ loading: false });
    }
  },
}));