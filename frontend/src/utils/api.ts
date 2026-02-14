import axios from 'axios';

// Use production API URL if available, otherwise fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://31.97.155.126:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const tasksApi = {
  getAll: (params?: any) => api.get('/tasks/', { params }),
  getById: (id: number) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks/', data),
  update: (id: number, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

export const stockApi = {
  getAll: (params?: any) => api.get('/stock/', { params }),
  getById: (id: number) => api.get(`/stock/${id}`),
  create: (data: any) => api.post('/stock/', data),
  update: (id: number, data: any) => api.put(`/stock/${id}`, data),
  delete: (id: number) => api.delete(`/stock/${id}`),
  adjustQuantity: (id: number, adjustment: number) => 
    api.post(`/stock/${id}/adjust-quantity`, null, { params: { adjustment } }),
};

export const appointmentsApi = {
  getAll: (params?: any) => api.get('/appointments/', { params }),
  getById: (id: number) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments/', data),
  update: (id: number, data: any) => api.put(`/appointments/${id}`, data),
  delete: (id: number) => api.delete(`/appointments/${id}`),
  getNext3Days: () => api.get('/appointments/upcoming/next-3-days'),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};