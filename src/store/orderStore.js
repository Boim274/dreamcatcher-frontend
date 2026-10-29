import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';
import { authService } from '../services/authService';

const orderStorageKey = () => {
  const user = authService.getUser();
  return user?.id != null ? `order-u${user.id}` : null;
};

const initialService = null;
const initialConfig = {};
const initialDesign = {
  id: null,
  imageUrl: null,
  isValid: false,
  validationMessage: null,
  type: null,
  prompt: null,
};
const initialPrintArea = { position: null, printSize: null, customWidth: '', customHeight: '', design: { ...initialDesign } };
const initialCustomer = {
  name: '',
  email: '',
  phone: '',
  address: '',
  deliveryMethod: 'pickup',
};

const parseConfig = (cfg) => {
  if (!cfg) return {};
  if (typeof cfg === 'string') {
    try {
      const parsed = JSON.parse(cfg);
      return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch (e) {
      return {};
    }
  }
  return cfg;
};

const normalizeService = (service) => {
  if (!service) return null;
  return {
    ...service,
    options_config: parseConfig(service.options_config),
    pricing_config: parseConfig(service.pricing_config),
  };
};

export const useOrderStore = create(
  persist(
    (set, get) => ({
      currentStep: 1,
      services: [],
      selectedService: initialService,
      config: initialConfig,
      sizeQuantities: {},
      quantity: 0,
      design: { ...initialDesign },
      printAreas: [{ ...initialPrintArea }],
      mockupImage: null,
      customerData: { ...initialCustomer },
      paymentMethod: 'transfer_bank',
      orderResult: null,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 6) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      setServices: (services) => set({ services: (services || []).map(normalizeService) }),

      selectService: (rawService) => {
        const service = normalizeService(rawService);
        const sizes = service?.options_config?.sizes || [];
        const sizeQuantities = {};
        sizes.forEach((s) => { sizeQuantities[s] = 0; });
        const isKaos = (service?.name || '').toLowerCase().includes('kaos');
        set((state) => {
          const existingShirtModel = state.config?.shirtModel;
          return {
            selectedService: service,
            config: {
              ...(isKaos
                ? {
                    shirtModel: existingShirtModel || 'Kaos Lengan Pendek',
                    shirtModelId: state.config?.shirtModelId || (existingShirtModel?.includes('Panjang') ? 'long_sleeve' : 'short_sleeve'),
                    shirtModelImage: state.config?.shirtModelImage || (existingShirtModel?.includes('Panjang') ? '/products/kaos-lengan-panjang.jpg' : '/products/kaos-lengan-pendek.jpg'),
                    shirtModelSurcharge: state.config?.shirtModelSurcharge || (existingShirtModel?.includes('Panjang') ? 5000 : 0),
                  }
                : {}),
            },
            sizeQuantities,
            quantity: 0,
          };
        });
      },

      setConfig: (data) => set((state) => ({
        config: { ...state.config, ...data },
      })),

      setSizeQuantity: (size, qty) => set((state) => {
        const newSQ = { ...state.sizeQuantities, [size]: Math.max(0, qty) };
        const totalQty = Object.values(newSQ).reduce((sum, q) => sum + q, 0);
        return { sizeQuantities: newSQ, quantity: totalQty };
      }),

      setQuantity: (qty) => set({ quantity: qty }),

      setDesign: (data) => set((state) => ({
        design: { ...state.design, ...data },
      })),

      setPrintAreaPosition: (index, position) => set((state) => {
        const newAreas = [...state.printAreas];
        newAreas[index] = { ...newAreas[index], position };
        return { printAreas: newAreas };
      }),

      setPrintAreaSize: (index, printSize) => set((state) => {
        const newAreas = [...state.printAreas];
        newAreas[index] = { ...newAreas[index], printSize, customWidth: '', customHeight: '' };
        return { printAreas: newAreas };
      }),

      setPrintAreaCustomSize: (index, customWidth, customHeight) => set((state) => {
        const newAreas = [...state.printAreas];
        const hasValues = customWidth && customHeight;
        newAreas[index] = {
          ...newAreas[index],
          printSize: hasValues ? `custom_${customWidth}x${customHeight}` : '_custom',
          customWidth,
          customHeight,
        };
        return { printAreas: newAreas };
      }),

      setAreaDesign: (index, designData) => set((state) => {
        const newAreas = [...state.printAreas];
        newAreas[index] = { ...newAreas[index], design: { ...newAreas[index].design, ...designData } };
        return { printAreas: newAreas };
      }),

      addPrintArea: () => set((state) => {
        if (state.printAreas.length >= 2) return state;
        return { printAreas: [...state.printAreas, { ...initialPrintArea }] };
      }),

      removePrintArea: (index) => set((state) => {
        if (state.printAreas.length <= 1) return state;
        const newAreas = state.printAreas.filter((_, i) => i !== index);
        return { printAreas: newAreas };
      }),

      getAreaCount: () => {
        return get().printAreas.length;
      },

      getAreaSurcharge: () => {
        const { selectedService, printAreas } = get();
        if (printAreas.length <= 1) return 0;
        return selectedService?.options_config?.area_surcharge || 15000;
      },

      setMockupImage: (image) => set({ mockupImage: image }),

      setCustomerData: (data) => set((state) => ({
        customerData: { ...state.customerData, ...data },
      })),

      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setOrderResult: (result) => set({ orderResult: result }),

      resetForm: () => set({
        currentStep: 1,
        selectedService: initialService,
        config: initialConfig,
        sizeQuantities: {},
        quantity: 0,
        design: { ...initialDesign },
        printAreas: [{ ...initialPrintArea }],
        mockupImage: null,
        customerData: { ...initialCustomer },
        paymentMethod: 'transfer_bank',
        orderResult: null,
      }),

      resetAll: () => set({
        currentStep: 1,
        selectedService: initialService,
        config: initialConfig,
        sizeQuantities: {},
        quantity: 0,
        design: { ...initialDesign },
        printAreas: [{ ...initialPrintArea }],
        mockupImage: null,
        customerData: { ...initialCustomer },
        paymentMethod: 'transfer_bank',
        orderResult: null,
      }),

      getBasePrice: () => {
        const { selectedService, config, quantity } = get();
        if (!selectedService) return 0;

        let base = 0;
        if (selectedService.pricing_type === 'flat') {
          base = parseFloat(selectedService.base_price) || 0;
        } else {
          const pricingConfig = selectedService.pricing_config || {};
          const sablonType = config.sablonType || '';
          const typeConfig = pricingConfig[sablonType.toLowerCase()] || {};

          if (quantity >= 24) {
            base = parseFloat(typeConfig.lusin_2_6 || typeConfig.lusin_1 || selectedService.base_price) || 0;
          } else if (quantity >= 12) {
            base = parseFloat(typeConfig.lusin_1 || selectedService.base_price) || 0;
          } else {
            base = parseFloat(typeConfig.satuan || selectedService.base_price) || 0;
          }
        }

        const isLongSleeve = config.shirtModelId === 'long_sleeve' || (config.shirtModel || '').toLowerCase().includes('panjang');
        const modelSurcharge = isLongSleeve ? (config.shirtModelSurcharge !== undefined ? config.shirtModelSurcharge : 7000) : 0;

        return base + modelSurcharge;
      },

      getSizePrice: (size) => {
        const basePrice = get().getBasePrice();
        const { selectedService } = get();
        const sizePricing = selectedService?.options_config?.size_pricing || {};
        const surcharge = parseInt(sizePricing[size]) || 0;
        return basePrice + surcharge;
      },

      getUnitPrice: () => {
        return get().getBasePrice();
      },

      getPriceBreakdown: () => {
        const { sizeQuantities, selectedService } = get();
        if (!selectedService) return [];
        const configSizes = selectedService.options_config?.sizes || [];
        const allSizes = Array.from(new Set([...configSizes, ...Object.keys(sizeQuantities || {})]));
        return allSizes
          .filter((size) => (sizeQuantities[size] || 0) > 0)
          .map((size) => {
            const qty = sizeQuantities[size] || 0;
            const unitPrice = get().getSizePrice(size);
            return { size, qty, unitPrice, subtotal: unitPrice * qty };
          });
      },

      getSubtotal: () => {
        const breakdown = get().getPriceBreakdown();
        return breakdown.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getTotalQuantity: () => {
        const { sizeQuantities } = get();
        return Object.values(sizeQuantities).reduce((sum, q) => sum + q, 0);
      },

      getShippingCost: () => {
        const { customerData } = get();
        return customerData.deliveryMethod === 'delivery' ? 15000 : 0;
      },

      getTotalPrice: () => {
        const subtotal = get().getSubtotal();
        const surcharge = get().getAreaSurcharge() * get().getTotalQuantity();
        return subtotal + surcharge + get().getShippingCost();
      },

      getDpAmount: () => {
        return Math.round(get().getTotalPrice() * 0.5);
      },

      getLusinanValidation: () => {
        const { config, quantity } = get();
        if (config.purchaseMethod !== 'Lusinan') return null;
        if (quantity === 0) return null;
        if (quantity < 12) return 'Minimal pemesanan lusinan adalah 12 pcs.';
        if (quantity % 12 !== 0) return 'Jumlah pemesanan lusinan harus kelipatan 12 pcs.';
        if (quantity > 72) return 'Maksimal pemesanan lusinan adalah 72 pcs (6 lusin).';
        return null;
      },

      fetchServices: async () => {
        try {
          const response = await api.get('/services');
          const rawServices = response.data.services || [];
          const freshServices = rawServices.map(normalizeService);
          set((state) => {
            const updates = { services: freshServices };
            if (state.selectedService) {
              const freshService = freshServices.find((s) => s.id === state.selectedService.id);
              if (freshService) {
                updates.selectedService = freshService;
                const sizes = freshService.options_config?.sizes || [];
                const allKeys = Array.from(new Set([...sizes, ...Object.keys(state.sizeQuantities || {})]));
                const newSQ = {};
                allKeys.forEach((s) => { newSQ[s] = state.sizeQuantities[s] || 0; });
                updates.sizeQuantities = newSQ;
                updates.quantity = Object.values(newSQ).reduce((sum, q) => sum + q, 0);
              }
            }
            return updates;
          });
        } catch (error) {
          console.error('Failed to fetch services:', error);
        }
      },
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => ({
        getItem: () => (orderStorageKey() ? localStorage.getItem(orderStorageKey()) : null),
        setItem: (_name, value) => {
          const key = orderStorageKey();
          if (key) localStorage.setItem(key, value);
        },
        removeItem: () => {
          const key = orderStorageKey();
          if (key) localStorage.removeItem(key);
        },
      })),
      partialize: (state) => ({
        selectedService: state.selectedService,
        config: state.config,
        sizeQuantities: state.sizeQuantities,
        quantity: state.quantity,
        design: state.design,
        printAreas: state.printAreas,
        mockupImage: state.mockupImage,
        customerData: state.customerData,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);

export const SHIPPING_COST = 15000;
export const DP_PERCENTAGE = 0.5;
