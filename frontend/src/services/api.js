import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Pets API
export const petsAPI = {
  getAll: (params) => api.get('/pets', { params }),
  getNearby: (params) => api.get('/pets/nearby', { params }),
  getById: (id) => api.get(`/pets/${id}`),
  getMyPets: () => api.get('/pets/user/my-pets'),
  create: (data) => {
    const formData = new FormData();

    // Append regular fields
    Object.keys(data).forEach((key) => {
      if (key === 'images') {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      } else if (key === 'location' || key === 'age' || key === 'healthInfo') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    return api.post('/pets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === 'images' && data.images) {
        data.images.forEach((image) => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      } else if (key === 'location' || key === 'age' || key === 'healthInfo') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    return api.put(`/pets/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateStatus: (id, status) => api.patch(`/pets/${id}/status`, { status }),
  delete: (id) => api.delete(`/pets/${id}`),
};

// Adoption API
export const adoptionAPI = {
  createRequest: (data) => api.post('/adoptions', data),
  getReceived: () => api.get('/adoptions/received'),
  getSent: () => api.get('/adoptions/sent'),
  updateStatus: (id, status) => api.patch(`/adoptions/${id}/status`, { status }),
  withdraw: (id) => api.delete(`/adoptions/${id}`),
};

export default api;
