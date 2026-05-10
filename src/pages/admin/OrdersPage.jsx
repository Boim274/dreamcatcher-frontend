import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      params.append('page', page);

      const response = await api.get(`/admin/orders?${params.toString()}`);
      setOrders(response.data.orders.data);
      setPagination({
        current_page: response.data.orders.current_page,
        last_page: response.data.orders.last_page,
        total: response.data.orders.total,
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Kelola Pesanan</h1>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                placeholder="Cari kode/nama/HP..."
                className="input-field pl-10"
              />
            </div>
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="input-field w-auto"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="waiting_payment">Menunggu Pembayaran</option>
            <option value="paid">Lunas</option>
            <option value="processed">Diproses</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Batal</option>
          </select>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilter('date_from', e.target.value)}
            className="input-field w-auto"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilter('date_to', e.target.value)}
            className="input-field w-auto"
          />
        </div>
      </div>

      {loading ? (
        <div className="card py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kode</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Layanan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                      {order.order_code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-text-secondary text-sm">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.items?.map((i) => i.service?.name).filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      Rp {order.total_price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/pesanan/${order.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-text-secondary text-sm">
                Menampilkan {orders.length} dari {pagination.total} pesanan
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchOrders(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg">
                  Halaman {pagination.current_page} dari {pagination.last_page}
                </span>
                <button
                  onClick={() => fetchOrders(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}