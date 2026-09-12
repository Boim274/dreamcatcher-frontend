import { useEffect, useRef } from 'react';
import {
  Shape, PlaneGeometry, ShapeGeometry, BoxGeometry, Box3, Vector2, Vector3, Mesh, Group, Scene,
  PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight,
  MeshStandardMaterial, Raycaster,
  LineSegments, LineBasicMaterial, EdgesGeometry, MeshBasicMaterial,
  DoubleSide, FrontSide, CanvasTexture, SRGBColorSpace, MathUtils, Euler, Quaternion,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  PRINT_POSITIONS, PRINT_SIZES, CM_TO_PX, CM_TO_PX_Y, BODY_CM_W, BODY_CM_H,
} from '../../constants/printPlacements';

// ---- Model registry: id -> GLB path (kept local so ARTryOnTab stays clean) ----
// low_poly is the only supported model: a single closed T-shirt shell (upright,
// Y-up) used across the whole studio. Its front/back halves are split
// automatically by assignBakeUvs (back-facing faces land on u ∈ [0.5,1]) and AR
// renders it as a thin shell.
const SHIRT_MODEL_SOURCES = {
  low_poly: '/models/t-shirt_low_poly.glb',
};

// Per-model hints for models that export in an unusual orientation, which
// meshes belong to the front/back surface (used by AR to show only the side
// facing the camera), and drop coincident duplicate sheets that cause
// z-fighting. Mesh names are the GLB node names captured during loadGLB. The
// low_poly shell needs none of these: it is upright and fully closed, so every
// face defaults to sideHint 'both'.
const SHIRT_MODEL_CONFIG = {
  low_poly: {},
};

// ---- Camera / projection setup (fixed world units, not body offsets) ----
const VIEW_HEIGHT = 4;
const CAMERA_DISTANCE = 5;
const FOV = 50;
// Actual visible world height at the garment plane (z≈0) for the perspective
// camera above. Mapping normalized body landmarks straight through this keeps
// the AR shirt exactly on the tracked torso at any distance (no manual scale,
// no bodyScale multiplier that double-counts the pose): 1 normalized unit =
// SHIRT_VIEW_HEIGHT world units = one camera frame height.
const SHIRT_VIEW_HEIGHT = 2 * CAMERA_DISTANCE * Math.tan(MathUtils.degToRad(FOV / 2));

// Background of the 3D viewport in mockup (static) mode: a neutral light gray.
// AR keeps the renderer transparent so it composites over the live camera feed.
const MOCKUP_BG = 0xe7e9ee;

// ---- Mesh / deformation config ----
const SHAPE_CURVE_SEGMENTS = 32;
const GRID_COLS = 48;          // dense plane segments across the shirt
const GRID_ROWS = 64;          // dense plane segments down the shirt
const SLEEVE_EDGE = 0.18;      // u-fraction occupied by the sleeves
const SLEEVE_TOP_V = 0.92;     // v at which the sleeve attaches at the shoulder
const SLEEVE_BOT_V = 0.60;     // v at which the sleeve hem pulls toward the elbow
const SLEEVE_MIN_V = 0.42;     // below this (waist/hem), sleeve influence must be zero
const COLLAR_LIFT = 0.06;      // collar raised above shoulderCenter, fraction of torsoHeight
const ELBOW_BLEND_MAX = 0.85;  // max influence of the elbow on the sleeve hem
const SLEEVE_LEN = 0.62;       // sleeve hem sits this far along the upper arm (shoulder->elbow)
const FOREARM_GAIN = 0.35;     // how strongly the wrist tilts the sleeve hem with the arm bend
const DECAL_Z_OFFSET = 0.05;   // canonical units the design floats above the garment surface

// ---- World-space print zones ----
// The garment is divided into FRONT/BACK × {body, left sleeve, right sleeve}
// zones purely from its own world-space geometry (no reliance on the model's
// UV). Sleeve zones are the outer x-bands above the armpit line; both values
// are calibrated against the low_poly shirt (a closed single shell).
const SLEEVE_BAND = 0.15;      // u-fraction from each edge that counts as a sleeve
const ARMPIT_V = 0.50;         // below this v the outer-x is shirt side (body), not sleeve
const SLEEVE_POSITION_IDS = new Set(['lengan-kiri', 'lengan-kanan']);

// AR-mode depth profile for GLB garments: instead of keeping their real volume
// (which makes the shirt look like an inflated slab over the 2D body) they are
// collapsed into a thin shell. Dedicated front/back sheets sit flat at a small
// offset; closed single shells keep a thin hint of volume so faces never fight.
const AR_SHEET_Z = 0.04;        // canonical z offset for labeled front/back sheets
const AR_DEPTH_SHELL = 0.15;    // scale factor applied to real depth for "both"-side parts
const BACK_UV_Z = 0.3;          // a triangle is the back half only if its face normal z < -this

// Deformation cage: control rows in shirt-UV space (v = 0 hem → 1 collar).
const CAGE_ROWS = [
  { v: 0.0, key: 'hem' },
  { v: 0.35, key: 'waist' },
  { v: 0.55, key: 'chest' },
  { v: 0.72, key: 'shoulder' },
  { v: 0.95, key: 'neck' },
];

// Per-side contour profile (fractions of each shoulder's half-width). The
// garment tapers per side so it wraps the real torso shape while staying
// centered on the torso axis (the "centered" behavior the user requested).
const WAIST_RATIO = 0.86;
const HEM_RATIO = 0.88;
const NECK_HALF_RATIO = 0.20;
const HALF_FLOOR = 0.7;   // clamp so a single occluded shoulder never spikes a side
const HALF_CEIL = 1.3;
// Fit comfort: the shoulders/chest sit a bit wider than the raw shoulder points
// so the shirt drapes naturally instead of hugging, and the hem hangs slightly
// below the hips (fraction of torsoHeight) for a relaxed, readable length.
const SHOULDER_LOOSE = 1.04;
const HEM_EXTEND = 0.05;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// Lazy GLB cache so switching models never re-downloads.
const glbCache = new Map();

function buildShirtShape() {
  const shape = new Shape();
  const W = 0.6;
  shape.moveTo(-W * 0.85, -W * 1.1);
  shape.lineTo(-W * 0.85, W * 0.35);
  shape.quadraticCurveTo(-W * 0.95, W * 0.55, -W * 1.3, W * 0.65);
  shape.lineTo(-W * 1.3, W * 1.45);
  shape.lineTo(-W * 0.7, W * 1.35);
  shape.lineTo(-W * 0.3, W * 1.2);
  shape.quadraticCurveTo(0, W * 0.95, W * 0.3, W * 1.2);
  shape.lineTo(W * 0.7, W * 1.35);
  shape.lineTo(W * 1.3, W * 1.45);
  shape.lineTo(W * 1.3, W * 0.65);
  shape.quadraticCurveTo(W * 0.95, W * 0.55, W * 0.85, W * 0.35);
  shape.lineTo(W * 0.85, -W * 1.1);
  shape.lineTo(-W * 0.85, -W * 1.1);
  return shape;
}

// Render the shirt silhouette as a black/white alpha mask. The canvas is
// flipped vertically so the collar sits at the top: three's default
// flipY=true samples canvas row 0 at v=1, so hem (ny=0) must be the bottom row.
function buildSilhouetteMask(shape, bbMin, bbMax, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  const pts = shape.getPoints(SHAPE_CURVE_SEGMENTS * 4);
  const w = bbMax.x - bbMin.x;
  const h = bbMax.y - bbMin.y;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const sx = ((pts[i].x - bbMin.x) / w) * size;
    const sy = (1 - (pts[i].y - bbMin.y) / h) * size;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
  return canvas;
}

// Row anchors derived from the tracked body (normalized image space). Each row
// carries an independent LEFT and RIGHT half-width so the shirt can taper to
// the real torso contour per side instead of a single symmetric half-width.
function computeRowAnchors(body) {
  const {
    shoulderCenter, hipCenter, neck, chestCenter,
    shoulderWidth, hipWidth, torsoHeight,
    shoulderHalfL, shoulderHalfR,
  } = body;
  const sL = clamp(shoulderHalfL ?? shoulderWidth * 0.5, 0.02, 0.5);
  const sR = clamp(shoulderHalfR ?? shoulderWidth * 0.5, 0.02, 0.5);
  const sAvg = (sL + sR) / 2;
  const L = clamp(sL, sAvg * HALF_FLOOR, sAvg * HALF_CEIL) * SHOULDER_LOOSE;
  const R = clamp(sR, sAvg * HALF_FLOOR, sAvg * HALF_CEIL) * SHOULDER_LOOSE;
  const neckHalf = sAvg * NECK_HALF_RATIO;
  const hemK = clamp((hipWidth / shoulderWidth) * HEM_RATIO, 0.6, 0.95);
  return {
    hem: { y: hipCenter.y + torsoHeight * HEM_EXTEND, leftH: L * hemK, rightH: R * hemK },
    waist: { y: lerp(hipCenter.y, chestCenter.y, 0.5), leftH: L * WAIST_RATIO, rightH: R * WAIST_RATIO },
    chest: { y: chestCenter.y, leftH: L, rightH: R },
    shoulder: { y: shoulderCenter.y, leftH: L, rightH: R },
    neck: { y: neck.y - torsoHeight * COLLAR_LIFT, leftH: neckHalf, rightH: neckHalf },
  };
}

// Precompute each vertex's cage bracket + eased weights. Garment-space u is
// derived from POSITION (x across the bbox) so it stays full-width [0,1] even
// though the mesh UV is half-packed for the print texture; v uses the UV Y
// (already normalized 0 = hem → 1 = collar for the procedural plane).
function buildCage(geometry) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const minX = geometry.userData.minX;
  const maxX = geometry.userData.maxX;
  const rangeX = (maxX - minX) || 1e-6;
  const cage = [];
  const last = CAGE_ROWS.length - 1;
  for (let i = 0; i < pos.count; i++) {
    const u = clamp((pos.getX(i) - minX) / rangeX, 0, 1);
    const v = clamp(uv.getY(i), 0, 1);
    let k0 = 0;
    let k1 = 1;
    let t = 0;
    if (v <= CAGE_ROWS[0].v) {
      k0 = 0; k1 = 1; t = 0;
    } else if (v >= CAGE_ROWS[last].v) {
      k0 = last - 1; k1 = last; t = 1;
    } else {
      for (let r = 0; r < last; r++) {
        if (v >= CAGE_ROWS[r].v && v <= CAGE_ROWS[r + 1].v) {
          k0 = r;
          k1 = r + 1;
          t = (v - CAGE_ROWS[r].v) / (CAGE_ROWS[r + 1].v - CAGE_ROWS[r].v);
          break;
        }
      }
    }
    cage.push({ u, v, k0, k1, t: t * t * (3 - 2 * t) });
  }
  geometry.userData.cage = cage;
}

