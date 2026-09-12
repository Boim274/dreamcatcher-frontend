import { useState, useEffect, useRef } from 'react';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import DesignUpload from '../../components/design-studio/DesignUpload';
import ShirtRenderer from '../../components/design-studio/ShirtRenderer';
import LayerHandles from '../../components/design-studio/LayerHandles';
import AIGenerateTab from './AIGenerateTab';
import { getImageUrl } from '../../utils/getImageUrl';
import { PRINT_SIZES, PRINT_POSITIONS, BODY_CM_W, BODY_CM_H } from '../../constants/printPlacements';

const TSHIRT_COLORS = [
  { id: 'white', label: 'Putih', hex: '#ffffff' },
  { id: 'black', label: 'Hitam', hex: '#111111' },
  { id: 'navy', label: 'Navy', hex: '#1a2744' },
  { id: 'grey', label: 'Abu', hex: '#555555' },
  { id: 'red', label: 'Merah', hex: '#cc2222' },
  { id: 'army', label: 'Army', hex: '#4a5c3a' },
  { id: 'maroon', label: 'Maroon', hex: '#6b1d1d' },
  { id: 'brown', label: 'Coklat', hex: '#5c3d2e' },
];

const VIEW_PRESETS = [
  { label: 'Depan', angle: 0 },
  { label: 'Kiri', angle: 90 },
  { label: 'Belakang', angle: 180 },
  { label: 'Kanan', angle: 270 },
];

const PRINT_TYPES = [
  { id: 'dtf', label: 'DTF', desc: 'Full color — cocok untuk gradasi & detail tinggi' },
  { id: 'plastisol', label: 'Plastisol', desc: 'Maksimal 2 warna solid, tanpa gradasi' },
];

const LAYER_DEFAULTS = {
  position_x: 0.5,
  position_y: 0.42,
  scale: 0.5,
  rotation: 0,
  stretchX: 1,
  stretchY: 1,
  aspectLocked: true,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Snap angles near multiples of 90° so designs line up straight by default.
function snapAngle(v) {
  const n = Math.round(v / 90) * 90;
  return Math.abs(v - n) <= 5 ? n : v;
}

function resolveDesignUrl(url) {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return getImageUrl(url);
}

// Estimate how many distinct solid colors an image uses (downsampled + color
// quantized). Used to warn when Plastisol is chosen with a busy design.
function analyzeImageColors(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const colors = new Set();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        colors.add(`${r},${g},${b}`);
      }
      resolve(colors.size);
    };
    img.onerror = () => resolve(0);
    img.src = imageUrl;
  });
}

