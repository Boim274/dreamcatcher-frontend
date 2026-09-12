import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '../services/authService';

// Per-user storage key so each logged-in account keeps its own cart instead of
// a single shared (global) cart in localStorage.
const cartStorageKey = () => {
  const user = authService.getUser();
  return user?.id != null ? `cart-u${user.id}` : null;
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, size, color, quantity) {
        const items = get().items;
        const existing = items.findIndex(
          (i) => i.product.id === product.id && i.size === size && i.color === color
        );
        if (existing >= 0) {
          const updated = [...items];
          updated[existing] = {
            ...updated[existing],
            quantity: updated[existing].quantity + quantity,
          };
          set({ items: updated });
        } else {
          set({ items: [...items, { product, size, color, quantity }] });
        }
      },

      removeItem(index) {
        set({ items: get().items.filter((_, i) => i !== index) });
      },

      updateQuantity(index, quantity) {
        const items = get().items;
        if (quantity <= 0) {
          set({ items: items.filter((_, i) => i !== index) });
        } else {
          const updated = [...items];
          updated[index] = { ...updated[index], quantity };
          set({ items: updated });
        }
      },

      clearCart() {
        set({ items: [] });
      },

      getItemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getSubtotal() {
        return get().items.reduce((sum, i) => sum + parseFloat(i.product.base_price) * i.quantity, 0);
      },

      getTotal() {
        return get().getSubtotal();
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => ({
        getItem: () => (cartStorageKey() ? localStorage.getItem(cartStorageKey()) : null),
        setItem: (_name, value) => {
          const key = cartStorageKey();
          if (key) localStorage.setItem(key, value);
        },
        removeItem: () => {
          const key = cartStorageKey();
          if (key) localStorage.removeItem(key);
        },
      })),
    }
  )
);
