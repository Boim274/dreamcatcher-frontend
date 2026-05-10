const statusConfig = {
  pending: { label: 'Pending', className: 'badge-pending' },
  waiting_payment: { label: 'Menunggu Pembayaran', className: 'badge-waiting' },
  paid: { label: 'Lunas', className: 'badge-paid' },
  processed: { label: 'Diproses', className: 'badge-processed' },
  completed: { label: 'Selesai', className: 'badge-completed' },
  cancelled: { label: 'Batal', className: 'badge-cancelled' },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'badge-pending' };

  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}