import { useState } from 'react';
import Icon from '../ui/Icon';

const POSITIONS = [
  { value: 'standar_depan', label: 'Standar Depan', desc: 'Area cetak di bagian depan kaos' },
  { value: 'dada_tengah', label: 'Dada Tengah', desc: 'Area kecil di tengah dada' },
  { value: 'dada_kiri', label: 'Dada Kiri', desc: 'Area di sisi kiri dada' },
  { value: 'dada_kanan', label: 'Dada Kanan', desc: 'Area di sisi kanan dada' },
  { value: 'standar_belakang', label: 'Standar Belakang', desc: 'Area cetak di bagian belakang kaos' },
  { value: 'punggung_atas', label: 'Punggung Atas', desc: 'Area di bagian atas punggung' },
  { value: 'lengan_kiri', label: 'Lengan Kiri', desc: 'Area cetak di lengan kiri' },
  { value: 'lengan_kanan', label: 'Lengan Kanan', desc: 'Area cetak di lengan kanan' },
];

export default function PrintPositionGuide({ selectedPosition, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-primary text-xs hover:underline"
      >
        <Icon name="info" size={14} />
        <span>Lihat Panduan Posisi Cetak</span>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} />
      </button>

      {isOpen && (
        <div className="mt-3 bg-ink border border-border rounded-xl p-4 animate-fade-in">
          <p className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Panduan Posisi Cetak</p>
          <p className="text-gray text-xs mb-4">
            Pilih posisi area cetak sesuai kebutuhan desain Anda. Setiap posisi memiliki area cetak yang berbeda.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos.value}
                onClick={() => onSelect && onSelect(pos.value)}
                className={`p-2 rounded-lg border text-center transition-all duration-200 ${
                  selectedPosition === pos.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className={`text-xs font-medium ${selectedPosition === pos.value ? 'text-primary' : 'text-white'}`}>
                  {pos.label}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-card rounded-lg border border-border">
            <p className="text-gray text-[11px]">
              <strong className="text-white">Tips:</strong> Hindari mencetak gambar/tulisan pada area lipatan baju.
              Jelaskan posisi cetak pada kolom keterangan jika menggunakan posisi selain yang tersedia.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
