import { useState, useEffect, useRef, useCallback } from 'react';

// Gesture must be held this long before a capture fires (ignores quick noise).
const HOLD_MS = 300;
// While the gesture is held, a new photo is taken every this many ms.
const COOLDOWN_MS = 3000;
// How often the cooldown countdown refreshes its React state.
const COUNTDOWN_THROTTLE_MS = 100;

const STATUS_MESSAGES = {
  idle: '✌️ Tunjukkan tanda peace untuk ambil foto',
  holding: '✌️ Peace terdeteksi…',
  cooldown: 'Foto diambil! Tunggu sebentar…',
};

export { STATUS_MESSAGES };

export default function usePeaceGestureCapture({ enabled, onCapture }) {
  const [status, setStatus] = useState('idle');
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const statusRef = useRef('idle');
  const holdStartRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const lastCountdownRef = useRef(0);
  const onCaptureRef = useRef(onCapture);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  const setStatusSafe = useCallback((next) => {
    statusRef.current = next;
    setStatus(next);
    if (next !== 'cooldown') setCooldownLeft(0);
  }, []);

  // Reset the machine whenever the camera session ends.
  useEffect(() => {
    if (enabled) return;
    statusRef.current = 'idle';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('idle');
    setCooldownLeft(0);
    holdStartRef.current = 0;
    cooldownUntilRef.current = 0;
  }, [enabled]);

  const fireCapture = useCallback((now) => {
    onCaptureRef.current?.();
    cooldownUntilRef.current = now + COOLDOWN_MS;
    setStatusSafe('cooldown');
    setCooldownLeft(COOLDOWN_MS);
    lastCountdownRef.current = now;
  }, [setStatusSafe]);

  const tick = useCallback((peaceNow) => {
    if (!enabled) return;
    const now = performance.now();
    const st = statusRef.current;

    switch (st) {
      case 'idle':
        if (peaceNow) {
          holdStartRef.current = now;
          setStatusSafe('holding');
        }
        break;

      case 'holding':
        if (!peaceNow) {
          holdStartRef.current = 0;
          setStatusSafe('idle');
        } else if (now - holdStartRef.current >= HOLD_MS) {
          fireCapture(now);
        }
        break;

      case 'cooldown': {
        const left = cooldownUntilRef.current - now;
        if (left <= 0) {
          if (peaceNow) {
            // Still holding — take another photo after the interval.
            fireCapture(now);
          } else {
            setStatusSafe('idle');
          }
        } else if (now - lastCountdownRef.current >= COUNTDOWN_THROTTLE_MS) {
          lastCountdownRef.current = now;
          setCooldownLeft(left);
        }
        break;
      }

      default:
        break;
    }
  }, [enabled, setStatusSafe, fireCapture]);

  return { tick, status, cooldownLeft };
}
