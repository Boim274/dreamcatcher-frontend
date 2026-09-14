import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
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

  register: async (formData) => {
    set({ isLoading: true });
    try {
      const data = await authService.register(formData);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async (credential, accessToken) => {
    set({ isLoading: true });
    try {
      const data = await authService.loginWithGoogle(credential, accessToken);
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
      set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const result = await authService.updateProfile(data);
    set({ user: result.user });
    return result;
  },

  updateAvatar: async (fileOrFormData) => {
    const result = await authService.updateAvatar(fileOrFormData);
    set({ user: result.user });
    return result;
  },

  deleteAvatar: async () => {
    const result = await authService.deleteAvatar();
    set({ user: result.user });
    return result;
  },

  changePassword: async (data) => {
    return await authService.changePassword(data);
  },

  refreshUser: async () => {
    if (!authService.isAuthenticated()) return null;
    try {
      const data = await authService.getMe();
      if (data?.user) {
        set({ user: data.user, isAuthenticated: true });
        return data.user;
      }
    } catch (err) {
      if (err.response?.status === 401) {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    return null;
  },

  checkAuth: () => {
    const user = authService.getUser();
    const isAuth = authService.isAuthenticated();
    set({ user, isAuthenticated: isAuth, isInitialized: true });

    if (isAuth) {
      authService.getMe()
        .then((data) => {
          if (data?.user) {
            set({ user: data.user, isAuthenticated: true });
          }
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
          }
        });
    }
  },
}));