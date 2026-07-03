import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

const defaultOptionsConfig = {
  colors: ['Hitam', 'Putih', 'Abu-abu', 'Navy', 'Maroon'],
  sablon_types: ['Plastisol', 'DTF'],
  sizes: ['60x160cm', '80x200cm'],
  materials: ['Flexi Chinch', 'Vinyl'],
  positions: ['Dada Kiri', 'Dada Kanan', 'Punggung'],
};

const defaultPricingConfig = {
  plastisol: { lusin_1: 65000, lusin_2_6: 60000, satuan: 75000 },
  dtf: { satuan: 80000 },
};

export default function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    minimum_order: 1,
    is_active: true,
    pricing_type: 'flat',
    pricing_config: { ...defaultPricingConfig },
    options_config: { ...defaultOptionsConfig },
  });
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ search: '', pricing_type: '', is_active: '' });

  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  useEffect(() => { fetchServices(1); }, [filters.pricing_type, filters.is_active]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') fetchServices(1, { ...filters, [key]: value });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') fetchServices(1, filters);
  };

  const fetchServices = async (page = 1, overrideFilters) => {
    try {
      const f = overrideFilters || filters;
      const params = { page };
      if (f.search) params.search = f.search;
      if (f.pricing_type) params.pricing_type = f.pricing_type;
      if (f.is_active) params.is_active = f.is_active;
      const response = await api.get('/admin/services', { params });
      const data = response.data.services;
      setServices(data.data || data);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service = null) => {
    if (service) {
      setEditingId(service.id);
      setForm({
        name: service.name,
        description: service.description || '',
        base_price: service.base_price,
        minimum_order: service.minimum_order,
        is_active: service.is_active,
        pricing_type: service.pricing_type || 'flat',
        pricing_config: service.pricing_config || { ...defaultPricingConfig },
        options_config: service.options_config || { ...defaultOptionsConfig },
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        description: '',
        base_price: '',
        minimum_order: 1,
        is_active: true,
        pricing_type: 'flat',
        pricing_config: { ...defaultPricingConfig },
        options_config: { ...defaultOptionsConfig },
      });
    }
    setShowPricing(false);
    setShowOptions(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        base_price: parseFloat(form.base_price),
        minimum_order: parseInt(form.minimum_order),
      };
      if (editingId) {
        await api.put(`/admin/services/${editingId}`, data);
        toast.success('Layanan berhasil diperbarui');
      } else {
        await api.post('/admin/services', data);
        toast.success('Layanan berhasil ditambahkan');
      }
      setShowModal(false);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan layanan');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id) => {
    setConfirmDelete({ show: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await api.delete(`/admin/services/${id}`);
      toast.success('Layanan berhasil dihapus');
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus layanan');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/admin/services/${id}`, { is_active: !currentStatus });
      toast.success(currentStatus ? 'Layanan dinonaktifkan' : 'Layanan diaktifkan');
      fetchServices();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const updatePricingConfig = (sablonType, tier, value) => {
    setForm({
      ...form,
      pricing_config: {
        ...form.pricing_config,
        [sablonType]: {
          ...form.pricing_config[sablonType],
          [tier]: parseInt(value) || 0,
        },
      },
    });
  };

  const addSablonType = () => {
    const name = prompt('Nama jenis sablon:');
    if (name && !form.pricing_config[name.toLowerCase()]) {
      setForm({
        ...form,
        pricing_config: {
          ...form.pricing_config,
          [name.toLowerCase()]: { lusin_1: 0, lusin_2_6: 0, satuan: 0 },
        },
      });
    }
  };

  const removeSablonType = (type) => {
    const newConfig = { ...form.pricing_config };
    delete newConfig[type];
    setForm({ ...form, pricing_config: newConfig });
  };

  const updateOptionsConfig = (key, values) => {
    setForm({
      ...form,
      options_config: {
        ...form.options_config,
        [key]: values,
      },
    });
  };

  const addOptionItem = (key) => {
    const value = prompt(`Tambah ${key}:`);
    if (value) {
      const current = form.options_config[key] || [];
      updateOptionsConfig(key, [...current, value]);
    }
  };

  const removeOptionItem = (key, index) => {
    const current = [...(form.options_config[key] || [])];
    current.splice(index, 1);
    updateOptionsConfig(key, current);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Kelola Layanan</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tambah Layanan
        </button>
      </div>

      <div className="bg-card border border-border p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="input-icon-wrapper">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari nama layanan..."
                className="input-dark"
              />
            </div>
          </div>

          <select
            value={filters.pricing_type}
            onChange={(e) => handleFilter('pricing_type', e.target.value)}
            className="input-dark"
          >
            <option value="">Semua Tipe</option>
            <option value="flat">Flat</option>
            <option value="tiered">Tiered</option>
          </select>

          <select
            value={filters.is_active}
            onChange={(e) => handleFilter('is_active', e.target.value)}
            className="input-dark"
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-ink">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Harga</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Min. Order</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Tipe Harga</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-ink">
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{service.name}</p>
                  <p className="text-gray text-sm line-clamp-1">{service.description || '-'}</p>
                </td>
                <td className="px-4 py-3 text-gray-light">{formatRupiah(service.base_price)}</td>
                <td className="px-4 py-3 text-gray-light">{service.minimum_order} pcs</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-[11px] font-semibold rounded uppercase ${
                    service.pricing_type === 'tiered' ? 'bg-fire/20 text-fire' : 'bg-primary/20 text-primary'
                  }`}>
                    {service.pricing_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(service.id, service.is_active)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      service.is_active ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-border text-gray hover:bg-border/80'
                    }`}>
                    {service.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(service)} className="p-2 hover:bg-border rounded-lg">
                      <Edit2 className="w-4 h-4 text-gray" />
                    </button>
                    <button onClick={() => deleteService(service.id)} className="p-2 hover:bg-danger/10 rounded-lg">
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray text-sm">
            Menampilkan {services.length} dari {pagination.total} layanan
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchServices(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="p-2 rounded-lg hover:bg-border disabled:opacity-50 text-gray-light disabled:text-gray-medium"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 bg-ink border border-border rounded-lg text-gray-light text-sm">
              {pagination.current_page} / {pagination.last_page}
            </span>
            <button
              onClick={() => fetchServices(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="p-2 rounded-lg hover:bg-border disabled:opacity-50 text-gray-light disabled:text-gray-medium"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-heading text-xl font-bold text-white">
                {editingId ? 'Edit Layanan' : 'Tambah Layanan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-border rounded-lg">
                <X className="w-5 h-5 text-gray" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama Layanan</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-dark" required />
              </div>

              <div>
                <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-dark min-h-[80px] resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Harga Dasar (Rp)</label>
                  <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                    className="input-dark" required />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Min. Order</label>
                  <input type="number" value={form.minimum_order} onChange={(e) => setForm({ ...form, minimum_order: e.target.value })}
                    className="input-dark" min="1" required />
                </div>
                <div>
                  <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Tipe Harga</label>
                  <select value={form.pricing_type} onChange={(e) => setForm({ ...form, pricing_type: e.target.value })}
                    className="input-dark">
                    <option value="flat">Flat</option>
                    <option value="tiered">Tiered</option>
                  </select>
                </div>
              </div>

              {form.pricing_type === 'tiered' && (
                <div className="border border-border rounded-xl p-4">
                  <button type="button" onClick={() => setShowPricing(!showPricing)}
                    className="flex items-center justify-between w-full text-left">
                    <span className="text-chrome text-[12px] font-medium tracking-[1px] uppercase">Konfigurasi Harga</span>
                    {showPricing ? <ChevronUp className="w-4 h-4 text-gray" /> : <ChevronDown className="w-4 h-4 text-gray" />}
                  </button>
                  {showPricing && (
                    <div className="mt-4 space-y-4">
                      {Object.entries(form.pricing_config).map(([type, prices]) => (
                        <div key={type} className="bg-ink rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white font-semibold text-sm capitalize">{type}</p>
                            <button type="button" onClick={() => removeSablonType(type)}
                              className="text-danger text-xs hover:underline">Hapus</button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-gray text-[10px] uppercase">1 Lusin</label>
                              <input type="number" value={prices.lusin_1 || ''}
                                onChange={(e) => updatePricingConfig(type, 'lusin_1', e.target.value)}
                                className="input-dark text-sm py-2" />
                            </div>
                            <div>
                              <label className="text-gray text-[10px] uppercase">2-6 Lusin</label>
                              <input type="number" value={prices.lusin_2_6 || ''}
                                onChange={(e) => updatePricingConfig(type, 'lusin_2_6', e.target.value)}
                                className="input-dark text-sm py-2" />
                            </div>
                            <div>
                              <label className="text-gray text-[10px] uppercase">Satuan</label>
                              <input type="number" value={prices.satuan || ''}
                                onChange={(e) => updatePricingConfig(type, 'satuan', e.target.value)}
                                className="input-dark text-sm py-2" />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addSablonType}
                        className="text-primary text-sm hover:underline">+ Tambah Jenis Sablon</button>
                    </div>
                  )}
                </div>
              )}

              <div className="border border-border rounded-xl p-4">
                <button type="button" onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center justify-between w-full text-left">
                  <span className="text-chrome text-[12px] font-medium tracking-[1px] uppercase">Opsi Dropdown</span>
                  {showOptions ? <ChevronUp className="w-4 h-4 text-gray" /> : <ChevronDown className="w-4 h-4 text-gray" />}
                </button>
                {showOptions && (
                  <div className="mt-4 space-y-4">
                    {Object.entries(form.options_config).map(([key, items]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-gray text-[11px] uppercase font-semibold">{key}</label>
                          <button type="button" onClick={() => addOptionItem(key)}
                            className="text-primary text-xs hover:underline">+ Tambah</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(items || []).map((item, idx) => (
                            <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-ink text-white text-xs rounded">
                              {item}
                              <button type="button" onClick={() => removeOptionItem(key, idx)}
                                className="text-danger hover:text-white ml-1">&times;</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5" />
                <label htmlFor="is_active" className="font-medium text-white">Layanan Aktif</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <LoadingSpinner size="sm" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Hapus Layanan"
        message="Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