// Same cage precomputation but derived from local POSITION. Garment GLBs and
// decal meshes are normalized into canonical space (x centered, y = 0 hem →
// 1 collar), so u = x across the bbox and v = local y.
function buildCageFromPositions(geometry) {
  const pos = geometry.attributes.position;
  const rangeX = (geometry.userData.maxX - geometry.userData.minX) || 1e-6;
  const cage = [];
  const last = CAGE_ROWS.length - 1;
  for (let i = 0; i < pos.count; i++) {
    const u = clamp((pos.getX(i) - geometry.userData.minX) / rangeX, 0, 1);
    const v = clamp(pos.getY(i), 0, 1);
    let k0 = 0;
    let k1 = 1;
    let t = 0;
    if (v <= CAGE_ROWS[0].v) {
      k0 = 0; k1 = 1; t = 0;
    } else if (v >= CAGE_ROWS[last].v) {
      k0 = last - 1; k1 = last; t = 1;
    } else {
      for (let r = 0; r < last; r++) {
        if (v >= CAGE_ROWS[r].v && v <= CAGE_ROWS[r + 1].v) {
          k0 = r;
          k1 = r + 1;
          t = (v - CAGE_ROWS[r].v) / (CAGE_ROWS[r + 1].v - CAGE_ROWS[r].v);
          break;
        }
      }
    }
    cage.push({ u, v, k0, k1, t: t * t * (3 - 2 * t) });
  }
  geometry.userData.cage = cage;
}

// Allocation-free smooth normal computation (reuses preallocated buffers).
function updateNormals(geometry, scratch) {
  const pos = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const index = geometry.index;
  if (!normal) return;

  const acc = geometry.userData.normalScratch;
  acc.fill(0);

  const { vA, vB, vC, ab, cb, n } = scratch;
  const accum = (ia, ib, ic) => {
    vA.fromBufferAttribute(pos, ia);
    vB.fromBufferAttribute(pos, ib);
    vC.fromBufferAttribute(pos, ic);
    ab.subVectors(vB, vA);
    cb.subVectors(vC, vB);
    n.crossVectors(ab, cb);
    const oA = ia * 3;
    const oB = ib * 3;
    const oC = ic * 3;
    acc[oA] += n.x; acc[oA + 1] += n.y; acc[oA + 2] += n.z;
    acc[oB] += n.x; acc[oB + 1] += n.y; acc[oB + 2] += n.z;
    acc[oC] += n.x; acc[oC + 1] += n.y; acc[oC + 2] += n.z;
  };

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      accum(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      accum(i, i + 1, i + 2);
    }
  }

  for (let i = 0; i < pos.count; i++) {
    const o = i * 3;
    const x = acc[o];
    const y = acc[o + 1];
    const z = acc[o + 2];
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    normal.setXYZ(i, x / len, y / len, z / len);
  }
  normal.needsUpdate = true;
}

// Per-vertex cage deformation. Works for the procedural plane (UV cage +
// static z displacements), GLB garments (position-derived cage + real depth),
// and design decals (position-derived cage + fixed lift).
function updateVertices(geometry, body, viewMode, ms, container, scratch) {
  const pos = geometry.attributes.position;
  const cage = geometry.userData.cage;
  const zDisp = geometry.userData.zDisplacements;
  const localZ = geometry.userData.localZ;
  const depthScale = geometry.userData.depthScale || 1;
  const isGlb = geometry.userData.depthMode === 'glb';
  if (!pos || !cage) return;

  const w = container.clientWidth;
  const h = container.clientHeight;
  const aspect = w / h;
  // Landmark rows are normalized to the frame; SHIRT_VIEW_HEIGHT makes that
  // mapping 1:1 with the rendered viewport, so the shirt tracks the body size
  // exactly (grows/shrinks with distance) without any extra bodyScale factor.
  const viewW = aspect * SHIRT_VIEW_HEIGHT * ms;
  const viewH = SHIRT_VIEW_HEIGHT * ms;

  const rows = computeRowAnchors(body);
  const {
    shoulderCenter, hipCenter, shoulderWidth, depthZ,
    leftElbow, rightElbow,
  } = body;

  const cos = Math.cos(body.bodyAngle);
  const sin = Math.sin(body.bodyAngle);
  // Horizontal center = midpoint of the shoulders AND hips so the shirt always
  // hugs the torso axis instead of drifting with the shoulder line alone.
  const cx = lerp(shoulderCenter.x, hipCenter.x, 0.5);
  const cy = lerp(shoulderCenter.y, hipCenter.y, 0.5);

  // LEFT_SHOULDER anchors the left sleeve only, RIGHT_SHOULDER the right one.
  const lShoulder = body.leftShoulder || shoulderCenter;
  const rShoulder = body.rightShoulder || shoulderCenter;

  // Sleeve tips follow the FULL arm direction: the upper-arm line
  // (shoulder -> elbow) sets the sleeve length, then the forearm line
  // (elbow -> wrist) tilts the sleeve hem so a raised/bent arm pulls the
  // sleeve along instead of leaving it hanging straight down.
  const resolveArm = (shoulder, elbow, wrist, side) => {
    const ex = (elbow && elbow.x > 0)
      ? elbow.x
      : shoulder.x + side * shoulderWidth * 0.55;
    const ey = (elbow && elbow.x > 0)
      ? elbow.y
      : shoulder.y + shoulderWidth * 0.4;
    const ulen = Math.hypot(ex - shoulder.x, ey - shoulder.y) || 1e-6;
    const ux = (ex - shoulder.x) / ulen;
    const uy = (ey - shoulder.y) / ulen;
    let fx = ux;
    let fy = uy;
    if (wrist && wrist.x > 0) {
      const wlen = Math.hypot(wrist.x - ex, wrist.y - ey);
      if (wlen > 1e-3) {
        fx = (wrist.x - ex) / wlen;
        fy = (wrist.y - ey) / wlen;
      }
    }
    return { ulen, ux, uy, fx, fy };
  };
  const lArm = resolveArm(lShoulder, leftElbow, body.leftWrist, -1);
  const rArm = resolveArm(rShoulder, rightElbow, body.rightWrist, 1);
  const lsTip = {
    x: lShoulder.x + lArm.ux * lArm.ulen * SLEEVE_LEN,
    y: lShoulder.y + lArm.uy * lArm.ulen * SLEEVE_LEN,
  };
  const rsTip = {
    x: rShoulder.x + rArm.ux * rArm.ulen * SLEEVE_LEN,
    y: rShoulder.y + rArm.uy * rArm.ulen * SLEEVE_LEN,
  };
  const lsFore = { x: lArm.fx * lArm.ulen * FOREARM_GAIN, y: lArm.fy * lArm.ulen * FOREARM_GAIN };
  const rsFore = { x: rArm.fx * rArm.ulen * FOREARM_GAIN, y: rArm.fy * rArm.ulen * FOREARM_GAIN };

  for (let i = 0; i < pos.count; i++) {
    const info = cage[i];
    const u = viewMode === 'back' ? 1 - info.u : info.u;
    const v = info.v;

    const row0 = rows[CAGE_ROWS[info.k0].key];
    const row1 = rows[CAGE_ROWS[info.k1].key];
    let yLocal = lerp(row0.y, row1.y, info.t) - cy;
    // Each row owns independent LEFT and RIGHT edges; a vertex in the left
    // band uses the left-edge curve, the right band the right-edge curve, so
    // the garment tapers/wraps to the real torso contour on each side.
    const leftEdge = lerp(row0.leftH, row1.leftH, info.t);
    const rightEdge = lerp(row0.rightH, row1.rightH, info.t);
    let xLocal;
    if (u < 0.5) xLocal = -leftEdge * (1 - 2 * u);
    else xLocal = rightEdge * (2 * u - 1);

    if (u < SLEEVE_EDGE) {
      const k = 1 - u / SLEEVE_EDGE;
      let vBand = clamp((SLEEVE_TOP_V - v) / (SLEEVE_TOP_V - SLEEVE_BOT_V), 0, 1);
      if (v < SLEEVE_BOT_V) {
        vBand *= clamp((v - SLEEVE_MIN_V) / (SLEEVE_BOT_V - SLEEVE_MIN_V), 0, 1);
      }
      // Forearm tilt: sleeves near the hem also lean toward the wrist so the
      // sleeve opening rotates with the bent arm rather than staying vertical.
      const foreK = clamp((vBand - 0.5) * 2, 0, 1);
      const tipX = lsTip.x + lsFore.x * foreK;
      const tipY = lsTip.y + lsFore.y * foreK;
      let sleeveX = lerp(lShoulder.x - cx, tipX - cx, vBand) * (0.5 + 0.5 * k);
      let sleeveY = (lerp(lShoulder.y, tipY, vBand) - cy) * (0.8 + 0.2 * k);
      const pull = k * vBand * ELBOW_BLEND_MAX;
      sleeveX = lerp(sleeveX, tipX - cx, pull);
      sleeveY = lerp(sleeveY, tipY - cy, pull);
      xLocal = lerp(xLocal, sleeveX, vBand);
      yLocal = lerp(yLocal, sleeveY, vBand);
    } else if (u > 1 - SLEEVE_EDGE) {
      const k = 1 - (1 - u) / SLEEVE_EDGE;
      let vBand = clamp((SLEEVE_TOP_V - v) / (SLEEVE_TOP_V - SLEEVE_BOT_V), 0, 1);
      if (v < SLEEVE_BOT_V) {
        vBand *= clamp((v - SLEEVE_MIN_V) / (SLEEVE_BOT_V - SLEEVE_MIN_V), 0, 1);
      }
      const foreK = clamp((vBand - 0.5) * 2, 0, 1);
      const tipX = rsTip.x + rsFore.x * foreK;
      const tipY = rsTip.y + rsFore.y * foreK;
      let sleeveX = lerp(rShoulder.x - cx, tipX - cx, vBand) * (0.5 + 0.5 * k);
      let sleeveY = (lerp(rShoulder.y, tipY, vBand) - cy) * (0.8 + 0.2 * k);
      const pull = k * vBand * ELBOW_BLEND_MAX;
      sleeveX = lerp(sleeveX, tipX - cx, pull);
      sleeveY = lerp(sleeveY, tipY - cy, pull);
      xLocal = lerp(xLocal, sleeveX, vBand);
      yLocal = lerp(yLocal, sleeveY, vBand);
    }

    const rx = xLocal * cos - yLocal * sin;
    const ry = xLocal * sin + yLocal * cos;

    const nx = cx + rx;
    const ny = cy + ry;
    const dispZ = zDisp ? zDisp[i] || 0 : 0;
    let shellZ;
    if (isGlb) {
      const hint = geometry.userData.sideHint;
      if (hint === 'front') shellZ = AR_SHEET_Z;
      else if (hint === 'back') shellZ = -AR_SHEET_Z;
      else shellZ = (localZ ? localZ[i] * depthScale : 0) * AR_DEPTH_SHELL;
    } else {
      shellZ = dispZ;
    }
    const nz = shellZ + depthZ * (1 - v) * 0.5;

    pos.setXYZ(i, -(nx - 0.5) * viewW, -(ny - 0.5) * viewH, nz * 2);
  }

  pos.needsUpdate = true;
  updateNormals(geometry, scratch);
}