export default function MockupEditorTab({ design, selectedColor, setSelectedColor, onDesignChange }) {
  const toast = useToast();
  // Seed the editor with a design shared from the AI Generate tab (mount time).
  const [layers, setLayers] = useState(() => {
    if (design?.imageUrl) {
      const image = resolveDesignUrl(design.imageUrl);
      if (image) {
        return [{
          id: `${Date.now()}-seed`,
          image,
          name: design.prompt ? design.prompt.slice(0, 40) : 'Desain AI',
          side: 'front',
          ...LAYER_DEFAULTS,
          source: design.source || 'ai',
        }];
      }
    }
    return [];
  });
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [textConfig, setTextConfig] = useState({ text: '', color: '#ffffff', size: 72 });
  const [printType, setPrintType] = useState('dtf');
  const [colorCount, setColorCount] = useState(0);
  const selectedModel = 'low_poly';
  const [autoRotate, setAutoRotate] = useState(false);
  const [showDebugZones, setShowDebugZones] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const viewContainerRef = useRef(null);
  const spinYRef = useRef(0);
  const zoomRef = useRef(1);
  const rendererApiRef = useRef(null);
  const dragRef = useRef(null);

  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 3;

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  // Share the first layer with the rest of the studio (AR Try-On, etc).
  const sharedDesign = layers.length > 0 ? {
    id: layers[0].id,
    imageUrl: layers[0].image,
    source: layers[0].source || 'upload',
    prompt: layers[0].name,
  } : null;
  useEffect(() => {
    if (sharedDesign) onDesignChange?.(sharedDesign);
  }, [sharedDesign?.id, sharedDesign?.imageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Plastisol warning: count colors of the selected design when relevant.
  const selectedImage = selectedLayer?.image || null;
  useEffect(() => {
    if (printType !== 'plastisol' || !selectedImage) return;
    let cancelled = false;
    analyzeImageColors(selectedImage).then((n) => {
      if (!cancelled) setColorCount(n);
    });
    return () => {
      cancelled = true;
    };
  }, [printType, selectedImage]);

  // Default size for a fresh design: fit ~55% of the body width so it never
  // appears giant or tiny on first drop. Falls back to 0.5 while the model loads.
  const smartDefaultScale = (aspect) => {
    const ff = rendererApiRef.current?.getFrameFactors?.();
    if (!ff) return 0.5;
    const scale = (0.55 * BODY_CM_W * ff.factorX) / ff.spanX;
    return clamp(scale, 0.12, 0.9);
  };

  const addLayer = (rawUrl, opts = {}) => {
    const image = resolveDesignUrl(rawUrl);
    if (!image) return;
    const exists = layers.some((l) => l.image === image);
    if (exists) {
      toast.warning('Desain dengan gambar yang sama sudah ada di layer.');
      return;
    }
    const probe = new Image();
    const doAdd = (aspect) => {
      const layer = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        image,
        name: opts.name || 'Desain',
        side: opts.side || 'front',
        ...LAYER_DEFAULTS,
        scale: smartDefaultScale(aspect),
        aspect,
        source: opts.source || 'upload',
      };
      setLayers((prev) => [...prev, layer]);
      setSelectedLayerId(layer.id);
      setShowAiPanel(false);
      setShowTextPanel(false);
    };
    probe.onload = () => doAdd(probe.naturalWidth && probe.naturalHeight ? probe.naturalWidth / probe.naturalHeight : 1);
    probe.onerror = () => doAdd(1);
    probe.src = image;
  };

  const updateLayer = (id, patch) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLayer = (id) => {
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
      return next;
    });
    setSelectedLayerId((prev) => (prev === id ? null : prev));
  };

  const moveLayer = (id, dir) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const duplicateLayer = (id) => {
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${src.name} (salin)`,
    };
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setSelectedLayerId(copy.id);
  };

  const resetLayer = (id) => {
    updateLayer(id, LAYER_DEFAULTS);
    toast.success('Desain direset ke tengah');
  };

  const flipLayerSide = (id) => {
    const l = layers.find((x) => x.id === id);
    if (!l) return;
    updateLayer(id, { side: l.side === 'back' ? 'front' : 'back' });
  };

  // Convert a desired on-shirt size (cm) into scale + stretchY so the design
  // lands at exactly those printed dimensions (A5/A4/... sheets may stretch).
  const applySizePreset = (size) => {
    if (!selectedLayer) return;
    const ff = rendererApiRef.current?.getFrameFactors?.();
    if (!ff) {
      toast.error('Model 3D belum siap — coba sesaat lagi');
      return;
    }
    const aspect = selectedLayer.aspect || 1;
    const scale = (size.widthCm * ff.factorX) / ff.spanX;
    const hAtStretch1 = (scale * ff.spanX) / aspect;
    const stretchY = clamp(size.heightCm * ff.factorY / hAtStretch1, 0.15, 4);
    updateLayer(selectedLayer.id, { scale, stretchX: 1, stretchY, aspectLocked: false });
    toast.success(`Ukuran ${size.label} diterapkan`);
  };

  // "Pas Otomatis": uniformly fit the design inside ~80% of the front body,
  // undistorted, centered on the chest.
  const autoFit = () => {
    if (!selectedLayer) return;
    const api = rendererApiRef.current;
    const ff = api?.getFrameFactors?.();
    const zones = api?.getZones?.();
    if (!ff) {
      toast.error('Model 3D belum siap — coba sesaat lagi');
      return;
    }
    const body = zones?.front?.body;
    const maxW = (body && body.maxX > body.minX ? body.maxX - body.minX : ff.bodyW) * 0.8;
    const maxH = (body && body.maxY > body.minY ? body.maxY - body.minY : ff.bodyH) * 0.8;
    const aspect = selectedLayer.aspect || 1;
    const scale = clamp(Math.min(maxW / ff.spanX, (maxH * aspect) / ff.spanX), 0.12, 1.4);
    const patch = { scale, stretchX: 1, stretchY: 1, aspectLocked: true };
    if (body) {
      const cx = (body.minX + body.maxX) / 2;
      const cy = (body.minY + body.maxY) / 2;
      patch.position_x = (cx - ff.minX) / ff.spanX;
      patch.position_y = (cy - ff.minY) / ff.spanY;
    }
    updateLayer(selectedLayer.id, patch);
    toast.success('Desain disesuaikan otomatis ke dada kaos');
  };

  // Apply a preset position. Sleeve presets use the calibrated print zone
  // centroid so they land on the actual sleeve instead of the old UV guess.
  const applyPositionPreset = (pos) => {
    if (!selectedLayer) return;
    const api = rendererApiRef.current;
    const zones = api?.getZones?.();
    const ff = api?.getFrameFactors?.();
    let position_x = pos.uvX;
    let position_y = pos.uvY;
    if ((pos.id === 'lengan-kiri' || pos.id === 'lengan-kanan') && zones && ff) {
      const z = zones.front?.[pos.id === 'lengan-kiri' ? 'leftSleeve' : 'rightSleeve'];
      if (z) {
        position_x = (((z.minX + z.maxX) / 2) - ff.minX) / ff.spanX;
        position_y = (((z.minY + z.maxY) / 2) - ff.minY) / ff.spanY;
      }
    }
    const isBack = pos.id === 'standar-belakang' || pos.id === 'punggung-atas';
    updateLayer(selectedLayer.id, {
      side: isBack ? 'back' : 'front',
      position_x,
      position_y,
      positionId: pos.id,
    });
    toast.success(`Posisi ${pos.label} diterapkan`);
  };

  // Center the design on the front body print zone.
  const centerOnBody = () => {
    if (!selectedLayer) return;
    const api = rendererApiRef.current;
    const zones = api?.getZones?.();
    const ff = api?.getFrameFactors?.();
    const body = zones?.front?.body;
    if (!zones || !ff || !body) return;
    const cx = (body.minX + body.maxX) / 2;
    const cy = (body.minY + body.maxY) / 2;
    updateLayer(selectedLayer.id, {
      position_x: (cx - ff.minX) / ff.spanX,
      position_y: (cy - ff.minY) / ff.spanY,
      positionId: undefined,
    });
    toast.success('Desain ditengahkan ke dada');
  };

  const rotateBy = (deg) => {
    if (!selectedLayer) return;
    let next = (snapAngle(selectedLayer.rotation + deg) + 360) % 360;
    if (next > 180) next -= 360;
    updateLayer(selectedLayer.id, { rotation: next });
  };

  // Nudge the selected design by a small step, clearing any quick-position preset
  // so its highlight disappears once the user moves it freely.
  const nudgePosition = (dx, dy) => {
    if (!selectedLayer) return;
    updateLayer(selectedLayer.id, {
      position_x: clamp(selectedLayer.position_x + dx, 0, 1),
      position_y: clamp(selectedLayer.position_y + dy, 0, 1),
      positionId: undefined,
    });
  };

  const setRotationExact = (deg) => {
    if (!selectedLayer) return;
    updateLayer(selectedLayer.id, { rotation: clamp(deg, -180, 180) });
  };

  // Live on-shirt size in cm + overflow warning for the selected layer.
  const [readout, setReadout] = useState(null);
  useEffect(() => {
    if (!selectedLayer) {
      setReadout(null);
      return;
    }
    const ff = rendererApiRef.current?.getFrameFactors?.();
    if (!ff) {
      setReadout(null);
      return;
    }
    const aspect = selectedLayer.aspect || 1;
    const widthCan = selectedLayer.scale * (selectedLayer.stretchX || 1) * ff.spanX;
    const heightCan = (widthCan / aspect) * (selectedLayer.stretchY || 1);
    const widthCm = widthCan / ff.factorX;
    const heightCm = heightCan / ff.factorY;
    let sizeId = null;
    for (const s of PRINT_SIZES) {
      if (Math.abs(widthCm - s.widthCm) < 1.5) {
        sizeId = s.id;
        break;
      }
    }
    setReadout({
      widthCm,
      heightCm,
      sizeId,
      overflow: widthCm > BODY_CM_W * 0.98 || heightCm > BODY_CM_H * 0.98,
    });
  }, [selectedLayer]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploadDesign = (file, url) => {
    if (!file || !url) return;
    addLayer(url, { name: file.name || 'Desain upload' });
  };

  const handleGenerateDesign = (result) => {
    if (!result) return;
    addLayer(result.imageUrl, {
      name: result.prompt ? result.prompt.slice(0, 40) : 'Desain AI',
      source: 'ai',
    });
  };

  // Render the text config onto a transparent canvas and add it as a layer.
  const handleAddText = () => {
    const text = textConfig.text.trim();
    if (!text) {
      toast.error('Tulis teks terlebih dahulu');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let fontSize = textConfig.size;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const maxW = canvas.width - 60;
    const measured = ctx.measureText(text).width;
    if (measured > maxW) {
      fontSize = Math.floor((fontSize * maxW) / measured);
      ctx.font = `bold ${fontSize}px sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textConfig.color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
    addLayer(canvas.toDataURL('image/png'), { name: text.slice(0, 30), source: 'text' });
  };

  const setZoomClamped = (next) => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    setZoom(clamped);
    zoomRef.current = clamped;
  };

  // Auto-rotate: slowly spin the shirt around its vertical axis while enabled.
  useEffect(() => {
    if (!autoRotate) return;
    let id;
    const tick = () => {
      spinYRef.current = (spinYRef.current + 0.6) % 360;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [autoRotate]);

  // Press 'z' to toggle the print-zone debug overlay (calibration helper).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.target instanceof HTMLInputElement) || (e.target instanceof HTMLTextAreaElement)) return;
      if (e.key === 'z' || e.key === 'Z') setShowDebugZones((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Wheel = zoom the 3D model in/out without scrolling the page.
  useEffect(() => {
    const el = viewContainerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setZoomClamped(zoomRef.current * (e.deltaY > 0 ? 0.92 : 1.08));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Pointer gestures: clicking a design selects+moves it, dragging empty space
  // rotates the shirt.
  const handlePointerDown = (e) => {
    const api = rendererApiRef.current;
    const pick = api?.pickLayer(e.clientX, e.clientY);
    if (pick) {
      setSelectedLayerId(pick.layerId);
      dragRef.current = { mode: 'move', layerId: pick.layerId };
    } else {
      // Klik area kosong → batalkan seleksi (kotak handle hilang) & mulai putar.
      setSelectedLayerId(null);
      dragRef.current = { mode: 'spin', startX: e.clientX, baseAngle: spinYRef.current };
    }
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (d.mode === 'spin') {
      let next = (d.baseAngle + (e.clientX - d.startX) * 0.5) % 360;
      if (next < 0) next += 360;
      spinYRef.current = next;
    } else if (d.mode === 'move') {
      const uv = rendererApiRef.current?.pickSurfaceUv(e.clientX, e.clientY);
      if (uv) {
        updateLayer(d.layerId, {
          position_x: uv.position_x,
          position_y: uv.position_y,
          side: uv.side,
          positionId: undefined,
        });
      }
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const buildConfig = () => ({
    shirt_model: selectedModel,
    shirt_color: selectedColor,
    print_type: printType,
    designs: layers.map((l) => ({
      image: l.image,
      name: l.name,
      side: l.side,
      position_x: l.position_x,
      position_y: l.position_y,
      scale: l.scale,
      rotation: l.rotation,
    })),
    created_at: new Date().toISOString(),
  });

  const handleSaveDesign = () => {
    if (layers.length === 0) {
      toast.error('Tambahkan minimal satu desain terlebih dahulu');
      return;
    }
    const config = buildConfig();
    try {
      localStorage.setItem('mockup-config-last', JSON.stringify(config));
    } catch {
      /* storage may be unavailable; download still works */
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mockup-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Konfigurasi desain tersimpan!');
  };

  const handleContinueOrder = () => {
    if (layers.length === 0) {
      toast.error('Tambahkan minimal satu desain terlebih dahulu');
      return;
    }
    toast.success('Lanjut ke pemesanan (placeholder)');
  };

  const handleExport = async () => {
    const cvs = viewContainerRef.current?.querySelector('canvas');
    if (!cvs) return;
    setExporting(true);
    try {
      const out = document.createElement('canvas');
      out.width = cvs.width * 2;
      out.height = cvs.height * 2;
      const ctx = out.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(cvs, 0, 0, out.width, out.height);
      const dataUrl = out.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `mockup-3d-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Mockup 3D berhasil diunduh!');
    } catch {
      toast.error('Gagal export mockup 3D');
    } finally {
      setExporting(false);
    }
  };

  const printTypeLabel = PRINT_TYPES.find((p) => p.id === printType)?.label || printType;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-15rem)] min-h-[640px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-[24px] text-white tracking-[1px]">MOCKUP EDITOR 3D</h2>
          <p className="text-gray text-[13px] mt-1">Tempatkan desain bebas di atas kaos 3D. Geser desain untuk memindah posisinya, geser area kosong untuk memutar kaos.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const open = !(leftOpen || rightOpen);
            setLeftOpen(open);
            setRightOpen(open);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
            leftOpen || rightOpen
              ? 'bg-ink border-border text-gray hover:text-white hover:border-fire/50'
              : 'bg-fire text-ink border-fire font-bold'
          }`}
          title="Tampilkan / sembunyikan semua panel"
        >
          <Icon name={leftOpen || rightOpen ? 'eye-off' : 'eye'} size={14} />
          {leftOpen || rightOpen ? 'Sembunyikan Panel' : 'Tampilkan Panel'}
        </button>
      </div>

      {/* Stage: the 3D viewport fills it, panels float on top */}
      <div className="relative flex-1 overflow-hidden rounded-xl bg-ink border border-border">
        {/* LEFT: floating collapsible panel */}
        <div className={`absolute left-3 top-16 bottom-16 z-30 rounded-xl border border-ink bg-ink/95 backdrop-blur shadow-xl transition-all duration-200 ${leftOpen ? 'w-[262px] flex flex-col' : 'w-9'}`}>
          {leftOpen ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <span className="text-fire text-[11px] font-medium tracking-[1px] uppercase">Alat &amp; Layer</span>
<button type="button" onClick={() => setLeftOpen(false)} className="flex items-center gap-1 text-gray hover:text-white text-[11px] transition-colors">
                  <Icon name="chevron-right" size={12} /> Sembunyikan
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-5">
                {/* Upload design */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Upload Desain</label>
            <DesignUpload onUploadDesign={handleUploadDesign} currentDesign={null} />
          </div>

          {/* AI Generate */}
          <div>
            <button
              onClick={() => setShowAiPanel((v) => !v)}
              className="w-full flex items-center justify-between bg-ink border border-border rounded-lg px-4 py-3 text-gray hover:text-white hover:border-fire/50 transition-all"
            >
              <span className="flex items-center gap-2 text-[13px] font-medium">
                <Icon name="zap" size={16} /> Generate Desain AI
              </span>
              <Icon name={showAiPanel ? 'chevron-up' : 'chevron-down'} size={16} />
            </button>
            {showAiPanel && (
              <div className="mt-2">
                <AIGenerateTab onGenerateDesign={handleGenerateDesign} nextLabel="Gunakan Desain" />
              </div>
            )}
          </div>

          {/* Add Text */}
          <div>
            <button
              onClick={() => setShowTextPanel((v) => !v)}
              className="w-full flex items-center justify-between bg-ink border border-border rounded-lg px-4 py-3 text-gray hover:text-white hover:border-fire/50 transition-all"
            >
              <span className="flex items-center gap-2 text-[13px] font-medium">
                <Icon name="edit" size={16} /> Tambah Teks
              </span>
              <Icon name={showTextPanel ? 'chevron-up' : 'chevron-down'} size={16} />
            </button>
            {showTextPanel && (
              <div className="mt-2 bg-ink border border-border rounded-xl p-3 space-y-3">
                <input
                  value={textConfig.text}
                  onChange={(e) => setTextConfig((t) => ({ ...t, text: e.target.value }))}
                  placeholder="Tulis teks di sini..."
                  className="w-full bg-dark border border-border rounded-lg px-3 py-2 text-white text-[13px] outline-none focus:border-fire"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={textConfig.color}
                    onChange={(e) => setTextConfig((t) => ({ ...t, color: e.target.value }))}
                    className="w-10 h-9 rounded-lg border border-border bg-dark cursor-pointer"
                    title="Warna teks"
                  />
                  <input
                    type="range"
                    min={24}
                    max={200}
                    value={textConfig.size}
                    onChange={(e) => setTextConfig((t) => ({ ...t, size: Number(e.target.value) }))}
                    className="flex-1 accent-fire"
                  />
                  <span className="text-gray text-[11px] w-8 text-right">{textConfig.size}px</span>
                </div>
                <button
                  onClick={handleAddText}
                  className="w-full flex items-center justify-center gap-1.5 bg-fire text-ink font-bold py-2 rounded-lg hover:bg-yellow-400 transition-colors text-[12px]"
                >
                  <Icon name="plus" size={14} /> Tambah Layer Teks
                </button>
              </div>
            )}
          </div>

          {/* Layer list */}
          <div className="bg-ink border border-border rounded-xl p-4">
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Layer Desain</label>
            {layers.length === 0 ? (
              <p className="text-gray text-[11px] text-center py-3">Belum ada layer. Tambahkan desain di atas.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {layers.map((l, i) => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLayerId(l.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                      selectedLayerId === l.id
                        ? 'border-fire bg-fire/10'
                        : 'border-border hover:border-gray'
                    }`}
                  >
                    <img src={l.image} alt={l.name} className="w-9 h-9 object-cover rounded-md bg-dark" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[12px] font-medium truncate">{l.name}</p>
                      <p className="text-gray text-[10px]">{l.side === 'back' ? 'Belakang' : 'Depan'}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveLayer(l.id, -1); }}
                        disabled={i === 0}
                        className="w-6 h-6 flex items-center justify-center text-gray hover:text-white disabled:opacity-30 transition-all"
                        title="Naik"
                      >
                        <Icon name="chevron-up" size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 1); }}
                        disabled={i === layers.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-gray hover:text-white disabled:opacity-30 transition-all"
                        title="Turun"
                      >
                        <Icon name="chevron-down" size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
                        className="w-6 h-6 flex items-center justify-center text-gray hover:text-red-400 transition-all"
                        title="Hapus layer"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setLeftOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 left-0 flex items-center justify-center text-gray hover:text-fire transition-colors"
              title="Tampilkan panel Alat &amp; Layer"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          )}
        </div>

        {/* CENTER: 3D viewport fills the stage */}
        <div
          ref={viewContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 z-0 select-none touch-none cursor-grab active:cursor-grabbing"
        >
          <ShirtRenderer
            containerRef={viewContainerRef}
            staticMode
            shirtColor={selectedColor}
            designLayers={layers}
            selectedLayerId={selectedLayerId}
            rendererApiRef={rendererApiRef}
            modelSrc={selectedModel}
            rotationYRef={spinYRef}
            decalDepthTest
            zoomRef={zoomRef}
            debugZones={showDebugZones}
          />

          <LayerHandles
            rendererApiRef={rendererApiRef}
            layer={selectedLayer}
            onPatch={updateLayer}
            onDuplicate={duplicateLayer}
            onFlip={flipLayerSide}
            onDelete={removeLayer}
            onReset={resetLayer}
          />

          {showDebugZones && (
            <button
              type="button"
              onClick={() => setShowDebugZones(false)}
              className="absolute bottom-2 right-2 z-20 text-[10px] px-2 py-1 rounded bg-amber-400/90 text-ink font-semibold"
            >
              Zona: AKTIF
            </button>
          )}

          {layers.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <Icon name="image" size={40} className="text-gray/50" />
              <p className="text-gray text-[13px]">Upload, generate, atau tambah teks untuk menambah layer</p>
            </div>
          )}

          {layers.length > 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none text-gray text-[11px] bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 whitespace-nowrap" style={{ zIndex: 20 }}>
              Klik desain untuk pilih &amp; geser &middot; geser kosong untuk putar
            </div>
          )}

          {/* View presets + auto rotate */}
          <div className="absolute top-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5" style={{ zIndex: 20 }}>
            {VIEW_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { spinYRef.current = p.angle; }}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-black/60 border border-white/10 text-gray hover:text-white hover:border-fire/50 transition-all whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setAutoRotate((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all whitespace-nowrap ${
                autoRotate ? 'bg-fire text-ink border-fire font-bold' : 'bg-black/60 border-white/10 text-gray hover:text-white'
              }`}
            >
              Auto Putar
            </button>
          </div>

          {/* Zoom controls */}
          <div className="absolute top-3 right-20 flex flex-col items-center gap-1.5" style={{ zIndex: 20 }}>
            <button
              onClick={() => setZoomClamped(zoomRef.current * 1.15)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 border border-white/10 text-gray hover:text-white hover:border-fire/50 transition-all text-[16px] leading-none"
              title="Perbesar"
            >
              +
            </button>
            <button
              onClick={() => setZoomClamped(zoomRef.current * 0.87)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 border border-white/10 text-gray hover:text-white hover:border-fire/50 transition-all text-[16px] leading-none"
              title="Perkecil"
            >
              &minus;
            </button>
            <button
              onClick={() => setZoomClamped(1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 border border-white/10 text-[10px] font-medium text-gray hover:text-white hover:border-fire/50 transition-all"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>
        </div>

        {/* RIGHT: floating collapsible panel */}
        <div className={`absolute right-3 top-16 bottom-16 z-30 rounded-xl border border-ink bg-ink/95 backdrop-blur shadow-xl transition-all duration-200 ${rightOpen ? 'w-[300px] flex flex-col' : 'w-9'}`}>
          {rightOpen ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <span className="text-fire text-[11px] font-medium tracking-[1px] uppercase">Properti Layer</span>
<button type="button" onClick={() => setRightOpen(false)} className="flex items-center gap-1 text-gray hover:text-white text-[11px] transition-colors">
                  <Icon name="chevron-left" size={12} /> Sembunyikan
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Layer properties */}
          <div className="bg-ink border border-border rounded-xl p-4">
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Properti Layer</label>
            {!selectedLayer ? (
              <p className="text-gray text-[11px] text-center py-3">Pilih sebuah layer untuk mengatur posisi, ukuran, dan rotasi.</p>
            ) : (
              <div className="space-y-4">
                {/* ---- POSISI ---- */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray text-[10px] font-semibold uppercase tracking-wide">Posisi</label>
                    <button
                      type="button"
                      onClick={centerOnBody}
                      className="text-[10px] px-2 py-0.5 rounded border border-fire/60 text-fire hover:bg-fire/10 transition-all"
                    >
                      Tengahkan
                    </button>
                  </div>
                  <p className="text-[9px] text-gray/70 mb-2 leading-tight">Seret desain langsung di kaos, atau geser dengan tombol / slider di bawah.</p>
                  <div className="grid grid-cols-3 gap-1 mb-2" style={{ width: 108 }}>
                    <span />
                    <button
                      type="button"
                      aria-label="Geser ke atas"
                      onClick={() => nudgePosition(0, 0.04)}
                      className="h-7 flex items-center justify-center rounded border border-border bg-dark text-gray hover:border-fire/60 hover:text-white transition-all text-sm"
                    >↑</button>
                    <span />
                    <button
                      type="button"
                      aria-label="Geser ke kiri"
                      onClick={() => nudgePosition(-0.04, 0)}
                      className="h-7 flex items-center justify-center rounded border border-border bg-dark text-gray hover:border-fire/60 hover:text-white transition-all text-sm"
                    >←</button>
                    <span className="flex items-center justify-center text-gray/50 text-[10px]">±3%</span>
                    <button
                      type="button"
                      aria-label="Geser ke kanan"
                      onClick={() => nudgePosition(0.04, 0)}
                      className="h-7 flex items-center justify-center rounded border border-border bg-dark text-gray hover:border-fire/60 hover:text-white transition-all text-sm"
                    >→</button>
                    <span />
                    <button
                      type="button"
                      aria-label="Geser ke bawah"
                      onClick={() => nudgePosition(0, -0.04)}
                      className="h-7 flex items-center justify-center rounded border border-border bg-dark text-gray hover:border-fire/60 hover:text-white transition-all text-sm"
                    >↓</button>
                    <span />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray text-[10px]">Geser kiri ↔ kanan</label>
                    <span className="text-white text-[10px] font-medium">{Math.round(selectedLayer.position_x * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.005}
                    value={selectedLayer.position_x}
                    onChange={(e) => updateLayer(selectedLayer.id, { position_x: Number(e.target.value), positionId: undefined })}
                    className="w-full accent-fire"
                  />
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray text-[10px]">Geser atas ↔ bawah</label>
                    <span className="text-white text-[10px] font-medium">{Math.round(selectedLayer.position_y * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.005}
                    value={selectedLayer.position_y}
                    onChange={(e) => updateLayer(selectedLayer.id, { position_y: Number(e.target.value), positionId: undefined })}
                    className="w-full accent-fire"
                  />
                  <div className="mt-2">
                    <label className="text-gray text-[10px] mb-1 block">Posisi Cepat</label>
                    <div className="flex flex-wrap gap-1">
                      {PRINT_POSITIONS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => applyPositionPreset(p)}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                            selectedLayer.positionId === p.id
                              ? 'bg-fire text-ink border-fire font-bold'
                              : 'bg-dark text-gray border-border hover:border-fire/50'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ---- UKURAN ---- */}
                <div>
                  <label className="text-gray text-[10px] font-semibold uppercase tracking-wide mb-1 block">Ukuran</label>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray text-[10px]">Besar / Kecil</label>
                    <span className="text-white text-[10px] font-medium">
                      {readout ? `${readout.widthCm.toFixed(0)} × ${readout.heightCm.toFixed(0)} cm` : `${Math.round(selectedLayer.scale * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={1.5}
                    step={0.005}
                    value={selectedLayer.scale}
                    onChange={(e) => updateLayer(selectedLayer.id, { scale: Number(e.target.value) })}
                    className="w-full accent-fire"
                  />
                  {readout && (
                    <p className="mt-1 text-[10px] text-gray">
                      Ukuran nyata di kaos: <span className="text-white font-medium">&plusmn;{readout.widthCm.toFixed(0)} cm &times; {readout.heightCm.toFixed(0)} cm</span>
                    </p>
                  )}
                  {readout?.overflow && (
                    <div className="mt-1 flex items-start gap-1.5 bg-yellow-500/10 border border-yellow-500/40 rounded px-2 py-1">
                      <Icon name="alert-triangle" size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                      <p className="text-yellow-400 text-[10px]">Ukuran melebihi area cetak dada — sebagian desain bisa terpotong.</p>
                    </div>
                  )}
                  <div className="mt-2">
                    <label className="text-gray text-[10px] mb-1 block">Ukuran Cepat (cm)</label>
                    <div className="flex flex-wrap gap-1">
                      {PRINT_SIZES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => applySizePreset(s)}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                            readout?.sizeId === s.id
                              ? 'bg-fire text-ink border-fire font-bold'
                              : 'bg-dark text-gray border-border hover:border-fire/50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={autoFit}
                        className="text-[10px] px-2 py-1 rounded-lg border border-fire/60 text-fire hover:bg-fire/10 transition-all"
                      >
                        Pas Otomatis
                      </button>
                    </div>
                    <p className="mt-1 text-[9px] text-gray/70 leading-tight">Jumlahkan cm nyata di atas kaos, atau pakai Pas Otomatis supaya muat di dada tanpa distorsi.</p>
                  </div>
                </div>

                {/* ---- ROTASI ---- */}
                <div>
                  <label className="text-gray text-[10px] font-semibold uppercase tracking-wide mb-1 block">Rotasi</label>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray text-[10px]">Sudut</label>
                    <span className="text-white text-[10px] font-medium">{Math.round(selectedLayer.rotation)}&deg;</span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={selectedLayer.rotation}
                    onChange={(e) => updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })}
                    className="w-full accent-fire"
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => rotateBy(-15)}
                      className="text-[10px] px-2 py-1 rounded-lg border border-border bg-dark text-gray hover:border-fire/60 hover:text-white transition-all"
                    >⟲ Putar kiri</button>
                    <button
                      type="button"
                      onClick={() => rotateBy(15)}
                      className="text-[10px] px-2 py-1 rounded-lg border border-border bg-dark text-gray hover:border-fire/60 hover:text-white transition-all"
                    >Putar kanan ⟳</button>
                    <button
                      type="button"
                      onClick={() => setRotationExact(0)}
                      className="text-[10px] px-2 py-1 rounded-lg border border-fire/60 text-fire hover:bg-fire/10 transition-all"
                    >0°</button>
                    <button
                      type="button"
                      onClick={() => setRotationExact(90)}
                      className="text-[10px] px-2 py-1 rounded-lg border border-fire/60 text-fire hover:bg-fire/10 transition-all"
                    >90°</button>
                  </div>
                </div>

                {/* ---- SISI ---- */}
                <div>
                  <label className="text-gray text-[10px] font-semibold uppercase tracking-wide mb-1 block">Sisi Cetak</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[{ id: 'front', label: 'Depan' }, { id: 'back', label: 'Belakang' }].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => updateLayer(selectedLayer.id, { side: s.id })}
                        className={`text-[11px] px-2 py-1.5 rounded-lg border transition-all ${
                          selectedLayer.side === s.id
                            ? 'bg-fire text-ink border-fire font-bold'
                            : 'bg-dark text-gray border-border hover:border-fire/50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Print type */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Jenis Cetak</label>
            <div className="space-y-2">
              {PRINT_TYPES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPrintType(p.id)}
                  className={`w-full text-left bg-ink border rounded-xl px-4 py-3 transition-all ${
                    printType === p.id ? 'border-fire bg-fire/10' : 'border-border hover:border-gray'
                  }`}
                >
                  <p className={`text-[13px] font-semibold ${printType === p.id ? 'text-white' : 'text-gray'}`}>
                    {p.label}
                  </p>
                  <p className="text-gray text-[11px] mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
            {printType === 'plastisol' && colorCount > 2 && (
              <div className="mt-2 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/40 rounded-lg px-3 py-2">
                <Icon name="alert-triangle" size={16} className="text-yellow-400 mt-0.5" />
                <p className="text-yellow-400 text-[11px]">
                  Desain ini terdeteksi sekitar {colorCount} warna — Plastisol maksimal 2 warna solid. Pertimbangkan DTF atau sederhanakan warna.
                </p>
              </div>
            )}
          </div>

          {/* T-shirt color */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Warna Kaos</label>
            <div className="grid grid-cols-4 gap-2">
              {TSHIRT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.hex)}
                  className={`relative w-full aspect-square rounded-lg border-2 transition-all duration-200 ${
                    selectedColor === c.hex ? 'border-fire scale-110' : 'border-border hover:border-gray'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {selectedColor === c.hex && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Icon name="check" size={16} className={c.hex === '#ffffff' ? 'text-black' : 'text-white'} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRightOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center justify-center text-gray hover:text-fire transition-colors"
              title="Tampilkan panel Properti"
            >
              <Icon name="chevron-left" size={16} />
            </button>
          )}
        </div>

        {/* Floating bottom actions */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex w-[min(560px,calc(100%-1.5rem))] flex-col sm:flex-row gap-2">
          <button
            onClick={handleSaveDesign}
            className="flex-1 flex items-center justify-center gap-2 bg-ink border border-fire text-fire font-bold py-2.5 rounded-xl hover:bg-fire/10 transition-colors text-[12px]"
          >
            <Icon name="save" size={18} /> Simpan Desain
          </button>
          <button
            onClick={handleContinueOrder}
            className="flex-1 flex items-center justify-center gap-2 bg-fire text-ink font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-colors text-[12px]"
          >
            <Icon name="send" size={18} /> Lanjut Order ({printTypeLabel})
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 bg-dark border border-border text-white font-bold py-2.5 rounded-xl hover:border-fire/50 transition-colors disabled:opacity-50 text-[12px]"
          >
            {exporting ? (
              <><div className="w-5 h-5 border-2 border-fire border-t-transparent rounded-full animate-spin" /> Exporting...</>
            ) : (
              <><Icon name="download" size={18} /> Export PNG</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
