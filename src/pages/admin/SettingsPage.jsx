import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import { Settings, Save } from 'lucide-react';

const groups = {
  general: { label: 'Umum', icon: Settings },
  contact: { label: 'Kontak & Alamat', icon: Settings },
  shipping: { label: 'Pengiriman', icon: Settings },
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
          {Object.entries(groups).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveGroup(key)}
              className={`px-4 py-3 rounded-xl text-sm font-medium text-left whitespace-nowrap transition-colors ${
                activeGroup === key ? 'bg-primary text-white' : 'bg-card border border-border text-gray-light hover:text-white hover:bg-ink/50'
              }`}
            >
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
                  <input type="text" value={getSettingValue('store_name')} onChange={(e) => updateLocal('store_name', e.target.value)} className="input-dark" />
                </div>
              </>
            )}

            {activeGroup === 'contact' && (
              <>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Alamat Toko</label>
                  <textarea value={getSettingValue('store_address')} onChange={(e) => updateLocal('store_address', e.target.value)} className="input-dark min-h-[80px] resize-none" />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Telepon</label>
                  <input type="text" value={getSettingValue('store_phone')} onChange={(e) => updateLocal('store_phone', e.target.value)} className="input-dark" placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">WhatsApp</label>
                  <input type="text" value={getSettingValue('store_whatsapp')} onChange={(e) => updateLocal('store_whatsapp', e.target.value)} className="input-dark" placeholder="628xxxxxxxxxx" />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Email</label>
                  <input type="email" value={getSettingValue('store_email')} onChange={(e) => updateLocal('store_email', e.target.value)} className="input-dark" placeholder="email@domain.com" />
                </div>
              </>
            )}

            {activeGroup === 'shipping' && (
              <>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Biaya Pengiriman (Rp)</label>
                  <input type="number" value={getSettingValue('shipping_cost')} onChange={(e) => updateLocal('shipping_cost', e.target.value)} className="input-dark" min="0" />
                  <p className="text-gray-dark text-xs mt-1">Flat rate untuk semua pengiriman</p>
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Metode Pengiriman</label>
                  <select value={getSettingValue('shipping_method')} onChange={(e) => updateLocal('shipping_method', e.target.value)} className="input-dark">
                    <option value="flat">Flat Rate</option>
                    <option value="free">Gratis Ongkir</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
