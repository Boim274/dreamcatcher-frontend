import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguageStore } from '../../store/languageStore';
import Icon from '../../components/ui/Icon';
import ShirtRenderer from '../../components/design-studio/ShirtRenderer';
import { getImageUrl } from '../../utils/getImageUrl';
import { PRINT_SIZES, PRINT_POSITIONS } from '../../constants/printPlacements';

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

const getViewPresets = (language) => [
  { label: language === 'en' ? 'Front' : 'Depan', angle: 0 },
  { label: language === 'en' ? 'Left' : 'Kiri', angle: 90 },
  { label: language === 'en' ? 'Back' : 'Belakang', angle: 180 },
  { label: language === 'en' ? 'Right' : 'Kanan', angle: 270 },
];

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function snapAngle(v) {
  const n = Math.round(v / 90) * 90;
  return Math.abs(v - n) <= 5 ? n : v;
}

function resolveDesignUrl(url) {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return getImageUrl(url);
}

// Step 2 stores position values in backend format (underscores, e.g.
// "standar_depan") while the renderer constants use hyphens
// ("standar-depan"). Normalize so lookup always matches.
function normalizePositionId(id) {
  if (!id) return null;
  return String(id).replace(/_/g, '-');
}

// Extract the actual print size in cm as chosen in Step 2. Preset values are
// stored literally as "WxH" (e.g. "20x13"), custom ones as "custom_{W}x{H}" with
// the numeric fields in customWidth/customHeight.
function parseSizeCm(area) {
  const raw = area?.printSize || '';
  if (raw.includes('custom')) {
    const w = parseFloat(area.customWidth);
    const h = parseFloat(area.customHeight);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return { widthCm: w, heightCm: h };
    return null;
  }
  const m = String(raw).match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
  if (m) return { widthCm: parseFloat(m[1]), heightCm: parseFloat(m[2]) };
  return null;
}

function getPositionLabel(printAreas, areaIndex, td) {
  const pos = normalizePositionId(printAreas[areaIndex]?.position);
  const found = pos ? PRINT_POSITIONS.find((p) => p.id === pos) : null;
  return found?.label ? (td ? td(found.label) : found.label) : `Area ${areaIndex + 1}`;
}

function isBackPosition(positionId) {
  return ['standar-belakang', 'punggung-atas'].includes(positionId);
}

function createLayerFromArea(area, areaIndex) {
  const positionId = normalizePositionId(area.position);
  const uv = positionId ? PRINT_POSITIONS.find((p) => p.id === positionId) : null;
  const isBack = isBackPosition(positionId);

  return {
    id: `area-${areaIndex}-${Date.now()}`,
    areaIndex,
    image: area.design?.imageUrl ? resolveDesignUrl(area.design.imageUrl) : null,
    aspect: 1,
    position_x: uv?.uvX || 0.5,
    position_y: uv?.uvY || 0.45,
    scale: 0.5,
    rotation: 0,
    side: isBack ? 'back' : 'front',
    positionId: positionId || (isBack ? 'standar-belakang' : 'standar-depan'),
  };
}

