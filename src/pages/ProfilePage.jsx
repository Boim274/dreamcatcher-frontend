import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
import Icon from '../components/ui/Icon';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';
import { useToast } from '../components/ui/Toast';
import PhoneCountryInput from '../components/common/PhoneCountryInput';
import { WA_URL } from '../constants/whatsapp';
import api from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Lock,
  Package,
  Clock,
  ShoppingBag,
  Sparkles,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Loader2,
  Calendar,
  Camera,
  Trash2,
  Upload
} from 'lucide-react';

export default function ProfilePage() {
  const { language } = useLanguageStore();
  const { user, updateProfile, updateAvatar, deleteAvatar, changePassword, logout } = useAuthStore();
  const cartItems = useCartStore((s) => s.items);
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('biodata'); // 'biodata' | 'security' | 'activity'
  const [isEditing, setIsEditing] = useState(false);
  const avatarInputRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Orders summary statistics
  const [orderStats, setOrderStats] = useState({ active: 0, total: 0, completed: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form state
  const [pwForm, setPwForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  // Logout confirm modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Fetch customer orders for summary statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        let activeCount = 0;
        let completedCount = 0;
        let totalCount = 0;

        try {
          const res = await api.get('/orders/my-stats');
          if (res.data?.stats) {
            totalCount = res.data.stats.total || 0;
            activeCount = res.data.stats.active || 0;
            completedCount = res.data.stats.completed || 0;
          }
        } catch {
          // Fallback to /orders if my-stats is unavailable
          const res = await api.get('/orders', { params: { per_page: 100 } });
          const orders = res.data.orders?.data || res.data.orders || [];
          const activeStatuses = [
            'pending',
            'waiting_payment',
            'waiting_verification',
            'ready_to_process',
            'processing',
            'ready_for_pickup',
            'cancel_requested',
          ];
          activeCount = orders.filter((o) => activeStatuses.includes(o.status)).length;
          completedCount = orders.filter((o) => o.status === 'completed').length;
          totalCount = orders.length;
        }

        setOrderStats({
          total: totalCount,
          active: activeCount,
          completed: completedCount,
        });
      } catch (err) {
        console.error('Failed to load order stats:', err);
        setOrderStats({ total: 0, active: 0, completed: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.warning(language === 'en' ? 'Unsupported format. Please select JPG, PNG, WEBP, or GIF.' : 'Format tidak didukung. Harap pilih gambar JPG, PNG, WEBP, atau GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning(language === 'en' ? 'Image size maximum 5 MB.' : 'Ukuran gambar maksimal 5 MB.');
      return;
    }

    setAvatarLoading(true);
    try {
      await updateAvatar(file);
      toast.success(language === 'en' ? 'Profile picture updated successfully!' : 'Foto profil berhasil diperbarui!');
    } catch (err) {
      toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to upload profile picture' : 'Gagal mengunggah foto profil'));
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm(language === 'en' ? 'Delete profile picture and use name initials?' : 'Hapus foto profil dan gunakan inisial nama?')) return;
    setAvatarLoading(true);
    try {
      await deleteAvatar();
      toast.success(language === 'en' ? 'Profile picture deleted successfully' : 'Foto profil berhasil dihapus');
    } catch (err) {
      toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to delete profile picture' : 'Gagal menghapus foto profil'));
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const phone = (profileForm.phone || '').trim().replace(/[\s-]/g, '');
    if (phone && !/^\+?[0-9]{8,20}$/.test(phone)) {
      toast.warning(language === 'en' ? 'Phone number must be between 8 and 20 digits.' : 'Nomor HP harus berupa angka minimal 8 digit dan maksimal 20 digit.');
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile({ ...profileForm, phone });
      toast.success(language === 'en' ? 'Profile updated successfully!' : 'Profil berhasil diperbarui!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to update profile' : 'Gagal memperbarui profil'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwErrors({});

    if (pwForm.password !== pwForm.password_confirmation) {
      setPwErrors({ password_confirmation: [language === 'en' ? 'Password confirmation does not match.' : 'Konfirmasi password tidak sesuai.'] });
      return;
    }

    setPwLoading(true);
    try {
      const payload = {
        password: pwForm.password,
        password_confirmation: pwForm.password_confirmation,
      };
      if (pwForm.current_password) {
        payload.current_password = pwForm.current_password;
      }
      await changePassword(payload);
      toast.success(user?.google_id ? (language === 'en' ? 'Password created successfully! You can now log in with Email & Password.' : 'Kata sandi berhasil dibuat! Anda kini dapat login dengan Email & Password.') : (language === 'en' ? 'Password changed successfully!' : 'Kata sandi berhasil diubah!'));
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setPwErrors(errs);
      } else {
        toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to change password' : 'Gagal mengubah password'));
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(language === 'en' ? 'Logged out successfully.' : 'Berhasil keluar dari akun.');
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  // Password strength calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-white transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#120c16] text-white'
    }`}>
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />

      <main className="flex-1 py-10 sm:py-14 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Breadcrumb / Title */}
          <div className="mb-8">
            <ScrollReveal>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold tracking-[2px] uppercase mb-2 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Customer Account Hub
                  </div>
                  <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white tracking-wide">
                    {language === 'en' ? 'MY ' : 'PROFIL '}<span className="text-gradient">{language === 'en' ? 'PROFILE' : 'SAYA'}</span>
                  </h1>
                </div>

                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                >
                  <LogOut size={15} /> {language === 'en' ? 'Log Out' : 'Keluar Akun'}
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Profile Hero Card */}
          <ScrollReveal direction="up" delay={100}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 mb-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                
                {/* User Avatar with Interactive Upload Trigger */}
                <div className="flex flex-col items-center sm:items-start shrink-0">
                  <div className="relative group/avatar">
                    <div
                      onClick={() => !avatarLoading && avatarInputRef.current?.click()}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-primary via-[#ff60a8] to-purple-600 p-[3px] shadow-xl shadow-primary/30 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                      title={language === 'en' ? 'Click to change profile picture' : 'Klik untuk mengganti foto profil'}
                    >
                      <div className="w-full h-full rounded-[21px] flex items-center justify-center overflow-hidden relative">
                        <UserAvatar
                          user={user}
                          size="w-full h-full text-4xl"
                          rounded="rounded-[21px]"
                          alt={user?.name}
                        />

                        {/* Hover Overlay */}
                        <div
                          className={`absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center transition-opacity duration-200 ${
                            avatarLoading ? 'opacity-100' : 'opacity-0 group-hover/avatar:opacity-100'
                          }`}
                        >
                          {avatarLoading ? (
                            <Loader2 size={24} className="text-primary animate-spin" />
                          ) : (
                            <>
                              <Camera size={22} className="text-white mb-1 drop-shadow-md" />
                              <span className="text-[10px] font-bold text-white tracking-wider uppercase drop-shadow">
                                {language === 'en' ? 'Change Photo' : 'Ganti Foto'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Camera Upload Badge Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        avatarInputRef.current?.click();
                      }}
                      disabled={avatarLoading}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-[#ff60a8] border-2 border-[#120c16] flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all text-white cursor-pointer z-10"
                      title={language === 'en' ? 'Upload New Profile Picture' : 'Unggah Foto Profil Baru'}
                    >
                      {avatarLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Camera size={13} />
                      )}
                    </button>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      className="hidden"
                    />
                  </div>

                  {/* Actions under avatar: Upload quick link & Delete if exists */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarLoading}
                      className="text-[11px] font-semibold text-primary hover:text-[#ff60a8] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Camera size={12} />
                      <span>{avatarLoading ? (language === 'en' ? 'Uploading...' : 'Mengunggah...') : (language === 'en' ? 'Change Photo' : 'Ganti Foto')}</span>
                    </button>
                    {user?.avatar && !avatarLoading && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          className="text-[11px] font-medium text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                          title={language === 'en' ? 'Delete profile picture' : 'Hapus foto profil'}
                        >
                          <Trash2 size={11} />
                          <span>{language === 'en' ? 'Delete' : 'Hapus'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* User Info Details */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                    <h2 className="font-heading text-2xl sm:text-3xl text-white font-bold">
                      {user?.name || (language === 'en' ? 'Custom Customer' : 'Pelanggan Sablon')}
                    </h2>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                      Verified Member
                    </span>
                    {user?.google_id && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Google Linked
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-xs sm:text-sm mb-4">
                    {user?.email} • {language === 'en' ? 'Joined since ' : 'Bergabung sejak '}{user?.created_at ? new Date(user.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'long', year: 'numeric' }) : '2025'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-300">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
                      <Phone size={14} className="text-primary shrink-0" />
                      <span>{user?.phone || (language === 'en' ? 'Phone number not set' : 'Nomor HP belum diisi')}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 max-w-sm">
                      <MapPin size={14} className="text-primary shrink-0" />
                      <span className="truncate">{user?.address || (language === 'en' ? 'Delivery address not set' : 'Alamat pengiriman belum diisi')}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="sm:self-center">
                  <button
                    onClick={() => {
                      setActiveTab('biodata');
                      setIsEditing(true);
                    }}
                    className="btn-gradient-primary inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25"
                  >
                    <Pencil size={14} /> {language === 'en' ? 'Edit Profile' : 'Edit Biodata'}
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Stats Grid */}
          <ScrollReveal direction="up" delay={150}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Pesanan Aktif */}
              <Link
                to="/pesanan-saya"
                className="glass-card-hover rounded-2xl p-5 border border-white/10 bg-white/[0.02] backdrop-blur-xl group no-underline transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package size={20} />
                  </div>
                  <ChevronRight size={16} className="text-gray-500 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-gray-400 text-xs font-medium">{language === 'en' ? 'Active Orders' : 'Pesanan Aktif'}</p>
                <p className="font-heading text-2xl text-white font-bold mt-1 group-hover:text-primary transition-colors">
                  {statsLoading ? '...' : orderStats.active}
                </p>
              </Link>

              {/* Histori Pesanan */}
              <Link
                to="/histori-pesanan"
                className="glass-card-hover rounded-2xl p-5 border border-white/10 bg-white/[0.02] backdrop-blur-xl group no-underline transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock size={20} />
                  </div>
                  <ChevronRight size={16} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
                </div>
                <p className="text-gray-400 text-xs font-medium">{language === 'en' ? 'Completed History' : 'Riwayat Selesai'}</p>
                <p className="font-heading text-2xl text-white font-bold mt-1 group-hover:text-purple-400 transition-colors">
                  {statsLoading ? '...' : orderStats.completed}
                </p>
              </Link>

              {/* Keranjang Belanja */}
              <Link
                to="/keranjang"
                className="glass-card-hover rounded-2xl p-5 border border-white/10 bg-white/[0.02] backdrop-blur-xl group no-underline transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag size={20} />
                  </div>
                  <ChevronRight size={16} className="text-gray-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-gray-400 text-xs font-medium">{language === 'en' ? 'Shopping Cart' : 'Keranjang Belanja'}</p>
                <p className="font-heading text-2xl text-white font-bold mt-1 group-hover:text-amber-400 transition-colors">
                  {cartItems.length}
                </p>
              </Link>

              {/* AI Design Studio */}
              <Link
                to="/design-studio"
                className="glass-card-hover rounded-2xl p-5 border border-white/10 bg-white/[0.02] backdrop-blur-xl group no-underline transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles size={20} />
                  </div>
                  <ChevronRight size={16} className="text-gray-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-gray-400 text-xs font-medium">Design Studio</p>
                <p className="font-heading text-sm text-white font-bold mt-1.5 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                  {language === 'en' ? 'Open AI Studio' : 'Buka AI Studio'} <ExternalLink size={13} />
                </p>
              </Link>
            </div>
          </ScrollReveal>

          {/* Section Tabs */}
          <ScrollReveal direction="up" delay={200}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden backdrop-blur-xl shadow-2xl mb-12">
              
              {/* Tab Navigation */}
              <div className="flex flex-wrap border-b border-white/10 bg-white/[0.01] px-4 sm:px-6 pt-2">
                <button
                  onClick={() => { setActiveTab('biodata'); setIsEditing(false); }}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-semibold transition-all relative ${
                    activeTab === 'biodata' ? 'text-primary font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <User size={16} /> {language === 'en' ? 'Personal Data & Contact' : 'Data Pribadi & Kontak'}
                  {activeTab === 'biodata' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('security'); setIsEditing(false); }}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-semibold transition-all relative ${
                    activeTab === 'security' ? 'text-primary font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Lock size={16} /> {language === 'en' ? 'Security & Password' : 'Keamanan & Kata Sandi'}
                  {activeTab === 'security' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('activity'); setIsEditing(false); }}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-semibold transition-all relative ${
                    activeTab === 'activity' ? 'text-primary font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <HelpCircle size={16} /> {language === 'en' ? 'Help & Quick Access' : 'Bantuan & Akses Cepat'}
                  {activeTab === 'activity' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full" />
                  )}
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="p-6 sm:p-8">
                
                {/* TAB 1: BIODATA & CONTACT */}
                {activeTab === 'biodata' && (
                  <div>
                    {isEditing ? (
                      /* EDIT MODE FORM */
                      <form onSubmit={handleProfileSubmit} className="max-w-2xl space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                          <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {language === 'en' ? 'Edit Personal Data Form' : 'Form Perubahan Biodata'}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            {language === 'en' ? 'Cancel' : 'Batal'}
                          </button>
                        </div>

                        {/* Avatar quick update card inside Edit Form */}
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-[#ff60a8] p-[2px] shrink-0">
                              <div className="w-full h-full rounded-[14px] bg-[#120c16] flex items-center justify-center overflow-hidden">
                                {user?.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-heading text-lg font-bold text-white">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{language === 'en' ? 'Account Profile Picture' : 'Foto Profil Akun'}</p>
                              <p className="text-[11px] text-gray-400">{language === 'en' ? 'JPG, PNG, WEBP, or GIF (Max 5 MB)' : 'JPG, PNG, WEBP, atau GIF (Maksimal 5 MB)'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={avatarLoading}
                              className="px-3.5 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {avatarLoading ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Camera size={13} />
                              )}
                              <span>{avatarLoading ? (language === 'en' ? 'Uploading...' : 'Mengunggah...') : (language === 'en' ? 'Change Photo' : 'Ganti Foto')}</span>
                            </button>
                            {user?.avatar && !avatarLoading && (
                              <button
                                type="button"
                                onClick={handleDeleteAvatar}
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                                title={language === 'en' ? 'Delete profile picture' : 'Hapus foto profil'}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                            {language === 'en' ? 'Full Name' : 'Nama Lengkap'}
                          </label>
                          <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className="input-premium w-full pl-11 pr-4 py-3 text-sm"
                              placeholder={language === 'en' ? 'Customer full name' : 'Nama lengkap pemesan'}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                            {language === 'en' ? 'WhatsApp / Phone Number' : 'Nomor WhatsApp / HP'}
                          </label>
                          <PhoneCountryInput
                            value={profileForm.phone}
                            onChange={(val) => setProfileForm({ ...profileForm, phone: val })}
                            placeholder="81234567890"
                            id="profile-phone-page"
                          />
                          <p className="text-[11px] text-gray-400 mt-1.5">
                            {language === 'en' ? 'Select country code (+62 Indonesia or international) and enter without leading 0' : 'Pilih kode negara (+62 Indonesia atau luar negeri) dan isi tanpa angka 0 di depan'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                            {language === 'en' ? 'Full Delivery Address' : 'Alamat Pengiriman Lengkap'}
                          </label>
                          <div className="relative">
                            <MapPin size={16} className="absolute left-3.5 top-3.5 text-primary pointer-events-none shrink-0" />
                            <textarea
                              value={profileForm.address}
                              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                              className="input-premium w-full pl-11 pr-4 py-3 text-sm min-h-[110px] resize-none leading-relaxed"
                              placeholder={language === 'en' ? 'e.g. 12 Elm Street, Springfield, Postcode 12345' : 'Contoh: Jl. Ahmad Yani No. 12, RT 02/RW 05, Kel. Margahayu, Kec. Bekasi Timur, Kota Bekasi, Jawa Barat 17113'}
                              rows={4}
                            />
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1.5">
                            {language === 'en' ? 'This address will be automatically used when you checkout custom orders & merchandise' : 'Alamat ini akan otomatis digunakan saat Anda checkout pemesanan sablon & merchandise'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            {language === 'en' ? 'Cancel' : 'Batal'}
                          </button>
                          <button
                            type="submit"
                            disabled={profileLoading}
                            className="py-3 px-8 rounded-2xl btn-gradient-primary text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/25"
                          >
                            {profileLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            {language === 'en' ? 'Save Changes' : 'Simpan Perubahan'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* VIEW MODE INFO CARDS */
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-heading text-lg sm:text-xl text-white font-bold">{language === 'en' ? 'Account Information Details' : 'Rincian Informasi Akun'}</h3>
                            <p className="text-gray-400 text-xs">{language === 'en' ? 'Your identity data and order delivery destination' : 'Data identitas dan tujuan pengiriman pesanan Anda'}</p>
                          </div>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="btn-gradient-primary inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20"
                          >
                            <Pencil size={13} /> {language === 'en' ? 'Edit' : 'Edit'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{language === 'en' ? 'Full Name' : 'Nama Lengkap'}</p>
                              <p className="text-white text-sm font-semibold mt-0.5">{user?.name || '-'}</p>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                              <Mail size={18} />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{language === 'en' ? 'Primary Email' : 'Email Utama'}</p>
                              <p className="text-white text-sm font-semibold mt-0.5 truncate">{user?.email || '-'}</p>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                              <Phone size={18} />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{language === 'en' ? 'WhatsApp Number' : 'Nomor WhatsApp'}</p>
                              <p className="text-white text-sm font-semibold mt-0.5">
                                {user?.phone ? (
                                  <span className="font-mono">{user.phone}</span>
                                ) : (
                                  <span className="text-gray-500 italic text-xs">{language === 'en' ? 'Not added yet' : 'Belum ditambahkan'}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{language === 'en' ? 'Membership Status' : 'Status Keanggotaan'}</p>
                              <p className="text-white text-sm font-semibold mt-0.5">{language === 'en' ? 'Active (Registered Customer)' : 'Aktif (Pelanggan Terdaftar)'}</p>
                            </div>
                          </div>

                          <div className="md:col-span-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                              <MapPin size={18} />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{language === 'en' ? 'Full Delivery Address' : 'Alamat Pengiriman Lengkap'}</p>
                              <p className="text-white text-sm font-medium mt-0.5 leading-relaxed">
                                {user?.address || (
                                  <span className="text-gray-500 italic text-xs">
                                    {language === 'en' ? 'Delivery address not set yet. Click edit button to add.' : 'Alamat pengiriman belum diisi. Klik tombol edit untuk menambahkan.'}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SECURITY & PASSWORD */}
                {activeTab === 'security' && (
                  <div className="max-w-2xl">
                    <div className="mb-6">
                      <h3 className="font-heading text-lg sm:text-xl text-white font-bold">{language === 'en' ? 'Security & Authentication' : 'Keamanan & Autentikasi'}</h3>
                      <p className="text-gray-400 text-xs">{language === 'en' ? 'Manage your account password and login protection' : 'Kelola kata sandi akun dan proteksi login Anda'}</p>
                    </div>

                    {user?.google_id ? (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 mb-6">
                        <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-bold text-xs">{language === 'en' ? 'Account Linked with Google' : 'Akun Terhubung dengan Google'}</p>
                          <p className="text-gray-300 text-xs leading-relaxed mt-0.5">
                            {language === 'en'
                              ? 'Your account is currently logged in using Google. You do not have a local password yet, so Current Password is not required. You can directly create a new password below so you can log in with both Email & Password or Google.'
                              : 'Akun Anda saat ini login menggunakan Google. Anda belum memiliki kata sandi lokal, sehingga kolom Password Saat Ini tidak wajib diisi. Anda dapat langsung membuat kata sandi baru di bawah ini agar bisa login dengan Email & Password maupun Google.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 mb-6">
                        <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-semibold text-xs">{language === 'en' ? 'Password Security Information' : 'Informasi Keamanan Password'}</p>
                          <p className="text-gray-400 text-xs leading-relaxed mt-0.5">
                            {language === 'en'
                              ? 'The Current Password field starts blank for security purposes, as passwords are stored as one-way encrypted hashes that cannot be read or autofilled. Please enter your existing password to authorize the change.'
                              : 'Kolom Password Saat Ini sengaja dimulai dalam keadaan kosong demi keamanan, karena kata sandi di database tersimpan dalam bentuk enkripsi hash satu arah yang tidak dapat dibaca atau diisi otomatis oleh browser. Silakan ketik kata sandi lama Anda untuk otorisasi perubahan.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      {/* Password Saat Ini */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                            {language === 'en' ? 'Current Password' : 'Password Saat Ini'} {user?.google_id && <span className="text-emerald-400 font-normal lowercase">({language === 'en' ? 'optional for Google account' : 'opsional untuk akun Google'})</span>}
                          </label>
                        </div>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                          <input
                            type={showCurrentPw ? 'text' : 'password'}
                            value={pwForm.current_password}
                            onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                            className="input-premium w-full pl-11 pr-11 py-3 text-sm"
                            placeholder={user?.google_id ? (language === 'en' ? 'Leave blank if registered via Google' : 'Dikosongkan jika mendaftar via Google') : (language === 'en' ? 'Enter current password' : 'Ketik kata sandi saat ini')}
                            required={!user?.google_id}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {pwErrors.current_password && (
                          <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={13} /> {pwErrors.current_password[0]}
                          </p>
                        )}
                      </div>

                      {/* Password Baru */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                          {language === 'en' ? 'New Password (Min. 8 Characters)' : 'Password Baru (Minimal 8 Karakter)'}
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={pwForm.password}
                            onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                            className="input-premium w-full pl-11 pr-11 py-3 text-sm"
                            placeholder={language === 'en' ? 'Combination of letters, numbers, and symbols' : 'Kombinasi huruf, angka, dan simbol'}
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {/* Strength meter */}
                        {pwForm.password && (
                          <div className="mt-2 space-y-1">
                            <div className="flex gap-1.5 h-1.5 w-full">
                              {[1, 2, 3, 4].map((step) => (
                                <div
                                  key={step}
                                  className={`flex-1 rounded-full transition-colors ${
                                    pwStrength >= step
                                      ? pwStrength === 1
                                        ? 'bg-rose-500'
                                        : pwStrength === 2
                                        ? 'bg-amber-500'
                                        : pwStrength === 3
                                        ? 'bg-blue-500'
                                        : 'bg-emerald-500'
                                      : 'bg-white/10'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-[11px] text-gray-400 text-right">
                              {language === 'en' ? 'Strength: ' : 'Kekuatan: '}{' '}
                              <strong className="text-white">
                                {pwStrength <= 1 && (language === 'en' ? 'Very Weak' : 'Sangat Lemah')}
                                {pwStrength === 2 && (language === 'en' ? 'Fair' : 'Cukup')}
                                {pwStrength === 3 && (language === 'en' ? 'Strong' : 'Kuat')}
                                {pwStrength === 4 && (language === 'en' ? 'Very Strong' : 'Sangat Kuat')}
                              </strong>
                            </p>
                          </div>
                        )}

                        {pwErrors.password && (
                          <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={13} /> {pwErrors.password[0]}
                          </p>
                        )}
                      </div>

                      {/* Konfirmasi Password */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                          {language === 'en' ? 'Confirm New Password' : 'Konfirmasi Password Baru'}
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            value={pwForm.password_confirmation}
                            onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                            className="input-premium w-full pl-11 pr-11 py-3 text-sm"
                            placeholder={language === 'en' ? 'Repeat new password' : 'Ulangi password baru'}
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {pwErrors.password_confirmation && (
                          <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={13} /> {pwErrors.password_confirmation[0]}
                          </p>
                        )}
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={pwLoading}
                          className="w-full sm:w-auto py-3 px-8 rounded-2xl btn-gradient-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                        >
                          {pwLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                          {language === 'en' ? 'Save New Password' : 'Simpan Kata Sandi Baru'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 3: QUICK ACTIONS & SUPPORT */}
                {activeTab === 'activity' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-heading text-lg sm:text-xl text-white font-bold">{language === 'en' ? 'Help Center & Shortcuts' : 'Pusat Bantuan & Pintasan'}</h3>
                      <p className="text-gray-400 text-xs">{language === 'en' ? 'Quick access to all our services and official consultations' : 'Akses cepat ke seluruh layanan dan konsultasi resmi kami'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <Link
                        to="/pesan"
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all group no-underline"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Sparkles size={20} />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                          {language === 'en' ? 'Create Custom Order' : 'Buat Pesanan Kustom'}
                        </h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {language === 'en' ? 'Start 6-step configuration to order custom t-shirts, hoodies, or banners.' : 'Mulai konfigurasi 6 langkah untuk memesan sablon kaos, hoodie, atau banner.'}
                        </p>
                      </Link>

                      <Link
                        to="/size-chart"
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all group no-underline"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Icon name="maximize" size={20} />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                          {language === 'en' ? 'Size Calculator' : 'Kalkulator Ukuran'}
                        </h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {language === 'en' ? 'Check chest width guidelines and accurate fitting calculator before production.' : 'Cek panduan lingkar dada dan kalkulator fitting akurat sebelum produksi.'}
                        </p>
                      </Link>

                      <a
                        href={WA_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group no-underline"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Icon name="message-circle" size={20} />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1 group-hover:text-emerald-400 transition-colors">
                          {language === 'en' ? 'WhatsApp CS Consultation' : 'Konsultasi CS WhatsApp'}
                        </h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {language === 'en' ? 'Contact our customer care team for fabric advice, bulk discounts, or rush deadlines.' : 'Hubungi tim customer care kami untuk konsultasi bahan, diskon partai besar, atau deadline kilat.'}
                        </p>
                      </a>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </ScrollReveal>

        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-in fade-in"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#170e1c] border border-white/15 p-6 text-center shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <LogOut size={26} />
            </div>
            <h3 className="font-heading text-xl text-white font-bold mb-2">{language === 'en' ? 'Confirm Logout' : 'Konfirmasi Keluar'}</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              {language === 'en' ? 'Are you sure you want to log out from account ' : 'Apakah Anda yakin ingin keluar dari akun '}<strong className="text-white">{user?.name}</strong>?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-rose-900/30"
              >
                {language === 'en' ? 'Yes, Log Out' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <ScrollToTop />
    </div>
  );
}
