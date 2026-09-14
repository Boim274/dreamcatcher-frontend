import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyThemeToDOM = (theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }
};

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'dark' ? 'light' : 'dark';
          applyThemeToDOM(next);
          return { theme: next };
        }),
    }),
    {
      name: 'admin-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDOM(state.theme);
        }
      },
    }
  )
);

// Initial call on load
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('admin-theme');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.state?.theme) {
        applyThemeToDOM(parsed.state.theme);
      }
    }
  } catch {
    // Ignore storage parse error
  }
}
