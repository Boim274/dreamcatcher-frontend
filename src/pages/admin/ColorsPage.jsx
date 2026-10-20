import { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Palette,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Pipette,
  Sparkles,
  Sliders,
  Eye,
} from 'lucide-react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

/* ==================== COLOR CONVERSION UTILITIES ==================== */

function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex) {
  if (!hex) return null;
  let clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'white';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.55 ? 'black' : 'white';
}

/* ==================== PRESET PALETTES ==================== */

const PRESET_CATEGORIES = [
  {
    id: 'netral',
    name: 'Dasar & Netral',
    colors: [
      { name: 'Hitam Jetblack', hex: '#0A0A0A' },
      { name: 'Putih Solid', hex: '#FFFFFF' },
      { name: 'Abu-abu Misty', hex: '#94A3B8' },
      { name: 'Abu Charcoal', hex: '#334155' },
      { name: 'Navy Blue Gelap', hex: '#0F172A' },
      { name: 'Navy Standar', hex: '#1E3A8A' },
    ],
  },
  {
    id: 'cerah',
    name: 'Warna Cerah',
    colors: [
      { name: 'Merah Cabe', hex: '#DC2626' },
      { name: 'Merah Crimson', hex: '#E11D48' },
      { name: 'Biru Benhur / Royal', hex: '#2563EB' },
      { name: 'Kuning Kenari', hex: '#FACC15' },
      { name: 'Orange Mandarin', hex: '#EA580C' },
      { name: 'Hijau Fuji', hex: '#16A34A' },
    ],
  },
  {
    id: 'gelap',
    name: 'Warna Gelap & Elegan',
    colors: [
      { name: 'Maroon Burgundy', hex: '#7F1D1D' },
      { name: 'Hijau Botol', hex: '#14532D' },
      { name: 'Hijau Army', hex: '#3F6212' },
      { name: 'Coklat Kopi', hex: '#451A03' },
      { name: 'Ungu Tua Deep', hex: '#581C87' },
      { name: 'Dark Teal', hex: '#115E59' },
    ],
  },
  {
    id: 'pastel',
    name: 'Pastel & Earth Tone',
    colors: [
      { name: 'Cream / Broken White', hex: '#FEF3C7' },
      { name: 'Sage Green', hex: '#86EFAC' },
      { name: 'Baby Blue', hex: '#93C5FD' },
      { name: 'Lilac Soft', hex: '#C084FC' },
      { name: 'Dusty Pink', hex: '#F472B6' },
      { name: 'Terracotta', hex: '#C2410C' },
    ],
  },
];

/* Flattened presets for quick lookup */
const ALL_PRESET_COLORS = PRESET_CATEGORIES.flatMap((c) => c.colors);

/* ==================== 2D SPECTRUM PICKER ==================== */

function SaturationValuePicker({ hue, saturation, value, onChange }) {
  const containerRef = useRef(null);
  const [isPointerDown, setIsPointerDown] = useState(false);

  const updateFromPointer = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);
    onChange(s, v);
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPointerDown(true);
    updateFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isPointerDown) {
      updateFromPointer(e);
    }
  };

  const handlePointerUp = (e) => {
    if (isPointerDown) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      setIsPointerDown(false);
    }
  };

  const rgb = hsvToRgb(hue, saturation, value);
  const currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-44 rounded-2xl overflow-hidden cursor-crosshair select-none border border-white/20 shadow-inner"
      style={{
        backgroundColor: `hsl(${hue}, 100%, 50%)`,
        touchAction: 'none',
      }}
    >
      {/* Saturation gradient: White to transparent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #ffffff, transparent)' }}
      />
      {/* Value/Brightness gradient: Transparent to black */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #000000, transparent)' }}
      />

      {/* Draggable Circle Handle */}
      <div
        className="absolute w-5 h-5 rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.85)] -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/40"
        style={{
          left: `${saturation}%`,
          top: `${100 - value}%`,
          backgroundColor: currentHex,
        }}
      />
    </div>
  );
}

