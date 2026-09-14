import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Ban, MessageCircle, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { formatRupiah } from '../../utils/formatRupiah';
import { waLink } from '../../constants/whatsapp';
import { useLanguageStore } from '../../store/languageStore';
import ConfirmDialog from '../ui/ConfirmDialog';
import TestimonialForm from './TestimonialForm';

const ActionButtons = memo(function ActionButtons({ order, onCancelSuccess, onTestimonialSuccess }) {
  const { language } = useLanguageStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = ['pending', 'waiting_payment', 'waiting_verification', 'ready_to_process'].includes(order.status);
  const testimonial = order.testimonial || order.user_testimonial;

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
      alert(err.response?.data?.message || (language === 'en' ? 'Failed to cancel order' : 'Gagal membatalkan pesanan'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 sm:gap-3.5 mt-5 flex-wrap sm:flex-nowrap items-stretch">
        {(order.status === 'waiting_payment' || paymentRejected) && (
          <Link
            to={`/pesan/pembayaran/${order.order_code}`}
            className="flex-1 flex items-center justify-center gap-2.5 bg-primary text-white font-bold py-3.5 px-5 rounded-xl hover:bg-primary-dark transition-all text-xs sm:text-[13px] uppercase tracking-wider shadow-md shadow-primary/20"
          >
            <CreditCard className="w-4 h-4 shrink-0" /> {paymentRejected ? (language === 'en' ? 'Re-upload' : 'Upload Ulang') : (language === 'en' ? 'Pay Now' : 'Bayar Sekarang')}
          </Link>
        )}
        {paymentRejected && (
          <div className="w-full p-3.5 sm:p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-danger text-xs sm:text-[13px] leading-relaxed my-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{language === 'en' ? 'Payment rejected. Please re-upload payment receipt.' : 'Pembayaran ditolak. Silakan upload ulang bukti pembayaran.'}</span>
          </div>
        )}
        {canCancel && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="flex items-center justify-center gap-2.5 px-4 sm:px-5 py-3.5 border-2 border-red-500/50 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-all text-xs sm:text-[13px] uppercase tracking-wider"
          >
            <Ban className="w-4 h-4 shrink-0" /> {language === 'en' ? 'Cancel' : 'Batalkan'}
          </button>
        )}
        <a
          href={waLink(language === 'en' ? `Hello Dreamcatcher, I would like to inquire about order #${order.order_code}` : `Halo Dreamcatcher, saya ingin menanyakan pesanan #${order.order_code}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 px-4 sm:px-5 py-3.5 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-xs sm:text-[13px] uppercase tracking-wider"
        >
          <MessageCircle className="w-4 h-4 shrink-0" /> {language === 'en' ? 'Contact Admin' : 'Hubungi Admin'}
        </a>
        {order.status === 'completed' && (
          <button
            onClick={() => setShowTestimonial(true)}
            className={`flex items-center justify-center gap-2.5 px-4 sm:px-5 py-3.5 font-bold rounded-xl transition-all text-xs sm:text-[13px] uppercase tracking-wider ${testimonial ? 'border-2 border-success/50 text-success hover:bg-success/10' : 'border-2 border-amber-400/50 text-amber-400 hover:bg-amber-400/10'}`}
          >
            {testimonial ? <CheckCircle className="w-4 h-4 shrink-0" /> : <Star className="w-4 h-4 shrink-0" />}
            {testimonial ? (language === 'en' ? 'View / Edit Testimonial' : 'Lihat / Ubah Testimoni') : (language === 'en' ? 'Give Testimonial' : 'Beri Testimoni')}
          </button>
        )}
      </div>

      {needsPelunasan && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 sm:p-5 mt-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-400 font-bold text-sm sm:text-base mb-1.5">
                {language === 'en' ? 'Remaining Balance: ' : 'Sisa Pembayaran: '}
                <span className="font-mono">{formatRupiah(remaining)}</span>
              </p>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-3.5">
                {language === 'en' ? 'Order is ready. Please complete your DP payment balance.' : 'Pesanan telah siap. Silakan lunasi sisa pembayaran DP Anda.'}
              </p>
              <Link
                to={`/pesan/pembayaran/${order.order_code}?type=pelunasan`}
                className="inline-flex items-center gap-2 py-2.5 px-5 bg-amber-400 text-ink font-bold rounded-xl hover:bg-amber-300 transition-colors text-xs uppercase tracking-wider shadow-md"
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" /> {language === 'en' ? 'Pay Now' : 'Lunasi Sekarang'}
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title={language === 'en' ? 'Cancel Order' : 'Batalkan Pesanan'}
        message={language === 'en' ? 'Are you sure you want to cancel this order? A request will be sent to admin for confirmation.' : 'Apakah Anda yakin ingin membatalkan pesanan ini? Permintaan akan dikirim ke admin untuk dikonfirmasi.'}
        confirmLabel={language === 'en' ? 'Yes, Cancel' : 'Ya, Batalkan'}
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
});
export default ActionButtons;