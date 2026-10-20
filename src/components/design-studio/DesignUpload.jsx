import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

export default function DesignUpload({ onUploadDesign, currentDesign, isLoading = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const ALLOWED_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];
  const MAX_SIZE = 5 * 1024 * 1024;

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Hanya format PNG dan JPG yang diperbolehkan');
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError('Ukuran file maksimal 5MB');
      return false;
    }
    return true;
  };

  const processFile = (file) => {
    setError(null);
    if (!validateFile(file)) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onUploadDesign(file, url);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    if (isLoading) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onUploadDesign(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (previewUrl || currentDesign) {
    return (
      <div className="bg-ink border border-border rounded-xl p-4 relative">
        <div className="relative">
          <img
            src={previewUrl || currentDesign}
            alt="Uploaded design"
            className="w-full max-h-64 object-contain rounded-lg"
          />
          {isLoading ? (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs rounded-lg flex flex-col items-center justify-center gap-2 text-white">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-white/90">Mengunggah & menganalisis...</span>
            </div>
          ) : (
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-fire transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-fire text-ink font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-colors text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              <span>Memproses Desain...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Ganti Desain
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpg,image/jpeg"
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => { if (!isLoading) inputRef.current?.click(); }}
        className={`bg-ink border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          isLoading ? 'opacity-60 cursor-wait border-primary/40' : 'cursor-pointer'
        } ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold text-[15px] mb-1">Mengunggah Desain...</p>
            <p className="text-gray text-[12px]">Mohon tunggu sebentar...</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-gray mb-4" />
            <p className="text-white font-semibold text-[15px] mb-2">Upload Desain Kaos</p>
            <p className="text-gray text-[12px]">Seret & lepas file di sini, atau klik untuk pilih file</p>
            <p className="text-gray-medium text-[11px] mt-1">Format: PNG, JPG (maks. 5MB)</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpg,image/jpeg"
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-red-400 text-[12px] mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
