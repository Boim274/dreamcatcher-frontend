import api from './api';

export const designService = {
  getQuota: async () => {
    const response = await api.get('/designs/quota');
    return response.data;
  },

  generate: async (prompt, count = 1, userSession = null, negativePrompt = null, conversationId = null, sablonType = null) => {
    const response = await api.post('/designs/generate', {
      prompt,
      count,
      user_session: userSession,
      negative_prompt: negativePrompt || null,
      conversation_id: conversationId || null,
      sablon_type: sablonType || null,
    });
    return response.data;
  },

  upload: async (file, userSession = null, prompt = null, conversationId = null, fromChat = false, sablonType = null) => {
    const formData = new FormData();
    formData.append('image', file);
    if (userSession) formData.append('user_session', userSession);
    if (prompt) formData.append('prompt', prompt);
    if (conversationId) formData.append('conversation_id', conversationId);
    if (fromChat) formData.append('from_chat', '1');
    if (sablonType) formData.append('sablon_type', sablonType);

    const response = await api.post('/designs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/designs/${id}`);
    return response.data;
  },

  list: async (userSession, conversationId = null, params = {}) => {
    const response = await api.get('/designs', {
      params: { user_session: userSession, conversation_id: conversationId || undefined, ...params },
    });
    return response.data;
  },

  validate: async (id) => {
    const response = await api.post(`/designs/${id}/validate`);
    return response.data;
  },

  enhance: async (id, sablonType = null) => {
    const response = await api.post(`/designs/${id}/enhance`, { sablon_type: sablonType || null });
    return response.data;
  },

  edit: async (id, instruction, count = 1, sablonType = null) => {
    const response = await api.post(`/designs/${id}/edit`, { instruction, count, sablon_type: sablonType || null });
    return response.data;
  },

  versions: async (id) => {
    const response = await api.get(`/designs/${id}/versions`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/designs/${id}`);
    return response.data;
  },
};