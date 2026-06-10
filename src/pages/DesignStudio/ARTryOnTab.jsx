import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';

export default function ARTryOnTab({ design, selectedColor, setSelectedColor }) {
  const toast = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const overlayRef = useRef({ x: 0.5, y: 0.38, scale: 0.3 });
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [overlayScale, setOverlayScale] = useState(0.3);
  const [screenshotTaken, setScreenshotTaken] = useState(false);

  const loadImage = useCallback((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
      toast.error('Kamera tidak tersedia');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    overlayRef.current.scale = overlayScale;
  }, [overlayScale]);

  useEffect(() => {
    if (!cameraActive || !canvasRef.current || !videoRef.current) return;

    let designImg = null;
    let loading = false;

    const renderLoop = async () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.readyState < 2) {
        animRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      if (design?.imageUrl && !designImg && !loading) {
        loading = true;
        try {
          designImg = await loadImage(design.imageUrl);
        } catch {
          loading = false;
        }
      }

      if (designImg) {
        const dw = designImg.width * overlayRef.current.scale;
        const dh = designImg.height * overlayRef.current.scale;
        const dx = overlayRef.current.x * w - dw / 2;
        const dy = overlayRef.current.y * h - dh / 2;

        ctx.globalAlpha = 0.92;
        ctx.drawImage(designImg, dx, dy, dw, dh);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = '#c8f000';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(dx, dy, dw, dh);
        ctx.setLineDash([]);
      }

      animRef.current = requestAnimationFrame(renderLoop);
    };

    animRef.current = requestAnimationFrame(renderLoop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [cameraActive, design?.imageUrl, loadImage]);

  const handleCanvasMouseDown = (e) => {
    if (!cameraActive) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const ox = overlayRef.current.x;
    const oy = overlayRef.current.y;
    const hitRadius = 0.12;
    if (Math.abs(mx - ox) < hitRadius && Math.abs(my - oy) < hitRadius) {
      dragRef.current = { dragging: true, offsetX: ox - mx, offsetY: oy - my };
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!dragRef.current.dragging || !cameraActive) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    overlayRef.current.x = Math.max(0.1, Math.min(0.9, mx + dragRef.current.offsetX));
    overlayRef.current.y = Math.max(0.1, Math.min(0.9, my + dragRef.current.offsetY));
  };

  const handleCanvasMouseUp = () => {
    dragRef.current.dragging = false;
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleScreenshot = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ar-tryon-${design?.id || Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setScreenshotTaken(true);
    setTimeout(() => setScreenshotTaken(false), 2000);
    toast.success('Screenshot tersimpan!');
  };

  if (!design) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Icon name="camera" size={64} className="mx-auto text-gray mb-4" />
        <p className="text-gray text-[16px] mb-2">Belum ada desain</p>
        <p className="text-gray text-[13px]">Generate desain di tab AI Generate terlebih dahulu untuk mencoba AR Try-On.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-heading text-[24px] text-white tracking-[1px] mb-6">AR TRY-ON</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Camera viewport */}
        <div className="relative bg-ink border border-border rounded-xl overflow-hidden">
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-auto cursor-move"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleCanvasMouseUp}
          />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/90">
              <Icon name="camera" size={64} className="text-gray mb-4" />
              {cameraError ? (
                <>
                  <p className="text-red-400 text-[14px] mb-2">{cameraError}</p>
                  <button onClick={startCamera}
                    className="mt-2 bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary-dark transition-colors text-[13px]">
                    Coba Lagi
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray text-[14px] mb-4">Klik tombol di bawah untuk mengaktifkan kamera</p>
                  <button onClick={startCamera}
                    className="bg-fire text-ink font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors flex items-center gap-2">
                    <Icon name="camera" size={20} /> Aktifkan Kamera
                  </button>
                </>
              )}
            </div>
          )}

          {cameraActive && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="bg-black/60 text-white text-[11px] px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
              </span>
              <span className="bg-black/60 text-white text-[11px] px-2 py-1 rounded-lg">
                Geser desain untuk posisi
              </span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Design preview */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Desain</label>
            <div className="bg-ink border border-border rounded-xl p-3">
              <img src={design.imageUrl} alt="Design" className="w-full max-h-32 object-contain rounded-lg" />
            </div>
          </div>

          {/* Overlay scale */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">
              Ukuran Desain: {Math.round(overlayScale * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.7"
              step="0.01"
              value={overlayScale}
              onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
              className="w-full accent-fire"
            />
            <div className="flex justify-between text-[11px] text-gray mt-1">
              <span>Kecil</span>
              <span>Besar</span>
            </div>
          </div>

          {/* T-shirt color */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Warna Kaos</label>
            <div className="grid grid-cols-4 gap-2">
              {['#ffffff', '#111111', '#1a2744', '#555555', '#cc2222', '#4a5c3a', '#6b1d1d', '#5c3d2e'].map((hex) => (
                <button
                  key={hex}
                  onClick={() => setSelectedColor(hex)}
                  className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 ${
                    selectedColor === hex ? 'border-fire scale-110' : 'border-border hover:border-gray'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {cameraActive && (
              <button onClick={stopCamera}
                className="w-full flex items-center justify-center gap-2 bg-ink border border-border text-gray py-3 rounded-xl hover:text-white hover:border-fire/50 transition-all text-[13px]">
                <Icon name="pause" size={18} /> Matikan Kamera
              </button>
            )}
            <button onClick={handleScreenshot} disabled={!cameraActive}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 ${
                screenshotTaken
                  ? 'bg-green-500 text-white'
                  : 'bg-fire text-ink hover:bg-yellow-400'
              }`}>
              <Icon name={screenshotTaken ? 'check' : 'camera'} size={20} />
              {screenshotTaken ? 'Tersimpan!' : 'Ambil Screenshot'}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-ink border border-border rounded-xl p-4">
            <p className="text-fire text-[11px] font-medium tracking-[1px] uppercase mb-2">Cara Pakai</p>
            <ul className="text-gray text-[12px] space-y-1.5">
              <li className="flex gap-2"><span className="text-fire">1.</span> Aktifkan kamera</li>
              <li className="flex gap-2"><span className="text-fire">2.</span> Geser desain ke posisi dada</li>
              <li className="flex gap-2"><span className="text-fire">3.</span> Atur ukuran dengan slider</li>
              <li className="flex gap-2"><span className="text-fire">4.</span> Ambil screenshot</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
