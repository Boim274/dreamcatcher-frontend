import { useRef, useEffect } from 'react';

// Torso polygon expansion, as a fraction of the (normalized) shoulder width,
// so the cutout sits loosely around the torso without leaving thin collar
// or hem slivers.
const TORSO_EXPAND = 0.07;

// Render the live camera on top of the 3D shirt ONLY where the person's
// arms/hands/head/neck are, so they occlude the shirt instead of the other way
// around. Uses pure Canvas 2D compositing (no per-pixel work on the display
// canvas): the person mask is thresholded once at mask resolution, the torso is
// punched out with destination-out, and the result clips the mirrored camera
// canvas via destination-in. zIndex must sit above ShirtRenderer (zIndex 10).
// `cameraCanvasRef` is the CameraFeed canvas (already mirrored, video aspect
// preserved); the same object-cover mapping CameraFeed applies via CSS is
// reproduced here so the occluder pixels sit exactly on top of the base feed
// (no ghost/doubled body), even in fullscreen where container and video aspect
// ratios differ.
export default function OcclusionLayer({ containerRef, segMaskRef, anchorsRef, cameraCanvasRef, active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  // Reusable offscreen buffers — no per-frame allocation.
  const personCanvasRef = useRef(null);
  const torsoCanvasRef = useRef(null);
  const occluderCanvasRef = useRef(null);
  const imageDataRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const ensureBuffers = (w, h) => {
      for (const ref of [personCanvasRef, torsoCanvasRef, occluderCanvasRef]) {
        if (!ref.current) {
          ref.current = document.createElement('canvas');
          ref.current.width = w;
          ref.current.height = h;
        } else if (ref.current.width !== w || ref.current.height !== h) {
          ref.current.width = w;
          ref.current.height = h;
        }
      }
      if (!imageDataRef.current || imageDataRef.current.width !== w || imageDataRef.current.height !== h) {
        imageDataRef.current = new ImageData(w, h);
      }
    };

    // Threshold the MediaPipe confidence mask (>0.5) into solid white/transparent.
    const buildPersonMask = (canvas, seg) => {
      const w = seg.width;
      const h = seg.height;
      const total = w * h;
      const ch = seg.data.length / total || 1;
      const img = imageDataRef.current;
      const d = img.data;
      const src = seg.data;
      for (let i = 0; i < total; i++) {
        const v = src[i * ch];
        const o = i * 4;
        const on = v > 127;
        d[o] = d[o + 1] = d[o + 2] = on ? 255 : 0;
        d[o + 3] = on ? 255 : 0;
      }
      canvas.getContext('2d').putImageData(img, 0, 0);
    };

    // Fill a quadrilateral spanning shoulders→hips, expanded outward from its
    // centroid by TORSO_EXPAND × shoulderWidth (normalized units → pixels).
    const buildTorsoMask = (canvas, anchors, w, h) => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      const ls = anchors.leftShoulder;
      const rs = anchors.rightShoulder;
      const lh = anchors.leftHip;
      const rh = anchors.rightHip;
      if (!anchors.visible || !ls || !rs || !lh || !rh) return;

      const expand = (anchors.shoulderWidth || 0.3) * TORSO_EXPAND;
      const cx = (ls.x + rs.x + lh.x + rh.x) / 4;
      const cy = (ls.y + rs.y + lh.y + rh.y) / 4;
      const pts = [ls, rs, rh, lh];

      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - cx;
        const dy = pts[i].y - cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const px = (pts[i].x + (dx / len) * expand) * w;
        const py = (pts[i].y + (dy / len) * expand) * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
    };

    const tick = () => {
      if (cancelled) return;
      rafRef.current = requestAnimationFrame(tick);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const container = containerRef?.current;
      const seg = segMaskRef?.current;
      const anchors = anchorsRef?.current;
      const base = cameraCanvasRef?.current;
      if (!canvas || !ctx || !container || !base || base.width === 0 || base.height === 0) return;
      if (container.clientWidth === 0 || container.clientHeight === 0) return;

      // Match the backing store to the container (camera) area, resizing only
      // when it actually changes.
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.clearRect(0, 0, cw, ch);

      if (!seg || !seg.data || seg.width <= 0 || !anchors || !anchors.visible) return;

      // Reproduce CameraFeed's CSS object-cover transform: scale the base canvas
      // (whose backing store keeps the video aspect) so it fills the container,
      // cropping the longer edge. Both the video and its occlusion mask must use
      // this same rect or the two body layers drift apart.
      const coverScale = Math.max(cw / base.width, ch / base.height);
      const dw = base.width * coverScale;
      const dh = base.height * coverScale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      const mw = seg.width;
      const mh = seg.height;
      ensureBuffers(mw, mh);
      buildPersonMask(personCanvasRef.current, seg);
      buildTorsoMask(torsoCanvasRef.current, anchors, mw, mh);

      // occluder = person mask − torso polygon (destination-out punches the hole).
      const octx = occluderCanvasRef.current.getContext('2d');
      octx.clearRect(0, 0, mw, mh);
      octx.drawImage(personCanvasRef.current, 0, 0);
      octx.globalCompositeOperation = 'destination-out';
      octx.drawImage(torsoCanvasRef.current, 0, 0);
      octx.globalCompositeOperation = 'source-over';

      // Draw the already-mirrored CameraFeed canvas through the rounded cover
      // rect, then keep only the occluder region. Everything outside stays
      // transparent → shirt shows. The mask spans the full video frame, so it
      // maps through the same rect.
      ctx.drawImage(base, dx, dy, dw, dh);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(occluderCanvasRef.current, dx, dy, dw, dh);
      ctx.globalCompositeOperation = 'source-over';
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, containerRef, segMaskRef, anchorsRef, cameraCanvasRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 15 }}
    />
  );
}
