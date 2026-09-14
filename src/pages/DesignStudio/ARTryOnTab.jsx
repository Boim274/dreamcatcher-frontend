import { useState, useCallback, useRef, useEffect } from 'react';
import DesignUpload from '../../components/design-studio/DesignUpload';
import CameraFeed from '../../components/design-studio/CameraFeed';
import ShirtRenderer from '../../components/design-studio/ShirtRenderer';
import OcclusionLayer from '../../components/design-studio/OcclusionLayer';
import PrintAreaConfig from '../../components/design-studio/PrintAreaConfig';
import usePoseDetection, { drawPoseLandmarks, drawBodySkeleton } from '../../hooks/usePoseDetection';
import useShirtTracking from '../../hooks/useShirtTracking';
import useHandGesture, { drawHandLandmarks } from '../../hooks/useHandGesture';
import usePeaceGestureCapture, { STATUS_MESSAGES } from '../../hooks/usePeaceGestureCapture';
import { warmupMediaPipe } from '../../utils/mediapipe';
import AIGenerateTab from './AIGenerateTab';
import { getImageUrl } from '../../utils/getImageUrl';
import { designService } from '../../services/designService';
import { getUserSession } from '../../utils/userSession';
import { Camera, Download, RefreshCw, Sparkles, X, Info, HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff, Maximize, Minimize, FolderOpen, Loader2 } from 'lucide-react';

const getArStorageKey = (uid) =>
  uid != null ? `ar-tryon-u${uid}` : 'ar-tryon-guest';

