import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import { formatRupiah } from '../../utils/formatRupiah';
import Icon from '../ui/Icon';

const ACTIVE_STATUSES = [
  'pending', 'waiting_payment', 'waiting_verification',
  'ready_to_process', 'processing', 'ready_for_pickup', 'cancel_requested',
];

export default function DpPaymentAlert() {
  const { isAuthenticated } = useAuthStore();
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dp_alert_dismissed') || '[]'); } catch { return []; }
  });

  const checkDpOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await orderService.getAll({ status: ACTIVE_STATUSES });
      const orders = data.orders?.data || data.orders || [];
      const dpOrders = orders.filter(
        (o) => o.payment_status === 'dp' && (o.remaining_amount ?? 0) > 0
      );
      setAlerts(dpOrders);
    } catch {
      // silent
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    checkDpOrders();
    const interval = setInterval(checkDpOrders, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkDpOrders]);

  const dismiss = (orderId) => {
    const next = [...dismissed, orderId];
    setDismissed(next);
    sessionStorage.setItem('dp_alert_dismissed', JSON.stringify(next));
  };

  const visible = alerts.filter((a) => !dismissed.includes(a.id));

  if (!isAuthenticated || visible.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
      {visible.map((order) => (
        <Link
          key={order.id}
          to="/pesanan-saya"
          className="pointer-events-auto animate-blink-border flex items-start gap-3 px-4 py-3 bg-amber-500/10 border-2 border-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer no-underline min-w-[300px] max-w-[400px] animate-slide-in-right"
        >
          <Icon name="alert-triangle" size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">
              Tolong segera lunasi pembayaran!
            </p>
            <p className="text-gray text-xs mt-1">
              Order <span className="text-primary font-medium">#{order.order_code}</span>
              {' · '}{formatRupiah(order.remaining_amount)}
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(order.id); }}
            className="text-gray hover:text-white transition-colors shrink-0 mt-0.5"
          >
            <Icon name="x" size={14} />
          </button>
        </Link>
      ))}
    </div>
  );
}
