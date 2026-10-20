import { useState, useEffect, useMemo } from 'react';
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
  Baby,
  User,
  Layers,
  Sparkles,
} from 'lucide-react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const PRESET_GROUPS = [
  {
    id: 'dewasa',
    category: 'Dewasa',
    icon: User,
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50',
    items: [
      { name: 'S', dimensions: 'Lebar 40cm, Panjang 60cm' },
      { name: 'M', dimensions: 'Lebar 42cm, Panjang 62cm' },
      { name: 'L', dimensions: 'Lebar 44cm, Panjang 64cm' },
      { name: 'XL', dimensions: 'Lebar 46cm, Panjang 66cm' },
      { name: 'XXL', dimensions: 'Lebar 48cm, Panjang 68cm' },
      { name: 'XXXL', dimensions: 'Lebar 50cm, Panjang 70cm' },
    ],
  },
  {
    id: 'anak',
    category: 'Anak-anak',
    icon: Baby,
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50',
    items: [
      { name: 'Kids XS', dimensions: 'Usia 1-2 Thn (Lebar 31cm, Panjang 40cm)' },
      { name: 'Kids S', dimensions: 'Usia 3-4 Thn (Lebar 34cm, Panjang 44cm)' },
      { name: 'Kids M', dimensions: 'Usia 5-6 Thn (Lebar 37cm, Panjang 48cm)' },
      { name: 'Kids L', dimensions: 'Usia 7-8 Thn (Lebar 40cm, Panjang 53cm)' },
      { name: 'Kids XL', dimensions: 'Usia 9-10 Thn (Lebar 43cm, Panjang 57cm)' },
    ],
  },
  {
    id: 'cetak',
    category: 'Area Sablon / Cetak',
    icon: Layers,
    colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20 hover:border-sky-500/50',
    items: [
      { name: 'Logo / Dada', dimensions: '9 x 9 cm' },
      { name: 'A5', dimensions: '14.8 x 21 cm' },
      { name: 'A4', dimensions: '21 x 29.7 cm' },
      { name: 'A3', dimensions: '29.7 x 42 cm' },
      { name: 'A3+', dimensions: '32 x 48 cm' },
    ],
  },
];

