import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, X, Upload, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', base_price: '', category_id: '', stock: 0, is_active: true, sort_order: 0,
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const fileRef = useRef(null);
  const [filters, setFilters] = useState({ search: '', category_id: '', is_active: '' });

  useEffect(() => { fetchData(); }, [page, filters.category_id, filters.is_active]);
  useEffect(() => { api.get('/admin/categories').then((r) => setCategories(r.data.categories || [])).catch(() => {}); }, []);

  const handleFilter = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
    if (key !== 'search') { setPage(1); fetchData(1, { ...filters, [key]: value }); }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') { setPage(1); fetchData(1, filters); }
  };

  const fetchData = async (pageArg, overrideFilters) => {
    const p = pageArg || page; const f = overrideFilters || filters;
    try {
      const params = { page: p };
      if (f.search) params.search = f.search;
      if (f.category_id) params.category_id = f.category_id;
      if (f.is_active) params.is_active = f.is_active;
      const res = await api.get('/admin/products', { params });
      setProducts(res.data.products.data);
      setPagination(res.data.products);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (item) => {
    if (item) {
      setEditingId(item.id);
      setForm({ name: item.name, description: item.description || '', base_price: item.base_price, category_id: item.category_id || '', stock: item.stock, is_active: item.is_active, sort_order: item.sort_order });
      setExistingImages((item.images || []).map((img, i) => ({ ...img, sort_order: i })));
      setSizes(item.sizes || []);
      setColors(item.colors || []);
      setImageFiles([]);
      setImagePreviews([]);
    } else {
      setEditingId(null);
      setForm({ name: '', description: '', base_price: '', category_id: '', stock: 0, is_active: true, sort_order: 0 });
      setExistingImages([]);
      setSizes([]);
      setColors([]);
      setImageFiles([]);
      setImagePreviews([]);
    }
    setShowModal(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imgId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const addSize = () => setSizes((prev) => [...prev, { name: '', stock: 0 }]);
  const updateSize = (i, field, value) => setSizes((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const removeSize = (i) => setSizes((prev) => prev.filter((_, idx) => idx !== i));

  const addColor = () => setColors((prev) => [...prev, { name: '', hex_code: '#000000' }]);
  const updateColor = (i, field, value) => setColors((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  const removeColor = (i) => setColors((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.name || !form.base_price) { toast.warning('Lengkapi nama dan harga'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('base_price', form.base_price);
      fd.append('stock', form.stock);
      fd.append('is_active', form.is_active);
      fd.append('sort_order', form.sort_order);
      if (form.category_id) fd.append('category_id', form.category_id);
      imageFiles.forEach((f) => fd.append('images[]', f));
      fd.append('sizes', JSON.stringify(sizes));
      fd.append('colors', JSON.stringify(colors));
      if (editingId) {
        fd.append('existing_images', JSON.stringify(existingImages.map((img, i) => ({ id: img.id, sort_order: i }))));
        fd.append('_method', 'PUT');
        await api.post(`/admin/products/${editingId}`, fd);
        toast.success('Produk diperbarui');
      } else {
        await api.post('/admin/products', fd);
        toast.success('Produk dibuat');
      }
      setShowModal(false);
      fetchData(1, filters);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/products/${confirmDelete.id}`);
      toast.success('Produk dihapus');
      setConfirmDelete({ show: false, id: null });
      fetchData(page, filters);
    } catch (err) {
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Kelola Produk</h1>
        <button onClick={() => openModal(null)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Tambah Produk
        </button>
      </div>

      <div className="bg-card border border-border p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="input-icon-wrapper">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
              <input type="text" placeholder="Cari produk..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} onKeyDown={handleSearchKeyDown} className="input-dark" />
            </div>
          </div>
          <select value={filters.category_id} onChange={(e) => handleFilter('category_id', e.target.value)} className="input-dark">
            <option value="">Semua Kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.is_active} onChange={(e) => handleFilter('is_active', e.target.value)} className="input-dark">
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                <div className="w-12 h-12 bg-ink rounded-lg overflow-hidden flex-shrink-0">
                  <img src={p.images?.[0]?.image_url || 'https://placehold.co/100x100/333/666?text=No'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{p.name}</p>
                  <p className="text-gray-light text-xs mt-0.5">{p.category?.name || '-'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-primary font-semibold text-xs">{formatRupiah(p.base_price)}</span>
                    <span className={`text-[10px] font-medium ${p.stock > 0 ? 'text-green-400' : 'text-fire'}`}>Stok: {p.stock}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openModal(p)} className="p-1.5 hover:bg-border rounded-lg"><Edit2 className="w-4 h-4 text-gray-light" /></button>
                  <button onClick={() => setConfirmDelete({ show: true, id: p.id })} className="p-1.5 hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4 text-danger" /></button>
                </div>
              </div>
            ))}
            {products.length === 0 && <div className="bg-card border border-border rounded-xl p-12 text-center text-gray-light">Belum ada produk</div>}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block bg-card border border-border overflow-hidden rounded-xl">
            <table className="w-full">
              <thead className="bg-ink">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Produk</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Kategori</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Harga</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray">Stok</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-ink/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-ink rounded-lg overflow-hidden flex-shrink-0">
                          <img src={p.images?.[0]?.image_url || 'https://placehold.co/100x100/333/666?text=No'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-semibold text-white truncate max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-light text-sm">{p.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-primary font-semibold text-right">{formatRupiah(p.base_price)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${p.stock > 0 ? 'text-green-400' : 'text-fire'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-primary/20 text-primary' : 'bg-gray-dark/20 text-gray-dark'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openModal(p)} className="p-2 hover:bg-border rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-gray-light" /></button>
                        <button onClick={() => setConfirmDelete({ show: true, id: p.id })} className="p-2 hover:bg-danger/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-danger" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-light">Belum ada produk</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-gray-light text-sm">
                Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} produk
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.current_page === 1} className="p-2 rounded-lg bg-card border border-border text-gray-light hover:text-white hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-gray-light text-sm px-2">{pagination.current_page} / {pagination.last_page}</span>
                <button onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))} disabled={pagination.current_page === pagination.last_page} className="p-2 rounded-lg bg-card border border-border text-gray-light hover:text-white hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-heading text-xl font-bold text-white">{editingId ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-border rounded-xl"><X className="w-5 h-5 text-gray-light" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama Produk</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-dark w-full" placeholder="Nama produk" />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Harga</label>
                  <input type="number" value={form.base_price} onChange={(e) => setForm((p) => ({ ...p, base_price: e.target.value }))} className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Stok</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: parseInt(e.target.value) || 0 }))} className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Kategori</label>
                  <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className="input-dark w-full">
                    <option value="">Pilih kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Urutan</label>
                    <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="input-dark w-20" />
                  </div>
                  <label className="flex items-center gap-2 pb-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-5 h-5" />
                    <span className="font-medium text-white">Aktif</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Deskripsi</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input-dark w-full resize-none" rows={3} />
                </div>
              </div>

              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Gambar Produk</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative w-24 h-24 bg-ink rounded-lg overflow-hidden group">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 w-5 h-5 bg-fire/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} className="text-white" /></button>
                    </div>
                  ))}
                  {imagePreviews.map((preview, i) => (
                    <div key={`new-${i}`} className="relative w-24 h-24 bg-ink rounded-lg overflow-hidden group">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeNewImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-fire/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} className="text-white" /></button>
                    </div>
                  ))}
                  <button onClick={() => fileRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-gray hover:border-primary hover:text-primary transition-colors cursor-pointer">
                    <Upload size={20} />
                    <span className="text-[10px] mt-1">Tambah</span>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase">Ukuran</label>
                  <button onClick={addSize} className="text-primary text-sm hover:underline">+ Tambah Ukuran</button>
                </div>
                <div className="space-y-2">
                  {sizes.map((size, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={size.name} onChange={(e) => updateSize(i, 'name', e.target.value)} className="input-dark flex-1" placeholder="Nama ukuran (S, M, L, XL...)" />
                      <input type="number" value={size.stock} onChange={(e) => updateSize(i, 'stock', parseInt(e.target.value) || 0)} className="input-dark w-20" placeholder="Stok" />
                      <button onClick={() => removeSize(i)} className="p-1.5 hover:bg-danger/10 rounded-lg transition-colors"><X size={16} className="text-danger" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase">Warna</label>
                  <button onClick={addColor} className="text-primary text-sm hover:underline">+ Tambah Warna</button>
                </div>
                <div className="space-y-2">
                  {colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="color" value={color.hex_code || '#000000'} onChange={(e) => updateColor(i, 'hex_code', e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                      <input type="text" value={color.name} onChange={(e) => updateColor(i, 'name', e.target.value)} className="input-dark flex-1" placeholder="Nama warna" />
                      <button onClick={() => removeColor(i)} className="p-1.5 hover:bg-danger/10 rounded-lg transition-colors"><X size={16} className="text-danger" /></button>
                    </div>
                  ))}
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

      <ConfirmDialog show={confirmDelete.show} onConfirm={handleDelete} onCancel={() => setConfirmDelete({ show: false, id: null })} title="Hapus Produk" message="Yakin ingin menghapus produk ini?" />
    </div>
  );
}
