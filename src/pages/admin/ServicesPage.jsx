import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Wrench,
  RotateCcw,
  CheckCircle2,
  Sliders,
  DollarSign,
  Tag,
  Check,
  Sparkles,
  Layers,
  Scissors,
  Package,
  Palette,
  Ruler,
  HelpCircle,
  Save,
  Flame,
  LayoutGrid,
  Shirt,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const PRESET_SWATCHES = [
  { name: 'Hitam', hex: '#0a0a0a' },
  { name: 'Putih', hex: '#ffffff' },
  { name: 'Abu-abu', hex: '#94a3b8' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Merah', hex: '#e11d48' },
  { name: 'Maroon', hex: '#881337' },
  { name: 'Biru Royal', hex: '#2563eb' },
  { name: 'Biru Muda', hex: '#38bdf8' },
  { name: 'Hijau Army', hex: '#3f6212' },
  { name: 'Hijau Botol', hex: '#15803d' },
  { name: 'Kuning', hex: '#eab308' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Cream', hex: '#fef3c7' },
  { name: 'Coklat', hex: '#78350f' },
  { name: 'Ungu', hex: '#9333ea' },
  { name: 'Pink', hex: '#ec4899' },
];

const DEFAULT_PRINT_POSITIONS = [
  { label: 'Standar Depan', value: 'standar_depan' },
  { label: 'Dada Tengah', value: 'dada_tengah' },
  { label: 'Dada Kiri', value: 'dada_kiri' },
  { label: 'Dada Kanan', value: 'dada_kanan' },
  { label: 'Standar Belakang', value: 'standar_belakang' },
  { label: 'Punggung Atas', value: 'punggung_atas' },
  { label: 'Lengan Kiri', value: 'lengan_kiri' },
  { label: 'Lengan Kanan', value: 'lengan_kanan' },
];

const DEFAULT_PRINT_SIZES = [
  { label: '9 × 9 cm', value: '9x9' },
  { label: '9 × 28 cm', value: '9x28' },
  { label: '20 × 13 cm (A5)', value: '20x13' },
  { label: '28 × 20 cm (A4)', value: '28x20' },
  { label: '28 × 40 cm (A3)', value: '28x40' },
];

const parseConfig = (cfg) => {
  if (!cfg) return {};
  if (typeof cfg === 'string') {
    try {
      const p = JSON.parse(cfg);
      return typeof p === 'string' ? JSON.parse(p) : p;
    } catch {
      return {};
    }
  }
  return cfg;
};

export default function ServicesPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('type') || 'sablon'; // 'sablon' | 'banner' | 'stiker' | 'bordir' | 'all'

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingServiceId, setSavingServiceId] = useState(null);

  // General modal state for "all" services tab
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    minimum_order: 1,
    is_active: true,
    pricing_type: 'flat',
    pricing_config: {},
    options_config: {},
  });
  const [savingModal, setSavingModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [filters, setFilters] = useState({ search: '', pricing_type: '', is_active: '' });
  const [pagination, setPagination] = useState(null);

  // Dedicated Form State for the active specific service
  const [activeServiceForm, setActiveServiceForm] = useState(null);
  const [newTechniqueInput, setNewTechniqueInput] = useState('');
  const [newPositionInput, setNewPositionInput] = useState({ label: '', value: '' });
  const [newPrintSizeInput, setNewPrintSizeInput] = useState({ label: '', value: '' });
  const [newBannerSizeInput, setNewBannerSizeInput] = useState('');
  const [newBannerMaterialInput, setNewBannerMaterialInput] = useState('');
  const [newStickerMaterialInput, setNewStickerMaterialInput] = useState('');
  const [newStickerSizeInput, setNewStickerSizeInput] = useState('');
  const [newBordirPosInput, setNewBordirPosInput] = useState('');

  const [masterColors, setMasterColors] = useState([]);
  const [loadingMasterColors, setLoadingMasterColors] = useState(false);
  const [masterSizes, setMasterSizes] = useState([]);
  const [loadingMasterSizes, setLoadingMasterSizes] = useState(false);

  const fetchMasterColors = useCallback(async (signal) => {
    try {
      setLoadingMasterColors(true);
      const result = await adminService.getColors({ per_page: 100 }, signal);
      setMasterColors(result.data || []);
    } catch (err) {
      if (err?.name !== 'CanceledError') console.error('Failed to fetch master colors:', err);
    } finally {
      setLoadingMasterColors(false);
    }
  }, []);

  const fetchMasterSizes = useCallback(async (signal) => {
    try {
      setLoadingMasterSizes(true);
      const result = await adminService.getSizes({ per_page: 100 }, signal);
      setMasterSizes(result.data || []);
    } catch (err) {
      if (err?.name !== 'CanceledError') console.error('Failed to fetch master sizes:', err);
    } finally {
      setLoadingMasterSizes(false);
    }
  }, []);

  const fetchServices = useCallback(async (signal) => {
    try {
      const result = await adminService.getServices({ per_page: 50 }, signal);
      setServices(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchServices(controller.signal);
    fetchMasterColors(controller.signal);
    fetchMasterSizes(controller.signal);
    return () => controller.abort();
  }, [fetchServices, fetchMasterColors, fetchMasterSizes]);

  const getColorHex = (colorName) => {
    const master = masterColors.find((c) => c.name?.toLowerCase() === colorName?.toLowerCase());
    if (master?.hex_code) return master.hex_code;
    const swatch = PRESET_SWATCHES.find((s) => s.name.toLowerCase() === colorName?.toLowerCase());
    return swatch?.hex || '#666666';
  };

  // Synchronize active service form when currentTab or services change
  useEffect(() => {
    if (services.length === 0) return;

    let target = null;
    if (currentTab === 'sablon') {
      target = services.find((s) => s.name?.toLowerCase().includes('kaos') || s.name?.toLowerCase().includes('sablon')) || services[0];
    } else if (currentTab === 'banner') {
      target = services.find((s) => s.name?.toLowerCase().includes('banner')) || services[1];
    } else if (currentTab === 'stiker') {
      target = services.find((s) => s.name?.toLowerCase().includes('stiker') || s.name?.toLowerCase().includes('sticker')) || services[2];
    } else if (currentTab === 'bordir') {
      target = services.find((s) => s.name?.toLowerCase().includes('bordir')) || services[3];
    }

    if (target) {
      const opts = parseConfig(target.options_config);
      const prc = parseConfig(target.pricing_config);

      setActiveServiceForm({
        id: target.id,
        name: target.name,
        description: target.description || '',
        base_price: target.base_price,
        minimum_order: target.minimum_order || 1,
        is_active: Boolean(target.is_active),
        pricing_type: target.pricing_type || (currentTab === 'sablon' ? 'tiered' : 'flat'),
        pricing_config: { ...prc },
        options_config: {
          purchase_methods: opts.purchase_methods?.length ? opts.purchase_methods : ['Satuan', 'Lusinan'],
          colors: opts.colors?.length ? opts.colors : PRESET_SWATCHES.map((s) => s.name),
          sablon_types: opts.sablon_types?.length ? opts.sablon_types : ['Plastisol', 'DTF'],
          sizes: opts.sizes?.length ? opts.sizes : ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
          size_pricing: opts.size_pricing || { S: 0, M: 0, L: 0, XL: 0, XXL: 5000, '3XL': 10000, '4XL': 20000 },
          max_print_areas: opts.max_print_areas || 2,
          area_surcharge: opts.area_surcharge || 15000,
          print_positions: opts.print_positions?.length ? opts.print_positions : DEFAULT_PRINT_POSITIONS,
          materials: opts.materials?.length 
            ? opts.materials 
            : (currentTab === 'sablon' ? ['Cotton Combed 30s', 'Cotton Combed 24s', 'Cotton Bamboo'] : currentTab === 'banner' ? ['Flexi China', 'Flexi Korea', 'Albatros', 'Vinyl', 'Fabric'] : ['Vinyl Glossy', 'Vinyl Matte', 'Transparan', 'Hologram']),
          ...(currentTab === 'bordir' || opts.positions ? {
            positions: opts.positions?.length ? opts.positions : ['Dada Kiri', 'Dada Kanan', 'Punggung', 'Lengan Kiri', 'Lengan Kanan', 'Topi Depan']
          } : {}),
          ...opts,
        },
      });
    } else {
      setActiveServiceForm(null);
    }
  }, [currentTab, services]);

  const handleTabChange = (tabKey) => {
    if (tabKey === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ type: tabKey });
    }
  };

  // Save changes for the dedicated active service view
  const handleSaveActiveService = async () => {
    if (!activeServiceForm) return;
    setSavingServiceId(activeServiceForm.id);

    try {
      const payload = {
        name: activeServiceForm.name,
        description: activeServiceForm.description,
        base_price: parseFloat(activeServiceForm.base_price) || 0,
        minimum_order: parseInt(activeServiceForm.minimum_order) || 1,
        is_active: activeServiceForm.is_active,
        pricing_type: activeServiceForm.pricing_type,
        pricing_config: activeServiceForm.pricing_config,
        options_config: activeServiceForm.options_config,
      };

      await adminService.updateService(activeServiceForm.id, payload);
      toast.success(`Pengaturan "${activeServiceForm.name}" berhasil disimpan`);
      await fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan konfigurasi layanan');
    } finally {
      setSavingServiceId(null);
    }
  };

  // Modal helpers for "All Services" tab
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
        pricing_config: parseConfig(service.pricing_config),
        options_config: parseConfig(service.options_config),
      });
      setShowPricing(service.pricing_type === 'tiered');
    } else {
      setEditingId(null);
      setForm({
        name: '',
        description: '',
        base_price: '',
        minimum_order: 1,
        is_active: true,
        pricing_type: 'flat',
        pricing_config: {},
        options_config: {},
      });
      setShowPricing(false);
    }
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.base_price) {
      toast.warning('Nama layanan dan harga dasar wajib diisi');
      return;
    }
    setSavingModal(true);
    try {
      const data = {
        ...form,
        base_price: parseFloat(form.base_price),
        minimum_order: parseInt(form.minimum_order) || 1,
      };
      if (editingId) {
        await adminService.updateService(editingId, data);
        toast.success('Layanan berhasil diperbarui');
      } else {
        await adminService.createService(data);
        toast.success('Layanan baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan layanan');
    } finally {
      setSavingModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await adminService.deleteService(id);
      toast.success('Layanan berhasil dihapus');
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus layanan');
    }
  };

  // Dedicated Tab navigation configuration
  const serviceTabs = [
    {
      key: 'sablon',
      label: 'Sablon Kaos',
      icon: Shirt,
      tag: 'Spesialis Kaos & Baju',
      color: 'from-primary/20 to-[#ff60a8]/20 border-primary/30 text-primary',
    },
    {
      key: 'banner',
      label: 'Printing Banner',
      icon: Layers,
      tag: 'Spanduk & Banner',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    },
    {
      key: 'stiker',
      label: 'Cetak Stiker',
      icon: Tag,
      tag: 'Stiker & Label Cutting',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    },
    {
      key: 'bordir',
      label: 'Bordir Komputer',
      icon: Scissors,
      tag: 'Bordir Seragam & Topi',
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400',
    },
    {
      key: 'all',
      label: 'Semua Layanan',
      icon: LayoutGrid,
      tag: 'Tabel Master & Ringkasan',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    },
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-20">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[0.5px]">
              KELOLA LAYANAN PRODUKSI
            </h1>
            <p className="text-gray text-xs sm:text-sm mt-1">
              Pusat konfigurasi spesifikasi teknik sablon, banner, stiker, dan bordir secara terpisah dan terfokus.
            </p>
          </div>

          {currentTab === 'all' && (
            <button
              onClick={() => openModal()}
              className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-primary/25 font-semibold self-start sm:self-auto cursor-pointer"
            >
              <Plus size={16} /> Tambah Layanan Baru
            </button>
          )}
        </div>

        {/* ===================== TAB NAVIGASI PER LAYANAN ===================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 p-1.5 rounded-3xl bg-[#140c1a]/80 border border-white/10 backdrop-blur-xl shadow-xl">
          {serviceTabs.map((tab) => {
            const isActive = currentTab === tab.key;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex flex-col items-start p-3 sm:p-3.5 rounded-2xl transition-all duration-300 text-left relative overflow-hidden cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-xl shadow-primary/30 scale-[1.02] border-transparent font-bold'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] text-gray-300 hover:text-white border border-white/5'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-primary'
                    }`}
                  >
                    <IconComp size={18} />
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </div>
                <p className="text-xs sm:text-sm font-heading tracking-wide leading-tight">{tab.label}</p>
                <span className={`text-[10px] mt-0.5 truncate max-w-full ${isActive ? 'text-white/80' : 'text-zinc-500'}`}>
                  {tab.tag}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] bg-[#180f1e]/80 rounded-3xl border border-white/10">
            <LoadingSpinner size="lg" />
            <p className="text-zinc-400 text-xs mt-3">Memuat konfigurasi layanan...</p>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TAB 1: SABLON KAOS (DEDICATED HUB) */}
            {/* ========================================================================= */}
            {currentTab === 'sablon' && activeServiceForm && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Hub Header Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
                        <Shirt size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-heading text-xl sm:text-2xl text-white font-bold">{activeServiceForm.name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            activeServiceForm.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {activeServiceForm.is_active ? 'Layanan Aktif' : 'Non-Aktif'}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5">Konfigurasi teknik sablon, skema harga bertingkat, palet warna kain, dan area cetak.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-all">
                        <input
                          type="checkbox"
                          checked={activeServiceForm.is_active}
                          onChange={(e) => setActiveServiceForm({ ...activeServiceForm, is_active: e.target.checked })}
                          className="w-4 h-4 rounded text-primary focus:ring-primary bg-black/40 border-white/20 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-white">Aktifkan Layanan</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleSaveActiveService}
                        disabled={savingServiceId === activeServiceForm.id}
                        className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-primary/25 font-bold cursor-pointer"
                      >
                        {savingServiceId === activeServiceForm.id ? <LoadingSpinner size="sm" /> : <Save size={16} />}
                        Simpan Sablon Kaos
                      </button>
                    </div>
                  </div>

                  {/* Form Dasar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Nama Layanan
                      </label>
                      <input
                        type="text"
                        value={activeServiceForm.name}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, name: e.target.value })}
                        className="input-dark w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Harga Dasar Terendah (Rp)
                      </label>
                      <input
                        type="number"
                        value={activeServiceForm.base_price}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, base_price: e.target.value })}
                        className="input-dark w-full text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Minimum Pemesanan (Pcs)
                      </label>
                      <input
                        type="number"
                        value={activeServiceForm.minimum_order}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, minimum_order: parseInt(e.target.value) || 1 })}
                        className="input-dark w-full text-sm"
                        min="1"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Deskripsi Layanan Sablon
                      </label>
                      <textarea
                        value={activeServiceForm.description}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, description: e.target.value })}
                        className="input-dark w-full text-xs resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* 1. Matrix Harga Bertingkat Sablon */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                        <Flame size={20} className="text-primary" />
                        Teknik Sablon &amp; Skema Harga Bertingkat
                      </h3>
                      <p className="text-zinc-400 text-xs mt-0.5">Atur harga untuk pesanan satuan, 1 lusin (12 pcs), dan grosir 2-6 lusin (24-72 pcs).</p>
                    </div>

                    {/* Add Technique Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTechniqueInput}
                        onChange={(e) => setNewTechniqueInput(e.target.value)}
                        placeholder="Teknik baru (mis: Rubber)"
                        className="input-dark text-xs py-1.5 px-3 w-44"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newTechniqueInput.trim()) return;
                          const name = newTechniqueInput.trim();
                          const types = [...(activeServiceForm.options_config.sablon_types || [])];
                          if (!types.includes(name)) types.push(name);
                          const prc = { ...activeServiceForm.pricing_config };
                          if (!prc[name.toLowerCase()]) {
                            prc[name.toLowerCase()] = { satuan: 75000, lusin_1: 65000, lusin_2_6: 60000 };
                          }
                          setActiveServiceForm({
                            ...activeServiceForm,
                            pricing_config: prc,
                            options_config: { ...activeServiceForm.options_config, sablon_types: types },
                          });
                          setNewTechniqueInput('');
                          toast.success(`Teknik ${name} ditambahkan`);
                        }}
                        className="btn-primary text-xs py-1.5 px-3 rounded-xl font-semibold cursor-pointer"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(activeServiceForm.options_config.sablon_types || ['Plastisol', 'DTF']).map((tech) => {
                      const key = tech.toLowerCase();
                      const techPricing = activeServiceForm.pricing_config?.[key] || {};
                      return (
                        <div key={tech} className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all">
                          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-white/5">
                            <span className="font-heading text-base text-primary font-bold">{tech}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const types = (activeServiceForm.options_config.sablon_types || []).filter((t) => t !== tech);
                                const prc = { ...activeServiceForm.pricing_config };
                                delete prc[key];
                                setActiveServiceForm({
                                  ...activeServiceForm,
                                  pricing_config: prc,
                                  options_config: { ...activeServiceForm.options_config, sablon_types: types },
                                });
                              }}
                              className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Hapus teknik sablon ini"
                            >
                              <X size={15} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                                Satuan (1-11 pcs)
                              </label>
                              <div className="flex items-center rounded-xl bg-[#120a16] border border-white/15 overflow-hidden focus-within:border-primary transition-all">
                                <span className="px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 bg-white/5 border-r border-white/10 select-none shrink-0">Rp</span>
                                <input
                                  type="number"
                                  value={techPricing.satuan || ''}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setActiveServiceForm({
                                      ...activeServiceForm,
                                      pricing_config: {
                                        ...activeServiceForm.pricing_config,
                                        [key]: { ...techPricing, satuan: val },
                                      },
                                    });
                                  }}
                                  className="bg-transparent w-full text-xs font-mono text-white px-2.5 py-1.5 outline-none"
                                  placeholder="75000"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                                1 Lusin (12-23 pcs)
                              </label>
                              <div className="flex items-center rounded-xl bg-[#120a16] border border-white/15 overflow-hidden focus-within:border-primary transition-all">
                                <span className="px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 bg-white/5 border-r border-white/10 select-none shrink-0">Rp</span>
                                <input
                                  type="number"
                                  value={techPricing.lusin_1 || ''}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setActiveServiceForm({
                                      ...activeServiceForm,
                                      pricing_config: {
                                        ...activeServiceForm.pricing_config,
                                        [key]: { ...techPricing, lusin_1: val },
                                      },
                                    });
                                  }}
                                  className="bg-transparent w-full text-xs font-mono text-white px-2.5 py-1.5 outline-none"
                                  placeholder="65000"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                                2-6 Lusin (24-72 pcs)
                              </label>
                              <div className="flex items-center rounded-xl bg-[#120a16] border border-white/15 overflow-hidden focus-within:border-primary transition-all">
                                <span className="px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 bg-white/5 border-r border-white/10 select-none shrink-0">Rp</span>
                                <input
                                  type="number"
                                  value={techPricing.lusin_2_6 || ''}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setActiveServiceForm({
                                      ...activeServiceForm,
                                      pricing_config: {
                                        ...activeServiceForm.pricing_config,
                                        [key]: { ...techPricing, lusin_2_6: val },
                                      },
                                    });
                                  }}
                                  className="bg-transparent w-full text-xs font-mono text-white px-2.5 py-1.5 outline-none"
                                  placeholder="60000"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Palet Warna Kaos (Terintegrasi dengan Master Warna Kaos) */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                          <Palette size={20} className="text-primary" />
                          Opsi Pilihan Warna Kaos
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                          {(activeServiceForm.options_config.colors || []).length} Warna Aktif
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        Daftar warna kaos yang dapat dipilih customer saat memesan sablon. Terintegrasi dengan master data di <span className="text-primary font-semibold">Katalog & Pakaian ➔ Warna Kaos</span>.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!masterColors || masterColors.length === 0) {
                            toast.warning('Belum ada data master warna di database');
                            return;
                          }
                          const activeMasterNames = masterColors.filter((c) => c.is_active).map((c) => c.name);
                          setActiveServiceForm({
                            ...activeServiceForm,
                            options_config: { ...activeServiceForm.options_config, colors: activeMasterNames },
                          });
                          toast.success(`Berhasil menyinkronkan ${activeMasterNames.length} warna dari Master Katalog!`);
                        }}
                        className="btn-glass text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-primary border-primary/30 hover:bg-primary/20 font-semibold cursor-pointer"
                        title="Terapkan semua warna aktif dari menu Katalog & Pakaian -> Warna Kaos"
                      >
                        <RefreshCw size={13} className={loadingMasterColors ? 'animate-spin' : ''} />
                        Sinkronkan dari Master Warna
                      </button>

                      <Link
                        to="/admin/warna"
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors no-underline"
                        title="Buka menu Kelola Master Warna Kaos"
                      >
                        <ExternalLink size={13} />
                        Kelola Master Warna
                      </Link>
                    </div>
                  </div>

                  {/* Panel Pilihan Cepat dari Master Warna Kaos */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                          Pilih dari Master Katalog ({masterColors.length} Warna Terdaftar)
                        </span>
                        {loadingMasterColors && <span className="text-[10px] text-primary animate-pulse">Memuat master data...</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allNames = masterColors.map((c) => c.name);
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, colors: allNames },
                            });
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-zinc-600">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, colors: [] },
                            });
                          }}
                          className="text-[11px] text-rose-400 hover:underline font-semibold cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    {masterColors.length === 0 ? (
                      <div className="text-center py-4 text-xs text-zinc-500">
                        {loadingMasterColors ? 'Sedang memuat data master warna...' : 'Belum ada data di master warna. Tambahkan warna di menu Katalog ➔ Warna Kaos.'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                        {masterColors.map((clr) => {
                          const currentColors = activeServiceForm.options_config.colors || [];
                          const isSelected = currentColors.some((c) => c.toLowerCase() === clr.name.toLowerCase());
                          return (
                            <button
                              key={clr.id}
                              type="button"
                              onClick={() => {
                                let newColors;
                                if (isSelected) {
                                  newColors = currentColors.filter((c) => c.toLowerCase() !== clr.name.toLowerCase());
                                } else {
                                  newColors = [...currentColors, clr.name];
                                }
                                setActiveServiceForm({
                                  ...activeServiceForm,
                                  options_config: { ...activeServiceForm.options_config, colors: newColors },
                                });
                              }}
                              className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/20 border-primary/60 text-white shadow-md shadow-primary/10'
                                  : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 shadow-inner"
                                style={{ backgroundColor: clr.hex_code }}
                              />
                              <span className="text-xs truncate font-medium flex-1">{clr.name}</span>
                              {isSelected ? (
                                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-zinc-600 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Daftar Warna Aktif untuk Layanan Sablon */}
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                      Daftar Warna yang Tersedia untuk Pelanggan ({(activeServiceForm.options_config.colors || []).length} Warna):
                    </p>
                    {(activeServiceForm.options_config.colors || []).length === 0 ? (
                      <p className="text-xs text-amber-400/90 py-2">
                        ⚠️ Belum ada warna yang dipilih. Klik tombol <strong>"Sinkronkan dari Master Warna"</strong> di atas untuk mengisi opsi warna secara instan.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                        {(activeServiceForm.options_config.colors || []).map((clr) => {
                          const hex = getColorHex(clr);
                          return (
                            <div
                              key={clr}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/40 transition-all group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 shadow-inner"
                                  style={{ backgroundColor: hex }}
                                />
                                <span className="text-xs text-zinc-200 truncate font-medium">{clr}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const colors = (activeServiceForm.options_config.colors || []).filter((c) => c !== clr);
                                  setActiveServiceForm({
                                    ...activeServiceForm,
                                    options_config: { ...activeServiceForm.options_config, colors },
                                  });
                                }}
                                className="text-zinc-500 hover:text-rose-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title={`Hapus ${clr} dari opsi sablon`}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Posisi Area Cetak & Biaya Tambahan Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Posisi Area Cetak */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                          <Sliders size={20} className="text-primary" />
                          Posisi Area Cetak
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">Pilihan posisi sablon pada pakaian.</p>
                      </div>

                      <div className="flex items-center gap-2.5 bg-white/5 p-2 px-3 rounded-2xl border border-white/10">
                        <span className="text-[11px] text-zinc-300 font-semibold whitespace-nowrap">Biaya Area ke-2:</span>
                        <div className="flex items-center rounded-xl bg-[#120a16] border border-white/15 overflow-hidden focus-within:border-primary transition-all">
                          <span className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 bg-white/5 border-r border-white/10 select-none shrink-0">Rp</span>
                          <input
                            type="number"
                            value={activeServiceForm.options_config.area_surcharge || 15000}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setActiveServiceForm({
                                ...activeServiceForm,
                                options_config: { ...activeServiceForm.options_config, area_surcharge: val },
                              });
                            }}
                            className="bg-transparent text-xs font-mono text-white px-2.5 py-1 w-24 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {(activeServiceForm.options_config.print_positions || DEFAULT_PRINT_POSITIONS).map((pos) => (
                        <div
                          key={pos.value}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all group"
                        >
                          <span className="text-xs text-zinc-200 font-medium">{pos.label}</span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{pos.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dimensi Ukuran Gambar */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                          <Ruler size={20} className="text-primary" />
                          Dimensi Ukuran Cetak
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">Preset ukuran sablon yang tersedia (A3, A4, A5, dll).</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {(activeServiceForm.options_config.print_sizes || DEFAULT_PRINT_SIZES).map((sz) => (
                        <div
                          key={sz.value}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all"
                        >
                          <span className="text-xs text-white font-semibold">{sz.label}</span>
                          <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{sz.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Opsi Pilihan Ukuran Kaos & Biaya Tambahan (Terintegrasi dengan Master Ukuran Kaos) */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                          <Ruler size={20} className="text-primary" />
                          Opsi Pilihan Ukuran Kaos &amp; Biaya Tambahan
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                          {(activeServiceForm.options_config.sizes || []).length} Ukuran Aktif
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        Daftar ukuran kaos yang dapat dipilih customer saat memesan sablon. Terintegrasi langsung dengan <span className="text-primary font-semibold">Katalog &amp; Pakaian ➔ Ukuran Kaos</span>.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!masterSizes || masterSizes.length === 0) {
                            toast.warning('Belum ada data master ukuran di database');
                            return;
                          }
                          const allMasterNames = masterSizes.map((s) => s.name);
                          setActiveServiceForm({
                            ...activeServiceForm,
                            options_config: { ...activeServiceForm.options_config, sizes: allMasterNames },
                          });
                          toast.success(`Berhasil menyinkronkan ${allMasterNames.length} ukuran dari Master Katalog!`);
                        }}
                        className="btn-glass text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-primary border-primary/30 hover:bg-primary/20 font-semibold cursor-pointer"
                        title="Terapkan semua ukuran dari menu Katalog & Pakaian -> Ukuran Kaos"
                      >
                        <RefreshCw size={13} className={loadingMasterSizes ? 'animate-spin' : ''} />
                        Sinkronkan dari Master Ukuran
                      </button>

                      <Link
                        to="/admin/ukuran"
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors no-underline"
                        title="Buka menu Kelola Master Ukuran Kaos"
                      >
                        <ExternalLink size={13} />
                        Kelola Master Ukuran
                      </Link>
                    </div>
                  </div>

                  {/* Panel Pilihan Cepat dari Master Ukuran Kaos */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                          Pilih dari Master Katalog ({masterSizes.length} Ukuran Terdaftar)
                        </span>
                        {loadingMasterSizes && <span className="text-[10px] text-primary animate-pulse">Memuat master data...</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allNames = masterSizes.map((s) => s.name);
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, sizes: allNames },
                            });
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-zinc-600">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, sizes: [] },
                            });
                          }}
                          className="text-[11px] text-rose-400 hover:underline font-semibold cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    {masterSizes.length === 0 ? (
                      <div className="text-center py-4 text-xs text-zinc-500">
                        {loadingMasterSizes ? 'Sedang memuat data master ukuran...' : 'Belum ada data ukuran di master. Tambahkan ukuran di menu Katalog ➔ Ukuran Kaos.'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                        {masterSizes.map((sz) => {
                          const currentSizes = activeServiceForm.options_config.sizes || [];
                          const isSelected = currentSizes.some((s) => s.toLowerCase() === sz.name.toLowerCase());
                          return (
                            <button
                              key={sz.id}
                              type="button"
                              onClick={() => {
                                let newSizes;
                                if (isSelected) {
                                  newSizes = currentSizes.filter((s) => s.toLowerCase() !== sz.name.toLowerCase());
                                } else {
                                  newSizes = [...currentSizes, sz.name];
                                }
                                setActiveServiceForm({
                                  ...activeServiceForm,
                                  options_config: { ...activeServiceForm.options_config, sizes: newSizes },
                                });
                              }}
                              className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/20 border-primary/60 text-white shadow-md shadow-primary/10'
                                  : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate leading-tight">{sz.name}</p>
                                {sz.dimensions && (
                                  <span className="text-[10px] text-zinc-500 truncate block font-mono">{sz.dimensions}</span>
                                )}
                              </div>
                              {isSelected ? (
                                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-zinc-600 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Grid Konfigurasi Biaya Tambahan (Surcharge) per Ukuran Aktif */}
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                      Atur Biaya Tambahan (Surcharge +Rp) untuk Ukuran Aktif ({(activeServiceForm.options_config.sizes || []).length} Ukuran):
                    </p>

                    {(activeServiceForm.options_config.sizes || []).length === 0 ? (
                      <p className="text-xs text-amber-400/90 py-2">
                        ⚠️ Belum ada ukuran yang dipilih. Klik tombol <strong>"Sinkronkan dari Master Ukuran"</strong> di atas untuk mengisi opsi ukuran secara instan.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {(activeServiceForm.options_config.sizes || []).map((sz) => {
                          const master = masterSizes.find((s) => s.name?.toLowerCase() === sz.toLowerCase());
                          const surcharge = activeServiceForm.options_config.size_pricing?.[sz] || 0;
                          return (
                            <div key={sz} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 relative group">
                              <div className="flex items-center justify-between mb-1.5">
                                <div>
                                  <span className="text-xs font-bold text-white block">{sz}</span>
                                  {master?.dimensions && (
                                    <span className="text-[10px] text-zinc-500 font-mono block">{master.dimensions}</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSizes = (activeServiceForm.options_config.sizes || []).filter((s) => s !== sz);
                                    setActiveServiceForm({
                                      ...activeServiceForm,
                                      options_config: { ...activeServiceForm.options_config, sizes: newSizes },
                                    });
                                  }}
                                  className="text-zinc-500 hover:text-rose-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title={`Hapus ukuran ${sz}`}
                                >
                                  <X size={13} />
                                </button>
                              </div>

                              <div className="flex items-center rounded-xl bg-[#120a16] border border-white/15 overflow-hidden focus-within:border-primary transition-all mt-1">
                                <span className="px-2 py-1 text-[10px] font-bold text-primary bg-primary/10 border-r border-primary/20 select-none shrink-0">+Rp</span>
                                <input
                                  type="number"
                                  value={surcharge}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setActiveServiceForm({
                                      ...activeServiceForm,
                                      options_config: {
                                        ...activeServiceForm.options_config,
                                        size_pricing: {
                                          ...activeServiceForm.options_config.size_pricing,
                                          [sz]: val,
                                        },
                                      },
                                    });
                                  }}
                                  className="bg-transparent w-full text-xs font-mono text-white px-2 py-1 outline-none"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PRINTING BANNER (DEDICATED HUB) */}
            {/* ========================================================================= */}
            {currentTab === 'banner' && activeServiceForm && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Hub Header Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                        <Layers size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-heading text-xl sm:text-2xl text-white font-bold">{activeServiceForm.name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            activeServiceForm.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {activeServiceForm.is_active ? 'Layanan Aktif' : 'Non-Aktif'}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5">Konfigurasi opsi dimensi ukuran banner, pilihan bahan spanduk, dan tarif cetak per meter.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-all">
                        <input
                          type="checkbox"
                          checked={activeServiceForm.is_active}
                          onChange={(e) => setActiveServiceForm({ ...activeServiceForm, is_active: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-black/40 border-white/20 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-white">Aktifkan Banner</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleSaveActiveService}
                        disabled={savingServiceId === activeServiceForm.id}
                        className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-blue-500/25 font-bold cursor-pointer bg-gradient-to-r from-blue-500 to-cyan-500 border-none"
                      >
                        {savingServiceId === activeServiceForm.id ? <LoadingSpinner size="sm" /> : <Save size={16} />}
                        Simpan Banner
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Nama Layanan
                      </label>
                      <input
                        type="text"
                        value={activeServiceForm.name}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, name: e.target.value })}
                        className="input-dark w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Harga Dasar per m² / Unit (Rp)
                      </label>
                      <input
                        type="number"
                        value={activeServiceForm.base_price}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, base_price: e.target.value })}
                        className="input-dark w-full text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Minimum Order (Pcs)
                      </label>
                      <input
                        type="number"
                        value={activeServiceForm.minimum_order}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, minimum_order: parseInt(e.target.value) || 1 })}
                        className="input-dark w-full text-sm"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Ukuran & Bahan Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Dimensi Ukuran Banner */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                          <Ruler size={20} className="text-blue-400" />
                          Dimensi / Ukuran Banner
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">Daftar ukuran spanduk yang dapat dipesan.</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newBannerSizeInput}
                          onChange={(e) => setNewBannerSizeInput(e.target.value)}
                          placeholder="misal: 120x300cm"
                          className="input-dark text-xs py-1.5 px-2.5 w-32"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newBannerSizeInput.trim()) return;
                            const sz = newBannerSizeInput.trim();
                            const sizes = [...(activeServiceForm.options_config.sizes || [])];
                            if (!sizes.includes(sz)) sizes.push(sz);
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, sizes },
                            });
                            setNewBannerSizeInput('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(activeServiceForm.options_config.sizes || ['60x160cm', '80x200cm', '100x250cm']).map((sz) => (
                        <div
                          key={sz}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 transition-all group"
                        >
                          <span className="text-xs font-semibold text-white">{sz}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const sizes = (activeServiceForm.options_config.sizes || []).filter((s) => s !== sz);
                              setActiveServiceForm({
                                ...activeServiceForm,
                                options_config: { ...activeServiceForm.options_config, sizes },
                              });
                            }}
                            className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pilihan Bahan Banner */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                          <Layers size={20} className="text-blue-400" />
                          Pilihan Bahan Spanduk
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">Jenis kain atau vinyl banner (Flexi, Korea, dll).</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newBannerMaterialInput}
                          onChange={(e) => setNewBannerMaterialInput(e.target.value)}
                          placeholder="misal: Flexi Jerman"
                          className="input-dark text-xs py-1.5 px-2.5 w-32"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newBannerMaterialInput.trim()) return;
                            const mat = newBannerMaterialInput.trim();
                            const materials = [...(activeServiceForm.options_config.materials || [])];
                            if (!materials.includes(mat)) materials.push(mat);
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, materials },
                            });
                            setNewBannerMaterialInput('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(activeServiceForm.options_config.materials || ['Flexi Chinch', 'Vinyl', 'Fabric']).map((mat) => (
                        <div
                          key={mat}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 transition-all group"
                        >
                          <span className="text-xs font-semibold text-white">{mat}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const materials = (activeServiceForm.options_config.materials || []).filter((m) => m !== mat);
                              setActiveServiceForm({
                                ...activeServiceForm,
                                options_config: { ...activeServiceForm.options_config, materials },
                              });
                            }}
                            className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: CETAK STIKER (DEDICATED HUB) */}
            {/* ========================================================================= */}
            {currentTab === 'stiker' && activeServiceForm && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Hub Header Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                        <Tag size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-heading text-xl sm:text-2xl text-white font-bold">{activeServiceForm.name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            activeServiceForm.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {activeServiceForm.is_active ? 'Layanan Aktif' : 'Non-Aktif'}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5">Konfigurasi bahan stiker cutting, pola die-cut / kiss-cut, dan aturan minimum order.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-all">
                        <input
                          type="checkbox"
                          checked={activeServiceForm.is_active}
                          onChange={(e) => setActiveServiceForm({ ...activeServiceForm, is_active: e.target.checked })}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-black/40 border-white/20 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-white">Aktifkan Stiker</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleSaveActiveService}
                        disabled={savingServiceId === activeServiceForm.id}
                        className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-amber-500/25 font-bold cursor-pointer bg-gradient-to-r from-amber-500 to-orange-500 border-none text-black font-extrabold"
                      >
                        {savingServiceId === activeServiceForm.id ? <LoadingSpinner size="sm" /> : <Save size={16} />}
                        Simpan Stiker
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Nama Layanan
                      </label>
                      <input
                        type="text"
                        value={activeServiceForm.name}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, name: e.target.value })}
                        className="input-dark w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Harga Dasar per Pcs (Rp)
                      </label>
                      <input
                        type="number"
                        value={activeServiceForm.base_price}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, base_price: e.target.value })}
                        className="input-dark w-full text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Minimum Order (Pcs)
                      </label>
                      <input
                        type="number"
                        value={activeServiceForm.minimum_order}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, minimum_order: parseInt(e.target.value) || 1 })}
                        className="input-dark w-full text-sm"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Bahan & Ukuran Stiker */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bahan Stiker */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                          <Tag size={20} className="text-amber-400" />
                          Pilihan Bahan Stiker
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">Vinyl Glossy, Doff/Matte, Transparan, Hologram, dll.</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newStickerMaterialInput}
                          onChange={(e) => setNewStickerMaterialInput(e.target.value)}
                          placeholder="misal: Hologram Rainbow"
                          className="input-dark text-xs py-1.5 px-2.5 w-36"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newStickerMaterialInput.trim()) return;
                            const mat = newStickerMaterialInput.trim();
                            const materials = [...(activeServiceForm.options_config.materials || [])];
                            if (!materials.includes(mat)) materials.push(mat);
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, materials },
                            });
                            setNewStickerMaterialInput('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(activeServiceForm.options_config.materials || ['Vinyl Glossy', 'Vinyl Matte', 'Transparan', 'Hologram']).map((mat) => (
                        <div
                          key={mat}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all group"
                        >
                          <span className="text-xs font-semibold text-white">{mat}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const materials = (activeServiceForm.options_config.materials || []).filter((m) => m !== mat);
                              setActiveServiceForm({
                                ...activeServiceForm,
                                options_config: { ...activeServiceForm.options_config, materials },
                              });
                            }}
                            className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ukuran & Pola Potong Stiker */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                          <Ruler size={20} className="text-amber-400" />
                          Ukuran / Cutting Stiker
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">Preset diameter atau dimensi stiker (5x5cm, 7x7cm, Custom).</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newStickerSizeInput}
                          onChange={(e) => setNewStickerSizeInput(e.target.value)}
                          placeholder="misal: 6x6cm (Bulat)"
                          className="input-dark text-xs py-1.5 px-2.5 w-32"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newStickerSizeInput.trim()) return;
                            const sz = newStickerSizeInput.trim();
                            const sizes = [...(activeServiceForm.options_config.sizes || [])];
                            if (!sizes.includes(sz)) sizes.push(sz);
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, sizes },
                            });
                            setNewStickerSizeInput('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(activeServiceForm.options_config.sizes || ['5x5cm', '7x7cm', '10x10cm', 'Custom']).map((sz) => (
                        <div
                          key={sz}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all group"
                        >
                          <span className="text-xs font-semibold text-white">{sz}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const sizes = (activeServiceForm.options_config.sizes || []).filter((s) => s !== sz);
                              setActiveServiceForm({
                                ...activeServiceForm,
                                options_config: { ...activeServiceForm.options_config, sizes },
                              });
                            }}
                            className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: BORDIR KOMPUTER (DEDICATED HUB) */}
            {/* ========================================================================= */}
            {currentTab === 'bordir' && activeServiceForm && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Hub Header Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                        <Scissors size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-heading text-xl sm:text-2xl text-white font-bold">{activeServiceForm.name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            activeServiceForm.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {activeServiceForm.is_active ? 'Layanan Aktif' : 'Non-Aktif'}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5">Konfigurasi posisi bordir komputer untuk kemeja, jaket, seragam, dan topi.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-all">
                        <input
                          type="checkbox"
                          checked={activeServiceForm.is_active}
                          onChange={(e) => setActiveServiceForm({ ...activeServiceForm, is_active: e.target.checked })}
                          className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500 bg-black/40 border-white/20 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-white">Aktifkan Bordir</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleSaveActiveService}
                        disabled={savingServiceId === activeServiceForm.id}
                        className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-purple-500/25 font-bold cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-500 border-none"
                      >
                        {savingServiceId === activeServiceForm.id ? <LoadingSpinner size="sm" /> : <Save size={16} />}
                        Simpan Bordir
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Nama Layanan
                      </label>
                      <input
                        type="text"
                        value={activeServiceForm.name}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, name: e.target.value })}
                        className="input-dark w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Harga Dasar (Rp)
                      </label>
                      <input
                        type="number"
                        value={activeServiceForm.base_price}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, base_price: e.target.value })}
                        className="input-dark w-full text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Minimum Order (Pcs)
                      </label>
                      <input
                        type="number"
                        value={activeServiceForm.minimum_order}
                        onChange={(e) => setActiveServiceForm({ ...activeServiceForm, minimum_order: parseInt(e.target.value) || 1 })}
                        className="input-dark w-full text-sm"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Posisi Bordir */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div>
                      <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                        <Scissors size={20} className="text-purple-400" />
                        Pilihan Posisi Bordir
                      </h3>
                      <p className="text-zinc-400 text-xs mt-0.5">Letak bordir pada seragam/baju (Dada Kiri, Dada Kanan, Punggung, dll).</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newBordirPosInput}
                        onChange={(e) => setNewBordirPosInput(e.target.value)}
                        placeholder="misal: Kerah Belakang"
                        className="input-dark text-xs py-1.5 px-2.5 w-36"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newBordirPosInput.trim()) return;
                          const pos = newBordirPosInput.trim();
                          const positions = [...(activeServiceForm.options_config.positions || [])];
                          if (!positions.includes(pos)) positions.push(pos);
                          setActiveServiceForm({
                            ...activeServiceForm,
                            options_config: { ...activeServiceForm.options_config, positions },
                          });
                          setNewBordirPosInput('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500 hover:text-white transition-all cursor-pointer"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {(activeServiceForm.options_config.positions || ['Dada Kiri', 'Dada Kanan', 'Punggung', 'Lengan Kiri', 'Lengan Kanan', 'Topi Depan']).map((pos) => (
                      <div
                        key={pos}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all group"
                      >
                        <span className="text-xs font-semibold text-white">{pos}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const positions = (activeServiceForm.options_config.positions || []).filter((p) => p !== pos);
                            setActiveServiceForm({
                              ...activeServiceForm,
                              options_config: { ...activeServiceForm.options_config, positions },
                            });
                          }}
                          className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: SEMUA LAYANAN (MASTER TABLE) */}
            {/* ========================================================================= */}
            {currentTab === 'all' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 sm:p-5 rounded-3xl bg-[#180f1e]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="font-heading text-lg text-white font-bold flex items-center gap-2">
                      <Package size={20} className="text-primary" />
                      Daftar Seluruh Master Layanan
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          placeholder="Cari layanan..."
                          className="input-dark text-xs pl-8 pr-3 py-1.5 w-48"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Layanan</th>
                          <th className="py-3 px-4">Tipe Tarif</th>
                          <th className="py-3 px-4">Harga Dasar</th>
                          <th className="py-3 px-4">Min. Order</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {services
                          .filter((s) => !filters.search || s.name.toLowerCase().includes(filters.search.toLowerCase()))
                          .map((service) => (
                            <tr key={service.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-bold text-white block">{service.name}</span>
                                <span className="text-[11px] text-zinc-400 line-clamp-1 max-w-xs">{service.description || 'Tidak ada deskripsi'}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  service.pricing_type === 'tiered' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {service.pricing_type === 'tiered' ? 'Bertingkat' : 'Flat'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-semibold text-white">
                                {formatRupiah(service.base_price)}
                              </td>
                              <td className="py-3 px-4 text-zinc-300">
                                {service.minimum_order} pcs
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  service.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                                }`}>
                                  {service.is_active ? 'Aktif' : 'Non-Aktif'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openModal(service)}
                                    className="p-1.5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                                    title="Edit Layanan"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete({ show: true, id: service.id })}
                                    className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Layanan"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal: Tambah / Edit Layanan Kustom */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[#1a1122] border border-white/15 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <Wrench size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl text-white tracking-[0.5px]">
                      {editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {editingId ? 'Perbarui konfigurasi tarif dan opsi pesanan' : 'Buat master jenis layanan produksi baru'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Nama Layanan <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-dark w-full"
                    placeholder="Contoh: Sablon Topi Trucker"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Deskripsi Layanan
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-dark w-full resize-none"
                    rows={3}
                    placeholder="Jelaskan karakteristik hasil sablon atau cetak..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Harga Dasar (Rp) <span className="text-primary">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.base_price}
                      onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                      className="input-dark w-full"
                      placeholder="50000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Min. Order (Pcs) <span className="text-primary">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.minimum_order}
                      onChange={(e) => setForm({ ...form, minimum_order: e.target.value })}
                      className="input-dark w-full"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary bg-black/40 border-white/20"
                    />
                    <span className="font-semibold text-white text-sm">Layanan Aktif &amp; Dapat Dipesan</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingModal}
                    className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2 rounded-xl shadow-lg shadow-primary/25 font-semibold cursor-pointer"
                  >
                    {savingModal ? <LoadingSpinner size="sm" /> : <Check size={16} />}
                    Simpan Layanan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={confirmDelete.show}
          onClose={() => setConfirmDelete({ show: false, id: null })}
          onConfirm={handleConfirmDelete}
          title="Hapus Layanan"
          message="Apakah Anda yakin ingin menghapus layanan ini? Seluruh riwayat dan opsi pesanan terkait akan terpengaruh."
          confirmLabel="Ya, Hapus Layanan"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
