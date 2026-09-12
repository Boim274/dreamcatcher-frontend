import { useEffect, useRef } from 'react';
import Icon from '../ui/Icon';

const ROT_DIST = 30;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function norm2(x, y) {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

// Converts a canonical-space angle delta (rad) to degrees and snap to the
// nearest multiple of 90° when close, so users can straighten designs easily.
function applySnap(deg) {
  const n = Math.round(deg / 90) * 90;
  return Math.abs(deg - n) <= 5 ? n : deg;
}

// DOM overlay that renders resize / stretch / rotate handles for the selected
// design. It re-projects the layer quad every frame so the handles stick to
// the fabric while the shirt rotates or zooms. Resize math runs in screen
// space against a fixed anchor (opposite corner / edge) so it stays stable
// regardless of camera angle.
export default function LayerHandles({ rendererApiRef, layer, onPatch, onDuplicate, onFlip, onDelete, onReset }) {
  const layerRef = useRef(layer);
  layerRef.current = layer;
  const apiRef = useRef(rendererApiRef);
  apiRef.current = rendererApiRef;
  const patchRef = useRef(onPatch);
  patchRef.current = onPatch;
  const actionsRef = useRef({ onDuplicate, onFlip, onDelete, onReset });
  actionsRef.current = { onDuplicate, onFlip, onDelete, onReset };

  const wrapRef = useRef(null);
  const cornerRefs = useRef([null, null, null, null]);
  const edgeRefs = useRef([null, null, null, null]);
  const rotRef = useRef(null);
  const lineRef = useRef(null);
  const barRef = useRef(null);
  const dragRef = useRef(null);

  const place = (el, x, y) => {
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  };

  const show = (visible) => {
    if (!wrapRef.current) return;
    wrapRef.current.style.display = visible ? 'block' : 'none';
  };

  useEffect(() => {
    let raf;
    const tick = () => {
      const layer = layerRef.current;
      const h = layer ? apiRef.current.current?.getLayerScreenHandles?.(layer.id) : null;
      if (!layer || !h || !h.valid) {
        show(false);
      } else {
        show(true);
        place(rotRef.current, h.rot.x, h.rot.y);
        place(lineRef.current, h.center.x, h.center.y);
        const len = Math.max(1, Math.hypot(h.rot.x - h.center.x, h.rot.y - h.center.y));
        lineRef.current.style.width = `${len}px`;
        lineRef.current.style.transform = `rotate(${Math.atan2(h.rot.y - h.center.y, h.rot.x - h.center.x)}rad)`;
        h.corners.forEach((c, i) => place(cornerRefs.current[i], c.x, c.y));
        h.edges.forEach((e, i) => place(edgeRefs.current[i], e.x, e.y));
        const bottom = Math.max(...h.corners.map((c) => c.y)) + 10;
        place(barRef.current, h.center.x, bottom);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = (e, kind, index) => {
    e.stopPropagation();
    e.preventDefault();
    const layer = layerRef.current;
    if (!layer) return;
    const h = apiRef.current.current?.getLayerScreenHandles?.(layer.id);
    if (!h || !h.valid) return;
    const rect = wrapRef.current.parentElement.getBoundingClientRect();
    if (kind === 'rotate') {
      const p = apiRef.current.current?.pointerToLayerPlane?.(e.clientX, e.clientY, layer.id);
      if (!p) return;
      dragRef.current = {
        kind,
        baseRotation: layer.rotation || 0,
        startAngle: Math.atan2(p.y - p.cy, p.x - p.cx),
        rect,
      };
    } else if (kind === 'corner') {
      const anchor = h.corners[(index + 2) % 4];
      const dir = norm2(h.corners[index].x - anchor.x, h.corners[index].y - anchor.y);
      dragRef.current = {
        kind,
        index,
        anchor,
        dir,
        base: Math.hypot(h.corners[index].x - anchor.x, h.corners[index].y - anchor.y),
        start: { scale: layer.scale, stretchX: layer.stretchX || 1, stretchY: layer.stretchY || 1 },
        rect,
      };
    } else {
      const opp = (index + 2) % 4;
      const anchor = h.edges[opp];
      const dir = norm2(h.edges[index].x - anchor.x, h.edges[index].y - anchor.y);
      dragRef.current = {
        kind,
        index,
        anchor,
        dir,
        base: Math.hypot(h.edges[index].x - anchor.x, h.edges[index].y - anchor.y),
        start: { scale: layer.scale, stretchX: layer.stretchX || 1, stretchY: layer.stretchY || 1 },
        rect,
      };
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    const layer = layerRef.current;
    if (!d || !layer) return;
    if (d.kind === 'rotate') {
      const p = apiRef.current.current?.pointerToLayerPlane?.(e.clientX, e.clientY, layer.id);
      if (!p) return;
      const delta = ((Math.atan2(p.y - p.cy, p.x - p.cx) - d.startAngle) * 180) / Math.PI;
      let next = (applySnap(d.baseRotation + delta) + 360) % 360;
      if (next > 180) next -= 360;
      patchRef.current(layer.id, { rotation: next });
      return;
    }
    const px = e.clientX - d.rect.left;
    const py = e.clientY - d.rect.top;
    const proj = (px - d.anchor.x) * d.dir.x + (py - d.anchor.y) * d.dir.y;
    const ratio = clamp(proj / d.base, 0.08, 6);
    if (d.kind === 'corner') {
      patchRef.current(layer.id, { scale: clamp(d.start.scale * ratio, 0.05, 2) });
    } else {
      const vertical = d.index === 0 || d.index === 2;
      if (vertical) {
        patchRef.current(layer.id, {
          stretchY: clamp(d.start.stretchY * ratio, 0.15, 4),
          aspectLocked: false,
        });
      } else {
        patchRef.current(layer.id, {
          stretchX: clamp(d.start.stretchX * ratio, 0.15, 4),
          aspectLocked: false,
        });
      }
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  const handleToolbar = (action) => {
    const layer = layerRef.current;
    if (!layer) return;
    if (action === 'duplicate') actionsRef.current.onDuplicate?.(layer.id);
    else if (action === 'flip') actionsRef.current.onFlip?.(layer.id);
    else if (action === 'delete') actionsRef.current.onDelete?.(layer.id);
    else if (action === 'reset') actionsRef.current.onReset?.(layer.id);
  };

  const handleBtn = (refs, i) => (el) => {
    refs.current[i] = el;
  };

  return (
    <div ref={wrapRef} className="absolute inset-0 pointer-events-none" style={{ display: 'none', zIndex: 15 }}>
      <div
        ref={lineRef}
        className="absolute bg-fire/70"
        style={{ height: 1.5, transformOrigin: '0 0', left: 0, top: 0 }}
      />
      <div
        ref={rotRef}
        onPointerDown={(e) => onPointerDown(e, 'rotate', 0)}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-fire text-ink cursor-grab border border-white/40 shadow-lg pointer-events-auto"
        title="Seret untuk memutar"
      >
        <Icon name="rotate-ccw" size={13} />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`c${i}`}
          ref={handleBtn(cornerRefs, i)}
          onPointerDown={(e) => onPointerDown(e, 'corner', i)}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-sm bg-fire border-2 border-white shadow-lg cursor-nwse-resize pointer-events-auto"
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`e${i}`}
          ref={handleBtn(edgeRefs, i)}
          onPointerDown={(e) => onPointerDown(e, 'edge', i)}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-2 h-6 rounded bg-fire/90 border border-white/60 shadow pointer-events-auto ${i === 0 || i === 2 ? 'cursor-ew-resize' : 'cursor-ns-resize'}`}
          style={i === 0 || i === 2 ? { width: 6, height: 26 } : { width: 26, height: 6 }}
        />
      ))}
      <div
        ref={barRef}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -translate-x-1/2 flex items-center gap-0.5 rounded-lg bg-black/80 border border-white/10 p-1 pointer-events-auto"
      >
        {[
          { a: 'duplicate', icon: 'copy', title: 'Duplikat' },
          { a: 'flip', icon: 'refresh-cw', title: 'Pindah sisi (depan/belakang)' },
          { a: 'reset', icon: 'rotate-ccw', title: 'Reset ukuran & posisi' },
          { a: 'delete', icon: 'trash', title: 'Hapus' },
        ].map((b) => (
          <button
            key={b.a}
            type="button"
            onClick={() => handleToolbar(b.a)}
            title={b.title}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray hover:text-white hover:bg-white/10 transition-all"
          >
            <Icon name={b.icon} size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
