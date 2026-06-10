import { useState, useRef } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { designService } from '../../services/designService';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { Upload, Loader2 } from 'lucide-react';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  return `${baseUrl}/${path}`;
};

export default function Step4Design() {
  const { design, setDesign, nextStep, prevStep } = useOrderStore();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File terlalu besar. Maks 5MB');
      return;
    }

    setUploading(true);
    try {
      const session = localStorage.getItem('user_session') || crypto.randomUUID();
      localStorage.setItem('user_session', session);

      const result = await designService.upload(file, session);
      setDesign({
        id: result.design?.id,
        imageUrl: result.design?.image_url,
        isValid: result.design?.is_valid,
        validationMessage: result.design?.validation_message,
        type: 'uploaded',
      });
      toast.success('Desain berhasil diupload!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload desain');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (!design.imageUrl) { toast.warning('Upload desain terlebih dahulu'); return; }
    nextStep();
  };

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">UPLOAD DESAIN</h2>

      <div className="mb-6">
        {design.imageUrl ? (
          <div className="relative">
            <img
              src={getImageUrl(design.imageUrl)}
              alt="Desain"
              className="w-full max-h-80 object-contain bg-ink rounded-xl border border-border"
            />
            <button
              onClick={() => setDesign({ id: null, imageUrl: null, isValid: false, validationMessage: null, type: null })}
              className="absolute top-3 right-3 bg-ink/80 text-white p-2 rounded-full hover:bg-fire transition-colors"
            >
              <Icon name="x" size={16} />
            </button>
            {design.validationMessage && (
              <div className={`mt-3 p-3 rounded-xl text-sm ${design.isValid ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                {design.validationMessage}
              </div>
            )}
          </div>
        ) : (
          <label className="border-2 border-dashed border-border rounded-xl p-12 text-center block cursor-pointer hover:border-primary transition-colors">
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <p className="text-gray text-sm">Mengupload...</p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-gray mb-3" />
                <p className="text-white font-semibold text-sm mb-1">Klik untuk upload desain</p>
                <p className="text-gray text-xs">Format: JPG, PNG (maks. 5MB)</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <div className="flex gap-4">
        <button onClick={prevStep}
          className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleNext}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
