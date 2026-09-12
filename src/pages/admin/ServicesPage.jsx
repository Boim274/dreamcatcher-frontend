import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Wrench,
  RotateCcw,
  CheckCircle2,
  Sliders,
  DollarSign,
  Tag,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const defaultOptionsConfig = {
  colors: ['Hitam', 'Putih', 'Abu-abu', 'Navy', 'Maroon'],
  sablon_types: ['Plastisol', 'DTF'],
  sizes: ['60x160cm', '80x200cm'],
  materials: ['Flexi Chinch', 'Vinyl'],
  positions: ['Dada Kiri', 'Dada Kanan', 'Punggung'],
};

const defaultPricingConfig = {
  plastisol: { lusin_1: 65000, lusin_2_6: 60000, satuan: 75000 },
  dtf: { satuan: 80000 },
};

export default function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    minimum_order: 1,
    is_active: true,
    pricing_type: 'flat',
    pricing_config: { ...defaultPricingConfig },
    options_config: { ...defaultOptionsConfig },
  });
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ search: '', pricing_type: '', is_active: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  useEffect(() => {
    const controller = new AbortController();
    fetchServices(controller.signal, 1);
    return () => controller.abort();
  }, [filters.pricing_type, filters.is_active]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') fetchServices(null, 1, { ...filters, [key]: value });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') fetchServices(null, 1, filters);
  };

  const handleResetFilters = () => {
    const reset = { search: '', pricing_type: '', is_active: '' };
    setFilters(reset);
    fetchServices(null, 1, reset);
  };

  const hasActiveFilters = Boolean(filters.search || filters.pricing_type || filters.is_active);

  const fetchServices = async (signal, page = 1, overrideFilters) => {
    try {
      const f = overrideFilters || filters;
      const params = { page };
      if (f.search) params.search = f.search;
      if (f.pricing_type) params.pricing_type = f.pricing_type;
      if (f.is_active) params.is_active = f.is_active;
      const result = await adminService.getServices(params, signal);
      setServices(result.data);
      setPagination(result.pagination);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service = null) => {
    if (service) {
      setEditingId(service.id);
      setForm({
        name: service.name,
        description: service.description || '',
        base_price: service.base_price,
        minimum_order: service.minimum_order,
        is_active: service.is_active,
        pricing_type: service.pricing_type || 'flat',
        pricing_config: service.pricing_config || { ...defaultPricingConfig },
        options_config: service.options_config || { ...defaultOptionsConfig },
      });
      setShowPricing(service.pricing_type === 'tiered');
    } else {
      setEditingId(null);
      setForm({
        name: '',
        description: '',
        base_price: '',
        minimum_order: 1,
        is_active: true,
        pricing_type: 'flat',
        pricing_config: { ...defaultPricingConfig },
        options_config: { ...defaultOptionsConfig },
      });
      setShowPricing(false);
    }
    setShowOptions(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.base_price) {
      toast.warning('Nama layanan dan harga dasar wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        base_price: parseFloat(form.base_price),
        minimum_order: parseInt(form.minimum_order) || 1,
      };
      if (editingId) {
        await adminService.updateService(editingId, data);
        toast.success('Layanan berhasil diperbarui');
      } else {
        await adminService.createService(data);
        toast.success('Layanan baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan layanan');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id) => {
    setConfirmDelete({ show: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await adminService.deleteService(id);
      toast.success('Layanan berhasil dihapus');
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus layanan');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await adminService.updateService(id, { is_active: !currentStatus });
      toast.success(currentStatus ? 'Layanan dinonaktifkan' : 'Layanan diaktifkan');
      fetchServices();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const updatePricingConfig = (sablonType, tier, value) => {
    setForm({
      ...form,
      pricing_config: {
        ...form.pricing_config,
        [sablonType]: {
          ...form.pricing_config[sablonType],
          [tier]: parseInt(value) || 0,
        },
      },
    });
  };

  const addSablonType = () => {
    const name = prompt('Nama jenis sablon (misal: rubber, foam, polyflex):');
    if (name && !form.pricing_config[name.toLowerCase()]) {
      setForm({
        ...form,
        pricing_config: {
          ...form.pricing_config,
          [name.toLowerCase()]: { lusin_1: 0, lusin_2_6: 0, satuan: 0 },
        },
      });
    }
  };

  const removeSablonType = (type) => {
    const newConfig = { ...form.pricing_config };
    delete newConfig[type];
    setForm({ ...form, pricing_config: newConfig });
  };

  const updateOptionsConfig = (key, values) => {
    setForm({
      ...form,
      options_config: {
        ...form.options_config,
        [key]: values,
      },
    });
  };

  const addOptionItem = (key) => {
    const value = prompt(`Tambah opsi untuk ${key}:`);
    if (value && value.trim()) {
      const current = form.options_config[key] || [];
      updateOptionsConfig(key, [...current, value.trim()]);
    }
  };

  const removeOptionItem = (key, index) => {
    const current = [...(form.options_config[key] || [])];
    current.splice(index, 1);
    updateOptionsConfig(key, current);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Layanan Sablon</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {pagination?.total || services.length} Total
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Kelola jenis sablon, skema harga bertingkat (tiered) atau flat, min order, dan opsi formulir pesanan kustom.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Tambah Layanan
          </button>
        </div>

        {/* Filter Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 lg:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari nama atau deskripsi layanan..."
                className="input-dark pl-10 pr-9 w-full"
              />
              {filters.search && (
                <button
                  onClick={() => {
                    handleFilter('search', '');
                    fetchServices(null, 1, { ...filters, search: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sm:col-span-3 lg:col-span-2">
              <select
                value={filters.pricing_type}
                onChange={(e) => handleFilter('pricing_type', e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Semua Tipe Harga</option>
                <option value="flat">Flat Price</option>
                <option value="tiered">Tiered (Bertingkat)</option>
              </select>
            </div>

            <div className="sm:col-span-3 lg:col-span-2">
              <select
                value={filters.is_active}
                onChange={(e) => handleFilter('is_active', e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Semua Status</option>
                <option value="1">Aktif Saja</option>
                <option value="0">Nonaktif Saja</option>
              </select>
            </div>

            <div className="sm:col-span-12 lg:col-span-2 flex items-center justify-end">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="w-full lg:w-auto px-3 py-2.5 rounded-xl border border-border hover:bg-ink text-gray hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} /> Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card border border-border/80 rounded-2xl">
            <LoadingSpinner size="lg" />
            <p className="text-gray text-xs mt-3">Memuat data layanan...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm">{service.name}</p>
                      <p className="text-gray text-xs line-clamp-2 mt-0.5">
                        {service.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        service.pricing_type === 'tiered'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-primary/15 text-primary border border-primary/30'
                      }`}
                    >
                      {service.pricing_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y border-border/60">
                    <div>
                      <span className="text-gray block text-[10px] uppercase">Harga Dasar</span>
                      <span className="text-primary font-bold text-sm">
                        {formatRupiah(service.base_price)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray block text-[10px] uppercase">Min. Order</span>
                      <span className="text-white font-medium">{service.minimum_order} pcs</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => toggleActive(service.id, service.is_active)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        service.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          service.is_active ? 'bg-emerald-400' : 'bg-slate-400'
                        }`}
                      />
                      {service.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openModal(service)}
                        className="p-2 rounded-xl bg-ink border border-border hover:border-primary/40 text-gray hover:text-white transition-colors"
                        title="Edit Layanan"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
                        className="p-2 rounded-xl bg-ink border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Layanan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {services.length === 0 && (
                <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-lg">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                    <Wrench size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada layanan ditemukan</h3>
                  <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                    {hasActiveFilters
                      ? 'Coba ubah kata kunci atau filter pencarian untuk melihat layanan lainnya.'
                      : 'Mulai dengan menambahkan jenis layanan sablon pertama Anda.'}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-ink/80 border-b border-border/80 text-[11px] font-semibold text-gray uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Layanan</th>
                      <th className="px-5 py-3.5">Harga Dasar</th>
                      <th className="px-5 py-3.5 text-center">Min. Order</th>
                      <th className="px-5 py-3.5 text-center">Tipe Skema</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-ink/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-ink border border-border flex items-center justify-center text-primary group-hover:border-primary/40 transition-colors flex-shrink-0">
                              <Wrench size={16} />
                            </div>
                            <div className="min-w-0 max-w-[280px]">
                              <p className="font-semibold text-white truncate">{service.name}</p>
                              <p className="text-gray text-xs truncate mt-0.5">
                                {service.description || 'Tidak ada deskripsi'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-primary">{formatRupiah(service.base_price)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-light font-medium">
                          {service.minimum_order} pcs
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${
                              service.pricing_type === 'tiered'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-primary/15 text-primary border border-primary/30'
                            }`}
                          >
                            <DollarSign size={12} />
                            {service.pricing_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => toggleActive(service.id, service.is_active)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 cursor-pointer ${
                              service.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20'
                            }`}
                            title="Klik untuk ubah status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                service.is_active ? 'bg-emerald-400' : 'bg-slate-400'
                              }`}
                            />
                            {service.is_active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(service)}
                              className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all shadow-sm"
                              title="Edit Layanan"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => deleteService(service.id)}
                              className="p-2 rounded-xl bg-card border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all shadow-sm"
                              title="Hapus Layanan"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {services.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <Wrench size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Tidak ada layanan ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                              ? 'Coba ganti kata kunci atau filter pencarian Anda.'
                              : 'Layanan sablon belum ditambahkan. Klik tombol "Tambah Layanan".'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/80 bg-ink/30 text-xs text-gray">
                  <p>
                    Menampilkan <span className="text-white font-medium">{services.length}</span> dari{' '}
                    <span className="text-white font-medium">{pagination.total}</span> layanan
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchServices(null, pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="p-2 rounded-xl bg-card border border-border text-gray-light hover:text-white hover:bg-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1 rounded-xl bg-card border border-border text-white font-semibold">
                      {pagination.current_page} / {pagination.last_page}
                    </span>
                    <button
                      onClick={() => fetchServices(null, pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="p-2 rounded-xl bg-card border border-border text-gray-light hover:text-white hover:bg-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal: Tambah / Edit Layanan */}
        {showModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card border border-border/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 transform transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/80 bg-ink/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl text-white tracking-[0.5px]">
                      {editingId ? 'Edit Layanan Sablon' : 'Tambah Layanan Baru'}
                    </h3>
                    <p className="text-gray text-xs mt-0.5">
                      {editingId ? 'Perbarui konfigurasi tarif dan opsi pesanan' : 'Konfigurasi jenis sablon baru dan aturan biayanya'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-ink text-gray hover:text-white rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Nama Layanan <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-dark w-full"
                    placeholder="Contoh: Sablon Kaos Plastisol High Density"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Deskripsi Layanan
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-dark w-full resize-none"
                    rows={3}
                    placeholder="Jelaskan karakteristik hasil sablon, ketahanan cuci, atau instruksi pemesanan..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                      Harga Dasar (Rp) <span className="text-primary">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.base_price}
                      onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                      className="input-dark w-full"
                      placeholder="60000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                      Min. Order (Pcs) <span className="text-primary">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.minimum_order}
                      onChange={(e) => setForm({ ...form, minimum_order: e.target.value })}
                      className="input-dark w-full"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                      Skema Harga
                    </label>
                    <select
                      value={form.pricing_type}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, pricing_type: val });
                        if (val === 'tiered') setShowPricing(true);
                      }}
                      className="input-dark w-full"
                    >
                      <option value="flat">Flat Price</option>
                      <option value="tiered">Tiered (Bertingkat)</option>
                    </select>
                  </div>
                </div>

                {/* Konfigurasi Tiered Pricing */}
                {form.pricing_type === 'tiered' && (
                  <div className="border border-border/80 rounded-2xl p-4 bg-ink/30">
                    <button
                      type="button"
                      onClick={() => setShowPricing(!showPricing)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders size={14} /> Konfigurasi Harga Bertingkat (Tiered)
                      </span>
                      {showPricing ? (
                        <ChevronUp size={16} className="text-gray" />
                      ) : (
                        <ChevronDown size={16} className="text-gray" />
                      )}
                    </button>

                    {showPricing && (
                      <div className="mt-4 space-y-3.5">
                        {Object.entries(form.pricing_config).map(([type, prices]) => (
                          <div key={type} className="bg-card border border-border/80 rounded-xl p-3.5 shadow-sm">
                            <div className="flex items-center justify-between mb-2.5">
                              <p className="text-white font-semibold text-sm capitalize">{type}</p>
                              <button
                                type="button"
                                onClick={() => removeSablonType(type)}
                                className="text-rose-400 text-xs hover:underline"
                              >
                                Hapus
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2.5">
                              <div>
                                <label className="text-gray text-[10px] uppercase font-semibold block mb-1">
                                  1 Lusin (Rp)
                                </label>
                                <input
                                  type="number"
                                  value={prices.lusin_1 || ''}
                                  onChange={(e) => updatePricingConfig(type, 'lusin_1', e.target.value)}
                                  className="input-dark text-xs py-1.5 w-full"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="text-gray text-[10px] uppercase font-semibold block mb-1">
                                  2-6 Lusin (Rp)
                                </label>
                                <input
                                  type="number"
                                  value={prices.lusin_2_6 || ''}
                                  onChange={(e) => updatePricingConfig(type, 'lusin_2_6', e.target.value)}
                                  className="input-dark text-xs py-1.5 w-full"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="text-gray text-[10px] uppercase font-semibold block mb-1">
                                  Satuan (Rp)
                                </label>
                                <input
                                  type="number"
                                  value={prices.satuan || ''}
                                  onChange={(e) => updatePricingConfig(type, 'satuan', e.target.value)}
                                  className="input-dark text-xs py-1.5 w-full"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addSablonType}
                          className="text-primary text-xs font-semibold hover:underline flex items-center gap-1 pt-1"
                        >
                          <Plus size={14} /> Tambah Jenis Sablon Tiered
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Konfigurasi Opsi Dropdown */}
                <div className="border border-border/80 rounded-2xl p-4 bg-ink/30">
                  <button
                    type="button"
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-xs font-semibold text-gray uppercase tracking-wider flex items-center gap-1.5">
                      <Tag size={14} /> Pilihan Opsi Dropdown Pemesanan
                    </span>
                    {showOptions ? (
                      <ChevronUp size={16} className="text-gray" />
                    ) : (
                      <ChevronDown size={16} className="text-gray" />
                    )}
                  </button>

                  {showOptions && (
                    <div className="mt-4 space-y-4">
                      {Object.entries(form.options_config).map(([key, items]) => (
                        <div key={key} className="bg-card border border-border/60 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-gray text-[11px] uppercase font-semibold tracking-wider">
                              {key}
                            </label>
                            <button
                              type="button"
                              onClick={() => addOptionItem(key)}
                              className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
                            >
                              <Plus size={12} /> Tambah
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(items || []).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-ink border border-border text-white text-xs rounded-lg"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeOptionItem(key, idx)}
                                  className="text-gray hover:text-rose-400 ml-1 transition-colors"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                            {(items || []).length === 0 && (
                              <span className="text-gray text-xs italic">Belum ada pilihan</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary bg-ink border-border"
                    />
                    <span className="font-semibold text-white text-sm">Layanan Aktif & Dapat Dipesan</span>
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-border/80">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-ink text-gray-light hover:text-white transition-colors text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Simpan Layanan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={confirmDelete.show}
          onClose={() => setConfirmDelete({ show: false, id: null })}
          onConfirm={handleConfirmDelete}
          title="Hapus Layanan Sablon"
          message="Apakah Anda yakin ingin menghapus layanan ini? Seluruh riwayat opsi layanan terkait akan terpengaruh."
          confirmLabel="Ya, Hapus Layanan"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