/* ==================== 1D RAINBOW HUE SLIDER ==================== */

function HueSlider({ hue, onChange }) {
  const containerRef = useRef(null);
  const [isPointerDown, setIsPointerDown] = useState(false);

  const updateFromPointer = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const h = Math.round((x / rect.width) * 360);
    onChange(Math.max(0, Math.min(360, h)));
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPointerDown(true);
    updateFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isPointerDown) {
      updateFromPointer(e);
    }
  };

  const handlePointerUp = (e) => {
    if (isPointerDown) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      setIsPointerDown(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-5 rounded-full cursor-pointer select-none border border-white/20 shadow-inner"
      style={{
        background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
        touchAction: 'none',
      }}
    >
      <div
        className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white shadow-[0_2px_6px_rgba(0,0,0,0.7)] -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/30"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
        }}
      />
    </div>
  );
}

/* ==================== MAIN COLORS PAGE COMPONENT ==================== */

export default function ColorsPage() {
  const toast = useToast();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', hex_code: '#0A0A0A', is_active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', is_active: '' });
  const [copiedHex, setCopiedHex] = useState(null);

  /* Advanced Color Picker States */
  const [hsv, setHsv] = useState({ h: 0, s: 0, v: 4 });
  const [hexInput, setHexInput] = useState('#0A0A0A');
  const [rgbState, setRgbState] = useState({ r: 10, g: 10, b: 10 });
  const [presetTab, setPresetTab] = useState('all');
  const nativeColorInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchColors(controller.signal);
    return () => controller.abort();
  }, [page, filters.is_active]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPage(1);
      fetchColors(null, 1, { ...filters, [key]: value });
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchColors(null, 1, filters);
    }
  };

  const handleResetFilters = () => {
    const reset = { search: '', is_active: '' };
    setFilters(reset);
    setPage(1);
    fetchColors(null, 1, reset);
  };

  const hasActiveFilters = Boolean(filters.search || filters.is_active);

  const fetchColors = async (signal, pageArg, overrideFilters) => {
    const p = pageArg || page;
    const f = overrideFilters || filters;
    try {
      const params = { page: p };
      if (f.search) params.search = f.search;
      if (f.is_active) params.is_active = f.is_active;
      const result = await adminService.getColors(params, signal);
      setColors(result.data);
      setPagination(result.pagination);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (color = null) => {
    const initialHex = (color ? color.hex_code : '#0A0A0A').toUpperCase();
    if (color) {
      setEditingId(color.id);
      setForm({
        name: color.name,
        hex_code: initialHex,
        is_active: color.is_active,
        sort_order: color.sort_order,
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        hex_code: initialHex,
        is_active: true,
        sort_order: colors.length + 1,
      });
    }

    setHexInput(initialHex);
    const rgb = hexToRgb(initialHex) || { r: 10, g: 10, b: 10 };
    setRgbState(rgb);
    setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
    setPresetTab('all');
    setShowModal(true);
  };

  /* Picker Change Handlers */
  const handleSpectrumChange = (s, v) => {
    const nextHsv = { ...hsv, s, v };
    setHsv(nextHsv);
    const rgb = hsvToRgb(nextHsv.h, s, v);
    setRgbState(rgb);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexInput(hex);
    setForm((prev) => ({ ...prev, hex_code: hex }));
  };

  const handleHueChange = (h) => {
    const nextHsv = { ...hsv, h };
    setHsv(nextHsv);
    const rgb = hsvToRgb(h, nextHsv.s, nextHsv.v);
    setRgbState(rgb);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexInput(hex);
    setForm((prev) => ({ ...prev, hex_code: hex }));
  };

  const handleHexInputChange = (e) => {
    const raw = e.target.value;
    setHexInput(raw);
    let val = raw.trim();
    if (!val.startsWith('#')) val = '#' + val;
    const rgb = hexToRgb(val);
    if (rgb) {
      setRgbState(rgb);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      setForm((prev) => ({ ...prev, hex_code: val.toUpperCase() }));
    }
  };

  const handleRgbChange = (channel, val) => {
    const num = Math.max(0, Math.min(255, parseInt(val) || 0));
    const nextRgb = { ...rgbState, [channel]: num };
    setRgbState(nextRgb);
    const newHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    setHexInput(newHex);
    setHsv(rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b));
    setForm((prev) => ({ ...prev, hex_code: newHex }));
  };

  const handleSelectPreset = (preset) => {
    const hex = preset.hex.toUpperCase();
    setHexInput(hex);
    const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
    setRgbState(rgb);
    setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
    setForm((prev) => ({
      ...prev,
      hex_code: hex,
      name: prev.name.trim() ? prev.name : preset.name,
    }));
  };

  const handleEyeDropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          setHexInput(hex);
          const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
          setRgbState(rgb);
          setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
          setForm((prev) => ({ ...prev, hex_code: hex }));
          toast.success(`Warna ${hex} berhasil dipilih!`);
        }
      } catch (_) {
        // Cancelled by user
      }
    } else {
      nativeColorInputRef.current?.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Nama warna wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await adminService.updateColor(editingId, form);
        toast.success('Warna berhasil diperbarui');
      } else {
        await adminService.createColor(form);
        toast.success('Warna baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchColors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan warna');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await adminService.deleteColor(id);
      toast.success('Warna berhasil dihapus');
      fetchColors();
    } catch (error) {
      toast.error('Gagal menghapus warna');
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await adminService.updateColor(id, { is_active: !current });
      fetchColors();
      toast.success(current ? 'Warna dinonaktifkan' : 'Warna diaktifkan');
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const copyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    toast.success(`Kode warna ${hex} disalin!`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const contrastColor = getContrastColor(form.hex_code);
  const isDarkFabric = contrastColor === 'white';

  const displayedPresets =
    presetTab === 'all'
      ? ALL_PRESET_COLORS
      : PRESET_CATEGORIES.find((c) => c.id === presetTab)?.colors || [];

  return (
    <ErrorBoundary>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#140b19] border border-white/10 p-6 rounded-3xl shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-[1px] flex items-center gap-3">
              <Palette className="text-primary" size={28} />
              Master Warna Kaos
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Kelola palet warna kain dan kaos untuk seluruh layanan cetak
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-[#ff60a8] text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-primary/25 transition-all cursor-pointer border-none"
          >
            <Plus size={16} /> Tambah Warna
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#140b19] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilter('search', e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari warna / kode HEX (Tekan Enter)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <select
              value={filters.is_active}
              onChange={(e) => handleFilter('is_active', e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#0e0712] border border-white/10 text-white text-xs focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="1">Aktif Saja</option>
              <option value="0">Nonaktif</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 text-xs transition-colors cursor-pointer"
                title="Reset Filter"
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Color Cards / Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-[#140b19] border border-white/10 rounded-3xl">
            <LoadingSpinner size="lg" />
            <p className="text-zinc-400 text-xs mt-3">Memuat data warna...</p>
          </div>
        ) : colors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-[#140b19] border border-white/10 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-zinc-500">
              <Palette size={28} />
            </div>
            <h3 className="text-white font-bold text-base">Belum Ada Data Warna</h3>
            <p className="text-zinc-400 text-xs mt-1 max-w-sm">
              {hasActiveFilters ? 'Tidak ada warna yang cocok dengan filter pencarian.' : 'Mulai tambahkan opsi warna kaos untuk katalog Anda.'}
            </p>
          </div>
        ) : (
          <div className="bg-[#140b19] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Warna</th>
                    <th className="py-4 px-6">Nama Warna</th>
                    <th className="py-4 px-6">Kode HEX</th>
                    <th className="py-4 px-6 text-center">Urutan</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                  {colors.map((color) => (
                    <tr key={color.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl border border-white/20 shadow-md shrink-0 ring-1 ring-black/20"
                            style={{ backgroundColor: color.hex_code }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {color.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-zinc-400">
                        <button
                          onClick={() => copyHex(color.hex_code)}
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
                        >
                          <span className="uppercase">{color.hex_code}</span>
                          {copiedHex === color.hex_code ? (
                            <Check size={12} className="text-green-400" />
                          ) : (
                            <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-center font-mono">
                        {color.sort_order}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => toggleActive(color.id, color.is_active)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                            color.is_active
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${color.is_active ? 'bg-green-400' : 'bg-zinc-500'}`} />
                          {color.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(color)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            title="Edit Warna"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ show: true, id: color.id })}
                            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Hapus Warna"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.per_page && (
              <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/[0.01]">
                <p className="text-xs text-zinc-400">
                  Menampilkan <strong className="text-white">{colors.length}</strong> dari{' '}
                  <strong className="text-white">{pagination.total}</strong> warna
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-xl border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 text-zinc-300 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono px-3 text-zinc-300">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <button
                    disabled={page >= pagination.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-xl border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 text-zinc-300 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Tambah / Edit Warna (Advanced Color Picker) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#140b19] border border-white/15 w-full max-w-xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-6 transform transition-all animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
              {/* Ambient Glow Accent */}
              <div
                className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 blur-3xl rounded-full opacity-35 transition-colors duration-300"
                style={{ backgroundColor: form.hex_code || '#ec4899' }}
              />
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-80 transition-colors duration-300"
                style={{ background: `linear-gradient(to right, transparent, ${form.hex_code || '#ec4899'}, transparent)` }}
              />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl border border-white/25 shadow-xl flex items-center justify-center shrink-0 transition-all duration-300 relative overflow-hidden"
                    style={{ backgroundColor: form.hex_code }}
                  >
                    <Palette size={20} className={contrastColor === 'white' ? 'text-white' : 'text-black'} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-[0.5px]">
                      {editingId ? 'Edit Warna' : 'Tambah Warna Baru'}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Pilih spektrum visual, masukkan kode HEX/RGB, atau gunakan preset kain
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form Scrollable Body */}
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto relative z-10 flex-1">
                {/* 1. Nama Warna Input */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Nama Warna <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    placeholder="Contoh: Merah Marun, Abu Misty, Forest Green"
                    required
                    autoFocus
                  />
                </div>

                {/* 2. Advanced Visual Spectrum & Hue Slider */}
                <div className="space-y-3.5 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders size={13} className="text-primary" />
                      Spektrum Warna Visual
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      Geser kotak & slider pelangi
                    </span>
                  </div>

                  {/* 2D Spectrum Box */}
                  <SaturationValuePicker
                    hue={hsv.h}
                    saturation={hsv.s}
                    value={hsv.v}
                    onChange={handleSpectrumChange}
                  />

                  {/* 1D Rainbow Hue Slider */}
                  <div className="pt-1">
                    <HueSlider
                      hue={hsv.h}
                      onChange={handleHueChange}
                    />
                  </div>

                  {/* Tool Buttons Bar */}
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Eyedropper Button */}
                      <button
                        type="button"
                        onClick={handleEyeDropper}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-primary/40 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                        title="Ambil warna dari layar"
                      >
                        <Pipette size={13} className="text-primary" />
                        <span>Pipet Layar</span>
                      </button>

                      {/* Native OS Color Dialog Fallback Button */}
                      <button
                        type="button"
                        onClick={() => nativeColorInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-primary/40 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                        title="Buka pemilih warna sistem"
                      >
                        <Palette size={13} className="text-zinc-400" />
                        <span>Palet OS</span>
                      </button>
                      <input
                        ref={nativeColorInputRef}
                        type="color"
                        value={form.hex_code}
                        onChange={(e) => {
                          const hex = e.target.value.toUpperCase();
                          setHexInput(hex);
                          const rgb = hexToRgb(hex);
                          if (rgb) {
                            setRgbState(rgb);
                            setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
                            setForm((p) => ({ ...p, hex_code: hex }));
                          }
                        }}
                        className="sr-only"
                      />
                    </div>

                    {/* Copy Hex Button */}
                    <button
                      type="button"
                      onClick={() => copyHex(form.hex_code)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-xs font-mono transition-all cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>{form.hex_code}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Direct HEX & RGB Code Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
                  {/* HEX Input */}
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                      Kode Warna (HEX) <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={hexInput}
                        onChange={handleHexInputChange}
                        maxLength={7}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                        placeholder="#000000"
                        required
                      />
                      <div
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg border border-white/30 shadow-sm"
                        style={{ backgroundColor: form.hex_code }}
                      />
                    </div>
                  </div>

                  {/* RGB Breakdown Inputs */}
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                      Komponen RGB (0 - 255)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={rgbState.r}
                          onChange={(e) => handleRgbChange('r', e.target.value)}
                          className="w-full px-2 py-2.5 text-center rounded-xl bg-[#0e0712] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute left-1.5 top-0.5 text-[9px] font-bold text-rose-400">R</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={rgbState.g}
                          onChange={(e) => handleRgbChange('g', e.target.value)}
                          className="w-full px-2 py-2.5 text-center rounded-xl bg-[#0e0712] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute left-1.5 top-0.5 text-[9px] font-bold text-emerald-400">G</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={rgbState.b}
                          onChange={(e) => handleRgbChange('b', e.target.value)}
                          className="w-full px-2 py-2.5 text-center rounded-xl bg-[#0e0712] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute left-1.5 top-0.5 text-[9px] font-bold text-blue-400">B</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Live Contrast & Fabric Recommendation Card */}
                <div
                  className="p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 shadow-md"
                  style={{
                    backgroundColor: form.hex_code,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                        contrastColor === 'white'
                          ? 'border-white/30 text-white bg-black/20'
                          : 'border-black/30 text-black bg-white/40'
                      }`}
                    >
                      Aa
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold leading-tight ${
                          contrastColor === 'white' ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Pratinjau Hasil Bahan Kaos
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          contrastColor === 'white' ? 'text-white/80' : 'text-slate-800'
                        }`}
                      >
                        {isDarkFabric
                          ? 'Warna Gelap (Sablon memerlukan underbase putih)'
                          : 'Warna Terang (Sablon langsung menyala tajam)'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      contrastColor === 'white'
                        ? 'border-white/30 text-white bg-black/30'
                        : 'border-black/30 text-black bg-white/50'
                    }`}
                  >
                    {form.hex_code}
                  </span>
                </div>

                {/* 5. Categorized Presets of Apparel Colors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={12} className="text-primary" />
                      Preset Warna Kain & Kaos Sablon
                    </label>

                    {/* Category Filter Tabs */}
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setPresetTab('all')}
                        className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                          presetTab === 'all'
                            ? 'bg-primary text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Semua
                      </button>
                      {PRESET_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setPresetTab(cat.id)}
                          className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                            presetTab === cat.id
                              ? 'bg-primary text-white'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {cat.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Swatches Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-white/[0.01] rounded-2xl border border-white/5">
                    {displayedPresets.map((preset) => {
                      const isSelected = form.hex_code === preset.hex.toUpperCase();
                      return (
                        <button
                          key={preset.name + preset.hex}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary/20 border-primary shadow-md shadow-primary/20 text-white font-bold'
                              : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-sm"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <div className="truncate text-[11px] leading-tight">
                            <p className="truncate font-medium">{preset.name}</p>
                            <p className="text-[9px] text-zinc-500 font-mono">{preset.hex}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Sort Order & Active Toggle */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 rounded text-primary focus:ring-primary bg-[#0e0712] border-white/20 accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">Warna Aktif</span>
                    </label>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-[#ff60a8] to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Simpan Warna
                      </>
                    )}
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
          onConfirm={handleDelete}
          title="Hapus Master Warna"
          message="Apakah Anda yakin ingin menghapus warna ini? Pastikan warna ini tidak sedang digunakan pada katalog aktif."
          confirmLabel="Ya, Hapus Warna"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
