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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-[22px] font-heading text-white tracking-[1px]">Produk</h1>
        <button onClick={() => openModal(null)} className="flex items-center gap-2 bg-primary text-ink font-semibold py-2 px-4 rounded-xl hover:bg-primary-dark transition-colors text-[12px] uppercase tracking-[1px]">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="input-icon-wrapper">
          <Search size={14} className="input-icon" />
          <input type="text" placeholder="Cari produk..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} onKeyDown={handleSearchKeyDown} className="input-dark" />
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

      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Produk</th>
                    <th className="text-left p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Kategori</th>
                    <th className="text-right p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Harga</th>
                    <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Stok</th>
                    <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Status</th>
                    <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-ink/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-ink rounded-lg overflow-hidden flex-shrink-0">
                            <img src={p.images?.[0]?.image_url || 'https://placehold.co/100x100/333/666?text=No'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-white font-medium truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray">{p.category?.name || '-'}</td>
                      <td className="p-3 text-primary font-semibold text-right">{formatRupiah(p.base_price)}</td>
                      <td className="p-3 text-center">
                        <span className={`text-[12px] font-medium ${p.stock > 0 ? 'text-green-400' : 'text-fire'}`}>{p.stock}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.is_active ? 'bg-primary/20 text-primary' : 'bg-gray/20 text-gray'}`}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openModal(p)} className="text-info hover:text-white transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => setConfirmDelete({ show: true, id: p.id })} className="text-fire hover:text-white transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-gray">Belum ada produk</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.last_page > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-gray hover:text-white disabled:opacity-30 transition-colors text-[12px]">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-gray text-[13px]">{pagination.current_page} / {pagination.last_page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.last_page} className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-gray hover:text-white disabled:opacity-30 transition-colors text-[12px]">
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-heading text-white tracking-[1px]">{editingId ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-gray text-[11px] tracking-[1px] uppercase mb-1 block">Nama Produk</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-dark w-full" placeholder="Nama produk" />
                </div>
                <div>
                  <label className="text-gray text-[11px] tracking-[1px] uppercase mb-1 block">Harga</label>
                  <input type="number" value={form.base_price} onChange={(e) => setForm((p) => ({ ...p, base_price: e.target.value }))} className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-gray text-[11px] tracking-[1px] uppercase mb-1 block">Stok</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: parseInt(e.target.value) || 0 }))} className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-gray text-[11px] tracking-[1px] uppercase mb-1 block">Kategori</label>
                  <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className="input-dark w-full">
                    <option value="">Pilih kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <label className="text-gray text-[11px] tracking-[1px] uppercase mb-1 block">Urutan</label>
                    <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="input-dark w-20" />
                  </div>
                  <label className="flex items-center gap-2 pb-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4" />
                    <span className="text-white text-[13px]">Aktif</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-gray text-[11px] tracking-[1px] uppercase mb-1 block">Deskripsi</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input-dark w-full resize-none" rows={3} />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="text-gray text-[11px] tracking-[1px] uppercase mb-2 block">Gambar Produk</label>
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

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray text-[11px] tracking-[1px] uppercase">Ukuran</label>
                  <button onClick={addSize} className="text-primary text-[11px] hover:underline">+ Tambah Ukuran</button>
                </div>
                <div className="space-y-2">
                  {sizes.map((size, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={size.name} onChange={(e) => updateSize(i, 'name', e.target.value)} className="input-dark flex-1" placeholder="Nama ukuran (S, M, L, XL...)" />
                      <input type="number" value={size.stock} onChange={(e) => updateSize(i, 'stock', parseInt(e.target.value) || 0)} className="input-dark w-20" placeholder="Stok" />
                      <button onClick={() => removeSize(i)} className="text-fire hover:text-white transition-colors"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray text-[11px] tracking-[1px] uppercase">Warna</label>
                  <button onClick={addColor} className="text-primary text-[11px] hover:underline">+ Tambah Warna</button>
                </div>
                <div className="space-y-2">
                  {colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="color" value={color.hex_code || '#000000'} onChange={(e) => updateColor(i, 'hex_code', e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                      <input type="text" value={color.name} onChange={(e) => updateColor(i, 'name', e.target.value)} className="input-dark flex-1" placeholder="Nama warna" />
                      <button onClick={() => removeColor(i)} className="text-fire hover:text-white transition-colors"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border-2 border-border text-gray py-2.5 rounded-xl hover:text-white transition-colors text-[12px] uppercase tracking-[1px]">Batal</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-primary text-ink font-bold py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-[12px] uppercase tracking-[1px] disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog show={confirmDelete.show} onConfirm={handleDelete} onCancel={() => setConfirmDelete({ show: false, id: null })} title="Hapus Produk" message="Yakin ingin menghapus produk ini?" />
    </div>
  );
}
