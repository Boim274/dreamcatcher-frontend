import { useState, useEffect, useRef } from 'react';
import { X, User, Lock, Loader2, Pencil, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, Camera, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useToast } from '../ui/Toast';
import UserAvatar from '../common/UserAvatar';

export default function AdminProfileModal({ isOpen, onClose, initialTab = 'profile' }) {
  const { user, updateProfile, updateAvatar, deleteAvatar, changePassword } = useAuthStore();
  const { theme } = useThemeStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const adminAvatarInputRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

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
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsEditing(false);
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      setPwErrors({});
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
    }
  }, [isOpen, initialTab]);

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
      toast.success('Foto profil admin berhasil diperbarui!');
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
    setProfileLoading(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profil admin berhasil diperbarui');
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
      setPwErrors({ password_confirmation: ['Konfirmasi password tidak cocok'] });
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm);
      toast.success('Password admin berhasil diubah');
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

  const isLight = theme === 'light';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden flex flex-col max-h-[90vh] my-8 animate-in zoom-in-95 duration-200 ${
          isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-[#140b19] border border-white/15 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line & Glow */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
        <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-primary/20 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/15 blur-3xl rounded-full" />

        {/* Header */}
        <div className={`relative flex items-center justify-between p-6 border-b z-10 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-white/[0.02]'}`}>
          <div className="flex items-center gap-3.5">
            <div className="relative group/avatar shrink-0">
              <div
                onClick={() => !avatarLoading && adminAvatarInputRef.current?.click()}
                className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-primary to-[#ff60a8] p-[2px] shadow-lg shadow-primary/25 cursor-pointer overflow-hidden transition-all hover:scale-105"
                title="Klik untuk mengganti foto profil"
              >
                <div className={`w-full h-full rounded-[14px] flex items-center justify-center overflow-hidden relative ${isLight ? 'bg-slate-100' : 'bg-[#120c16]'}`}>
                  <UserAvatar
                    name={user?.name}
                    avatarUrl={user?.avatar_url}
                    className="w-full h-full"
                    rounded="rounded-[14px]"
                    size="md"
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
                      <Camera size={16} className="text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Camera Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  adminAvatarInputRef.current?.click();
                }}
                disabled={avatarLoading}
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border flex items-center justify-center text-white shadow hover:brightness-110 cursor-pointer ${
                  isLight ? 'border-white' : 'border-[#120c16]'
                }`}
                title="Ganti Foto"
              >
                {avatarLoading ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
              </button>

              <input
                type="file"
                ref={adminAvatarInputRef}
                onChange={handleAvatarChange}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-heading text-lg font-bold leading-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name || 'Administrator'}</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-primary/15 text-primary border border-primary/30 shrink-0">
                  Admin
                </span>
              </div>
              <p className={`text-xs truncate max-w-[200px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white'
            }`}
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

        {/* Tabs */}
        <div className={`flex border-b px-6 pt-2 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-white/[0.01]'}`}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'profile'
                ? 'text-primary font-bold'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User size={15} /> Informasi Profil
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
            <Lock size={15} /> Ganti Password
            {activeTab === 'password' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="relative p-6 overflow-y-auto">
          {activeTab === 'profile' ? (
            isEditing ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block font-heading ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Email Administrator
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium opacity-60 cursor-not-allowed ${
                      isLight ? 'bg-slate-100 border border-slate-200 text-slate-500' : 'bg-[#0e0712] border border-white/10 text-zinc-400'
                    }`}
                  />
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Email akun administrator tidak dapat diubah</p>
                </div>
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block font-heading ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Nama Admin <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      isLight ? 'bg-white border border-slate-300 text-slate-900 focus:border-primary' : 'bg-[#0e0712] border border-white/15 text-white focus:border-primary shadow-inner'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block font-heading ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      isLight ? 'bg-white border border-slate-300 text-slate-900 focus:border-primary' : 'bg-[#0e0712] border border-white/15 text-white focus:border-primary shadow-inner'
                    }`}
                    placeholder="081234567890"
                  />
                </div>
                <div className="flex gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all cursor-pointer border-none disabled:opacity-50"
                  >
                    {profileLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>Simpan</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-2xl border p-4 space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'}`}>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold font-heading ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Nama Admin</p>
                    <p className={`text-sm font-semibold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name || '-'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold font-heading ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Email</p>
                    <p className={`text-sm font-semibold mt-0.5 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold font-heading ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>No. WhatsApp</p>
                    <p className={`text-sm font-semibold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.phone || <span className="text-zinc-500 italic text-xs">Belum diisi</span>}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
                >
                  <Pencil size={15} /> Edit Data Profil
                </button>
              </div>
            )
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block font-heading ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Password Saat Ini <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    className={`w-full py-2.5 pl-4 pr-10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      isLight ? 'bg-white border border-slate-300 text-slate-900 focus:border-primary' : 'bg-[#0e0712] border border-white/15 text-white focus:border-primary shadow-inner'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-zinc-400 hover:text-white'}`}
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

              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block font-heading ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Password Baru (Min. 8 Karakter) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={pwForm.password}
                    onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                    className={`w-full py-2.5 pl-4 pr-10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      isLight ? 'bg-white border border-slate-300 text-slate-900 focus:border-primary' : 'bg-[#0e0712] border border-white/15 text-white focus:border-primary shadow-inner'
                    }`}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwErrors.password && (
                  <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {pwErrors.password[0]}
                  </p>
                )}
              </div>

              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block font-heading ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Konfirmasi Password Baru <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={pwForm.password_confirmation}
                    onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                    className={`w-full py-2.5 pl-4 pr-10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      isLight ? 'bg-white border border-slate-300 text-slate-900 focus:border-primary' : 'bg-[#0e0712] border border-white/15 text-white focus:border-primary shadow-inner'
                    }`}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-zinc-400 hover:text-white'}`}
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

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all cursor-pointer border-none disabled:opacity-50"
                >
                  {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  <span>Ubah Password</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
