import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    price_per_unit: '',
    minimum_order: 1,
    thumbnail: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/admin/services');
      setServices(response.data.services);
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
        price_per_unit: service.price_per_unit || '',
        minimum_order: service.minimum_order,
        thumbnail: service.thumbnail || '',
        is_active: service.is_active,
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        description: '',
        base_price: '',
        price_per_unit: '',
        minimum_order: 1,
        thumbnail: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...form,
        base_price: parseFloat(form.base_price),
        price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null,
        minimum_order: parseInt(form.minimum_order),
      };

      if (editingId) {
        await api.put(`/admin/services/${editingId}`, data);
      } else {
        await api.post('/admin/services', data);
      }

      setShowModal(false);
      fetchServices();
    } catch (error) {
      alert('Gagal menyimpan layanan');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id) => {
    if (!confirm('Hapus layanan ini?')) return;

    try {
      await api.delete(`/admin/services/${id}`);
      fetchServices();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus layanan');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/admin/services/${id}`, { is_active: !currentStatus });
      fetchServices();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">Kelola Layanan</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tambah Layanan
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Harga per pcs</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Min. Order</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-text-secondary text-sm line-clamp-1">
                    {service.description || '-'}
                  </p>
                </td>
                <td className="px-4 py-3">
                  Rp {(service.price_per_unit || service.base_price).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">{service.minimum_order} pcs</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(service.id, service.is_active)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      service.is_active
                        ? 'bg-success/10 text-success'
                        : 'bg-gray-100 text-text-secondary'
                    }`}
                  >
                    {service.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openModal(service)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
                      className="p-2 hover:bg-danger/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-heading text-xl font-bold">
                {editingId ? 'Edit Layanan' : 'Tambah Layanan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="font-medium mb-2 block">Nama Layanan</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="font-medium mb-2 block">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium mb-2 block">Harga Dasar</label>
                  <input
                    type="number"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="font-medium mb-2 block">Harga per Pcs</label>
                  <input
                    type="number"
                    value={form.price_per_unit}
                    onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium mb-2 block">Minimum Order</label>
                <input
                  type="number"
                  value={form.minimum_order}
                  onChange={(e) => setForm({ ...form, minimum_order: e.target.value })}
                  className="input-field"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="font-medium mb-2 block">Thumbnail URL</label>
                <input
                  type="text"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  className="input-field"
                  placeholder="/images/services/example.jpg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="is_active" className="font-medium">Layanan Aktif</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <LoadingSpinner size="sm" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}