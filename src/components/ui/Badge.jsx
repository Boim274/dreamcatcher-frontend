const statusConfig = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
  waiting_payment: { label: 'Menunggu Pembayaran', className: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Lunas', className: 'bg-blue-100 text-blue-700' },
  processed: { label: 'Diproses', className: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Selesai', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Batal', className: 'bg-red-100 text-red-700' },
};

export default function Badge({ status, className = '' }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}