import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useLanguageStore } from '../../store/languageStore';
import {
  Eye,
  EyeOff,
  X,
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import PhoneCountryInput from '../common/PhoneCountryInput';
import GoogleAuthButton from '../common/GoogleAuthButton';
import { useToast } from './Toast';

export default function AuthModal() {
  const { login, register, updateProfile } = useAuthStore();
  const { isOpen, activeTab, setTab, closeModal } = useAuthModalStore();
  const { language } = useLanguageStore();
  const isEn = language === 'en';

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '+62', password: '', password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // State untuk Google user yang belum punya nomor telepon
  const [googleNeedPhone, setGoogleNeedPhone] = useState(false);
  const [googlePhone, setGooglePhone] = useState('+62');
  const [googleUser, setGoogleUser] = useState(null);
  const [savingPhone, setSavingPhone] = useState(false);

  const toast = useToast();

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') closeModal();
  }, [closeModal]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setErrors({});
      setLoginForm({ email: '', password: '' });
      setRegisterForm({ name: '', email: '', phone: '+62', password: '', password_confirmation: '' });
      setShowPassword(false);
      setShowConfirmPassword(false);
      setGoogleNeedPhone(false);
      setGoogleUser(null);
      setGooglePhone('+62');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(loginForm.email, loginForm.password);
      closeModal();
      toast.success(isEn ? 'Login successful! Welcome back' : 'Berhasil login! Selamat datang kembali');
    } catch (err) {
      setError(err.response?.data?.message || (isEn ? 'Login failed. Please check your email and password.' : 'Login gagal. Periksa email dan password Anda.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    const phone = (registerForm.phone || '').trim().replace(/[\s-]/g, '');
    if (!phone || phone === '+62') {
      setErrors({ phone: [isEn ? 'WhatsApp number is required.' : 'Nomor WhatsApp wajib diisi.'] });
      return;
    }
    if (!/^\+?[0-9]{8,20}$/.test(phone)) {
      setErrors({ phone: [isEn ? 'Phone number must be between 8 and 20 digits.' : 'Nomor HP harus berupa angka minimal 8 digit dan maksimal 20 digit.'] });
      return;
    }

    if (registerForm.password !== registerForm.password_confirmation) {
      setErrors({ password_confirmation: [isEn ? 'Password confirmation does not match.' : 'Konfirmasi password tidak cocok.'] });
      return;
    }

    setLoading(true);
    try {
      await register({ ...registerForm, phone });
      closeModal();
      toast.success(isEn ? ('Registration successful! Welcome, ' + registerForm.name) : ('Pendaftaran berhasil! Selamat datang, ' + registerForm.name));
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || (isEn ? 'Registration failed. Please try again.' : 'Pendaftaran gagal. Silakan coba lagi.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (user, result) => {
    setError(null);
    if (result?.needs_phone) {
      setGoogleUser(user);
      setGoogleNeedPhone(true);
    } else {
      closeModal();
      toast.success(isEn ? ('Signed in successfully! Welcome, ' + (user?.name || '')) : ('Berhasil masuk! Selamat datang, ' + (user?.name || '')));
    }
  };

  const handleSaveGooglePhone = async (e) => {
    e.preventDefault();
    const phone = (googlePhone || '').trim().replace(/[\s-]/g, '');
    if (!phone || phone === '+62') {
      toast.error(isEn ? 'Please enter your WhatsApp number.' : 'Silakan isi nomor WhatsApp Anda.');
      return;
    }
    if (!/^\+?[0-9]{8,20}$/.test(phone)) {
      toast.error(isEn ? 'Invalid WhatsApp number format (8 - 20 digits).' : 'Format nomor WhatsApp tidak valid (8 - 20 digit).');
      return;
    }

    setSavingPhone(true);
    try {
      await updateProfile({ phone });
      setGoogleNeedPhone(false);
      closeModal();
      toast.success(isEn ? ('WhatsApp number saved! Welcome, ' + (googleUser?.name || '')) : ('Nomor WhatsApp berhasil disimpan! Selamat datang, ' + (googleUser?.name || '')));
    } catch (err) {
      toast.error(err.response?.data?.message || (isEn ? 'Failed to save WhatsApp number.' : 'Gagal menyimpan nomor WhatsApp.'));
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSkipGooglePhone = () => {
    setGoogleNeedPhone(false);
    closeModal();
    toast.success(isEn ? ('Welcome, ' + (googleUser?.name || '')) : ('Selamat datang, ' + (googleUser?.name || '')));
  };

  const handleLoginChange = (field, value) => {
    setLoginForm({ ...loginForm, [field]: value });
  };

  const handleRegisterChange = (field, value) => {
    setRegisterForm({ ...registerForm, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="relative w-full max-w-[460px] max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#2a1d2e] via-[#1d1422] to-[#140e18] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(236,74,150,0.18)] p-6 sm:p-8 scrollbar-thin scrollbar-thumb-white/10 animate-in zoom-in-95 duration-200">
        
        {/* Dekorasi Ambient Glow Modern */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-56 h-56 bg-purple-600/15 rounded-full blur-3xl" />

        {/* Tombol Tutup Bulat Minimalis */}
        <button
          onClick={closeModal}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-20 cursor-pointer"
          aria-label={isEn ? 'Close' : 'Tutup'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Layar Pelengkap Nomor WhatsApp untuk User Google Baru */}
        {googleNeedPhone ? (
          <div className="relative z-10 text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-primary mb-4 mx-auto shadow-[0_0_30px_rgba(236,74,150,0.25)]">
              <Phone className="w-7 h-7 text-primary" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold tracking-wider uppercase mb-2">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              <span>{isEn ? 'One Last Step' : 'Satu Langkah Terakhir'}</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl text-white mb-2">
              {isEn ? 'COMPLETE WHATSAPP' : 'LENGKAPI WHATSAPP'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6 max-w-sm mx-auto">
              {isEn ? (
                <>Hello <strong className="text-white">{googleUser?.name}</strong>, please enter your WhatsApp number so we can send updates on your order production & delivery.</>
              ) : (
                <>Halo <strong className="text-white">{googleUser?.name}</strong>, cantumkan nomor WhatsApp Anda agar kami dapat mengirimkan update produksi & pengiriman pesanan Anda.</>
              )}
            </p>

            <form onSubmit={handleSaveGooglePhone} className="space-y-4 text-left">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> {isEn ? 'WhatsApp Number' : 'Nomor WhatsApp'}
                </label>
                <PhoneCountryInput
                  value={googlePhone}
                  onChange={setGooglePhone}
                  placeholder="81234567890"
                  id="google-phone-input"
                  required
                />
                <p className="text-zinc-500 text-[11px] mt-1.5">
                  {isEn
                    ? 'Select country code (+62 for Indonesia or international).'
                    : 'Pilih bendera/kode negara Anda (+62 Indonesia atau negara asing).'}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={savingPhone}
                  className="w-full py-3.5 px-6 rounded-xl font-heading text-lg tracking-wider text-white bg-gradient-to-r from-primary via-[#ff58a0] to-primary hover:brightness-110 active:scale-[0.99] shadow-[0_8px_25px_rgba(236,74,150,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPhone ? <LoadingSpinner size="sm" /> : (
                    <>
                      <span>{isEn ? 'SAVE & CONTINUE' : 'SIMPAN & LANJUTKAN'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSkipGooglePhone}
                  className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isEn ? 'Skip for now' : 'Lewati untuk sekarang'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="relative z-10">
            {/* Header Brand & Badging */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold tracking-wider uppercase mb-2">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span>Dreamcatcher AI Studio</span>
              </div>
              <h2 className="font-heading text-4xl sm:text-[42px] tracking-wide text-white leading-tight">
                {activeTab === 'login'
                  ? (isEn ? 'LOGIN TO ACCOUNT' : 'MASUK KE AKUN')
                  : (isEn ? 'CREATE NEW ACCOUNT' : 'DAFTAR AKUN BARU')}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-[13px] mt-1 leading-relaxed">
                {activeTab === 'login'
                  ? (isEn
                      ? 'Access AI designs, track screen printing orders, and get special discounts.'
                      : 'Akses desain AI, pantau pesanan sablon, dan nikmati diskon khusus.')
                  : (isEn
                      ? 'Start creating premium custom apparel designs and tailor your garment.'
                      : 'Mulai buat desain sablon premium dan kustomisasi pakaian Anda.')}
              </p>
            </div>

            {/* Segmented Pill Tabs Switcher */}
            <div className="grid grid-cols-2 p-1 bg-black/40 rounded-2xl border border-white/10 mb-6 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-lg shadow-primary/25'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isEn ? 'LOGIN' : 'MASUK'}
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-lg shadow-primary/25'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isEn ? 'REGISTER' : 'DAFTAR'}
              </button>
            </div>

            {/* Banner Pesan Error */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 leading-snug animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* FORM LOGIN */}
            {activeTab === 'login' ? (
              <div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" /> Email
                    </label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => handleLoginChange('email', e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 focus:border-primary/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" /> Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => handleLoginChange('password', e.target.value)}
                        placeholder={isEn ? 'Enter your password' : 'Masukkan password Anda'}
                        className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 focus:border-primary/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl font-heading text-lg tracking-wider text-white bg-gradient-to-r from-primary via-[#ff58a0] to-primary hover:brightness-110 active:scale-[0.99] shadow-[0_8px_25px_rgba(236,74,150,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : (
                      <>
                        <span>{isEn ? 'LOG IN NOW' : 'MASUK SEKARANG'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Pemisah Google */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold">
                    {isEn ? 'or continue with' : 'atau masuk dengan'}
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>

                <GoogleAuthButton
                  mode="login"
                  onSuccess={handleGoogleSuccess}
                  onError={(err) => setError(err)}
                />

                {/* Footer Switcher */}
                <div className="text-center mt-6 pt-4 border-t border-white/5 text-xs text-zinc-400">
                  {isEn ? "Don't have an account?" : 'Belum punya akun?'}{' '}
                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className="text-primary hover:underline font-semibold transition-colors inline-flex items-center gap-0.5 ml-1 cursor-pointer"
                  >
                    {isEn ? 'Register free now' : 'Daftar gratis sekarang'} <ArrowRight className="w-3 h-3 inline" />
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 mt-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEn ? 'Your privacy & data are securely encrypted' : 'Privasi & data Anda terenkripsi aman'}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* FORM DAFTAR */
              <div>
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> {isEn ? 'Full Name *' : 'Nama Lengkap *'}
                    </label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => handleRegisterChange('name', e.target.value)}
                      placeholder={isEn ? 'e.g. John Doe' : 'Contoh: Budi Santoso'}
                      className={`w-full bg-white/[0.04] hover:bg-white/[0.06] border ${
                        errors.name ? 'border-rose-500' : 'border-white/10'
                      } focus:border-primary/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-all outline-none`}
                      required
                    />
                    {errors.name && (
                      <p className="text-rose-400 text-xs flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> {errors.name[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" /> Email *
                    </label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => handleRegisterChange('email', e.target.value)}
                      placeholder="nama@email.com"
                      className={`w-full bg-white/[0.04] hover:bg-white/[0.06] border ${
                        errors.email ? 'border-rose-500' : 'border-white/10'
                      } focus:border-primary/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-all outline-none`}
                      required
                    />
                    {errors.email && (
                      <p className="text-rose-400 text-xs flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> {errors.email[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" /> {isEn ? 'WhatsApp Number *' : 'Nomor WhatsApp *'}
                    </label>
                    <PhoneCountryInput
                      value={registerForm.phone}
                      onChange={(val) => handleRegisterChange('phone', val)}
                      placeholder="81234567890"
                      id="register-phone"
                      required
                    />
                    {errors.phone ? (
                      <p className="text-rose-400 text-xs flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> {errors.phone[0]}
                      </p>
                    ) : (
                      <p className="text-zinc-400 text-[11px] mt-1">
                        {isEn
                          ? 'Select country flag code (+62 Indonesia or international).'
                          : 'Pilih kode bendera negara (+62 Indonesia atau negara asing).'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" /> {isEn ? 'Password (Min. 8 Characters) *' : 'Password (Min. 8 Karakter) *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={(e) => handleRegisterChange('password', e.target.value)}
                        placeholder={isEn ? 'Create secure password' : 'Buat password aman'}
                        className={`w-full bg-white/[0.04] hover:bg-white/[0.06] border ${
                          errors.password ? 'border-rose-500' : 'border-white/10'
                        } focus:border-primary/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 pr-12 text-sm text-white placeholder-zinc-500 transition-all outline-none`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-rose-400 text-xs flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> {errors.password[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" /> {isEn ? 'Confirm Password *' : 'Konfirmasi Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={registerForm.password_confirmation}
                        onChange={(e) => handleRegisterChange('password_confirmation', e.target.value)}
                        placeholder={isEn ? 'Repeat password' : 'Ulangi password'}
                        className={`w-full bg-white/[0.04] hover:bg-white/[0.06] border ${
                          errors.password_confirmation ? 'border-rose-500' : 'border-white/10'
                        } focus:border-primary/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 pr-12 text-sm text-white placeholder-zinc-500 transition-all outline-none`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password_confirmation && (
                      <p className="text-rose-400 text-xs flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> {errors.password_confirmation[0]}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl font-heading text-lg tracking-wider text-white bg-gradient-to-r from-primary via-[#ff58a0] to-primary hover:brightness-110 active:scale-[0.99] shadow-[0_8px_25px_rgba(236,74,150,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : (
                      <>
                        <span>{isEn ? 'CREATE ACCOUNT NOW' : 'BUAT AKUN SEKARANG'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Pemisah Google */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold">
                    {isEn ? 'or register with' : 'atau daftar dengan'}
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>

                <GoogleAuthButton
                  mode="register"
                  onSuccess={handleGoogleSuccess}
                  onError={(err) => setError(err)}
                />

                {/* Footer Switcher */}
                <div className="text-center mt-6 pt-4 border-t border-white/5 text-xs text-zinc-400">
                  {isEn ? 'Already have an account?' : 'Sudah punya akun?'}{' '}
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-primary hover:underline font-semibold transition-colors inline-flex items-center gap-0.5 ml-1 cursor-pointer"
                  >
                    {isEn ? 'Login to account' : 'Masuk ke akun'} <ArrowRight className="w-3 h-3 inline" />
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 mt-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEn ? 'Your privacy & data are securely encrypted' : 'Privasi & data Anda terenkripsi aman'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

