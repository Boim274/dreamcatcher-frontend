import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authService.login(email, password);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: () => {
    const user = authService.getUser();
    const isAuth = authService.isAuthenticated();
    set({ user, isAuthenticated: isAuth });
  },
}));