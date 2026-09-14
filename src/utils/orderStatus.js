import { ClipboardList, CreditCard, Clock, CheckCircle, Loader, Truck, PartyPopper } from 'lucide-react';

export const getStatusSteps = (language = 'id') => [
  { key: 'pending', label: language === 'en' ? 'Order Received' : 'Pesanan Diterima', description: language === 'en' ? 'Your order has been received and is awaiting admin confirmation.' : 'Pesanan Anda sudah diterima dan menunggu konfirmasi dari admin.', icon: ClipboardList },
  { key: 'waiting_payment', label: language === 'en' ? 'Awaiting Payment' : 'Menunggu Pembayaran', description: language === 'en' ? 'Please complete payment within 24 hours.' : 'Silakan lakukan pembayaran dalam 24 jam.', icon: CreditCard },
  { key: 'waiting_verification', label: language === 'en' ? 'Awaiting Verification' : 'Menunggu Verifikasi', description: language === 'en' ? 'Payment receipt received. Awaiting admin verification.' : 'Bukti pembayaran telah diterima. Menunggu verifikasi admin.', icon: Clock },
  { key: 'ready_to_process', label: language === 'en' ? 'Ready to Process' : 'Siap Diproses', description: language === 'en' ? 'Payment confirmed. Order will be processed soon.' : 'Pembayaran telah dikonfirmasi. Pesanan akan segera dikerjakan.', icon: CheckCircle },
  { key: 'processing', label: language === 'en' ? 'Processing' : 'Sedang Diproses', description: language === 'en' ? 'Team is producing your order. Estimated 3-5 business days.' : 'Tim sedang mengerjakan pesanan Anda. Estimasi 3-5 hari kerja.', icon: Loader },
  { key: 'ready_for_pickup', label: language === 'en' ? 'Shipped / Ready for Pickup' : 'Dikirim / Siap Diambil', description: language === 'en' ? 'Order is on delivery or ready for store pickup.' : 'Pesanan sedang dikirim atau siap diambil di toko.', icon: Truck },
  { key: 'completed', label: language === 'en' ? 'Completed' : 'Selesai', description: language === 'en' ? 'Order completed and successfully received.' : 'Pesanan telah selesai dan diterima dengan baik.', icon: PartyPopper },
];

export const statusSteps = getStatusSteps('id');

export const statusOrder = ['pending', 'waiting_payment', 'waiting_verification', 'ready_to_process', 'processing', 'ready_for_pickup', 'completed'];

export function getProgressPercent(status) {
  const idx = statusOrder.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / statusSteps.length) * 100);
}

export const getFilterTabs = (language = 'id') => [
  { key: 'all', label: language === 'en' ? 'All' : 'Semua' },
  { key: 'waiting_payment', label: language === 'en' ? 'Awaiting Payment' : 'Menunggu Bayar' },
  { key: 'pending', label: language === 'en' ? 'Pending' : 'Pending' },
  { key: 'waiting_verification', label: language === 'en' ? 'Verification' : 'Verifikasi' },
  { key: 'ready_to_process', label: language === 'en' ? 'Ready to Process' : 'Siap Proses' },
  { key: 'processing', label: language === 'en' ? 'Processing' : 'Diproses' },
  { key: 'ready_for_pickup', label: language === 'en' ? 'Ready for Pickup' : 'Siap Ambil' },
  { key: 'completed', label: language === 'en' ? 'Completed' : 'Selesai' },
  { key: 'cancel_requested', label: language === 'en' ? 'Cancellation' : 'Pembatalan' },
  { key: 'cancelled', label: language === 'en' ? 'Cancelled' : 'Dibatalkan' },
];

export const filterTabs = getFilterTabs('id');
