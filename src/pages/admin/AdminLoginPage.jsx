import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
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
      navigate('/admin');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('credentials') || msg.includes('password')) {
        setError('Email atau password salah');
      } else if (msg.includes('not found') || msg.includes('does not exist')) {
        setError('Akun tidak ditemukan');
      } else {
        setError(msg || 'Terjadi kesalahan, coba lagi');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-heading text-[200px] md:text-[300px] text-white/[0.02] leading-none tracking-[10px]">
          ADMIN
        </div>
      </div>

      <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/logo.png" alt="Dreamcatcher" className="h-12" />
            <span className="font-heading text-[32px] text-primary tracking-[2px]">
              Dream<span className="text-fire">catcher</span>
            </span>
          </div>
          <h1 className="font-heading text-[28px] text-white tracking-[1px]">ADMIN PANEL</h1>
          <p className="text-gray text-[13px] mt-1.5">Masuk ke panel administrasi</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-8 relative">
          {/* Security badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5 bg-ink border border-border rounded-full px-4 py-1.5">
              <Lock size={12} className="text-primary" />
              <span className="text-[11px] text-gray font-medium tracking-[1px] uppercase">Secure Login</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mb-5 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-[13px] animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Email */}
            <div>
              <label className="text-chrome text-[11px] font-medium tracking-[1px] uppercase mb-2 block">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  className="input-dark pl-10"
                  required
                  autoComplete="email"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray">
                    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-chrome text-[11px] font-medium tracking-[1px] uppercase mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="input-dark pl-10 pr-12"
                  required
                  autoComplete="current-password"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <Lock size={16} className="text-gray" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-ink text-primary focus:ring-primary/30 focus:ring-2 cursor-pointer"
                />
                <span className="text-gray text-[12px] group-hover:text-white transition-colors">Ingat saya</span>
              </label>
              <span className="text-gray/50 text-[12px] cursor-not-allowed" title="Hubungi admin untuk reset password">
                Lupa password?
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-[13px] tracking-[2px] uppercase shadow-lg shadow-primary/20 hover:shadow-primary/30 mt-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Memproses...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>

        {/* Back link */}
        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 text-gray hover:text-primary mt-6 no-underline text-[13px] transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
