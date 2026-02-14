import { create } from 'zustand';
import { api } from '../utils/api';

interface GoogleCalendarState {
  isConnected: boolean;
  email: string | null;
  loading: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
  getAuthUrl: () => Promise<string>;
  disconnect: () => Promise<void>;
  syncCalendar: (params?: { calendar_id?: string; from_date?: string; to_date?: string }) => Promise<any>;
  pushToCalendar: (appointmentId: number, calendarId?: string) => Promise<any>;
}

export const useGoogleCalendarStore = create<GoogleCalendarState>((set, get) => ({
  isConnected: false,
  email: null,
  loading: false,
  error: null,
  checkStatus: async () => {
    try {
      const response = await api.get('/calendar/status');
      set({ 
        isConnected: response.data.is_connected, 
        email: response.data.email,
        error: null 
      });
    } catch (error) {
      set({ error: 'Erreur lors de la vérification du statut' });
    }
  },
  getAuthUrl: async () => {
    const response = await api.get('/calendar/auth-url');
    return response.data.auth_url;
  },
  disconnect: async () => {
    try {
      await api.post('/calendar/disconnect');
      set({ isConnected: false, email: null, error: null });
    } catch (error) {
      set({ error: 'Erreur lors de la déconnexion' });
    }
  },
  syncCalendar: async (params) => {
    try {
      const response = await api.post('/calendar/sync', {
        calendar_id: params?.calendar_id || 'primary',
        from_date: params?.from_date,
        to_date: params?.to_date
      });
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Erreur de synchronisation' });
      throw error;
    }
  },
  pushToCalendar: async (appointmentId, calendarId = 'primary') => {
    try {
      const response = await api.post(`/calendar/push/${appointmentId}?calendar_id=${calendarId}`);
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Erreur lors de la synchronisation' });
      throw error;
    }
  },
}));