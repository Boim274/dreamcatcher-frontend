import api from './api';

const extractPaginated = (res, key) => {
  const data = res.data[key];
  return {
    data: data.data || data,
    pagination: {
      current_page: data.current_page,
      last_page: data.last_page,
      total: data.total,
      per_page: data.per_page,
    },
  };
};

export const adminService = {
  // Dashboard
  getDashboard: async (signal) => {
    const res = await api.get('/admin/dashboard', { signal });
    return res.data;
  },

  // Orders
  getOrders: async (params = {}, signal) => {
    const res = await api.get('/admin/orders', { params, signal });
    return extractPaginated(res, 'orders');
  },

  getOrder: async (id, signal) => {
    const res = await api.get(`/admin/orders/${id}`, { signal });
    return res.data.order;
  },

  updateOrderStatus: async (id, status, notes) => {
    const res = await api.patch(`/admin/orders/${id}/status`, { status, notes });
    return res.data;
  },

  // Payments
  getPayments: async (params = {}, signal) => {
    const res = await api.get('/admin/payments', { params, signal });
    return extractPaginated(res, 'payments');
  },

  verifyPayment: async (id, type) => {
    const endpoint = type === 'full' ? 'verify' : type === 'dp' ? 'verify-dp' : 'verify-pelunasan';
    const res = await api.patch(`/admin/payments/${id}/${endpoint}`);
    return res.data;
  },

  rejectPayment: async (id, notes) => {
    const res = await api.patch(`/admin/payments/${id}/reject`, { notes });
    return res.data;
  },

  // Products
  getProducts: async (params = {}, signal) => {
    const res = await api.get('/admin/products', { params, signal });
    return extractPaginated(res, 'products');
  },

  createProduct: async (formData) => {
    const res = await api.post('/admin/products', formData);
    return res.data;
  },

  updateProduct: async (id, formData) => {
    formData.append('_method', 'PUT');
    const res = await api.post(`/admin/products/${id}`, formData);
    return res.data;
  },

  deleteProduct: async (id) => {
    await api.delete(`/admin/products/${id}`);
  },

  // Categories
  getCategories: async (signal) => {
    const res = await api.get('/admin/categories', { signal });
    return res.data.categories || [];
  },

  createCategory: async (data) => {
    const res = await api.post('/admin/categories', data);
    return res.data;
  },

  updateCategory: async (id, data) => {
    const res = await api.put(`/admin/categories/${id}`, data);
    return res.data;
  },

  deleteCategory: async (id) => {
    await api.delete(`/admin/categories/${id}`);
  },

  // Services
  getServices: async (params = {}, signal) => {
    const res = await api.get('/admin/services', { params, signal });
    return extractPaginated(res, 'services');
  },

  createService: async (data) => {
    const res = await api.post('/admin/services', data);
    return res.data;
  },

  updateService: async (id, data) => {
    const res = await api.put(`/admin/services/${id}`, data);
    return res.data;
  },

  deleteService: async (id) => {
    await api.delete(`/admin/services/${id}`);
  },

  // Sizes
  getSizes: async (params = {}, signal) => {
    const res = await api.get('/admin/sizes', { params, signal });
    return extractPaginated(res, 'sizes');
  },

  createSize: async (data) => {
    const res = await api.post('/admin/sizes', data);
    return res.data;
  },

  updateSize: async (id, data) => {
    const res = await api.put(`/admin/sizes/${id}`, data);
    return res.data;
  },

  deleteSize: async (id) => {
    await api.delete(`/admin/sizes/${id}`);
  },

  // Colors
  getColors: async (params = {}, signal) => {
    const res = await api.get('/admin/colors', { params, signal });
    return extractPaginated(res, 'colors');
  },

  createColor: async (data) => {
    const res = await api.post('/admin/colors', data);
    return res.data;
  },

  updateColor: async (id, data) => {
    const res = await api.put(`/admin/colors/${id}`, data);
    return res.data;
  },

  deleteColor: async (id) => {
    await api.delete(`/admin/colors/${id}`);
  },

  // Portfolios
  getPortfolios: async (params = {}, signal) => {
    const res = await api.get('/admin/portfolios', { params, signal });
    return extractPaginated(res, 'portfolios');
  },

  createPortfolio: async (data) => {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await api.post('/admin/portfolios', data, config);
    return res.data;
  },

  updatePortfolio: async (id, data) => {
    const isFormData = data instanceof FormData;
    if (isFormData) data.append('_method', 'PUT');
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await api[isFormData ? 'post' : 'put'](`/admin/portfolios/${id}`, data, config);
    return res.data;
  },

  deletePortfolio: async (id) => {
    await api.delete(`/admin/portfolios/${id}`);
  },

  // Testimonials
  getTestimonials: async (params = {}, signal) => {
    const res = await api.get('/admin/testimonials', { params, signal });
    return extractPaginated(res, 'testimonials');
  },

  createTestimonial: async (formData) => {
    const res = await api.post('/admin/testimonials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateTestimonial: async (id, formData) => {
    formData.append('_method', 'PUT');
    const res = await api.post(`/admin/testimonials/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteTestimonial: async (id) => {
    await api.delete(`/admin/testimonials/${id}`);
  },

  // Settings
  getSettings: async (signal) => {
    const res = await api.get('/admin/settings', { signal });
    return res.data.settings || [];
  },

  saveSettings: async (groupedSettings) => {
    for (const [, items] of Object.entries(groupedSettings)) {
      await api.put('/admin/settings', { settings: items });
    }
  },

  // Reports (same as dashboard with date filters)
  getReports: async (params = {}, signal) => {
    const res = await api.get('/admin/dashboard', { params, signal });
    return res.data;
  },

  // Users & Role Management
  getUsers: async (params = {}, signal) => {
    const res = await api.get('/admin/users', { params, signal });
    const paginated = extractPaginated(res, 'users');
    return {
      ...paginated,
      stats: res.data.stats || { total: paginated.pagination.total, admin_count: 0, customer_count: 0 },
    };
  },

  createUser: async (data) => {
    const res = await api.post('/admin/users', data);
    return res.data;
  },

  updateUser: async (id, data) => {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },

  updateUserRole: async (id, role) => {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  updateUserQuota: async (id, data) => {
    const res = await api.put(`/admin/users/${id}/quota`, data);
    return res.data;
  },
};

export default adminService;