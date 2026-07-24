import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import { Store, MapPin, Phone, Mail, MessageCircle, Truck, DollarSign, Save } from 'lucide-react';

const groups = {
  general: { label: 'Umum', icon: Store },
  contact: { label: 'Kontak & Alamat', icon: MapPin },
  shipping: { label: 'Pengiriman', icon: Truck },
};

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSettingValue = (key) => {
    const s = settings.find((item) => item.key === key);
    return s ? s.value : '';
  };

  const updateLocal = (key, value) => {
    setSettings((prev) => {
      const exists = prev.find((s) => s.key === key);
      if (exists) return prev.map((s) => (s.key === key ? { ...s, value } : s));
      return [...prev, { key, value, group: activeGroup }];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const grouped = {};
      settings.forEach((s) => {
        if (!grouped[s.group]) grouped[s.group] = [];
        grouped[s.group].push({ key: s.key, value: s.value, group: s.group });
      });

      for (const [group, items] of Object.entries(grouped)) {
        await api.put('/admin/settings', { settings: items });
      }
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Pengaturan</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-5 h-5" /> {saving ? 'Menyimpan...' : 'Simpan Semua'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="lg:w-56 flex lg:flex-col gap-2 overflow-x-auto">
          {Object.entries(groups).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setActiveGroup(key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left whitespace-nowrap transition-colors ${
                activeGroup === key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card border border-border text-gray-light hover:text-white hover:bg-ink/50'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Settings Form */}
        <div className="flex-1 bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg text-white mb-6">{groups[activeGroup]?.label}</h3>

          <div className="space-y-5">
            {activeGroup === 'general' && (
              <>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama Toko</label>
                  <div className="input-icon-wrapper">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                    <input type="text" value={getSettingValue('store_name')} onChange={(e) => updateLocal('store_name', e.target.value)} className="input-dark" placeholder="Nama toko Anda" />
                  </div>
                  <p className="text-gray-dark text-xs mt-1">Nama yang akan ditampilkan di website dan invoice</p>
                </div>
              </>
            )}

            {activeGroup === 'contact' && (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={16} className="text-primary" />
                    <h4 className="text-white text-sm font-semibold">Alamat</h4>
                  </div>
                  <p className="text-gray-dark text-xs mb-4">Informasi lokasi toko fisik</p>
                  <div>
                    <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Alamat Toko</label>
                    <div className="input-icon-wrapper">
                      <MapPin className="absolute left-3.5 top-3 w-5 h-5 text-gray" />
                      <textarea value={getSettingValue('store_address')} onChange={(e) => updateLocal('store_address', e.target.value)} className="input-dark min-h-[80px] resize-none" placeholder="Alamat lengkap toko" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone size={16} className="text-primary" />
                    <h4 className="text-white text-sm font-semibold">Kontak</h4>
                  </div>
                  <p className="text-gray-dark text-xs mb-4">Informasi kontak yang bisa dihubungi pelanggan</p>
                  <div className="space-y-5">
                    <div>
                      <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Telepon</label>
                      <div className="input-icon-wrapper">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                        <input type="text" value={getSettingValue('store_phone')} onChange={(e) => updateLocal('store_phone', e.target.value)} className="input-dark" placeholder="08xxxxxxxxxx" />
                      </div>
                    </div>
                    <div>
                      <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">WhatsApp</label>
                      <div className="input-icon-wrapper">
                        <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                        <input type="text" value={getSettingValue('store_whatsapp')} onChange={(e) => updateLocal('store_whatsapp', e.target.value)} className="input-dark" placeholder="628xxxxxxxxxx" />
                      </div>
                      <p className="text-gray-dark text-xs mt-1">Format dengan kode negara, tanpa + (contoh: 62812xxx)</p>
                    </div>
                    <div>
                      <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Email</label>
                      <div className="input-icon-wrapper">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                        <input type="email" value={getSettingValue('store_email')} onChange={(e) => updateLocal('store_email', e.target.value)} className="input-dark" placeholder="email@domain.com" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeGroup === 'shipping' && (
              <>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Biaya Pengiriman (Rp)</label>
                  <div className="input-icon-wrapper">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                    <input type="number" value={getSettingValue('shipping_cost')} onChange={(e) => updateLocal('shipping_cost', e.target.value)} className="input-dark" min="0" placeholder="15000" />
                  </div>
                  <p className="text-gray-dark text-xs mt-1">Biaya pengiriman flat untuk semua order</p>
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Metode Pengiriman</label>
                  <div className="input-icon-wrapper">
                    <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                    <select value={getSettingValue('shipping_method')} onChange={(e) => updateLocal('shipping_method', e.target.value)} className="input-dark">
                      <option value="flat">Flat Rate (Biaya tetap)</option>
                      <option value="free">Gratis Ongkir</option>
                    </select>
                  </div>
                  <p className="text-gray-dark text-xs mt-1">Pilih metode pengiriman yang akan ditawarkan ke customer</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
