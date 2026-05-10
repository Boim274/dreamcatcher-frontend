import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Scissors, Eye, EyeOff } from 'lucide-react';
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
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Dreamcatcher</h1>
          <span className="text-primary font-bold text-xl">.id</span>
          <p className="text-gray-400 mt-4">Admin Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-medium mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dreamcatcher.id"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="font-medium mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
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

          <p className="text-center text-text-secondary text-sm mt-6">
            Demo: admin@dreamcatcher.id / password123
          </p>
        </div>

        <Link to="/" className="block text-center text-gray-400 hover:text-white mt-6">
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}