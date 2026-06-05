import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.png" alt="Dreamcatcher" className="h-14" />
            <span className="font-heading text-[36px] text-primary tracking-[2px]">
              Dream<span className="text-[#ea6fab]">catcher</span>
            </span>
          </div>
          <h1 className="font-heading text-[32px] text-white tracking-[1px] mt-4">ADMIN DASHBOARD</h1>
          <p className="text-gray text-[14px] mt-2">Masuk ke panel administrasi</p>
        </div>

        <div className="bg-card border border-border p-8">
          {error && (
            <div className="mb-4 p-3 bg-[#ea6fab]/10 border border-[#ea6fab]/20 text-[#ea6fab] text-[13px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dreamcatcher.id"
                className="input-dark"
                required
              />
            </div>

            <div>
              <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-dark pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-dark"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 px-6 hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[13px] tracking-[2px] uppercase"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="text-center text-gray text-[13px] mt-6">
            Demo: admin@dreamcatcher.id / password123
          </p>
        </div>

        <Link to="/" className="block text-center text-gray-dark hover:text-primary mt-6 no-underline text-[13px]">
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}