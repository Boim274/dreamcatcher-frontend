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

  return (
    <div className="bg-[#181120]/95 border border-white/10 rounded-2xl p-5 mb-4 shadow-2xl backdrop-blur-md animate-fade-in">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-primary text-[12px] font-bold tracking-wider uppercase">AI Design Recommendation</p>
        </div>
        <button
          onClick={() => onOptionSelect?.({ ...selection, done: true })}
          className="text-gray/70 hover:text-white transition-all p-1 rounded-md hover:bg-white/5"
          title="Tutup wizard"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {STEP_ORDER.map((s, i) => (
          <button
            key={s}
            onClick={() => setStepIndex(i)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
              i === stepIndex
                ? 'btn-gradient-primary text-white font-bold shadow-md shadow-primary/20'
                : selection[s]?.length
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-[#120a1c] border border-white/10 text-gray/80 hover:text-white'
            }`}
          >
            {STEP_LABELS[s]}
          </button>
        ))}
      </div>

      <p className="text-white text-[13px] font-semibold mb-2.5">{stepLabel}</p>

      {/* Options as cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const active = (selection[step] || []).includes(opt.id);
          const isMultiple = step !== 'print_methods' && step !== 'layout';
          return (
            <button
              key={opt.id}
              onClick={() => toggleOption(step, opt.id, isMultiple)}
              className={`text-left bg-[#120a1c] border rounded-xl p-3 transition-all ${
                active
                  ? 'border-primary bg-primary/15 shadow-md shadow-primary/20 ring-1 ring-primary/40'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {opt.swatch && (
                  <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: opt.swatch }} />
                )}
                <span className="text-[12px] font-medium text-white">{opt.label}</span>
              </div>
              {opt.desc && <p className="text-gray/70 text-[10px] mt-1 leading-snug">{opt.desc}</p>}
            </button>
          );
        })}
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <p className="flex items-center gap-1.5 text-yellow-400 text-[11px] font-semibold mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Rekomendasi Cerdas
          </p>
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="text-yellow-300/90 text-[11px] leading-snug">• {s}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleContinue}
        className="btn-gradient-primary mt-4 w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all text-[13px]"
      >
        <Icon name="arrow-right" size={18} />
        {stepIndex < STEP_ORDER.length - 1 ? 'Lanjut' : 'Selesai'}
      </button>
    </div>
  );
}