// Normalize a set of garment geometries into canonical shirt space using ONE
// combined bounding box, so small parts (collars, seams) keep their true size:
// hem at y = 0, collar at y = 1, x centered on 0, real depth preserved.
function normalizeGarmentGeometries(geometries, rotateXDeg) {
  if (geometries.length === 0) return;

  const box = new Box3();
  for (const { geometry: g } of geometries) {
    if (rotateXDeg) {
      g.rotateX(MathUtils.degToRad(rotateXDeg));
    }
    g.computeBoundingBox();
    box.min.min(g.boundingBox.min);
    box.max.max(g.boundingBox.max);
  }

  const sizeY = (box.max.y - box.min.y) || 1e-6;
  const scale = 1 / sizeY;
  const sx = -((box.max.x - box.min.x) / 2) * scale;
  const sz = -((box.max.z - box.min.z) / 2) * scale;

  for (const { geometry: g } of geometries) {
    g.translate(-box.min.x, -box.min.y, -box.min.z);
    g.scale(scale, scale, scale);
    g.translate(sx, 0, sz);
  }

  for (const { geometry: g } of geometries) {
    const pos = g.attributes.position;
    const localZ = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      localZ[i] = pos.getZ(i);
    }
    g.userData.localZ = localZ;
    // Pristine copy so static (mockup) mode can undo any deformation the AR
    // mode applied to these cached, shared geometries.
    const nrm = g.attributes.normal;
    g.userData.pristinePositions = new Float32Array(pos.array);
    if (nrm) g.userData.pristineNormals = new Float32Array(nrm.array);
    g.userData.normalScratch = new Float32Array(pos.count * 3);
    g.userData.scratch = {
      vA: new Vector3(), vB: new Vector3(), vC: new Vector3(),
      ab: new Vector3(), cb: new Vector3(), n: new Vector3(),
    };
    g.userData.depthMode = 'glb';
  }

  // Shirt-relative u for every part (sleeves, torso, collar) uses the combined
  // x extent, not each mesh's own bbox.
  let cMinX = Infinity;
  let cMaxX = -Infinity;
  for (const { geometry: g } of geometries) {
    g.computeBoundingBox();
    cMinX = Math.min(cMinX, g.boundingBox.min.x);
    cMaxX = Math.max(cMaxX, g.boundingBox.max.x);
    const maxAbsZ = Math.max(Math.abs(g.boundingBox.min.z), Math.abs(g.boundingBox.max.z));
    g.userData.depthScale = maxAbsZ > 1e-6 ? 0.15 / maxAbsZ : 1;
  }
  for (const { geometry: g } of geometries) {
    g.userData.minX = cMinX;
    g.userData.maxX = cMaxX;
  }
}

// Overwrite each garment geometry's UV with a canonical shirt-print layout:
// u = (x - minX)/spanX, v = y (hem 0 → collar 1). The print texture is packed
// as a 2-w tile: the FRONT design occupies normalized u ∈ [0,0.5] and the BACK
// an design u ∈ [0.5,1] (see bakePrintTexture). Front faces map to the first
// half and back faces to the second half, so each side samples only its own
// design. Safe for GLB garments because their deformation cage is
// position-derived, not UV-based.
//
// The side is decided per TRIANGLE from the model's STORED vertex normals (the
// same direction convention the rest of the app uses: normal z < 0 = back), not
// per vertex and not from a geometric cross product (whose winding can disagree
// with the stored normals and mirror the front/back). A closed shell's curved
// sides/sleeves have vertex normals hovering around z≈0, so a per-vertex sign
// test tears the print where the front half meets the back half. Stamping each
// whole triangle to one half keeps the boundary on clean triangle edges (a
// natural seam) instead. Triangles whose normals point backward enough back
// (average z < -BACK_UV_Z) go to the back half; everything else (sides, sleeve
// fronts, hems) stays in the front half and stays continuous.
function assignBakeUvs(geometries) {
  let minX = Infinity;
  let maxX = -Infinity;
  for (const { geometry } of geometries) {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  const spanX = (maxX - minX) || 1e-6;
  for (const { geometry } of geometries) {
    const pos = geometry.attributes.position;
    const nrm = geometry.attributes.normal;
    const uv = geometry.attributes.uv;
    const index = geometry.index;
    const n = pos.count;
    const us = new Float32Array(n);
    const vs = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      us[i] = (pos.getX(i) - minX) / spanX;
      vs[i] = clamp(pos.getY(i), 0, 1);
    }
    const half = new Uint8Array(n);
    const stamp = (ia, ib, ic) => {
      let back;
      if (nrm) {
        back = nrm.getZ(ia) + nrm.getZ(ib) + nrm.getZ(ic) < -3 * BACK_UV_Z ? 1 : 0;
      } else {
        const vA = new Vector3();
        const vB = new Vector3();
        const vC = new Vector3();
        const ab = new Vector3();
        const ac = new Vector3();
        const faceN = new Vector3();
        vA.fromBufferAttribute(pos, ia);
        vB.fromBufferAttribute(pos, ib);
        vC.fromBufferAttribute(pos, ic);
        ab.subVectors(vB, vA);
        ac.subVectors(vC, vA);
        faceN.crossVectors(ab, ac);
        back = faceN.z < -BACK_UV_Z ? 1 : 0;
      }
      half[ia] = back;
      half[ib] = back;
      half[ic] = back;
    };
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        stamp(index.getX(i), index.getX(i + 1), index.getX(i + 2));
      }
    } else {
      for (let i = 0; i < n; i += 3) {
        stamp(i, i + 1, i + 2);
      }
    }
    for (let i = 0; i < n; i++) {
      uv.setXY(i, (half[i] ? 0.5 : 0) + us[i] * 0.5, vs[i]);
    }
    uv.needsUpdate = true;
  }
}

function loadModel(id) {
  const src = SHIRT_MODEL_SOURCES[id];
  if (!src) return Promise.reject(new Error('Unknown model: ' + id));
  if (glbCache.has(id)) {
    return Promise.resolve(glbCache.get(id));
  }
  const config = SHIRT_MODEL_CONFIG[id] || {};
  const drop = new Set(config.dropMeshNames || []);
  const flatten = (root) => {
    root.updateMatrixWorld(true);
    const geometries = [];
    root.traverse((child) => {
      if (child.isMesh) {
        const name = child.name || '';
        if (drop.has(name)) return;
        const g = child.geometry.clone();
        g.applyMatrix4(child.matrixWorld);
        if (!g.attributes.normal) g.computeVertexNormals();
        geometries.push({ geometry: g, name });
      }
    });
    return geometries;
  };
  const finalize = (geometries) => {
    normalizeGarmentGeometries(geometries, config.rotateX);
    assignBakeUvs(geometries);
    const sides = config.sides || {};
    for (const { geometry, name } of geometries) {
      geometry.userData.sideHint = sides[name] || 'both';
      buildCageFromPositions(geometry);
      geometry.userData.cached = true;
    }
    glbCache.set(id, geometries);
    return geometries;
  };
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(src, (gltf) => {
      try {
        resolve(finalize(flatten(gltf.scene)));
      } catch (err) {
        reject(err);
      }
    }, undefined, reject);
  });
}

