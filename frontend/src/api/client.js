import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API_BASE,
});

// Add JWT token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;

// API methods
export const auth = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  getMe: () => client.get('/auth/me'),
};

export const drive = {
  getItems: (params) => client.get('/drive/items', { params }),
};

export const folders = {
  create: (data) => client.post('/folders', data),
};

export const files = {
  upload: (file, folderId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    return client.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  download: (fileId) => client.get(`/files/${fileId}/download`, { responseType: 'blob' }),
  preview: (fileId) => client.get(`/files/${fileId}/preview`),
};

export const items = {
  update: (itemId, data) => client.patch(`/items/${itemId}`, data),
  delete: (itemId, permanent = false) => client.delete(`/items/${itemId}`, { params: { permanent } }),
  restore: (itemId) => client.post(`/items/${itemId}/restore`),
};

export const shares = {
  create: (data) => client.post('/shares', data),
  getShares: (itemId) => client.get(`/shares/${itemId}`),
  delete: (shareId) => client.delete(`/shares/${shareId}`),
};

export const comments = {
  create: (data) => client.post('/comments', data),
  getComments: (fileId) => client.get(`/comments/${fileId}`),
};

export const activities = {
  get: (params) => client.get('/activities', { params }),
};

export const storage = {
  get: () => client.get('/storage'),
};
