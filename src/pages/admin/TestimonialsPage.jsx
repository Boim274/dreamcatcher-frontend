import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, X, Upload, Star, ChevronLeft, ChevronRight, ImageIcon, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/${url}`;
};

export default function TestimonialsPage() {
  const toast = useToast();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ customer_name: '', rating: 5, review: '', is_active: true, sort_order: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const fileRef = useRef(null);
  
  // Tambahkan fileInputRef untuk mengontrol input file
  const fileInputRef = useRef(null);
  
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger klik pada input file
    }
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Buat preview gambar
    }
  };
  const [filters, setFilters] = useState({ search: '', is_active: '', min_rating: '' });

  useEffect(() => {
    fetchData();
  }, [page, filters.is_active, filters.min_rating]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPage(1);
      fetchData(1, { ...filters, [key]: value });
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchData(1, filters);
    }
  };

  const fetchData = async (pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p };
      if (f.search) params.search = f.search;
      if (f.is_active) params.is_active = f.is_active;
      if (f.min_rating) params.min_rating = f.min_rating;
      const res = await api.get('/admin/testimonials', { params });
      setTestimonials(res.data.testimonials.data);
      setPagination(res.data.testimonials);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({ customer_name: item.customer_name, rating: item.rating, review: item.review || '', is_active: item.is_active, sort_order: item.sort_order });
      setImagePreview(getImageUrl(item.image_url));
    } else {
      setEditingId(null);
      setForm({ customer_name: '', rating: 5, review: '', is_active: true, sort_order: 0 });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('customer_name', form.customer_name);
      data.append('rating', form.rating);
      data.append('review', form.review);
      data.append('is_active', form.is_active ? '1' : '0');
      data.append('sort_order', form.sort_order);
      if (imageFile) data.append('image', imageFile);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingId) {
        data.append('_method', 'PUT');
        await api.post(`/admin/testimonials/${editingId}`, data, config);
        toast.success('Testimoni berhasil diperbarui');
      } else {
        await api.post('/admin/testimonials', data, config);
        toast.success('Testimoni berhasil ditambahkan');
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
      await api.delete(`/admin/testimonials/${id}`);
      toast.success('Testimoni berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus testimoni');
    }
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i <= rating ? 'text-amber-400' : 'text-gray-dark'}`}
            fill={i <= rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Kelola Testimoni</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Tambah Testimoni</button>
      </div>

      <div className="bg-card border border-border p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="input-icon-wrapper">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari nama customer..."
                className="input-dark"
              />
            </div>
          </div>

          <select
            value={filters.is_active}
            onChange={(e) => handleFilter('is_active', e.target.value)}
            className="input-dark"
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>

          <select
            value={filters.min_rating}
            onChange={(e) => handleFilter('min_rating', e.target.value)}
            className="input-dark"
          >
            <option value="">Semua Rating</option>
            <option value="5">5 Bintang</option>
            <option value="4">4+ Bintang</option>
            <option value="3">3+ Bintang</option>
            <option value="2">2+ Bintang</option>
            <option value="1">1+ Bintang</option>
          </select>
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {testimonials.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                {item.image_url ? <img src={getImageUrl(item.image_url)} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-primary font-bold text-sm">{item.customer_name[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{item.customer_name}</p>
                <div className="mt-0.5">{renderStars(item.rating)}</div>
                <p className="text-gray-light text-xs mt-1 line-clamp-2">{item.review || '-'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className={`px-2 py-0.5 rounded-full text-xs ${item.is_active ? 'bg-success/20 text-success' : 'bg-gray-dark/20 text-gray-dark'}`}>
                {item.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
              <div className="flex gap-1">
                <button onClick={() => openModal(item)} className="p-1.5 hover:bg-border rounded-lg"><Edit2 className="w-4 h-4 text-gray-light" /></button>
                <button onClick={() => setConfirmDelete({ show: true, id: item.id })} className="p-1.5 hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4 text-danger" /></button>
              </div>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && <div className="bg-card border border-border rounded-xl p-12 text-center text-gray-light">Belum ada testimoni</div>}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block bg-card border border-border overflow-hidden rounded-xl">
        <table className="w-full">
          <thead className="bg-ink">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Rating</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Review</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {testimonials.map((item) => (
              <tr key={item.id} className="hover:bg-ink/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {item.image_url ? <img src={getImageUrl(item.image_url)} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-primary font-bold text-xs">{item.customer_name[0]}</span>}
                    </div>
                    <span className="font-semibold text-white">{item.customer_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{renderStars(item.rating)}</td>
                <td className="px-4 py-3 text-gray-light text-sm max-w-xs truncate">{item.review || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-success/20 text-success' : 'bg-gray-dark/20 text-gray-dark'}`}>
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openModal(item)} className="p-2 hover:bg-border rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-gray-light" /></button>
                    <button onClick={() => setConfirmDelete({ show: true, id: item.id })} className="p-2 hover:bg-danger/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-danger" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {testimonials.length === 0 && <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-light">Belum ada testimoni</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-gray-light text-sm">Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.current_page === 1} className="p-2 rounded-lg bg-card border border-border text-gray-light hover:text-white hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-gray-light text-sm px-2">{pagination.current_page} / {pagination.last_page}</span>
            <button onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} disabled={pagination.current_page === pagination.last_page} className="p-2 rounded-lg bg-card border border-border text-gray-light hover:text-white hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-heading text-xl font-bold text-white">{editingId ? 'Edit Testimoni' : 'Tambah Testimoni'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-border rounded-xl"><X className="w-5 h-5 text-gray-light" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama Customer</label>
                <input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="input-dark" required />
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} type="button" onClick={() => setForm({ ...form, rating: i })}>
                      <Star className={`w-7 h-7 transition-colors ${i <= form.rating ? 'text-amber-400' : 'text-gray-dark hover:text-gray-light'}`} fill={i <= form.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Review</label>
                <textarea value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} className="input-dark min-h-[80px] resize-none" placeholder="Tulis review pelanggan..." />
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Foto (Opsional)</label>
                <div className="flex gap-3 items-center">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-dark border border-border text-gray-light hover:text-white text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Pilih Foto
                  </button>
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-border" />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5" />
                  <label htmlFor="is_active" className="font-medium text-white">Aktif</label>
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Urutan</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="input-dark" min="0" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <LoadingSpinner size="sm" /> : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDelete.show} onClose={() => setConfirmDelete({ show: false, id: null })} onConfirm={handleDelete} title="Hapus Testimoni" message="Apakah Anda yakin ingin menghapus testimoni ini?" confirmLabel="Ya, Hapus" variant="danger" />
    </div>
  );
}
