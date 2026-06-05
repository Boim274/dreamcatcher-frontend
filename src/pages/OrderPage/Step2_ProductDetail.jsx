import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useToast } from '../../components/ui/Toast';
import Icon from '../../components/ui/Icon';
import { formatRupiah } from '../../utils/formatRupiah';
import { getServiceIcon } from '../../utils/serviceIcon';

const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'];

const isSablonKaos = (serviceName) => {
  const name = (serviceName || '').toLowerCase();
  return name.includes('kaos') || name.includes('sablon');
};

const isBanner = (serviceName) => {
  const name = (serviceName || '').toLowerCase();
  return name.includes('banner');
};

const isStiker = (serviceName) => {
  const name = (serviceName || '').toLowerCase();
  return name.includes('stiker');
};

const isBordir = (serviceName) => {
  const name = (serviceName || '').toLowerCase();
  return name.includes('bordir');
};

export default function Step2ProductDetail() {
  const { selectedService, productDetail, setProductDetail, nextStep, prevStep } = useOrderStore();
  const toast = useToast();
  const [localSizes, setLocalSizes] = useState(productDetail.sizes?.length > 0 ? productDetail.sizes : []);
  const [notes, setNotes] = useState(productDetail.notes || '');
  const [quantity, setQuantity] = useState(productDetail.quantity || 1);
  const [dimension, setDimension] = useState(productDetail.dimension || { width: '', height: '', unit: 'cm' });
  const [material, setMaterial] = useState(productDetail.material || '');
  const [priceFlash, setPriceFlash] = useState(false);

  const totalQuantity = localSizes.reduce((sum, s) => sum + s.quantity, 0);
  const finalQuantity = isSablonKaos(selectedService?.name) ? totalQuantity : quantity;
  const estimatedPrice = finalQuantity * (selectedService?.price_per_unit || 0);

  const handleSizeChange = (size, delta) => {
    const existing = localSizes.find((s) => s.size === size);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) {
        setLocalSizes(localSizes.filter((s) => s.size !== size));
      } else {
        setLocalSizes(localSizes.map((s) => (s.size === size ? { ...s, quantity: newQty } : s)));
      }
    } else if (delta > 0) {
      setLocalSizes([...localSizes, { size, quantity: delta }]);
    }
    triggerPriceFlash();
  };

  const getQuantity = (size) => localSizes.find((s) => s.size === size)?.quantity || 0;

  const handleQuantityChange = (val) => {
    setQuantity(val);
    triggerPriceFlash();
  };

  const triggerPriceFlash = () => {
    setPriceFlash(true);
    setTimeout(() => setPriceFlash(false), 600);
  };

  const minOrder = parseInt(selectedService?.minimum_order) || 1;
  const isBelowMin = isSablonKaos(selectedService?.name) ? totalQuantity < minOrder : quantity < minOrder;

  const handleNext = () => {
    if (isBelowMin) {
      toast.warning(`Minimum order adalah ${minOrder} pcs`);
      return;
    }
    setProductDetail({
      sizes: isSablonKaos(selectedService?.name) ? localSizes : [],
      notes,
      quantity: finalQuantity,
      dimension,
      material,
    });
    nextStep();
  };

  return (
    <div className="bg-card border border-border p-6">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">DETAIL PRODUK</h2>

      <div className="bg-ink border border-border p-4 mb-6 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>
            <Icon name={getServiceIcon(selectedService?.name)} size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-heading text-[20px] text-white tracking-[1px]">{selectedService?.name}</h3>
            <p className="text-gray text-[13px]">
              {formatRupiah(selectedService?.price_per_unit || 0)}/pcs
            </p>
          </div>
        </div>
      </div>

      {isSablonKaos(selectedService?.name) ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase">Pilih Ukuran & Jumlah</label>
            <span className="text-gray text-[11px]">Min. {selectedService?.minimum_order} pcs</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {sizeOptions.map((size) => (
              <div key={size} className="text-center bg-ink border border-border rounded-xl p-3">
                <p className="font-medium text-white mb-2">{size}</p>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button onClick={() => handleSizeChange(size, -1)} className="w-8 h-8 bg-border hover:bg-gray-dark text-white flex items-center justify-center transition-colors rounded-lg">
                    <Icon name="minus" size={16} />
                  </button>
                  <span className="w-8 font-bold text-white text-center">{getQuantity(size)}</span>
                  <button onClick={() => handleSizeChange(size, 1)} className="w-8 h-8 bg-border hover:bg-gray-dark text-white flex items-center justify-center transition-colors rounded-lg">
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {localSizes.length > 0 && (
            <div className="mt-4 p-3 bg-ink border border-border rounded-xl">
              <p className="text-[11px] text-gray tracking-[1px] uppercase mb-2">Ringkasan:</p>
              <div className="flex flex-wrap gap-2">
                {localSizes.map((s) => (
                  <span key={s.size} className="bg-primary text-white px-3 py-1 text-[12px] rounded-lg">{s.size}: {s.quantity} pcs</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : isBanner(selectedService?.name) ? (
        <div className="mb-6 space-y-4">
          <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase block">Ukuran Banner</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray text-[11px] block mb-1">Lebar</label>
              <input type="number" min="1" value={dimension.width} onChange={(e) => setDimension({...dimension, width: e.target.value})}
                placeholder="100" className="input-dark rounded-xl" />
            </div>
            <div>
              <label className="text-gray text-[11px] block mb-1">Tinggi</label>
              <input type="number" min="1" value={dimension.height} onChange={(e) => setDimension({...dimension, height: e.target.value})}
                placeholder="200" className="input-dark rounded-xl" />
            </div>
            <div>
              <label className="text-gray text-[11px] block mb-1">Satuan</label>
              <select value={dimension.unit} onChange={(e) => setDimension({...dimension, unit: e.target.value})}
                className="input-dark cursor-pointer rounded-xl">
                <option value="cm">cm</option>
                <option value="m">meter</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-gray text-[11px] block mb-1">Jumlah</label>
            <input type="number" min="1" max="9999" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="input-dark rounded-xl" />
          </div>
        </div>
      ) : isStiker(selectedService?.name) ? (
        <div className="mb-6 space-y-4">
          <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase block">Detail Stiker</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray text-[11px] block mb-1">Ukuran (cm)</label>
              <input type="text" value={dimension.width} onChange={(e) => setDimension({...dimension, width: e.target.value})}
                placeholder="10 x 5" className="input-dark rounded-xl" />
            </div>
            <div>
              <label className="text-gray text-[11px] block mb-1">Bahan</label>
              <select value={material} onChange={(e) => setMaterial(e.target.value)}
                className="input-dark cursor-pointer rounded-xl">
                <option value="">Pilih Bahan</option>
                <option value="vinyl">Vinyl</option>
                <option value="orajel">Orajel</option>
                <option value="transparan">Transparan</option>
                <option value="chromewire">Chromewire</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-gray text-[11px] block mb-1">Jumlah</label>
            <input type="number" min="1" max="9999" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="input-dark rounded-xl" />
          </div>
        </div>
      ) : isBordir(selectedService?.name) ? (
        <div className="mb-6 space-y-4">
          <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase block">Detail Bordir</label>
          <div>
            <label className="text-gray text-[11px] block mb-1">Ukuran Bordir (cm)</label>
            <input type="text" value={dimension.width} onChange={(e) => setDimension({...dimension, width: e.target.value})}
              placeholder="10 x 10" className="input-dark rounded-xl" />
          </div>
          <div>
            <label className="text-gray text-[11px] block mb-1">Tipe Benang</label>
            <select value={material} onChange={(e) => setMaterial(e.target.value)}
              className="input-dark cursor-pointer rounded-xl">
              <option value="">Pilih Tipe</option>
              <option value="polyester">Polyester</option>
              <option value="rayon">Rayon</option>
              <option value="katun">Katun</option>
            </select>
          </div>
          <div>
            <label className="text-gray text-[11px] block mb-1">Jumlah</label>
            <input type="number" min="1" max="9999" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="input-dark rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase block mb-3">Jumlah</label>
          <input type="number" min="1" max="9999" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="input-dark rounded-xl" />
        </div>
      )}

      <div className="mb-6">
        <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Catatan (opsional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={isSablonKaos(selectedService?.name) ? "Contoh: Font tebal, warna merah tua" : "Tambahkan catatan jika ada"}
          className="input-dark min-h-[80px] resize-none rounded-xl" />
      </div>

      {finalQuantity > 0 && (
        <div className={`mb-6 p-4 border rounded-xl transition-all duration-300 ${
          priceFlash ? 'bg-primary/15 border-primary/50 scale-[1.01]' : 'bg-primary/10 border-primary/30'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-gray text-[12px] tracking-[1px] uppercase">Total:</span>
            <span className="font-bold text-lg text-white">{finalQuantity} pcs</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray text-[12px] tracking-[1px] uppercase">Estimasi:</span>
            <span className="font-bold text-xl text-primary">
              {formatRupiah(estimatedPrice)}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleNext} disabled={isBelowMin}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[13px] uppercase tracking-[1px]">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
