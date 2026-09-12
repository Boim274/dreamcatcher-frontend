const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    dotClass: 'bg-amber-400',
  },
  waiting_payment: {
    label: 'Menunggu Pembayaran',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    dotClass: 'bg-amber-400 animate-pulse',
  },
  waiting_verification: {
    label: 'Menunggu Verifikasi',
    className: 'bg-orange-500/10 text-orange-400 border border-orange-500/25',
    dotClass: 'bg-orange-400 animate-pulse',
  },
  ready_to_process: {
    label: 'Siap Diproses',
    className: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    dotClass: 'bg-sky-400',
  },
  ready_for_pickup: {
    label: 'Siap Diambil / Dikirim',
    className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25',
    dotClass: 'bg-cyan-400',
  },
  paid: {
    label: 'Lunas',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    dotClass: 'bg-emerald-400',
  },
  dp: {
    label: 'DP Terverifikasi',
    className: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    dotClass: 'bg-sky-400',
  },
  rejected: {
    label: 'Ditolak',
    className: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    dotClass: 'bg-rose-400',
  },
  processed: {
    label: 'Diproses',
    className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25',
    dotClass: 'bg-indigo-400 animate-pulse',
  },
  delivered: {
    label: 'Dikirim / Siap Diambil',
    className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25',
    dotClass: 'bg-cyan-400',
  },
  processing: {
    label: 'Sedang Diproses',
    className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25',
    dotClass: 'bg-indigo-400 animate-pulse',
  },
  completed: {
    label: 'Selesai',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    dotClass: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    dotClass: 'bg-rose-400',
  },
  cancel_requested: {
    label: 'Permintaan Batal',
    className: 'bg-orange-500/10 text-orange-400 border border-orange-500/25',
    dotClass: 'bg-orange-400 animate-pulse',
  },
  confirmed: {
    label: 'Dikonfirmasi',
    className: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    dotClass: 'bg-sky-400',
  },
  ready: {
    label: 'Siap Diambil',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    dotClass: 'bg-emerald-400',
  },
};

export function StatusBadge({ status, showDot = true, className = '' }) {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    className: 'bg-slate-500/10 text-slate-400 border border-slate-500/25',
    dotClass: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-full ${config.className} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
}
