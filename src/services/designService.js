import api from './api';

export const designService = {
  generate: async (prompt, userSession = null) => {
    const response = await api.post('/designs/generate', { prompt, user_session: userSession });
    return response.data;
  },

  upload: async (file, userSession = null, prompt = null) => {
    const formData = new FormData();
    formData.append('image', file);
    if (userSession) formData.append('user_session', userSession);
    if (prompt) formData.append('prompt', prompt);

    const response = await api.post('/designs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/designs/${id}`);
    return response.data;
  },

  validate: async (id) => {
    const response = await api.post(`/designs/${id}/validate`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/designs/${id}`);
    return response.data;
  },
};