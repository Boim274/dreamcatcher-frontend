import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { designService } from '../../services/designService';
import Spinner from '../../components/ui/Spinner';
import Icon from '../../components/ui/Icon';

export default function Step3DesignUpload() {
  const { design, setDesign, nextStep, prevStep } = useOrderStore();
  const [activeTab, setActiveTab] = useState('upload');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(design.imageUrl);

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return `http://localhost:8000/${path}`;
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    setUploading(true);
    try {
      const sessionId = localStorage.getItem('user_session') || crypto.randomUUID();
      localStorage.setItem('user_session', sessionId);
      
      const response = await designService.upload(file, sessionId);
      const imageUrl = getImageUrl(response.design?.image_url);
      setDesign({
        id: response.design?.id,
        imageUrl: imageUrl,
        isValid: response.design?.is_valid ?? true,
        validationMessage: response.design?.validation_message || 'Upload berhasil',
        type: response.design?.design_type,
      });
      setPreviewUrl(imageUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err.response?.data?.message || err.message || 'Gagal upload desain';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const generateDesign = async () => {
    if (!prompt.trim()) { alert('Masukkan prompt desain'); return; }
    
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
    } catch (err) {
      console.error('Generate failed:', err);
      const msg = err.response?.data?.message || err.message || 'Gagal generate desain';
      alert(msg);
    } finally {
      setGenerating(false);
    }
  };

  const parseValidation = (message) => {
    if (!message) return [];
    return message.split('\n').map((line, i) => ({ text: line.trim(), key: i }));
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Upload / Generate Desain</h2>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${activeTab === 'upload' ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'}`}>
          <Icon name="upload" size={20} /> Upload
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${activeTab === 'ai' ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'}`}>
          <Icon name="zap" size={20} /> AI Generate
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-[#FF6B35] bg-[#FF6B35]/5' : 'border-gray-300'}`}>
          {uploading ? (
            <div className="py-8"><Spinner size="lg" /><p className="mt-4 text-[#6B7280]">Mengupload...</p></div>
          ) : previewUrl ? (
            <div>
              <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-4" />
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0])} className="hidden" />
                <span className="inline-flex items-center gap-2 border-2 border-[#FF6B35] text-[#FF6B35] font-semibold py-2 px-4 rounded-lg hover:bg-[#FF6B35] hover:text-white transition-colors">
                  <Icon name="refresh-cw" size={16} /> Ganti
                </span>
              </label>
            </div>
          ) : (
            <>
              <Icon name="cloud-upload" size={48} />
              <p className="text-[#6B7280] mb-2">Drag & drop gambar di sini</p>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0])} className="hidden" />
                <span className="inline-flex items-center gap-2 bg-[#FF6B35] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#E55A26]">Pilih File</span>
              </label>
              <p className="text-[#6B7280] text-sm mt-4">JPG, PNG (maks. 5MB)</p>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label className="font-medium mb-2 block">Prompt Desain</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Logo naga merah flat vector untuk sablon kaos"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 min-h-[100px] resize-none" />
          </div>
          <button onClick={generateDesign} disabled={generating || !prompt.trim()}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-semibold py-3 rounded-lg hover:bg-[#E55A26] transition-colors disabled:opacity-50">
            {generating ? <><Spinner size="sm" /> Generating...</> : <><Icon name="zap" size={20} /> Generate Desain</>}
          </button>
        </div>
      )}

      {design.id && (
        <div className="mt-6 p-4 bg-[#F8F9FA] rounded-xl">
          <h3 className="font-semibold mb-3">Validasi Desain</h3>
          <div className="space-y-2">
            {parseValidation(design.validationMessage).map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                {item.text.includes('Valid') ? <Icon name="check-circle" size={20} className="text-[#22C55E]" /> : item.text.includes('Perlu') ? <Icon name="alert-triangle" size={20} className="text-[#F59E0B]" /> : <Icon name="info" size={20} className="text-[#6B7280]" />}
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
          <div className={`mt-4 p-3 rounded-lg text-center font-semibold ${design.isValid ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
            {design.isValid ? '✓ SIAP PRODUKSI' : '⚠ PERLU REVISI'}
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-[#FF6B35] text-[#FF6B35] font-semibold py-3 px-6 rounded-lg hover:bg-[#FF6B35] hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={nextStep} disabled={!design.id}
          className="flex items-center gap-2 flex-1 justify-center bg-[#FF6B35] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#E55A26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}