// Build the procedural (default) shirt geometry + its silhouette canvas.
// Returns two sheets: a front plane (canonical front UV + shirt
// silhouette via alphaMap) and a back sheet (shape geometry with back-half UV)
// so front/back prints both have a real surface to render on.
function createProceduralGeometry() {
  const shape = buildShirtShape();
  const bbMin = new Vector3(-0.78, -0.66, 0);
  const bbMax = new Vector3(0.78, 0.87, 0);
  const bbW = bbMax.x - bbMin.x;
  const bbH = bbMax.y - bbMin.y;
  const vec = new Vector3();

  const front = new PlaneGeometry(bbW, bbH, GRID_COLS, GRID_ROWS);
  front.translate(0, (bbMin.y + bbMax.y) / 2, 0);

  const fPos = front.attributes.position;
  const fUv = front.attributes.uv;
  for (let i = 0; i < fPos.count; i++) {
    vec.fromBufferAttribute(fPos, i);
    fUv.setXY(i, ((vec.x - bbMin.x) / bbW) * 0.5, (vec.y - bbMin.y) / bbH);
  }
  fUv.needsUpdate = true;

  const fZDisp = new Float32Array(fPos.count);
  for (let i = 0; i < fPos.count; i++) {
    vec.fromBufferAttribute(fPos, i);
    const nx = (vec.x - bbMin.x) / bbW;
    const ny = (vec.y - bbMin.y) / bbH;
    let z = 0;
    if (nx > 0.18 && nx < 0.82 && ny > 0.15 && ny < 0.65) {
      const cxv = (nx - 0.5) * 2;
      const cyv = (ny - 0.4) * 2.5;
      z = 0.25 * Math.cos(cxv * Math.PI / 2.5) * Math.cos(cyv * Math.PI / 2.2);
    }
    if ((nx < 0.15 || nx > 0.85) && ny > 0.35) z = 0.1;
    if (nx > 0.3 && nx < 0.7 && ny > 0.7) z = 0.05;
    fZDisp[i] = z;
  }

  front.userData.zDisplacements = fZDisp;
  front.userData.normalScratch = new Float32Array(fPos.count * 3);
  front.userData.scratch = {
    vA: new Vector3(), vB: new Vector3(), vC: new Vector3(),
    ab: new Vector3(), cb: new Vector3(), n: new Vector3(),
  };
  front.userData.depthMode = 'plane';
  front.userData.sideHint = 'front';
  front.userData.minX = bbMin.x;
  front.userData.maxX = bbMax.x;
  buildCage(front);

  // Back sheet: shirt-shaped (ShapeGeometry) so no silhouette mask is needed,
  // flat, canonical y, and UVs in the back half [0.5,1] for the print texture.
  const back = new ShapeGeometry(shape);
  const bPos = back.attributes.position;
  back.translate((bbMin.x + bbMax.x) / 2, (bbMin.y + bbMax.y) / 2, 0);
  back.translate(0, 0, -0.03);
  const bUv = back.attributes.uv;
  for (let i = 0; i < bPos.count; i++) {
    vec.fromBufferAttribute(bPos, i);
    bUv.setXY(i, 0.5 + 0.5 * ((vec.x - bbMin.x) / bbW), (vec.y - bbMin.y) / bbH);
  }
  bUv.needsUpdate = true;

  const bZDisp = new Float32Array(bPos.count);
  back.userData.zDisplacements = bZDisp;
  back.userData.normalScratch = new Float32Array(bPos.count * 3);
  back.userData.scratch = {
    vA: new Vector3(), vB: new Vector3(), vC: new Vector3(),
    ab: new Vector3(), cb: new Vector3(), n: new Vector3(),
  };
  back.userData.depthMode = 'plane';
  back.userData.sideHint = 'back';
  back.userData.minX = bbMin.x;
  back.userData.maxX = bbMax.x;
  buildCageFromPositions(back);

  return [
    { geometry: front, silhouette: buildSilhouetteMask(shape, bbMin, bbMax) },
    { geometry: back, silhouette: null },
  ];
}

// Resolve the effective WxH in cm for a print area. Explicit widthCm/heightCm
// (used for custom print sizes from the order flow) win over the preset entry.
function resolveAreaSizeCm(area) {
  if (area.widthCm && area.heightCm) return { widthCm: area.widthCm, heightCm: area.heightCm };
  return PRINT_SIZES[area.sizeIdx];
}

// Build a per-area artwork texture (transparent background, design only).
function buildAreaTexture(img, area) {
  const size = resolveAreaSizeCm(area);
  const pos = PRINT_POSITIONS.find((p) => p.id === area.positionId);
  if (!size || !pos) return null;

  const wPx = Math.round(size.widthCm * CM_TO_PX);
  const hPx = Math.round(size.heightCm * CM_TO_PX_Y);
  const canvas = document.createElement('canvas');
  canvas.width = wPx;
  canvas.height = hPx;
  const ctx = canvas.getContext('2d');

  const repeat = Math.max(1, area.repeat || 1);
  if (repeat > 1) {
    const cols = size.widthCm >= size.heightCm ? repeat : 1;
    const rows = size.widthCm >= size.heightCm ? 1 : repeat;
    const cellW = wPx / cols;
    const cellH = hPx / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.drawImage(img, c * cellW, r * cellH, cellW, cellH);
      }
    }
  } else {
    ctx.drawImage(img, 0, 0, wPx, hPx);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// Create a design decal quad in canonical space, placed per print position.
// Back positions (BACK_POSITION_IDS) are placed on the back side (-Z) facing
// away from the camera and flagged so the AR loop only shows them in back view.
// Sleeve positions are anchored to their computed sleeve zone so the decal
// starts centered on the sleeve (the AR cage then deforms it along the arm).
function createDecalMesh(area, texture, depthTest = false, zones, garmentFrame) {
  const size = resolveAreaSizeCm(area);
  const pos = PRINT_POSITIONS.find((p) => p.id === area.positionId);
  if (!size || !pos) return null;

  const isBack = BACK_POSITION_IDS.has(area.positionId);
  const isSleeve = SLEEVE_POSITION_IDS.has(area.positionId);
  const sleeveZone = isSleeve && !isBack ? sleeveZoneFor(area.positionId, zones) : null;
  const hw = (size.widthCm / BODY_CM_W) / 2;
  const hh = (size.heightCm / BODY_CM_H) / 2;
  const geometry = new PlaneGeometry(hw * 2, hh * 2, 8, 8);
  // Back prints must face away from the camera so they read correctly (not
  // mirrored) when the garment is turned around; rotate before translating so
  // the quad stays centered on the requested print position.
  if (isBack) {
    geometry.rotateY(Math.PI);
  }
  if (sleeveZone && garmentFrame) {
    // The decal cage maps u=(x+0.5) across [-0.5,0.5]; translate so the quad's
    // center lands on the sleeve zone's canonical u. The cage v is the raw
    // canonical y, so the zone centroid's y is used directly.
    const u = (sleeveZone.cx - garmentFrame.minX) / garmentFrame.spanX;
    geometry.translate(u - 0.5, sleeveZone.cy, 0);
  } else {
    geometry.translate(pos.uvX - 0.5, pos.uvY, 0);
  }

  const zDisp = new Float32Array(geometry.attributes.position.count);
  zDisp.fill(isBack ? -DECAL_Z_OFFSET : DECAL_Z_OFFSET);
  geometry.userData.zDisplacements = zDisp;
  geometry.userData.depthMode = 'decal';

  // Shirt-relative canonical bounds (garments are normalized to x in [-0.5, 0.5])
  // so the decal lands on the correct body anchors, not just its own quad.
  geometry.userData.minX = -0.5;
  geometry.userData.maxX = 0.5;
  geometry.userData.normalScratch = new Float32Array(geometry.attributes.position.count * 3);
  geometry.userData.scratch = {
    vA: new Vector3(), vB: new Vector3(), vC: new Vector3(),
    ab: new Vector3(), cb: new Vector3(), n: new Vector3(),
  };
  buildCageFromPositions(geometry);

  const material = new MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: DoubleSide,
    roughness: 0.8,
    depthWrite: false,
    depthTest,
  });
  const mesh = new Mesh(geometry, material);
  mesh.userData.isBackPrint = isBack;
  mesh.renderOrder = 5;
  return mesh;
}

function disposeGeometry(geometry) {
  if (geometry) geometry.dispose();
}

// ---- Static (product mockup) mode ----
// When staticMode is on the garment is displayed in its natural geometry (no
// body deformation), framed to fill the view, and rotated freely around Y.
const STATIC_HEIGHT_FRACTION = 0.62; // garment height vs camera view height
const HEIGHTFIELD_SIZE = 128;        // u,v → surface Z resolution
const STATIC_DECAL_OFFSET = 0.04;    // lift above the sampled surface

// Print positions that belong on the back of the garment. These are placed on
// the back surface (min Z) and face -Z so they only show when the shirt is
// rotated to face away from the camera.
const BACK_POSITION_IDS = new Set(['standar-belakang', 'punggung-atas']);

// Frame the garment from its own positions so both GLB and procedural models
// are centered and scaled to a consistent size.
function computeStaticFrame(geometries) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const { geometry } of geometries) {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const spanX = (maxX - minX) || 1e-6;
  const spanY = (maxY - minY) || 1e-6;
  return {
    minX,
    minY,
    spanX,
    spanY,
    scale: (STATIC_HEIGHT_FRACTION * VIEW_HEIGHT) / spanY,
  };
}

// World-space print zones. Classifies every garment vertex by side (mesh hint,
// else normal.z) and by sleeve band (outer x-strip above the armpit line), then
// produces a bbox per zone with a centroid. Zones with no vertices are null.
function computeStaticZones(geometries, frame) {
  const keys = ['body', 'leftSleeve', 'rightSleeve'];
  const zones = { front: {}, back: {} };
  const acc = {};
  for (const side of ['front', 'back']) {
    for (const key of keys) {
      acc[side + key] = {
        minX: Infinity, maxX: -Infinity,
        minY: Infinity, maxY: -Infinity,
        minZ: Infinity, maxZ: -Infinity,
        count: 0,
      };
    }
  }
  const nrmv = new Vector3();
  for (const { geometry } of geometries) {
    const pos = geometry.attributes.position;
    const nrm = geometry.attributes.normal;
    const hint = geometry.userData.sideHint;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const u = (x - frame.minX) / frame.spanX;
      const v = (y - frame.minY) / frame.spanY;
      let side;
      if (hint && hint !== 'both') side = hint;
      else if (nrm) {
        nrmv.fromBufferAttribute(nrm, i);
        side = nrmv.z < 0 ? 'back' : 'front';
      } else {
        side = 'front';
      }
      let key;
      if (v > ARMPIT_V && u < SLEEVE_BAND) key = 'leftSleeve';
      else if (v > ARMPIT_V && u > 1 - SLEEVE_BAND) key = 'rightSleeve';
      else key = 'body';
      const a = acc[side + key];
      if (x < a.minX) a.minX = x;
      if (x > a.maxX) a.maxX = x;
      if (y < a.minY) a.minY = y;
      if (y > a.maxY) a.maxY = y;
      if (z < a.minZ) a.minZ = z;
      if (z > a.maxZ) a.maxZ = z;
      a.count++;
    }
  }
  for (const side of ['front', 'back']) {
    for (const key of keys) {
      const a = acc[side + key];
      if (a.count === 0) {
        zones[side][key] = null;
        continue;
      }
      zones[side][key] = {
        minX: a.minX,
        maxX: a.maxX,
        minY: a.minY,
        maxY: a.maxY,
        minZ: a.minZ,
        maxZ: a.maxZ,
        cx: (a.minX + a.maxX) / 2,
        cy: (a.minY + a.maxY) / 2,
      };
    }
  }
  return zones;
}

