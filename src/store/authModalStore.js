import { create } from 'zustand';

export const useAuthModalStore = create((set) => ({
  isOpen: false,
  activeTab: 'login',

  openLogin: () => set({ isOpen: true, activeTab: 'login' }),
  openRegister: () => set({ isOpen: true, activeTab: 'register' }),
  setTab: (tab) => set({ activeTab: tab }),
  closeModal: () => set({ isOpen: false }),
}));
