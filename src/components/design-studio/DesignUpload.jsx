import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

export default function DesignUpload({ onUploadDesign, currentDesign }) {
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
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onUploadDesign(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (previewUrl || currentDesign) {
    return (
      <div className="bg-ink border border-border rounded-xl p-4">
        <div className="relative">
          <img
            src={previewUrl || currentDesign}
            alt="Uploaded design"
            className="w-full max-h-64 object-contain rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-fire transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-fire text-ink font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-colors text-[13px]"
        >
          <Upload className="w-4 h-4" /> Ganti Desain
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpg,image/jpeg"
          onChange={handleChange}
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
        onClick={() => inputRef.current?.click()}
        className={`bg-ink border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto text-gray mb-4" />
        <p className="text-white font-semibold text-[15px] mb-2">Upload Desain Kaos</p>
        <p className="text-gray text-[12px]">Seret & lepas file di sini, atau klik untuk pilih file</p>
        <p className="text-gray-medium text-[11px] mt-1">Format: PNG, JPG (maks. 5MB)</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpg,image/jpeg"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-red-400 text-[12px] mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
