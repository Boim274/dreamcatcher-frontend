import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import Icon from './Icon';

export default function AuthModal() {
  const { login, register } = useAuthStore();
  const { isOpen, activeTab, setTab, closeModal } = useAuthModalStore();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

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
      setRegisterForm({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
      setShowPassword(false);
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
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrors({});
    try {
      await register(registerForm);
      closeModal();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (field, value) => {
    setLoginForm({ ...loginForm, [field]: value });
  };

  const handleRegisterChange = (field, value) => {
    setRegisterForm({ ...registerForm, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  return (
    <div className="auth-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="auth-modal">
        <button onClick={closeModal} className="auth-modal-close">
          <Icon name="x" size={16} />
        </button>

        <div className="auth-modal-tabs">
          <button
            className={`auth-modal-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            LOGIN
          </button>
          <button
            className={`auth-modal-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >
            DAFTAR
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#ea6fab]/10 border border-[#ea6fab]/20 text-[#ea6fab] text-[13px] flex items-center gap-2">
            <Icon name="alert-circle" size={16} /> {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <h2 className="font-heading text-[40px] text-white mb-1">MASUK</h2>
            <p className="text-[#777] text-[13px] mb-6">Akses akun Dreamcatcher Anda</p>

            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => handleLoginChange('email', e.target.value)}
              placeholder="Email"
              className="auth-modal-input"
              required
            />
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginForm.password}
                onChange={(e) => handleLoginChange('password', e.target.value)}
                placeholder="Password"
                className="auth-modal-input pr-12"
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

            <button
              type="submit"
              disabled={loading}
              className="auth-modal-btn"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'MASUK SEKARANG'}
            </button>

            <div className="auth-modal-switch">
              Belum punya akun?{' '}
              <a onClick={() => setTab('register')}>Daftar gratis</a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2 className="font-heading text-[40px] text-white mb-1">DAFTAR</h2>
            <p className="text-[#777] text-[13px] mb-6">Buat akun baru Dreamcatcher</p>

            <input
              type="text"
              value={registerForm.name}
              onChange={(e) => handleRegisterChange('name', e.target.value)}
              placeholder="Nama Lengkap"
              className={`auth-modal-input ${errors.name ? '!border-[#ea6fab]' : ''}`}
              required
            />
            {errors.name && <p className="text-[#ea6fab] text-[12px] mt-1 mb-2">{errors.name[0]}</p>}

            <input
              type="email"
              value={registerForm.email}
              onChange={(e) => handleRegisterChange('email', e.target.value)}
              placeholder="Email"
              className={`auth-modal-input ${errors.email ? '!border-[#ea6fab]' : ''}`}
              required
            />
            {errors.email && <p className="text-[#ea6fab] text-[12px] mt-1 mb-2">{errors.email[0]}</p>}

            <input
              type="tel"
              value={registerForm.phone}
              onChange={(e) => handleRegisterChange('phone', e.target.value)}
              placeholder="Nomor HP"
              className={`auth-modal-input ${errors.phone ? '!border-[#ea6fab]' : ''}`}
              required
            />
            {errors.phone && <p className="text-[#ea6fab] text-[12px] mt-1 mb-2">{errors.phone[0]}</p>}

            <div className="relative mb-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={registerForm.password}
                onChange={(e) => handleRegisterChange('password', e.target.value)}
                placeholder="Password"
                className={`auth-modal-input pr-12 ${errors.password ? '!border-[#ea6fab]' : ''}`}
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
            {errors.password && <p className="text-[#ea6fab] text-[12px] mt-1 mb-2">{errors.password[0]}</p>}

            <input
              type={showPassword ? 'text' : 'password'}
              value={registerForm.password_confirmation}
              onChange={(e) => handleRegisterChange('password_confirmation', e.target.value)}
              placeholder="Konfirmasi Password"
              className="auth-modal-input"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="auth-modal-btn"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'BUAT AKUN'}
            </button>

            <div className="auth-modal-switch">
              Sudah punya akun?{' '}
              <a onClick={() => setTab('login')}>Login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
