import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  loginWithGoogle: async (credential, accessToken) => {
    const payload = {};
    if (credential) payload.credential = credential;
    if (accessToken) payload.access_token = accessToken;
    const response = await api.post('/auth/google', payload);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Clean legacy global keys if any exist
      localStorage.removeItem('design-studio-state');
      localStorage.removeItem('mockup-config-last');
      localStorage.removeItem('order-storage');
      localStorage.removeItem('user_session');
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    if (response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  updateAvatar: async (fileOrFormData) => {
    let formData;
    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else {
      formData = new FormData();
      formData.append('avatar', fileOrFormData);
    }
    const response = await api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  deleteAvatar: async () => {
    const response = await api.delete('/auth/avatar');
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/auth/password', data);
    return response.data;
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },
};