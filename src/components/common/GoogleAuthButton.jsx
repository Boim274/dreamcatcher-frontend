import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Official Google SVG Icon with accurate Google Brand colors
 */
export function GoogleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function GoogleAuthButton({
  mode = 'login', // 'login' | 'register'
  onSuccess,
  onError,
  className = '',
}) {
  const { loginWithGoogle, isLoading: authLoading } = useAuthStore();
  const { language } = useLanguageStore();
  const isEn = language === 'en';
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const googleBtnRef = useRef(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isRegister = mode === 'register';

  useEffect(() => {
    if (!clientId) return;

    let checkCount = 0;
    const checkGoogle = setInterval(() => {
      checkCount++;
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render official button
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: isRegister ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'center',
            width: 380,
          });
        } catch (err) {
          console.warn('GSI renderButton error:', err);
        }
        clearInterval(checkGoogle);
      }
      if (checkCount > 50) {
        clearInterval(checkGoogle);
      }
    }, 100);

    return () => clearInterval(checkGoogle);
  }, [clientId, isRegister]);

  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      onError?.(isEn ? 'Failed to obtain Google credentials.' : 'Gagal mendapatkan kredensial Google.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginWithGoogle(response.credential);
      if (onSuccess) {
        onSuccess(data.user, data);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.google?.[0] ||
        (isEn ? 'Failed to sign in with Google account. Please try again.' : 'Gagal masuk dengan akun Google. Silakan coba lagi.');
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomClick = () => {
    if (!clientId) {
      setShowConfigModal(true);
      return;
    }

    // Gunakan Google OAuth2 Token Client (Popup resmi Google)
    if (window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.error) {
              setLoading(false);
              onError?.((isEn ? 'Google sign-in cancelled: ' : 'Batal login dengan Google: ') + tokenResponse.error);
              return;
            }
            if (tokenResponse?.access_token) {
              try {
                const data = await loginWithGoogle(null, tokenResponse.access_token);
                if (onSuccess) {
                  onSuccess(data.user, data);
                }
              } catch (err) {
                const errorMsg =
                  err.response?.data?.message ||
                  err.response?.data?.errors?.google?.[0] ||
                  (isEn ? 'Failed to sign in with Google account.' : 'Gagal masuk dengan akun Google.');
                if (onError) onError(errorMsg);
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.error('OAuth2 token client error:', e);
        setLoading(false);
      }
    }

    // Fallback: Coba trigger prompt atau klik iframe tombol GSI jika sudah ter-render
    if (window.google?.accounts?.id) {
      const renderedIframe = googleBtnRef.current?.querySelector('div[role="button"]');
      if (renderedIframe) {
        renderedIframe.click();
      } else {
        window.google.accounts.id.prompt();
      }
    } else {
      setShowConfigModal(true);
    }
  };

  const isBusy = loading || authLoading;

  return (
    <div className={`w-full ${className}`}>
      {/* Tombol Modern yang Terintegrasi Langsung */}
      <button
        type="button"
        disabled={isBusy}
        onClick={handleCustomClick}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] border border-zinc-200"
      >
        {isBusy ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <GoogleIcon className="w-5 h-5" />
            <span>
              {isRegister
                ? (isEn ? 'Sign up with Google' : 'Daftar dengan Akun Google')
                : (isEn ? 'Continue with Google' : 'Lanjutkan dengan Google')}
            </span>
          </>
        )}
      </button>

      {/* Hidden container untuk sinkronisasi GSI button jika diperlukan */}
      <div
        ref={googleBtnRef}
        className="hidden"
      />

      {/* Modal Panduan jika Client ID belum diatur di .env */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-amber-400/30 rounded-2xl p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <GoogleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isEn ? 'Google Account Integration' : 'Integrasi Akun Google'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isEn ? 'Google Client ID Configuration' : 'Pengaturan Google Client ID'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed mb-6">
              <p>
                {isEn
                  ? 'Google registration is fully configured in backend and frontend. To connect with your Google Cloud project:'
                  : 'Sistem pendaftaran Google telah disiapkan sepenuhnya di backend dan frontend. Untuk menghubungkan ke akun Google asli Anda:'}
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-zinc-300">
                <li>
                  {isEn ? 'Open ' : 'Buka '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">Google Cloud Console</a>.
                </li>
                <li>
                  {isEn ? 'Create ' : 'Buat '}
                  <strong>OAuth Client ID</strong>
                  {isEn ? ' (choose Web Application).' : ' (pilih Web Application).'}
                </li>
                <li>
                  {isEn ? 'Add ' : 'Tambahkan '}
                  <code>http://localhost:5173</code>
                  {isEn ? ' to Authorized JavaScript origins.' : ' di Authorized JavaScript origins.'}
                </li>
                <li>
                  {isEn ? 'Copy Client ID and paste in ' : 'Salin Client ID dan tempel di file '}
                  <code>dreamcatcher-frontend/.env</code>:
                </li>
              </ol>
              <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] text-amber-300 select-all overflow-x-auto">
                VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors"
              >
                {isEn ? 'Understood & Close' : 'Mengerti & Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

