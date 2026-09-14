import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLanguageStore } from '../../store/languageStore';
import CameraFeed from '../../components/design-studio/CameraFeed';
import ShirtRenderer from '../../components/design-studio/ShirtRenderer';
import OcclusionLayer from '../../components/design-studio/OcclusionLayer';
import usePoseDetection, { drawPoseLandmarks, drawBodySkeleton } from '../../hooks/usePoseDetection';
import useShirtTracking from '../../hooks/useShirtTracking';
import useHandGesture, { drawHandLandmarks } from '../../hooks/useHandGesture';
import usePeaceGestureCapture, { STATUS_MESSAGES } from '../../hooks/usePeaceGestureCapture';
import { warmupMediaPipe } from '../../utils/mediapipe';
import { getImageUrl } from '../../utils/getImageUrl';
import { PRINT_POSITIONS, PRINT_SIZES } from '../../constants/printPlacements';
import { Camera, Download, RefreshCw, X, Info, HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff, Maximize, Minimize } from 'lucide-react';

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

const getGuideSteps = (language) => [
  { n: 1, text: language === 'en' ? 'Enable camera in the center screen' : 'Aktifkan kamera di tengah layar' },
  { n: 2, text: language === 'en' ? 'Your design is loaded from Design tab' : 'Desainmu terpasang dari tab Desain' },
  { n: 3, text: language === 'en' ? 'Select shirt color (left) to your liking' : 'Pilih warna kaos (kiri) sesuai selera' },
  { n: 4, text: language === 'en' ? 'Adjust overlay size via Calibration (right)' : 'Atur ukuran overlay lewat Kalibrasi (kanan)' },
  { n: 5, text: language === 'en' ? 'Take screenshot or show peace sign ✌️' : 'Ambil screenshot, atau tunjukkan tanda peace ✌️' },
];

// Step 2 stores position values in backend format (underscores, e.g.
// "standar_depan") while the renderer constants use hyphens
// ("standar-depan"). Normalize so the decal lookup always matches.
function normalizePositionId(id) {
  if (!id) return null;
  return String(id).replace(/_/g, '-');
}

// Map a Step 2 print size ("9x9", "20x13", custom_...) to a PRINT_SIZES index,
// matching by the literal WxH cm. Returns null when it cannot be matched.
function printSizeToSizeIdx(printSize) {
  const m = String(printSize || '').match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const w = parseFloat(m[1]);
  const h = parseFloat(m[2]);
  const idx = PRINT_SIZES.findIndex((s) => s.widthCm === w && s.heightCm === h);
  return idx >= 0 ? idx : null;
}

// Resolve the effective size label for a Step 2 print area (preset or custom).
function getSizeLabelForArea(area) {
  const idx = printSizeToSizeIdx(area.printSize);
  if (idx != null) return PRINT_SIZES[idx].label;
  if (area.printSize?.startsWith('custom_')) return 'Custom';
  return area.printSize || 'A5';
}

// Small reusable label with a hover/tap tooltip so first-time users know what
// each control panel is for, without permanently taking up space.
function SectionLabel({ title, hint }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <label className="text-fire text-[11px] font-medium tracking-[1px] uppercase">{title}</label>
      {hint && (
        <span className="group relative inline-flex">
          <Info className="w-3 h-3 text-gray cursor-help" />
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-44 rounded-lg bg-black/90 text-white text-[10px] leading-snug px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {hint}
          </span>
        </span>
      )}
    </div>
  );
}

// Shared style for the floating translucent panels that sit in front of the
// camera feed. A semi-dark, blurred glass so the live video stays visible.
const PANEL_CLS =
  'bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl ' +
  'text-white flex flex-col overflow-hidden';

function PanelHeader({ title, onCollapse, right, language }) {
  return (
    <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 shrink-0">
      <div className="flex items-center gap-1.5">
        <p className="font-heading text-[13px] tracking-[1px] text-white uppercase">{title}</p>
        {right}
      </div>
      <button
        type="button"
        onClick={onCollapse}
        className="flex items-center gap-1 text-gray hover:text-white text-[10px] transition-colors"
        title={language === 'en' ? 'Hide panel' : 'Sembunyikan panel'}
      >
        <ChevronUp className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{language === 'en' ? 'Exit' : 'Keluar'}</span>
      </button>
    </div>
  );
}

