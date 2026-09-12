const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default API_BASE;