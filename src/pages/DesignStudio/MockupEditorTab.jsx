import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';

const TSHIRT_COLORS = [
  { id: 'white', label: 'Putih', hex: '#ffffff' },
  { id: 'black', label: 'Hitam', hex: '#111111' },
  { id: 'navy', label: 'Navy', hex: '#1a2744' },
  { id: 'grey', label: 'Abu', hex: '#555555' },
  { id: 'red', label: 'Merah', hex: '#cc2222' },
  { id: 'army', label: 'Army', hex: '#4a5c3a' },
  { id: 'maroon', label: 'Maroon', hex: '#6b1d1d' },
  { id: 'brown', label: 'Coklat', hex: '#5c3d2e' },
];

function TShirtSVG({ color }) {
  return (
    <svg viewBox="0 0 400 480" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="fabric">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="white" surfaceScale="1" result="light">
            <feDistantLight azimuth="45" elevation="55" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>
      </defs>
      <path
        d="M130,30 L110,30 C80,30 60,50 55,70 L25,130 L65,145 L85,105 C90,95 100,90 110,90 L290,90 C300,90 310,95 315,105 L335,145 L375,130 L345,70 C340,50 320,30 290,30 L270,30 C260,15 240,5 200,5 C160,5 140,15 130,30 Z"
        fill={color}
        stroke={color === '#ffffff' ? '#ddd' : '#222'}
        strokeWidth="2"
      />
      <path
        d="M85,105 L65,145 L55,320 C55,335 65,345 80,345 L100,345 L100,440 C100,455 115,465 130,465 L270,465 C285,465 300,455 300,440 L300,345 L320,345 C335,345 345,335 345,320 L335,145 L315,105"
        fill={color}
        stroke={color === '#ffffff' ? '#ddd' : '#222'}
        strokeWidth="2"
      />
      <path
        d="M110,90 C110,70 140,55 200,55 C260,55 290,70 290,90"
        fill="none"
        stroke={color === '#ffffff' ? '#ccc' : '#333'}
        strokeWidth="1.5"
        opacity="0.5"
      />
      <rect x="120" y="120" width="160" height="200" rx="4" fill="none" stroke="#ffffff30" strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />
    </svg>
  );
}

