import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, X, GripVertical } from 'lucide-react';

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.categories || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (item) => {
    if (item) {
      setEditingId(item.id);
      setForm({ name: item.name, sort_order: item.sort_order });
    } else {
      setEditingId(null);
      setForm({ name: '', sort_order: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.warning('Nama kategori wajib diisi'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, form);
        toast.success('Kategori diperbarui');
      } else {
        await api.post('/admin/categories', form);
        toast.success('Kategori dibuat');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/categories/${confirmDelete.id}`);
      toast.success('Kategori dihapus');
      setConfirmDelete({ show: false, id: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Kelola Kategori</h1>
        <button onClick={() => openModal(null)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Tambah Kategori
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical size={14} className="text-gray flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white text-sm">{cat.name}</p>
                    <p className="text-gray-light text-xs">{cat.products_count || 0} produk</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openModal(cat)} className="p-1.5 hover:bg-border rounded-lg"><Edit2 className="w-4 h-4 text-gray-light" /></button>
                  <button onClick={() => setConfirmDelete({ show: true, id: cat.id })} className="p-1.5 hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4 text-danger" /></button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <div className="bg-card border border-border rounded-xl p-12 text-center text-gray-light">Belum ada kategori</div>}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block bg-card border border-border overflow-hidden rounded-xl">
            <table className="w-full">
              <thead className="bg-ink">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Urutan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Nama</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray">Jumlah Produk</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-ink/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GripVertical size={14} className="text-gray" />
                        <span className="text-gray-light text-sm">{cat.sort_order}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{cat.name}</td>
                    <td className="px-4 py-3 text-center text-gray-light text-sm">{cat.products_count || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openModal(cat)} className="p-2 hover:bg-border rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-gray-light" /></button>
                        <button onClick={() => setConfirmDelete({ show: true, id: cat.id })} className="p-2 hover:bg-danger/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-danger" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-light">Belum ada kategori</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-heading text-xl font-bold text-white">{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-border rounded-xl"><X className="w-5 h-5 text-gray-light" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6 space-y-4">
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama Kategori</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-dark w-full" placeholder="Nama kategori" />
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Urutan</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="input-dark w-20" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <LoadingSpinner size="sm" /> : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog show={confirmDelete.show} onConfirm={handleDelete} onCancel={() => setConfirmDelete({ show: false, id: null })} title="Hapus Kategori" message="Yakin ingin menghapus kategori ini? Kategori dengan produk tidak bisa dihapus." />
    </div>
  );
}
