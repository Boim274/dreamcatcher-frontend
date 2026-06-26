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
  const { printAreas, setAreaDesign, nextStep, prevStep, selectedService } = useOrderStore();
  const toast = useToast();
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const fileInputRefs = useRef([]);

  const options = selectedService?.options_config || {};
  const printPositions = options.print_positions || [];
  const printSizes = options.print_sizes || [];

  const getPositionLabel = (value) => printPositions.find((p) => p.value === value)?.label || value;
  const getSizeLabel = (value) => printSizes.find((s) => s.value === value)?.label || value;

  const handleFileUpload = async (e, areaIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File terlalu besar. Maks 5MB');
      return;
    }

    setUploadingIndex(areaIndex);
    try {
      const session = localStorage.getItem('user_session') || crypto.randomUUID();
      localStorage.setItem('user_session', session);

      const result = await designService.upload(file, session);
      setAreaDesign(areaIndex, {
        id: result.design?.id,
        imageUrl: result.design?.image_url,
        isValid: result.design?.is_valid,
        validationMessage: result.design?.validation_message,
        type: 'uploaded',
      });
      toast.success(`Desain Area ${areaIndex + 1} berhasil diupload!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload desain');
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[areaIndex]) {
        fileInputRefs.current[areaIndex].value = '';
      }
    }
  };

  const handleRemoveDesign = async (areaIndex) => {
    const area = printAreas[areaIndex];
    if (area.design?.id) {
      try {
        await designService.delete(area.design.id);
      } catch (err) {
        console.error('Failed to delete design from Cloudinary:', err);
      }
    }
    setAreaDesign(areaIndex, { id: null, imageUrl: null, isValid: false, validationMessage: null, type: null });
  };

  const handleNext = () => {
    const allUploaded = printAreas.every((area) => area.design?.imageUrl);
    if (!allUploaded) {
      const missing = printAreas.findIndex((area) => !area.design?.imageUrl);
      toast.warning(`Upload desain untuk Area ${missing + 1} terlebih dahulu`);
      return;
    }
    nextStep();
  };

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">UPLOAD DESAIN</h2>

      <div className="space-y-6 mb-6">
        {printAreas.map((area, index) => (
          <div key={index} className="bg-ink border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-fire text-[11px] tracking-[1px] uppercase font-medium">
                  Area {index + 1}
                </p>
                <p className="text-white text-sm font-medium">
                  {getPositionLabel(area.position)} ({getSizeLabel(area.printSize)})
                </p>
              </div>
              {area.design?.imageUrl && (
                <button onClick={() => handleRemoveDesign(index)}
                  className="text-gray hover:text-fire transition-colors">
                  <Icon name="trash-2" size={16} />
                </button>
              )}
            </div>

            {area.design?.imageUrl ? (
              <div className="relative">
                <img
                  src={getImageUrl(area.design.imageUrl)}
                  alt={`Desain Area ${index + 1}`}
                  className="w-full max-h-60 object-contain bg-ink rounded-xl border border-border"
                />
                {area.design.validationMessage && (
                  <div className={`mt-3 p-3 rounded-xl text-sm ${area.design.isValid ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {area.design.validationMessage}
                  </div>
                )}
              </div>
            ) : (
              <label className="border-2 border-dashed border-border rounded-xl p-8 text-center block cursor-pointer hover:border-primary transition-colors">
                {uploadingIndex === index ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-gray text-sm">Mengupload...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-gray mb-2" />
                    <p className="text-white font-semibold text-sm mb-1">Klik untuk upload desain</p>
                    <p className="text-gray text-xs">Format: JPG, PNG, SVG (maks. 5MB)</p>
                  </>
                )}
                <input
                  ref={(el) => { fileInputRefs.current[index] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, index)}
                  className="hidden"
                  disabled={uploadingIndex === index}
                />
              </label>
            )}
          </div>
        ))}
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
