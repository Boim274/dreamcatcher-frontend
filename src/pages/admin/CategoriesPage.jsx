import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  GripVertical,
  FolderTree,
  Search,
  CheckCircle2,
  Package,
} from 'lucide-react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchData = async (signal) => {
    try {
      const res = await adminService.getCategories(signal);
      setCategories(res);
    } catch (err) {
      if (err?.name !== 'CanceledError') console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item) => {
    if (item) {
      setEditingId(item.id);
      setForm({ name: item.name, sort_order: item.sort_order });
    } else {
      setEditingId(null);
      setForm({ name: '', sort_order: categories.length + 1 });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.warning('Nama kategori wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await adminService.updateCategory(editingId, form);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await adminService.createCategory(form);
        toast.success('Kategori baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteCategory(confirmDelete.id);
      toast.success('Kategori berhasil dihapus');
      setConfirmDelete({ show: false, id: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kategori');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Kategori Produk</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {categories.length} Total
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Kelola kategori pengelompokan produk toko (misal: Kaos Polos, Raglan, Hoodie, Totebag).
            </p>
          </div>
          <button
            onClick={() => openModal(null)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Tambah Kategori
          </button>
        </div>

        {/* Filter Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark pl-10 pr-9 w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span className="text-gray text-xs self-start sm:self-auto">
            Menampilkan {filteredCategories.length} dari {categories.length} kategori
          </span>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card border border-border/80 rounded-2xl">
            <LoadingSpinner size="lg" />
            <p className="text-gray text-xs mt-3">Memuat data kategori...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-ink border border-border flex items-center justify-center text-primary flex-shrink-0">
                      <FolderTree size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{cat.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-gray text-xs">Urutan: #{cat.sort_order}</span>
                        <span className="text-gray">•</span>
                        <span className="text-primary text-xs font-semibold">
                          {cat.products_count || 0} produk
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openModal(cat)}
                      className="p-2 rounded-xl bg-ink border border-border hover:border-primary/40 text-gray hover:text-white transition-colors"
                      title="Edit Kategori"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ show: true, id: cat.id })}
                      className="p-2 rounded-xl bg-ink border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredCategories.length === 0 && (
                <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-lg">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                    <FolderTree size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada kategori</h3>
                  <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                    {search
                      ? 'Tidak ada kategori yang cocok dengan pencarian Anda.'
                      : 'Kategori produk belum tersedia. Tambahkan kategori baru sekarang.'}
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
                      <th className="px-5 py-3.5 w-20 text-center">Urutan</th>
                      <th className="px-5 py-3.5">Nama Kategori</th>
                      <th className="px-5 py-3.5 text-center">Total Produk Terkait</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-ink/40 transition-colors group">
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink border border-border text-xs text-gray-light font-mono">
                            <GripVertical size={12} className="text-gray" />
                            {cat.sort_order}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-ink border border-border flex items-center justify-center text-primary group-hover:border-primary/40 transition-colors">
                              <FolderTree size={16} />
                            </div>
                            <span className="font-semibold text-white">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            <Package size={13} />
                            {cat.products_count || 0} Produk
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(cat)}
                              className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all shadow-sm"
                              title="Edit Kategori"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ show: true, id: cat.id })}
                              className="p-2 rounded-xl bg-card border border-border hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all shadow-sm"
                              title="Hapus Kategori"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredCategories.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <FolderTree size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Kategori tidak ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {search
                              ? 'Coba ganti kata kunci pencarian Anda.'
                              : 'Belum ada kategori yang ditambahkan. Silakan klik tombol "Tambah Kategori".'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal: Tambah / Edit Kategori */}
        {showModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-8 transform transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/80 bg-ink/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <FolderTree size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl text-white tracking-[0.5px]">
                      {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                    </h3>
                    <p className="text-gray text-xs mt-0.5">
                      {editingId ? 'Perbarui nama atau urutan kategori produk' : 'Buat kelompok kategori baru untuk katalog'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-ink text-gray hover:text-white rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="p-5 sm:p-6 space-y-4"
              >
                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Nama Kategori <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="input-dark w-full"
                    placeholder="Contoh: Kaos Polos Combed, Jaket Hoodie..."
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                    Urutan Prioritas Tampil
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                    className="input-dark w-full"
                    min="0"
                  />
                  <p className="text-gray text-[11px] mt-1.5">
                    Nomor lebih kecil akan ditampilkan lebih awal pada navigasi dan filter.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-ink text-gray-light hover:text-white transition-colors text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Simpan Kategori
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
          title="Hapus Kategori Produk"
          message="Yakin ingin menghapus kategori ini? Kategori yang masih memiliki produk terkait tidak dapat dihapus."
          confirmLabel="Ya, Hapus Kategori"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
