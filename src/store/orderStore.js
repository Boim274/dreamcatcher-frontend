import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useOrderStore = create(
  persist(
    (set, get) => ({
      currentStep: 1,
      selectedService: null,
      productDetail: {
        quantity: 1,
        sizes: [],
        notes: '',
      },
      design: {
        id: null,
        imageUrl: null,
        isValid: false,
        validationMessage: null,
        type: null,
        prompt: null,
      },
      mockupImage: null,
      customerData: {
        name: '',
        email: '',
        phone: '',
        address: '',
        deliveryMethod: 'pickup',
      },
      orderResult: null,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 6) })),

      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      setSelectedService: (service) => set({ selectedService: service }),

      setProductDetail: (detail) => set((state) => ({
        productDetail: { ...state.productDetail, ...detail },
      })),

      setDesign: (design) => set((state) => ({
        design: { ...state.design, ...design },
      })),

      setMockupImage: (image) => set({ mockupImage: image }),

      setCustomerData: (data) => set((state) => ({
        customerData: { ...state.customerData, ...data },
      })),

      setOrderResult: (result) => set({ orderResult: result }),

      reset: () => set({
        currentStep: 1,
        selectedService: null,
        productDetail: {
          quantity: 1,
          sizes: [],
          notes: '',
        },
        design: {
          id: null,
          imageUrl: null,
          isValid: false,
          validationMessage: null,
          type: null,
          prompt: null,
        },
        mockupImage: null,
        customerData: {
          name: '',
          email: '',
          phone: '',
          address: '',
          deliveryMethod: 'pickup',
        },
        orderResult: null,
      }),

      getEstimatedPrice: () => {
        const { selectedService, productDetail } = get();
        if (!selectedService) return 0;
        return productDetail.quantity * selectedService.price_per_unit;
      },

      getTotalPrice: () => {
        const { selectedService, productDetail, customerData } = get();
        if (!selectedService) return 0;
        const subtotal = productDetail.quantity * selectedService.price_per_unit;
        const shipping = customerData.deliveryMethod === 'delivery' ? 15000 : 0;
        return subtotal + shipping;
      },
    }),
    {
      name: 'order-storage',
    }
  )
);