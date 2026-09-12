import { useState, useEffect, useRef, useCallback } from 'react';
import { getHandLandmarker } from '../utils/mediapipe';

export const HAND_INDICES = {
  wrist: 0,
  thumb: { mcp: 2, pip: 3, tip: 4 },
  index: { mcp: 5, pip: 6, dip: 7, tip: 8 },
  middle: { mcp: 9, pip: 10, dip: 11, tip: 12 },
  ring: { mcp: 13, pip: 14, dip: 15, tip: 16 },
  pinky: { mcp: 17, pip: 18, dip: 19, tip: 20 },
};

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17], [0, 13], [0, 9],
];

// Finger geometry margin (normalized). Tips must clear their PIP by this much
// to count as extended/folded, so noisy frames don't flip the state.
const FINGER_MARGIN = 0.03;
// Peace requires the gesture in this many of the last N frames to avoid flicker.
const SMOOTH_WINDOW = 5;
const SMOOTH_MIN = 3;
// The React state is only for the UI indicator — update it at most this often.
const STATE_THROTTLE_MS = 150;

export function isPeaceGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const y = (i) => landmarks[i].y;
  const idx = HAND_INDICES;
  const indexExtended = y(idx.index.tip) < y(idx.index.pip) - FINGER_MARGIN;
  const middleExtended = y(idx.middle.tip) < y(idx.middle.pip) - FINGER_MARGIN;
  const ringFolded = y(idx.ring.tip) > y(idx.ring.pip) + FINGER_MARGIN;
  const pinkyFolded = y(idx.pinky.tip) > y(idx.pinky.pip) + FINGER_MARGIN;
  return indexExtended && middleExtended && ringFolded && pinkyFolded;
}

export function drawHandLandmarks(canvas, landmarks) {
  if (!canvas || !landmarks || landmarks.length < 21) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);

  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  for (const [i, j] of HAND_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (a && b) {
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 21; i++) {
    const p = landmarks[i];
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#4ade80';
    ctx.fill();
  }

  ctx.restore();
}

export default function useHandGesture({ videoRef, enabled }) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [hasHand, setHasHand] = useState(false);
  const [isPeace, setIsPeace] = useState(false);
  const handLandmarkerRef = useRef(null);
  // Per-frame hand landmark store (normalized 21-point array) — no React re-renders.
  const handRef = useRef(null);
  // Per-frame smoothed peace boolean consumed by the capture FSM.
  const isPeaceRef = useRef(false);
  const recentPeaceRef = useRef([]);
  const lastResultRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastTsRef = useRef(0);
  const lastUiUpdateRef = useRef(0);

  const isPeaceSmoothed = useCallback((raw) => {
    const window = recentPeaceRef.current;
    window.push(raw);
    if (window.length > SMOOTH_WINDOW) window.shift();
    if (window.length < SMOOTH_MIN) return false;
    return window.filter(Boolean).length >= SMOOTH_MIN;
  }, []);

  useEffect(() => {
    if (!enabled) {
      handLandmarkerRef.current = null;
      setIsModelLoaded(false);
      setHasHand(false);
      setIsPeace(false);
      return;
    }

    let cancelled = false;

    handRef.current = null;
    isPeaceRef.current = false;
    recentPeaceRef.current = [];
    lastResultRef.current = null;
    lastVideoTimeRef.current = -1;
    lastTsRef.current = 0;
    lastUiUpdateRef.current = 0;

    const init = async () => {
      try {
        const handLandmarker = await getHandLandmarker();
        if (cancelled) return;

        handLandmarkerRef.current = handLandmarker;
        setIsModelLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError('Gagal memuat model hand gesture: ' + err.message);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      handLandmarkerRef.current = null;
      setIsModelLoaded(false);
      setHasHand(false);
      setIsPeace(false);
    };
  }, [enabled]);

  const detect = useCallback(() => {
    const hl = handLandmarkerRef.current;
    const video = videoRef?.current;
    if (!hl || !video || video.readyState < 4 || video.videoWidth === 0) return null;

    // Skip redundant inference when rAF ticks outpace new video frames.
    if (video.currentTime === lastVideoTimeRef.current) return lastResultRef.current;
    lastVideoTimeRef.current = video.currentTime;

    // VIDEO mode requires a strictly monotonically increasing timestamp.
    const now = performance.now();
    const ts = now > lastTsRef.current ? now : lastTsRef.current + 1;
    lastTsRef.current = ts;

    let result;
    try {
      result = hl.detectForVideo(video, ts);
    } catch (e) {
      console.warn('Hand detect error:', e);
      return null;
    }

    const lm = result?.landmarks?.[0] ?? null;
    try { result?.close?.(); } catch { /* ignore */ }

    const rawPeace = lm ? isPeaceGesture(lm) : false;
    const peace = isPeaceSmoothed(rawPeace);

    handRef.current = lm ? lm.map((p) => ({ x: p.x, y: p.y, z: p.z })) : null;
    isPeaceRef.current = peace;
    lastResultRef.current = lm;

    // Throttled React state update — used only for the debug/status indicators.
    if (now - lastUiUpdateRef.current >= STATE_THROTTLE_MS) {
      lastUiUpdateRef.current = now;
      setHasHand(!!lm);
      setIsPeace(peace);
    }

    return lm;
  }, [videoRef, isPeaceSmoothed]);

  return {
    handRef,
    isPeaceRef,
    isModelLoaded,
    error,
    hasHand,
    isPeace,
    detect,
  };
}
