import { Plus, X } from 'lucide-react';
import { PRINT_POSITIONS, PRINT_SIZES } from '../../constants/printPlacements';

export default function PrintAreaConfig({ areas, onChange }) {
  const addArea = () => {
    onChange([...areas, { id: Date.now(), positionId: PRINT_POSITIONS[0].id, sizeIdx: 2, repeat: 1 }]);
  };

  const removeArea = (id) => {
    onChange(areas.filter((a) => a.id !== id));
  };

  const updateArea = (id, field, value) => {
    onChange(areas.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  return (
    <div className="space-y-3">
      <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase block">Area Cetak</label>

      {areas.map((area, i) => (
        <div key={area.id} className="bg-ink border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white text-[11px] font-medium">AREA CETAK {i + 1}</span>
            {areas.length > 1 && (
              <button
                onClick={() => removeArea(area.id)}
                className="text-gray hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <label className="text-gray text-[10px] mb-1 block">Posisi Cetak</label>
            <select
              value={area.positionId}
              onChange={(e) => updateArea(area.id, 'positionId', e.target.value)}
              className="w-full bg-dark border border-border rounded-lg px-2.5 py-1.5 text-white text-[12px] outline-none focus:border-fire appearance-none"
            >
              {PRINT_POSITIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray text-[10px] mb-1 block">Ukuran</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRINT_SIZES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => updateArea(area.id, 'sizeIdx', idx)}
                  className={`text-[10px] px-2 py-1.5 rounded-lg border transition-all ${
                    area.sizeIdx === idx
                      ? 'bg-fire text-ink border-fire font-bold'
                      : 'bg-dark text-gray border-border hover:border-fire/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-gray text-[10px]">Ulangi</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateArea(area.id, 'repeat', Math.max(1, (area.repeat || 1) - 1))}
                className="w-6 h-6 rounded-md bg-dark border border-border text-gray hover:text-white hover:border-fire/50 transition-all text-[13px] flex items-center justify-center"
              >
                –
              </button>
              <span className="text-white text-[12px] font-medium w-4 text-center">{area.repeat || 1}×</span>
              <button
                onClick={() => updateArea(area.id, 'repeat', Math.min(10, (area.repeat || 1) + 1))}
                className="w-6 h-6 rounded-md bg-dark border border-border text-gray hover:text-white hover:border-fire/50 transition-all text-[13px] flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addArea}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] text-gray border border-dashed border-border rounded-xl py-2.5 hover:text-fire hover:border-fire/50 transition-all"
      >
        <Plus className="w-3.5 h-3.5" /> Tambah Area Cetak
      </button>
    </div>
  );
}
