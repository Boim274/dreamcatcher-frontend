import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useToast } from '../../components/ui/Toast';
import { designService } from '../../services/designService';
import Spinner from '../../components/ui/Spinner';
import Icon from '../../components/ui/Icon';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

export default function Step3DesignUpload() {
  const { design, setDesign, nextStep, prevStep } = useOrderStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(design.imageUrl);

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    return `${baseUrl}/${path}`;
  };

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${MAX_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!validateFile(file)) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    setUploading(true);
    setUploadProgress(0);
    try {
      const sessionId = localStorage.getItem('user_session') || crypto.randomUUID();
      localStorage.setItem('user_session', sessionId);

      const interval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const response = await designService.upload(file, sessionId);
      clearInterval(interval);
      setUploadProgress(100);

      const imageUrl = getImageUrl(response.design?.image_url);
      setDesign({
        id: response.design?.id,
        imageUrl: imageUrl,
        isValid: response.design?.is_valid ?? true,
        validationMessage: response.design?.validation_message || 'Upload berhasil',
        type: response.design?.design_type,
      });
      setPreviewUrl(imageUrl);
      toast.success('Desain berhasil diupload');
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err.response?.data?.message || err.message || 'Gagal upload desain';
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const generateDesign = async () => {
    if (!prompt.trim()) {
      toast.warning('Masukkan prompt desain');
      return;
    }

    setGenerating(true);
    try {
      const sessionId = localStorage.getItem('user_session') || crypto.randomUUID();
      localStorage.setItem('user_session', sessionId);

      const response = await designService.generate(prompt, sessionId);
      const imageUrl = getImageUrl(response.design?.image_url);
      setDesign({
        id: response.design?.id,
        imageUrl: imageUrl,
        isValid: response.design?.is_valid ?? true,
        validationMessage: response.design?.validation_message || 'Generate berhasil',
        type: response.design?.design_type,
        prompt,
      });
      setPreviewUrl(imageUrl);
      toast.success('Desain berhasil di-generate');
    } catch (err) {
      console.error('Generate failed:', err);
      const msg = err.response?.data?.message || err.message || 'Gagal generate desain';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const parseValidation = (message) => {
    if (!message) return [];
    return message.split('\n').map((line, i) => ({ text: line.trim(), key: i }));
  };

  return (
    <div className="bg-card border border-border p-6">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">Upload / Generate Desain</h2>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-ink border border-border text-gray hover:bg-dark'}`}>
          <Icon name="upload" size={20} /> Upload
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-ink border border-border text-gray hover:bg-dark'}`}>
          <Icon name="zap" size={20} /> AI Generate
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border'
          }`}
        >
          {uploading ? (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
              <p className="text-white font-medium">Mengupload...</p>
              <div className="w-full bg-border rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-fire rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-gray text-sm mt-2">{uploadProgress}%</p>
            </div>
          ) : previewUrl ? (
            <div>
              <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-xl mb-4" />
              <div className="flex gap-3 justify-center">
                <label className="cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e.target.files[0])} className="hidden" />
                  <span className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold py-2 px-5 rounded-xl hover:bg-primary hover:text-white transition-colors">
                    <Icon name="refresh-cw" size={16} /> Ganti
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <>
              <Icon name="cloud-upload" size={48} className="mx-auto text-gray mb-4" />
              <p className="text-gray mb-2">Drag & drop gambar di sini</p>
              <label className="cursor-pointer">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e.target.files[0])} className="hidden" />
                <span className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors">
                  <Icon name="upload" size={18} /> Pilih File
                </span>
              </label>
              <p className="text-gray text-sm mt-4">JPG, PNG, WebP (maks. 5MB)</p>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Prompt Desain</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Logo naga merah flat vector untuk sablon kaos"
              className="w-full px-4 py-3 border border-border bg-ink text-white rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none" />
          </div>
          <button onClick={generateDesign} disabled={generating || !prompt.trim()}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </>
            ) : (
              <><Icon name="zap" size={20} /> Generate Desain</>
            )}
          </button>
        </div>
      )}

      {design.id && (
        <div className="mt-6 p-4 bg-ink border border-border rounded-xl animate-slide-up">
          <h3 className="font-semibold text-white mb-3">Validasi Desain</h3>
          <div className="space-y-2">
            {parseValidation(design.validationMessage).map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-gray">
                {item.text.includes('Valid') ? <Icon name="check-circle" size={20} className="text-fire" /> : item.text.includes('Perlu') ? <Icon name="alert-triangle" size={20} className="text-warning" /> : <Icon name="info" size={20} className="text-gray" />}
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
          <div className={`mt-4 p-3 rounded-xl text-center font-semibold ${design.isValid ? 'bg-fire/10 text-fire' : 'bg-warning/10 text-warning'}`}>
            {design.isValid ? '✓ SIAP PRODUKSI' : '⚠ PERLU REVISI'}
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={nextStep} disabled={!design.id}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
