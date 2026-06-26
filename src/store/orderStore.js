import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

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
const initialPrintArea = { position: null, printSize: null, design: { ...initialDesign } };
const initialCustomer = {
  name: '',
  email: '',
  phone: '',
  address: '',
  deliveryMethod: 'pickup',
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

      setServices: (services) => set({ services }),

      selectService: (service) => {
        const sizes = service?.options_config?.sizes || [];
        const sizeQuantities = {};
        sizes.forEach((s) => { sizeQuantities[s] = 0; });
        set({
          selectedService: service,
          config: {},
          sizeQuantities,
          quantity: 0,
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
        newAreas[index] = { ...newAreas[index], printSize };
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

        if (selectedService.pricing_type === 'flat') {
          return parseFloat(selectedService.base_price) || 0;
        }

        const pricingConfig = selectedService.pricing_config || {};
        const sablonType = config.sablonType || '';
        const typeConfig = pricingConfig[sablonType.toLowerCase()] || {};

        if (quantity >= 24) {
          return parseFloat(typeConfig.lusin_2_6 || typeConfig.lusin_1 || selectedService.base_price) || 0;
        } else if (quantity >= 12) {
          return parseFloat(typeConfig.lusin_1 || selectedService.base_price) || 0;
        } else {
          return parseFloat(typeConfig.satuan || selectedService.base_price) || 0;
        }
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
        const sizes = selectedService.options_config?.sizes || [];
        return sizes
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
        return get().getSubtotal() + get().getShippingCost();
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
          const freshServices = response.data.services || [];
          set((state) => {
            const updates = { services: freshServices };
            if (state.selectedService) {
              const freshService = freshServices.find((s) => s.id === state.selectedService.id);
              if (freshService) {
                updates.selectedService = freshService;
                const sizes = freshService.options_config?.sizes || [];
                const newSQ = {};
                sizes.forEach((s) => { newSQ[s] = state.sizeQuantities[s] || 0; });
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
