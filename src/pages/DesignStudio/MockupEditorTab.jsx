import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import DesignUpload from '../../components/design-studio/DesignUpload';
import ShirtRenderer from '../../components/design-studio/ShirtRenderer';
import LayerHandles from '../../components/design-studio/LayerHandles';
import { getImageUrl } from '../../utils/getImageUrl';
import { designService } from '../../services/designService';
import { getUserSession } from '../../utils/userSession';
import { Loader2, Sparkles, FolderOpen, X, RefreshCw } from 'lucide-react';
import { PRINT_SIZES, PRINT_POSITIONS, BODY_CM_W, BODY_CM_H } from '../../constants/printPlacements';

const MAX_DESIGNS = 2;

const getMockupStorageKey = (uid) =>
  uid != null ? `mockup-workspace-u${uid}` : 'mockup-workspace-guest';

function readPersistedMockup(uid) {
  try {
    const data = JSON.parse(localStorage.getItem(getMockupStorageKey(uid))) || null;
    if (data?.layers && Array.isArray(data.layers)) {
      data.layers = data.layers.slice(0, MAX_DESIGNS);
    }
    return data;
  } catch {
    return null;
  }
}


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

export default function MockupEditorTab({ userId, design, selectedColor, setSelectedColor, onDesignChange, onSwitchTab }) {
  const navigate = useNavigate();
  const toast = useToast();
  const savedWorkspace = readPersistedMockup(userId);

  // Seed the editor with per-user saved workspace or design shared from AI Generate
  const [layers, setLayers] = useState(() => {
    if (savedWorkspace?.layers && Array.isArray(savedWorkspace.layers) && savedWorkspace.layers.length > 0) {
      return savedWorkspace.layers.slice(0, MAX_DESIGNS);
    }
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
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [textConfig, setTextConfig] = useState(() => savedWorkspace?.textConfig || { text: '', color: '#ffffff', size: 72 });
  const [printType, setPrintType] = useState(() => savedWorkspace?.printType || 'dtf');
  const [colorCount, setColorCount] = useState(0);
  const selectedModel = 'low_poly';
  const [autoRotate, setAutoRotate] = useState(false);
  const [showDebugZones, setShowDebugZones] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [interactionMode, setInteractionMode] = useState('drag'); // 'drag' | 'orbit'

  // Library modal state for picking from user's AI designs collection
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryDesigns, setLibraryDesigns] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const lastAppliedDesignIdRef = useRef(design?.id || null);

  // Sync selectedColor if savedWorkspace had one
  useEffect(() => {
    if (savedWorkspace?.selectedColor && savedWorkspace.selectedColor !== selectedColor) {
      setSelectedColor?.(savedWorkspace.selectedColor);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist workspace per user
  useEffect(() => {
    const key = getMockupStorageKey(userId);
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          layers,
          selectedColor,
          printType,
          textConfig,
          updated_at: Date.now(),
        })
      );
    } catch {
      /* ignore storage quota */
    }
  }, [userId, layers, selectedColor, printType, textConfig]);

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
  const smartDefaultScale = () => {
    const ff = rendererApiRef.current?.getFrameFactors?.();
    if (!ff) return 0.5;
    const scale = (0.55 * BODY_CM_W * ff.factorX) / ff.spanX;
    return clamp(scale, 0.12, 0.9);
  };

  const addLayer = (rawUrl, opts = {}) => {
    if (layers.length >= MAX_DESIGNS) {
      toast.warning('Maksimal 2 gambar desain (sesuai 2 posisi area cetak pemesanan). Hapus salah satu desain untuk menambahkan yang baru.');
      return;
    }
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
      setLayers((prev) => {
        if (prev.length >= MAX_DESIGNS) return prev;
        return [...prev, layer];
      });
      setSelectedLayerId(layer.id);
      setShowTextPanel(false);
    };
    probe.onload = () => doAdd(probe.naturalWidth && probe.naturalHeight ? probe.naturalWidth / probe.naturalHeight : 1);
    probe.onerror = () => doAdd(1);
    probe.src = image;
  };

  // When a new design is passed from AI Generate tab via "Pakai Desain"
  useEffect(() => {
    if (!design?.imageUrl) return;
    if (design.id && design.id === lastAppliedDesignIdRef.current) return;
    lastAppliedDesignIdRef.current = design.id || Date.now();

    const image = resolveDesignUrl(design.imageUrl);
    if (!image) return;

    // Avoid duplicate if exact image already in layers
    const exists = layers.some((l) => l.image === image);
    if (exists) return;

    if (layers.length >= MAX_DESIGNS) {
      toast.warning('Maksimal 2 gambar desain sudah terpasang. Hapus salah satu layer untuk memasang desain AI baru.');
      return;
    }

    addLayer(image, {
      name: design.prompt ? design.prompt.slice(0, 40) : 'Desain AI',
      source: design.source || 'ai',
    });
  }, [design?.id, design?.imageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const openLibraryModal = async () => {
    if (layers.length >= MAX_DESIGNS) {
      toast.warning('Maksimal 2 gambar desain (sesuai 2 posisi area cetak pemesanan). Hapus salah satu layer terlebih dahulu.');
      return;
    }
    setShowLibraryModal(true);
    setLibraryLoading(true);
    try {
      const res = await designService.list(getUserSession(), null, { page: 1, per_page: 30 });
      const paginator = res.designs;
      const list = Array.isArray(paginator) ? paginator : paginator?.data || [];
      setLibraryDesigns(list);
    } catch {
      toast.error('Gagal memuat koleksi desain.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleSelectLibraryDesign = (d) => {
    if (layers.length >= MAX_DESIGNS) {
      toast.warning('Maksimal 2 gambar desain (sesuai 2 posisi area cetak pemesanan). Hapus salah satu layer terlebih dahulu.');
      setShowLibraryModal(false);
      return;
    }
    const url = getImageUrl(d.image_url);
    addLayer(url, {
      name: d.prompt ? d.prompt.slice(0, 40) : 'Desain AI',
      source: 'ai',
    });
    setShowLibraryModal(false);
    toast.success('Desain dari koleksi berhasil ditambahkan ke kaos!');
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
    if (layers.length >= MAX_DESIGNS) {
      toast.warning('Maksimal 2 gambar desain (sesuai 2 posisi area cetak pemesanan).');
      return;
    }
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${src.name} (salin)`,
    };
    setLayers((prev) => {
      if (prev.length >= MAX_DESIGNS) return prev;
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

  // Apply a preset position (Dada, Punggung, Lengan) with auto-aligning camera angle.
  const applyPositionPreset = (pos) => {
    const targetLayer = selectedLayer || layers[0];
    if (!targetLayer) {
      toast.warning('Tambahkan atau pilih desain terlebih dahulu');
      return;
    }
    if (selectedLayerId !== targetLayer.id) {
      setSelectedLayerId(targetLayer.id);
    }

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

    // Auto rotate 3D camera to face the selected position directly:
    if (pos.id === 'lengan-kiri') {
      spinYRef.current = 90;
    } else if (pos.id === 'lengan-kanan') {
      spinYRef.current = 270;
    } else if (isBack) {
      spinYRef.current = 180;
    } else {
      spinYRef.current = 0;
    }

    updateLayer(targetLayer.id, {
      side: isBack ? 'back' : 'front',
      position_x,
      position_y,
      positionId: pos.id,
    });
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

  // Live on-shirt size in cm + overflow warning for the selected layer.
  const [readout, setReadout] = useState(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
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
    });
    return () => cancelAnimationFrame(id);
  }, [selectedLayer]);

  const handleUploadDesign = (file, url) => {
    if (!file || !url) return;
    if (layers.length >= MAX_DESIGNS) {
      toast.warning('Maksimal 2 gambar desain (sesuai 2 posisi area cetak pemesanan). Hapus salah satu layer terlebih dahulu.');
      return;
    }
    addLayer(url, { name: file.name || 'Desain upload' });
  };

  // Render the text config onto a transparent canvas and add it as a layer.
  const handleAddText = () => {
    if (layers.length >= MAX_DESIGNS) {
      toast.warning('Maksimal 2 gambar desain (sesuai 2 posisi area cetak pemesanan). Hapus salah satu layer terlebih dahulu.');
      return;
    }
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

  // Pointer gestures: clicking a design selects+moves it, clicking shirt moves/spins,
  // clicking outside the shirt deselects and switches to orbit mode (hiding the bounding box).
  const handlePointerDown = (e) => {
    const api = rendererApiRef.current;
    
    // 1. Direct hit on a design quad
    const pick = api?.pickLayer(e.clientX, e.clientY);
    if (pick) {
      setSelectedLayerId(pick.layerId);
      dragRef.current = { mode: 'move', layerId: pick.layerId, startX: e.clientX, startY: e.clientY };
      return;
    }

    // 2. Check if pointer hits the 3D shirt surface
    const uv = api?.pickSurfaceUv(e.clientX, e.clientY);
    if (uv) {
      if (interactionMode === 'drag' && (selectedLayerId || layers.length > 0)) {
        const targetId = selectedLayerId || layers[0]?.id;
        if (targetId) {
          setSelectedLayerId(targetId);
          updateLayer(targetId, {
            position_x: uv.position_x,
            position_y: uv.position_y,
            side: uv.side,
            positionId: undefined,
          });
          dragRef.current = { mode: 'move', layerId: targetId, startX: e.clientX, startY: e.clientY };
          return;
        }
      }
      // If in orbit mode or no layers, drag to spin shirt
      dragRef.current = { mode: 'spin', startX: e.clientX, baseAngle: spinYRef.current };
      return;
    }

    // 3. User clicked OUTSIDE the 3D shirt (empty canvas / background):
    // Switch to orbit mode and deselect the layer (kotak seleksi disappears)
    setInteractionMode('orbit');
    setSelectedLayerId(null);
    dragRef.current = { mode: 'spin', startX: e.clientX, baseAngle: spinYRef.current };
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
      const configKey = userId != null ? `mockup-config-u${userId}` : 'mockup-config-guest';
      localStorage.setItem(configKey, JSON.stringify(config));
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
    try {
      const orderStore = useOrderStore.getState();
      const colorObj = TSHIRT_COLORS.find((c) => c.hex === selectedColor);

      const pos0 = layers[0]?.positionId
        ? layers[0].positionId.replace(/-/g, '_')
        : (layers[0]?.side === 'back' ? 'standar_belakang' : 'standar_depan');

      const newAreas = [
        {
          position: pos0,
          printSize: '28x20',
          customWidth: '',
          customHeight: '',
          design: {
            id: layers[0].id,
            imageUrl: layers[0].image,
            type: 'uploaded',
            isValid: true,
            prompt: layers[0].name || null,
          },
        },
      ];

      if (layers.length > 1) {
        let pos1 = layers[1]?.positionId
          ? layers[1].positionId.replace(/-/g, '_')
          : (layers[1]?.side === 'back' ? 'standar_belakang' : 'standar_depan');
        if (pos1 === pos0) {
          pos1 = pos0.includes('belakang') ? 'standar_depan' : 'standar_belakang';
        }
        newAreas.push({
          position: pos1,
          printSize: '28x20',
          customWidth: '',
          customHeight: '',
          design: {
            id: layers[1].id,
            imageUrl: layers[1].image,
            type: 'uploaded',
            isValid: true,
            prompt: layers[1].name || null,
          },
        });
      }

      useOrderStore.setState({
        printAreas: newAreas,
        config: {
          ...orderStore.config,
          sablonType: printType === 'plastisol' ? 'Plastisol' : 'DTF',
          color: colorObj?.label || 'Putih',
        },
      });
      navigate('/order');
      toast.success('Desain & posisi area berhasil diterapkan ke formulir pemesanan!');
    } catch {
      navigate('/order');
    }
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
    <div className="flex flex-col gap-3.5 min-h-[760px] sm:min-h-[840px] lg:min-h-[880px] lg:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#181120]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl text-white tracking-wide flex items-center gap-2">
            <Icon name="image" size={20} className="text-primary" /> MOCKUP EDITOR 3D
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-0.5">
            Posisikan desain bebas pada kaos 3D interaktif. Putar, atur skala, dan tentukan ukuran sablon DTF/Plastisol.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const open = !(leftOpen || rightOpen);
            setLeftOpen(open);
            setRightOpen(open);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap self-end sm:self-auto ${
            leftOpen || rightOpen
              ? 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-primary/40'
              : 'btn-gradient-primary border-primary font-bold shadow-lg shadow-primary/20'
          }`}
          title="Tampilkan / sembunyikan panel kontrol"
        >
          <Icon name={leftOpen || rightOpen ? 'eye-off' : 'eye'} size={14} />
          {leftOpen || rightOpen ? 'Sembunyikan Panel' : 'Buka Panel Kontrol'}
        </button>
      </div>

      {/* Stage: the 3D viewport fills it, panels float on top */}
      <div className="relative flex-1 overflow-hidden rounded-3xl bg-[#0a060f] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] min-h-[680px] sm:min-h-[760px] lg:min-h-[800px]">
        {/* Background Studio Lighting & Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {/* Radial Studio Dome Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(168,85,247,0.18)_0%,rgba(255,59,137,0.08)_40%,rgba(10,6,15,0.95)_80%,#060309_100%)]" />
          
          {/* Top Beam Cone */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-primary/20 via-purple-600/10 to-transparent blur-3xl opacity-60" />
          
          {/* Left & Right Rim Light Auras */}
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-pink-500/10 blur-3xl rounded-full" />
          <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-600/15 blur-3xl rounded-full" />
          
          {/* 3D Perspective Studio Floor Grid */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[350px] opacity-25"
            style={{
              perspective: '600px',
              transformStyle: 'preserve-3d',
            }}
          >
            <div 
              className="w-full h-full bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_60%,#000_70%,transparent_100%)]"
              style={{
                transform: 'rotateX(65deg)',
                transformOrigin: 'bottom center',
              }}
            />
          </div>

          {/* Direct Shirt Upward Underlight (Cahaya dari Bawah) */}
          <div className="absolute bottom-16 sm:bottom-24 left-1/2 -translate-x-1/2 w-[320px] sm:w-[460px] h-[180px] sm:h-[240px] bg-[radial-gradient(ellipse_at_bottom,rgba(255,59,137,0.38)_0%,rgba(168,85,247,0.20)_45%,transparent_80%)] blur-2xl opacity-95 pointer-events-none" />
          
          {/* Realistic Shirt Contact Drop Shadow (Bayangan di Bawah Kaos) */}
          <div className="absolute bottom-14 sm:bottom-18 left-1/2 -translate-x-1/2 w-[280px] sm:w-[380px] h-[36px] sm:h-[48px] rounded-[100%] bg-black/90 blur-lg shadow-[0_6px_30px_rgba(0,0,0,0.95)] pointer-events-none" />
          <div className="absolute bottom-15 sm:bottom-19 left-1/2 -translate-x-1/2 w-[200px] sm:w-[280px] h-[18px] sm:h-[26px] rounded-[100%] bg-black/95 blur-sm pointer-events-none" />

          {/* Studio Pedestal Ground Concentric Rings */}
          <div className="absolute bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2 w-[440px] sm:w-[600px] h-[85px] sm:h-[120px] rounded-[100%] bg-gradient-to-t from-primary/25 via-purple-600/15 to-transparent blur-2xl opacity-80" />
          <div className="absolute bottom-14 sm:bottom-18 left-1/2 -translate-x-1/2 w-[340px] sm:w-[460px] h-[38px] sm:h-[52px] rounded-[100%] border-2 border-primary/40 bg-gradient-to-t from-primary/10 to-transparent shadow-[0_0_40px_rgba(255,59,137,0.35)]" />
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 w-[240px] sm:w-[340px] h-[22px] sm:h-[32px] rounded-[100%] border border-white/25 bg-black/75 shadow-inner" />
          <div className="absolute bottom-17 sm:bottom-21 left-1/2 -translate-x-1/2 w-[150px] sm:w-[220px] h-[12px] sm:h-[18px] rounded-[100%] bg-primary/40 blur-sm" />
        </div>

        {/* Studio Badge Indicator */}
        <div className="absolute bottom-3.5 left-3.5 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/50 text-[10px] pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-semibold tracking-wider uppercase text-white/70">3D Studio Stage</span>
          <span className="text-white/30">•</span>
          <span>360&deg; Interactive View</span>
        </div>

        {/* LEFT: floating collapsible panel */}
        <div className={`absolute left-2 sm:left-3 top-14 sm:top-16 bottom-14 sm:bottom-16 z-30 rounded-2xl border border-white/15 bg-[#120a1a]/65 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ${leftOpen ? 'w-[270px] sm:w-[290px] flex flex-col' : 'w-10 overflow-hidden bg-black/40 backdrop-blur-md'}`}>
          {leftOpen ? (
            <>
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 shrink-0 bg-white/[0.03]">
                <div className="flex items-center gap-2">
                  <Icon name="layers" size={14} className="text-primary" />
                  <span className="text-primary text-xs font-bold tracking-[1px] uppercase">Alat &amp; Layer</span>
                </div>
                <button type="button" onClick={() => setLeftOpen(false)} className="flex items-center gap-1 text-white/50 hover:text-white text-xs transition-colors p-1">
                  <Icon name="chevron-left" size={14} /> <span className="hidden sm:inline">Tutup</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
                {/* Upload design */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="upload" size={13} className="text-primary" /> Upload File Desain
                    </label>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      layers.length >= MAX_DESIGNS
                        ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                        : 'text-white/40 bg-white/5 border-white/10'
                    }`}>
                      {layers.length}/{MAX_DESIGNS} Desain
                    </span>
                  </div>
                  {layers.length >= MAX_DESIGNS ? (
                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 text-center">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                        <Icon name="alert-triangle" size={16} />
                      </div>
                      <p className="text-amber-300 font-semibold text-xs mb-1">Maksimal 2 Desain Terpasang</p>
                      <p className="text-amber-200/70 text-[11px] leading-relaxed">
                        Sesuai ketentuan pemesanan (maksimal 2 posisi area cetak). Hapus salah satu layer di bawah jika ingin mengganti desain baru.
                      </p>
                    </div>
                  ) : (
                    <DesignUpload onUploadDesign={handleUploadDesign} currentDesign={null} />
                  )}
                </div>

                {/* Koleksi Desain AI */}
                <div>
                  <button
                    type="button"
                    onClick={openLibraryModal}
                    className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 transition-all ${
                      layers.length >= MAX_DESIGNS
                        ? 'bg-white/[0.02] border-white/5 text-white/40 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-primary/50'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-medium">
                      <FolderOpen className={`w-4 h-4 ${layers.length >= MAX_DESIGNS ? 'text-white/30' : 'text-purple-400'}`} /> Buka Koleksi Desain AI
                    </span>
                    {layers.length >= MAX_DESIGNS ? (
                      <span className="text-[10px] text-amber-400/70 font-semibold">(Penuh: 2/2)</span>
                    ) : (
                      <Icon name="chevron-right" size={15} />
                    )}
                  </button>
                </div>

                {/* Add Text */}
                <div>
                  <button
                    onClick={() => {
                      if (layers.length >= MAX_DESIGNS && !showTextPanel) {
                        toast.warning('Maksimal 2 gambar desain (sesuai 2 posisi area cetak pemesanan). Hapus salah satu layer terlebih dahulu.');
                        return;
                      }
                      setShowTextPanel((v) => !v);
                    }}
                    className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 transition-all ${
                      layers.length >= MAX_DESIGNS
                        ? 'bg-white/[0.02] border-white/5 text-white/40 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-primary/50'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-medium">
                      <Icon name="edit" size={15} className={layers.length >= MAX_DESIGNS ? 'text-white/30' : 'text-pink-400'} /> Tambah Layer Teks
                    </span>
                    {layers.length >= MAX_DESIGNS ? (
                      <span className="text-[10px] text-amber-400/70 font-semibold">(Penuh: 2/2)</span>
                    ) : (
                      <Icon name={showTextPanel ? 'chevron-up' : 'chevron-down'} size={15} />
                    )}
                  </button>
                  {showTextPanel && (
                    <div className="mt-2 bg-black/40 border border-white/5 rounded-xl p-3 space-y-3">
                      <input
                        value={textConfig.text}
                        onChange={(e) => setTextConfig((t) => ({ ...t, text: e.target.value }))}
                        placeholder="Tulis teks custom..."
                        className="w-full bg-[#120c16] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-primary transition-colors"
                      />
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={textConfig.color}
                          onChange={(e) => setTextConfig((t) => ({ ...t, color: e.target.value }))}
                          className="w-9 h-8 rounded-lg border border-white/10 bg-[#120c16] cursor-pointer"
                          title="Warna teks"
                        />
                        <input
                          type="range"
                          min={24}
                          max={200}
                          value={textConfig.size}
                          onChange={(e) => setTextConfig((t) => ({ ...t, size: Number(e.target.value) }))}
                          className="flex-1 accent-primary"
                        />
                        <span className="text-white/60 text-[11px] font-mono w-9 text-right">{textConfig.size}px</span>
                      </div>
                      <button
                        onClick={handleAddText}
                        disabled={layers.length >= MAX_DESIGNS}
                        className="btn-gradient-primary w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon name="plus" size={14} /> Pasang Teks di Kaos
                      </button>
                    </div>
                  )}
                </div>

          {/* Layer list */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                Layer Desain ({layers.length}/{MAX_DESIGNS})
              </label>
              <span className="text-[10px] text-white/40 font-mono">Maks. 2 Posisi Area</span>
            </div>
            {layers.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-3">Belum ada layer. Tambahkan desain di atas.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {layers.map((l, i) => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLayerId(l.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                      selectedLayerId === l.id
                        ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <img src={l.image} alt={l.name} className="w-9 h-9 object-contain rounded-lg bg-black/40 border border-white/5 p-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{l.name}</p>
                      <p className="text-white/40 text-[10px]">{l.side === 'back' ? 'Sisi Belakang' : 'Sisi Depan'}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveLayer(l.id, -1); }}
                        disabled={i === 0}
                        className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-20 transition-all rounded hover:bg-white/10"
                        title="Naikkan urutan"
                      >
                        <Icon name="chevron-up" size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 1); }}
                        disabled={i === layers.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-20 transition-all rounded hover:bg-white/10"
                        title="Turunkan urutan"
                      >
                        <Icon name="chevron-down" size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
                        className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-rose-400 transition-all rounded hover:bg-rose-500/10"
                        title="Hapus layer"
                      >
                        <Icon name="trash" size={13} />
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
              className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-12 flex items-center justify-center text-white/60 hover:text-primary transition-colors bg-white/5 hover:bg-white/10"
              title="Buka panel Alat &amp; Layer"
            >
              <Icon name="chevron-right" size={18} />
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-1">
                <Icon name="image" size={28} />
              </div>
              <p className="text-white/60 text-xs sm:text-sm font-medium">Kaos 3D Siap Digunakan</p>
              <p className="text-white/40 text-[11px] max-w-xs">Upload desain, generate dengan AI, atau tambah teks untuk melihat mockup di atas kaos.</p>
            </div>
          )}

          {/* Top Center Viewport Toolbar (Centered, never covered by left or right menus) */}
          <div className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" style={{ zIndex: 25 }}>
            {/* Mode Switcher: Geser Desain (Tangan) vs Putar Kaos 3D */}
            {layers.length > 0 && (
              <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setInteractionMode('drag')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    interactionMode === 'drag'
                      ? 'bg-gradient-to-r from-primary via-[#ff58a0] to-primary text-white shadow-md scale-102'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title="Klik / drag di mana saja pada kaos untuk memindahkan desain langsung"
                >
                  <Icon name="move" size={13} />
                  <span>Mode Geser (Tangan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionMode('orbit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    interactionMode === 'orbit'
                      ? 'bg-gradient-to-r from-primary via-[#ff58a0] to-primary text-white shadow-md scale-102'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title="Drag di atas kanvas untuk memutar sudut pandang kaos 3D"
                >
                  <Icon name="rotate-cw" size={13} />
                  <span>Putar Kaos 3D</span>
                </button>
              </div>
            )}

            {/* View presets + auto rotate + Zoom Controls (+ -) */}
            <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-xl overflow-x-auto max-w-[95vw]">
              {VIEW_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { spinYRef.current = p.angle; }}
                  className="px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
              <div className="w-px h-3.5 bg-white/20 mx-0.5" />
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-all whitespace-nowrap ${
                  autoRotate ? 'bg-primary/20 text-primary border border-primary/30 shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Auto Putar
              </button>
              <div className="w-px h-3.5 bg-white/20 mx-0.5" />
              {/* Zoom Out (-) */}
              <button
                type="button"
                onClick={() => setZoomClamped(zoomRef.current * 0.87)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/15 text-xs font-bold transition-all"
                title="Perkecil Zoom (-)"
              >
                &minus;
              </button>
              {/* Zoom readout & reset */}
              <button
                type="button"
                onClick={() => setZoomClamped(1)}
                className="px-1.5 h-6 flex items-center justify-center rounded-lg text-[10px] font-mono text-primary font-bold hover:bg-white/15 transition-all"
                title="Reset Zoom ke 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              {/* Zoom In (+) */}
              <button
                type="button"
                onClick={() => setZoomClamped(zoomRef.current * 1.15)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/15 text-xs font-bold transition-all"
                title="Perbesar Zoom (+)"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: floating collapsible panel */}
        <div className={`absolute right-2 sm:right-3 top-14 sm:top-16 bottom-14 sm:bottom-16 z-30 rounded-2xl border border-white/15 bg-[#120a1a]/65 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ${rightOpen ? 'w-[280px] sm:w-[310px] flex flex-col' : 'w-10 overflow-hidden bg-black/40 backdrop-blur-md'}`}>
          {rightOpen ? (
            <>
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 shrink-0 bg-white/[0.03]">
                <div className="flex items-center gap-2">
                  <Icon name="sliders" size={14} className="text-primary" />
                  <span className="text-primary text-xs font-bold tracking-[1px] uppercase">Pengaturan Kaos</span>
                </div>
                <button type="button" onClick={() => setRightOpen(false)} className="flex items-center gap-1 text-white/50 hover:text-white text-xs transition-colors p-1">
                  <span className="hidden sm:inline">Tutup</span> <Icon name="chevron-right" size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
                {/* Warna Kaos */}
                <div>
                  <label className="text-white text-xs font-semibold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Icon name="palette" size={13} className="text-primary" /> Warna Bahan Kaos
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {TSHIRT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`relative w-full aspect-square rounded-xl border-2 transition-all duration-200 shadow-sm flex items-center justify-center ${
                          selectedColor === c.hex ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-white/15 hover:border-white/40'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {selectedColor === c.hex && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Icon name="check" size={15} className={c.hex === '#ffffff' ? 'text-black' : 'text-white'} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posisi Area Cetak */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white text-xs font-semibold uppercase tracking-wider block flex items-center gap-1.5">
                      <Icon name="crosshair" size={13} className="text-primary" /> Posisi Area Cetak
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">Preset Cepat</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRINT_POSITIONS.map((pos) => {
                      const isActive = selectedLayer?.positionId === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => applyPositionPreset(pos)}
                          className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all relative overflow-hidden ${
                            isActive
                              ? 'border-primary bg-primary/20 text-white shadow-md shadow-primary/20 scale-[1.02]'
                              : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[11px] font-semibold truncate leading-tight">
                              {pos.label}
                            </span>
                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0 ml-1" />
                            )}
                          </div>
                          <span className="text-[9px] text-white/40 mt-0.5">
                            {pos.id.startsWith('lengan')
                              ? 'Sisi Lengan'
                              : pos.id.includes('belakang') || pos.id.includes('punggung')
                              ? 'Sisi Belakang'
                              : 'Sisi Depan'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jenis Cetak / Sablon */}
                <div>
                  <label className="text-white text-xs font-semibold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Icon name="tag" size={13} className="text-purple-400" /> Jenis Cetak / Sablon
                  </label>
                  <div className="space-y-1.5">
                    {PRINT_TYPES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPrintType(p.id)}
                        className={`w-full text-left rounded-xl p-3 border transition-all ${
                          printType === p.id
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <p className={`text-xs font-semibold ${printType === p.id ? 'text-primary' : 'text-white'}`}>
                          {p.label}
                        </p>
                        <p className="text-white/50 text-[10px] mt-0.5 leading-snug">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                  {printType === 'plastisol' && colorCount > 2 && (
                    <div className="mt-2 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">
                      <Icon name="alert-triangle" size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-amber-300 text-[11px] leading-snug">
                        Terdeteksi ~{colorCount} warna. Plastisol optimal 1-2 warna solid. Disarankan pilih DTF.
                      </p>
                    </div>
                  )}
                </div>

                {/* Layer properties */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white text-xs font-semibold uppercase tracking-wider">Properti Layer</label>
                    {selectedLayer && (
                      <button
                        type="button"
                        onClick={centerOnBody}
                        className="text-[10px] px-2.5 py-1 rounded-lg border border-primary/40 text-primary bg-primary/10 hover:bg-primary hover:text-white transition-all font-semibold"
                      >
                        Tengahkan
                      </button>
                    )}
                  </div>
                  {!selectedLayer ? (
                    <p className="text-white/40 text-[11px] text-center py-2">Klik sebuah layer di atas kaos untuk mengatur posisi &amp; ukuran.</p>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {/* Navigasi Arah D-Pad Cepat */}
                      <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span className="text-[10px] text-white/50 font-medium">Navigasi Geser Cepat</span>
                          <span className="text-[9px] text-primary font-semibold">D-Pad</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 w-28">
                          <div />
                          <button
                            type="button"
                            onClick={() => nudgePosition(0, 0.02)}
                            className="h-7 rounded-lg bg-white/5 hover:bg-primary/25 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95"
                            title="Geser ke Atas"
                          >
                            <Icon name="chevron-up" size={13} />
                          </button>
                          <div />
                          <button
                            type="button"
                            onClick={() => nudgePosition(-0.02, 0)}
                            className="h-7 rounded-lg bg-white/5 hover:bg-primary/25 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95"
                            title="Geser ke Kiri"
                          >
                            <Icon name="chevron-left" size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={centerOnBody}
                            className="h-7 rounded-lg bg-primary/20 hover:bg-primary border border-primary/40 flex items-center justify-center text-primary hover:text-white transition-all text-[10px] font-bold active:scale-95"
                            title="Tengahkan ke Dada"
                          >
                            <Icon name="crosshair" size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgePosition(0.02, 0)}
                            className="h-7 rounded-lg bg-white/5 hover:bg-primary/25 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95"
                            title="Geser ke Kanan"
                          >
                            <Icon name="chevron-right" size={13} />
                          </button>
                          <div />
                          <button
                            type="button"
                            onClick={() => nudgePosition(0, -0.02)}
                            className="h-7 rounded-lg bg-white/5 hover:bg-primary/25 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95"
                            title="Geser ke Bawah"
                          >
                            <Icon name="chevron-down" size={13} />
                          </button>
                          <div />
                        </div>
                      </div>

                      {/* Posisi */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                          <span>Posisi X</span>
                          <span className="font-mono text-white">{Math.round(selectedLayer.position_x * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.005}
                          value={selectedLayer.position_x}
                          onChange={(e) => updateLayer(selectedLayer.id, { position_x: Number(e.target.value), positionId: undefined })}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                          <span>Posisi Y</span>
                          <span className="font-mono text-white">{Math.round(selectedLayer.position_y * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.005}
                          value={selectedLayer.position_y}
                          onChange={(e) => updateLayer(selectedLayer.id, { position_y: Number(e.target.value), positionId: undefined })}
                          className="w-full accent-primary"
                        />
                      </div>

                      {/* Ukuran */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                          <span>Ukuran Dimensi</span>
                          <span className="font-mono text-primary font-semibold">
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
                          className="w-full accent-primary"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                          {PRINT_SIZES.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => applySizePreset(s)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                                readout?.sizeId === s.id
                                  ? 'bg-primary text-white border-primary font-bold'
                                  : 'bg-white/5 text-white/60 border-white/10 hover:border-primary/40'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={autoFit}
                            className="text-[10px] px-2 py-0.5 rounded-md border border-primary/40 text-primary bg-primary/10 hover:bg-primary hover:text-white transition-all font-semibold"
                          >
                            Pas Dada
                          </button>
                        </div>
                      </div>

                      {/* Rotasi & Sisi */}
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                          <span>Rotasi Sudut</span>
                          <span className="font-mono text-white">{Math.round(selectedLayer.rotation)}&deg;</span>
                        </div>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          step={1}
                          value={selectedLayer.rotation}
                          onChange={(e) => updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })}
                          className="w-full accent-primary"
                        />
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          {[{ id: 'front', label: 'Sisi Depan' }, { id: 'back', label: 'Sisi Belakang' }].map((s) => (
                            <button
                              key={s.id}
                              onClick={() => updateLayer(selectedLayer.id, { side: s.id })}
                              className={`text-xs py-1.5 rounded-lg border transition-all font-semibold ${
                                selectedLayer.side === s.id
                                  ? 'btn-gradient-primary text-white border-primary shadow'
                                  : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
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
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRightOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 right-0 w-full h-12 flex items-center justify-center text-white/60 hover:text-primary transition-colors bg-white/5 hover:bg-white/10"
              title="Buka panel Pengaturan"
            >
              <Icon name="chevron-left" size={18} />
            </button>
          )}
        </div>

        {/* Floating bottom action bar (compact & sleek) */}
        <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-[#120a1a]/85 backdrop-blur-2xl p-1 sm:p-1.5 rounded-xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.6)] max-w-[95vw]">
          <button
            type="button"
            onClick={handleSaveDesign}
            className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-primary/50 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
            title="Simpan draft konfigurasi desain"
          >
            <Icon name="save" size={13} className="text-primary/90" />
            <span>Simpan</span>
          </button>

          <button
            type="button"
            onClick={handleContinueOrder}
            className="h-7 sm:h-8 px-3 sm:px-3.5 rounded-lg btn-gradient-primary text-white text-[11px] font-bold tracking-wide uppercase shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
            title="Lanjut ke proses pemesanan sablon"
          >
            <Icon name="send" size={12} />
            <span>Lanjut Pesan ({printTypeLabel})</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-primary/50 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 disabled:opacity-50"
            title="Download preview mockup format PNG"
          >
            {exporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Export...</span>
              </>
            ) : (
              <>
                <Icon name="download" size={13} className="text-purple-400" />
                <span>Export PNG</span>
              </>
            )}
          </button>
        </div>

        {/* Koleksi Desain AI Modal */}
        {showLibraryModal && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setShowLibraryModal(false)}
          >
            <div
              className="w-full max-w-3xl max-h-[85vh] bg-[#181120] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading text-lg text-white tracking-wide">
                    KOLEKSI DESAIN AI SAYA
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openLibraryModal}
                    disabled={libraryLoading}
                    className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-primary transition-colors"
                    title="Segarkan data"
                  >
                    <RefreshCw className={`w-4 h-4 ${libraryLoading ? 'animate-spin text-primary' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowLibraryModal(false)}
                    className="p-2 rounded-xl text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {libraryLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-white/60 text-xs">Memuat koleksi desain kamu...</p>
                  </div>
                ) : libraryDesigns.length === 0 ? (
                  <div className="py-16 text-center max-w-sm mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-white font-semibold text-sm mb-1">Belum ada desain tersimpan</p>
                    <p className="text-white/50 text-xs mb-5">
                      Buat desain pertama kamu dengan AI di tab AI Generate!
                    </p>
                    <button
                      onClick={() => {
                        setShowLibraryModal(false);
                        onSwitchTab?.('ai');
                      }}
                      className="btn-gradient-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20"
                    >
                      Buka AI Generator
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {libraryDesigns.map((d) => {
                      const imgUrl = getImageUrl(d.image_url);
                      return (
                        <div
                          key={d.id}
                          className="group relative bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all flex flex-col hover:shadow-lg"
                        >
                          <div className="aspect-square w-full bg-black/40 flex items-center justify-center overflow-hidden p-2">
                            <img
                              src={imgUrl}
                              alt={d.prompt || 'Desain AI'}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <p className="text-[11px] text-white/60 line-clamp-2 mb-2 leading-relaxed" title={d.prompt}>
                              {d.prompt || 'Desain tanpa prompt'}
                            </p>
                            <button
                              onClick={() => handleSelectLibraryDesign(d)}
                              className="w-full py-2 px-2 btn-gradient-primary font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                            >
                              + Pasang di Kaos
                            </button>
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
      </div>
    </div>
  );
}
