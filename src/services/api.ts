import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export interface Section {
  id: string;
  title: string;
  content: any[];
  order_index: number;
  is_visible: boolean;
  config: any;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
  service_type: string;
  message: string;
  source?: string;
  status: string;
  created_at: string;
  preferred_date?: string;
  preferred_time?: string;
  custom_data?: string;
}

export const getSettings = () => api.get('/settings').then(res => res.data);
export const updateSettings = (settings: any) => api.post('/settings', { settings });

export const getSections = () => api.get('/sections').then(res => res.data);
export const saveSection = (section: Partial<Section>) => api.post('/sections', section);
export const deleteSection = (id: string) => api.delete(`/sections/${id}`);

export const getForms = () => api.get('/forms').then(res => res.data);
export const saveForm = (id: string, name: string, fields_json: any[]) => api.put(`/forms/${id}`, { name, fields_json });

export const getLeads = () => api.get('/leads').then(res => res.data);
export const createLead = (lead: any) => api.post('/leads', lead);
export const updateLeadStatus = (id: number, status: string) => api.patch(`/leads/${id}`, { status });
export const deleteLead = (id: number) => api.delete(`/leads/${id}`);

export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const login = (credentials: any) => api.post('/auth/login', credentials);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me').then(res => res.data);

export const detectLocation = async (lat: number, lng: number): Promise<string> => {
  const response = await api.post('/location/detect', { lat, lng });
  return response.data.location;
};
