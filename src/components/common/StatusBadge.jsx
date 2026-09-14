import { useLanguageStore } from '../../store/languageStore';

const statusConfig = {
  pending: {
    labelId: 'Pending',
    labelEn: 'Pending',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    dotClass: 'bg-amber-400',
  },
  waiting_payment: {
    labelId: 'Menunggu Pembayaran',
    labelEn: 'Awaiting Payment',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    dotClass: 'bg-amber-400 animate-pulse',
  },
  waiting_verification: {
    labelId: 'Menunggu Verifikasi',
    labelEn: 'Awaiting Verification',
    className: 'bg-orange-500/10 text-orange-400 border border-orange-500/25',
    dotClass: 'bg-orange-400 animate-pulse',
  },
  ready_to_process: {
    labelId: 'Siap Diproses',
    labelEn: 'Ready to Process',
    className: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    dotClass: 'bg-sky-400',
  },
  ready_for_pickup: {
    labelId: 'Siap Diambil / Dikirim',
    labelEn: 'Shipped / Ready for Pickup',
    className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25',
    dotClass: 'bg-cyan-400',
  },
  paid: {
    labelId: 'Lunas',
    labelEn: 'Paid in Full',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    dotClass: 'bg-emerald-400',
  },
  dp: {
    labelId: 'DP Terverifikasi',
    labelEn: 'DP Verified',
    className: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    dotClass: 'bg-sky-400',
  },
  rejected: {
    labelId: 'Ditolak',
    labelEn: 'Rejected',
    className: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    dotClass: 'bg-rose-400',
  },
  processed: {
    labelId: 'Diproses',
    labelEn: 'Processed',
    className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25',
    dotClass: 'bg-indigo-400 animate-pulse',
  },
  delivered: {
    labelId: 'Dikirim / Siap Diambil',
    labelEn: 'Shipped / Ready for Pickup',
    className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25',
    dotClass: 'bg-cyan-400',
  },
  processing: {
    labelId: 'Sedang Diproses',
    labelEn: 'In Production',
    className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25',
    dotClass: 'bg-indigo-400 animate-pulse',
  },
  completed: {
    labelId: 'Selesai',
    labelEn: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    dotClass: 'bg-emerald-400',
  },
  cancelled: {
    labelId: 'Dibatalkan',
    labelEn: 'Cancelled',
    className: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    dotClass: 'bg-rose-400',
  },
  cancel_requested: {
    labelId: 'Permintaan Batal',
    labelEn: 'Cancellation Requested',
    className: 'bg-orange-500/10 text-orange-400 border border-orange-500/25',
    dotClass: 'bg-orange-400 animate-pulse',
  },
  confirmed: {
    labelId: 'Dikonfirmasi',
    labelEn: 'Confirmed',
    className: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    dotClass: 'bg-sky-400',
  },
  ready: {
    labelId: 'Siap Diambil',
    labelEn: 'Ready for Pickup',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    dotClass: 'bg-emerald-400',
  },
};

export function StatusBadge({ status, showDot = true, className = '' }) {
  const { language, td } = useLanguageStore();
  const config = statusConfig[status] || {
    labelId: status || 'Unknown',
    labelEn: status || 'Unknown',
    className: 'bg-slate-500/10 text-slate-400 border border-slate-500/25',
    dotClass: 'bg-slate-400',
  };

  const label = language === 'en'
    ? (config.labelEn || td(config.labelId))
    : config.labelId;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-full ${config.className} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />
      )}
      <span>{label}</span>
    </span>
  );
}

