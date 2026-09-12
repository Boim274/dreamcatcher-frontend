import { useRef, useCallback } from 'react';

// ---- One Euro Filter tuning ----
// Low-pass with a cutoff that rises with input velocity: tiny jitter at rest is
// strongly smoothed (alpha ≈ OEU alpha at rest) while deliberate movement stays
// responsive. This replaces the previous velocity-adaptive EMA.
const OEU_MIN_CUTOFF = 0.5;   // Hz — rest-state low-pass cutoff (calmer at rest)
const OEU_BETA = 0.03;        // how strongly velocity raises the cutoff

// ---- Motion safety ----
const MAX_STEP = 0.06;        // max per-frame landmark step (~16 ms frame)
const FRAME_MS = 16.7;

// ---- Body model configuration ----
const SHOULDER_WEIGHT = 0.55; // torso height weight in the scale measure
const WIDTH_WEIGHT = 0.45;    // torso width weight in the scale measure
const BODY_REF = 0.31;        // reference torso measure at selfie distance → bodyScale 1
const SCALE_MIN = 0.5;
const SCALE_MAX = 2.2;
const ROLL_MAX = 0.22;        // ±~13° torso roll
const ROLL_DEADZONE = 0.04;   // ~2.3° — raw angles below this count as 0 (upright)
const ROLL_ALPHA = 0.09;      // fixed, heavier damping for rotation
const DEPTH_MAX = 0.05;       // max perspective-depth influence
const DECAY_ALPHA = 0.06;     // speed of decay toward neutral when tracking is lost

// ---- Body orientation (yaw/pitch) ----
// The shirt's 3D root rotation follows the torso plane built from the world
// landmarks (shoulders + hips). Yaw is derived from the shoulder line's
// direction in the camera-X/Z plane; pitch from shoulder-vs-hip depth.
const YAW_SIGN = 1;           // +1 / -1 — flip if the user's turns feel mirrored
const YAW_MAX = 0.9;          // ±~52° cap, well inside MediaPipe's reliable range
const PITCH_MAX = 0.35;       // ±~20° cap on forward/backward tilt
const PITCH_GAIN = 0.5;       // how strongly depth maps to pitch
// Landmark indices reused for world-coordinate orientation (MediaPipe Pose).
const WI_LS = 11, WI_RS = 12, WI_LH = 23, WI_RH = 24;

// ---- Swap / reliability gates ----
// MediaPipe indexes LEFT_SHOULDER/LEFT_HIP as the subject's anatomical left,
// which for a person facing (or away from) the camera always projects to the
// RIGHT side of the raw image, i.e. rs.x - ls.x < 0. If that ordering inverts
// the detection is unreliable (occluded/overlapping joints or a landmark swap)
// and the previous pose is held instead of flipping the shirt.
const SWAP_REJECT_X = 0.0;    // rs.x - ls.x >= this ⇒ impossible shoulder swap
const MIN_SHOULDER_W = 0.03;  // shoulders closer than this ⇒ pose too degenerate
const SWAP_HOLD_MS = 350;     // hold the last good pose for this long on bad frames

