import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  getUsers: (roles) => api.get('/auth/users', {
    params: roles ? { roles } : {},
  }),
};

// Tickets API
export const ticketsAPI = {
  getAll: () => api.get('/tickets'),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (ticketData) => api.post('/tickets', ticketData),
  update: (id, ticketData) => api.put(`/tickets/${id}`, ticketData),
  delete: (id) => api.delete(`/tickets/${id}`),
  addAttachment: (id, formData) => api.post(`/tickets/${id}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteAttachment: (id, attachmentId) => api.delete(`/tickets/${id}/attachments/${attachmentId}`),
  addPhoto: (id, formData) => api.post(`/tickets/${id}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deletePhoto: (id, photoId) => api.delete(`/tickets/${id}/photos/${photoId}`),
};

// Messages API
export const messagesAPI = {
  getByTicketId: (ticketId) => api.get(`/messages/${ticketId}`),
  send: (messageData) => api.post('/messages', messageData),
  delete: (id) => api.delete(`/messages/item/${id}`),
  addAttachment: (id, formData) => api.post(`/messages/${id}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// Files API
export const filesAPI = {
  download: (filename) => api.get(`/files/${filename}`, { responseType: 'blob' }),
};

export default api;
