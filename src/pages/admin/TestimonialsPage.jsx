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
  Star,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  MessageSquareQuote,
  User,
  Check,
} from 'lucide-react';
import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import OptimizedImage from '../../components/ui/OptimizedImage';

export default function TestimonialsPage() {
  const toast = useToast();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    rating: 5,
    review: '',
    is_active: true,
    sort_order: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);
  const [filters, setFilters] = useState({ search: '', is_active: '', min_rating: '' });

  const hasActiveFilters = Boolean(filters.search || filters.is_active || filters.min_rating);

  const fetchData = async (signal, pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p };
      if (f.search) params.search = f.search;
      if (f.is_active) params.is_active = f.is_active;
      if (f.min_rating) params.min_rating = f.min_rating;
      const result = await adminService.getTestimonials(params, signal);
      setTestimonials(result.data);
      setPagination(result.pagination);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [page, filters.is_active, filters.min_rating]);

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
    const reset = { search: '', is_active: '', min_rating: '' };
    setFilters(reset);
    setPage(1);
    fetchData(null, 1, reset);
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        customer_name: item.customer_name,
        rating: item.rating,
        review: item.review || '',
        is_active: item.is_active,
        sort_order: item.sort_order,
      });
      setImagePreview(getImageUrl(item.image_url));
    } else {
      setEditingId(null);
      setForm({
        customer_name: '',
        rating: 5,
        review: '',
        is_active: true,
        sort_order: testimonials.length + 1,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim()) {
      toast.warning('Nama customer wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append('customer_name', form.customer_name);
      data.append('rating', form.rating);
      data.append('review', form.review);
      data.append('is_active', form.is_active ? '1' : '0');
      data.append('sort_order', form.sort_order);
      if (imageFile) data.append('image', imageFile);

      if (editingId) {
        await adminService.updateTestimonial(editingId, data);
        toast.success('Testimoni berhasil diperbarui');
      } else {
        await adminService.createTestimonial(data);
        toast.success('Testimoni baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan testimoni');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await adminService.deleteTestimonial(id);
      toast.success('Testimoni berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus testimoni');
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await adminService.updateTestimonial(id, { is_active: !current });
      fetchData();
      toast.success(current ? 'Testimoni disembunyikan' : 'Testimoni ditampilkan');
    } catch (error) {
      toast.error('Gagal mengubah status testimoni');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={i <= rating ? 'text-amber-400' : 'text-gray-dark'}
            fill={i <= rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Ulasan & Testimoni</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {pagination.total} Total
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Kelola feedback ulasan pelanggan, rating kepuasan layanan sablon, dan moderasi tampil di landing page.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Tambah Testimoni
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
                placeholder="Cari nama pelanggan atau ulasan..."
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
                value={filters.is_active}
                onChange={(e) => handleFilter('is_active', e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Semua Status</option>
                <option value="1">Aktif Ditampilkan</option>
                <option value="0">Disembunyikan</option>
              </select>
            </div>

            <div className="sm:col-span-3 lg:col-span-2">
              <select
                value={filters.min_rating}
                onChange={(e) => handleFilter('min_rating', e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Semua Rating</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Bintang)</option>
                <option value="4">⭐⭐⭐⭐ (4+ Bintang)</option>
                <option value="3">⭐⭐⭐ (3+ Bintang)</option>
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
            <p className="text-gray text-xs mt-3">Memuat data ulasan...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-ink border border-border flex items-center justify-center text-primary flex-shrink-0">
                      {item.image_url ? (
                        <OptimizedImage
                          src={item.image_url}
                          variant="thumbnail"
                          alt={item.customer_name}
                          containerClassName="w-full h-full rounded-full"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-sm">{item.customer_name[0] || 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold text-white text-sm truncate">{item.customer_name}</p>
                        {renderStars(item.rating)}
                      </div>
                      <p className="text-gray text-xs italic mt-1 line-clamp-2">
                        &ldquo;{item.review || 'Ulasan tanpa teks'}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <button
                      onClick={() => toggleActive(item.id, item.is_active)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
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
                      {item.is_active ? 'Aktif' : 'Disembunyikan'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 rounded-xl bg-ink border border-border hover:border-primary/40 text-gray hover:text-white transition-colors"
                        title="Edit Testimoni"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ show: true, id: item.id })}
                        className="p-2 rounded-xl bg-ink border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Testimoni"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {testimonials.length === 0 && (
                <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-lg">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                    <MessageSquareQuote size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada ulasan ditemukan</h3>
                  <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                    {hasActiveFilters
                      ? 'Coba sesuaikan kata kunci atau filter status ulasan.'
                      : 'Belum ada testimoni yang terdaftar. Tambahkan ulasan pertama sekarang.'}
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
                      <th className="px-5 py-3.5">Pelanggan</th>
                      <th className="px-5 py-3.5">Rating Kepuasan</th>
                      <th className="px-5 py-3.5">Ulasan / Feedback</th>
                      <th className="px-5 py-3.5 text-center">Status Tampil</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {testimonials.map((item) => (
                      <tr key={item.id} className="hover:bg-ink/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-ink border border-border/80 flex items-center justify-center text-primary flex-shrink-0 group-hover:border-primary/40 transition-colors">
                              {item.image_url ? (
                                <OptimizedImage
                                  src={item.image_url}
                                  variant="thumbnail"
                                  alt={item.customer_name}
                                  containerClassName="w-full h-full rounded-full"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-bold text-xs">{item.customer_name[0] || 'U'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-white block">{item.customer_name}</span>
                              <span className="text-gray text-[11px] font-mono">Urutan #{item.sort_order}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1">
                            {renderStars(item.rating)}
                            <span className="text-gray text-[11px] font-medium">{item.rating} dari 5 Bintang</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-light max-w-sm">
                          <p className="line-clamp-2 text-xs italic">
                            &ldquo;{item.review || 'Tidak ada teks ulasan'}&rdquo;
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => toggleActive(item.id, item.is_active)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 cursor-pointer ${
                              item.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20'
                            }`}
                            title="Klik untuk ubah status publikasi"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active ? 'bg-emerald-400' : 'bg-slate-400'
                              }`}
                            />
                            {item.is_active ? 'Aktif' : 'Disembunyikan'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all shadow-sm"
                              title="Edit Testimoni"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ show: true, id: item.id })}
                              className="p-2 rounded-xl bg-card border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all shadow-sm"
                              title="Hapus Testimoni"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {testimonials.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <MessageSquareQuote size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Testimoni tidak ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                              ? 'Coba sesuaikan filter pencarian testimoni.'
                              : 'Belum ada testimoni. Klik tombol "Tambah Testimoni".'}
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
                    <span className="text-white font-medium">{pagination.total}</span> ulasan
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

        {/* Modal: Tambah / Edit Testimoni */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-lg rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              {/* Ambient Glow Accent */}
              <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-primary/20 blur-3xl rounded-full" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/15 shrink-0">
                    <MessageSquareQuote size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-[0.5px]">
                      {editingId ? 'Edit Ulasan Testimoni' : 'Tambah Testimoni Baru'}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {editingId ? 'Perbarui data ulasan dan rating pelanggan' : 'Publikasikan feedback pelanggan baru'}
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
                    Nama Customer <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    className="input-dark w-full"
                    placeholder="Contoh: Rian Pratama (Ketua BEM FT)"
                    required
                    autoFocus
                  />
                </div>

                {/* Rating Bintang Interaktif */}
                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Rating Kepuasan ({form.rating} Bintang)
                  </label>
                  <div className="flex items-center gap-2 bg-ink/40 p-3 rounded-xl border border-border/60">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, rating: star })}
                        className="p-1 hover:scale-125 transition-transform"
                        title={`${star} Bintang`}
                      >
                        <Star
                          size={24}
                          className={star <= form.rating ? 'text-amber-400' : 'text-gray hover:text-amber-300'}
                          fill={star <= form.rating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-gray font-medium ml-2">
                      {form.rating === 5 ? 'Sangat Puas ⭐⭐⭐⭐⭐' : form.rating >= 4 ? 'Puas ⭐⭐⭐⭐' : 'Cukup Baik'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Isi Ulasan / Feedback
                  </label>
                  <textarea
                    value={form.review}
                    onChange={(e) => setForm({ ...form, review: e.target.value })}
                    className="input-dark w-full resize-none"
                    rows={3}
                    placeholder="Tulis ulasan pengalaman memesan sablon di sini..."
                  />
                </div>

                {/* Foto Profil Avatar */}
                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Foto Profil Pelanggan (Opsional)
                  </label>
                  <div className="flex items-center gap-4 bg-ink/30 p-3 rounded-xl border border-border/60">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-ink border border-border flex items-center justify-center flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-gray" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (f) {
                            setImageFile(f);
                            setImagePreview(URL.createObjectURL(f));
                          }
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-ink border border-border hover:bg-card text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Upload size={13} /> Pilih Foto
                        </button>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview('');
                              setImageFile(null);
                            }}
                            className="text-rose-400 text-xs hover:underline"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-gray text-[11px] mt-1">Format JPG, PNG maksimal 2MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
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
                  <div className="pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 rounded text-primary focus:ring-primary bg-ink border-border"
                      />
                      <span className="text-sm font-semibold text-white">Tampilkan di Web</span>
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
                        <Check size={16} /> Simpan Testimoni
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
          title="Hapus Ulasan Testimoni"
          message="Apakah Anda yakin ingin menghapus ulasan testimoni ini?"
          confirmLabel="Ya, Hapus Testimoni"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