export default function Step4MockupTab({ printAreas, shirtColor, setShirtColor }) {
  const { t, td, language } = useLanguageStore();
  const [layers, setLayers] = useState([]);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [removeBg, setRemoveBg] = useState(false);
  const viewContainerRef = useRef(null);
  const spinYRef = useRef(0);
  const zoomRef = useRef(1);
  const rendererApiRef = useRef(null);
  const dragRef = useRef(null);
  const autoSizedRef = useRef(new Set());

  const areas = printAreas || [];
  const activeLayer = layers[selectedAreaIndex] || null;

  // Init layers from printAreas
  useEffect(() => {
    const newLayers = areas.map((area, i) => {
      const existing = layers[i];
      // Preserve existing layer properties only if both the image and the chosen
      // size match; otherwise re-create so position/scale follow Step 2.
      const existingMatches =
        existing &&
        existing.image === resolveDesignUrl(area.design?.imageUrl) &&
        JSON.stringify(parseSizeCm(area)) === JSON.stringify(existing._sizeCm || null);
      if (existingMatches) return existing;
      return { ...createLayerFromArea(area, i), _sizeCm: parseSizeCm(area) };
    });
    setLayers(newLayers);
  }, [areas.map((a) => a.design?.imageUrl).join(','), areas.map((a) => a.position).join(','), areas.map((a) => a.printSize).join(',')]);

  // Once the renderer is ready (static frame loaded), apply each freshly created
  // layer's scale from the size the customer picked in Step 2 (preset or custom
  // WxH cm). Each layer is sized only once; later manual slider/preset tweaks
  // keep working because the layer id is already tracked.
  useEffect(() => {
    const pending = layers.filter((l) => l.image && !autoSizedRef.current.has(l.id));
    if (pending.length === 0) return undefined;

    let cancelled = false;
    let timer;

    const tryApply = () => {
      const api = rendererApiRef.current;
      const ff = api?.getFrameFactors?.() || null;
      if (!ff) return false;
      setLayers((prev) =>
        prev.map((l) => {
          const area = (printAreas || [])[l.areaIndex];
          const sizeCm = area ? parseSizeCm(area) : null;
          if (!sizeCm || autoSizedRef.current.has(l.id)) return l;
          autoSizedRef.current.add(l.id);
          const scaleX = (sizeCm.widthCm * ff.factorX) / (ff.spanX || 1);
          const scaleY = (sizeCm.heightCm * ff.factorY) / (ff.spanY || 1);
          return { ...l, scale: clamp(Math.min(scaleX, scaleY), 0.05, 1.5) };
        }),
      );
      return true;
    };

    if (tryApply()) return undefined;
    timer = setInterval(() => {
      if (cancelled) return;
      if (tryApply()) clearInterval(timer);
    }, 120);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [layers, printAreas]);

  const updateLayer = useCallback((areaIdx, patch) => {
    setLayers((prev) => prev.map((l, i) => (i === areaIdx ? { ...l, ...patch } : l)));
  }, []);

  const setZoomClamped = (next) => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    setZoom(clamped);
    zoomRef.current = clamped;
  };

  // Wheel = zoom
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

  // Pointer gestures: click design to move, drag empty to rotate
  const handlePointerDown = (e) => {
    const api = rendererApiRef.current;
    const pick = api?.pickLayer(e.clientX, e.clientY);
    if (pick) {
      // Find which area this layer belongs to
      const idx = layers.findIndex((l) => l.id === pick.layerId);
      if (idx >= 0) setSelectedAreaIndex(idx);
      dragRef.current = { mode: 'move', layerId: pick.layerId };
    } else {
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
        updateLayer(selectedAreaIndex, {
          position_x: uv.position_x,
          position_y: uv.position_y,
          side: uv.side,
          positionId: undefined,
        });
      }
    }
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const applyPositionPreset = (pos) => {
    const isBack = isBackPosition(pos.id);
    updateLayer(selectedAreaIndex, {
      position_x: pos.uvX,
      position_y: pos.uvY,
      positionId: pos.id,
      side: isBack ? 'back' : 'front',
    });
  };

  const applySizePreset = (size) => {
    if (!rendererApiRef.current) return;
    const ff = rendererApiRef.current.getFrameFactors();
    if (!ff) return;
    const scaleX = (size.widthCm * ff.factorX) / (ff.spanX || 1);
    const scaleY = (size.heightCm * ff.factorY) / (ff.spanY || 1);
    const newScale = clamp(Math.min(scaleX, scaleY), 0.05, 1.5);
    setLayers((prev) => prev.map((l, i) => (i === selectedAreaIndex ? { ...l, scale: newScale } : l)));
  };

  const autoFit = () => {
    if (!rendererApiRef.current) return;
    const zones = rendererApiRef.current.getZones();
    if (!zones?.front?.body) return;
    const ff = rendererApiRef.current.getFrameFactors();
    if (!ff) return;
    const bodyW = ff.bodyW * 0.8;
    const bodyH = ff.bodyH * 0.8;
    const imgAspect = activeLayer?.aspect || 1;
    let fitW, fitH;
    if (imgAspect > bodyW / bodyH) {
      fitW = bodyW;
      fitH = bodyW / imgAspect;
    } else {
      fitH = bodyH;
      fitW = bodyH * imgAspect;
    }
    const sx = (fitW * ff.factorX) / (ff.spanX || 1);
    const sy = (fitH * ff.factorY) / (ff.spanY || 1);
    updateLayer(selectedAreaIndex, {
      position_x: 0.5,
      position_y: 0.45,
      scale: clamp(Math.min(sx, sy), 0.05, 1.5),
      rotation: 0,
    });
  };

  const nudgePosition = (dx, dy) => {
    updateLayer(selectedAreaIndex, {
      position_x: clamp((activeLayer?.position_x || 0.5) + dx, 0.1, 0.9),
      position_y: clamp((activeLayer?.position_y || 0.45) + dy, 0.1, 0.9),
    });
  };

  const hasDesigns = layers.some((l) => l.image);

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-15rem)] min-h-[640px]">
      {/* Area Tabs above stage */}
      {areas.length > 1 && (
        <div className="flex items-center gap-2">
          {areas.map((area, i) => {
            const hasDesign = !!layers[i]?.image;
            return (
              <button
                key={i}
                onClick={() => setSelectedAreaIndex(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all border-2 ${
                  selectedAreaIndex === i
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-ink text-gray-light hover:border-primary/40'
                }`}
              >
                {hasDesign && <div className="w-2 h-2 rounded-full bg-green-400" />}
                <span>Area {i + 1}</span>
                <span className="text-[10px] opacity-70">({getPositionLabel(areas, i, td)})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Stage: 3D viewport fills it, panels float on top */}
      <div className="relative flex-1 overflow-hidden rounded-xl bg-ink border border-border">
        {/* LEFT: floating collapsible panel */}
        <div className={`absolute left-3 top-3 bottom-3 z-30 rounded-xl border border-ink bg-ink/95 backdrop-blur shadow-xl transition-all duration-200 ${leftOpen ? 'w-[262px] flex flex-col' : 'w-9'}`}>
          {leftOpen ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <span className="text-fire text-[11px] font-medium tracking-[1px] uppercase">
                  {language === 'en' ? 'Tools' : 'Alat'} {areas.length > 1 && `- Area ${selectedAreaIndex + 1}`}
                </span>
                <button type="button" onClick={() => setLeftOpen(false)} className="flex items-center gap-1 text-gray hover:text-white text-[11px] transition-colors">
                  <Icon name="chevron-right" size={12} /> {language === 'en' ? 'Hide' : 'Sembunyikan'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Color Picker */}
                <div>
                  <label className="text-white text-[11px] font-medium tracking-[1px] uppercase mb-2 block">
                    {language === 'en' ? 'T-Shirt Color' : 'Warna Kaos'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TSHIRT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setShirtColor(c.hex)}
                        title={td(c.label)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          shirtColor === c.hex ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-border hover:border-primary/50'
                        } ${c.id === 'white' ? 'ring-1 ring-gray/30' : ''}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {activeLayer?.image ? (
                  <>
                    {/* Position Presets */}
                    <div>
                      <label className="text-white text-[11px] font-medium tracking-[1px] uppercase mb-2 block">
                        {language === 'en' ? 'Quick Position' : 'Posisi Cepat'}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRINT_POSITIONS.map((pos) => (
                          <button
                            key={pos.id}
                            onClick={() => applyPositionPreset(pos)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                              activeLayer.positionId === pos.id
                                ? 'bg-primary/15 text-primary border border-primary'
                                : 'bg-ink border border-border text-gray-light hover:border-primary/40'
                            }`}
                          >
                            {td(pos.label)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Position Nudge */}
                    <div>
                      <label className="text-white text-[11px] font-medium tracking-[1px] uppercase mb-2 block">
                        {language === 'en' ? 'Manual Position' : 'Posisi Manual'}
                      </label>
                      <div className="grid grid-cols-3 gap-1 mb-2">
                        <div />
                        <button onClick={() => nudgePosition(0, 0.02)} className="p-1.5 rounded bg-ink border border-border text-gray hover:text-white hover:border-primary/40"><Icon name="chevron-up" size={14} /></button>
                        <div />
                        <button onClick={() => nudgePosition(-0.02, 0)} className="p-1.5 rounded bg-ink border border-border text-gray hover:text-white hover:border-primary/40"><Icon name="chevron-left" size={14} /></button>
                        <button onClick={() => updateLayer(selectedAreaIndex, { position_x: 0.5, position_y: 0.45 })} className="p-1.5 rounded bg-ink border border-border text-gray hover:text-white hover:border-primary/40 text-[10px]">⟲</button>
                        <button onClick={() => nudgePosition(0.02, 0)} className="p-1.5 rounded bg-ink border border-border text-gray hover:text-white hover:border-primary/40"><Icon name="chevron-right" size={14} /></button>
                        <div />
                        <button onClick={() => nudgePosition(0, -0.02)} className="p-1.5 rounded bg-ink border border-border text-gray hover:text-white hover:border-primary/40"><Icon name="chevron-down" size={14} /></button>
                        <div />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-gray text-[10px] w-6">X</label>
                          <input type="range" min="0.1" max="0.9" step="0.005" value={activeLayer?.position_x || 0.5}
                            onChange={(e) => updateLayer(selectedAreaIndex, { position_x: parseFloat(e.target.value) })}
                            className="flex-1 accent-primary h-1" />
                          <span className="text-gray text-[10px] w-10 text-right">{(activeLayer?.position_x || 0.5).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-gray text-[10px] w-6">Y</label>
                          <input type="range" min="0.1" max="0.9" step="0.005" value={activeLayer?.position_y || 0.45}
                            onChange={(e) => updateLayer(selectedAreaIndex, { position_y: parseFloat(e.target.value) })}
                            className="flex-1 accent-primary h-1" />
                          <span className="text-gray text-[10px] w-10 text-right">{(activeLayer?.position_y || 0.45).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scale */}
                    <div>
                      <label className="text-white text-[11px] font-medium tracking-[1px] uppercase mb-2 block">
                        {language === 'en' ? 'Size' : 'Ukuran'}
                      </label>
                      <input type="range" min="0.05" max="1.5" step="0.005" value={activeLayer?.scale || 0.5}
                        onChange={(e) => updateLayer(selectedAreaIndex, { scale: parseFloat(e.target.value) })}
                        className="w-full accent-primary h-1 mb-2" />
                      <div className="flex flex-wrap gap-1 mb-2">
                        {PRINT_SIZES.map((sz) => (
                          <button key={sz.id} onClick={() => applySizePreset(sz)}
                            className="px-2 py-1 rounded text-[10px] bg-ink border border-border text-gray-light hover:border-primary/40 transition-colors">
                            {td(sz.label)}
                          </button>
                        ))}
                      </div>
                      <button onClick={autoFit} className="w-full py-1.5 rounded-lg border border-dashed border-primary/30 text-primary text-[11px] hover:bg-primary/10 transition-colors">
                        Auto Fit
                      </button>
                    </div>

                    {/* Rotation */}
                    <div>
                      <label className="text-white text-[11px] font-medium tracking-[1px] uppercase mb-2 block">
                        {language === 'en' ? 'Rotation' : 'Rotasi'}
                      </label>
                      <input type="range" min="-180" max="180" step="1" value={activeLayer?.rotation || 0}
                        onChange={(e) => updateLayer(selectedAreaIndex, { rotation: parseFloat(e.target.value) })}
                        className="w-full accent-primary h-1 mb-2" />
                      <div className="flex gap-1">
                        <button onClick={() => updateLayer(selectedAreaIndex, { rotation: snapAngle((activeLayer?.rotation || 0) - 15) })}
                          className="flex-1 py-1 rounded bg-ink border border-border text-gray text-[10px] hover:text-white hover:border-primary/40">-15°</button>
                        <button onClick={() => updateLayer(selectedAreaIndex, { rotation: 0 })}
                          className="flex-1 py-1 rounded bg-ink border border-border text-gray text-[10px] hover:text-white hover:border-primary/40">Reset</button>
                        <button onClick={() => updateLayer(selectedAreaIndex, { rotation: snapAngle((activeLayer?.rotation || 0) + 15) })}
                          className="flex-1 py-1 rounded bg-ink border border-border text-gray text-[10px] hover:text-white hover:border-primary/40">+15°</button>
                      </div>
                    </div>

                    {/* Remove Background */}
                    <div className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2.5">
                      <div>
                        <label className="text-white text-[11px] font-medium tracking-[1px] uppercase block">
                          {language === 'en' ? 'Remove Background' : 'Hapus Background'}
                        </label>
                        <p className="text-gray text-[10px] mt-0.5">
                          {language === 'en' ? 'Remove white/light background' : 'Hapus background putih/terang'}
                        </p>
                      </div>
                      <button
                        onClick={() => setRemoveBg((v) => !v)}
                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ml-3 ${removeBg ? 'bg-primary' : 'bg-border'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${removeBg ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    {/* Side Toggle */}
                    <div>
                      <label className="text-white text-[11px] font-medium tracking-[1px] uppercase mb-2 block">
                        {language === 'en' ? 'Side' : 'Sisi'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => updateLayer(selectedAreaIndex, { side: 'front' })}
                          className={`py-2 rounded-lg text-[11px] font-medium transition-all border-2 ${
                            activeLayer?.side === 'front' ? 'border-primary bg-primary/15 text-primary' : 'border-border text-gray-light hover:border-primary/40'
                          }`}>
                          {language === 'en' ? 'Front' : 'Depan'}
                        </button>
                        <button onClick={() => updateLayer(selectedAreaIndex, { side: 'back' })}
                          className={`py-2 rounded-lg text-[11px] font-medium transition-all border-2 ${
                            activeLayer?.side === 'back' ? 'border-primary bg-primary/15 text-primary' : 'border-border text-gray-light hover:border-primary/40'
                          }`}>
                          {language === 'en' ? 'Back' : 'Belakang'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Icon name="image" size={32} className="text-gray/40 mx-auto mb-2" />
                    <p className="text-gray text-[12px]">{language === 'en' ? 'No design yet for this area' : 'Belum ada desain untuk area ini'}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setLeftOpen(true)}
              className="w-full h-full flex items-center justify-center text-gray hover:text-white transition-colors"
              title={language === 'en' ? 'Show tools panel' : 'Tampilkan panel alat'}>
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
          {hasDesigns && (
            <ShirtRenderer
              containerRef={viewContainerRef}
              staticMode
              shirtColor={shirtColor}
              designLayers={layers.filter((l) => l.image)}
              selectedLayerId={activeLayer?.id}
              rendererApiRef={rendererApiRef}
              modelSrc="low_poly"
              rotationYRef={spinYRef}
              decalDepthTest
              zoomRef={zoomRef}
              removeBg={removeBg}
            />
          )}

          {/* Instruction tooltip */}
          {hasDesigns && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none text-gray text-[11px] bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 whitespace-nowrap" style={{ zIndex: 20 }}>
              {language === 'en' ? 'Click design to move · drag empty space to rotate shirt' : 'Klik desain untuk geser · geser kosong untuk putar kaos'}
            </div>
          )}

          {/* View presets */}
          <div className="absolute top-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5" style={{ zIndex: 20 }}>
            {getViewPresets(language).map((p) => (
              <button
                key={p.label}
                onClick={() => { spinYRef.current = p.angle; }}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-black/60 border border-white/10 text-gray hover:text-white hover:border-fire/50 transition-all whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="absolute top-3 right-20 flex flex-col items-center gap-1.5" style={{ zIndex: 20 }}>
            <button
              onClick={() => setZoomClamped(zoomRef.current * 1.15)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 border border-white/10 text-gray hover:text-white hover:border-fire/50 transition-all text-[16px] leading-none"
              title={language === 'en' ? 'Zoom in' : 'Perbesar'}
            >
              +
            </button>
            <button
              onClick={() => setZoomClamped(zoomRef.current * 0.87)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 border border-white/10 text-gray hover:text-white hover:border-fire/50 transition-all text-[16px] leading-none"
              title={language === 'en' ? 'Zoom out' : 'Perkecil'}
            >
              &minus;
            </button>
            <button
              onClick={() => setZoomClamped(1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 border border-white/10 text-[10px] font-medium text-gray hover:text-white hover:border-fire/50 transition-all"
              title={language === 'en' ? 'Reset zoom' : 'Reset zoom'}
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>

          {/* Empty state */}
          {!hasDesigns && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <Icon name="image" size={40} className="text-gray/50" />
              <p className="text-gray text-[13px]">{language === 'en' ? 'Choose design from AI Generate or History tab' : 'Pilih desain dari tab AI Generate atau History'}</p>
            </div>
          )}
        </div>

        {/* RIGHT: floating collapsible panel */}
        <div className={`absolute right-3 top-3 bottom-3 z-30 rounded-xl border border-ink bg-ink/95 backdrop-blur shadow-xl transition-all duration-200 ${rightOpen ? 'w-[260px] flex flex-col' : 'w-9'}`}>
          {rightOpen ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <span className="text-fire text-[11px] font-medium tracking-[1px] uppercase">
                  {language === 'en' ? 'Summary' : 'Ringkasan'}
                </span>
                <button type="button" onClick={() => setRightOpen(false)} className="flex items-center gap-1 text-gray hover:text-white text-[11px] transition-colors">
                  {language === 'en' ? 'Hide' : 'Sembunyikan'} <Icon name="chevron-left" size={12} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Design Previews per area */}
                {layers.map((l, i) => (
                  <div key={i} className={`rounded-lg border p-2 ${selectedAreaIndex === i ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-fire text-[10px] font-medium tracking-[1px] uppercase">
                        Area {i + 1}: {getPositionLabel(areas, i, td)}
                      </span>
                      {l.image && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    </div>
                    {l.image ? (
                      <div className="aspect-square rounded overflow-hidden border border-border">
                        <img src={l.image} alt={`Area ${i + 1}`} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="aspect-square rounded border border-dashed border-border flex items-center justify-center">
                        <span className="text-gray text-[10px]">{language === 'en' ? 'Empty' : 'Kosong'}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Active Layer Summary */}
                {activeLayer?.image && (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray">{language === 'en' ? 'Position' : 'Posisi'}</span>
                      <span className="text-white font-medium">{td(PRINT_POSITIONS.find((p) => p.id === activeLayer.positionId)?.label || '-')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray">{language === 'en' ? 'Side' : 'Sisi'}</span>
                      <span className="text-white font-medium">{activeLayer.side === 'back' ? (language === 'en' ? 'Back' : 'Belakang') : (language === 'en' ? 'Front' : 'Depan')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray">{language === 'en' ? 'Scale' : 'Skala'}</span>
                      <span className="text-white font-medium">{((activeLayer.scale || 0.5) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray">{language === 'en' ? 'Rotation' : 'Rotasi'}</span>
                      <span className="text-white font-medium">{activeLayer.rotation || 0}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray">{language === 'en' ? 'Color' : 'Warna'}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: shirtColor }} />
                        <span className="text-white font-medium">{td(TSHIRT_COLORS.find((c) => c.hex === shirtColor)?.label || shirtColor)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-gray text-[11px] leading-relaxed">
                    {language === 'en'
                      ? <>Use arrow buttons or sliders to adjust design placement. Click <strong className="text-primary">Auto Fit</strong> for automatic sizing.</>
                      : <>Geser tombol panah atau slider untuk mengatur posisi desain. Klik <strong className="text-primary">Auto Fit</strong> untuk menyesuaikan ukuran otomatis.</>}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setRightOpen(true)}
              className="w-full h-full flex items-center justify-center text-gray hover:text-white transition-colors"
              title={language === 'en' ? 'Show summary panel' : 'Tampilkan panel ringkasan'}>
              <Icon name="chevron-left" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
