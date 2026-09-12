import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

export default function CameraFeed({ onFrame, active, onActiveChange, videoRef: extVideoRef, canvasRef: extCanvasRef, fill = false }) {
  const internalVideoRef = useRef(null);
  const internalCanvasRef = useRef(null);
  const videoRef = extVideoRef || internalVideoRef;
  const canvasRef = extCanvasRef || internalCanvasRef;
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [streaming, setStreaming] = useState(false);

  // Match the canvas buffer to the camera's native resolution so pose detection
  // always runs on the real video dimensions (no pre-scaling loss), capped so
  // the per-frame 2D overlay + readbacks stay cheap on low-end devices.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const syncCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth <= 0 || video.videoHeight <= 0) return;
    canvas.width = Math.min(video.videoWidth, 960);
    canvas.height = Math.min(video.videoHeight, 720);
  }, [videoRef, canvasRef]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, [videoRef]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      // Mobile requests a smaller feed — pose tracking doesn't need 720p and a
      // lighter stream keeps the preview smooth on phones.
      const isMobile =
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(max-width: 767px)').matches || 'ontouchstart' in window);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: isMobile ? 640 : 1280 },
          height: { ideal: isMobile ? 480 : 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        syncCanvasSize();
        setStreaming(true);
      }
    } catch {
      setCameraError('Tidak dapat mengakses kamera. Izinkan akses kamera di browser Anda.');
    }
  }, [videoRef, syncCanvasSize]);

  // Single source of truth: active prop controls camera lifecycle
  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [active, startCamera, stopCamera]);

  // Render loop — draws the mirrored frame and reads canvas size each tick
  // (the canvas resizes once video metadata arrives).
  useEffect(() => {
    if (!streaming || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      if (!canvas || !video || video.readyState < 2) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      if (onFrame) onFrame(canvas, video);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [streaming, onFrame, canvasRef, videoRef]);

  return (
    <div className={fill ? 'absolute inset-0 overflow-hidden bg-black' : 'relative bg-ink border border-border rounded-xl overflow-hidden'}>
      <video ref={videoRef} className="hidden" playsInline muted onLoadedMetadata={syncCanvasSize} />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className={fill ? 'absolute inset-0 w-full h-full object-cover' : 'w-full h-auto'}
      />

      {!streaming && !cameraError && !active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/90 animate-fade-in">
          <Camera className="w-16 h-16 text-gray mb-4" />
          <p className="text-gray text-[14px] mb-4">Klik tombol di bawah untuk mengaktifkan kamera</p>
          <button
            onClick={() => onActiveChange?.(true)}
            className="bg-fire text-ink font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors flex items-center gap-2 text-[13px]"
          >
            <Camera className="w-5 h-5" /> Aktifkan Kamera
          </button>
        </div>
      )}

      {cameraError && !streaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/90 animate-fade-in">
          <Camera className="w-16 h-16 text-gray mb-4" />
          <p className="text-red-400 text-[14px] mb-4 text-center px-6">{cameraError}</p>
          <button
            onClick={() => onActiveChange?.(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2 text-[13px]"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      )}

      {streaming && (
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/60 text-white text-[11px] px-2 py-1 rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
          </span>
        </div>
      )}
    </div>
  );
}
