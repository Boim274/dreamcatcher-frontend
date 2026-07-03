import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Ruler, Search } from 'lucide-react';

export default function SizesPage() {
  const toast = useToast();
  const [sizes, setSizes] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', dimensions: '', service_id: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', service_id: '' });

  useEffect(() => {
    fetchData();
  }, [page, filters.service_id]);

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
      if (f.service_id) params.service_id = f.service_id;
      const [sizeRes, svcRes] = await Promise.all([
        api.get('/admin/sizes', { params }),
        p === 1 ? api.get('/admin/services') : Promise.resolve(null),
      ]);
      setSizes(sizeRes.data.sizes.data);
      setPagination(sizeRes.data.sizes);
      if (svcRes) setServices(svcRes.data.services.data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({ name: item.name, dimensions: item.dimensions || '', service_id: item.service_id || '', sort_order: item.sort_order });
    } else {
      setEditingId(null);
      setForm({ name: '', dimensions: '', service_id: '', sort_order: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, service_id: form.service_id || null };
      if (editingId) {
        await api.put(`/admin/sizes/${editingId}`, data);
        toast.success('Ukuran berhasil diperbarui');
      } else {
        await api.post('/admin/sizes', data);
        toast.success('Ukuran berhasil ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan ukuran');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await api.delete(`/admin/sizes/${id}`);
      toast.success('Ukuran berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus ukuran');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Kelola Ukuran</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Tambah Ukuran</button>
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
                placeholder="Cari nama ukuran / dimensi..."
                className="input-dark"
              />
            </div>
          </div>

          <select
            value={filters.service_id}
            onChange={(e) => handleFilter('service_id', e.target.value)}
            className="input-dark"
          >
            <option value="">Semua Layanan</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {sizes.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Ruler className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{item.name}</p>
              <p className="text-gray-light text-xs">{item.dimensions || '-'}</p>
              {item.service && <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full">{item.service.name}</span>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => openModal(item)} className="p-1.5 hover:bg-border rounded-lg"><Edit2 className="w-4 h-4 text-gray-light" /></button>
              <button onClick={() => setConfirmDelete({ show: true, id: item.id })} className="p-1.5 hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4 text-danger" /></button>
            </div>
          </div>
        ))}
        {sizes.length === 0 && <div className="bg-card border border-border rounded-xl p-12 text-center text-gray-light">Belum ada ukuran</div>}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block bg-card border border-border overflow-hidden rounded-xl">
        <table className="w-full">
          <thead className="bg-ink">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Dimensi</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Layanan</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray">Urutan</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sizes.map((item) => (
              <tr key={item.id} className="hover:bg-ink/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                <td className="px-4 py-3 text-gray-light text-sm">{item.dimensions || '-'}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {item.service?.name || 'Umum'}
                  </span>
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
            {sizes.length === 0 && <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-light">Belum ada ukuran</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-gray-light text-sm">Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} ukuran</p>
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
          <div className="bg-card border border-border w-full max-w-md rounded-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-heading text-xl font-bold text-white">{editingId ? 'Edit Ukuran' : 'Tambah Ukuran'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-border rounded-xl"><X className="w-5 h-5 text-gray-light" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama Ukuran</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="Contoh: S, M, L, XL" required />
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Dimensi</label>
                <input type="text" value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} className="input-dark" placeholder="Contoh: Lebar 40cm, Panjang 60cm" />
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Layanan (Opsional)</label>
                <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} className="input-dark">
                  <option value="">Umum (Semua Layanan)</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Urutan</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="input-dark" min="0" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <LoadingSpinner size="sm" /> : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDelete.show} onClose={() => setConfirmDelete({ show: false, id: null })} onConfirm={handleDelete} title="Hapus Ukuran" message="Apakah Anda yakin ingin menghapus ukuran ini?" confirmLabel="Ya, Hapus" variant="danger" />
    </div>
  );
}
