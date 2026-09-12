import api from './api';

export const conversationService = {
  list: async ({ search = '', sort = 'newest', trashed = false } = {}) => {
    const response = await api.get('/conversations', {
      params: { search: search || undefined, sort, trashed: trashed ? 1 : 0 },
    });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  create: async ({ title = null, prompt = '' } = {}) => {
    const response = await api.post('/conversations', { title, prompt });
    return response.data;
  },

  update: async (id, { title, emoji, pinned } = {}) => {
    const response = await api.put(`/conversations/${id}`, { title, emoji, pinned });
    return response.data;
  },

  duplicate: async (id) => {
    const response = await api.post(`/conversations/${id}/duplicate`);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },

  restore: async (id) => {
    const response = await api.post(`/conversations/${id}/restore`);
    return response.data;
  },

  forceDestroy: async (id) => {
    const response = await api.delete(`/conversations/${id}/force`);
    return response.data;
  },
};
