import { useState } from 'react';
import { X, User, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';

export default function AdminProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, changePassword } = useAuthStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  if (!isOpen) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profil berhasil diperbarui');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setPwLoading(true);
    try {
      await changePassword(pwForm);
      toast.success('Password berhasil diubah');
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-card border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-heading text-xl font-bold text-white">Profil Admin</h3>
          <button onClick={onClose} className="p-2 hover:bg-border rounded-lg">
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            Ganti Password
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-dark opacity-50 cursor-not-allowed"
                />
                <p className="text-gray text-xs mt-1">Email tidak dapat diubah</p>
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="input-dark"
                  required
                />
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">No. HP</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input-dark"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={profileLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Password Saat Ini</label>
                <input
                  type="password"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                  className="input-dark"
                  required
                />
                {pwErrors.current_password && (
                  <p className="text-danger text-xs mt-1">{pwErrors.current_password[0]}</p>
                )}
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Password Baru</label>
                <input
                  type="password"
                  value={pwForm.password}
                  onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                  className="input-dark"
                  required
                  minLength={8}
                />
                {pwErrors.password && (
                  <p className="text-danger text-xs mt-1">{pwErrors.password[0]}</p>
                )}
              </div>
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={pwForm.password_confirmation}
                  onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                  className="input-dark"
                  required
                  minLength={8}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={pwLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ubah Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
