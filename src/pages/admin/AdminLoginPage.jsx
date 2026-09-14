import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Lock, AlertCircle, ArrowLeft, ShieldCheck, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedEmail = localStorage.getItem('admin_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (rememberMe) {
        localStorage.setItem('admin_remember_email', email);
      } else {
        localStorage.removeItem('admin_remember_email');
      }

      await login(email, password);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role !== 'admin') {
        logout();
        setError('Akses ditolak: Akun Anda tidak memiliki hak akses administrator.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('credentials') || msg.includes('password')) {
        setError('Kredensial salah. Periksa kembali email dan kata sandi Anda.');
      } else if (msg.includes('not found') || msg.includes('does not exist')) {
        setError('Akun administrator tidak ditemukan.');
      } else {
        setError(msg || 'Terjadi kesalahan saat masuk. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a050e] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Background Ambient Glow Spheres */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-b from-primary/20 via-purple-600/10 to-transparent blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 right-10 w-[500px] h-[500px] bg-[#ff60a8]/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-32 w-80 h-80 bg-purple-600/15 blur-[100px] rounded-full" />

      {/* Cyberpunk Grid Background Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Big Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-heading text-[180px] sm:text-[260px] md:text-[340px] text-white/[0.015] font-black select-none pointer-events-none tracking-[12px] leading-none">
        ADMIN
      </div>

      {/* Main Container */}
      <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 group no-underline">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-[#ff60a8] p-[2px] shadow-xl shadow-primary/30 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-[14px] bg-[#120817] flex items-center justify-center">
                <img src="/logo.png" alt="Dreamcatcher" className="h-7 w-7 object-contain" />
              </div>
            </div>
            <div className="text-left">
              <span className="font-heading text-2xl font-bold tracking-wider text-white block leading-tight">
                DREAM<span className="text-gradient">CATCHER</span>
              </span>
              <span className="text-[10px] font-mono tracking-[2px] uppercase text-zinc-400 block">
                Studio Management
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md mb-3 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-zinc-300 tracking-wider uppercase font-mono">
              Portal Admin Terenkripsi
            </span>
          </div>

          <h1 className="font-heading text-3xl font-bold text-white tracking-wide">
            Masuk <span className="text-gradient">Administrator</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1.5">
            Gunakan akun khusus admin untuk mengelola pesanan & studio.
          </p>
        </div>

        {/* Login Glassmorphic Card */}
        <div className="relative rounded-3xl bg-[#140b19]/80 border border-white/15 p-7 sm:p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden">
          {/* Top Sheen Gradient Accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

          {/* Floating Security Badge */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Otentikasi Aman</p>
                <p className="text-[10px] text-zinc-400 font-mono">256-bit SSL Protection</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400">
                v2.4 Live
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2.5 mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-zinc-300 text-[11px] font-bold tracking-wider uppercase mb-1.5 block">
                Email Administrator
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dreamcatcher.id"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-zinc-300 text-[11px] font-bold tracking-wider uppercase block">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#0e0712] text-primary focus:ring-primary/30 focus:ring-offset-0 cursor-pointer accent-primary"
                />
                <span className="text-zinc-400 text-xs group-hover:text-zinc-200 transition-colors font-medium">
                  Ingat email saya
                </span>
              </label>
              <span 
                className="text-zinc-500 hover:text-primary text-xs transition-colors cursor-pointer"
                title="Hubungi Administrator Utama untuk pemulihan kata sandi"
              >
                Bantuan login?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs tracking-wider uppercase shadow-xl shadow-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-white drop-shadow" />
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-[#120817]/90 backdrop-blur-md rounded-3xl flex items-center justify-center z-20 animate-in fade-in duration-200">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-[#ff60a8] p-[2px] animate-pulse">
                  <div className="w-full h-full rounded-[14px] bg-[#120817] flex items-center justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                </div>
                <p className="text-white text-xs font-semibold tracking-wider">Memverifikasi Sesi Admin...</p>
              </div>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-medium transition-all group py-2 px-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 no-underline"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Halaman Pelanggan</span>
          </Link>
        </div>

        {/* System Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-zinc-600 font-mono">
            Dreamcatcher Studio Engine • Akses Terbatas untuk Administrator
          </p>
        </div>
      </div>
    </div>
  );
}
