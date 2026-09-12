import { ClipboardList, CreditCard, Clock, CheckCircle, Loader, Truck, PartyPopper } from 'lucide-react';

export const statusSteps = [
  { key: 'pending', label: 'Pesanan Diterima', description: 'Pesanan Anda sudah diterima dan menunggu konfirmasi dari admin.', icon: ClipboardList },
  { key: 'waiting_payment', label: 'Menunggu Pembayaran', description: 'Silakan lakukan pembayaran dalam 24 jam.', icon: CreditCard },
  { key: 'waiting_verification', label: 'Menunggu Verifikasi', description: 'Bukti pembayaran telah diterima. Menunggu verifikasi admin.', icon: Clock },
  { key: 'ready_to_process', label: 'Siap Diproses', description: 'Pembayaran telah dikonfirmasi. Pesanan akan segera dikerjakan.', icon: CheckCircle },
  { key: 'processing', label: 'Sedang Diproses', description: 'Tim sedang mengerjakan pesanan Anda. Estimasi 3-5 hari kerja.', icon: Loader },
  { key: 'ready_for_pickup', label: 'Dikirim / Siap Diambil', description: 'Pesanan sedang dikirim atau siap diambil di toko.', icon: Truck },
  { key: 'completed', label: 'Selesai', description: 'Pesanan telah selesai dan diterima dengan baik.', icon: PartyPopper },
];

export const statusOrder = ['pending', 'waiting_payment', 'waiting_verification', 'ready_to_process', 'processing', 'ready_for_pickup', 'completed'];

export function getProgressPercent(status) {
  const idx = statusOrder.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / statusSteps.length) * 100);
}

export const filterTabs = [
  { key: 'all', label: 'Semua' },
  { key: 'waiting_payment', label: 'Menunggu Bayar' },
  { key: 'pending', label: 'Pending' },
  { key: 'waiting_verification', label: 'Verifikasi' },
  { key: 'ready_to_process', label: 'Siap Proses' },
  { key: 'processing', label: 'Diproses' },
  { key: 'ready_for_pickup', label: 'Siap Ambil' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancel_requested', label: 'Pembatalan' },
  { key: 'cancelled', label: 'Dibatalkan' },
];
