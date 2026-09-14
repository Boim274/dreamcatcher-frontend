import { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Link as LinkIcon,
  Star,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Search,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Check,
} from 'lucide-react';
import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

export default function PortfoliosPage() {
  const toast = useToast();
  const [portfolios, setPortfolios] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    service_id: '',
    is_featured: false,
    sort_order: 0,
  });
  const [imageMode, setImageMode] = useState('url');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);
  const [filters, setFilters] = useState({ search: '', service_id: '', is_featured: '' });

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [page, filters.service_id, filters.is_featured]);

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
    const reset = { search: '', service_id: '', is_featured: '' };
    setFilters(reset);
    setPage(1);
    fetchData(null, 1, reset);
  };

  const hasActiveFilters = Boolean(filters.search || filters.service_id || filters.is_featured);

  const fetchData = async (signal, pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p, per_page: 15 };
      if (f.search) params.search = f.search;
      if (f.service_id) params.service_id = f.service_id;
      if (f.is_featured) params.is_featured = f.is_featured;
      const result = await adminService.getPortfolios(params, signal);
      const svcRes = p === 1 ? await adminService.getServices({}, signal) : null;
      setPortfolios(result.data);
      setPagination(result.pagination);
      if (svcRes) setServices(svcRes.data);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (portfolio = null) => {
    if (portfolio) {
      setEditingId(portfolio.id);
      setForm({
        title: portfolio.title,
        description: portfolio.description || '',
        service_id: portfolio.service_id || '',
        is_featured: portfolio.is_featured,
        sort_order: portfolio.sort_order,
      });
      setImageUrl(portfolio.image_url || '');
      setImagePreview(getImageUrl(portfolio.image_url));
      setImageMode('url');
    } else {
      setEditingId(null);
      setForm({
        title: '',
        description: '',
        service_id: '',
        is_featured: false,
        sort_order: portfolios.length + 1,
      });
      setImageUrl('');
      setImagePreview('');
      setImageMode('url');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageMode('upload');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.warning('Judul karya portfolio wajib diisi');
      return;
    }
    setSaving(true);

    try {
      const useFormData = imageMode === 'upload' && imageFile;
      let data;

      if (useFormData) {
        data = new FormData();
        data.append('title', form.title);
        data.append('description', form.description || '');
        data.append('service_id', form.service_id || '');
        data.append('is_featured', form.is_featured ? '1' : '0');
        data.append('sort_order', form.sort_order);
        data.append('image', imageFile);
      } else {
        data = {
          title: form.title,
          description: form.description,
          service_id: form.service_id || null,
          is_featured: form.is_featured,
          sort_order: parseInt(form.sort_order) || 0,
          image_url: imageUrl,
        };
      }

      if (editingId) {
        await adminService.updatePortfolio(editingId, data);
      } else {
        await adminService.createPortfolio(data);
      }

      setShowModal(false);
      fetchData();
      toast.success(editingId ? 'Portfolio berhasil diperbarui' : 'Portfolio baru berhasil ditambahkan');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan portfolio');
    } finally {
      setSaving(false);
    }
  };

  const deletePortfolio = async (id) => {
    setConfirmDelete({ show: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await adminService.deletePortfolio(id);
      toast.success('Portfolio berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus portfolio');
    }
  };

  const toggleFeatured = async (id, current) => {
    try {
      await adminService.updatePortfolio(id, { is_featured: !current });
      fetchData();
      toast.success(!current ? 'Ditandai sebagai Featured di Beranda' : 'Status Featured dinonaktifkan');
    } catch (error) {
      toast.error('Gagal mengubah status featured');
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Koleksi Portfolio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {pagination.total} Total
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Kelola showcase foto hasil produksi sablon terbaik untuk dipamerkan di halaman galeri dan beranda utama.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Tambah Portfolio
          </button>
        </div>

        {/* Filter Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 lg:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari judul portfolio atau nama klien..."
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

            <div className="sm:col-span-3 lg:col-span-2">
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

            <div className="sm:col-span-3 lg:col-span-2">
              <select
                value={filters.is_featured}
                onChange={(e) => handleFilter('is_featured', e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Semua Sorotan</option>
                <option value="1">Featured Saja ⭐</option>
                <option value="0">Biasa Saja</option>
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
            <p className="text-gray text-xs mt-3">Memuat data portfolio...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {portfolios.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-ink border border-border/60 flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={getImageUrl(item.image_url)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-white text-sm truncate">{item.title}</p>
                        <button
                          onClick={() => toggleFeatured(item.id, item.is_featured)}
                          className="p-1 text-gray-dark hover:text-amber-400 transition-colors flex-shrink-0"
                          title="Toggle Featured"
                        >
                          <Star
                            size={16}
                            className={item.is_featured ? 'text-amber-400' : 'text-gray'}
                            fill={item.is_featured ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>
                      <p className="text-gray text-xs line-clamp-2 mt-0.5">
                        {item.description || 'Tidak ada deskripsi'}
                      </p>
                      <div className="mt-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-ink border border-border text-primary text-[10px] font-semibold">
                          {item.service?.name || 'Umum'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-gray text-xs font-mono">Urutan: #{item.sort_order}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 rounded-xl bg-ink border border-border hover:border-primary/40 text-gray hover:text-white transition-colors"
                        title="Edit Portfolio"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deletePortfolio(item.id)}
                        className="p-2 rounded-xl bg-ink border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Portfolio"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {portfolios.length === 0 && (
                <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-lg">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                    <ImageIcon size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada portfolio ditemukan</h3>
                  <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                    {hasActiveFilters
                      ? 'Coba ubah kata kunci atau filter pencarian untuk melihat item lainnya.'
                      : 'Koleksi galeri portfolio masih kosong. Tambahkan hasil karya pertama Anda.'}
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
                      <th className="px-5 py-3.5 w-16">Foto</th>
                      <th className="px-5 py-3.5">Judul & Dokumentasi</th>
                      <th className="px-5 py-3.5">Layanan</th>
                      <th className="px-5 py-3.5 text-center">Featured Beranda</th>
                      <th className="px-5 py-3.5 text-center">Urutan</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {portfolios.map((item) => (
                      <tr key={item.id} className="hover:bg-ink/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-ink border border-border/80 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 transition-colors">
                            {item.image_url ? (
                              <img
                                src={getImageUrl(item.image_url)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon size={20} className="text-gray" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="max-w-[280px]">
                            <p className="font-semibold text-white truncate">{item.title}</p>
                            <p className="text-gray text-xs truncate mt-0.5">
                              {item.description || 'Tidak ada deskripsi rincian'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            {item.service?.name || 'Umum'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => toggleFeatured(item.id, item.is_featured)}
                            className={`p-2 rounded-xl transition-all ${
                              item.is_featured
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                                : 'bg-ink border border-border text-gray hover:text-white'
                            }`}
                            title={item.is_featured ? 'Ditampilkan di Beranda (Klik untuk batalkan)' : 'Jadikan Featured di Beranda'}
                          >
                            <Star
                              size={16}
                              className={item.is_featured ? 'text-amber-400' : 'text-gray'}
                              fill={item.is_featured ? 'currentColor' : 'none'}
                            />
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
                              title="Edit Portfolio"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => deletePortfolio(item.id)}
                              className="p-2 rounded-xl bg-card border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all shadow-sm"
                              title="Hapus Portfolio"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {portfolios.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <ImageIcon size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Portfolio tidak ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                              ? 'Coba ganti kata kunci atau filter pencarian Anda.'
                              : 'Galeri portfolio masih kosong. Silakan klik tombol "Tambah Portfolio".'}
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
                    <span className="text-white font-medium">{pagination.total}</span> item
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

        {/* Modal: Tambah / Edit Portfolio */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-xl rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              {/* Ambient Glow Accent */}
              <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-primary/20 blur-3xl rounded-full" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/15 shrink-0">
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-[0.5px]">
                      {editingId ? 'Edit Karya Portfolio' : 'Tambah Karya Baru'}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {editingId ? 'Perbarui informasi foto dokumentasi karya' : 'Publikasikan hasil cetak sablon ke galeri publik'}
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
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Judul Karya / Nama Klien <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input-dark w-full"
                    placeholder="Contoh: Kaos Komunitas Bikers Nusantara (DTF Full Color)"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Deskripsi Karya
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-dark w-full resize-none"
                    rows={3}
                    placeholder="Ceritakan detail bahan kain yang digunakan, teknik sablon, atau kuantitas order..."
                  />
                </div>

                {/* Mode Gambar (Upload / URL) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-gray uppercase tracking-wider">
                      Foto Dokumentasi Hasil Sablon
                    </label>
                    <div className="flex gap-1 bg-ink p-0.5 rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setImageMode('upload')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                          imageMode === 'upload' ? 'bg-primary text-white' : 'text-gray hover:text-white'
                        }`}
                      >
                        <Upload size={12} className="inline mr-1" /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode('url')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                          imageMode === 'url' ? 'bg-primary text-white' : 'text-gray hover:text-white'
                        }`}
                      >
                        <LinkIcon size={12} className="inline mr-1" /> URL Link
                      </button>
                    </div>
                  </div>

                  {imageMode === 'upload' ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-primary/80 rounded-2xl p-6 text-center cursor-pointer bg-ink/30 transition-colors group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload size={24} className="mx-auto text-gray group-hover:text-primary transition-colors" />
                      <p className="text-xs text-white font-medium mt-2">
                        Klik untuk memilih gambar atau seret file ke sini
                      </p>
                      <p className="text-[11px] text-gray mt-0.5">PNG, JPG, WEBP hingga 5MB</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImagePreview(e.target.value);
                        }}
                        className="input-dark pl-10 w-full"
                        placeholder="https://example.com/foto-portfolio.jpg"
                      />
                    </div>
                  )}

                  {/* Preview Gambar */}
                  {imagePreview && (
                    <div className="mt-3 relative w-full h-44 rounded-xl overflow-hidden bg-ink border border-border">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                          setImageUrl('');
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500/90 text-white shadow hover:bg-rose-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                      Layanan Terkait
                    </label>
                    <select
                      value={form.service_id}
                      onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                      className="input-dark w-full"
                    >
                      <option value="">Umum (Semua Layanan)</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                      className="input-dark w-full"
                      min="0"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary bg-ink border-border"
                    />
                    <div>
                      <span className="font-semibold text-white text-sm flex items-center gap-1.5">
                        <Star size={14} className="text-amber-400" fill="currentColor" /> Tampilkan sebagai Featured di Beranda
                      </span>
                      <p className="text-gray text-[11px] mt-0.5">
                        Karya ini akan diutamakan pada slider atau showcase galeri utama.
                      </p>
                    </div>
                  </label>
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
                        <Check size={16} /> Simpan Portfolio
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
          title="Hapus Karya Portfolio"
          message="Apakah Anda yakin ingin menghapus foto portfolio ini? Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Ya, Hapus Portfolio"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
