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
  Palette,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const PRESET_COLORS = [
  { name: 'Hitam Jetblack', hex: '#0a0a0a' },
  { name: 'Putih Solid', hex: '#ffffff' },
  { name: 'Merah Crimson', hex: '#e11d48' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Forest Green', hex: '#15803d' },
  { name: 'Kuning Mustard', hex: '#ca8a04' },
  { name: 'Abu-abu Misty', hex: '#94a3b8' },
  { name: 'Maroon Burgundy', hex: '#881337' },
];

export default function ColorsPage() {
  const toast = useToast();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', hex_code: '#0a0a0a', is_active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', is_active: '' });
  const [copiedHex, setCopiedHex] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchColors(controller.signal);
    return () => controller.abort();
  }, [page, filters.is_active]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPage(1);
      fetchColors(null, 1, { ...filters, [key]: value });
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchColors(null, 1, filters);
    }
  };

  const handleResetFilters = () => {
    const reset = { search: '', is_active: '' };
    setFilters(reset);
    setPage(1);
    fetchColors(null, 1, reset);
  };

  const hasActiveFilters = Boolean(filters.search || filters.is_active);

  const fetchColors = async (signal, pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p };
      if (f.search) params.search = f.search;
      if (f.is_active) params.is_active = f.is_active;
      const result = await adminService.getColors(params, signal);
      setColors(result.data);
      setPagination(result.pagination);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (color = null) => {
    if (color) {
      setEditingId(color.id);
      setForm({
        name: color.name,
        hex_code: color.hex_code,
        is_active: color.is_active,
        sort_order: color.sort_order,
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        hex_code: '#0a0a0a',
        is_active: true,
        sort_order: colors.length + 1,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Nama warna wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await adminService.updateColor(editingId, form);
        toast.success('Warna berhasil diperbarui');
      } else {
        await adminService.createColor(form);
        toast.success('Warna baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchColors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan warna');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await adminService.deleteColor(id);
      toast.success('Warna berhasil dihapus');
      fetchColors();
    } catch (error) {
      toast.error('Gagal menghapus warna');
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await adminService.updateColor(id, { is_active: !current });
      fetchColors();
      toast.success(current ? 'Warna dinonaktifkan' : 'Warna diaktifkan');
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const copyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Warna Sablon & Bahan</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {pagination.total} Total
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Kelola palet warna tinta sablon dan pilihan warna kain kaos untuk simulasi mockup dan katalog.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Tambah Warna
          </button>
        </div>

        {/* Filter Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-8 lg:col-span-8 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari nama warna atau kode hex (#ffffff)..."
                className="input-dark pl-11 pr-9 w-full"
              />
              {filters.search && (
                <button
                  onClick={() => {
                    handleFilter('search', '');
                    fetchColors(null, 1, { ...filters, search: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sm:col-span-4 lg:col-span-2">
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
            <p className="text-gray text-xs mt-3">Memuat palet warna...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {colors.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-md"
                >
                  <div
                    className="w-12 h-12 rounded-xl border-2 border-border shadow-inner flex-shrink-0"
                    style={{ backgroundColor: item.hex_code }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                    <p className="text-gray text-xs font-mono mt-0.5">{item.hex_code}</p>
                    <div className="mt-1">
                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.is_active ? 'bg-emerald-400' : 'bg-slate-400'
                          }`}
                        />
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 rounded-xl bg-ink border border-border hover:border-primary/40 text-gray hover:text-white transition-colors"
                      title="Edit Warna"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ show: true, id: item.id })}
                      className="p-2 rounded-xl bg-ink border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Warna"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {colors.length === 0 && (
                <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-lg">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                    <Palette size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada warna ditemukan</h3>
                  <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                    {hasActiveFilters
                      ? 'Coba gunakan kata kunci lain untuk mencari warna.'
                      : 'Palet warna masih kosong. Tambahkan warna baru sekarang.'}
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
                      <th className="px-5 py-3.5 w-16 text-center">Swatch</th>
                      <th className="px-5 py-3.5">Nama Warna</th>
                      <th className="px-5 py-3.5">Kode Hex</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-center">Urutan</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {colors.map((item) => (
                      <tr key={item.id} className="hover:bg-ink/40 transition-colors group">
                        <td className="px-5 py-3.5 text-center">
                          <div
                            className="w-8 h-8 rounded-xl border-2 border-border/80 shadow-md mx-auto group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: item.hex_code }}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-white">{item.name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => copyHex(item.hex_code)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ink border border-border hover:border-primary/40 text-gray-light hover:text-white font-mono text-xs transition-colors"
                            title="Salin Kode Hex"
                          >
                            {copiedHex === item.hex_code ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} className="text-gray" />
                            )}
                            {item.hex_code}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => toggleActive(item.id, item.is_active)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 cursor-pointer ${
                              item.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20'
                            }`}
                            title="Klik untuk ubah status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active ? 'bg-emerald-400' : 'bg-slate-400'
                              }`}
                            />
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-light font-mono text-xs">
                          {item.sort_order}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all shadow-sm"
                              title="Edit Warna"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ show: true, id: item.id })}
                              className="p-2 rounded-xl bg-card border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all shadow-sm"
                              title="Hapus Warna"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {colors.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <Palette size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Warna tidak ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                              ? 'Coba ganti filter pencarian untuk melihat warna lainnya.'
                              : 'Belum ada warna yang didaftarkan. Klik tombol "Tambah Warna".'}
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
                    <span className="text-white font-medium">{pagination.total}</span> warna
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
        )}        {/* Modal: Tambah / Edit Warna */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-md rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              {/* Ambient Glow Accent */}
              <div
                className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 blur-3xl rounded-full opacity-30"
                style={{ backgroundColor: form.hex_code || '#ec4899' }}
              />
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-80"
                style={{ background: `linear-gradient(to right, transparent, ${form.hex_code || '#ec4899'}, transparent)` }}
              />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl border border-white/25 shadow-xl flex items-center justify-center shrink-0 transition-all duration-300"
                    style={{ backgroundColor: form.hex_code }}
                  >
                    <Palette size={20} className="text-white mix-blend-difference drop-shadow" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-[0.5px]">
                      {editingId ? 'Edit Warna' : 'Tambah Warna Baru'}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {editingId ? 'Perbarui informasi dan kode hex warna' : 'Daftarkan opsi warna baru ke sistem'}
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
                    Nama Warna <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    placeholder="Contoh: Merah Marun, Abu Misty, Forest Green"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Kode Warna (HEX) <span className="text-primary">*</span>
                  </label>
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <input
                        type="color"
                        value={form.hex_code}
                        onChange={(e) => setForm({ ...form, hex_code: e.target.value })}
                        className="w-12 h-12 rounded-xl border border-white/25 cursor-pointer bg-transparent shrink-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={form.hex_code}
                      onChange={(e) => setForm({ ...form, hex_code: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 font-mono text-xs uppercase focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      placeholder="#000000"
                      required
                    />
                  </div>
                </div>

                {/* Preset Colors */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Pilihan Cepat Warna Populer
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, name: p.name || preset.name, hex_code: preset.hex }))}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/50 text-[10px] text-zinc-300 transition-all text-left cursor-pointer hover:bg-white/5"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="truncate font-medium">{preset.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 rounded text-primary focus:ring-primary bg-[#0e0712] border-white/20 accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">Warna Aktif</span>
                    </label>
                  </div>
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
                        <Check size={16} /> Simpan Warna
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
          title="Hapus Master Warna"
          message="Apakah Anda yakin ingin menghapus warna ini? Pastikan warna ini tidak sedang digunakan pada katalog aktif."
          confirmLabel="Ya, Hapus Warna"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
