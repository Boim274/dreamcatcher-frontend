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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-[22px] font-heading text-white tracking-[1px]">Kategori</h1>
        <button onClick={() => openModal(null)} className="flex items-center gap-2 bg-primary text-ink font-semibold py-2 px-4 rounded-xl hover:bg-primary-dark transition-colors text-[12px] uppercase tracking-[1px]">
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Urutan</th>
                <th className="text-left p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Nama</th>
                <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Jumlah Produk</th>
                <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-ink/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-gray" />
                      <span className="text-gray">{cat.sort_order}</span>
                    </div>
                  </td>
                  <td className="p-3 text-white font-medium">{cat.name}</td>
                  <td className="p-3 text-center text-gray">{cat.products_count || 0}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(cat)} className="text-info hover:text-white transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => setConfirmDelete({ show: true, id: cat.id })} className="text-fire hover:text-white transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray">Belum ada kategori</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-heading text-white tracking-[1px]">{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray text-[11px] tracking-[1px] uppercase mb-1 block">Nama Kategori</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-dark w-full" placeholder="Nama kategori" />
              </div>
              <div>
                <label className="text-gray text-[11px] tracking-[1px] uppercase mb-1 block">Urutan</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="input-dark w-20" />
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

      <ConfirmDialog show={confirmDelete.show} onConfirm={handleDelete} onCancel={() => setConfirmDelete({ show: false, id: null })} title="Hapus Kategori" message="Yakin ingin menghapus kategori ini? Kategori dengan produk tidak bisa dihapus." />
    </div>
  );
}
