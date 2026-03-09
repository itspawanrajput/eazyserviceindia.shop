import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
  preferred_date?: string;
  preferred_time?: string;
  source?: string;
  status: string;
  created_at: string;
}

export const getSettings = () => api.get('/settings').then(res => res.data);
export const updateSettings = (settings: any) => api.post('/settings', { settings });

export const getSections = () => api.get('/sections').then(res => res.data);
export const saveSection = (section: Partial<Section>) => api.post('/sections', section);
export const deleteSection = (id: string) => api.delete(`/sections/${id}`);

export const getLeads = () => api.get('/leads').then(res => res.data);
export const createLead = (lead: any) => api.post('/leads', lead);
export const updateLeadStatus = (id: number, status: string) => api.patch(`/leads/${id}`, { status });
export const deleteLead = (id: number) => api.delete(`/leads/${id}`);

export const getVisitors = () => api.get('/visitors').then(res => res.data);

export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const login = (credentials: any) =>
  api.post('/auth/login', credentials).then(res => {
    if (res.data.token) {
      sessionStorage.setItem('admin_token', res.data.token);
    }
    return res.data;
  });

export const logout = () =>
  api.post('/auth/logout').then(res => {
    sessionStorage.removeItem('admin_token');
    return res.data;
  });
export const getMe = () => api.get('/auth/me').then(res => res.data);
export const changePassword = (data: any) => api.post('/auth/change-password', data);

// Builder
export const getPageData = (id: string) => api.get(`/builder/page/${id}`).then(res => res.data);
export const saveDraft = (id: string, data: any) => api.post(`/builder/save/${id}`, { draft_json: data });
export const publishPage = (id: string) => api.post(`/builder/publish/${id}`);

export const detectLocation = async (lat: number, lng: number): Promise<string> => {
  const response = await api.post('/location/detect', { lat, lng });
  return response.data.location;
};

export default api;
