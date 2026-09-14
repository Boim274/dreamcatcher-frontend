import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  User,
  Lock,
  Loader2,
  Pencil,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Sliders,
  Sun,
  Moon,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { useToast } from '../ui/Toast';
import PhoneCountryInput from './PhoneCountryInput';
import UserAvatar from './UserAvatar';

export default function CustomerProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, updateAvatar, deleteAvatar, changePassword } = useAuthStore();
  const { theme, setTheme, toggleTheme } = useThemeStore();
  const { language, setLanguage, t } = useLanguageStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'preferences'
  const [isEditing, setIsEditing] = useState(false);
  const modalAvatarRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form
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

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('profile');
      setIsEditing(false);
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      setPwErrors({});
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.warning('Format tidak didukung. Harap pilih gambar JPG, PNG, WEBP, atau GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setAvatarLoading(true);
    try {
      await updateAvatar(file);
      toast.success('Foto profil berhasil diperbarui!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto profil');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Hapus foto profil dan gunakan inisial nama?')) return;
    setAvatarLoading(true);
    try {
      await deleteAvatar();
      toast.success('Foto profil berhasil dihapus');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus foto profil');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const phone = (profileForm.phone || '').trim().replace(/[\s-]/g, '');
    if (phone && !/^\+?[0-9]{8,20}$/.test(phone)) {
      toast.warning('Nomor HP harus berupa angka minimal 8 digit dan maksimal 20 digit.');
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile({ ...profileForm, phone });
      toast.success('Profil Anda berhasil diperbarui!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwErrors({});

    if (pwForm.password !== pwForm.password_confirmation) {
      setPwErrors({ password_confirmation: ['Konfirmasi password tidak cocok dengan password baru.'] });
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
      toast.success(user?.google_id ? 'Kata sandi berhasil dibuat!' : 'Kata sandi berhasil diubah!');
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      onClose();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setPwErrors(errs);
      } else {
        toast.error(err.response?.data?.message || 'Gagal mengubah password');
      }
    } finally {
      setPwLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const pwStrength = getPasswordStrength(pwForm.password);
  const isLight = theme === 'light';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-3xl border shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 overflow-hidden flex flex-col max-h-[92vh] my-8 animate-in zoom-in-95 duration-200 ${
          isLight
            ? 'bg-white border-slate-200 ring-slate-900/5 text-slate-800'
            : 'bg-[#140b19] border-white/15 ring-white/10 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient accent & Top Sheen */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
        <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-primary/15 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/15 blur-3xl rounded-full" />

        {/* Modal Header */}
        <div className={`relative p-6 border-b flex items-start justify-between gap-4 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-white/[0.02]'}`}>
          <div className="flex items-center gap-4">
            {/* User Avatar with interactive upload */}
            <div className="relative group/avatar shrink-0">
              <div
                onClick={() => !avatarLoading && modalAvatarRef.current?.click()}
                className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary via-[#ff60a8] to-purple-600 p-[2px] shadow-lg shadow-primary/25 cursor-pointer overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95"
                title="Klik untuk mengganti foto profil"
              >
                <div className={`w-full h-full rounded-[14px] flex items-center justify-center overflow-hidden relative ${isLight ? 'bg-slate-100' : 'bg-[#120c16]'}`}>
                  <UserAvatar
                    name={user?.name}
                    avatarUrl={user?.avatar_url}
                    className="w-full h-full text-2xl"
                    rounded="rounded-[14px]"
                    size="lg"
                  />

                  {/* Hover Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${
                      avatarLoading ? 'opacity-100' : 'opacity-0 group-hover/avatar:opacity-100'
                    }`}
                  >
                    {avatarLoading ? (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    ) : (
                      <Camera size={16} className="text-white drop-shadow" />
                    )}
                  </div>
                </div>
              </div>

              {/* Camera Upload Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  modalAvatarRef.current?.click();
                }}
                disabled={avatarLoading}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-primary to-[#ff60a8] border border-[#120c16] flex items-center justify-center shadow text-white hover:brightness-110 cursor-pointer z-10"
                title="Ganti Foto Profil"
              >
                {avatarLoading ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
              </button>

              <input
                type="file"
                ref={modalAvatarRef}
                onChange={handleAvatarChange}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-heading text-xl sm:text-2xl font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {user?.name || 'Pelanggan'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                  Member
                </span>
              </div>
              <p className={`text-xs mt-0.5 truncate max-w-[220px] sm:max-w-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500' : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
            }`}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Delete Avatar Option if User has one */}
        {user?.avatar_url && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
            <span className="text-[11px] text-rose-300">Foto profil kustom aktif</span>
            <button
              type="button"
              onClick={handleDeleteAvatar}
              disabled={avatarLoading}
              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} /> Hapus Foto
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className={`flex px-6 pt-2 border-b ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-white/[0.01]'}`}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'profile'
                ? 'text-primary font-bold'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User size={15} />
            {t('profile.infoTab')}
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'password'
                ? 'text-primary font-bold'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Lock size={15} />
            {t('profile.securityTab')}
            {activeTab === 'password' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'preferences'
                ? 'text-primary font-bold'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders size={15} />
            {t('theme.title')}
            {activeTab === 'preferences' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'profile' ? (
            isEditing ? (
              /* EDIT MODE FORM */
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    {t('profile.fullName')}
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:border-primary"
                      placeholder={t('profile.fullName')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    {t('profile.phone')}
                  </label>
                  <PhoneCountryInput
                    value={profileForm.phone}
                    onChange={(val) => setProfileForm({ ...profileForm, phone: val })}
                    placeholder="81234567890"
                    id="profile-phone-modal"
                  />
                  <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Digunakan untuk konfirmasi pesanan dan resi pengiriman</p>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    {t('profile.address')}
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-3 text-primary pointer-events-none shrink-0" />
                    <textarea
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium min-h-[90px] resize-none focus:border-primary"
                      placeholder="Contoh: Jl. Ahmad Yani No. 12, Kel. Margahayu, Kec. Bekasi Timur, Kota Bekasi"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                    }`}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all cursor-pointer border-none disabled:opacity-50"
                  >
                    {profileLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>{t('profile.saveChanges')}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE DETAILS */
              <div className="space-y-4">
                {/* Account details card */}
                <div className={`rounded-2xl border p-4 space-y-3.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                      <User size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{t('profile.fullName')}</p>
                      <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                      <Mail size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{t('profile.email')}</p>
                        {user?.google_id && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.2 rounded-full">
                            Google Connected
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.email || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                      <Phone size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{t('profile.phone')}</p>
                      <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {user?.phone ? (
                          <span className="font-mono">{user.phone}</span>
                        ) : (
                          <span className="text-zinc-500 italic text-xs">Belum ditambahkan</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{t('profile.address')}</p>
                      <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {user?.address || <span className="text-zinc-500 italic text-xs">Belum diisi</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
                >
                  <Pencil size={15} /> {t('common.edit')} Data Profil
                </button>

                {/* Link to Full Profile Page */}
                <Link
                  to="/profile"
                  onClick={onClose}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors no-underline ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                  }`}
                >
                  Buka Halaman Profil Lengkap <ExternalLink size={13} />
                </Link>
              </div>
            )
          ) : activeTab === 'password' ? (
            /* PASSWORD CHANGE FORM */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {user?.google_id ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-emerald-300 text-xs leading-relaxed">
                    Akun Anda terdaftar via Google. Kolom <strong>{t('profile.currentPassword')}</strong> tidak wajib diisi. Anda dapat langsung membuat kata sandi baru.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5 text-xs text-zinc-400">
                  <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    Silakan ketik password lama Anda untuk verifikasi perubahan kata sandi baru.
                  </span>
                </div>
              )}

              {/* Password Saat Ini */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  {t('profile.currentPassword')} {user?.google_id && <span className="text-emerald-400 font-normal lowercase">(opsional)</span>}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:border-primary"
                    placeholder={user?.google_id ? "Dikosongkan jika daftar via Google" : "Ketik password saat ini"}
                    required={!user?.google_id}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwErrors.current_password && (
                  <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {pwErrors.current_password[0]}
                  </p>
                )}
              </div>

              {/* Password Baru */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  {t('profile.newPassword')} (Min. 8 Karakter)
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none shrink-0" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={pwForm.password}
                    onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:border-primary"
                    placeholder="Minimal 8 karakter unik"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {pwForm.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1.5 w-full">
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
                    <p className="text-[10px] text-zinc-400 text-right">
                      {pwStrength <= 1 && 'Sangat Lemah'}
                      {pwStrength === 2 && 'Cukup'}
                      {pwStrength === 3 && 'Kuat'}
                      {pwStrength === 4 && 'Sangat Kuat'}
                    </p>
                  </div>
                )}

                {pwErrors.password && (
                  <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {pwErrors.password[0]}
                  </p>
                )}
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  {t('profile.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none shrink-0" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={pwForm.password_confirmation}
                    onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:border-primary"
                    placeholder="Ulangi password baru"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwErrors.password_confirmation && (
                  <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {pwErrors.password_confirmation[0]}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                  }`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all cursor-pointer border-none disabled:opacity-50"
                >
                  {pwLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>{t('profile.changePassword')}</span>
                </button>
              </div>
            </form>
          ) : (
            /* PREFERENCES TAB: THEME & LANGUAGE */
            <div className="space-y-5">
              {/* Theme Settings */}
              <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'}`}>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {t('theme.title')}
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      toast.info(t('alerts.themeSwitchedDark'));
                    }}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20 text-white font-bold'
                        : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Moon size={22} className={theme === 'dark' ? 'text-primary' : 'text-zinc-400'} />
                    <span className="text-xs">{t('theme.dark')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      toast.info(t('alerts.themeSwitchedLight'));
                    }}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 font-bold'
                        : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sun size={22} className={theme === 'light' ? 'text-amber-300' : 'text-amber-400'} />
                    <span className="text-xs">{t('theme.light')}</span>
                  </button>
                </div>
              </div>

              {/* Language Settings */}
              <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'}`}>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {t('lang.title')}
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('id');
                      toast.info(translations.id.alerts.langSwitched);
                    }}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      language === 'id'
                        ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20 text-white font-bold'
                        : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">🇮🇩</span>
                    <span className="text-xs">Bahasa Indonesia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      toast.info(translations.en.alerts.langSwitched);
                    }}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20 text-white font-bold'
                        : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">🇬🇧</span>
                    <span className="text-xs">English</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