function readPersistedAr(uid) {
  try {
    return JSON.parse(localStorage.getItem(getArStorageKey(uid))) || null;
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

const GUIDE_STEPS = [
  { n: 1, text: 'Aktifkan kamera di tengah layar' },
  { n: 2, text: 'Upload desainmu (kiri) atau generate dengan AI' },
  { n: 3, text: 'Pilih warna kaos (kiri) sesuai selera' },
  { n: 4, text: 'Atur posisi & ukuran sablon (kanan)' },
  { n: 5, text: 'Ambil screenshot, atau tunjukkan tanda peace ✌️' },
];

// Small reusable label with a hover/tap tooltip so first-time users know what
// each control panel is for, without permanently taking up space.
function SectionLabel({ title, hint }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <label className="text-fire text-[11px] font-semibold tracking-wider uppercase">{title}</label>
      {hint && (
        <span className="group relative inline-flex">
          <Info className="w-3.5 h-3.5 text-gray/70 hover:text-white cursor-help transition-colors" />
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 rounded-xl bg-[#0d0714]/95 border border-white/10 text-white text-[10px] leading-snug px-3 py-2 opacity-0 group-hover:opacity-100 transition-all shadow-xl z-30">
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
  'bg-[#120a1c]/90 backdrop-blur-xl border border-white/10 rounded-2xl ' +
  'text-white flex flex-col overflow-hidden shadow-2xl';

// Panel header row with a collapsible chevron + optional right action.
function PanelHeader({ title, onCollapse, right }) {
  return (
    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 shrink-0">
      <div className="flex items-center gap-1.5">
        <p className="font-heading text-[13px] tracking-wider text-white uppercase">{title}</p>
        {right}
      </div>
      <button
        type="button"
        onClick={onCollapse}
        className="flex items-center gap-1 text-gray hover:text-white text-[11px] transition-colors p-1 rounded-md hover:bg-white/5"
        title="Sembunyikan panel"
      >
        <ChevronUp className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tutup</span>
      </button>
    </div>
  );
}

export default function ARTryOnTab({ userId, isActive = true, design, selectedColor, setSelectedColor, onDesignChange, onExit }) {
  const savedAr = readPersistedAr(userId);

  const [selectedDesign, setSelectedDesign] = useState(() => savedAr?.selectedDesign || null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [overlayScale, setOverlayScale] = useState(() => savedAr?.overlayScale ?? 0.3);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const [debugLandmarks, setDebugLandmarks] = useState(false);
  const [detected, setDetected] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [panelsOpen, setPanelsOpen] = useState(true);
  const [printAreas, setPrintAreas] = useState(() => savedAr?.printAreas || [
    { id: 1, positionId: 'standar-depan', sizeIdx: 2, repeat: 1 },
  ]);
  const [viewMode, setViewMode] = useState('front');
  const [fullscreen, setFullscreen] = useState(false);

  // Library modal state
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryDesigns, setLibraryDesigns] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const guideKey = userId != null ? `ar_tryon_guide_dismissed_u${userId}` : 'ar_tryon_guide_dismissed';
  const [showGuide, setShowGuide] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(guideKey) !== '1';
  });

  const dismissGuide = () => {
    setShowGuide(false);
    window.localStorage.setItem(guideKey, '1');
  };

  // Stop camera when AR tab is inactive
  useEffect(() => {
    if (!isActive && cameraActive) {
      setCameraActive(false);
    }
  }, [isActive, cameraActive]);

  // Persist AR settings per user
  useEffect(() => {
    const key = getArStorageKey(userId);
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          selectedDesign,
          overlayScale,
          printAreas,
          updated_at: Date.now(),
        })
      );
    } catch {}
  }, [userId, selectedDesign, overlayScale, printAreas]);

  const openLibraryModal = async () => {
    setShowLibraryModal(true);
    setLibraryLoading(true);
    try {
      const res = await designService.list(getUserSession(), null, { page: 1, per_page: 30 });
      const paginator = res.designs;
      const list = Array.isArray(paginator) ? paginator : paginator?.data || [];
      setLibraryDesigns(list);
    } catch {
      // ignore
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleSelectLibraryDesign = (d) => {
    const url = getImageUrl(d.image_url);
    setSelectedDesign({
      id: d.id,
      imageUrl: url,
      prompt: d.prompt,
      source: 'ai',
    });
    setShowLibraryModal(false);
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const threeContainerRef = useRef(null);
  // Latest camera frame, read by the screenshot function without re-creating it.
  const screenshotCanvasRef = useRef(null);

  // The active design from the in-page flow, falling back to the one passed in
  // from the standalone AI Generate tab. Its image becomes the shirt texture.
  const activeDesign = selectedDesign || design || null;
  const shirtTexture = activeDesign?.imageUrl || null;

  const resolveDesignUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    return getImageUrl(url);
  };

  // Warm up the MediaPipe pose + hand models as soon as this tab mounts so
  // opening the camera later doesn't wait on CDN downloads / GPU init.
  useEffect(() => {
    warmupMediaPipe();
  }, []);

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
  // Written every frame without React state so the renderer never re-renders at 60 FPS.
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

  const handleUploadDesign = (file, previewUrl) => {
    if (!file) {
      setSelectedDesign(null);
      onDesignChange?.(null);
      return;
    }
    setSelectedDesign({ id: Date.now(), imageUrl: previewUrl, source: 'upload' });
  };

  // Share a design chosen in AR with the rest of the studio (Mockup Editor,
  // standalone AI tab) through the shared page state.
  useEffect(() => {
    if (selectedDesign) {
      onDesignChange?.(selectedDesign);
    }
  }, [selectedDesign, onDesignChange]);

  const handleGenerateDesign = (result) => {
    if (!result) return;
    setSelectedDesign({
      id: result.id,
      imageUrl: result.imageUrl,
      prompt: result.prompt,
      source: 'ai',
    });
  };

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

  return fullscreen ? (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* ---- Full-bleed camera + 3D overlay ---- */}
      <div ref={threeContainerRef} className="absolute inset-0">
        <CameraFeed
          onFrame={handleFrame}
          active={cameraActive}
          onActiveChange={setCameraActive}
          videoRef={videoRef}
          canvasRef={canvasRef}
          fill
        />

        {isModelLoaded && cameraActive && (
          <ShirtRenderer
            anchorsRef={anchorsRef}
            shirtColor={selectedColor}
            containerRef={threeContainerRef}
            texture={resolveDesignUrl(shirtTexture)}
            printAreas={printAreas}
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
          <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 12 }}>
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
      </div>

      {/* ---- Floating translucent menus over the camera ---- */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        {/* Top control bar */}
        <div className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-gradient-to-b from-[#0d0714]/90 via-[#0d0714]/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-[18px] sm:text-[20px] text-white tracking-wider drop-shadow">AR TRY-ON</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanelsOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181120]/80 backdrop-blur-md border border-white/10 text-gray hover:text-white hover:border-white/30 transition-all text-[11px]"
              title={panelsOpen ? 'Sembunyikan semua menu' : 'Tampilkan semua menu'}
            >
              {panelsOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{panelsOpen ? 'Sembunyikan Menu' : 'Tampilkan Menu'}</span>
            </button>
            <button
              onClick={() => setShowGuide((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181120]/80 backdrop-blur-md border border-white/10 text-gray hover:text-fire hover:border-fire/40 transition-all text-[11px]"
              title="Tampilkan/sembunyikan panduan"
            >
              <HelpCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Panduan</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181120]/80 backdrop-blur-md border border-white/10 text-gray hover:text-white hover:border-white/30 transition-all text-[11px]"
              title="Kembali ke tampilan normal"
            >
              <Minimize className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Kecilkan</span>
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fire text-ink font-bold hover:bg-yellow-400 transition-colors text-[11px] shadow-md shadow-fire/20"
              title="Keluar dari AR Try-On"
            >
              <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Onboarding guide */}
        {showGuide && (
          <div className="pointer-events-auto mx-auto w-full max-w-3xl px-3 animate-fade-in">
            <div className="bg-[#181120]/90 backdrop-blur-md border border-fire/30 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fire animate-pulse" />
                  <p className="text-fire text-[11px] font-bold tracking-wider uppercase">Panduan Praktis</p>
                </div>
                <button onClick={dismissGuide} className="text-gray/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5" title="Jangan tampilkan lagi">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {GUIDE_STEPS.map((s) => (
                  <li key={s.n} className="flex sm:flex-col items-start gap-2 text-gray/90 text-[11px] bg-white/[0.03] p-2 rounded-xl border border-white/5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-fire/20 text-fire text-[10px] font-bold flex items-center justify-center border border-fire/30">
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
            {/* Left panel = what to wear */}
            {leftOpen ? (
              <div className={`pointer-events-auto absolute left-3 top-1 bottom-2 w-[19rem] max-w-[85vw] overflow-y-auto p-4 space-y-4 ${PANEL_CLS}`}>
                <PanelHeader title="Desain & Warna" onCollapse={() => setLeftOpen(false)} />
                <div>
                  <SectionLabel title="Desain" hint="Upload desainmu sendiri, atau buat dengan AI dari tombol di bawah kamera." />
                  <DesignUpload onUploadDesign={handleUploadDesign} currentDesign={shirtTexture} />
                  <p className="text-gray/80 text-[10px] mt-2 text-center">
                    {selectedDesign?.source === 'ai'
                      ? '✨ Dari AI Generate'
                      : selectedDesign?.source === 'upload'
                        ? '📁 Upload Sendiri'
                        : 'Belum ada desain'}
                  </p>
                  <button
                    type="button"
                    onClick={openLibraryModal}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:border-fire/60 hover:bg-fire/10 text-gray hover:text-white text-[11px] font-medium transition-all"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-fire" /> Koleksi AI Saya
                  </button>
                </div>

                <div className="space-y-2">
                  <SectionLabel title="Warna Kaos" hint="Pilih warna dasar kaos untuk pratinjau AR." />
                  <div className="grid grid-cols-4 gap-2">
                    {TSHIRT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`relative w-full aspect-square rounded-xl border-2 transition-all duration-200 ${
                          selectedColor === c.hex ? 'border-fire scale-105 shadow-lg shadow-fire/20' : 'border-white/10 hover:border-white/40'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {selectedColor === c.hex && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-[11px] font-bold ${c.hex === '#ffffff' ? 'text-black' : 'text-white'}`}>✓</span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray/80 text-[10px] text-center font-medium">
                    {TSHIRT_COLORS.find((c) => c.hex === selectedColor)?.label || 'Pilih warna'}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLeftOpen(true)}
                className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#120a1c]/90 backdrop-blur-md border border-white/10 rounded-r-xl px-2.5 py-3.5 text-gray hover:text-white transition-all text-[11px] shadow-lg"
                title="Buka panel desain"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
            )}

            {/* Right panel = fine-tuning */}
            {rightOpen ? (
              <div className={`pointer-events-auto absolute right-3 top-3 bottom-1 w-[19rem] max-w-[85vw] overflow-y-auto p-4 space-y-4 ${PANEL_CLS}`}>
                <div className="space-y-2.5">
                  <SectionLabel title="Area Cetak" hint="Atur posisi & ukuran sablon di kaos." />
                  <PrintAreaConfig areas={printAreas} onChange={setPrintAreas} />
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <SectionLabel title="Kalibrasi" hint="Sesuaikan ukuran overlay kaos ke tubuhmu di kamera." />
                      <span className="text-fire text-[11px] font-semibold">{Math.round(overlayScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.7"
                      step="0.01"
                      value={overlayScale}
                      onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                      className="w-full accent-fire cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => setViewMode((v) => (v === 'front' ? 'back' : 'front'))}
                    disabled={!cameraActive}
                    className="w-full flex items-center justify-center gap-2 text-[11px] font-medium text-gray bg-white/5 border border-white/10 rounded-xl py-2.5 hover:text-fire hover:border-fire/50 transition-all disabled:opacity-40"
                  >
                    {viewMode === 'front' ? 'Lihat Belakang' : 'Lihat Depan'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        cameraActive && detected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-gray-600'
                      }`}
                    />
                    <div>
                      <label htmlFor="landmark-toggle" className="text-gray/90 text-[11px] cursor-pointer select-none font-medium">
                        Titik Tubuh
                      </label>
                      {cameraActive && detected && (
                        <p className="text-green-400 text-[10px] leading-none mt-1">Mendeteksi tubuh</p>
                      )}
                      <p className="text-gray/60 text-[9px] leading-none mt-0.5">Shortcut: <kbd className="text-gray text-[9px] font-mono bg-black/40 px-1 rounded">L</kbd></p>
                    </div>
                  </div>
                  <button
                    id="landmark-toggle"
                    role="switch"
                    aria-checked={debugLandmarks}
                    onClick={() => setDebugLandmarks((prev) => !prev)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      debugLandmarks ? 'bg-fire' : 'bg-gray-700'
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
                  className="flex items-center justify-center gap-1 text-gray hover:text-white text-[10px] transition-colors pt-1"
                >
                  <ChevronUp className="w-3.5 h-3.5" /> Sembunyikan panel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRightOpen(true)}
                className="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#120a1c]/90 backdrop-blur-md border border-white/10 rounded-l-xl px-2.5 py-3.5 text-gray hover:text-white transition-all text-[11px] shadow-lg"
                title="Buka panel kalibrasi"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" /> <span className="sr-only">Kalibrasi</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom action bar */}
        {panelsOpen && (
          <div className="pointer-events-none flex justify-center p-3 bg-gradient-to-t from-[#0d0714]/90 via-[#0d0714]/50 to-transparent">
            <div className="pointer-events-auto w-full sm:w-auto flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-[#181120]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-2xl">
              {cameraActive ? (
                <button
                  onClick={() => setCameraActive(false)}
                  className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray px-5 py-2.5 rounded-xl hover:text-white hover:border-white/30 transition-all text-[13px] font-medium"
                >
                  <RefreshCw className="w-4 h-4" /> Matikan Kamera
                </button>
              ) : (
                <button
                  onClick={() => setCameraActive(true)}
                  className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 bg-fire text-ink font-bold px-5 py-2.5 rounded-xl hover:bg-yellow-400 transition-all text-[13px] shadow-lg shadow-fire/20"
                >
                  <Camera className="w-5 h-5" /> Aktifkan Kamera
                </button>
              )}
              <button
                onClick={handleScreenshot}
                disabled={!cameraActive}
                className={`flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-xl transition-all text-[13px] disabled:opacity-50 ${
                  screenshotTaken ? 'bg-green-500 text-white' : 'btn-gradient-primary text-white shadow-lg shadow-primary/20'
                }`}
                title="Atau tunjukkan tanda peace ✌️ ke kamera"
              >
                <Download className="w-4 h-4" />
                {screenshotTaken ? 'Tersimpan!' : 'Ambil Screenshot'}
              </button>
              <button
                onClick={() => setShowAiPanel((v) => !v)}
                className={`flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border font-medium transition-all text-[13px] ${
                  showAiPanel ? 'border-fire text-fire bg-fire/10' : 'border-white/10 text-gray hover:text-white hover:border-white/30 bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {showAiPanel ? 'Tutup AI' : 'Generate AI'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Generate panel as a centered modal over the camera */}
      {showAiPanel && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAiPanel(false)}>
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#181120] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fire" />
                <p className="font-heading text-[18px] text-white tracking-wider">GENERATE DESAIN AI</p>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="text-gray hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5" title="Tutup">
                <X className="w-5 h-5" />
              </button>
            </div>
            <AIGenerateTab onGenerateDesign={handleGenerateDesign} nextLabel="Gunakan Desain" />
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="bg-[#181120]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="font-heading text-[22px] sm:text-[24px] text-white tracking-wider">AR TRY-ON</h2>
          <p className="text-gray/80 text-[12px] sm:text-[13px] mt-0.5">Coba desain di badanmu secara langsung lewat kamera realtime.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-fire text-ink font-bold hover:bg-yellow-400 transition-all text-[11px] sm:text-[12px] shadow-md shadow-fire/20"
            title="Tampilkan kamera dalam mode penuh"
          >
            <Maximize className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Full Kamera</span>
          </button>
          <button
            onClick={() => setShowGuide((v) => !v)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-gray hover:text-fire hover:border-fire/50 transition-all text-[11px] sm:text-[12px]"
            title="Tampilkan/sembunyikan panduan"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Panduan
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Onboarding guide — dismissible, remembered per browser */}
      {showGuide && (
        <div className="mb-6 bg-[#120a1c]/90 border border-fire/30 rounded-2xl p-4 sm:p-5 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fire animate-pulse" />
              <p className="text-fire text-[11px] font-bold tracking-wider uppercase">Cara Pakai AR Try-On</p>
            </div>
            <button onClick={dismissGuide} className="text-gray/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5" title="Jangan tampilkan lagi">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {GUIDE_STEPS.map((s) => (
              <li key={s.n} className="flex sm:flex-col items-start gap-2 text-gray/90 text-[11px] bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-fire/20 text-fire text-[10px] font-bold flex items-center justify-center border border-fire/30">
                  {s.n}
                </span>
                <span className="leading-snug">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Main layout: controls left/right, camera centered */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: what to wear */}
        <div className="lg:col-span-3 order-2 lg:order-1 space-y-4">
          <div className="bg-[#120a1c]/60 border border-white/10 rounded-2xl p-4">
            <SectionLabel title="Desain" hint="Upload desainmu sendiri, atau buat dengan AI dari tombol di bawah kamera." />
            <DesignUpload onUploadDesign={handleUploadDesign} currentDesign={shirtTexture} />
            <p className="text-gray/80 text-[10px] mt-2 text-center">
              {selectedDesign?.source === 'ai'
                ? '✨ Dari AI Generate'
                : selectedDesign?.source === 'upload'
                  ? '📁 Upload Sendiri'
                  : 'Belum ada desain'}
            </p>
            <button
              type="button"
              onClick={openLibraryModal}
              className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-white/10 bg-white/5 hover:border-fire/60 hover:bg-fire/10 text-gray hover:text-white text-[12px] font-medium transition-all"
            >
              <FolderOpen className="w-4 h-4 text-fire" /> Koleksi Desain AI Saya
            </button>
          </div>

          <div className="bg-[#120a1c]/60 border border-white/10 rounded-2xl p-4">
            <SectionLabel title="Warna Kaos" hint="Pilih warna dasar kaos untuk pratinjau AR." />
            <div className="grid grid-cols-4 gap-2">
              {TSHIRT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.hex)}
                  className={`relative w-full aspect-square rounded-xl border-2 transition-all duration-200 ${
                    selectedColor === c.hex ? 'border-fire scale-105 shadow-md shadow-fire/20' : 'border-white/10 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {selectedColor === c.hex && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[11px] font-bold ${c.hex === '#ffffff' ? 'text-black' : 'text-white'}`}>✓</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-gray/80 text-[10px] mt-2 text-center font-medium">
              {TSHIRT_COLORS.find((c) => c.hex === selectedColor)?.label || 'Pilih warna'}
            </p>
          </div>
        </div>

        {/* Center column: camera + primary actions */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-3.5">
          <div ref={threeContainerRef} className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
            <CameraFeed
              onFrame={handleFrame}
              active={cameraActive}
              onActiveChange={setCameraActive}
              videoRef={videoRef}
              canvasRef={canvasRef}
            />

            {isModelLoaded && cameraActive && (
              <ShirtRenderer
                anchorsRef={anchorsRef}
                shirtColor={selectedColor}
                containerRef={threeContainerRef}
                texture={resolveDesignUrl(shirtTexture)}
                printAreas={printAreas}
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
                <Camera className="w-10 h-10 text-gray/50 mb-2.5" />
                <p className="text-gray text-[13px] font-medium">Aktifkan kamera untuk mulai mencoba desain</p>
              </div>
            )}

            {!isModelLoaded && cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 11 }}>
                <span className="text-gray text-[12px] bg-black/70 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/10">Memuat model 3D...</span>
              </div>
            )}

            {cameraActive && isHandModelLoaded && (
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 12 }}>
                <span className="bg-[#120a1c]/90 text-white text-[11px] px-3.5 py-1.5 rounded-full whitespace-nowrap border border-white/10 backdrop-blur-md shadow-lg">
                  {gestureStatus === 'cooldown'
                    ? `Foto diambil! Tunggu ${Math.ceil(cooldownLeft / 1000)}s`
                    : STATUS_MESSAGES[gestureStatus]}
                </span>
              </div>
            )}

            {debugLandmarks && cameraActive && (
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-xl border border-white/10 pointer-events-none" style={{ zIndex: 12 }}>
                Model: {isModelLoaded ? '✓' : '⏳'} | Pose: {landmarks ? '✓' : '—'} | Hand: {hasHand ? '✓' : '—'}
              </div>
            )}
          </div>

          {/* Primary action bar directly under the camera it controls */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {cameraActive ? (
              <button
                onClick={() => setCameraActive(false)}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-[#120a1c] border border-white/10 text-gray py-2.5 rounded-xl hover:text-white hover:border-white/30 transition-all text-[13px] font-medium"
              >
                <RefreshCw className="w-4 h-4" /> Matikan Kamera
              </button>
            ) : (
              <button
                onClick={() => setCameraActive(true)}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-fire text-ink font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-all text-[13px] shadow-lg shadow-fire/20"
              >
                <Camera className="w-5 h-5" /> Aktifkan Kamera
              </button>
            )}
            <button
              onClick={handleScreenshot}
              disabled={!cameraActive}
              className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all text-[13px] disabled:opacity-50 ${
                screenshotTaken ? 'bg-green-500 text-white' : 'btn-gradient-primary text-white shadow-lg shadow-primary/20'
              }`}
              title="Atau tunjukkan tanda peace ✌️ ke kamera"
            >
              <Download className="w-4 h-4" />
              {screenshotTaken ? 'Tersimpan!' : 'Ambil Screenshot'}
            </button>
          </div>

          {/* AI Generate panel toggle */}
          <div>
            <button
              onClick={() => setShowAiPanel((v) => !v)}
              className={`w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-xl border font-medium transition-all text-[12px] ${
                showAiPanel
                  ? 'border-fire text-fire bg-fire/10'
                  : 'border-white/10 bg-white/5 text-gray hover:border-fire/50 hover:text-white'
              }`}
            >
              {showAiPanel ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-fire" />}
              {showAiPanel ? 'Tutup Generate Desain AI' : 'Generate Desain dengan AI'}
            </button>
            {showAiPanel && (
              <div className="mt-3.5 animate-fade-in">
                <AIGenerateTab onGenerateDesign={handleGenerateDesign} nextLabel="Gunakan Desain" />
              </div>
            )}
          </div>
        </div>

        {/* Right column: fine-tuning */}
        <div className="lg:col-span-3 order-3 space-y-4">
          <div className="bg-[#120a1c]/60 border border-white/10 rounded-2xl p-4">
            <SectionLabel title="Area Cetak" hint="Atur posisi & ukuran sablon di kaos." />
            <PrintAreaConfig areas={printAreas} onChange={setPrintAreas} />
          </div>

          <div className="bg-[#120a1c]/60 border border-white/10 rounded-2xl p-4 space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <SectionLabel title="Kalibrasi" hint="Sesuaikan ukuran overlay kaos ke tubuhmu di kamera." />
                <span className="text-fire text-[11px] font-semibold">{Math.round(overlayScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.01"
                value={overlayScale}
                onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                className="w-full accent-fire cursor-pointer"
              />
            </div>
            <button
              onClick={() => setViewMode((v) => (v === 'front' ? 'back' : 'front'))}
              disabled={!cameraActive}
              className="w-full flex items-center justify-center gap-2 text-[11px] font-medium text-gray bg-white/5 border border-white/10 rounded-xl py-2.5 hover:text-fire hover:border-fire/50 transition-all disabled:opacity-40"
            >
              {viewMode === 'front' ? 'Lihat Belakang' : 'Lihat Depan'}
            </button>
          </div>

          <div className="bg-[#120a1c]/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  cameraActive && detected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-gray-600'
                }`}
              />
              <div>
                <label htmlFor="landmark-toggle" className="text-gray/90 text-[11px] cursor-pointer select-none font-medium">
                  Titik Tubuh
                </label>
                {cameraActive && detected && (
                  <p className="text-green-400 text-[10px] leading-none mt-1">Mendeteksi tubuh</p>
                )}
                <p className="text-gray/60 text-[9px] leading-none mt-0.5">Shortcut: <kbd className="text-gray text-[9px] font-mono bg-dark/50 px-1 rounded">L</kbd></p>
              </div>
            </div>
            <button
              id="landmark-toggle"
              role="switch"
              aria-checked={debugLandmarks}
              onClick={() => setDebugLandmarks((prev) => !prev)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                debugLandmarks ? 'bg-fire' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  debugLandmarks ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Koleksi Desain AI Modal for AR Try-On */}
      {showLibraryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowLibraryModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] bg-[#181120] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#120a1c]">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-fire" />
                <h3 className="font-heading text-base sm:text-lg text-white tracking-wide">
                  PILIH DESAIN AI UNTUK AR TRY-ON
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openLibraryModal}
                  disabled={libraryLoading}
                  className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-gray hover:text-white hover:border-fire/50 transition-colors"
                  title="Segarkan data"
                >
                  <RefreshCw className={`w-4 h-4 ${libraryLoading ? 'animate-spin text-fire' : ''}`} />
                </button>
                <button
                  onClick={() => setShowLibraryModal(false)}
                  className="p-1.5 rounded-xl text-gray hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {libraryLoading ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-fire mx-auto mb-3" />
                  <p className="text-gray text-xs">Memuat koleksi desain kamu...</p>
                </div>
              ) : libraryDesigns.length === 0 ? (
                <div className="py-16 text-center max-w-sm mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-[#120a1c] border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray">
                    <Sparkles className="w-7 h-7 text-fire/70" />
                  </div>
                  <p className="text-white font-medium text-sm mb-1">Belum ada desain tersimpan</p>
                  <p className="text-gray text-xs mb-4">
                    Kamu belum memiliki desain AI yang dihasilkan. Buat desain pertama kamu di tab AI Generate!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {libraryDesigns.map((d) => {
                    const imgUrl = getImageUrl(d.image_url);
                    return (
                      <div
                        key={d.id}
                        className="group relative bg-[#120a1c] border border-white/10 rounded-xl overflow-hidden hover:border-fire transition-all flex flex-col"
                      >
                        <div className="aspect-square w-full bg-[#0d0714] flex items-center justify-center overflow-hidden p-2">
                          <img
                            src={imgUrl}
                            alt={d.prompt || 'Desain AI'}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <p className="text-[11px] text-gray line-clamp-2 mb-2 leading-relaxed" title={d.prompt}>
                            {d.prompt || 'Desain tanpa prompt'}
                          </p>
                          <button
                            onClick={() => handleSelectLibraryDesign(d)}
                            className="w-full py-2 px-2 bg-fire text-ink hover:bg-yellow-400 font-semibold text-[11px] rounded-xl transition-all shadow-md shadow-fire/20"
                          >
                            Coba Pakai (AR)
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
  );
}