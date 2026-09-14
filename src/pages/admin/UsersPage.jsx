import { useState, useEffect, useRef, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import UserAvatar from '../../components/common/UserAvatar';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Users,
  SlidersHorizontal,
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Lock,
  UserCheck,
  UserX,
  ShoppingBag,
  Clock,
  Key,
  Check,
  MoreVertical,
} from 'lucide-react';

export default function UsersPage() {
  const toast = useToast();
  const { user: currentAdmin } = useAuthStore();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, admin_count: 0, customer_count: 0 });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'customer'
  const [search, setSearch] = useState('');
  const searchRef = useRef('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [quotaTarget, setQuotaTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    address: '',
    generate_limit: 3,
    edit_limit: 3,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    address: '',
  });

  const [quotaForm, setQuotaForm] = useState({
    generate_limit: 3,
    edit_limit: 3,
  });

  const loadUsers = useCallback((signal, pageArg, roleArg) => {
    const p = pageArg ?? page;
    const r = roleArg ?? roleFilter;
    const params = { page: p };
    if (searchRef.current) params.search = searchRef.current;
    if (r !== 'all') params.role = r;

    return adminService
      .getUsers(params, signal)
      .then((result) => {
        setUsers(result.data);
        setPagination(result.pagination);
        if (result.stats) {
          setStats(result.stats);
        }
      })
      .catch((error) => {
        if (error?.name !== 'CanceledError') {
          console.error('Failed to fetch users:', error);
          toast.error('Gagal memuat daftar pengguna.');
        }
      })
      .finally(() => setLoading(false));
  }, [page, roleFilter, toast]);

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

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

  const handleRoleFilterChange = (newRole) => {
    setRoleFilter(newRole);
    setPage(1);
    loadUsers(null, 1, newRole);
  };

  // CREATE USER
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.createUser({
        ...createForm,
        generate_limit: parseInt(createForm.generate_limit, 10) || 3,
        edit_limit: parseInt(createForm.edit_limit, 10) || 3,
      });
      toast.success(`Pengguna "${createForm.name}" berhasil dibuat.`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        phone: '',
        address: '',
        generate_limit: 3,
        edit_limit: 3,
      });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pengguna baru');
    } finally {
      setSaving(false);
    }
  };

  // OPEN EDIT USER MODAL
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'customer',
      phone: user.phone || '',
      address: user.address || '',
    });
  };

  // SAVE EDIT USER
  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        phone: editForm.phone,
        address: editForm.address,
      };
      if (editForm.password && editForm.password.trim().length > 0) {
        payload.password = editForm.password;
      }
      await adminService.updateUser(editingUser.id, payload);
      toast.success(`Data pengguna "${editForm.name}" berhasil diperbarui.`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui pengguna');
    } finally {
      setSaving(false);
    }
  };

  // TOGGLE ROLE DIRECTLY / CONFIRM
  const handleToggleRole = (user) => {
    if (currentAdmin && currentAdmin.id === user.id) {
      toast.warning('Anda tidak dapat mengubah role akun admin Anda sendiri.');
      return;
    }
    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    setRoleTarget({ user, newRole });
  };

  const handleConfirmRoleChange = async () => {
    if (!roleTarget) return;
    const { user, newRole } = roleTarget;
    setSaving(true);
    try {
      await adminService.updateUserRole(user.id, newRole);
      toast.success(`Role "${user.name}" berhasil diubah menjadi ${newRole.toUpperCase()}.`);
      setRoleTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah role pengguna');
    } finally {
      setSaving(false);
    }
  };

  // DELETE USER
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminService.deleteUser(deleteTarget.id);
      toast.success(`Pengguna "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna');
    } finally {
      setSaving(false);
    }
  };

  // QUOTA MANAGEMENT
  const openQuotaModal = (user) => {
    setQuotaTarget(user);
    setQuotaForm({
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
        generate_limit: parseInt(quotaForm.generate_limit, 10) || 0,
        edit_limit: parseInt(quotaForm.edit_limit, 10) || 0,
      });
      toast.success(`Kuota AI "${quotaTarget.name}" diperbarui & kuota terpakai di-reset.`);
      setQuotaTarget(null);
      loadUsers();
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
      loadUsers();
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
      <div className="min-w-[120px]">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-zinc-400 uppercase font-semibold text-[10px]">{label}</span>
          <span className="text-white font-mono font-bold text-[11px]">
            {unlimited ? '∞' : `${remaining} / ${limit}`}
          </span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
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
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">
                Kelola Pengguna & Hak Akses
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                {stats.total || pagination.total} Total User
              </span>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Atur hak akses peran (Admin / Customer), data akun pelanggan, dan alokasi kuota AI Studio.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setLoading(true);
                loadUsers();
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Muat Ulang Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#ff60a8] hover:brightness-110 active:scale-95 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/30 transition-all cursor-pointer border-none"
            >
              <Plus size={16} />
              <span>Tambah User</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <Users size={24} />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Total Pengguna</p>
              <p className="text-2xl font-bold text-white font-heading mt-0.5">{stats.total || pagination.total}</p>
            </div>
          </div>

          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Administrator</p>
              <p className="text-2xl font-bold text-primary font-heading mt-0.5">{stats.admin_count} Admin</p>
            </div>
          </div>

          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/40">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Customer / Member</p>
              <p className="text-2xl font-bold text-emerald-400 font-heading mt-0.5">{stats.customer_count} Customer</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Cari user (Nama, Email, WhatsApp)... Tekan Enter"
                className="input-dark pl-11 pr-9 w-full bg-[#120a16] border-white/15 focus:border-primary"
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleRoleFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua ({stats.total || pagination.total})
              </button>
              <button
                type="button"
                onClick={() => handleRoleFilterChange('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                  roleFilter === 'admin'
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Shield size={12} />
                <span>Admin ({stats.admin_count})</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleFilterChange('customer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  roleFilter === 'customer'
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Customer ({stats.customer_count})
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-[#180f1e]/90 border border-white/10 rounded-2xl backdrop-blur-xl">
            <LoadingSpinner size="lg" />
            <p className="text-zinc-400 text-xs mt-3">Memuat data pengguna...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {users.map((user) => {
                const isSelf = currentAdmin?.id === user.id;
                const isAdmin = user.role === 'admin';

                return (
                  <div
                    key={user.id}
                    className="bg-[#180f1e]/90 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={user} size="w-11 h-11 text-sm" rounded="rounded-2xl" border />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-white text-sm truncate">{user.name}</p>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-primary text-white font-extrabold uppercase">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-xs truncate">{user.email}</p>
                          {user.phone && (
                            <p className="text-zinc-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <Phone size={10} className="text-emerald-400" /> {user.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Role Pill Switcher */}
                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={isSelf}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                          isSelf ? 'opacity-80 cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'
                        } ${
                          isAdmin
                            ? 'bg-gradient-to-r from-primary/20 to-[#ff60a8]/20 text-primary border border-primary/40 shadow-sm'
                            : 'bg-white/5 text-zinc-300 border border-white/15 hover:border-white/30'
                        }`}
                        title={isSelf ? 'Akun Anda sendiri' : 'Klik untuk mengubah role'}
                      >
                        {isAdmin ? <Shield size={12} /> : <UserCheck size={12} />}
                        <span>{user.role}</span>
                      </button>
                    </div>

                    {/* Quota Progress */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                      <QuotaCell label="Generate AI" quota={user.quota?.generate} />
                      <QuotaCell label="Edit AI" quota={user.quota?.edit} />
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => openEditModal(user)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} /> Edit User
                      </button>
                      <button
                        onClick={() => openQuotaModal(user)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Atur limit kuota AI"
                      >
                        <SlidersHorizontal size={13} /> Kuota
                      </button>
                      <button
                        onClick={() => handleResetQuota(user)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Reset kuota terpakai menjadi 0"
                      >
                        <RefreshCw size={14} />
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Hapus user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {users.length === 0 && (
                <div className="bg-[#180f1e]/90 border border-white/10 rounded-2xl p-12 text-center shadow-xl backdrop-blur-xl">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mb-3">
                    <Users size={28} />
                  </div>
                  <h3 className="font-semibold text-white text-base">Tidak ada user ditemukan</h3>
                  <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
                    {search
                      ? 'Tidak ada akun user yang sesuai dengan kata kunci pencarian.'
                      : 'Belum ada data pengguna yang terdaftar.'}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block bg-[#180f1e]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/50 border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-heading">
                    <tr>
                      <th className="px-5 py-4">Pengguna</th>
                      <th className="px-5 py-4 text-center">Peran / Role</th>
                      <th className="px-5 py-4 text-center">Pesanan</th>
                      <th className="px-5 py-4">Kuota Generate</th>
                      <th className="px-5 py-4">Kuota Edit AI</th>
                      <th className="px-5 py-4 text-right">Kelola Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {users.map((user) => {
                      const isSelf = currentAdmin?.id === user.id;
                      const isAdmin = user.role === 'admin';

                      return (
                        <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                          {/* User Avatar + Info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={user} size="w-10 h-10 text-xs" rounded="rounded-2xl" border />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-white truncate max-w-[180px]">{user.name}</p>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary text-white font-extrabold uppercase">
                                      Anda
                                    </span>
                                  )}
                                  {user.google_id && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-zinc-300 font-medium">
                                      Google
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-400 text-xs truncate max-w-[200px]">{user.email}</p>
                                {user.phone && (
                                  <p className="text-zinc-500 text-[11px] flex items-center gap-1 mt-0.5">
                                    <Phone size={10} className="text-emerald-400" /> {user.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role Pill Switcher */}
                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleRole(user)}
                              disabled={isSelf}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                                isSelf
                                  ? 'opacity-85 cursor-default'
                                  : 'cursor-pointer hover:scale-105 active:scale-95 shadow-sm'
                              } ${
                                isAdmin
                                  ? 'bg-gradient-to-r from-primary/20 to-[#ff60a8]/20 text-primary border border-primary/40 hover:bg-primary/30 shadow-primary/20'
                                  : 'bg-white/5 text-zinc-300 border border-white/15 hover:border-white/30 hover:bg-white/10'
                              }`}
                              title={isSelf ? 'Akun login Anda saat ini' : `Klik untuk mengubah ke ${isAdmin ? 'CUSTOMER' : 'ADMIN'}`}
                            >
                              {isAdmin ? <Shield size={13} className="text-primary" /> : <UserCheck size={13} className="text-zinc-400" />}
                              <span>{user.role}</span>
                            </button>
                          </td>

                          {/* Total Orders */}
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold">
                              <ShoppingBag size={12} className="text-primary" />
                              <span>{user.orders_count ?? 0}</span>
                            </span>
                          </td>

                          {/* AI Generate Quota */}
                          <td className="px-5 py-4">
                            <QuotaCell label="Generate" quota={user.quota?.generate} />
                          </td>

                          {/* AI Edit Quota */}
                          <td className="px-5 py-4">
                            <QuotaCell label="Edit AI" quota={user.quota?.edit} />
                          </td>

                          {/* Action Buttons */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-primary/40 text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
                                title="Edit Biodata & Password User"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => openQuotaModal(user)}
                                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-primary/40 text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
                                title="Atur Limit Kuota AI"
                              >
                                <SlidersHorizontal size={14} />
                              </button>
                              <button
                                onClick={() => handleResetQuota(user)}
                                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-zinc-400 hover:text-white transition-all cursor-pointer"
                                title="Reset Kuota Terpakai (0)"
                              >
                                <RefreshCw size={14} />
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => setDeleteTarget(user)}
                                  className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                                  title="Hapus Pengguna"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mb-3">
                            <Users size={28} />
                          </div>
                          <h3 className="font-semibold text-white text-base">Pengguna tidak ditemukan</h3>
                          <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
                            {search
                              ? 'Coba gunakan kata kunci pencarian nama atau email lainnya.'
                              : 'Belum ada data pengguna terdaftar.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/30 text-xs text-zinc-400">
                  <p>
                    Menampilkan <span className="text-white font-bold">{(pagination.current_page - 1) * pagination.per_page + 1}</span>–
                    <span className="text-white font-bold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> dari{' '}
                    <span className="text-white font-bold">{pagination.total}</span> pengguna
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.current_page === 1}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white font-bold">
                      {pagination.current_page} / {pagination.last_page}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                      disabled={pagination.current_page === pagination.last_page}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* MODAL 1: TAMBAH USER BARU         {/* MODAL 1: CREATE USER */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-lg rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              {/* Top Accent Line & Glow */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
              <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-primary/15 blur-3xl rounded-full" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/15 blur-3xl rounded-full" />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20 shrink-0">
                    <Plus size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                      Tambah Pengguna Baru
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Buat akun Administrator atau Customer baru
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateUser} className="relative p-6 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                    Nama Lengkap <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Contoh: Budi Pratama"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                      Password Awal <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Min. 6 Karakter"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                      Role / Hak Akses <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="customer" className="bg-[#140b19] text-white">Customer (Pelanggan)</option>
                      <option value="admin" className="bg-[#140b19] text-white">Administrator (Admin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                      No. WhatsApp
                    </label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="08123456789"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                    Alamat Pengiriman
                  </label>
                  <textarea
                    rows={2}
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="Alamat lengkap customer..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner resize-none"
                  />
                </div>

                {/* AI Quotas Default */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-heading">
                    <Sparkles size={15} className="text-primary animate-pulse" />
                    <span>ALOKASI AWAL KUOTA AI STUDIO</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Limit Generate AI
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={createForm.generate_limit}
                        onChange={(e) => setCreateForm({ ...createForm, generate_limit: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Limit Edit AI
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={createForm.edit_limit}
                        onChange={(e) => setCreateForm({ ...createForm, edit_limit: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                  >
                    {saving ? <LoadingSpinner size="sm" /> : <CheckCircle2 size={16} />}
                    <span>{saving ? 'Menyimpan...' : 'Simpan Pengguna'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT USER */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-lg rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              {/* Top Accent Line & Glow */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
              <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-primary/15 blur-3xl rounded-full" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/15 blur-3xl rounded-full" />

              {/* Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20 shrink-0">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                      Edit Data Pengguna
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Ubah data profil, role, atau reset password user
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEditUser} className="relative p-6 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                    Nama Lengkap <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                      Role / Hak Akses <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editForm.role}
                      disabled={currentAdmin?.id === editingUser.id}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <option value="customer" className="bg-[#140b19] text-white">Customer</option>
                      <option value="admin" className="bg-[#140b19] text-white">Administrator</option>
                    </select>
                    {currentAdmin?.id === editingUser.id && (
                      <p className="text-[10px] text-zinc-500 mt-1">Anda tidak dapat mengubah role akun Anda sendiri.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                    Alamat Pengiriman
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Alamat customer..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner resize-none"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-heading">
                    <Key size={14} className="text-primary" />
                    <span>UBAH KATA SANDI (OPSIONAL)</span>
                  </div>
                  <input
                    type="password"
                    minLength={6}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                  >
                    {saving ? <LoadingSpinner size="sm" /> : <CheckCircle2 size={16} />}
                    <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ATUR KUOTA AI */}
        {quotaTarget && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-md rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              {/* Top Accent Line & Glow */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
              <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-primary/15 blur-3xl rounded-full" />

              {/* Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20 shrink-0">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                      Atur Kuota AI Studio
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Sesuaikan batas limit generate & editor AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQuotaTarget(null)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveQuota} className="relative p-6 space-y-4">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={quotaTarget.name}
                      avatarUrl={quotaTarget.avatar_url}
                      className="w-11 h-11 ring-2 ring-primary/30"
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{quotaTarget.name}</p>
                      <p className="text-zinc-400 text-xs truncate">{quotaTarget.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-zinc-400 flex justify-between">
                    <span>
                      Generate terpakai: <strong className="text-white font-mono">{quotaTarget.quota?.generate?.used ?? 0}</strong>
                    </span>
                    <span>
                      Edit terpakai: <strong className="text-white font-mono">{quotaTarget.quota?.edit?.used ?? 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                      Limit Generate AI
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.generate_limit}
                      onChange={(e) => setQuotaForm({ ...quotaForm, generate_limit: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 font-heading">
                      Limit Edit AI
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.edit_limit}
                      onChange={(e) => setQuotaForm({ ...quotaForm, edit_limit: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Menyimpan limit baru akan otomatis me-reset jumlah kuota terpakai user menjadi 0.</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setQuotaTarget(null)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                  >
                    {saving ? <LoadingSpinner size="sm" /> : <CheckCircle2 size={16} />}
                    <span>{saving ? 'Menyimpan...' : 'Simpan & Reset'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: KONFIRMASI UBAH ROLE */}
        {roleTarget && (
          <ConfirmDialog
            isOpen={true}
            title={`Ubah Role User ke ${roleTarget.newRole.toUpperCase()}?`}
            message={`Apakah Anda yakin ingin mengubah hak akses "${roleTarget.user.name}" menjadi ${roleTarget.newRole.toUpperCase()}? ${
              roleTarget.newRole === 'admin'
                ? 'Pengguna ini akan memiliki hak penuh untuk mengakses Dashboard Admin.'
                : 'Hak akses admin pengguna ini akan dicabut.'
            }`}
            confirmText={`Ya, Jadikan ${roleTarget.newRole.toUpperCase()}`}
            cancelText="Batal"
            variant={roleTarget.newRole === 'admin' ? 'primary' : 'warning'}
            onConfirm={handleConfirmRoleChange}
            onCancel={() => setRoleTarget(null)}
          />
        )}

        {/* MODAL 5: KONFIRMASI HAPUS USER */}
        {deleteTarget && (
          <ConfirmDialog
            isOpen={true}
            title="Hapus Pengguna?"
            message={`Apakah Anda yakin ingin menghapus akun pengguna "${deleteTarget.name}" (${deleteTarget.email})? Tindakan ini tidak dapat dibatalkan.`}
            confirmText="Ya, Hapus Pengguna"
            cancelText="Batal"
            variant="danger"
            onConfirm={handleDeleteUser}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}