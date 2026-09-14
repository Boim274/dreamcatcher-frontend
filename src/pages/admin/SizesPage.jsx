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
  ChevronLeft,
  ChevronRight,
  Ruler,
  Search,
  RotateCcw,
  CheckCircle2,
  Wrench,
  Check,
} from 'lucide-react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const PRESET_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'A4 (21x29cm)', 'A3 (29x42cm)'];

export default function SizesPage() {
  const toast = useToast();
  const [sizes, setSizes] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', dimensions: '', service_id: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', service_id: '' });

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [page, filters.service_id]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPage(1);
      fetchData(null, 1, { ...filters, [key]: value });
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchData(null, 1, filters);
    }
  };

  const handleResetFilters = () => {
    const reset = { search: '', service_id: '' };
    setFilters(reset);
    setPage(1);
    fetchData(null, 1, reset);
  };

  const hasActiveFilters = Boolean(filters.search || filters.service_id);

  const fetchData = async (signal, pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p };
      if (f.search) params.search = f.search;
      if (f.service_id) params.service_id = f.service_id;
      const result = await adminService.getSizes(params, signal);
      const svcRes = p === 1 ? await adminService.getServices({}, signal) : null;
      setSizes(result.data);
      setPagination(result.pagination);
      if (svcRes) setServices(svcRes.data);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name,
        dimensions: item.dimensions || '',
        service_id: item.service_id || '',
        sort_order: item.sort_order,
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        dimensions: '',
        service_id: '',
        sort_order: sizes.length + 1,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Nama ukuran wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, service_id: form.service_id || null };
      if (editingId) {
        await adminService.updateSize(editingId, data);
        toast.success('Ukuran berhasil diperbarui');
      } else {
        await adminService.createSize(data);
        toast.success('Ukuran baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan ukuran');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await adminService.deleteSize(id);
      toast.success('Ukuran berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus ukuran');
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Ukuran & Dimensi</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {pagination.total} Total
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Kelola master size chart kaos (S, M, L, XL), hoodie, serta ukuran dimensi area sablon (A4, A3, dst).
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Tambah Ukuran
          </button>
        </div>

        {/* Filter Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-7 lg:col-span-7 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari nama ukuran atau dimensi..."
                className="input-dark pl-11 pr-9 w-full"
              />
              {filters.search && (
                <button
                  onClick={() => {
                    handleFilter('search', '');
                    fetchData(null, 1, { ...filters, search: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sm:col-span-5 lg:col-span-3">
              <select
                value={filters.service_id}
                onChange={(e) => handleFilter('service_id', e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Semua Layanan</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
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
            <p className="text-gray text-xs mt-3">Memuat data ukuran...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {sizes.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-md"
                >
                  <div className="w-11 h-11 rounded-xl bg-ink border border-border flex items-center justify-center text-primary flex-shrink-0">
                    <Ruler size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white text-sm">{item.name}</p>
                      <span className="text-gray text-xs font-mono">#{item.sort_order}</span>
                    </div>
                    <p className="text-gray text-xs mt-0.5">{item.dimensions || 'Dimensi belum diatur'}</p>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-ink border border-border text-primary text-[10px] font-semibold">
                        {item.service?.name || 'Umum (Semua)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 rounded-xl bg-ink border border-border hover:border-primary/40 text-gray hover:text-white transition-colors"
                      title="Edit Ukuran"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ show: true, id: item.id })}
                      className="p-2 rounded-xl bg-ink border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Ukuran"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {sizes.length === 0 && (
                <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-lg">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                    <Ruler size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada ukuran ditemukan</h3>
                  <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                    {hasActiveFilters
                      ? 'Coba ganti filter atau kata kunci pencarian ukuran.'
                      : 'Master ukuran masih kosong. Tambahkan ukuran baru sekarang.'}
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
                      <th className="px-5 py-3.5">Ukuran</th>
                      <th className="px-5 py-3.5">Dimensi / Ukuran Fisik</th>
                      <th className="px-5 py-3.5">Layanan Terkait</th>
                      <th className="px-5 py-3.5 text-center">Urutan</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {sizes.map((item) => (
                      <tr key={item.id} className="hover:bg-ink/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-ink border border-border flex items-center justify-center text-primary group-hover:border-primary/40 transition-colors flex-shrink-0">
                              <Ruler size={16} />
                            </div>
                            <span className="font-semibold text-white">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-light font-medium">
                          {item.dimensions ? (
                            <span>{item.dimensions}</span>
                          ) : (
                            <span className="text-gray text-xs italic">Tidak ada spesifikasi</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            <Wrench size={12} />
                            {item.service?.name || 'Umum (Semua Layanan)'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-light font-mono text-xs">
                          {item.sort_order}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all shadow-sm"
                              title="Edit Ukuran"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ show: true, id: item.id })}
                              className="p-2 rounded-xl bg-card border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all shadow-sm"
                              title="Hapus Ukuran"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {sizes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <Ruler size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Ukuran tidak ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                              ? 'Coba ganti filter pencarian untuk melihat ukuran lainnya.'
                              : 'Belum ada data ukuran. Silakan klik tombol "Tambah Ukuran".'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/80 bg-ink/30 text-xs text-gray">
                  <p>
                    Menampilkan <span className="text-white font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span>–
                    <span className="text-white font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> dari{' '}
                    <span className="text-white font-medium">{pagination.total}</span> ukuran
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.current_page === 1}
                      className="p-2 rounded-xl bg-card border border-border text-gray-light hover:text-white hover:bg-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1 rounded-xl bg-card border border-border text-white font-semibold">
                      {pagination.current_page} / {pagination.last_page}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
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

        {/* Modal: Tambah / Edit Ukuran */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-md rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              {/* Ambient Glow Accent */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/15 shrink-0">
                    <Ruler size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-[0.5px]">
                      {editingId ? 'Edit Ukuran' : 'Tambah Ukuran Baru'}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {editingId ? 'Perbarui spesifikasi dan dimensi ukuran' : 'Tambahkan ukuran baru untuk katalog atau sablon'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Nama / Label Ukuran <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    placeholder="Contoh: S, M, L, XL, A3, A4..."
                    required
                    autoFocus
                  />
                </div>

                {/* Preset Chips */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Pilihan Cepat Standar
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SIZES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const isA = preset.includes('(');
                          const name = isA ? preset.split(' ')[0] : preset;
                          const dim = isA ? preset.match(/\((.*?)\)/)?.[1] || '' : '';
                          setForm((p) => ({ ...p, name, dimensions: dim || p.dimensions }));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/50 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer hover:bg-white/5"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Dimensi / Spesifikasi Fisik
                  </label>
                  <input
                    type="text"
                    value={form.dimensions}
                    onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    placeholder="Contoh: Lebar 50cm, Panjang 70cm atau 29x42 cm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Layanan Terkait (Opsional)
                  </label>
                  <select
                    value={form.service_id}
                    onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  >
                    <option value="">Umum (Semua Layanan)</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#120a16] text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-zinc-500 text-[11px] mt-1">
                    Biarkan kosong jika ukuran ini berlaku universal untuk semua jenis produk.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    min="0"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Simpan Ukuran
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
          onConfirm={handleDelete}
          title="Hapus Master Ukuran"
          message="Apakah Anda yakin ingin menghapus ukuran ini? Pastikan tidak sedang digunakan pada varian aktif."
          confirmLabel="Ya, Hapus Ukuran"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
