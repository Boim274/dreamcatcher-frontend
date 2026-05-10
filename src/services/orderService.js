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

  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};