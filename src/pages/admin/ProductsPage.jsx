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
  ChevronLeft,
  ChevronRight,
  Search,
  Package,
  RotateCcw,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import OptimizedImage from '../../components/ui/OptimizedImage';

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [masterSizes, setMasterSizes] = useState([]);
  const [masterColors, setMasterColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    stock: 0,
    is_active: true,
    sort_order: 0,
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);
  const fileRef = useRef(null);
  const [filters, setFilters] = useState({ search: '', category_id: '', is_active: '' });

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [page, filters.category_id, filters.is_active]);

  useEffect(() => {
    const controller = new AbortController();
    adminService.getCategories(controller.signal).then(setCategories).catch(() => {});
    adminService.getSizes({}, controller.signal).then((res) => setMasterSizes(res.data || [])).catch(() => {});
    adminService.getColors({}, controller.signal).then((res) => setMasterColors(res.data || [])).catch(() => {});
    return () => controller.abort();
  }, []);

  const handleFilter = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
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
    const reset = { search: '', category_id: '', is_active: '' };
    setFilters(reset);
    setPage(1);
    fetchData(null, 1, reset);
  };

  const hasActiveFilters = Boolean(filters.search || filters.category_id || filters.is_active);

  const fetchData = async (signal, pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p };
      if (f.search) params.search = f.search;
      if (f.category_id) params.category_id = f.category_id;
      if (f.is_active) params.is_active = f.is_active;
      const result = await adminService.getProducts(params, signal);
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (err) {
      if (err?.name !== 'CanceledError') console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name,
        description: item.description || '',
        base_price: item.base_price,
        category_id: item.category_id || '',
        stock: item.stock,
        is_active: item.is_active,
        sort_order: item.sort_order,
      });
      setExistingImages((item.images || []).map((img, i) => ({ ...img, sort_order: i })));
      setSizes(item.sizes || []);
      setColors(item.colors || []);
      setImageFiles([]);
      setImagePreviews([]);
    } else {
      setEditingId(null);
      setForm({
        name: '',
        description: '',
        base_price: '',
        category_id: '',
        stock: 0,
        is_active: true,
        sort_order: 0,
      });
      setExistingImages([]);
      setSizes([
        { name: 'S', stock: 10 },
        { name: 'M', stock: 10 },
        { name: 'L', stock: 10 },
        { name: 'XL', stock: 10 },
      ]);
      setColors([]);
      setImageFiles([]);
      setImagePreviews([]);
    }
    setShowModal(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imgId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const addSize = () => setSizes((prev) => [...prev, { name: '', stock: 0 }]);
  const addMasterSize = (sz) => {
    const sName = sz.name || sz.code || '';
    if (!sName) return;
    if (!sizes.some((s) => s.name?.toLowerCase() === sName.toLowerCase())) {
      setSizes((prev) => [...prev, { name: sName, stock: 10 }]);
    }
  };
  const updateSize = (i, field, value) =>
    setSizes((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  const removeSize = (i) => setSizes((prev) => prev.filter((_, idx) => idx !== i));

  const addColor = () => setColors((prev) => [...prev, { name: '', hex_code: '#111827' }]);
  const addMasterColor = (c) => {
    const cName = c.name || '';
    if (!cName) return;
    if (!colors.some((col) => col.name?.toLowerCase() === cName.toLowerCase())) {
      setColors((prev) => [...prev, { name: cName, hex_code: c.hex_code || '#111827' }]);
    }
  };
  const updateColor = (i, field, value) =>
    setColors((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  const removeColor = (i) => setColors((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.name || form.name.trim() === '') {
      toast.warning('Nama produk wajib diisi');
      return;
    }
    const cleanPrice = String(form.base_price).replace(/[^0-9]/g, '');
    if (!cleanPrice) {
      toast.warning('Harga dasar produk wajib diisi angka valid');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.description) fd.append('description', form.description.trim());
      fd.append('base_price', cleanPrice);
      fd.append('stock', parseInt(form.stock) || 0);
      fd.append('is_active', form.is_active ? '1' : '0');
      fd.append('sort_order', parseInt(form.sort_order) || 0);
      if (form.category_id && form.category_id !== '') {
        fd.append('category_id', form.category_id);
      }
      imageFiles.forEach((f) => fd.append('images[]', f));

      const validSizes = sizes
        .filter((s) => s && s.name && s.name.trim() !== '')
        .map((s) => ({
          name: s.name.trim(),
          stock: parseInt(s.stock) || 0,
        }));
      fd.append('sizes', JSON.stringify(validSizes));

      const validColors = colors
        .filter((c) => c && c.name && c.name.trim() !== '')
        .map((c) => ({
          name: c.name.trim(),
          hex_code: c.hex_code && c.hex_code.trim() !== '' ? c.hex_code.trim() : '#111827',
        }));
      fd.append('colors', JSON.stringify(validColors));

      if (editingId) {
        fd.append('existing_images', JSON.stringify(existingImages));
        await adminService.updateProduct(editingId, fd);
        toast.success('Produk berhasil diperbarui');
      } else {
        await adminService.createProduct(fd);
        toast.success('Produk baru berhasil dibuat');
      }
      setShowModal(false);
      fetchData(null, 1, filters);
    } catch (err) {
      console.error('Submit product error:', err?.response?.data || err);
      const errData = err.response?.data;
      let errDetail = 'Gagal menyimpan produk';
      if (errData?.errors && typeof errData.errors === 'object') {
        errDetail = Object.values(errData.errors).flat().join(', ');
      } else if (errData?.message) {
        errDetail = errData.message;
      }
      toast.error(errDetail);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteProduct(confirmDelete.id);
      toast.success('Produk berhasil dihapus');
      setConfirmDelete({ show: false, id: null });
      fetchData(null, page, filters);
    } catch (err) {
      toast.error('Gagal menghapus produk');
    }
  };

  const getStockBadge = (stock) => {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Habis (0)
        </span>
      );
    }
    if (stock <= 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Sisa {stock}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {stock} pcs
      </span>
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Katalog Produk & Apparel</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {pagination.total} Total
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Kelola katalog blank apparel, merchandise kustom, konfigurasi ukuran, stok varian, dan galeri produk.
            </p>
          </div>
          <button
            onClick={() => openModal(null)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Tambah Produk
          </button>
        </div>

        {/* Filter Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 lg:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
              <input
                type="text"
                placeholder="Cari produk (nama / SKU)..."
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                onKeyDown={handleSearchKeyDown}
                className="input-dark pl-11 pr-9 w-full"
              />
              {filters.search && (
                <button
                  onClick={() => {
                    setFilters((p) => ({ ...p, search: '' }));
                    fetchData(null, 1, { ...filters, search: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sm:col-span-3 lg:col-span-3">
              <select
                value={filters.category_id}
                onChange={(e) => handleFilter('category_id', e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
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

            <div className="sm:col-span-12 lg:col-span-2 flex items-center justify-end gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="w-full lg:w-auto px-3 py-2.5 rounded-xl border border-border hover:bg-ink text-gray hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card border border-border/80 rounded-2xl">
            <LoadingSpinner size="lg" />
            <p className="text-gray text-xs mt-3">Memuat data produk...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <OptimizedImage
                      src={p.images?.[0]?.image_url}
                      thumbnailSrc={p.images?.[0]?.thumbnail_url}
                      variant="thumbnail"
                      alt={p.name}
                      containerClassName="w-14 h-14 rounded-xl border border-border/60 flex-shrink-0"
                      className="w-full h-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-400' : 'bg-slate-400'}`}
                          />
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="text-gray text-xs mt-0.5">{p.category?.name || 'Uncategorized'}</p>
                      <p className="text-primary font-bold text-sm mt-1">{formatRupiah(p.base_price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <div>{getStockBadge(p.stock)}</div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openModal(p)}
                        className="p-2 rounded-xl bg-ink border border-border hover:border-primary/40 text-gray hover:text-white transition-colors"
                        title="Edit Produk"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ show: true, id: p.id })}
                        className="p-2 rounded-xl bg-ink border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-lg">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                    <Package size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada produk ditemukan</h3>
                  <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                    {hasActiveFilters
                      ? 'Coba ubah kata kunci atau filter pencarian Anda untuk melihat produk lain.'
                      : 'Mulai dengan menambahkan produk pertama ke dalam katalog toko Anda.'}
                  </p>
                  {hasActiveFilters ? (
                    <button
                      onClick={handleResetFilters}
                      className="mt-4 px-4 py-2 rounded-xl bg-ink border border-border hover:bg-card text-white text-xs font-semibold transition-colors"
                    >
                      Reset Filter
                    </button>
                  ) : (
                    <button onClick={() => openModal(null)} className="btn-primary mt-4 text-xs">
                      <Plus size={14} className="inline mr-1" /> Tambah Produk
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-ink/80 border-b border-border/80 text-[11px] font-semibold text-gray uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Produk</th>
                      <th className="px-5 py-3.5">Kategori</th>
                      <th className="px-5 py-3.5 text-right">Harga Dasar</th>
                      <th className="px-5 py-3.5 text-center">Stok</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-ink/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3.5">
                            <OptimizedImage
                              src={p.images?.[0]?.image_url}
                              thumbnailSrc={p.images?.[0]?.thumbnail_url}
                              variant="thumbnail"
                              alt={p.name}
                              containerClassName="w-11 h-11 rounded-xl border border-border/80 flex-shrink-0 group-hover:border-primary/40 transition-colors"
                              className="w-full h-full object-cover"
                            />
                            <div className="min-w-0 max-w-[240px]">
                              <p className="font-semibold text-white truncate">{p.name}</p>
                              <p className="text-gray text-xs truncate mt-0.5">
                                {p.description || 'Tidak ada deskripsi'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-light font-medium">
                          {p.category ? (
                            <span className="px-2.5 py-1 rounded-lg bg-ink border border-border text-xs text-gray-light">
                              {p.category.name}
                            </span>
                          ) : (
                            <span className="text-gray text-xs">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-bold text-primary">{formatRupiah(p.base_price)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">{getStockBadge(p.stock)}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              p.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.is_active ? 'bg-emerald-400' : 'bg-slate-400'
                              }`}
                            />
                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(p)}
                              className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all shadow-sm"
                              title="Edit Produk"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ show: true, id: p.id })}
                              className="p-2 rounded-xl bg-card border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all shadow-sm"
                              title="Hapus Produk"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {products.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <Package size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Tidak ada produk ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                              ? 'Coba sesuaikan filter pencarian untuk melihat produk lainnya.'
                              : 'Katalog Anda masih kosong. Silakan tambahkan produk baru.'}
                          </p>
                          {hasActiveFilters && (
                            <button
                              onClick={handleResetFilters}
                              className="mt-3 px-4 py-2 rounded-xl bg-ink border border-border hover:bg-card text-white text-xs font-semibold transition-colors"
                            >
                              Reset Filter
                            </button>
                          )}
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
                    <span className="text-white font-medium">{pagination.total}</span> produk
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

        {/* Modal: Tambah / Edit Produk */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-3xl rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              {/* Ambient Glow Accent */}
              <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-primary/20 blur-3xl rounded-full" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/15 shrink-0">
                    <Package size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-[0.5px]">
                      {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {editingId ? 'Perbarui informasi dan spesifikasi produk katalog' : 'Isi rincian informasi katalog produk baru'}
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

              {/* Modal Body */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto"
              >
                {/* Bagian 1: Info Dasar */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} /> Informasi Dasar Produk
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                        Nama Produk <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className="input-dark w-full"
                        placeholder="Contoh: Kaos Polos Combed 30s Reaktif"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                        Harga Dasar (Rp) <span className="text-primary">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.base_price}
                        onChange={(e) => setForm((p) => ({ ...p, base_price: e.target.value }))}
                        className="input-dark w-full"
                        placeholder="55000"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                        Total Stok
                      </label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm((p) => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                        className="input-dark w-full"
                        placeholder="100"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                        Kategori Produk
                      </label>
                      <select
                        value={form.category_id}
                        onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                        className="input-dark w-full"
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                          Urutan Tampil
                        </label>
                        <input
                          type="number"
                          value={form.sort_order}
                          onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                          className="input-dark w-full"
                          min="0"
                        />
                      </div>
                      <div className="pt-5">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                            className="w-4 h-4 rounded text-primary focus:ring-primary bg-ink border-border"
                          />
                          <span className="text-sm font-semibold text-white">Produk Aktif</span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                        Deskripsi Produk
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        className="input-dark w-full resize-none"
                        rows={3}
                        placeholder="Tuliskan spesifikasi bahan, ketebalan gramasi, dan keunggulan produk..."
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Gambar Produk */}
                <div className="pt-4 border-t border-border/80">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Upload size={14} /> Foto Produk
                    </h4>
                    <span className="text-gray text-xs">
                      {existingImages.length + imageFiles.length} gambar dipilih
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {/* Existing Images */}
                    {existingImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square bg-ink rounded-xl overflow-hidden border border-border group"
                      >
                        <OptimizedImage
                          src={img.image_url}
                          thumbnailSrc={img.thumbnail_url}
                          variant="thumbnail"
                          alt="Product thumbnail"
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* New Upload Previews */}
                    {imagePreviews.map((preview, i) => (
                      <div
                        key={`new-${i}`}
                        className="relative aspect-square bg-ink rounded-xl overflow-hidden border border-primary/40 group"
                      >
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-white">
                          Baru
                        </span>
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Upload Trigger Button */}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-border hover:border-primary rounded-xl flex flex-col items-center justify-center text-gray hover:text-primary transition-colors bg-ink/30 cursor-pointer"
                    >
                      <Upload size={20} />
                      <span className="text-[11px] font-semibold mt-1">Upload Foto</span>
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>

                {/* Bagian 3: Varian Ukuran */}
                <div className="pt-4 border-t border-border/80">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Layers size={14} /> Varian Ukuran & Stok
                    </h4>
                    <button
                      type="button"
                      onClick={addSize}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Tambah Ukuran Custom
                    </button>
                  </div>

                  {masterSizes.length > 0 && (
                    <div className="mb-3 p-2.5 rounded-xl bg-ink/30 border border-border/50">
                      <p className="text-[10px] font-semibold text-gray uppercase tracking-wider mb-1.5">
                        Pilih Cepat dari Master Ukuran:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {masterSizes.map((sz) => {
                          const sName = sz.name || sz.code || '';
                          const isAdded = sizes.some((s) => s.name?.toLowerCase() === sName.toLowerCase());
                          return (
                            <button
                              key={sz.id || sName}
                              type="button"
                              onClick={() => addMasterSize(sz)}
                              disabled={isAdded}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                                isAdded
                                  ? 'bg-primary/20 text-primary border border-primary/30 opacity-60 cursor-default'
                                  : 'bg-card hover:bg-primary hover:text-white border border-border text-gray-300'
                              }`}
                            >
                              {isAdded ? <Check size={11} /> : <Plus size={11} />}
                              {sName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {sizes.map((size, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-ink/40 p-2 rounded-xl border border-border/60"
                      >
                        <input
                          type="text"
                          value={size.name}
                          onChange={(e) => updateSize(i, 'name', e.target.value)}
                          className="input-dark flex-1 py-1.5 text-xs"
                          placeholder="Label ukuran (S, M, L, XL, XXL...)"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-gray uppercase">Stok:</span>
                          <input
                            type="number"
                            value={size.stock}
                            onChange={(e) => updateSize(i, 'stock', parseInt(e.target.value) || 0)}
                            className="input-dark w-20 py-1.5 text-xs"
                            min="0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSize(i)}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {sizes.length === 0 && (
                      <p className="text-gray text-xs italic py-2">
                        Belum ada varian ukuran. Klik tombol &quot;+ Tambah Ukuran Custom&quot; atau pilih cepat di atas.
                      </p>
                    )}
                  </div>
                </div>

                {/* Bagian 4: Varian Warna */}
                <div className="pt-4 border-t border-border/80">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Sparkles size={14} /> Varian Warna Kain
                    </h4>
                    <button
                      type="button"
                      onClick={addColor}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Tambah Warna Custom
                    </button>
                  </div>

                  {masterColors.length > 0 && (
                    <div className="mb-3 p-2.5 rounded-xl bg-ink/30 border border-border/50">
                      <p className="text-[10px] font-semibold text-gray uppercase tracking-wider mb-1.5">
                        Pilih Cepat dari Master Warna Katalog:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {masterColors.map((col) => {
                          const isAdded = colors.some((c) => c.name?.toLowerCase() === col.name?.toLowerCase());
                          return (
                            <button
                              key={col.id || col.name}
                              type="button"
                              onClick={() => addMasterColor(col)}
                              disabled={isAdded}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                isAdded
                                  ? 'bg-primary/20 text-primary border border-primary/30 opacity-60 cursor-default'
                                  : 'bg-card hover:bg-white/10 border border-border text-gray-300'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block"
                                style={{ backgroundColor: col.hex_code || '#111827' }}
                              />
                              {isAdded ? <Check size={11} /> : <Plus size={11} />}
                              {col.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 bg-ink/40 p-2 rounded-xl border border-border/60"
                      >
                        <div className="relative flex-shrink-0">
                          <input
                            type="color"
                            value={color.hex_code || '#111827'}
                            onChange={(e) => updateColor(i, 'hex_code', e.target.value)}
                            className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                          />
                        </div>
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) => updateColor(i, 'name', e.target.value)}
                          className="input-dark flex-1 py-1.5 text-xs"
                          placeholder="Nama warna (misal: Hitam Jetblack, Maroon, Forest Green)"
                        />
                        <input
                          type="text"
                          value={color.hex_code}
                          onChange={(e) => updateColor(i, 'hex_code', e.target.value)}
                          className="input-dark w-24 py-1.5 text-xs font-mono"
                          placeholder="#000000"
                        />
                        <button
                          type="button"
                          onClick={() => removeColor(i)}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {colors.length === 0 && (
                      <p className="text-gray text-xs italic py-2">
                        Belum ada varian warna khusus. Klik &quot;+ Tambah Warna Custom&quot; atau pilih dari katalog di atas.
                      </p>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
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
                        <Check size={16} /> Simpan Produk
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
          title="Hapus Produk dari Katalog"
          message="Apakah Anda yakin ingin menghapus produk ini? Produk yang terhapus tidak dapat dipulihkan."
          confirmLabel="Ya, Hapus Produk"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
