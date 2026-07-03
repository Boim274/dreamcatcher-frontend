import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, X, Upload, Link as LinkIcon, Star, GripVertical, ChevronLeft, ChevronRight, ImageIcon, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/${url}`;
};

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
  const fileRef = useRef(null);
  const [filters, setFilters] = useState({ search: '', service_id: '', is_featured: '' });

  useEffect(() => {
    fetchData();
  }, [page, filters.service_id, filters.is_featured]);

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
      const params = { page: p, per_page: 15 };
      if (f.search) params.search = f.search;
      if (f.service_id) params.service_id = f.service_id;
      if (f.is_featured) params.is_featured = f.is_featured;
      const [portRes, svcRes] = await Promise.all([
        api.get('/admin/portfolios', { params }),
        p === 1 ? api.get('/admin/services') : Promise.resolve(null),
      ]);
      setPortfolios(portRes.data.portfolios.data);
      setPagination(portRes.data.portfolios);
      if (svcRes) setServices(svcRes.data.services.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
        sort_order: 0,
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          sort_order: parseInt(form.sort_order),
          image_url: imageUrl,
        };
      }

      const config = useFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

      if (editingId) {
        if (useFormData) data.append('_method', 'PUT');
        await api[useFormData ? 'post' : 'put'](
          `/admin/portfolios/${editingId}`,
          data,
          config
        );
      } else {
        await api.post('/admin/portfolios', data, config);
      }

      setShowModal(false);
      fetchData();
      toast.success(editingId ? 'Portfolio berhasil diperbarui' : 'Portfolio berhasil ditambahkan');
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
      await api.delete(`/admin/portfolios/${id}`);
      toast.success('Portfolio berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus portfolio');
    }
  };

  const toggleFeatured = async (id, current) => {
    try {
      await api.put(`/admin/portfolios/${id}`, { is_featured: !current });
      fetchData();
      toast.success(!current ? 'Ditandai sebagai featured' : 'Featured dibatalkan');
    } catch (error) {
      toast.error('Gagal mengubah status featured');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Kelola Portfolio</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tambah Portfolio
        </button>
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
                placeholder="Cari judul portfolio..."
                className="input-dark"
              />
            </div>
          </div>

          <select
            value={filters.service_id}
            onChange={(e) => handleFilter('service_id', e.target.value)}
            className="input-dark"
          >
            <option value="">Semua Kategori</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filters.is_featured}
            onChange={(e) => handleFilter('is_featured', e.target.value)}
            className="input-dark"
          >
            <option value="">Semua</option>
            <option value="1">Featured</option>
            <option value="0">Non-Featured</option>
          </select>
        </div>
      </div>

      {/* Mobile: Card Layout */}
      <div className="sm:hidden space-y-4">
        {portfolios.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-dark border border-border flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={getImageUrl(item.image_url)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-dark" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-white truncate">{item.title}</p>
                  <button
                    onClick={() => toggleFeatured(item.id, item.is_featured)}
                    className="flex-shrink-0 p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${item.is_featured ? 'text-amber-400' : 'text-gray-dark'}`}
                      fill={item.is_featured ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
                <p className="text-gray-light text-sm line-clamp-1 mt-0.5">
                  {item.description || '-'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {item.service?.name || '-'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(item)}
                      className="p-1.5 hover:bg-border rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-gray-light" />
                    </button>
                    <button
                      onClick={() => deletePortfolio(item.id)}
                      className="p-1.5 hover:bg-danger/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {portfolios.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-gray-light">
            Belum ada portfolio
          </div>
        )}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden sm:block bg-card border border-border overflow-hidden rounded-xl">
        <table className="w-full">
          <thead className="bg-ink">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray w-10"></th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Gambar</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Judul</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Kategori</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray">Featured</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {portfolios.map((item) => (
              <tr key={item.id} className="hover:bg-ink/50 transition-colors">
                <td className="px-4 py-3">
                  <GripVertical className="w-4 h-4 text-gray-dark" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-dark border border-border">
                    {item.image_url ? (
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-dark" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-gray-light text-sm line-clamp-1">
                    {item.description || '-'}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {item.service?.name || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleFeatured(item.id, item.is_featured)}
                    className="p-1.5 rounded-full transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${item.is_featured ? 'text-amber-400' : 'text-gray-dark hover:text-gray-light'}`}
                      fill={item.is_featured ? 'currentColor' : 'none'}
                    />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 hover:bg-border rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-light" />
                    </button>
                    <button
                      onClick={() => deletePortfolio(item.id)}
                      className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {portfolios.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-light">
                  Belum ada portfolio
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-gray-light text-sm">
            Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} portfolio
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.current_page === 1}
              className="p-2 rounded-lg bg-card border border-border text-gray-light hover:text-white hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-light text-sm px-2">
              {pagination.current_page} / {pagination.last_page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page === pagination.last_page}
              className="p-2 rounded-lg bg-card border border-border text-gray-light hover:text-white hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-heading text-xl font-bold text-white">
                {editingId ? 'Edit Portfolio' : 'Tambah Portfolio'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-border rounded-xl">
                <X className="w-5 h-5 text-gray-light" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Judul</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Kategori</label>
                <select
                  value={form.service_id}
                  onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                  className="input-dark"
                >
                  <option value="">Pilih Kategori</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-dark min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Gambar</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      imageMode === 'url' ? 'bg-primary text-white' : 'bg-dark border border-border text-gray-light hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Paste URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      imageMode === 'upload' ? 'bg-primary text-white' : 'bg-dark border border-border text-gray-light hover:text-white'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>

                {imageMode === 'url' ? (
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(getImageUrl(e.target.value));
                    }}
                    className="input-dark"
                    placeholder="https://example.com/image.jpg atau storage/portfolios/image.jpg"
                  />
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-light mx-auto mb-2" />
                        <p className="text-gray-light text-sm">Klik atau seret gambar ke sini</p>
                        <p className="text-gray-dark text-xs mt-1">JPG, PNG, WebP (max 5MB)</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="is_featured" className="font-medium text-white">Featured</label>
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Urutan</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="input-dark"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <LoadingSpinner size="sm" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Hapus Portfolio"
        message="Apakah Anda yakin ingin menghapus portfolio ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
