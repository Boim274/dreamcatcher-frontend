import { create } from 'zustand';
import { orderService } from '../services/orderService';
import { formatRupiah } from '../utils/formatRupiah';

const STORAGE_STATES_KEY = 'dreamcatcher_customer_order_states_v1';
const STORAGE_READ_NOTIFS_KEY = 'dreamcatcher_customer_read_notifs_v1';

export const useCustomerNotifStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  activePopups: [], // Real-time floating toast banners
  activeOrders: [],
  isLoading: false,
  lastFetchedAt: null,

  fetchNotifications: async (user) => {
    if (!user) {
      set({ notifications: [], unreadCount: 0, activePopups: [], activeOrders: [] });
      return;
    }

    try {
      const data = await orderService.getAll({ per_page: 50 });
      const orders = data.orders?.data || data.orders || [];

      // Read stored previous order status snapshot to detect transitions
      let prevStates = {};
      try {
        prevStates = JSON.parse(localStorage.getItem(`${STORAGE_STATES_KEY}_${user.id}`) || '{}');
      } catch {
        prevStates = {};
      }

      // Read read notifications list
      let readNotifs = [];
      try {
        readNotifs = JSON.parse(localStorage.getItem(`${STORAGE_READ_NOTIFS_KEY}_${user.id}`) || '[]');
      } catch {
        readNotifs = [];
      }

      const newPopups = [];
      const notifsList = [];
      const nextStates = {};

      const hasPreviousSnapshot = Object.keys(prevStates).length > 0;

      orders.forEach((order) => {
        const orderId = order.id;
        const prevStatus = prevStates[orderId]?.status;
        const prevPaymentStatus = prevStates[orderId]?.payment_status;

        nextStates[orderId] = {
          status: order.status,
          payment_status: order.payment_status,
          remaining_amount: order.remaining_amount,
        };

        // 1. Check for Completed Order
        if (order.status === 'completed') {
          const notifId = `completed-${order.id}`;
          notifsList.push({
            id: notifId,
            category: 'completed',
            type: 'completed',
            orderId: order.id,
            orderCode: order.order_code,
            title: 'Pesanan Selesai',
            message: `Pesanan #${order.order_code} telah selesai dikerjakan. Silakan cek histori pesanan untuk melihat detail ulasan.`,
            detail: formatRupiah(order.total_price),
            link: '/histori-pesanan',
            ctaLabel: 'Histori Pesanan',
            secondaryCta: order.testimonial ? null : 'Beri Testimoni',
            createdAt: order.updated_at || order.created_at,
            isRead: readNotifs.includes(notifId),
            badge: 'Selesai',
            badgeColor: 'emerald',
            iconType: 'completed',
          });

          // Trigger Live Alert if status just became completed
          if (hasPreviousSnapshot && prevStatus && prevStatus !== 'completed') {
            newPopups.push({
              id: `popup-${notifId}-${Date.now()}`,
              type: 'completed',
              title: 'Pesanan Telah Selesai',
              orderCode: order.order_code,
              message: `Pesanan #${order.order_code} telah selesai dikerjakan dengan rapi.`,
              link: '/histori-pesanan',
              ctaLabel: 'Lihat Histori',
              amount: formatRupiah(order.total_price),
            });
          }
        }

        // 2. Check for Payment Verified
        const isPaymentVerified =
          order.payment_status === 'paid' ||
          order.status === 'ready_to_process' ||
          order.status === 'processing' ||
          (order.payments && order.payments.some((p) => p.status === 'verified'));

        if (isPaymentVerified && order.status !== 'cancelled') {
          const notifId = `payment-verified-${order.id}`;
          notifsList.push({
            id: notifId,
            category: 'payment',
            type: 'payment_verified',
            orderId: order.id,
            orderCode: order.order_code,
            title: 'Pembayaran Terverifikasi',
            message: `Pembayaran untuk pesanan #${order.order_code} telah diverifikasi. Pesanan Anda siap diproses oleh workshop.`,
            detail: formatRupiah(order.total_price),
            link: '/pesanan-saya',
            ctaLabel: 'Lihat Pesanan',
            createdAt: order.updated_at || order.created_at,
            isRead: readNotifs.includes(notifId),
            badge: 'Lunas',
            badgeColor: 'primary',
            iconType: 'payment_verified',
          });

          // Trigger Live Alert if payment just got verified
          if (
            hasPreviousSnapshot &&
            ((prevPaymentStatus && prevPaymentStatus !== 'paid' && order.payment_status === 'paid') ||
              (prevStatus &&
                (prevStatus === 'waiting_payment' || prevStatus === 'waiting_verification') &&
                (order.status === 'ready_to_process' || order.status === 'processing')))
          ) {
            newPopups.push({
              id: `popup-${notifId}-${Date.now()}`,
              type: 'payment_verified',
              title: 'Pembayaran Terverifikasi',
              orderCode: order.order_code,
              message: `Pembayaran pesanan #${order.order_code} telah diverifikasi admin.`,
              link: '/pesanan-saya',
              ctaLabel: 'Lihat Pesanan',
              amount: formatRupiah(order.total_price),
            });
          }
        }

        // 3. Check for Processing Status
        if (order.status === 'processing') {
          const notifId = `processing-${order.id}`;
          notifsList.push({
            id: notifId,
            category: 'process',
            type: 'processing',
            orderId: order.id,
            orderCode: order.order_code,
            title: 'Proses Produksi Sablon',
            message: `Pesanan #${order.order_code} sedang dikerjakan oleh tim workshop sablon.`,
            detail: `${order.items?.length || 1} Item`,
            link: '/pesanan-saya',
            ctaLabel: 'Pantau Pengerjaan',
            createdAt: order.updated_at || order.created_at,
            isRead: readNotifs.includes(notifId),
            badge: 'Diproduksi',
            badgeColor: 'amber',
            iconType: 'processing',
          });

          if (hasPreviousSnapshot && prevStatus && prevStatus !== 'processing') {
            newPopups.push({
              id: `popup-${notifId}-${Date.now()}`,
              type: 'processing',
              title: 'Pesanan Mulai Diproduksi',
              orderCode: order.order_code,
              message: `Pesanan #${order.order_code} saat ini sedang dalam pengerjaan sablon.`,
              link: '/pesanan-saya',
              ctaLabel: 'Pantau Status',
            });
          }
        }

        // 4. Check for Shipped / Ready for Pickup
        if (order.status === 'ready_for_pickup' || order.status === 'shipped') {
          const isPickup = order.status === 'ready_for_pickup';
          const notifId = `ready-${order.id}`;
          notifsList.push({
            id: notifId,
            category: 'process',
            type: 'shipped',
            orderId: order.id,
            orderCode: order.order_code,
            title: isPickup ? 'Pesanan Siap Diambil' : 'Pesanan Sedang Dikirim',
            message: isPickup
              ? `Pesanan #${order.order_code} telah selesai dan siap diambil di toko Dreamcatcher.`
              : `Pesanan #${order.order_code} dalam pengiriman.${
                  order.tracking_number ? ' Resi: ' + order.tracking_number : ''
                }`,
            detail: formatRupiah(order.total_price),
            link: '/pesanan-saya',
            ctaLabel: isPickup ? 'Lokasi Pengambilan' : 'Lacak Resi',
            createdAt: order.updated_at || order.created_at,
            isRead: readNotifs.includes(notifId),
            badge: isPickup ? 'Siap Ambil' : 'Pengiriman',
            badgeColor: 'purple',
            iconType: 'shipped',
          });

          if (hasPreviousSnapshot && prevStatus && prevStatus !== order.status) {
            newPopups.push({
              id: `popup-${notifId}-${Date.now()}`,
              type: 'shipped',
              title: isPickup ? 'Pesanan Siap Diambil' : 'Pesanan Sedang Dikirim',
              orderCode: order.order_code,
              message: isPickup
                ? `Pesanan #${order.order_code} sudah dapat diambil di studio.`
                : `Pesanan #${order.order_code} sedang dalam perjalanan.`,
              link: '/pesanan-saya',
              ctaLabel: 'Lihat Detail',
            });
          }
        }

        // 5. Check for DP Remaining
        if (order.payment_status === 'dp' && (order.remaining_amount ?? 0) > 0 && order.status !== 'cancelled') {
          const notifId = `dp-alert-${order.id}`;
          notifsList.push({
            id: notifId,
            category: 'payment',
            type: 'dp_remaining',
            orderId: order.id,
            orderCode: order.order_code,
            title: 'Sisa Pembayaran DP',
            message: `Pesanan #${order.order_code} memiliki sisa pembayaran sebesar ${formatRupiah(
              order.remaining_amount
            )}. Silakan lakukan pelunasan sebelum pengambilan.`,
            detail: `Sisa: ${formatRupiah(order.remaining_amount)}`,
            link: '/pesanan-saya',
            ctaLabel: 'Pelunasan',
            createdAt: order.updated_at || order.created_at,
            isRead: readNotifs.includes(notifId),
            badge: 'Sisa DP',
            badgeColor: 'rose',
            iconType: 'dp_remaining',
          });
        }
      });

      // Sort notifications by latest
      notifsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Save latest snapshot to localStorage
      localStorage.setItem(`${STORAGE_STATES_KEY}_${user.id}`, JSON.stringify(nextStates));

      // Active active non-completed / non-cancelled orders for quick tracker
      const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');

      // Count unread
      const unreadCount = notifsList.filter((n) => !n.isRead).length;

      // Merge newly triggered popups with existing active popups
      set((state) => {
        const existingPopupIds = state.activePopups.map((p) => p.id);
        const uniqueNewPopups = newPopups.filter((p) => !existingPopupIds.includes(p.id));
        return {
          notifications: notifsList,
          unreadCount,
          activeOrders,
          activePopups: [...state.activePopups, ...uniqueNewPopups],
          lastFetchedAt: Date.now(),
        };
      });
    } catch {
      // silent on network error
    }
  },

  markAsRead: (notifId, userId) => {
    if (!userId) return;
    let readNotifs;
    try {
      readNotifs = JSON.parse(localStorage.getItem(`${STORAGE_READ_NOTIFS_KEY}_${userId}`) || '[]');
    } catch {
      readNotifs = [];
    }

    if (!readNotifs.includes(notifId)) {
      readNotifs.push(notifId);
      localStorage.setItem(`${STORAGE_READ_NOTIFS_KEY}_${userId}`, JSON.stringify(readNotifs));
    }

    set((state) => {
      const updatedNotifs = state.notifications.map((n) =>
        n.id === notifId ? { ...n, isRead: true } : n
      );
      const unreadCount = updatedNotifs.filter((n) => !n.isRead).length;
      return { notifications: updatedNotifs, unreadCount };
    });
  },

  markAllAsRead: (userId) => {
    if (!userId) return;
    const allIds = get().notifications.map((n) => n.id);
    localStorage.setItem(`${STORAGE_READ_NOTIFS_KEY}_${userId}`, JSON.stringify(allIds));

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  dismissPopup: (popupId) => {
    set((state) => ({
      activePopups: state.activePopups.filter((p) => p.id !== popupId),
    }));
  },
}));