const getSizeCategory = (name = '') => {
  const n = (name || '').toUpperCase().trim();
  if (n.startsWith('KIDS') || n.includes('ANAK') || n.includes('KID') || n.includes('BALITA') || n.includes('BAYI')) {
    return {
      type: 'kids',
      label: 'Anak-anak',
      icon: Baby,
      badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      boxClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    };
  }
  if (['A5', 'A4', 'A3', 'A3+', 'A2', 'LOGO'].some((k) => n.includes(k)) || n.includes('CETAK') || n.includes('SABLON') || n.includes('AREA')) {
    return {
      type: 'print',
      label: 'Area Cetak',
      icon: Layers,
      badgeClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      boxClass: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    };
  }
  return {
    type: 'adult',
    label: 'Dewasa',
    icon: User,
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    boxClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };
};

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
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 50 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', service_id: '' });
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'dewasa' | 'anak' | 'cetak'
  const [presetModalTab, setPresetModalTab] = useState('anak'); // default preset tab to help user add kids sizes

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
    setCategoryFilter('all');
    setPage(1);
    fetchData(null, 1, reset);
  };

  const hasActiveFilters = Boolean(filters.search || filters.service_id || categoryFilter !== 'all');

  const fetchData = async (signal, pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p, per_page: 50 };
      if (f.search) params.search = f.search;
      if (f.service_id) params.service_id = f.service_id;
      const result = await adminService.getSizes(params, signal);
      const svcRes = p === 1 ? await adminService.getServices({}, signal) : null;
      setSizes(result.data || []);
      setPagination(result.pagination || { current_page: 1, last_page: 1, total: 0, per_page: 50 });
      if (svcRes) setServices(svcRes.data || []);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch sizes:', error);
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
      const cat = getSizeCategory(item.name).type;
      if (cat === 'kids') setPresetModalTab('anak');
      else if (cat === 'print') setPresetModalTab('cetak');
      else setPresetModalTab('dewasa');
    } else {
      setEditingId(null);
      setForm({
        name: '',
        dimensions: '',
        service_id: '',
        sort_order: sizes.length + 1,
      });
      setPresetModalTab('anak');
    }
    setShowModal(true);
  };

  const handleApplyPreset = (preset, categoryId) => {
    const patch = {
      name: preset.name,
      dimensions: preset.dimensions,
    };
    // Auto-select Sablon Kaos for clothing if not already selected
    if (!form.service_id && (categoryId === 'dewasa' || categoryId === 'anak')) {
      const kaosSvc = services.find((s) => s.name?.toLowerCase().includes('kaos'));
      if (kaosSvc) {
        patch.service_id = kaosSvc.id;
      }
    }
    setForm((prev) => ({ ...prev, ...patch }));
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

  // Category counts and filtered list
  const categoryCounts = useMemo(() => {
    let adult = 0;
    let kids = 0;
    let print = 0;
    sizes.forEach((s) => {
      const cat = getSizeCategory(s.name).type;
      if (cat === 'adult') adult++;
      else if (cat === 'kids') kids++;
      else if (cat === 'print') print++;
    });
    return { all: sizes.length, adult, kids, print };
  }, [sizes]);

  const displayedSizes = useMemo(() => {
    return sizes.filter((item) => {
      if (categoryFilter === 'all') return true;
      const cat = getSizeCategory(item.name).type;
      if (categoryFilter === 'dewasa') return cat === 'adult';
      if (categoryFilter === 'anak') return cat === 'kids';
      if (categoryFilter === 'cetak') return cat === 'print';
      return true;
    });
  }, [sizes, categoryFilter]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Ukuran Apparel & Dimensi Cetak</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {sizes.length} Total
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Kelola master size chart apparel dewasa (S–XXXL), anak-anak (Kids XS–XL), serta area cetak (A4, A3).
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
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          {/* Quick Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-border/50">
            <span className="text-xs font-bold text-gray uppercase tracking-wider mr-1">Kategori:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-ink border border-border text-gray hover:text-white hover:border-white/20'
              }`}
            >
              Semua ({categoryCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('dewasa')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'dewasa'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-ink border border-border text-emerald-400/80 hover:text-emerald-400 hover:border-emerald-500/40'
              }`}
            >
              <User size={13} /> Dewasa ({categoryCounts.adult})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('anak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'anak'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-ink border border-border text-amber-400/90 hover:text-amber-400 hover:border-amber-500/40'
              }`}
            >
              <Baby size={13} /> Anak-anak ({categoryCounts.kids})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('cetak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'cetak'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-ink border border-border text-sky-400/80 hover:text-sky-400 hover:border-sky-500/40'
              }`}
            >
              <Layers size={13} /> Area Cetak ({categoryCounts.print})
            </button>
          </div>

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
              {displayedSizes.map((item) => {
                const cat = getSizeCategory(item.name);
                const CatIcon = cat.icon;
                return (
                  <div
                    key={item.id}
                    className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-md"
                  >
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${cat.boxClass}`}>
                      <CatIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white text-sm">{item.name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cat.badgeClass}`}>
                          <CatIcon size={9} />
                          {cat.label}
                        </span>
                        <span className="text-gray text-xs font-mono ml-auto">#{item.sort_order}</span>
                      </div>
                      <p className="text-gray text-xs mt-1 leading-snug">{item.dimensions || 'Dimensi belum diatur'}</p>
                      <div className="mt-1.5">
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
                );
              })}

              {displayedSizes.length === 0 && (
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
                      <th className="px-5 py-3.5">Kategori</th>
                      <th className="px-5 py-3.5">Dimensi / Ukuran Fisik</th>
                      <th className="px-5 py-3.5">Layanan Terkait</th>
                      <th className="px-5 py-3.5 text-center">Urutan</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {displayedSizes.map((item) => {
                      const cat = getSizeCategory(item.name);
                      const CatIcon = cat.icon;
                      return (
                        <tr key={item.id} className="hover:bg-ink/40 transition-colors group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors flex-shrink-0 ${cat.boxClass}`}>
                                <CatIcon size={16} />
                              </div>
                              <span className="font-bold text-white text-base tracking-wide">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cat.badgeClass}`}>
                              <CatIcon size={12} />
                              {cat.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-light font-medium">
                            {item.dimensions ? (
                              <span className="text-white/90">{item.dimensions}</span>
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
                            <span className="px-2 py-0.5 rounded-md bg-ink border border-border text-zinc-300">
                              #{item.sort_order}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openModal(item)}
                                className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all shadow-sm cursor-pointer"
                                title="Edit Ukuran"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ show: true, id: item.id })}
                                className="p-2 rounded-xl bg-card border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all shadow-sm cursor-pointer"
                                title="Hapus Ukuran"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {displayedSizes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <Ruler size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Ukuran tidak ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                              ? 'Coba ganti filter pencarian atau kategori untuk melihat ukuran lainnya.'
                              : 'Belum ada data ukuran. Silakan klik tombol "Tambah Ukuran".'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between p-4 border-t border-border/80 bg-ink/30 text-xs text-gray">
                <p>
                  Menampilkan <span className="text-white font-medium">{displayedSizes.length}</span> dari{' '}
                  <span className="text-white font-medium">{sizes.length}</span> ukuran total
                </p>
                {categoryFilter !== 'all' && (
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Tampilkan Semua Kategori
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal: Tambah / Edit Ukuran */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-lg rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
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
                      {editingId ? 'Perbarui spesifikasi dan dimensi ukuran' : 'Tambahkan ukuran dewasa, anak-anak, atau area sablon'}
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
                {/* Categorized Quick Presets */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} className="text-primary" /> Template Cepat Standar
                    </label>
                    <div className="flex items-center gap-1">
                      {PRESET_GROUPS.map((grp) => {
                        const GrpIcon = grp.icon;
                        const isActive = presetModalTab === grp.id;
                        return (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => setPresetModalTab(grp.id)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                              isActive
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'text-zinc-400 hover:text-white border border-transparent'
                            }`}
                          >
                            <GrpIcon size={11} /> {grp.category}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Preset Group Chips */}
                  {PRESET_GROUPS.filter((g) => g.id === presetModalTab).map((grp) => (
                    <div key={grp.id} className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {grp.items.map((preset) => {
                          const isSelected = form.name === preset.name;
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => handleApplyPreset(preset, grp.id)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30 font-bold'
                                  : grp.colorClass
                              }`}
                              title={preset.dimensions}
                            >
                              {preset.name}
                              {isSelected && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-zinc-400 italic">
                        *Klik pilihan di atas untuk mengisi Nama & Dimensi secara otomatis.
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Nama / Label Ukuran <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    placeholder="Contoh: Kids XS, Kids M, XL, A3..."
                    required
                    autoFocus
                  />
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
                    placeholder="Contoh: Usia 1-2 Thn (Lebar 31cm, Panjang 40cm)"
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
                    Pilih &apos;Sablon Kaos&apos; jika ukuran apparel khusus untuk kaos.
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
