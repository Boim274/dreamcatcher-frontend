import { useState, useRef } from 'react';
import { useOrderStore } from '../../store/orderStore';
import Spinner from '../../components/ui/Spinner';
import Icon from '../../components/ui/Icon';

export default function Step4AIMockup() {
  const { design, mockupImage, setMockupImage, nextStep, prevStep } = useOrderStore();
  const [imageSrc, setImageSrc] = useState(mockupImage || design.imageUrl);
  const [loading, setLoading] = useState(false);
  const [usingCamera, setUsingCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const processMockup = (imageUrl) => {
    setLoading(true);
    setTimeout(() => {
      setMockupImage(imageUrl);
      setLoading(false);
    }, 1000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      processMockup(url);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setUsingCamera(true);
    } catch (err) {
      alert('Tidak dapat mengakses kamera');
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imageUrl = canvas.toDataURL('image/jpeg');
    setImageSrc(imageUrl);
    setUsingCamera(false);
    video.srcObject.getTracks().forEach(track => track.stop());
    processMockup(imageUrl);
  };

  const handleSkip = () => {
    setMockupImage(design.imageUrl);
    nextStep();
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Preview Mockup (Opsional)</h2>
      <p className="text-[#6B7280] mb-6">Upload foto untuk melihat preview desain pada mockup.</p>

      {loading ? (
        <div className="py-20 text-center"><Spinner size="lg" /><p className="mt-4 text-[#6B7280]">Memproses...</p></div>
      ) : mockupImage ? (
        <div className="text-center">
          <img src={mockupImage} alt="Mockup" className="max-h-80 mx-auto rounded-xl shadow-lg" />
          <div className="mt-4 flex gap-2 justify-center">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <span className="inline-flex items-center gap-2 border-2 border-[#982598] text-[#982598] font-semibold py-2 px-4 rounded-lg hover:bg-[#982598] hover:text-white transition-colors">
                <Icon name="upload" size={16} /> Ganti
              </span>
            </label>
            {!usingCamera && (
              <button onClick={startCamera} className="inline-flex items-center gap-2 border-2 border-[#982598] text-[#982598] font-semibold py-2 px-4 rounded-lg hover:bg-[#982598] hover:text-white transition-colors">
                <Icon name="camera" size={16} /> Kamera
              </button>
            )}
          </div>
        </div>
      ) : usingCamera ? (
        <div className="text-center">
          <video ref={videoRef} autoPlay playsInline className="max-h-64 mx-auto rounded-xl" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-4 flex gap-2 justify-center">
            <button onClick={capturePhoto} className="bg-[#982598] text-white font-semibold py-2 px-6 rounded-lg hover:bg-[#7a1f7a]">
              <Icon name="camera" size={16} /> Ambil
            </button>
            <button onClick={() => { videoRef.current.srcObject?.getTracks().forEach(t => t.stop()); setUsingCamera(false); }} className="border-2 border-gray-300 text-[#6B7280] font-semibold py-2 px-6 rounded-lg">Batal</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Icon name="image" size={48} className="mx-auto text-[#6B7280] mb-4" />
            <p className="text-[#6B7280] mb-4">Unggah foto untuk preview</p>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <span className="inline-flex items-center gap-2 bg-[#982598] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#7a1f7a]">
                <Icon name="upload" size={20} /> Pilih Foto
              </span>
            </label>
          </div>
          <div className="text-center text-[#6B7280]">atau</div>
          <button onClick={startCamera} className="w-full inline-flex items-center justify-center gap-2 border-2 border-[#982598] text-[#982598] font-semibold py-3 rounded-lg hover:bg-[#982598] hover:text-white transition-colors">
            <Icon name="camera" size={20} /> Gunakan Kamera
          </button>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-[#982598] text-[#982598] font-semibold py-3 px-6 rounded-lg hover:bg-[#982598] hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleSkip} className="flex items-center gap-2 border-2 border-gray-300 text-[#6B7280] font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors">
          <Icon name="skip-forward" size={20} /> Lewati
        </button>
        <button onClick={nextStep} disabled={!mockupImage} className="flex items-center gap-2 flex-1 justify-center bg-[#982598] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#7a1f7a] transition-colors disabled:opacity-50">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}