import { useState, useEffect } from 'react';
import { X, User, Lock, Loader2, Pencil, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';

export default function CustomerProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, changePassword } = useAuthStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profil berhasil diperbarui');
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
          <h3 className="font-heading text-xl font-bold text-white">Profil Saya</h3>
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
            isEditing ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                    placeholder="081234567890"
                  />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Alamat</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="input-dark min-h-[80px] resize-none"
                    placeholder="Masukkan alamat lengkap Anda"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary flex-1">Batal</button>
                  <button type="submit" disabled={profileLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-ink rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-gray text-[11px] uppercase tracking-[1px] mb-0.5">Nama</p>
                    <p className="text-white text-[14px] font-medium">{user?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray text-[11px] uppercase tracking-[1px] mb-0.5">Email</p>
                    <p className="text-white text-[14px] font-medium">{user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray text-[11px] uppercase tracking-[1px] mb-0.5">No. HP</p>
                    <p className="text-white text-[14px] font-medium">{user?.phone || <span className="text-gray italic">Belum diisi</span>}</p>
                  </div>
                  <div>
                    <p className="text-gray text-[11px] uppercase tracking-[1px] mb-0.5">Alamat</p>
                    <p className="text-white text-[14px] font-medium">{user?.address || <span className="text-gray italic">Belum diisi</span>}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
                >
                  <Pencil className="w-4 h-4" /> Edit Profil
                </button>
              </div>
            )
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
