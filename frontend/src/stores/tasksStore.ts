import { create } from 'zustand';
import { tasksApi } from '../utils/api';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  due_date: string | null;
  assigned_to: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: (params?: any) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: number, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  fetchTasks: async (params) => {
    set({ loading: true });
    try {
      const response = await tasksApi.getAll(params);
      set({ tasks: response.data, error: null });
    } catch (error) {
      set({ error: 'Erreur lors du chargement des tâches' });
    } finally {
      set({ loading: false });
    }
  },
  createTask: async (task) => {
    try {
      await tasksApi.create(task);
      get().fetchTasks();
    } catch (error) {
      set({ error: 'Erreur lors de la création de la tâche' });
    }
  },
  updateTask: async (id, task) => {
    try {
      await tasksApi.update(id, task);
      get().fetchTasks();
    } catch (error) {
      set({ error: 'Erreur lors de la mise à jour de la tâche' });
    }
  },
  deleteTask: async (id) => {
    try {
      await tasksApi.delete(id);
      get().fetchTasks();
    } catch (error) {
      set({ error: 'Erreur lors de la suppression de la tâche' });
    }
  },
}));