export default function Step4ARTab({ design, shirtColor, setShirtColor, printAreas = [], onBack }) {
  const { t, td, language } = useLanguageStore();
  const [cameraActive, setCameraActive] = useState(false);
  const [overlayScale, setOverlayScale] = useState(0.3);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const [debugLandmarks, setDebugLandmarks] = useState(false);
  const [detected, setDetected] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [panelsOpen, setPanelsOpen] = useState(true);
  const [viewMode, setViewMode] = useState('front');
  const [fullscreen, setFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('ar_tryon_guide_dismissed') !== '1';
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const threeContainerRef = useRef(null);
  const screenshotCanvasRef = useRef(null);

  const shirtTexture = design?.imageUrl || (printAreas && printAreas[0]?.design?.imageUrl) || null;

  // Warm up the MediaPipe pose + hand models as soon as this tab mounts so
  // opening the camera later doesn't wait on CDN downloads / GPU init.
  useEffect(() => {
    warmupMediaPipe();
  }, []);

  const resolveDesignUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    return getImageUrl(url);
  };

  const dismissGuide = () => {
    setShowGuide(false);
    window.localStorage.setItem('ar_tryon_guide_dismissed', '1');
  };

  // Map the order's printAreas (store shape: { position, printSize, design })
  // into the ShirtRenderer AR format: { id, positionId, sizeIdx, repeat,
  // imageUrl }. Each area carries its OWN design artwork, so a 2-area order
  // shows 2 prints — one per customer-selected position. Falls back to a
  // default front area (without artwork) so the shirt still renders.
  const rendererAreas = useMemo(() => {
    const configured = (printAreas || [])
      .filter((a) => a.design?.imageUrl || a.position)
      .map((a, i) => {
        const custom = a.printSize?.startsWith('custom_');
        const sizeIdx = printSizeToSizeIdx(a.printSize);
        const area = {
          id: i + 1,
          positionId: normalizePositionId(a.position) || 'standar-depan',
          sizeIdx: sizeIdx != null ? sizeIdx : 2,
          repeat: 1,
          imageUrl: resolveDesignUrl(a.design?.imageUrl),
        };
        if (custom) {
          const w = parseFloat(a.customWidth);
          const h = parseFloat(a.customHeight);
          if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
            area.widthCm = w;
            area.heightCm = h;
          }
        }
        return area;
      });
    if (configured.length > 0) return configured;
    return [{ id: 1, positionId: 'standar-depan', sizeIdx: 2, repeat: 1, imageUrl: null }];
  }, [printAreas]);

  // Pose detection
  const { landmarks, landmarksRef, worldLandmarksRef, segMaskRef, isModelLoaded, detect } = usePoseDetection({
    videoRef,
    canvasRef,
    enabled: cameraActive,
  });

  // Hand gesture detection — peace (✌️) triggers an automatic screenshot.
  const { handRef, isPeaceRef, isModelLoaded: isHandModelLoaded, hasHand, detect: detectHand } = useHandGesture({
    videoRef,
    enabled: cameraActive,
  });

  // Latest screenshot function kept in a ref so the gesture FSM never fires a
  // stale closure over `screenshotCanvas`. Synced in an effect after definition.
  const screenshotFnRef = useRef(null);

  // Auto-capture FSM — exactly one screenshot per gesture.
  const { tick: gestureTick, status: gestureStatus, cooldownLeft } = usePeaceGestureCapture({
    enabled: cameraActive,
    onCapture: () => screenshotFnRef.current?.(),
  });

  // Shirt tracking — computes the filtered body model from per-frame landmarks.
  const getBodyModel = useShirtTracking(landmarksRef, worldLandmarksRef);
  const anchorsRef = useRef(null);

  // Update the body model every frame via rAF
  useEffect(() => {
    if (!cameraActive) { anchorsRef.current = null; return; }
    let id;
    const tick = () => {
      anchorsRef.current = getBodyModel();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [cameraActive, getBodyModel]);

  const handleFrame = useCallback((cvs) => {
    const lm = detect();
    setDetected(!!lm);
    if (debugLandmarks) {
      if (lm) drawPoseLandmarks(cvs, lm);
      drawBodySkeleton(cvs, anchorsRef.current);
    }
    const hl = detectHand();
    if (debugLandmarks && hl) {
      drawHandLandmarks(cvs, handRef.current);
    }
    gestureTick(isPeaceRef.current);
    screenshotCanvasRef.current = cvs;
  }, [detect, debugLandmarks, detectHand, gestureTick, handRef, isPeaceRef]);

  // Keyboard shortcut: L to toggle landmark dots
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'l' || e.key === 'L') {
        if (!e.target.matches('input, textarea, [contenteditable]')) {
          setDebugLandmarks((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleScreenshot = useCallback(() => {
    const screenshotCanvas = screenshotCanvasRef.current;
    if (!screenshotCanvas) return;

    const composite = document.createElement('canvas');
    composite.width = screenshotCanvas.width;
    composite.height = screenshotCanvas.height;
    const ctx = composite.getContext('2d');

    ctx.drawImage(screenshotCanvas, 0, 0);

    const handCanvas = threeContainerRef.current?.querySelector('.pointer-events-none canvas');

    if (handCanvas) {
      try {
        ctx.drawImage(handCanvas, 0, 0, composite.width, composite.height);
      } catch { /* ignore cross-origin readback */ }
    }

    const dataUrl = composite.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ar-tryon-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setScreenshotTaken(true);
    setTimeout(() => setScreenshotTaken(false), 2000);
  }, []);

  // Keep the gesture capture pointed at the latest screenshot implementation.
  useEffect(() => {
    screenshotFnRef.current = handleScreenshot;
  }, [handleScreenshot]);

  const renderCameraStack = () => (
    <>
      <CameraFeed
        onFrame={handleFrame}
        active={cameraActive}
        onActiveChange={setCameraActive}
        videoRef={videoRef}
        canvasRef={canvasRef}
        fill={fullscreen}
      />

      {isModelLoaded && cameraActive && (
        <ShirtRenderer
          anchorsRef={anchorsRef}
          shirtColor={shirtColor}
          containerRef={threeContainerRef}
          texture={null}
          printAreas={rendererAreas}
          manualScale={overlayScale / 0.3}
          viewMode={viewMode}
          modelSrc="low_poly"
        />
      )}

      {isModelLoaded && cameraActive && (
        <OcclusionLayer
          containerRef={threeContainerRef}
          segMaskRef={segMaskRef}
          anchorsRef={anchorsRef}
          cameraCanvasRef={canvasRef}
          active={cameraActive && isModelLoaded}
        />
      )}

      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none" style={{ zIndex: 11 }}>
          <Camera className="w-8 h-8 text-gray/60 mb-2" />
          <p className="text-gray text-[12px]">Aktifkan kamera untuk mulai mencoba desain</p>
        </div>
      )}

      {!isModelLoaded && cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 11 }}>
          <span className="text-gray text-[12px] bg-black/60 px-3 py-1.5 rounded-lg">Memuat model 3D...</span>
        </div>
      )}

      {cameraActive && isHandModelLoaded && (
        <div className={`absolute pointer-events-none flex justify-center ${fullscreen ? 'top-16 left-1/2 -translate-x-1/2' : 'top-3 left-1/2 -translate-x-1/2'}`} style={{ zIndex: 12 }}>
          <span className="bg-black/70 text-white text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap border border-white/10">
            {gestureStatus === 'cooldown'
              ? `Foto diambil! Tunggu ${Math.ceil(cooldownLeft / 1000)}s`
              : STATUS_MESSAGES[gestureStatus]}
          </span>
        </div>
      )}

      {debugLandmarks && cameraActive && (
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg pointer-events-none" style={{ zIndex: 12 }}>
          Model: {isModelLoaded ? '✓' : '⏳'} | Pose: {landmarks ? '✓' : '—'} | Hand: {hasHand ? '✓' : '—'}
        </div>
      )}
    </>
  );

  const renderColorGrid = () => (
    <div className="grid grid-cols-4 gap-2">
      {TSHIRT_COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => setShirtColor(c.hex)}
          className={`relative w-full aspect-square rounded-lg border-2 transition-all duration-200 ${
            shirtColor === c.hex ? 'border-fire scale-110' : 'border-white/20 hover:border-white/60'
          }`}
          style={{ backgroundColor: c.hex }}
          title={c.label}
        >
          {shirtColor === c.hex && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-bold ${c.hex === '#ffffff' ? 'text-black' : 'text-white'}`}>✓</span>
            </span>
          )}
        </button>
      ))}
    </div>
  );

  const renderDesignPreview = () => {
    const areasWithDesign = (printAreas || []).filter((a) => a.design?.imageUrl);
    if (areasWithDesign.length === 0) {
      const src = resolveDesignUrl(shirtTexture);
      return src ? (
        <div>
          <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
            <img src={src} alt="Desain" className="w-full h-full object-contain" />
          </div>
          <p className="text-gray text-[10px] mt-2 text-center">📁 Desain dari tab Desain</p>
        </div>
      ) : (
        <p className="text-gray text-[10px] border border-dashed border-white/20 rounded-lg py-6 text-center">
          Belum ada desain — pilih/tentukan desain dulu di tab Desain
        </p>
      );
    }

    if (areasWithDesign.length === 1) {
      const area = areasWithDesign[0];
      const pos = PRINT_POSITIONS.find((p) => p.id === normalizePositionId(area.position));
      return (
        <div>
          <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
            <img src={resolveDesignUrl(area.design.imageUrl)} alt="Desain" className="w-full h-full object-contain" />
          </div>
          <p className="text-gray text-[10px] mt-2 text-center">{pos?.label || 'Desain'}</p>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-2 gap-2">
          {areasWithDesign.map((area, i) => {
            return (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
                <img src={resolveDesignUrl(area.design.imageUrl)} alt={`Area ${i + 1}`} className="w-full h-full object-contain" />
              </div>
            );
          })}
        </div>
        <p className="text-gray text-[10px] mt-2 text-center">
          {areasWithDesign.map((a, i) => {
            const pos = PRINT_POSITIONS.find((p) => p.id === normalizePositionId(a.position));
            return `${i + 1}. ${pos?.label || 'Desain'}`;
          }).join('  •  ')}
        </p>
      </div>
    );
  };

  const renderAreaReadout = () => (
    <div className="space-y-2">
      {(printAreas || []).length === 0 ? (
        <p className="text-gray text-[10px] border border-dashed border-white/20 rounded-lg py-4 text-center">
          {language === 'en' ? 'No print areas yet — set positions in Design tab' : 'Belum ada area cetak — atur posisi di tab Desain'}
        </p>
      ) : (
        (printAreas || []).map((area, i) => {
          const pos = PRINT_POSITIONS.find((p) => p.id === normalizePositionId(area.position));
          const sizeLabel = getSizeLabelForArea(area);
          return (
            <div key={i} className="flex items-center justify-between gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[11px]">
              <span className="text-white">Area {i + 1}</span>
              <span className="text-gray text-[10px] text-right">{td(pos?.label) || td('Standar Depan')} • {sizeLabel}</span>
            </div>
          );
        })
      )}
    </div>
  );

  // ---------------------------------------------------------------- Fullscreen
  return fullscreen ? (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Full-bleed camera + 3D overlay */}
      <div ref={threeContainerRef} className="absolute inset-0">
        {renderCameraStack()}
      </div>

      {/* Floating translucent menus over the camera */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        {/* Top control bar */}
        <div className="pointer-events-auto flex items-center justify-between gap-3 p-3"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-[20px] text-white tracking-[1px] drop-shadow">AR TRY-ON</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanelsOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-gray hover:text-white hover:border-white/30 transition-colors text-[11px]"
              title={panelsOpen ? (language === 'en' ? 'Hide all menus' : 'Sembunyikan semua menu') : (language === 'en' ? 'Show all menus' : 'Tampilkan semua menu')}
            >
              {panelsOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{panelsOpen ? (language === 'en' ? 'Hide Menu' : 'Sembunyikan Menu') : (language === 'en' ? 'Show Menu' : 'Tampilkan Menu')}</span>
            </button>
            <button
              onClick={() => setShowGuide((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-gray hover:text-fire hover:border-white/30 transition-colors text-[11px]"
              title={language === 'en' ? 'Show/hide guide' : 'Tampilkan/sembunyikan panduan'}
            >
              <HelpCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{language === 'en' ? 'Guide' : 'Panduan'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-gray hover:text-white hover:border-white/30 transition-colors text-[11px]"
              title={language === 'en' ? 'Back to normal view' : 'Kembali ke tampilan normal'}
            >
              <Minimize className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{language === 'en' ? 'Minimize' : 'Kecilkan'}</span>
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fire text-ink font-bold hover:bg-yellow-400 transition-colors text-[11px]"
              title={language === 'en' ? 'Exit AR Try-On' : 'Keluar dari AR Try-On'}
            >
              <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{language === 'en' ? 'Exit' : 'Keluar'}</span>
            </button>
          </div>
        </div>

        {/* Onboarding guide */}
        {showGuide && (
          <div className="pointer-events-auto mx-auto w-full max-w-3xl px-3">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-fire text-[11px] font-bold tracking-[1px] uppercase">{language === 'en' ? 'How to Use' : 'Cara Pakai'}</p>
                <button onClick={dismissGuide} className="text-gray hover:text-white transition-colors" title={language === 'en' ? "Don't show again" : "Jangan tampilkan lagi"}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {getGuideSteps(language).map((s) => (
                  <li key={s.n} className="flex sm:flex-col items-start gap-2 text-gray text-[11px]">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-fire/15 text-fire text-[10px] font-bold flex items-center justify-center">
                      {s.n}
                    </span>
                    <span className="leading-snug">{s.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Left + right panels + bottom action bar */}
        {panelsOpen && (
          <div className="flex-1 relative">
            {leftOpen ? (
              <div className={`pointer-events-auto absolute left-3 top-1 bottom-2 w-[19rem] max-w-[85vw] overflow-y-auto p-3.5 space-y-4 ${PANEL_CLS}`}>
                <PanelHeader title={language === 'en' ? 'Design & Color' : 'Desain & Warna'} onCollapse={() => setLeftOpen(false)} language={language} />
                <div className="space-y-2">
                  <SectionLabel title={language === 'en' ? 'Design' : 'Desain'} hint={language === 'en' ? 'The design you selected in Design tab is auto-placed on the shirt.' : 'Desain yang kamu pilih di tab Desain dipasang otomatis ke kaos.'} />
                  {renderDesignPreview()}
                </div>
                <div className="space-y-2">
                  <SectionLabel title={language === 'en' ? 'Shirt Color' : 'Warna Kaos'} hint={language === 'en' ? 'Choose base shirt color for AR preview.' : 'Pilih warna dasar kaos untuk pratinjau AR.'} />
                  {renderColorGrid()}
                  <p className="text-gray text-[10px] text-center">
                    {td(TSHIRT_COLORS.find((c) => c.hex === shirtColor)?.label) || (language === 'en' ? 'Select color' : 'Pilih warna')}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLeftOpen(true)}
                className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-r-lg px-2.5 py-3 text-gray hover:text-white transition-colors text-[10px]"
                title={language === 'en' ? 'Open design panel' : 'Buka panel desain'}
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
            )}

            {rightOpen ? (
              <div className={`pointer-events-auto absolute right-3 top-3 bottom-1 w-[19rem] max-w-[85vw] overflow-y-auto p-3.5 space-y-4 ${PANEL_CLS}`}>
                <div className="space-y-2.5">
                  <SectionLabel title={language === 'en' ? 'Print Area' : 'Area Cetak'} hint={language === 'en' ? 'Print position & size configured in Design tab.' : 'Posisi & ukuran sablon yang kamu atur di tab Desain.'} />
                  {renderAreaReadout()}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <SectionLabel title={language === 'en' ? 'Calibration' : 'Kalibrasi'} hint={language === 'en' ? 'Adjust shirt overlay scale to your body in camera.' : 'Sesuaikan ukuran overlay kaos ke tubuhmu di kamera.'} />
                      <span className="text-gray text-[10px]">{Math.round(overlayScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.7"
                      step="0.01"
                      value={overlayScale}
                      onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                      className="w-full accent-fire"
                    />
                  </div>
                  <button
                    onClick={() => setViewMode((v) => (v === 'front' ? 'back' : 'front'))}
                    disabled={!cameraActive}
                    className="w-full flex items-center justify-center gap-2 text-[11px] text-gray border border-white/10 rounded-lg py-2.5 hover:text-fire hover:border-fire/50 transition-all disabled:opacity-40"
                  >
                    {viewMode === 'front' ? (language === 'en' ? 'View Back' : 'Lihat Belakang') : (language === 'en' ? 'View Front' : 'Lihat Depan')}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        cameraActive && detected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-gray-600'
                      }`}
                    />
                    <div>
                      <label htmlFor="landmark-toggle" className="text-gray text-[11px] cursor-pointer select-none">
                        {language === 'en' ? 'Show body landmarks' : 'Tampilkan titik tubuh'}
                      </label>
                      {cameraActive && detected && (
                        <p className="text-green-400 text-[10px] leading-none mt-1">{language === 'en' ? 'Body detected' : 'Mendeteksi tubuh'}</p>
                      )}
                      <p className="text-gray-600 text-[9px] leading-none mt-0.5">{language === 'en' ? 'Press' : 'Tekan'} <kbd className="text-gray text-[9px] font-mono bg-black/40 px-1 rounded">L</kbd></p>
                    </div>
                  </div>
                  <button
                    id="landmark-toggle"
                    role="switch"
                    aria-checked={debugLandmarks}
                    onClick={() => setDebugLandmarks((prev) => !prev)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      debugLandmarks ? 'bg-fire' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        debugLandmarks ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={() => setRightOpen(false)}
                  className="flex items-center justify-center gap-1 text-gray hover:text-white text-[10px] transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" /> {language === 'en' ? 'Hide panel' : 'Sembunyikan panel'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRightOpen(true)}
                className="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-l-lg px-2.5 py-3 text-gray hover:text-white transition-colors text-[10px]"
                title={language === 'en' ? 'Open calibration panel' : 'Buka panel kalibrasi'}
              >
                <ChevronDown className="w-4 h-4 -rotate-90" /> <span className="sr-only">{language === 'en' ? 'Calibration' : 'Kalibrasi'}</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom action bar */}
        {panelsOpen && (
          <div className="pointer-events-none flex justify-center p-3"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
            <div className="pointer-events-auto w-full sm:w-auto flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-2.5">
              {cameraActive ? (
                <button
                  onClick={() => setCameraActive(false)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-ink border border-border text-gray px-5 py-3 rounded-lg hover:text-white hover:border-white/40 transition-all text-[13px]"
                >
                  <RefreshCw className="w-4 h-4" /> {language === 'en' ? 'Turn Off Camera' : 'Matikan Kamera'}
                </button>
              ) : (
                <button
                  onClick={() => setCameraActive(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-fire text-ink font-bold px-5 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-[13px]"
                >
                  <Camera className="w-5 h-5" /> {language === 'en' ? 'Turn On Camera' : 'Aktifkan Kamera'}
                </button>
              )}
              <button
                onClick={handleScreenshot}
                disabled={!cameraActive}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 font-bold px-5 py-3 rounded-lg transition-colors text-[13px] disabled:opacity-50 ${
                  screenshotTaken ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'
                }`}
                title={language === 'en' ? 'Or show peace sign ✌️ to camera' : 'Atau tunjukkan tanda peace ✌️ ke kamera'}
              >
                <Download className="w-4 h-4" />
                {screenshotTaken ? (language === 'en' ? 'Saved!' : 'Tersimpan!') : (language === 'en' ? 'Take Screenshot' : 'Ambil Screenshot')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    // ---------------------------------------------------------------- Card view
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading text-[22px] text-white tracking-[1px]">AR TRY-ON</h2>
          <p className="text-gray text-[12px] mt-0.5">{language === 'en' ? 'Try the design directly on your body via camera.' : 'Coba desain di badanmu secara langsung lewat kamera.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fire text-ink font-bold hover:bg-yellow-400 transition-colors text-[11px]"
            title={language === 'en' ? 'View camera in fullscreen mode' : 'Tampilkan kamera dalam mode penuh'}
          >
            <Maximize className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{language === 'en' ? 'Full Camera' : 'Full Kamera'}</span>
          </button>
          <button
            onClick={() => setShowGuide((v) => !v)}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-gray hover:text-fire hover:border-fire/50 transition-colors text-[11px]"
            title={language === 'en' ? 'Show/hide guide' : 'Tampilkan/sembunyikan panduan'}
          >
            <HelpCircle className="w-3.5 h-3.5" /> {language === 'en' ? 'Guide' : 'Panduan'}
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Onboarding guide */}
      {showGuide && (
        <div className="mb-5 bg-ink border border-fire/30 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-fire text-[11px] font-bold tracking-[1px] uppercase">{language === 'en' ? 'How to Use' : 'Cara Pakai'}</p>
            <button onClick={dismissGuide} className="text-gray hover:text-white transition-colors" title={language === 'en' ? "Don't show again" : "Jangan tampilkan lagi"}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {getGuideSteps(language).map((s) => (
              <li key={s.n} className="flex sm:flex-col items-start gap-2 text-gray text-[11px]">
                <span className="shrink-0 w-5 h-5 rounded-full bg-fire/15 text-fire text-[10px] font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <span className="leading-snug">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Main layout: controls left/right, camera centered */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column: what to wear */}
        <div className="lg:col-span-3 order-2 lg:order-1 space-y-4">
          <div className="bg-ink border border-border rounded-xl p-3.5 space-y-2">
            <SectionLabel title={language === 'en' ? 'Design' : 'Desain'} hint={language === 'en' ? 'The design you selected in Design tab is auto-placed on the shirt.' : 'Desain yang kamu pilih di tab Desain dipasang otomatis ke kaos.'} />
            {renderDesignPreview()}
          </div>

          <div className="bg-ink border border-border rounded-xl p-3.5">
            <SectionLabel title={language === 'en' ? 'Shirt Color' : 'Warna Kaos'} hint={language === 'en' ? 'Choose base shirt color for AR preview.' : 'Pilih warna dasar kaos untuk pratinjau AR.'} />
            <div className="grid grid-cols-4 gap-2">
              {TSHIRT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setShirtColor(c.hex)}
                  className={`relative w-full aspect-square rounded-lg border-2 transition-all duration-200 ${
                    shirtColor === c.hex ? 'border-fire scale-110' : 'border-border hover:border-gray'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={td(c.label)}
                >
                  {shirtColor === c.hex && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[10px] font-bold ${c.hex === '#ffffff' ? 'text-black' : 'text-white'}`}>✓</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-gray text-[10px] mt-2 text-center">
              {td(TSHIRT_COLORS.find((c) => c.hex === shirtColor)?.label) || (language === 'en' ? 'Select color' : 'Pilih warna')}
            </p>
          </div>
        </div>

        {/* Center column: camera + primary actions */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-3">
          <div ref={threeContainerRef} className="relative w-full">
            {renderCameraStack()}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {cameraActive ? (
              <button
                onClick={() => setCameraActive(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-ink border border-border text-gray py-3 rounded-xl hover:text-white hover:border-fire/50 transition-all text-[13px]"
              >
                <RefreshCw className="w-4 h-4" /> {language === 'en' ? 'Turn Off Camera' : 'Matikan Kamera'}
              </button>
            ) : (
              <button
                onClick={() => setCameraActive(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-fire text-ink font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors text-[13px]"
              >
                <Camera className="w-5 h-5" /> {language === 'en' ? 'Turn On Camera' : 'Aktifkan Kamera'}
              </button>
            )}
            <button
              onClick={handleScreenshot}
              disabled={!cameraActive}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors text-[13px] disabled:opacity-50 ${
                screenshotTaken ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'
              }`}
              title={language === 'en' ? 'Or show peace sign ✌️ to camera' : 'Atau tunjukkan tanda peace ✌️ ke kamera'}
            >
              <Download className="w-4 h-4" />
              {screenshotTaken ? (language === 'en' ? 'Saved!' : 'Tersimpan!') : (language === 'en' ? 'Take Screenshot' : 'Ambil Screenshot')}
            </button>
          </div>
        </div>

        {/* Right column: fine-tuning */}
        <div className="lg:col-span-3 order-3 space-y-4">
          <div className="bg-ink border border-border rounded-xl p-3.5">
            <SectionLabel title={language === 'en' ? 'Print Area' : 'Area Cetak'} hint={language === 'en' ? 'Print position & size configured in Design tab.' : 'Posisi & ukuran sablon yang kamu atur di tab Desain.'} />
            {renderAreaReadout()}
          </div>

          <div className="bg-ink border border-border rounded-xl p-3.5 space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <SectionLabel title={language === 'en' ? 'Calibration' : 'Kalibrasi'} hint={language === 'en' ? 'Adjust shirt overlay scale to your body in camera.' : 'Sesuaikan ukuran overlay kaos ke tubuhmu di kamera.'} />
                <span className="text-gray text-[10px] -mt-2">{Math.round(overlayScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.01"
                value={overlayScale}
                onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                className="w-full accent-fire"
              />
            </div>
            <button
              onClick={() => setViewMode((v) => (v === 'front' ? 'back' : 'front'))}
              disabled={!cameraActive}
              className="w-full flex items-center justify-center gap-2 text-[11px] text-gray border border-border rounded-xl py-2.5 hover:text-fire hover:border-fire/50 transition-all disabled:opacity-40"
            >
              {viewMode === 'front' ? (language === 'en' ? 'View Back' : 'Lihat Belakang') : (language === 'en' ? 'View Front' : 'Lihat Depan')}
            </button>
          </div>

          <div className="bg-ink border border-border rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  cameraActive && detected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-gray-600'
                }`}
              />
              <div>
                <label htmlFor="landmark-toggle" className="text-gray text-[11px] cursor-pointer select-none">
                  {language === 'en' ? 'Show body landmarks' : 'Tampilkan titik tubuh'}
                </label>
                {cameraActive && detected && (
                  <p className="text-green-400 text-[10px] leading-none mt-1">{language === 'en' ? 'Body detected' : 'Mendeteksi tubuh'}</p>
                )}
                <p className="text-gray-600 text-[9px] leading-none mt-0.5">{language === 'en' ? 'Press' : 'Tekan'} <kbd className="text-gray text-[9px] font-mono bg-dark/50 px-1 rounded">L</kbd></p>
              </div>
            </div>
            <button
              id="landmark-toggle"
              role="switch"
              aria-checked={debugLandmarks}
              onClick={() => setDebugLandmarks((prev) => !prev)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                debugLandmarks ? 'bg-fire' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  debugLandmarks ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl border border-border text-gray text-[12px] font-medium hover:text-white hover:border-fire/50 transition-colors"
          >
            {language === 'en' ? 'Back to 3D Mockup' : 'Kembali ke Mockup 3D'}
          </button>
        </div>
      </div>
    </div>
  );
}