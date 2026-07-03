import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, X, Palette, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function ColorsPage() {
  const toast = useToast();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', hex_code: '#000000', is_active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', is_active: '' });

  useEffect(() => {
    fetchColors();
  }, [page, filters.is_active]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPage(1);
      fetchColors(1, { ...filters, [key]: value });
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchColors(1, filters);
    }
  };

  const fetchColors = async (pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p };
      if (f.search) params.search = f.search;
      if (f.is_active) params.is_active = f.is_active;
      const res = await api.get('/admin/colors', { params });
      setColors(res.data.colors.data);
      setPagination(res.data.colors);
    } catch (error) {
      console.error('Failed to fetch colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (color = null) => {
    if (color) {
      setEditingId(color.id);
      setForm({ name: color.name, hex_code: color.hex_code, is_active: color.is_active, sort_order: color.sort_order });
    } else {
      setEditingId(null);
      setForm({ name: '', hex_code: '#000000', is_active: true, sort_order: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/colors/${editingId}`, form);
        toast.success('Warna berhasil diperbarui');
      } else {
        await api.post('/admin/colors', form);
        toast.success('Warna berhasil ditambahkan');
      }
      setShowModal(false);
      fetchColors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan warna');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await api.delete(`/admin/colors/${id}`);
      toast.success('Warna berhasil dihapus');
      fetchColors();
    } catch (error) {
      toast.error('Gagal menghapus warna');
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await api.put(`/admin/colors/${id}`, { is_active: !current });
      fetchColors();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Kelola Warna Sablon</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Tambah Warna
        </button>
      </div>

      <div className="bg-card border border-border p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="input-icon-wrapper">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari nama warna / hex code..."
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
        </div>
      </div>

      {/* Mobile: Card Layout */}
      <div className="sm:hidden space-y-3">
        {colors.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 flex-shrink-0" style={{ backgroundColor: item.hex_code }} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{item.name}</p>
              <p className="text-gray-light text-xs font-mono">{item.hex_code}</p>
            </div>
            <button onClick={() => toggleActive(item.id, item.is_active)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-success/20 text-success' : 'bg-gray-dark/20 text-gray-dark'}`}>
              {item.is_active ? 'Aktif' : 'Nonaktif'}
            </button>
            <div className="flex gap-1">
              <button onClick={() => openModal(item)} className="p-1.5 hover:bg-border rounded-lg"><Edit2 className="w-4 h-4 text-gray-light" /></button>
              <button onClick={() => setConfirmDelete({ show: true, id: item.id })} className="p-1.5 hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4 text-danger" /></button>
            </div>
          </div>
        ))}
        {colors.length === 0 && <div className="bg-card border border-border rounded-xl p-12 text-center text-gray-light">Belum ada warna</div>}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block bg-card border border-border overflow-hidden rounded-xl">
        <table className="w-full">
          <thead className="bg-ink">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray w-14">Warna</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Hex Code</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray">Urutan</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {colors.map((item) => (
              <tr key={item.id} className="hover:bg-ink/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: item.hex_code }} />
                </td>
                <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                <td className="px-4 py-3 font-mono text-gray-light text-sm">{item.hex_code}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(item.id, item.is_active)} className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-success/20 text-success' : 'bg-gray-dark/20 text-gray-dark'}`}>
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center text-gray-light text-sm">{item.sort_order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openModal(item)} className="p-2 hover:bg-border rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-gray-light" /></button>
                    <button onClick={() => setConfirmDelete({ show: true, id: item.id })} className="p-2 hover:bg-danger/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-danger" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {colors.length === 0 && <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-light">Belum ada warna</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-gray-light text-sm">
            Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} warna
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.current_page === 1} className="p-2 rounded-lg bg-card border border-border text-gray-light hover:text-white hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-light text-sm px-2">{pagination.current_page} / {pagination.last_page}</span>
            <button onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} disabled={pagination.current_page === pagination.last_page} className="p-2 rounded-lg bg-card border border-border text-gray-light hover:text-white hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-heading text-xl font-bold text-white">{editingId ? 'Edit Warna' : 'Tambah Warna'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-border rounded-xl"><X className="w-5 h-5 text-gray-light" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama Warna</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="Contoh: Merah Marun" required />
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Hex Code</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={form.hex_code} onChange={(e) => setForm({ ...form, hex_code: e.target.value })} className="w-12 h-12 rounded-lg border border-border cursor-pointer" />
                  <input type="text" value={form.hex_code} onChange={(e) => setForm({ ...form, hex_code: e.target.value })} className="input-dark flex-1 font-mono" placeholder="#000000" required />
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

      <ConfirmDialog isOpen={confirmDelete.show} onClose={() => setConfirmDelete({ show: false, id: null })} onConfirm={handleDelete} title="Hapus Warna" message="Apakah Anda yakin ingin menghapus warna ini?" confirmLabel="Ya, Hapus" variant="danger" />
    </div>
  );
}
