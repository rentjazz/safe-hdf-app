import { create } from 'zustand';
import { appointmentsApi } from '../utils/api';

export interface Appointment {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  reminder_sent: boolean;
  reminder_3days_sent: boolean;
  created_at: string;
  updated_at: string;
}

interface AppointmentsState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  fetchAppointments: (params?: any) => Promise<void>;
  fetchNext3Days: () => Promise<Appointment[]>;
  createAppointment: (appointment: Partial<Appointment>) => Promise<void>;
  updateAppointment: (id: number, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: number) => Promise<void>;
}

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  appointments: [],
  loading: false,
  error: null,
  fetchAppointments: async (params) => {
    set({ loading: true });
    try {
      const response = await appointmentsApi.getAll(params);
      set({ appointments: response.data, error: null });
    } catch (error) {
      set({ error: 'Erreur lors du chargement des rendez-vous' });
    } finally {
      set({ loading: false });
    }
  },
  fetchNext3Days: async () => {
    try {
      const response = await appointmentsApi.getNext3Days();
      return response.data;
    } catch (error) {
      set({ error: 'Erreur lors du chargement des rendez-vous' });
      return [];
    }
  },
  createAppointment: async (appointment) => {
    try {
      await appointmentsApi.create(appointment);
      get().fetchAppointments();
    } catch (error) {
      set({ error: 'Erreur lors de la création du rendez-vous' });
    }
  },
  updateAppointment: async (id, appointment) => {
    try {
      await appointmentsApi.update(id, appointment);
      get().fetchAppointments();
    } catch (error) {
      set({ error: 'Erreur lors de la mise à jour du rendez-vous' });
    }
  },
  deleteAppointment: async (id) => {
    try {
      await appointmentsApi.delete(id);
      get().fetchAppointments();
    } catch (error) {
      set({ error: 'Erreur lors de la suppression du rendez-vous' });
    }
  },
}));