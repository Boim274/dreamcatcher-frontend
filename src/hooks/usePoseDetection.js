import { useState, useEffect, useRef, useCallback } from 'react';
import { getPoseLandmarker } from '../utils/mediapipe';

export const LANDMARK_INDICES = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];

// Landmarks below this visibility are dropped so tracking never trusts occluded joints.
const VISIBILITY_MIN = 0.45;
// Key joints used to gate whether the whole pose is trustworthy enough to update.
const CONFIDENCE_POINTS = [11, 12, 13, 14, 23, 24];
const POSE_CONFIDENCE_MIN = 0.5;
// The landmarks React state is only for the UI indicator — update it at most this often.
const STATE_THROTTLE_MS = 150;

export function drawPoseLandmarks(canvas, landmarks) {
  if (!canvas || !landmarks) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);

  ctx.strokeStyle = '#ec4a96';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (const [i, j] of CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (a && b) {
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  for (const idx of Object.values(LANDMARK_INDICES)) {
    const p = landmarks[idx];
    if (p) {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ec4a96';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Debug overlay for the filtered body model cooked by useShirtTracking: draws
// the torso axis + shoulder/hip/neck anchors as a synthetic skeleton on top of
// the live camera feed.
export function drawBodySkeleton(canvas, body) {
  if (!canvas || !body) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);

  const pt = (t) => (t ? { x: t.x * w, y: t.y * h } : null);
  const pts = [
    pt(body.leftShoulder), pt(body.rightShoulder),
    pt(body.leftHip), pt(body.rightHip),
    pt(body.shoulderCenter), pt(body.hipCenter),
  ].filter(Boolean);

  // Torso axis + shoulder/hip lines
  ctx.strokeStyle = '#ec4a96';
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  const sc = pt(body.shoulderCenter);
  const hc = pt(body.hipCenter);
  if (sc && hc) { ctx.moveTo(sc.x, sc.y); ctx.lineTo(hc.x, hc.y); }
  const cex = pt(body.chestCenter);
  if (sc && cex) { ctx.moveTo(sc.x, sc.y); ctx.lineTo(cex.x, cex.y); }
  ctx.stroke();

  // Edge margins (per-side half widths) as a pair of vertical brackets
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const rl = pt(body.leftShoulder);
  const rr = pt(body.rightShoulder);
  if (rl && rr && sc) {
    ctx.moveTo(sc.x, sc.y); ctx.lineTo(rl.x, rl.y); ctx.lineTo(rr.x, rr.y);
  }
  ctx.stroke();

  // Joint dots
  ctx.fillStyle = '#ec4a96';
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

export default function usePoseDetection({ videoRef, enabled }) {
  const [landmarks, setLandmarks] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const poseLandmarkerRef = useRef(null);
  // Per-frame landmark store consumed by useShirtTracking — avoids React re-renders.
  const landmarksRef = useRef(null);
  // All confident landmarks (index -> {x,y,z,visibility}) so tracking can
  // interpolate freely beyond the named subset.
  const rawLandmarksRef = useRef(null);
  // World (meter-based) landmarks for 3D orientation: index -> {x,y,z}.
  const worldLandmarksRef = useRef(null);
  // Per-frame person segmentation mask (Uint8Array + dims) for occlusion — no React state.
  const segMaskRef = useRef(null);
  const lastResultRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastTsRef = useRef(0);
  const lastUiUpdateRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      poseLandmarkerRef.current = null;
      setIsModelLoaded(false);
      setLandmarks(null);
      return;
    }

    let cancelled = false;

    // Reset session refs for a fresh camera session.
    landmarksRef.current = null;
    rawLandmarksRef.current = null;
    worldLandmarksRef.current = null;
    segMaskRef.current = null;
    lastResultRef.current = null;
    lastVideoTimeRef.current = -1;
    lastTsRef.current = 0;
    lastUiUpdateRef.current = 0;

    const init = async () => {
      try {
        const poseLandmarker = await getPoseLandmarker();
        if (cancelled) return;

        poseLandmarkerRef.current = poseLandmarker;
        setIsModelLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError('Gagal memuat model pose detection: ' + err.message);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      poseLandmarkerRef.current = null;
      setIsModelLoaded(false);
      setLandmarks(null);
    };
  }, [enabled]);

  const detect = useCallback(() => {
    const pl = poseLandmarkerRef.current;
    const video = videoRef?.current;
    if (!pl || !video || video.readyState < 4 || video.videoWidth === 0) return null;

    // Skip redundant inference when rAF ticks outpace new video frames.
    if (video.currentTime === lastVideoTimeRef.current) return lastResultRef.current;
    lastVideoTimeRef.current = video.currentTime;

    // VIDEO mode requires a strictly monotonically increasing timestamp.
    const now = performance.now();
    const ts = now > lastTsRef.current ? now : lastTsRef.current + 1;
    lastTsRef.current = ts;

    let result;
    try {
      result = pl.detectForVideo(video, ts);
    } catch (e) {
      console.warn('Pose detect error:', e);
      return null;
    }

    // Extract the person segmentation mask for occlusion (per-frame, no React
    // state). Close the result right away to free the GPU texture/leak counter.
    let seg = null;
    if (result?.segmentationMasks?.length) {
      const mask = result.segmentationMasks[0];
      try {
        const data = mask.getAsUint8Array();
        seg = { data, width: mask.width, height: mask.height };
      } catch (e) {
        console.warn('Segmentation mask readback failed:', e);
      }
    }
    segMaskRef.current = seg;
    try { result?.close?.(); } catch { /* ignore */ }

    const lm = result?.landmarks?.[0];
    if (!lm) {
      lastResultRef.current = null;
      landmarksRef.current = null;
      rawLandmarksRef.current = null;
      worldLandmarksRef.current = null;
      return null;
    }

    // Confidence gate: hold the previous pose when the tracked joints are too uncertain.
    let confSum = 0;
    let confN = 0;
    for (const idx of CONFIDENCE_POINTS) {
      const p = lm[idx];
      if (p) {
        confSum += p.visibility ?? 1;
        confN++;
      }
    }
    if (confN > 0 && confSum / confN < POSE_CONFIDENCE_MIN) {
      return lastResultRef.current;
    }

    // Build the normalized landmark map, dropping low-visibility joints.
    const normalized = {};
    for (const [key, idx] of Object.entries(LANDMARK_INDICES)) {
      const p = lm[idx];
      if (p && (p.visibility ?? 1) >= VISIBILITY_MIN) {
        normalized[key] = { x: p.x, y: p.y, z: p.z };
      }
    }

    // Keep every confident landmark (by MediaPipe index) for virtual landmark
    // interpolation in the tracking hook.
    const raw = {};
    for (let idx = 0; idx < lm.length; idx++) {
      const p = lm[idx];
      if (p && (p.visibility ?? 1) >= VISIBILITY_MIN) {
        raw[idx] = { x: p.x, y: p.y, z: p.z, visibility: p.visibility };
      }
    }

    landmarksRef.current = normalized;
    rawLandmarksRef.current = raw;

    // Expose world (meter) coordinates for 3D body-orientation tracking.
    const worldRaw = {};
    const worldArr = result?.worldLandmarks?.[0];
    if (worldArr) {
      for (let i = 0; i < worldArr.length; i++) {
        const p = worldArr[i];
        if (p) worldRaw[i] = { x: p.x, y: p.y, z: p.z };
      }
    }
    worldLandmarksRef.current = worldRaw;
    lastResultRef.current = lm;

    // Throttled React state update — used only for the debug indicator.
    if (now - lastUiUpdateRef.current >= STATE_THROTTLE_MS) {
      lastUiUpdateRef.current = now;
      setLandmarks(normalized);
    }

    return lm;
  }, [videoRef]);

  return { landmarks, landmarksRef, rawLandmarksRef, worldLandmarksRef, segMaskRef, isModelLoaded, error, detect };
}
