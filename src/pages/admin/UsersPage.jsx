import { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Users,
  SlidersHorizontal,
  X,
  Shield,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const searchRef = useRef('');
  const [quotaTarget, setQuotaTarget] = useState(null);
  const [form, setForm] = useState({ generate_limit: 3, edit_limit: 3 });

  const loadUsers = (signal, pageArg) => {
    const p = pageArg ?? page;
    const params = { page: p };
    if (searchRef.current) params.search = searchRef.current;
    return adminService
      .getUsers(params, signal)
      .then((result) => {
        setUsers(result.data);
        setPagination(result.pagination);
      })
      .catch((error) => {
        if (error?.name !== 'CanceledError') console.error('Failed to fetch users:', error);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchUsers = (signal, pageArg) => loadUsers(signal, pageArg);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      searchRef.current = search;
      setPage(1);
      loadUsers(null, 1);
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    searchRef.current = '';
    setPage(1);
    loadUsers(null, 1);
  };

  const openQuotaModal = (user) => {
    setQuotaTarget(user);
    setForm({
      generate_limit: user.quota?.generate?.limit ?? 3,
      edit_limit: user.quota?.edit?.limit ?? 3,
    });
  };

  const handleSaveQuota = async (e) => {
    e.preventDefault();
    if (!quotaTarget) return;
    setSaving(true);
    try {
      await adminService.updateUserQuota(quotaTarget.id, {
        generate_limit: parseInt(form.generate_limit, 10) || 0,
        edit_limit: parseInt(form.edit_limit, 10) || 0,
      });
      toast.success(`Kuota AI "${quotaTarget.name}" diperbarui (kuota terpakai di-reset).`);
      setQuotaTarget(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui kuota');
    } finally {
      setSaving(false);
    }
  };

  const handleResetQuota = async (user) => {
    try {
      await adminService.updateUserQuota(user.id, {
        generate_limit: user.quota?.generate?.limit ?? 3,
        edit_limit: user.quota?.edit?.limit ?? 3,
      });
      toast.success(`Kuota AI "${user.name}" berhasil di-reset.`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal reset kuota');
    }
  };

  const QuotaCell = ({ label, quota }) => {
    const unlimited = !!quota?.unlimited;
    const remaining = quota?.remaining ?? 0;
    const limit = quota?.limit ?? 0;
    const pct = limit > 0 ? Math.min(100, Math.round((remaining / limit) * 100)) : 0;
    const color = unlimited || remaining > 0 ? 'bg-emerald-400' : 'bg-rose-500';

    return (
      <div className="min-w-[130px]">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-gray uppercase font-semibold">{label}</span>
          <span className="text-white font-mono font-medium">
            {unlimited ? 'Tak Terbatas' : `${remaining} / ${limit}`}
          </span>
        </div>
        <div className="h-1.5 w-full bg-ink rounded-full overflow-hidden border border-border/40">
          <div
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: unlimited ? '100%' : `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Kelola User & Kuota AI</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {pagination.total} User
              </span>
            </div>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Daftar pengguna terdaftar, status hak akses, dan pengaturan alokasi kuota fitur AI Sablon Design Generator.
            </p>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Cari user berdasarkan nama atau email... (Enter)"
                className="input-dark pl-10 pr-9 w-full"
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray bg-ink/50 px-3.5 py-2 rounded-xl border border-border/60">
              <Sparkles size={14} className="text-primary flex-shrink-0" />
              <span>
                Kuota default user: <strong className="text-white">3 Generate</strong> &{' '}
                <strong className="text-white">3 Edit AI</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card border border-border/80 rounded-2xl">
            <LoadingSpinner size="lg" />
            <p className="text-gray text-xs mt-3">Memuat data user...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-ink border border-border flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {user.name?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{user.name}</p>
                        <p className="text-gray text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'bg-ink text-gray border border-border'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-ink/40 border border-border/60">
                    <QuotaCell label="Generate" quota={user.quota?.generate} />
                    <QuotaCell label="Edit" quota={user.quota?.edit} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openQuotaModal(user)}
                      className="flex-1 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <SlidersHorizontal size={13} /> Atur Kuota
                    </button>
                    <button
                      onClick={() => handleResetQuota(user)}
                      className="px-3 py-2 rounded-xl bg-ink border border-border hover:bg-card text-gray hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      title="Reset kuota terpakai menjadi 0"
                    >
                      <RefreshCw size={13} /> Reset
                    </button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-lg">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                    <Users size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada user ditemukan</h3>
                  <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                    {search
                      ? 'Tidak ada akun user yang sesuai dengan kata kunci pencarian Anda.'
                      : 'Belum ada pengguna terdaftar dalam sistem.'}
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
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5 text-center">Peran</th>
                      <th className="px-5 py-3.5">Sisa Kuota Generate</th>
                      <th className="px-5 py-3.5">Sisa Kuota Edit AI</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-ink/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-ink border border-border flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 group-hover:border-primary/40 transition-colors">
                              {user.name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-white truncate max-w-[200px]">{user.name}</p>
                              <p className="text-gray text-xs truncate max-w-[200px]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              user.role === 'admin'
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : 'bg-ink text-gray-light border border-border'
                            }`}
                          >
                            {user.role === 'admin' && <Shield size={12} />}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <QuotaCell label="Generate" quota={user.quota?.generate} />
                        </td>
                        <td className="px-5 py-3.5">
                          <QuotaCell label="Edit AI" quota={user.quota?.edit} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openQuotaModal(user)}
                              className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary/40 text-gray-light hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <SlidersHorizontal size={13} /> Atur Kuota
                            </button>
                            <button
                              onClick={() => handleResetQuota(user)}
                              className="p-2 rounded-xl bg-card border border-border hover:bg-ink text-gray hover:text-white transition-colors"
                              title="Reset kuota terpakai menjadi 0"
                            >
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink border border-border flex items-center justify-center text-gray mb-3">
                            <Users size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">User tidak ditemukan</h3>
                          <p className="text-gray text-xs mt-1 max-w-sm mx-auto">
                            {search
                              ? 'Coba gunakan kata kunci pencarian nama atau email lainnya.'
                              : 'Belum ada akun user terdaftar.'}
                          </p>
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
                    <span className="text-white font-medium">{pagination.total}</span> user
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

        {/* Modal: Atur Kuota AI */}
        {quotaTarget && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-8 transform transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/80 bg-ink/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl text-white tracking-[0.5px]">
                      Atur Kuota AI User
                    </h3>
                    <p className="text-gray text-xs mt-0.5">
                      Sesuaikan alokasi limit generator & editor AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQuotaTarget(null)}
                  className="p-2 hover:bg-ink text-gray hover:text-white rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveQuota} className="p-5 sm:p-6 space-y-4">
                {/* Info User */}
                <div className="bg-ink/50 border border-border/60 rounded-xl p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {quotaTarget.name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{quotaTarget.name}</p>
                      <p className="text-gray text-xs truncate">{quotaTarget.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/40 text-[11px] text-gray flex justify-between">
                    <span>
                      Generate terpakai: <strong className="text-white">{quotaTarget.quota?.generate?.used ?? 0}</strong>
                    </span>
                    <span>
                      Edit terpakai: <strong className="text-white">{quotaTarget.quota?.edit?.used ?? 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                      Limit Generate AI
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.generate_limit}
                      onChange={(e) => setForm({ ...form, generate_limit: e.target.value })}
                      className="input-dark w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray uppercase tracking-wider block mb-1.5">
                      Limit Edit AI
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.edit_limit}
                      onChange={(e) => setForm({ ...form, edit_limit: e.target.value })}
                      className="input-dark w-full"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Menyimpan akan mereset kuota terpakai user menjadi 0 dengan batas limit baru.</span>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
                  <button
                    type="button"
                    onClick={() => setQuotaTarget(null)}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-ink text-gray-light hover:text-white transition-colors text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Simpan & Reset
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}