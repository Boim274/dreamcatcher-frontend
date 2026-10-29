import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import heic2any from 'heic2any';

export default function DesignUpload({ onUploadDesign, currentDesign, isLoading = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [convertingHeic, setConvertingHeic] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
  ];
  const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.jfif', '.heic', '.heif'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  // Reset local preview if parent indicates design is null and loading finished (e.g. upload failed)
  useEffect(() => {
    if (!currentDesign && !isLoading && !convertingHeic) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [currentDesign, isLoading, convertingHeic]);

  const isAllowedType = (file) => {
    const mime = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
    const hasValidMime = ALLOWED_MIME_TYPES.includes(mime);
    return hasValidMime || hasValidExt;
  };

  const isHeic = (file) => {
    const mime = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    return mime.includes('heic') || mime.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif');
  };

  const validateFile = (file) => {
    if (!isAllowedType(file)) {
      setError('Format tidak didukung. Gunakan format PNG, JPG, WebP, atau HEIC (iPhone)');
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError('Ukuran file maksimal 10MB');
      return false;
    }
    return true;
  };

  const processFile = async (file) => {
    setError(null);
    if (!validateFile(file)) return;

    let targetFile = file;

    // Convert Apple HEIC to standard PNG/JPEG
    if (isHeic(file)) {
      setConvertingHeic(true);
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/png',
          quality: 0.95,
        });
        const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        targetFile = new File(
          [singleBlob],
          file.name.replace(/\.(heic|heif)$/i, '.png'),
          { type: 'image/png' }
        );
      } catch (err) {
        console.error('HEIC conversion failed:', err);
        setError('Gagal mengonversi file Apple HEIC. Silakan simpan sebagai JPG/PNG.');
        setConvertingHeic(false);
        return;
      } finally {
        setConvertingHeic(false);
      }
    }

    const url = URL.createObjectURL(targetFile);
    setPreviewUrl(url);
    onUploadDesign(targetFile, url);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || convertingHeic) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || convertingHeic) return;
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    if (isLoading || convertingHeic) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onUploadDesign(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isBusy = isLoading || convertingHeic;

  if (previewUrl || currentDesign) {
    return (
      <div className="bg-ink border border-border rounded-xl p-4 relative">
        <div className="relative">
          <img
            src={currentDesign || previewUrl}
            alt="Uploaded design"
            className="w-full max-h-64 object-contain rounded-lg"
          />
          {isBusy ? (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs rounded-lg flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <span className="text-xs font-medium text-white/90">
                {convertingHeic ? 'Mengonversi format Apple HEIC...' : 'Mengunggah & menganalisis desain...'}
              </span>
            </div>
          ) : (
            <button
              onClick={handleRemove}
              disabled={isBusy}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-fire transition-colors disabled:opacity-50 cursor-pointer"
              title="Hapus desain"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-fire text-ink font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-colors text-[13px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 text-ink animate-spin" />
              <span>{convertingHeic ? 'Mengonversi...' : 'Memproses Desain...'}</span>
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
          accept="image/png,image/jpg,image/jpeg,image/webp,.heic,.heif"
          onChange={handleChange}
          disabled={isBusy}
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
        onClick={() => { if (!isBusy) inputRef.current?.click(); }}
        className={`bg-ink border-2 border-dashed rounded-xl p-5 sm:p-10 text-center transition-all duration-200 ${
          isBusy ? 'opacity-60 cursor-wait border-primary/40' : 'cursor-pointer'
        } ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-white font-semibold text-sm sm:text-[15px] mb-1">
              {convertingHeic ? 'Mengonversi Format Apple HEIC...' : 'Mengunggah Desain...'}
            </p>
            <p className="text-gray text-[11px] sm:text-[12px]">Mohon tunggu sebentar...</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray mb-2.5 sm:mb-4" />
            <p className="text-white font-semibold text-sm sm:text-[15px] mb-1">Upload Desain Kaos</p>
            <p className="text-gray text-[11px] sm:text-[12px]">Seret & lepas file di sini, atau klik untuk pilih file</p>
            <p className="text-gray-medium text-[10px] sm:text-[11px] mt-1.5 font-medium">
              Format: PNG, JPG, WebP, HEIC (iPhone) &bull; Maks. 10MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpg,image/jpeg,image/webp,.heic,.heif"
          onChange={handleChange}
          disabled={isBusy}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-red-400 text-[12px] mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
