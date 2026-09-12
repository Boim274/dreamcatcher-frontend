import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Ban, MessageCircle, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { formatRupiah } from '../../utils/formatRupiah';
import { waLink } from '../../constants/whatsapp';
import ConfirmDialog from '../ui/ConfirmDialog';
import TestimonialForm from './TestimonialForm';

const ActionButtons = memo(function ActionButtons({ order, onCancelSuccess, onTestimonialSuccess }) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = ['pending', 'waiting_payment', 'waiting_verification', 'ready_to_process'].includes(order.status);
  const testimonial = order.testimonial;

  const totalPaid = order.payments
    ?.filter(p => p.payment_status === 'verified' || p.payment_status === 'paid' || p.payment_status === 'dp')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const remaining = Math.max(order.total_price - totalPaid, 0);
  const hasDP = order.payments?.some(p => p.payment_type === 'dp' && (p.payment_status === 'verified' || p.payment_status === 'dp'));
  const needsPelunasan = remaining > 0 && hasDP && ['ready_for_pickup', 'completed'].includes(order.status);
  const paymentRejected = order.payment_status === 'rejected';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderService.requestCancel(order.id);
      setShowCancelDialog(false);
      if (onCancelSuccess) onCancelSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan pesanan');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 mt-4">
        {(order.status === 'waiting_payment' || paymentRejected) && (
          <Link
            to={`/pesan/pembayaran/${order.order_code}`}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <CreditCard className="w-4 h-4" /> {paymentRejected ? 'Upload Ulang' : 'Bayar Sekarang'}
          </Link>
        )}
        {paymentRejected && (
          <div className="w-full p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Pembayaran ditolak. Silakan upload ulang bukti pembayaran.
          </div>
        )}
        {canCancel && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-500/50 text-red-400 font-semibold rounded-xl hover:bg-red-500/10 transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <Ban className="w-4 h-4" /> Batalkan
          </button>
        )}
        <a
          href={waLink(`Halo Dreamcatcher, saya ingin menanyakan pesanan #${order.order_code}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]"
        >
          <MessageCircle className="w-4 h-4" /> Hubungi Admin
        </a>
        {order.status === 'completed' && (
          <button
            onClick={() => setShowTestimonial(true)}
            className={`flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-colors text-[13px] uppercase tracking-[1px] ${testimonial ? 'border-2 border-success/50 text-success hover:bg-success/10' : 'border-2 border-amber-400/50 text-amber-400 hover:bg-amber-400/10'}`}
          >
            {testimonial ? <CheckCircle className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            {testimonial ? 'Testimoni' : 'Beri Testimoni'}
          </button>
        )}
      </div>

      {needsPelunasan && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-amber-400 font-semibold text-sm">Sisa Pembayaran: {formatRupiah(remaining)}</p>
              <p className="text-gray-light text-xs mt-1">Silakan lunasi sisa pembayaran DP Anda.</p>
              <Link
                to={`/pesan/pembayaran/${order.order_code}?type=pelunasan`}
                className="inline-flex items-center gap-2 mt-3 bg-amber-400 text-ink font-semibold py-2 px-4 rounded-lg hover:bg-amber-300 transition-colors text-[12px] uppercase tracking-[1px]"
              >
                <CreditCard className="w-3.5 h-3.5" /> Lunasi Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Batalkan Pesanan"
        message="Apakah Anda yakin ingin membatalkan pesanan ini? Permintaan akan dikirim ke admin untuk dikonfirmasi."
        confirmLabel="Ya, Batalkan"
        variant="danger"
        loading={cancelling}
      />

      {showTestimonial && (
        <TestimonialForm
          order={order}
          existingTestimonial={testimonial}
          onClose={() => setShowTestimonial(false)}
          onSuccess={() => {
            setShowTestimonial(false);
            if (onTestimonialSuccess) onTestimonialSuccess();
          }}
        />
      )}
    </>
  );
}
export default ActionButtons;