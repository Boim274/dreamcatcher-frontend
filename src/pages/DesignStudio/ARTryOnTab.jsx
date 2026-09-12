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
import { Camera, Download, RefreshCw, Sparkles, X, Info, HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff, Maximize, Minimize } from 'lucide-react';

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

// Panel header row with a collapsible chevron + optional right action.
function PanelHeader({ title, onCollapse, right }) {
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
        title="Sembunyikan panel"
      >
        <ChevronUp className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Keluar</span>
      </button>
    </div>
  );
}

export default function ARTryOnTab({ design, selectedColor, setSelectedColor, onDesignChange, onExit }) {
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [overlayScale, setOverlayScale] = useState(0.3);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const [debugLandmarks, setDebugLandmarks] = useState(false);
  const [detected, setDetected] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [panelsOpen, setPanelsOpen] = useState(true);
  const [printAreas, setPrintAreas] = useState([
    { id: 1, positionId: 'standar-depan', sizeIdx: 2, repeat: 1 },
  ]);
  const [viewMode, setViewMode] = useState('front');
  const [fullscreen, setFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('ar_tryon_guide_dismissed') !== '1';
  });

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

  const dismissGuide = () => {
    setShowGuide(false);
    window.localStorage.setItem('ar_tryon_guide_dismissed', '1');
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
        <div className="pointer-events-auto flex items-center justify-between gap-3 p-3"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
          }}>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-[20px] text-white tracking-[1px] drop-shadow">AR TRY-ON</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanelsOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-gray hover:text-white hover:border-white/30 transition-colors text-[11px]"
              title={panelsOpen ? 'Sembunyikan semua menu' : 'Tampilkan semua menu'}
            >
              {panelsOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{panelsOpen ? 'Sembunyikan Menu' : 'Tampilkan Menu'}</span>
            </button>
            <button
              onClick={() => setShowGuide((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-gray hover:text-fire hover:border-white/30 transition-colors text-[11px]"
              title="Tampilkan/sembunyikan panduan"
            >
              <HelpCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Panduan</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-gray hover:text-white hover:border-white/30 transition-colors text-[11px]"
              title="Kembali ke tampilan normal"
            >
              <Minimize className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Kecilkan</span>
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fire text-ink font-bold hover:bg-yellow-400 transition-colors text-[11px]"
              title="Keluar dari AR Try-On"
            >
              <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Onboarding guide */}
        {showGuide && (
          <div className="pointer-events-auto mx-auto w-full max-w-3xl px-3">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-fire text-[11px] font-bold tracking-[1px] uppercase">Cara Pakai</p>
                <button onClick={dismissGuide} className="text-gray hover:text-white transition-colors" title="Jangan tampilkan lagi">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {GUIDE_STEPS.map((s) => (
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
            {/* Left panel = what to wear */}
            {leftOpen ? (
              <div className={`pointer-events-auto absolute left-3 top-1 bottom-2 w-[19rem] max-w-[85vw] overflow-y-auto p-3.5 space-y-4 ${PANEL_CLS}`}>
                <PanelHeader title="Desain & Warna" onCollapse={() => setLeftOpen(false)} />
                <div>
                  <SectionLabel title="Desain" hint="Upload desainmu sendiri, atau buat dengan AI dari tombol di bawah kamera." />
                  <DesignUpload onUploadDesign={handleUploadDesign} currentDesign={shirtTexture} />
                  <p className="text-gray text-[10px] mt-2 text-center">
                    {selectedDesign?.source === 'ai'
                      ? '✨ Dari AI Generate'
                      : selectedDesign?.source === 'upload'
                        ? '📁 Upload Sendiri'
                        : 'Belum ada desain'}
                  </p>
                </div>

                <div className="space-y-2">
                  <SectionLabel title="Warna Kaos" hint="Pilih warna dasar kaos untuk pratinjau AR." />
                  <div className="grid grid-cols-4 gap-2">
                    {TSHIRT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`relative w-full aspect-square rounded-lg border-2 transition-all duration-200 ${
                          selectedColor === c.hex ? 'border-fire scale-110' : 'border-white/20 hover:border-white/60'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {selectedColor === c.hex && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-[10px] font-bold ${c.hex === '#ffffff' ? 'text-black' : 'text-white'}`}>✓</span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray text-[10px] text-center">
                    {TSHIRT_COLORS.find((c) => c.hex === selectedColor)?.label || 'Pilih warna'}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLeftOpen(true)}
                className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-r-lg px-2.5 py-3 text-gray hover:text-white transition-colors text-[10px]"
                title="Buka panel desain"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
            )}

            {/* Right panel = fine-tuning */}
            {rightOpen ? (
              <div className={`pointer-events-auto absolute right-3 top-3 bottom-1 w-[19rem] max-w-[85vw] overflow-y-auto p-3.5 space-y-4 ${PANEL_CLS}`}>
                <div className="space-y-2.5">
                  <SectionLabel title="Area Cetak" hint="Atur posisi & ukuran sablon di kaos." />
                  <PrintAreaConfig areas={printAreas} onChange={setPrintAreas} />
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <SectionLabel title="Kalibrasi" hint="Sesuaikan ukuran overlay kaos ke tubuhmu di kamera." />
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
                    {viewMode === 'front' ? 'Lihat Belakang' : 'Lihat Depan'}
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
                        Tampilkan titik tubuh
                      </label>
                      {cameraActive && detected && (
                        <p className="text-green-400 text-[10px] leading-none mt-1">Mendeteksi tubuh</p>
                      )}
                      <p className="text-gray-600 text-[9px] leading-none mt-0.5">Tekan <kbd className="text-gray text-[9px] font-mono bg-black/40 px-1 rounded">L</kbd></p>
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
                  <ChevronUp className="w-3.5 h-3.5" /> Sembunyikan panel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRightOpen(true)}
                className="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-l-lg px-2.5 py-3 text-gray hover:text-white transition-colors text-[10px]"
                title="Buka panel kalibrasi"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" /> <span className="sr-only">Kalibrasi</span>
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
                  <RefreshCw className="w-4 h-4" /> Matikan Kamera
                </button>
              ) : (
                <button
                  onClick={() => setCameraActive(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-fire text-ink font-bold px-5 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-[13px]"
                >
                  <Camera className="w-5 h-5" /> Aktifkan Kamera
                </button>
              )}
              <button
                onClick={handleScreenshot}
                disabled={!cameraActive}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 font-bold px-5 py-3 rounded-lg transition-colors text-[13px] disabled:opacity-50 ${
                  screenshotTaken ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'
                }`}
                title="Atau tunjukkan tanda peace ✌️ ke kamera"
              >
                <Download className="w-4 h-4" />
                {screenshotTaken ? 'Tersimpan!' : 'Ambil Screenshot'}
              </button>
              <button
                onClick={() => setShowAiPanel((v) => !v)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-lg border font-medium transition-all text-[13px] ${
                  showAiPanel ? 'border-fire text-fire bg-fire/10' : 'border-white/20 text-gray hover:text-white hover:border-white/40'
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
        <div className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowAiPanel(false)}>
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card border border-border rounded-xl p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-heading text-[18px] text-white tracking-[1px]">GENERATE DESAIN AI</p>
              <button onClick={() => setShowAiPanel(false)} className="text-gray hover:text-white transition-colors" title="Tutup">
                <X className="w-5 h-5" />
              </button>
            </div>
            <AIGenerateTab onGenerateDesign={handleGenerateDesign} nextLabel="Gunakan Desain" />
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading text-[22px] text-white tracking-[1px]">AR TRY-ON</h2>
          <p className="text-gray text-[12px] mt-0.5">Coba desain di badanmu secara langsung lewat kamera.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fire text-ink font-bold hover:bg-yellow-400 transition-colors text-[11px]"
            title="Tampilkan kamera dalam mode penuh"
          >
            <Maximize className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Full Kamera</span>
          </button>
          <button
            onClick={() => setShowGuide((v) => !v)}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-gray hover:text-fire hover:border-fire/50 transition-colors text-[11px]"
            title="Tampilkan/sembunyikan panduan"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Panduan
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Onboarding guide — dismissible, remembered per browser */}
      {showGuide && (
        <div className="mb-5 bg-ink border border-fire/30 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-fire text-[11px] font-bold tracking-[1px] uppercase">Cara Pakai</p>
            <button onClick={dismissGuide} className="text-gray hover:text-white transition-colors" title="Jangan tampilkan lagi">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {GUIDE_STEPS.map((s) => (
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
          <div>
            <SectionLabel title="Desain" hint="Upload desainmu sendiri, atau buat dengan AI dari tombol di bawah kamera." />
            <DesignUpload onUploadDesign={handleUploadDesign} currentDesign={shirtTexture} />
            <p className="text-gray text-[10px] mt-2 text-center">
              {selectedDesign?.source === 'ai'
                ? '✨ Dari AI Generate'
                : selectedDesign?.source === 'upload'
                  ? '📁 Upload Sendiri'
                  : 'Belum ada desain'}
            </p>
          </div>

          <div className="bg-ink border border-border rounded-xl p-3.5">
            <SectionLabel title="Warna Kaos" hint="Pilih warna dasar kaos untuk pratinjau AR." />
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
                      <span className={`text-[10px] font-bold ${c.hex === '#ffffff' ? 'text-black' : 'text-white'}`}>✓</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-gray text-[10px] mt-2 text-center">
              {TSHIRT_COLORS.find((c) => c.hex === selectedColor)?.label || 'Pilih warna'}
            </p>
          </div>
        </div>

        {/* Center column: camera + primary actions */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-3">
          <div ref={threeContainerRef} className="relative w-full">
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
              <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 12 }}>
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

          {/* Primary action bar directly under the camera it controls */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {cameraActive ? (
              <button
                onClick={() => setCameraActive(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-ink border border-border text-gray py-3 rounded-xl hover:text-white hover:border-fire/50 transition-all text-[13px]"
              >
                <RefreshCw className="w-4 h-4" /> Matikan Kamera
              </button>
            ) : (
              <button
                onClick={() => setCameraActive(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-fire text-ink font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors text-[13px]"
              >
                <Camera className="w-5 h-5" /> Aktifkan Kamera
              </button>
            )}
            <button
              onClick={handleScreenshot}
              disabled={!cameraActive}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors text-[13px] disabled:opacity-50 ${
                screenshotTaken ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'
              }`}
              title="Atau tunjukkan tanda peace ✌️ ke kamera"
            >
              <Download className="w-4 h-4" />
              {screenshotTaken ? 'Tersimpan!' : 'Ambil Screenshot'}
            </button>
          </div>

          {/* AI Generate panel toggle, kept near the camera since it feeds the shirt texture */}
          <div>
            <button
              onClick={() => setShowAiPanel((v) => !v)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-medium transition-all text-[12px] ${
                showAiPanel
                  ? 'border-fire text-fire bg-fire/10'
                  : 'border-border text-gray hover:border-fire/50 hover:text-white'
              }`}
            >
              {showAiPanel ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {showAiPanel ? 'Tutup Generate Desain AI' : 'Generate Desain dengan AI'}
            </button>
            {showAiPanel && (
              <div className="mt-3">
                <AIGenerateTab onGenerateDesign={handleGenerateDesign} nextLabel="Gunakan Desain" />
              </div>
            )}
          </div>
        </div>

        {/* Right column: fine-tuning */}
        <div className="lg:col-span-3 order-3 space-y-4">
          <div className="bg-ink border border-border rounded-xl p-3.5">
            <SectionLabel title="Area Cetak" hint="Atur posisi & ukuran sablon di kaos." />
            <PrintAreaConfig areas={printAreas} onChange={setPrintAreas} />
          </div>

          <div className="bg-ink border border-border rounded-xl p-3.5 space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <SectionLabel title="Kalibrasi" hint="Sesuaikan ukuran overlay kaos ke tubuhmu di kamera." />
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
              {viewMode === 'front' ? 'Lihat Belakang' : 'Lihat Depan'}
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
                  Tampilkan titik tubuh
                </label>
                {cameraActive && detected && (
                  <p className="text-green-400 text-[10px] leading-none mt-1">Mendeteksi tubuh</p>
                )}
                <p className="text-gray-600 text-[9px] leading-none mt-0.5">Tekan <kbd className="text-gray text-[9px] font-mono bg-dark/50 px-1 rounded">L</kbd></p>
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
        </div>
      </div>
    </div>
  );
}