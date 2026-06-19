const statusConfig = {
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  waiting_payment: { label: 'Menunggu Pembayaran', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  paid: { label: 'Lunas', className: 'bg-[#c8f000]/20 text-[#c8f000] border border-[#c8f000]/30' },
  processed: { label: 'Diproses', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  completed: { label: 'Selesai', className: 'bg-[#c8f000]/20 text-[#c8f000] border border-[#c8f000]/30' },
  cancelled: { label: 'Batal', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  cancel_requested: { label: 'Menunggu Pembatalan', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  confirmed: { label: 'Dikonfirmasi', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  processing: { label: 'Diproses', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  ready: { label: 'Siap Diambil', className: 'bg-[#c8f000]/20 text-[#c8f000] border border-[#c8f000]/30' },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };

  return (
    <span className={`inline-block px-2 py-1 text-[11px] font-semibold tracking-wide uppercase rounded ${config.className}`}>
      {config.label}
    </span>
  );
}
