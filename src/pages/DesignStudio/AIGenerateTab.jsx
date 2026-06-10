import { useState } from 'react';
import { designService } from '../../services/designService';
import { useToast } from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';
import Icon from '../../components/ui/Icon';

const styles = [
  { id: 'minimalis', label: 'Minimalis', desc: 'Bersih & modern' },
  { id: 'bold', label: 'Bold', desc: 'Tegas & mencolok' },
  { id: 'vintage', label: 'Vintage', desc: 'Klasik & retro' },
  { id: 'kartun', label: 'Kartun', desc: 'Lucu & playful' },
  { id: 'tipografi', label: 'Tipografi', desc: 'Teks & huruf' },
];

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  return `${baseUrl}/${path}`;
};

export default function AIGenerateTab({ onDesignReady }) {
  const toast = useToast();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('bold');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.warning('Masukkan deskripsi desain'); return; }
    setGenerating(true);
    setResults([]);
    try {
      const sessionId = localStorage.getItem('user_session') || crypto.randomUUID();
      localStorage.setItem('user_session', sessionId);
      const fullPrompt = `${prompt}, gaya ${selectedStyle}, sablon kaos, background transparan`;
      const response = await designService.generate(fullPrompt, sessionId);
      const imageUrl = getImageUrl(response.design?.image_url);
      const result = {
        id: response.design?.id,
        imageUrl,
        isValid: response.design?.is_valid ?? true,
        type: response.design?.design_type,
        prompt,
      };
      setResults([result]);
      toast.success('Desain berhasil di-generate!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate desain');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseDesign = () => {
    if (selectedResult) {
      onDesignReady(selectedResult);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-heading text-[24px] text-white tracking-[1px] mb-6">AI DESIGN GENERATOR</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div>
          <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Deskripsi Desain</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: Logo naga merah gaya streetwear, tulisan DREAMCATCHER dengan efek gradient..."
            className="w-full px-4 py-3 border border-border bg-ink text-white rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none mb-4" />

          <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Gaya Desain</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
            {styles.map((s) => (
              <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                className={`p-2 rounded-lg text-center transition-all duration-200 ${
                  selectedStyle === s.id
                    ? 'bg-primary text-white'
                    : 'bg-ink border border-border text-gray hover:bg-dark'
                }`}>
                <p className="text-[12px] font-medium">{s.label}</p>
                <p className="text-[10px] opacity-70 hidden sm:block">{s.desc}</p>
              </button>
            ))}
          </div>

          <button onClick={handleGenerate} disabled={generating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 bg-fire text-ink font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50">
            {generating ? (
              <><div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Icon name="zap" size={20} /> Generate Desain</>
            )}
          </button>
        </div>

        {/* Results */}
        <div>
          <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Hasil</label>
          {generating ? (
            <div className="bg-ink border border-border rounded-xl p-12 text-center">
              <Spinner size="lg" />
              <p className="text-gray mt-4">AI sedang membuat desain Anda...</p>
              <p className="text-gray text-[12px] mt-1">Ini biasanya membutuhkan 10-30 detik</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((r, i) => (
                <div key={i} onClick={() => setSelectedResult(r)}
                  className={`bg-ink border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    selectedResult?.id === r.id
                      ? 'border-fire shadow-lg shadow-fire/10'
                      : 'border-border hover:border-fire/50'
                  }`}>
                  <img src={r.imageUrl} alt="AI Design" className="w-full max-h-80 object-contain rounded-lg mb-3" />
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedResult(r); }}
                      className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                        selectedResult?.id === r.id ? 'bg-fire text-ink' : 'bg-border text-white hover:bg-gray-dark'
                      }`}>
                      {selectedResult?.id === r.id ? '✓ Dipilih' : 'Pilih'}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={handleUseDesign} disabled={!selectedResult}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                <Icon name="arrow-right" size={20} /> Lanjut ke Mockup Editor
              </button>
            </div>
          ) : (
            <div className="bg-ink border border-border rounded-xl p-12 text-center">
              <Icon name="zap" size={48} className="mx-auto text-gray mb-4" />
              <p className="text-gray">Masukkan deskripsi dan klik Generate untuk membuat desain</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