// Pick the canonical sleeve zone used to anchor a sleeve print. Sleeve prints
// are front-side only: the printed face of a sleeve is the one visible from the
// front of the garment.
function sleeveZoneFor(positionId, zones) {
  if (!zones || !zones.front) return null;
  if (positionId === 'lengan-kiri') return zones.front.leftSleeve;
  if (positionId === 'lengan-kanan') return zones.front.rightSleeve;
  return null;
}

// Convert a canonical garment-space point (cx, cy) into frame u/v used by the
// surface heightfield and print placement.
function zoneFrameUv(zone, frame) {
  return {
    u: (zone.cx - frame.minX) / frame.spanX,
    v: (zone.cy - frame.minY) / frame.spanY,
  };
}

// Wireframe boxes that visualize the computed zones (debug/calibration only).
const ZONE_DEBUG_COLORS = {
  'front|body': 0x3b82f6,
  'front|leftSleeve': 0xef4444,
  'front|rightSleeve': 0xf59e0b,
  'back|body': 0x22c55e,
  'back|leftSleeve': 0xa855f7,
  'back|rightSleeve': 0x06b6d4,
};

function createZoneOverlay(zones) {
  const group = new Group();
  for (const side of ['front', 'back']) {
    for (const key of ['body', 'leftSleeve', 'rightSleeve']) {
      const zone = zones[side][key];
      if (!zone) continue;
      const w = (zone.maxX - zone.minX) || 0.01;
      const h = (zone.maxY - zone.minY) || 0.01;
      const d = (zone.maxZ - zone.minZ) || 0.01;
      const geo = new BoxGeometry(w, h, d);
      const box = new LineSegments(
        new EdgesGeometry(geo),
        new LineBasicMaterial({ color: ZONE_DEBUG_COLORS[`${side}|${key}`], transparent: true, opacity: 0.9 }),
      );
      box.position.set(zone.cx, zone.cy, (zone.minZ + zone.maxZ) / 2);
      box.renderOrder = 99;
      group.add(box);
    }
  }
  return group;
}

// Two-sided surface heightfields: front = max Z, back = min Z per u,v bin, in
// the same space the print positions use so decals sit on the fabric. Bins with
// no garment vertex stay 0 (garment mid-plane).
function buildSurfaceHeightfield(geometries, frame) {
  const size = HEIGHTFIELD_SIZE;
  const front = new Float32Array(size * size);
  const back = new Float32Array(size * size);
  for (const { geometry } of geometries) {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = Math.max(0, Math.min(1, (pos.getX(i) - frame.minX) / frame.spanX));
      const v = Math.max(0, Math.min(1, (pos.getY(i) - frame.minY) / frame.spanY));
      const ix = Math.min(size - 1, Math.floor(u * size));
      const iy = Math.min(size - 1, Math.floor(v * size));
      const z = pos.getZ(i);
      const idx = iy * size + ix;
      if (z > front[idx]) front[idx] = z;
      if (z < back[idx]) back[idx] = z;
    }
  }
  return { front, back };
}

function sampleSurfaceZ(hf, uvX, uvY, side) {
  if (!hf) return 0;
  const size = HEIGHTFIELD_SIZE;
  const ix = Math.min(size - 1, Math.floor(uvX * size));
  const iy = Math.min(size - 1, Math.floor(uvY * size));
  return hf[side][iy * size + ix] || 0;
}

// Decal for static mode: sized/placed relative to the garment's real frame and
// lifted just above the sampled garment surface (front or back) so the design
// sits cleanly on the fabric as a flat print instead of a floating sticker.
// Sleeve positions are anchored to their computed world-space sleeve zone so
// they land on the actual sleeve instead of the extreme canvas edge.
function createStaticDecalMesh(area, texture, frame, hf, depthTest, zones) {
  const size = resolveAreaSizeCm(area);
  const pos = PRINT_POSITIONS.find((p) => p.id === area.positionId);
  if (!size || !pos) return null;

  const isBack = BACK_POSITION_IDS.has(area.positionId);
  const isSleeve = SLEEVE_POSITION_IDS.has(area.positionId);
  const sleeveZone = isSleeve && !isBack ? sleeveZoneFor(area.positionId, zones) : null;
  const anchor = sleeveZone ? zoneFrameUv(sleeveZone, frame) : { u: pos.uvX, v: pos.uvY };

  const hw = (size.widthCm / BODY_CM_W) * (frame.spanX / 2);
  const hh = (size.heightCm / BODY_CM_H) * (frame.spanY / 2);
  const cx = frame.minX + anchor.u * frame.spanX;
  const cy = frame.minY + anchor.v * frame.spanY;
  const lift = isBack ? -STATIC_DECAL_OFFSET : STATIC_DECAL_OFFSET;

  const geometry = new PlaneGeometry(hw * 2, hh * 2);
  // Back prints must face away from the camera so they read correctly (not
  // mirrored) when the garment is turned around.
  if (isBack) {
    geometry.rotateY(Math.PI);
  }

  const surf = sampleSurfaceZ(hf, anchor.u, anchor.v, isBack ? 'back' : 'front');
  geometry.translate(cx, cy, surf + lift);

  const material = new MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: DoubleSide,
    roughness: 0.7,
    depthWrite: false,
    depthTest,
  });
  const mesh = new Mesh(geometry, material);
  mesh.renderOrder = 5;
  return mesh;
}

// ---- Free design-layer system (Mockup Editor) ----
// A design layer is an individual print placed anywhere on the shirt using a
// free UV coordinate (position_x/position_y), a width fraction (scale), an
// in-plane rotation (degrees) and a side (front/back). Layers are composited
// into the garment's material texture (see bakePrintTexture) so they sit ON
// the fabric; the per-layer objects kept here are only a hidden pick quad
// (click-to-select) and the selected-layer border.
function computeLayerPlacement(layer, frame, hf) {
  const isBack = layer.side === 'back';
  const cx = frame.minX + layer.position_x * frame.spanX;
  const cy = frame.minY + layer.position_y * frame.spanY;
  const surf = sampleSurfaceZ(hf, layer.position_x, layer.position_y, isBack ? 'back' : 'front');
  const lift = isBack ? -STATIC_DECAL_OFFSET : STATIC_DECAL_OFFSET;
  return { cx, cy, surf, lift, isBack };
}

// Effective half-extents of a design layer in canonical units. `scale` is the
// uniform base (fraction of the frame width); stretchX/stretchY (default 1)
// allow independent horizontal/vertical sizing; height derives from the image
// aspect unless stretched.
function layerHalfExtents(layer, aspect, frame) {
  const w = (layer.scale * (layer.stretchX || 1) * frame.spanX) / 2;
  const h = (w / (aspect || 1)) * (layer.stretchY || 1);
  return { hw: w, hh: h };
}

// Canonical-unit → cm factors derived from the front body print zone, so preset
// sizes ("9 cm", "A5", ...) follow the same convention as the order flow.
function computeCmFactors(frame, zones) {
  const body = zones?.front?.body;
  const bodyW = body && body.maxX > body.minX ? body.maxX - body.minX : frame.spanX * 0.7;
  const bodyH = body && body.maxY > body.minY ? body.maxY - body.minY : frame.spanY * 0.85;
  return {
    spanX: frame.spanX,
    spanY: frame.spanY,
    factorX: bodyW / BODY_CM_W,
    factorY: bodyH / BODY_CM_H,
    bodyW,
    bodyH,
  };
}

// Live on-canvas size of a layer in cm (front body convention).
function layerCmSize(layer, aspect, frame, factors) {
  const widthCan = layer.scale * (layer.stretchX || 1) * frame.spanX;
  const heightCan = (widthCan / (aspect || 1)) * (layer.stretchY || 1);
  return {
    widthCm: widthCan / factors.factorX,
    heightCm: heightCan / factors.factorY,
  };
}

// Hidden quad used only for raycast hit-testing the baked design on the 3D
// shirt (invisible in render, but still intersected by the Raycaster).
function createLayerPickMesh(layer, aspect, frame, hf) {
  const { hw, hh } = layerHalfExtents(layer, aspect, frame);
  const { cx, cy, surf, lift, isBack } = computeLayerPlacement(layer, frame, hf);

  const geometry = new PlaneGeometry(hw * 2, hh * 2);
  geometry.rotateZ(MathUtils.degToRad(layer.rotation));
  if (isBack) geometry.rotateY(Math.PI);

  const mesh = new Mesh(geometry, new MeshBasicMaterial({ visible: false }));
  mesh.userData.layerId = layer.id;
  mesh.userData.layerSide = isBack ? 'back' : 'front';
  mesh.position.set(cx, cy, surf + lift);
  mesh.visible = false;
  return mesh;
}

// Border around the currently selected layer so its outline is visible against
// the garment in both front and back views.
function createLayerOutline(layer, aspect, frame, hf) {
  const { hw, hh } = layerHalfExtents(layer, aspect, frame);
  const { cx, cy, surf, lift, isBack } = computeLayerPlacement(layer, frame, hf);

  const geometry = new PlaneGeometry(hw * 2 * 1.06, hh * 2 * 1.06);
  geometry.rotateZ(MathUtils.degToRad(layer.rotation));
  if (isBack) geometry.rotateY(Math.PI);

  const outline = new LineSegments(
    new EdgesGeometry(geometry),
    new LineBasicMaterial({ color: 0xff8a00, transparent: true, opacity: 0.95 }),
  );
  outline.userData.layerId = layer.id;
  outline.position.set(cx, cy, surf + lift);
  outline.renderOrder = 6;
  outline.visible = false;
  return outline;
}

function repositionLayerEntry(entry, layer, frame, hf) {
  const { cx, cy, surf, lift } = computeLayerPlacement(layer, frame, hf);
  if (entry.pickMesh) entry.pickMesh.position.set(cx, cy, surf + lift);
  if (entry.outline) entry.outline.position.set(cx, cy, surf + lift);
}