const ANCHOR_KEYS = [
  'shoulderCenter', 'leftShoulder', 'rightShoulder',
  'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist',
  'hipCenter', 'leftHip', 'rightHip',
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function dist3d(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ---- One Euro filter primitive (per axis) ----
function makeEuro() {
  return { prev: null, hat: null, dHat: 0, t: 0 };
}

function euro(state, value, t) {
  if (state.prev === null) {
    state.prev = state.hat = value;
    state.dHat = 0;
    state.t = t;
    return value;
  }
  const dt = Math.max(t - state.t, 1e-6);
  const dx = (value - state.prev) / dt;
  const cutoff = OEU_MIN_CUTOFF + OEU_BETA * Math.abs(state.dHat);
  const tau = 1 / (2 * Math.PI * cutoff);
  const alpha = 1 / (1 + tau / dt);
  const hat = alpha * value + (1 - alpha) * state.hat;
  const dHat = alpha * dx + (1 - alpha) * state.dHat;
  state.prev = value;
  state.hat = hat;
  state.dHat = dHat;
  state.t = t;
  return hat;
}

// Neutral pose the shirt decays toward when tracking is lost.
const FALLBACK = {
  shoulderCenter: { x: 0.5, y: 0.35, z: 0 },
  leftShoulder: { x: 0.3, y: 0.35, z: 0 },
  rightShoulder: { x: 0.7, y: 0.35, z: 0 },
  leftElbow: { x: 0.18, y: 0.5, z: 0 },
  rightElbow: { x: 0.82, y: 0.5, z: 0 },
  leftWrist: { x: 0.1, y: 0.62, z: 0 },
  rightWrist: { x: 0.9, y: 0.62, z: 0 },
  hipCenter: { x: 0.5, y: 0.55, z: 0 },
  leftHip: { x: 0.35, y: 0.55, z: 0 },
  rightHip: { x: 0.65, y: 0.55, z: 0 },
  neck: { x: 0.5, y: 0.35, z: 0 },
  chestCenter: { x: 0.5, y: 0.41, z: 0 },
  shoulderWidth: 0.4,
  hipWidth: 0.34,
  torsoHeight: 0.2,
  torsoWidth: 0.37,
  shoulderHalfL: 0.2,
  shoulderHalfR: 0.2,
  yaw: 0,
  pitch: 0,
  bodyAngle: 0,
  bodyScale: 1,
  depthZ: 0,
  visible: false,
};

function deepCopy(src) {
  const out = {};
  for (const k of Object.keys(src)) {
    const v = src[k];
    out[k] = (typeof v === 'object' && v !== null)
      ? { x: v.x, y: v.y, z: v.z ?? 0 }
      : v;
  }
  return out;
}

export default function useShirtTracking(landmarksRef, worldRef) {
  const st = useRef(deepCopy(FALLBACK));
  const filtersRef = useRef({});       // per-landmark One Euro filters (x/y/z)
  const scalarFiltersRef = useRef({}); // per-scalar One Euro filters
  const lastTsRef = useRef(0);
  const lastGoodTsRef = useRef(0);

  const compute = useCallback(() => {
    const cur = st.current;
    const lm = landmarksRef?.current;

    const now = performance.now();
    const dt = clamp(now - lastTsRef.current, 8, 100);
    lastTsRef.current = now;
    const dtNorm = dt / FRAME_MS;
    const stepCap = MAX_STEP * dtNorm;

    const ls = lm?.leftShoulder;
    const rs = lm?.rightShoulder;
    const lh = lm?.leftHip;
    const rh = lm?.rightHip;
    const le = lm?.leftElbow;
    const re = lm?.rightElbow;

    // ---- reliability gate ----
    const hasShoulders = Boolean(ls && rs);
    const shoulderDX = hasShoulders ? rs.x - ls.x : 0;
    const rawShoulderW = hasShoulders ? dist3d(ls, rs) : 0;
    const unreliable =
      !hasShoulders ||
      shoulderDX >= SWAP_REJECT_X ||          // impossible left/right ordering
      rawShoulderW < MIN_SHOULDER_W;          // shoulders fully overlapped

    if (unreliable) {
      // Hold the last good pose briefly so a momentary glitch never snaps the
      // shirt to neutral or flips it; only decay to neutral after a sustained
      // loss so the shirt never freezes mid-body forever.
      if (hasShoulders && now - lastGoodTsRef.current < SWAP_HOLD_MS) {
        return cur;
      }
      for (const k of ANCHOR_KEYS) {
        const fb = FALLBACK[k];
        const c = cur[k];
        c.x += (fb.x - c.x) * DECAY_ALPHA;
        c.y += (fb.y - c.y) * DECAY_ALPHA;
        c.z += (fb.z - c.z) * DECAY_ALPHA;
      }
      cur.bodyAngle += (0 - cur.bodyAngle) * DECAY_ALPHA;
      cur.yaw += (0 - cur.yaw) * DECAY_ALPHA;
      cur.pitch += (0 - cur.pitch) * DECAY_ALPHA;
      cur.depthZ += (0 - cur.depthZ) * DECAY_ALPHA;
      cur.bodyScale += (1 - cur.bodyScale) * DECAY_ALPHA;
      cur.shoulderWidth += (FALLBACK.shoulderWidth - cur.shoulderWidth) * DECAY_ALPHA;
      cur.shoulderHalfL += (FALLBACK.shoulderHalfL - cur.shoulderHalfL) * DECAY_ALPHA;
      cur.shoulderHalfR += (FALLBACK.shoulderHalfR - cur.shoulderHalfR) * DECAY_ALPHA;
      cur.hipWidth += (FALLBACK.hipWidth - cur.hipWidth) * DECAY_ALPHA;
      cur.torsoHeight += (FALLBACK.torsoHeight - cur.torsoHeight) * DECAY_ALPHA;
      cur.torsoWidth += (FALLBACK.torsoWidth - cur.torsoWidth) * DECAY_ALPHA;
      cur.visible = false;

      const dx = Math.abs(cur.shoulderCenter.x - FALLBACK.shoulderCenter.x);
      const dy = Math.abs(cur.shoulderCenter.y - FALLBACK.shoulderCenter.y);
      return (dx < 0.002 && dy < 0.002) ? null : cur;
    }

    lastGoodTsRef.current = now;
    cur.visible = true;

    // ---- One Euro filtering helpers ----
    const smoothPoint = (key, p) => {
      let f = filtersRef.current[key];
      if (!f) {
        f = filtersRef.current[key] = { x: makeEuro(), y: makeEuro(), z: makeEuro() };
      }
      return {
        x: euro(f.x, p.x, now),
        y: euro(f.y, p.y, now),
        z: euro(f.z, p.z ?? 0, now),
      };
    };

    const smoothScalar = (key, value) => {
      let f = scalarFiltersRef.current[key];
      if (!f) f = scalarFiltersRef.current[key] = makeEuro();
      return euro(f, value, now);
    };

    // Hard cap so even the One Euro filter can never teleport a landmark.
    const capped = (dst, p) => {
      const dx = p.x - dst.x;
      const dy = p.y - dst.y;
      const dz = (p.z ?? 0) - dst.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len > stepCap) {
        const s = stepCap / len;
        return { x: dst.x + dx * s, y: dst.y + dy * s, z: dst.z + dz * s };
      }
      return p;
    };

    const decayTo = (dst, target) => {
      dst.x += (target.x - dst.x) * DECAY_ALPHA;
      dst.y += (target.y - dst.y) * DECAY_ALPHA;
      dst.z += (target.z - dst.z) * DECAY_ALPHA;
    };

    // ---- shoulders / hips / elbows (all one-euro smoothed) ----
    const fLs = smoothPoint('leftShoulder', ls);
    const fRs = smoothPoint('rightShoulder', rs);
    cur.leftShoulder.x = fLs.x;
    cur.leftShoulder.y = fLs.y;
    cur.leftShoulder.z = fLs.z;
    cur.rightShoulder.x = fRs.x;
    cur.rightShoulder.y = fRs.y;
    cur.rightShoulder.z = fRs.z;

    // Shirt anchor: midpoint of the two shoulders (filtered).
    const anchor = {
      x: (fLs.x + fRs.x) / 2,
      y: (fLs.y + fRs.y) / 2,
      z: (fLs.z + fRs.z) / 2,
    };
    Object.assign(cur.shoulderCenter, capped(cur.shoulderCenter, anchor));

    // Hips — or derive from the shoulders when not visible.
    let fLh;
    let fRh;
    if (lh && rh) {
      fLh = smoothPoint('leftHip', lh);
      fRh = smoothPoint('rightHip', rh);
    } else {
      const hw = cur.shoulderWidth * 0.85;
      fLh = {
        x: cur.shoulderCenter.x - hw / 2,
        y: cur.shoulderCenter.y + cur.shoulderWidth * 0.9,
        z: cur.shoulderCenter.z,
      };
      fRh = {
        x: cur.shoulderCenter.x + hw / 2,
        y: cur.shoulderCenter.y + cur.shoulderWidth * 0.9,
        z: cur.shoulderCenter.z,
      };
    }
    cur.leftHip.x = fLh.x;
    cur.leftHip.y = fLh.y;
    cur.leftHip.z = fLh.z;
    cur.rightHip.x = fRh.x;
    cur.rightHip.y = fRh.y;
    cur.rightHip.z = fRh.z;

    const hipCenter = {
      x: (fLh.x + fRh.x) / 2,
      y: (fLh.y + fRh.y) / 2,
      z: (fLh.z + fRh.z) / 2,
    };
    Object.assign(cur.hipCenter, capped(cur.hipCenter, hipCenter));

    if (le) {
      const fl = smoothPoint('leftElbow', le);
      cur.leftElbow.x = fl.x;
      cur.leftElbow.y = fl.y;
      cur.leftElbow.z = fl.z;
    } else {
      decayTo(cur.leftElbow, {
        x: cur.shoulderCenter.x - cur.shoulderWidth * 0.6,
        y: cur.shoulderCenter.y + cur.shoulderWidth * 0.4,
        z: cur.shoulderCenter.z,
      });
    }
    if (re) {
      const fr = smoothPoint('rightElbow', re);
      cur.rightElbow.x = fr.x;
      cur.rightElbow.y = fr.y;
      cur.rightElbow.z = fr.z;
    } else {
      decayTo(cur.rightElbow, {
        x: cur.shoulderCenter.x + cur.shoulderWidth * 0.6,
        y: cur.shoulderCenter.y + cur.shoulderWidth * 0.4,
        z: cur.shoulderCenter.z,
      });
    }

    const lw = lm?.leftWrist;
    const rw = lm?.rightWrist;
    if (lw) {
      const flw = smoothPoint('leftWrist', lw);
      cur.leftWrist.x = flw.x;
      cur.leftWrist.y = flw.y;
      cur.leftWrist.z = flw.z;
    } else {
      decayTo(cur.leftWrist, {
        x: cur.shoulderCenter.x - cur.shoulderWidth * 0.7,
        y: cur.shoulderCenter.y + cur.shoulderWidth * 0.5,
        z: cur.shoulderCenter.z,
      });
    }
    if (rw) {
      const frw = smoothPoint('rightWrist', rw);
      cur.rightWrist.x = frw.x;
      cur.rightWrist.y = frw.y;
      cur.rightWrist.z = frw.z;
    } else {
      decayTo(cur.rightWrist, {
        x: cur.shoulderCenter.x + cur.shoulderWidth * 0.7,
        y: cur.shoulderCenter.y + cur.shoulderWidth * 0.5,
        z: cur.shoulderCenter.z,
      });
    }

    // Neck is the shirt's rigid collar anchor (the filtered shoulder midpoint).
    cur.neck.x = cur.shoulderCenter.x;
    cur.neck.y = cur.shoulderCenter.y;
    cur.neck.z = cur.shoulderCenter.z;
    cur.chestCenter.x = lerp(cur.shoulderCenter.x, cur.hipCenter.x, 0.3);
    cur.chestCenter.y = lerp(cur.shoulderCenter.y, cur.hipCenter.y, 0.3);
    cur.chestCenter.z = lerp(cur.shoulderCenter.z, cur.hipCenter.z, 0.3);

    // ---- scalar torso measures (one-euro smoothed) ----
    cur.shoulderWidth = smoothScalar('shoulderWidth', rawShoulderW);
    const rawHipW = (lh && rh) ? dist3d(lh, rh) : rawShoulderW * 0.85;
    cur.hipWidth = smoothScalar('hipWidth', rawHipW);
    const rawTorsoH = dist3d(cur.shoulderCenter, cur.hipCenter);
    cur.torsoHeight = smoothScalar('torsoHeight', rawTorsoH);
    const rawTorsoW = (rawShoulderW + rawHipW) / 2;
    cur.torsoWidth = smoothScalar('torsoWidth', rawTorsoW);

    // Per-side shoulder half-widths: distance from the torso axis to each
    // shoulder tip. These drive the LEFT and RIGHT contour edges independently
    // so an asymmetric/rolling pose shapes each side of the garment on its own
    // (with the whole shirt still centered on the torso axis).
    const shL = dist3d(cur.shoulderCenter, cur.leftShoulder);
    const shR = dist3d(cur.shoulderCenter, cur.rightShoulder);
    cur.shoulderHalfL = smoothScalar('shoulderHalfL', shL);
    cur.shoulderHalfR = smoothScalar('shoulderHalfR', shR);
    // Never let the margins collapse; Clamp to a healthy floor relative to width.
    const shAvg = (cur.shoulderHalfL + cur.shoulderHalfR) / 2;
    cur.shoulderHalfL = clamp(cur.shoulderHalfL, shAvg * 0.7, shAvg * 1.3);
    cur.shoulderHalfR = clamp(cur.shoulderHalfR, shAvg * 0.7, shAvg * 1.3);

    // ---- torso roll (correct orientation + deadzone) ----
    // All three measures describe the SAME roll of the torso in the image plane
    // and are signed so that a positive bodyAngle tilts the shirt's bottom to
    // screen-left (clockwise), which is what the mirrored feed expects. The
    // torso-axis term dominates so genuine turns (which foreshorten shoulders)
    // keep the shirt upright instead of over-rotating it.
    const rollAxis = Math.atan2(
      cur.shoulderCenter.x - cur.hipCenter.x,
      cur.hipCenter.y - cur.shoulderCenter.y,
    );
    const rollShoulder = -Math.atan2(fRs.y - fLs.y, fLs.x - fRs.x);
    const rollHip = (lh && rh)
      ? -Math.atan2(fRh.y - fLh.y, fLh.x - fRh.x)
      : rollShoulder;
    let rawRoll = rollAxis * 0.5 + rollShoulder * 0.3 + rollHip * 0.2;
    if (Math.abs(rawRoll) < ROLL_DEADZONE) rawRoll = 0;

    let dRoll = rawRoll - cur.bodyAngle;
    while (dRoll > Math.PI) dRoll -= 2 * Math.PI;
    while (dRoll < -Math.PI) dRoll += 2 * Math.PI;
    cur.bodyAngle = clamp(cur.bodyAngle + dRoll * ROLL_ALPHA, -ROLL_MAX, ROLL_MAX);

    // Perspective lean from shoulder-vs-hip depth, smoothed and clamped.
    const rawDepth = cur.shoulderCenter.z - cur.hipCenter.z;
    cur.depthZ = clamp(cur.depthZ + (rawDepth - cur.depthZ) * 0.08, -DEPTH_MAX, DEPTH_MAX);

    // ---- 3D body orientation (yaw/pitch) from the torso plane ----
    // Build the torso plane from world landmarks (meter-based, pose-anchored):
    // yaw = direction of the shoulder line in the camera X/Z plane, pitch =
    // forward/back tilt measured from shoulder-vs-hip depth. Falls back to the
    // screen-space `z` landmarks when world coordinates are unavailable.
    const wl = worldRef?.current;
    let rawYaw = cur.yaw;
    let rawPitch = cur.pitch;
    if (wl) {
      const wls = wl[WI_LS];
      const wrs = wl[WI_RS];
      const wlh = wl[WI_LH];
      const wrh = wl[WI_RH];
      if (wls && wrs) {
        const dx = wrs.x - wls.x;
        const dz = wrs.z - wls.z;
        const shLen = Math.hypot(dx, dz);
        if (shLen > 1e-3) rawYaw = clamp(YAW_SIGN * Math.atan2(dz, dx), -YAW_MAX, YAW_MAX);
      }
      if (wlh && wrh && wls && wrs) {
        const shZ = (wls.z + wrs.z) / 2;
        const hpZ = (wlh.z + wrh.z) / 2;
        rawPitch = clamp((shZ - hpZ) * PITCH_GAIN, -PITCH_MAX, PITCH_MAX);
      }
    } else if (ls && rs && lh && rh) {
      const dx = rs.x - ls.x;
      const dz = (rs.z ?? 0) - (ls.z ?? 0);
      const shLen = Math.hypot(dx, dz);
      if (shLen > 1e-3) rawYaw = clamp(YAW_SIGN * Math.atan2(dz, dx), -YAW_MAX, YAW_MAX);
      rawPitch = clamp(((ls.z ?? 0) + (rs.z ?? 0) - (lh.z ?? 0) - (rh.z ?? 0)) * PITCH_GAIN * 0.5, -PITCH_MAX, PITCH_MAX);
    }
    cur.yaw = smoothScalar('yaw', rawYaw);
    cur.pitch = smoothScalar('pitch', rawPitch);

    // Torso-based scale: height (rotation-stable) + width, extra low-passed.
    const torsoMeasure = cur.torsoHeight * SHOULDER_WEIGHT + cur.torsoWidth * WIDTH_WEIGHT;
    const targetScale = clamp(torsoMeasure / BODY_REF, SCALE_MIN, SCALE_MAX);
    cur.bodyScale += (targetScale - cur.bodyScale) * (DECAY_ALPHA * 1.5);

    // Keep anchors inside the frame.
    for (const k of ANCHOR_KEYS) {
      cur[k].x = clamp(cur[k].x, 0.02, 0.98);
      cur[k].y = clamp(cur[k].y, 0.02, 0.98);
    }

    return cur;
  }, [landmarksRef, worldRef]);

  return compute;
}
