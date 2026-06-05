import { useState, useRef, useEffect, useCallback } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useToast } from '../../components/ui/Toast';
import Icon from '../../components/ui/Icon';

export default function Step4AIMockup() {
  const { design, mockupImage, setMockupImage, nextStep, prevStep } = useOrderStore();
  const toast = useToast();
  const [imageSrc, setImageSrc] = useState(mockupImage || design.imageUrl);
  const [usingCamera, setUsingCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUsingCamera(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setMockupImage(url);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUsingCamera(true);
    } catch (err) {
      toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const capturePhoto = () => {
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || !video.videoWidth) {
        toast.error('Gagal mengambil foto');
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageUrl = canvas.toDataURL('image/jpeg');
      setImageSrc(imageUrl);
      setMockupImage(imageUrl);
      stopCamera();
    } catch (err) {
      toast.error('Gagal mengambil foto');
    }
  };

  const handleRemoveMockup = () => {
    setImageSrc(null);
    setMockupImage(null);
  };

  return (
    <div className="bg-card border border-border p-6">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-2">Preview Mockup (Opsional)</h2>
      <p className="text-gray mb-6">Upload foto untuk melihat preview desain pada mockup.</p>

      {usingCamera ? (
        <div className="text-center">
          <div className="relative inline-block">
            <video ref={videoRef} autoPlay playsInline className="max-h-64 rounded-xl" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="mt-4 flex gap-3 justify-center">
            <button onClick={capturePhoto} className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-2 px-6 rounded-xl hover:bg-primary-dark transition-colors">
              <Icon name="camera" size={16} /> Ambil Foto
            </button>
            <button onClick={stopCamera} className="inline-flex items-center gap-2 border-2 border-border text-gray font-semibold py-2 px-6 rounded-xl hover:bg-dark transition-colors">
              <Icon name="x" size={16} /> Batal
            </button>
          </div>
        </div>
      ) : mockupImage || imageSrc ? (
        <div className="text-center">
          <div className="relative inline-block">
            <img src={imageSrc || mockupImage} alt="Mockup" className="max-h-80 max-w-full rounded-xl shadow-lg object-contain" />
          </div>
          <div className="mt-4 flex gap-3 justify-center flex-wrap">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <span className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold py-2 px-5 rounded-xl hover:bg-primary hover:text-white transition-colors">
                <Icon name="upload" size={16} /> Ganti
              </span>
            </label>
            <button onClick={startCamera} className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold py-2 px-5 rounded-xl hover:bg-primary hover:text-white transition-colors">
              <Icon name="camera" size={16} /> Kamera
            </button>
            <button onClick={handleRemoveMockup} className="inline-flex items-center gap-2 border-2 border-border text-gray font-semibold py-2 px-5 rounded-xl hover:bg-dark transition-colors">
              <Icon name="trash" size={16} /> Hapus
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <Icon name="image" size={48} className="mx-auto text-gray mb-4" />
            <p className="text-gray mb-4">Unggah foto untuk preview</p>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <span className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors">
                <Icon name="upload" size={20} /> Pilih Foto
              </span>
            </label>
          </div>
          <div className="text-center text-gray text-sm">atau</div>
          <button onClick={startCamera} className="w-full inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary hover:text-white transition-colors">
            <Icon name="camera" size={20} /> Gunakan Kamera
          </button>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={nextStep} className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors">
          {mockupImage || imageSrc ? 'Lanjut' : 'Lewati'} <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
