import api from './api';

export const orderService = {
  create: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  track: async (orderCode, phone) => {
    const response = await api.get('/orders/track', {
      params: { order_code: orderCode, phone },
    });
    return response.data;
  },

  getByCode: async (orderCode) => {
    const response = await api.get(`/orders/by-code/${orderCode}`);
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  requestCancel: async (id, reason) => {
    const response = await api.post(`/orders/${id}/request-cancel`, { reason });
    return response.data;
  },
};