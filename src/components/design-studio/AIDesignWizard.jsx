import { useState, useEffect } from 'react';
import { aiChatService } from '../../services/aiChatService';
import { useToast } from '../ui/Toast';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import { X, Lightbulb } from 'lucide-react';

const STEP_LABELS = {
  theme: 'Tema',
  audience: 'Audiens',
  style: 'Gaya',
  colors: 'Warna',
  graphics: 'Elemen Grafis',
  typography: 'Tipografi',
  layout: 'Tata Letak',
  print_methods: 'Metode Cetak',
};

const STEP_ORDER = ['theme', 'audience', 'style', 'colors', 'graphics', 'typography', 'layout', 'print_methods'];

export default function AIDesignWizard({ shirtColor, onOptionSelect, initialSelection }) {
  const toast = useToast();
  const [catalog, setCatalog] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selection, setSelection] = useState(initialSelection || {});
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    aiChatService
      .getRecommendations()
      .then((c) => {
        if (!cancelled) setCatalog(c);
      })
      .catch(() => toast.error('Gagal memuat katalog rekomendasi'));
    aiChatService
      .getSuggestions(shirtColor)
      .then((s) => {
        if (!cancelled) setSuggestions(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shirtColor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!catalog) {
    return (
      <div className="bg-ink border border-border rounded-xl p-8 text-center">
        <Spinner size="lg" />
        <p className="text-gray mt-3 text-[12px]">Memuat rekomendasi desain...</p>
      </div>
    );
  }

  const step = STEP_ORDER[stepIndex];
  const options = catalog[step] || [];
  const stepLabel = STEP_LABELS[step] || step;

  const toggleOption = (category, id, multiple) => {
    setSelection((prev) => {
      const cur = prev[category] || [];
      if (!multiple) {
        return { ...prev, [category]: [id] };
      }
      return {
        ...prev,
        [category]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
      };
    });
  };

  const handleContinue = () => {
    const cur = selection[step] || [];
    if (cur.length === 0) {
      toast.error(`Pilih minimal satu opsi untuk "${stepLabel}"`);
      return;
    }
    if (stepIndex < STEP_ORDER.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onOptionSelect?.({ ...selection });
    }
  };

  return (    <div className="bg-ink border border-border rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-fire text-[12px] font-bold tracking-[1px] uppercase">AI Design Recommendation</p>
        <button
          onClick={() => onOptionSelect?.({ ...selection, done: true })}
          className="text-gray hover:text-white transition-all"
          title="Tutup wizard"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {STEP_ORDER.map((s, i) => (
          <button
            key={s}
            onClick={() => setStepIndex(i)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
              i === stepIndex ? 'bg-fire text-ink font-bold' : (selection[s]?.length ? 'bg-fire/15 text-fire' : 'bg-dark text-gray')
            }`}
          >
            {STEP_LABELS[s]}
          </button>
        ))}
      </div>

      <p className="text-white text-[13px] font-semibold mb-2">{stepLabel}</p>

      {/* Options as cards */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = (selection[step] || []).includes(opt.id);
          const isMultiple = step !== 'print_methods' && step !== 'layout';
          return (
            <button
              key={opt.id}
              onClick={() => toggleOption(step, opt.id, isMultiple)}
              className={`text-left bg-dark border rounded-lg p-2.5 transition-all ${
                active ? 'border-fire bg-fire/10' : 'border-border hover:border-gray'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {opt.swatch && (
                  <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: opt.swatch }} />
                )}
                <span className="text-[12px] font-medium text-white">{opt.label}</span>
              </div>
              {opt.desc && <p className="text-gray text-[10px] mt-1 leading-snug">{opt.desc}</p>}
            </button>
          );
        })}
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="flex items-center gap-1.5 text-yellow-400 text-[11px] font-semibold mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Smart Suggestions
          </p>
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="text-yellow-400/90 text-[11px] leading-snug">• {s}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleContinue}
        className="mt-3 w-full flex items-center justify-center gap-2 bg-fire text-ink font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-colors text-[13px]"
      >
        <Icon name="arrow-right" size={18} />
        {stepIndex < STEP_ORDER.length - 1 ? 'Lanjut' : 'Selesai'}
      </button>
    </div>
  );
}