export default function MockupEditorTab({ design, selectedColor, setSelectedColor }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fabricRef = useRef(null);
  const toast = useToast();
  const [canvasReady, setCanvasReady] = useState(false);
  const [exporting, setExporting] = useState(false);

  const initCanvas = useCallback(async () => {
    if (!canvasRef.current || !containerRef.current) return;

    const { Canvas, FabricImage, FabricObject } = await import('fabric');

    if (fabricRef.current) {
      fabricRef.current.dispose();
    }

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = Math.round(w * 1.2);

    const canvas = new Canvas(canvasRef.current, {
      width: w,
      height: h,
      backgroundColor: selectedColor,
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    const addDesign = async (url) => {
      try {
        const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        const maxW = w * 0.45;
        const maxH = h * 0.35;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        img.set({
          left: w / 2,
          top: h * 0.38,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          hasControls: true,
          hasBorders: true,
          cornerColor: '#c8f000',
          cornerStrokeColor: '#c8f000',
          borderColor: '#c8f000',
          cornerSize: 10,
          padding: 4,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      } catch {
        toast.error('Gagal memuat gambar desain');
      }
    };

    if (design?.imageUrl) {
      addDesign(design.imageUrl);
    }

    setCanvasReady(true);
  }, [selectedColor, design?.imageUrl]);

  useEffect(() => {
    initCanvas();
    return () => { fabricRef.current?.dispose(); };
  }, [initCanvas]);

  const handleColorChange = (hex) => {
    setSelectedColor(hex);
    if (fabricRef.current) {
      fabricRef.current.backgroundColor = hex;
      fabricRef.current.renderAll();
    }
  };

  const handleExport = async () => {
    if (!fabricRef.current) return;
    setExporting(true);
    try {
      const dataUrl = fabricRef.current.toDataURL({
        format: 'png',
        multiplier: 2,
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = `mockup-${design?.id || Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Mockup berhasil diunduh!');
    } catch {
      toast.error('Gagal export mockup');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteSelected = () => {
    if (!fabricRef.current) return;
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      fabricRef.current.remove(obj);
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
    }
  };

  const handleZoomIn = () => {
    if (!fabricRef.current) return;
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      obj.scaleX *= 1.15;
      obj.scaleY *= 1.15;
      fabricRef.current.renderAll();
    }
  };

  const handleZoomOut = () => {
    if (!fabricRef.current) return;
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      obj.scaleX *= 0.85;
      obj.scaleY *= 0.85;
      fabricRef.current.renderAll();
    }
  };

  const handleRotate = () => {
    if (!fabricRef.current) return;
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      obj.rotate((obj.angle || 0) + 15);
      fabricRef.current.renderAll();
    }
  };

  if (!design) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Icon name="image" size={64} className="mx-auto text-gray mb-4" />
        <p className="text-gray text-[16px] mb-2">Belum ada desain</p>
        <p className="text-gray text-[13px]">Generate desain di tab AI Generate terlebih dahulu, atau upload desain Anda sendiri.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-heading text-[24px] text-white tracking-[1px] mb-6">MOCKUP EDITOR</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Canvas */}
        <div ref={containerRef} className="relative bg-ink border border-border rounded-xl overflow-hidden flex items-center justify-center min-h-[400px]">
          <canvas ref={canvasRef} />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Design preview */}
          {design.imageUrl && (
            <div>
              <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Desain</label>
              <div className="bg-ink border border-border rounded-xl p-3">
                <img src={design.imageUrl} alt="Design" className="w-full max-h-40 object-contain rounded-lg" />
                <p className="text-gray text-[11px] mt-2 text-center truncate">{design.prompt || 'Desain dari AI'}</p>
              </div>
            </div>
          )}

          {/* T-shirt color */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Warna Kaos</label>
            <div className="grid grid-cols-4 gap-2">
              {TSHIRT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleColorChange(c.hex)}
                  className={`relative w-full aspect-square rounded-lg border-2 transition-all duration-200 ${
                    selectedColor === c.hex ? 'border-fire scale-110' : 'border-border hover:border-gray'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {selectedColor === c.hex && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Icon name="check" size={16} className={c.hex === '#ffffff' || c.hex === '#ffffff' ? 'text-black' : 'text-white'} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tool buttons */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Tools</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleZoomIn}
                className="flex items-center justify-center gap-1.5 bg-ink border border-border rounded-lg py-2.5 text-gray hover:text-white hover:border-fire/50 transition-all text-[12px]">
                <Icon name="zoom-in" size={16} /> Perbesar
              </button>
              <button onClick={handleZoomOut}
                className="flex items-center justify-center gap-1.5 bg-ink border border-border rounded-lg py-2.5 text-gray hover:text-white hover:border-fire/50 transition-all text-[12px]">
                <Icon name="zoom-out" size={16} /> Perkecil
              </button>
              <button onClick={handleRotate}
                className="flex items-center justify-center gap-1.5 bg-ink border border-border rounded-lg py-2.5 text-gray hover:text-white hover:border-fire/50 transition-all text-[12px]">
                <Icon name="refresh-cw" size={16} /> Putar
              </button>
              <button onClick={handleDeleteSelected}
                className="flex items-center justify-center gap-1.5 bg-ink border border-red-500/30 rounded-lg py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-[12px]">
                <Icon name="trash" size={16} /> Hapus
              </button>
            </div>
          </div>

          {/* Export */}
          <button onClick={handleExport} disabled={exporting || !canvasReady}
            className="w-full flex items-center justify-center gap-2 bg-fire text-ink font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50">
            {exporting ? (
              <><div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" /> Exporting...</>
            ) : (
              <><Icon name="download" size={20} /> Export PNG</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