// Print texture resolution (per half): the combined canvas is 2×W wide so the
// front design occupies normalized u∈[0,0.5] and the back design u∈[0.5,1].
const PRINT_TEX_H = 2048;
const PRINT_TEX_MAX_W = 4096;

export default function ShirtRenderer({
  anchors,
  anchorsRef,
  shirtColor = '#ec4a96',
  containerRef,
  texture,
  printAreas = [],
  designLayers,
  selectedLayerId,
  rendererApiRef,
  manualScale = 1,
  viewMode = 'front',
  modelSrc = 'default',
  rotationYRef,
  decalDepthTest = false,
  staticMode = false,
  zoomRef,
  debugZones = false,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const raycasterRef = useRef(null);
  const animRef = useRef(null);
  const internalAnchorsRef = useRef(null);
  const viewModeRef = useRef('front');
  const manualScaleRef = useRef(1);

  const groupRef = useRef(null);
  const garmentMeshesRef = useRef([]);
  const garmentMaterialsRef = useRef([]);
  const decalMeshesRef = useRef([]);
  const layerDecalRef = useRef(new Map());
  const layerImageRef = useRef(new Map());
  const zoneOverlayRef = useRef(null);
  const debugZonesRef = useRef(false);
  const printTextureRef = useRef(null);
  const printCanvasRef = useRef(null);
  const printDirtyRef = useRef(false);
  const printLastBakeRef = useRef(0);
  const bgRemovedCache = useRef(new Map());
  // Per-URL image cache for the design decals so multiple print areas each get
  // their own artwork (area.imageUrl) without re-decoding the same image.
  const decalImageCacheRef = useRef(new Map());
  const decalImageReqRef = useRef(new Map());
  const failedDecalUrlsRef = useRef(new Set());
  const shirtColorRef = useRef(shirtColor);
  const propsRef = useRef({ texture, printAreas, designLayers });
  const modelSrcRef = useRef(modelSrc);
  const rotationYRefLocal = useRef(rotationYRef);
  const zoomRefLocal = useRef(zoomRef);
  const staticModeRef = useRef(staticMode);
  const selectedLayerRef = useRef(selectedLayerId);

  const activeAnchorsRef = anchorsRef || internalAnchorsRef;

  useEffect(() => {
    if (anchors !== undefined) activeAnchorsRef.current = anchors;
  }, [anchors, activeAnchorsRef]);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    manualScaleRef.current = manualScale;
  }, [manualScale]);

  useEffect(() => {
    shirtColorRef.current = shirtColor;
    if (staticModeRef.current) {
      // In mockup mode the shirt color is baked into the print texture, so a
      // color change must re-bake rather than tint the material's base color.
      printDirtyRef.current = true;
    } else {
      for (const mat of garmentMaterialsRef.current) {
        mat.color.set(shirtColor);
      }
    }
  }, [shirtColor]);

  useEffect(() => {
    propsRef.current = { texture, printAreas, designLayers, decalDepthTest, staticMode };
  }, [texture, printAreas, designLayers, decalDepthTest, staticMode]);

  useEffect(() => {
    selectedLayerRef.current = selectedLayerId;
  }, [selectedLayerId]);

  useEffect(() => {
    modelSrcRef.current = modelSrc;
  }, [modelSrc]);

  useEffect(() => {
    rotationYRefLocal.current = rotationYRef || null;
  }, [rotationYRef]);

  useEffect(() => {
    zoomRefLocal.current = zoomRef || null;
  }, [zoomRef]);

  useEffect(() => {
    staticModeRef.current = staticMode;
  }, [staticMode]);

  // Rebuild the optional wireframe overlay visualizing the computed print
  // zones (used to calibrate SLEEVE_BAND/ARMPIT_V against the real model).
  const syncZoneOverlay = () => {
    const group = groupRef.current;
    const old = zoneOverlayRef.current;
    if (old) {
      group?.remove(old);
      old.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      zoneOverlayRef.current = null;
    }
    if (!group || !debugZonesRef.current) return;
    const zones = group.userData.staticZones;
    if (!zones) return;
    const overlay = createZoneOverlay(zones);
    zoneOverlayRef.current = overlay;
    group.add(overlay);
  };

  useEffect(() => {
    debugZonesRef.current = debugZones;
    syncZoneOverlay();
  }, [debugZones]);

  // Ensure a design image is decoded once per URL. Returns the cached
  // HTMLImageElement when ready, or null while it is still loading/failed. Once
  // an image arrives (or fails) it re-runs the current decal rebuild so the
  // affected areas pop into view without re-downloading other artwork.
  const ensureDecalImage = (url, onReady) => {
    const cache = decalImageCacheRef.current;
    if (cache.has(url)) return cache.get(url);
    if (failedDecalUrlsRef.current.has(url)) return null;
    if (decalImageReqRef.current.has(url)) return null;

    decalImageReqRef.current.set(url, true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cache.set(url, img);
      decalImageReqRef.current.delete(url);
      onReady?.();
    };
    img.onerror = () => {
      failedDecalUrlsRef.current.add(url);
      decalImageReqRef.current.delete(url);
      onReady?.();
    };
    img.src = url;
    return null;
  };

  const rebuildDecals = () => {
    const group = groupRef.current;
    if (!group) return;
    const { texture: globalUrl, printAreas: areas, decalDepthTest: depthTest, staticMode } = propsRef.current;

    for (const d of decalMeshesRef.current) {
      group.remove(d);
      disposeGeometry(d.geometry);
      d.material.map?.dispose();
      d.material.dispose();
    }
    decalMeshesRef.current = [];

    const frame = staticMode ? group.userData.staticFrame : null;
    const hf = staticMode ? group.userData.surfaceHeightfield : null;
    const zones = group.userData.staticZones;
    const garmentFrame = group.userData.garmentFrame;
    if (staticMode && !frame) return;

    const list = (areas || []).filter((a) => a.imageUrl || globalUrl);
    if (list.length === 0) return;

    const resolved = [];
    let hasPending = false;
    for (const area of list) {
      const key = area.imageUrl || globalUrl;
      if (failedDecalUrlsRef.current.has(key)) continue;
      const img = ensureDecalImage(key, () => {
        rebuildDecals();
      });
      if (!img) hasPending = true;
      else resolved.push({ area, img });
    }
    if (hasPending) return;

    for (const { area, img } of resolved) {
      const texture = buildAreaTexture(img, area);
      if (!texture) continue;
      const mesh = staticMode
        ? createStaticDecalMesh(area, texture, frame, hf, depthTest, zones)
        : createDecalMesh(area, texture, depthTest, zones, garmentFrame);
      if (mesh) {
        group.add(mesh);
        decalMeshesRef.current.push(mesh);
      }
    }
  };

  const removeLayerEntry = (entry) => {
    const group = groupRef.current;
    if (!group) return;
    if (entry.pickMesh) {
      group.remove(entry.pickMesh);
      disposeGeometry(entry.pickMesh.geometry);
      entry.pickMesh.material.dispose();
      entry.pickMesh = null;
    }
    if (entry.outline) {
      group.remove(entry.outline);
      disposeGeometry(entry.outline.geometry);
      entry.outline.material.dispose();
      entry.outline = null;
    }
  };

  const buildLayerProxies = (entry, layer, frame, hf) => {
    const group = groupRef.current;
    if (!group) return;
    removeLayerEntry(entry);
    entry.pickMesh = createLayerPickMesh(layer, entry.aspect, frame, hf);
    entry.outline = createLayerOutline(layer, entry.aspect, frame, hf);
    group.add(entry.pickMesh);
    group.add(entry.outline);
    entry.params = { ...layer };
    entry.current = layer;
  };

  const ensureLayerImage = (layer) => {
    const cache = layerImageRef.current;
    if (cache.has(layer.image)) return cache.get(layer.image);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    cache.set(layer.image, img);
    img.onload = () => {
      const group = groupRef.current;
      const cur = layerDecalRef.current.get(layer.id);
      if (cur && cur.image === layer.image) {
        cur.aspect = img.naturalWidth / img.naturalHeight || 1;
        if (group?.userData.staticFrame && !cur.pickMesh) {
          buildLayerProxies(cur, cur.current, group.userData.staticFrame, group.userData.surfaceHeightfield);
        }
      }
      printDirtyRef.current = true;
    };
    img.onerror = () => {};
    img.src = layer.image;
    return img;
  };

  const startLayerLoad = (layer, frame, hf) => {
    const entry = {
      id: layer.id,
      image: layer.image,
      aspect: 1,
      pickMesh: null,
      outline: null,
      params: { ...layer },
      current: layer,
    };
    layerDecalRef.current.set(layer.id, entry);
    const img = ensureLayerImage(layer);
    if (img.complete && img.naturalWidth > 0) {
      entry.aspect = img.naturalWidth / img.naturalHeight || 1;
      buildLayerProxies(entry, layer, frame, hf);
    }
  };

  // Remove background from an image by sampling corner pixels as the background
  // color and making matching pixels transparent. Results are cached per source URL.
  const removeBackground = (img, tolerance = 30) => {
    const cached = bgRemovedCache.current.get(img.src);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Sample 4 corner pixels to detect background color
    const corners = [
      data.slice(0, 4),
      data.slice((w - 1) * 4, (w - 1) * 4 + 4),
      data.slice((h - 1) * w * 4, (h - 1) * w * 4 + 4),
      data.slice(data.length - 4, data.length),
    ];
    const bgR = Math.round(corners.reduce((s, c) => s + c[0], 0) / 4);
    const bgG = Math.round(corners.reduce((s, c) => s + c[1], 0) / 4);
    const bgB = Math.round(corners.reduce((s, c) => s + c[2], 0) / 4);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      if (dist < tolerance) data[i + 3] = 0;
    }

    ctx.putImageData(imageData, 0, 0);
    bgRemovedCache.current.set(img.src, canvas);
    return canvas;
  };

  // Re-composite the design layers into the garment's material texture. Front
  // layers are drawn into the front half of the canvas, back layers into the
  // back half (u offset by +1) which only the back-facing surfaces sample.
  const bakePrintTexture = () => {
    const group = groupRef.current;
    if (!group) return;
    const frame = group.userData.staticFrame;
    if (!frame) return;
    const layers = propsRef.current.designLayers || [];

    const aspect = frame.spanX / frame.spanY;
    let W = Math.round(PRINT_TEX_H * aspect);
    W = Math.max(256, Math.min(PRINT_TEX_MAX_W / 2, W));
    const H = PRINT_TEX_H;
    const totalW = W * 2;

    const canvas = (printCanvasRef.current = printCanvasRef.current || document.createElement('canvas'));
    if (canvas.width !== totalW || canvas.height !== H) {
      canvas.width = totalW;
      canvas.height = H;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, totalW, H);
    // Bake the shirt color as the canvas background so the design layers keep
    // their own colors instead of being multiplied (tinted) by the garment
    // color. The material uses a white base color in static mode.
    ctx.fillStyle = shirtColorRef.current || '#ffffff';
    ctx.fillRect(0, 0, totalW, H);

    for (const layer of layers) {
      if (!layer.image) continue;
      const img = layerImageRef.current.get(layer.image);
      if (!img || !img.complete || img.naturalWidth === 0) continue;
      const isBack = layer.side === 'back';
      const imgAspect = img.naturalWidth / img.naturalHeight || 1;
      const w = layer.scale * (layer.stretchX || 1) * W;
      const h = (w / imgAspect) * (layer.stretchY || 1);
      const cx = layer.position_x * W + (isBack ? W : 0);
      const cy = (1 - layer.position_y) * H;
      ctx.save();
      ctx.translate(cx, cy);
      // Back layers are viewed through a 180°Y turn (horizontal reversed on
      // screen), so mirror them around their center here to cancel it out and
      // keep the design readable and aligned with its selection outline.
      if (isBack) ctx.scale(-1, 1);
      ctx.rotate(MathUtils.degToRad(layer.rotation));
      const drawImg = propsRef.current.removeBg ? removeBackground(img) : img;
      ctx.drawImage(drawImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    let tex = printTextureRef.current;
    if (!tex) {
      tex = new CanvasTexture(canvas);
      tex.colorSpace = SRGBColorSpace;
      printTextureRef.current = tex;
    } else {
      tex.image = canvas;
    }
    tex.needsUpdate = true;
  };

  // Keep the layer pick/outline proxies in sync with the designLayers prop and
  // flag the print texture for re-baking.
  const syncLayerDecals = () => {
    const group = groupRef.current;
    if (!group) return;
    const { designLayers: layers = [], staticMode } = propsRef.current;
    if (!staticMode) return;
    const frame = group.userData.staticFrame;
    const hf = group.userData.surfaceHeightfield;
    if (!frame || !hf) return;

    const desired = new Set(layers.map((l) => l.id));
    for (const [id, entry] of layerDecalRef.current) {
      if (!desired.has(id)) {
        removeLayerEntry(entry);
        layerDecalRef.current.delete(id);
      }
    }

    for (const layer of layers) {
      if (!layer.image) continue;
      const entry = layerDecalRef.current.get(layer.id);
      if (!entry) {
        startLayerLoad(layer, frame, hf);
        continue;
      }
      entry.current = layer;
      if (entry.image !== layer.image) {
        removeLayerEntry(entry);
        startLayerLoad(layer, frame, hf);
        continue;
      }
      if (!entry.pickMesh) continue;
      if (
        entry.params.side !== layer.side ||
        entry.params.scale !== layer.scale ||
        entry.params.stretchX !== layer.stretchX ||
        entry.params.stretchY !== layer.stretchY ||
        entry.params.rotation !== layer.rotation
      ) {
        buildLayerProxies(entry, layer, frame, hf);
      } else if (
        entry.params.position_x !== layer.position_x ||
        entry.params.position_y !== layer.position_y
      ) {
        repositionLayerEntry(entry, layer, frame, hf);
        entry.params = { ...layer };
      } else {
        entry.params = { ...layer };
      }
    }
    printDirtyRef.current = true;
  };

  // Scene setup (once).
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !containerRef?.current) return;

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new Scene();
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(FOV, w / h, 0.1, 1000);
    camera.position.z = CAMERA_DISTANCE;
    cameraRef.current = camera;

    const renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(w, h);
    // Cap the render pixel ratio lower on phones so the AR shader + occlusion
    // stay smooth; desktops can afford more sharpness.
    const isMobile =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(max-width: 767px)').matches || 'ontouchstart' in window);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));
    renderer.setClearColor(staticModeRef.current ? MOCKUP_BG : 0x000000, staticModeRef.current ? 1 : 0);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    raycasterRef.current = new Raycaster();

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new DirectionalLight(0xffffff, 1);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);

    const backLight = new DirectionalLight(0xffffff, 0.4);
    backLight.position.set(-1, 0, -2);
    scene.add(backLight);

    const group = new Group();
    groupRef.current = group;
    scene.add(group);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // Scratch objects + persistent pose-quaternion for body-orientation (slerped
    // smoothly so the shirt turns with the torso instead of snapping).
    const _eYaw = new Euler();
    const _qTgt = new Quaternion();
    const _qCur = new Quaternion();
    const AR_YAW_SLERP = 0.18;   // quaternion blend factor per frame
    const AR_PITCH_SCALE = 0.6;  // tame forward/back tilt so the shirt never floats

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);

      const g = groupRef.current;
      const a = activeAnchorsRef.current;
      const vm = viewModeRef.current;
      const ms = manualScaleRef.current;
      const ctr = containerRef?.current;

      if (g && staticModeRef.current) {
        const frame = g.userData.staticFrame;
        if (frame) {
          g.visible = true;
          g.scale.setScalar(frame.scale * (zoomRefLocal.current?.current || 1));
          g.position.set(0, -(frame.minY + frame.spanY / 2) * frame.scale, 0);
          const spin = rotationYRefLocal.current?.current || 0;
          g.rotation.y = (vm === 'back' ? Math.PI : 0) + MathUtils.degToRad(spin);
          // Front layers face +Z (the camera when cos > 0), back layers -Z.
          const cosRot = Math.cos(g.rotation.y);
          const selected = selectedLayerRef.current;
          for (const entry of layerDecalRef.current.values()) {
            if (!entry.pickMesh) continue;
            const isBack = entry.pickMesh.userData.layerSide === 'back';
            const show = isBack ? cosRot < 0 : cosRot >= 0;
            if (entry.outline) {
              entry.outline.visible = show && entry.id === selected;
            }
          }
          // Re-bake the design print texture at most ~once per frame when dirty.
          const now = performance.now();
          if (printDirtyRef.current && now - printLastBakeRef.current > 33) {
            printDirtyRef.current = false;
            printLastBakeRef.current = now;
            bakePrintTexture();
          }
        }
      } else if (g && a && a.visible !== false && ctr && ctr.clientWidth > 0) {
        g.visible = true;
        g.scale.setScalar(1);
        g.position.set(0, 0, 0);
        const spin = rotationYRefLocal.current?.current || 0;
        // Body orientation: base flip (manual front/back toggle + mockup spin)
        // composed with the tracked torso yaw/pitch, slerped so the shirt turns
        // smoothly with the user instead of snapping.
        const baseYaw = (vm === 'back' ? Math.PI : 0) + MathUtils.degToRad(spin);
        _eYaw.set((a?.pitch ?? 0) * AR_PITCH_SCALE, baseYaw + (a?.yaw || 0), 0, 'YXZ');
        _qTgt.setFromEuler(_eYaw);
        _qCur.slerp(_qTgt, AR_YAW_SLERP);
        g.quaternion.copy(_qCur);
        for (const mesh of garmentMeshesRef.current) {
          updateVertices(mesh.geometry, a, vm, ms, ctr, mesh.geometry.userData.scratch);
        }
        // Show only the side of the garment facing the camera so front/back
        // sheets never render as a see-through double layer in AR.
        const showBack = vm === 'back';
        for (const mesh of garmentMeshesRef.current) {
          const hint = mesh.geometry.userData.sideHint;
          mesh.visible = !hint || hint === 'both' || (hint === 'back') === showBack;
        }
        // Match each print to the garment side it belongs to: front prints only
        // in front view, back prints only in back view.
        for (const d of decalMeshesRef.current) {
          d.visible = Boolean(d.userData.isBackPrint) === showBack;
        }
        for (const d of decalMeshesRef.current) {
          updateVertices(d.geometry, a, vm, ms, ctr, d.geometry.userData.scratch);
        }
      } else if (g) {
        g.visible = false;
      }

      renderer.render(scene, camera);
    };
    animate();

    const layerMap = layerDecalRef.current;
    const imgMap = layerImageRef.current;

    return () => {
      cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
      for (const mesh of garmentMeshesRef.current) {
        if (!mesh.geometry.userData.cached) {
          disposeGeometry(mesh.geometry);
        }
      }
      for (const mat of garmentMaterialsRef.current) mat.dispose();
      for (const d of decalMeshesRef.current) {
        disposeGeometry(d.geometry);
        d.material.map?.dispose();
        d.material.dispose();
      }
      for (const entry of layerMap.values()) {
        removeLayerEntry(entry);
      }
      layerMap.clear();
      imgMap.clear();
      if (zoneOverlayRef.current) {
        group.remove(zoneOverlayRef.current);
        zoneOverlayRef.current.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        zoneOverlayRef.current = null;
      }
      printTextureRef.current?.dispose();
      printTextureRef.current = null;
      garmentMeshesRef.current = [];
      garmentMaterialsRef.current = [];
      decalMeshesRef.current = [];
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build/swap the garment when the selected model changes.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    let cancelled = false;

    const apply = (geometries) => {
      if (cancelled) return;
      for (const mesh of garmentMeshesRef.current) {
        group.remove(mesh);
        if (!mesh.geometry.userData.cached) {
          disposeGeometry(mesh.geometry);
        }
      }
      for (const mat of garmentMaterialsRef.current) mat.dispose();
      garmentMeshesRef.current = [];
      garmentMaterialsRef.current = [];

      // Undo any deformation the shared cached geometries may hold from AR so
      // the frame, zones and heightfield are computed from the pristine mesh.
      for (const { geometry } of geometries) {
        const pos = geometry.attributes.position;
        const nrm = geometry.attributes.normal;
        if (geometry.userData.pristinePositions) {
          pos.array.set(geometry.userData.pristinePositions);
          pos.needsUpdate = true;
        }
        if (geometry.userData.pristineNormals && nrm) {
          nrm.array.set(geometry.userData.pristineNormals);
          nrm.needsUpdate = true;
        }
      }
      const frame = computeStaticFrame(geometries);
      group.userData.staticFrame = frame;
      group.userData.garmentFrame = {
        minX: frame.minX,
        minY: frame.minY,
        spanX: frame.spanX,
        spanY: frame.spanY,
      };
      group.userData.staticZones = computeStaticZones(geometries, frame);
      if (staticModeRef.current) {
        group.userData.surfaceHeightfield = buildSurfaceHeightfield(geometries, frame);
        // Bake the design print texture onto the garment material for this frame.
        bakePrintTexture();
        printDirtyRef.current = false;
      } else {
        group.userData.surfaceHeightfield = null;
      }
      syncZoneOverlay();

      // Both mockup and AR render the garment as fully opaque cloth so it reads
      // as a solid piece of clothing. In mockup mode the baked print texture is
      // the material map so designs sit ON the fabric and share its lighting;
      // the map already carries the shirt color as its background, so the base
      // color is white (never multiplied by the garment color again).
      const map = staticModeRef.current ? printTextureRef.current : null;
      const material = new MeshStandardMaterial({
        color: staticModeRef.current ? 0xffffff : shirtColorRef.current,
        map,
        transparent: false,
        opacity: 1,
        side: FrontSide,
        roughness: 0.7,
        metalness: 0.1,
      });
      garmentMaterialsRef.current = [material];

      for (const { geometry, silhouette } of geometries) {
        let meshMaterial = material;
        if (silhouette) {
          const m = new MeshStandardMaterial({
            color: staticModeRef.current ? 0xffffff : shirtColorRef.current,
            map,
            transparent: false,
            opacity: 1,
            side: FrontSide,
            roughness: 0.7,
            metalness: 0.1,
          });
          m.alphaMap = new CanvasTexture(silhouette);
          m.alphaTest = 0.5;
          m.needsUpdate = true;
          garmentMaterialsRef.current.push(m);
          meshMaterial = m;
        }
        const mesh = new Mesh(geometry, meshMaterial);
        group.add(mesh);
        garmentMeshesRef.current.push(mesh);
      }

      // Layers are frame-dependent (uv → surface z): rebuild their pick/outline
      // proxies against the new garment frame.
      for (const [id, entry] of layerDecalRef.current) {
        removeLayerEntry(entry);
        layerDecalRef.current.delete(id);
      }

      rebuildDecals();
      syncLayerDecals();
    };

    if (modelSrc === 'default' || !modelSrc) {
      apply(createProceduralGeometry());
    } else {
      loadModel(modelSrc)
        .then((geometries) => {
          if (!cancelled) apply(geometries.map((g) => ({ geometry: g.geometry, silhouette: null })));
        })
        .catch(() => {
          if (!cancelled) {
            apply(createProceduralGeometry());
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [modelSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild design decals when the texture/areas change.
  useEffect(() => {
    rebuildDecals();
  }, [texture, printAreas]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync free design layers when the layer list changes.
  useEffect(() => {
    syncLayerDecals();
  }, [designLayers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expose a picking API to the parent editor: raycast against the design
  // layers (select) or the garment surface (convert a cursor position into a
  // free UV so a layer can be dragged to a spot on the fabric).
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !rendererApiRef) return;

    const toNdc = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      return new Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
    };

    rendererApiRef.current = {
      getZones: () => {
        const g = groupRef.current;
        return g ? g.userData.staticZones || null : null;
      },
      getFrameFactors: () => {
        const g = groupRef.current;
        const frame = g?.userData.staticFrame;
        if (!frame) return null;
        return { ...computeCmFactors(frame, g.userData.staticZones), minX: frame.minX, minY: frame.minY };
      },
      getLayerMetrics: (layerId) => {
        const g = groupRef.current;
        const frame = g?.userData.staticFrame;
        const entry = layerDecalRef.current.get(layerId);
        if (!frame || !entry) return null;
        const layer = entry.current || entry.params;
        const factors = computeCmFactors(frame, g.userData.staticZones);
        const size = layerCmSize(layer, entry.aspect, frame, factors);
        return {
          aspect: entry.aspect || 1,
          ...factors,
          ...size,
        };
      },
      // Project the selected layer's quad onto the screen every call so the DOM
      // handle overlay can follow it while the shirt rotates/zooms.
      getLayerScreenHandles: (layerId) => {
        const camera = cameraRef.current;
        const g = groupRef.current;
        const entry = layerDecalRef.current.get(layerId);
        if (!camera || !g || !entry) return null;
        const frame = g.userData.staticFrame;
        const hf = g.userData.surfaceHeightfield;
        if (!frame) return null;
        const layer = entry.current || entry.params;
        const { hw, hh } = layerHalfExtents(layer, entry.aspect, frame);
        const { cx, cy, surf, lift, isBack } = computeLayerPlacement(layer, frame, hf);
        const rad = MathUtils.degToRad(layer.rotation || 0);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        g.updateMatrixWorld();
        const proj = (x, y) => {
          const v = new Vector3(x, y, surf + lift).applyMatrix4(g.matrixWorld).project(camera);
          const rect = container.getBoundingClientRect();
          return { x: ((v.x + 1) / 2) * rect.width, y: ((1 - v.y) / 2) * rect.height, z: v.z };
        };
        const corners = [
          proj(cx + -hw * cos - -hh * sin, cy + -hw * sin + -hh * cos),
          proj(cx + hw * cos - -hh * sin, cy + hw * sin + -hh * cos),
          proj(cx + hw * cos - hh * sin, cy + hw * sin + hh * cos),
          proj(cx + -hw * cos - hh * sin, cy + -hw * sin + hh * cos),
        ];
        const center = proj(cx, cy);
        const edges = [
          { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 },
          { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2 },
          { x: (corners[2].x + corners[3].x) / 2, y: (corners[2].y + corners[3].y) / 2 },
          { x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2 },
        ];
        const rot = proj(cx - sin * hh * 1.4, cy + cos * hh * 1.4);
        const onScreen = corners.every((c) => c.z < 1 && c.x > -80 && c.x < container.clientWidth + 80 && c.y > -80 && c.y < container.clientHeight + 80);
        const area = Math.abs(
          (corners[1].x - corners[0].x) * (corners[3].y - corners[0].y)
          - (corners[3].x - corners[0].x) * (corners[1].y - corners[0].y),
        );
        const cosRot = Math.cos(g.rotation.y || 0);
        const visibleSide = isBack ? cosRot < 0 : cosRot >= 0;
        return {
          corners,
          edges,
          center,
          rot,
          valid: onScreen && area > 24 && visibleSide,
        };
      },
      // Intersect the pointer ray with the design's plane (canonical z depth)
      // and return the canonical-space point — used by the rotation handle so
      // it works correctly no matter how the shirt is rotated or zoomed.
      pointerToLayerPlane: (clientX, clientY, layerId) => {
        const camera = cameraRef.current;
        const g = groupRef.current;
        const entry = layerDecalRef.current.get(layerId);
        if (!camera || !g || !entry) return null;
        const frame = g.userData.staticFrame;
        const hf = g.userData.surfaceHeightfield;
        if (!frame) return null;
        const layer = entry.current || entry.params;
        const { cx, cy, surf, lift } = computeLayerPlacement(layer, frame, hf);
        const depth = surf + lift;
        raycasterRef.current.setFromCamera(toNdc(clientX, clientY), camera);
        const ray = raycasterRef.current.ray;
        g.updateMatrixWorld();
        const nWorld = new Vector3(0, 0, 1).transformDirection(g.matrixWorld);
        const pWorld = new Vector3(cx, cy, depth).applyMatrix4(g.matrixWorld);
        const denom = ray.direction.dot(nWorld);
        if (Math.abs(denom) < 1e-6) return null;
        const t = pWorld.clone().sub(ray.origin).dot(nWorld) / denom;
        if (t <= 0) return null;
        const hit = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
        const local = g.worldToLocal(hit);
        return { x: local.x, y: local.y, cx, cy, depth };
      },
      pickLayer: (clientX, clientY) => {
        const camera = cameraRef.current;
        const meshes = [];
        for (const entry of layerDecalRef.current.values()) {
          if (entry.pickMesh) meshes.push(entry.pickMesh);
        }
        if (!camera || meshes.length === 0) return null;
        raycasterRef.current.setFromCamera(toNdc(clientX, clientY), camera);
        const hits = raycasterRef.current.intersectObjects(meshes, false);
        for (const hit of hits) {
          if (hit.object.visible && hit.object.userData.layerId != null) {
            return { layerId: hit.object.userData.layerId };
          }
        }
        return null;
      },
      pickSurfaceUv: (clientX, clientY) => {
        const camera = cameraRef.current;
        if (!camera || garmentMeshesRef.current.length === 0) return null;
        raycasterRef.current.setFromCamera(toNdc(clientX, clientY), camera);
        const hits = raycasterRef.current.intersectObjects(garmentMeshesRef.current, false);
        const hit = hits.find((h) => h.object.visible);
        if (!hit) return null;
        const frame = groupRef.current?.userData.staticFrame;
        if (!frame) return null;
        const local = hit.object.worldToLocal(hit.point.clone());
        const position_x = clamp((local.x - frame.minX) / frame.spanX, 0, 1);
        const position_y = clamp((local.y - frame.minY) / frame.spanY, 0, 1);
        // Decide front/back from the actual face the ray hit (its normal, in the
        // garment's local space) rather than the whole-shirt rotation. That way a
        // drag onto a back-facing sleeve surface really lands on the back side of
        // the shirt/sleeve instead of picking the opposite side from the rotation.
        let side = 'front';
        if (hit.face && hit.face.normal) {
          side = hit.face.normal.z < -BACK_UV_Z ? 'back' : 'front';
        }
        return { position_x, position_y, side };
      },
    };

    return () => {
      if (rendererApiRef) rendererApiRef.current = null;
    };
  }, [rendererApiRef, containerRef]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}
