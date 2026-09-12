import { PoseLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Shared, module-level singletons so the WASM FilesetResolver and the two
// heavy MediaPipe models (pose + hand) are fetched+initialized exactly once and
// reused by every camera session. Toggling the camera off/on (or switching AR
// tabs) is then instant instead of re-downloading and re-initializing each time.
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const HAND_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

let wasmPromise = null;
let posePromise = null;
let handPromise = null;

function getVision() {
  if (!wasmPromise) {
    wasmPromise = FilesetResolver.forVisionTasks(WASM_BASE).catch((err) => {
      wasmPromise = null;
      posePromise = null;
      handPromise = null;
      throw err;
    });
  }
  return wasmPromise;
}

export function getPoseLandmarker() {
  if (!posePromise) {
    posePromise = getVision().then((vision) =>
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: true,
      }),
    );
    posePromise.catch(() => {
      posePromise = null;
      wasmPromise = null;
    });
  }
  return posePromise;
}

export function getHandLandmarker() {
  if (!handPromise) {
    handPromise = getVision().then((vision) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_MODEL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }),
    );
    handPromise.catch(() => {
      handPromise = null;
      wasmPromise = null;
    });
  }
  return handPromise;
}

// Kick off downloading + GPU initialization as soon as the AR tab mounts, so
// activating the camera later is instant instead of hanging on model fetch.
export function warmupMediaPipe() {
  getPoseLandmarker().catch(() => {});
  getHandLandmarker().catch(() => {});
}