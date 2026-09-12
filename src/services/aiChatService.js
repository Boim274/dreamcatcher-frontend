import api from './api';

export const aiChatService = {
  sendMessage: async (message, userSession, conversationId = null, designId = null) => {
    const response = await api.post('/ai/chat', {
      message,
      user_session: userSession || null,
      conversation_id: conversationId || null,
      design_id: designId || null,
    });
    return response.data;
  },

  getHistory: async (userSession, conversationId = null) => {
    if (!userSession) return [];
    const response = await api.get('/ai/chat/history', {
      params: { user_session: userSession, conversation_id: conversationId || undefined },
    });
    return response.data?.messages || [];
  },

  getRecommendations: async () => {
    const response = await api.get('/ai/recommendations');
    return response.data?.catalog || {};
  },

  getSuggestions: async (shirtColor) => {
    const response = await api.get('/ai/recommendations/suggestions', {
      params: { shirt_color: shirtColor || null },
    });
    return response.data?.suggestions || [];
  },
};
