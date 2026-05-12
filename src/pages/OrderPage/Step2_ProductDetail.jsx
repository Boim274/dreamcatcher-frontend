import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';

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
  const [localSizes, setLocalSizes] = useState(productDetail.sizes?.length > 0 ? productDetail.sizes : []);
  const [notes, setNotes] = useState(productDetail.notes || '');
  const [quantity, setQuantity] = useState(productDetail.quantity || 1);
  const [dimension, setDimension] = useState(productDetail.dimension || { width: '', height: '', unit: 'cm' });
  const [material, setMaterial] = useState(productDetail.material || '');
  const [finishing, setFinishing] = useState(productDetail.finishing || '');

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
  };

  const getQuantity = (size) => localSizes.find((s) => s.size === size)?.quantity || 0;

  const minOrder = parseInt(selectedService?.minimum_order) || 1;
  const isBelowMin = isSablonKaos(selectedService?.name) ? totalQuantity < minOrder : quantity < minOrder;

  const handleNext = () => {
    if (isBelowMin) {
      alert(`Minimum order adalah ${minOrder} pcs`);
      return;
    }
    setProductDetail({
      sizes: isSablonKaos(selectedService?.name) ? localSizes : [],
      notes,
      quantity: finalQuantity,
      dimension: dimension,
      material: material,
      finishing: finishing,
    });
    nextStep();
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Detail Produk</h2>

      <div className="bg-[#F8F9FA] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#982598]/10 rounded-xl flex items-center justify-center text-2xl">
            <Icon name="box" size={24} className="text-[#982598]" />
          </div>
          <div>
            <h3 className="font-semibold">{selectedService?.name}</h3>
            <p className="text-[#6B7280] text-sm">
              Rp {(selectedService?.price_per_unit || 0).toLocaleString('id-ID')}/pcs
            </p>
          </div>
        </div>
      </div>

      {isSablonKaos(selectedService?.name) ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium">Pilih Ukuran & Jumlah</label>
            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
              <Icon name="info" size={16} />
              <span>Min. {selectedService?.minimum_order} pcs</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {sizeOptions.map((size) => (
              <div key={size} className="text-center">
                <p className="font-medium mb-2">{size}</p>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => handleSizeChange(size, -1)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                    <Icon name="minus" size={16} />
                  </button>
                  <span className="w-8 font-bold">{getQuantity(size)}</span>
                  <button onClick={() => handleSizeChange(size, 1)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {localSizes.length > 0 && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-[#6B7280] mb-2">Ringkasan:</p>
              <div className="flex flex-wrap gap-2">
                {localSizes.map((s) => (
                  <span key={s.size} className="bg-white px-3 py-1 rounded-full text-sm">{s.size}: {s.quantity} pcs</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : isBanner(selectedService?.name) ? (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium">Ukuran Banner</label>
            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
              <Icon name="info" size={16} />
              <span>Min. {selectedService?.minimum_order} pcs</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-[#6B7280] block mb-1">Lebar</label>
              <input type="number" value={dimension.width} onChange={(e) => setDimension({...dimension, width: e.target.value})}
                placeholder="100" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]" />
            </div>
            <div>
              <label className="text-sm text-[#6B7280] block mb-1">Tinggi</label>
              <input type="number" value={dimension.height} onChange={(e) => setDimension({...dimension, height: e.target.value})}
                placeholder="200" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]" />
            </div>
            <div>
              <label className="text-sm text-[#6B7280] block mb-1">Satuan</label>
              <select value={dimension.unit} onChange={(e) => setDimension({...dimension, unit: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]">
                <option value="cm">cm</option>
                <option value="m">meter</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-[#6B7280] block mb-1">Jumlah</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]" />
          </div>
        </div>
      ) : isStiker(selectedService?.name) ? (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium">Detail Stiker</label>
            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
              <Icon name="info" size={16} />
              <span>Min. {selectedService?.minimum_order} pcs</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#6B7280] block mb-1">Ukuran (cm)</label>
              <input type="text" value={dimension.width} onChange={(e) => setDimension({...dimension, width: e.target.value})}
                placeholder="10 x 5" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]" />
            </div>
            <div>
              <label className="text-sm text-[#6B7280] block mb-1">Bahan</label>
              <select value={material} onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]">
                <option value="">Pilih Bahan</option>
                <option value="vinyl">Vinyl</option>
                <option value="orajel">Orajel</option>
                <option value="transparan">Transparan</option>
                <option value="chromewire">Chromewire</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-[#6B7280] block mb-1">Jumlah</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]" />
          </div>
        </div>
      ) : isBordir(selectedService?.name) ? (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium">Detail Bordir</label>
            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
              <Icon name="info" size={16} />
              <span>Min. {selectedService?.minimum_order} pcs</span>
            </div>
          </div>
          <div>
            <label className="text-sm text-[#6B7280] block mb-1">Ukuran Bordir (cm)</label>
            <input type="text" value={dimension.width} onChange={(e) => setDimension({...dimension, width: e.target.value})}
              placeholder="10 x 10" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]" />
          </div>
          <div>
            <label className="text-sm text-[#6B7280] block mb-1">Tipe Benang</label>
            <select value={material} onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]">
              <option value="">Pilih Tipe</option>
              <option value="polyester">Polyester</option>
              <option value="rayon">Rayon</option>
              <option value="katun">Katun</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-[#6B7280] block mb-1">Jumlah</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]" />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium">Jumlah</label>
            <div className="flex items-center gap-1 text-sm text-[#6B7280]">
              <Icon name="info" size={16} />
              <span>Min. {selectedService?.minimum_order} pcs</span>
            </div>
          </div>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598]" />
        </div>
      )}

      <div className="mb-6">
        <label className="font-medium mb-2 block">Catatan (opsional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={isSablonKaos(selectedService?.name) ? "Contoh: Font tebal, warna merah tua" : "Tambahkan catatan jika ada"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598] focus:ring-2 focus:ring-[#982598]/20 min-h-[80px] resize-none" />
      </div>

      {finalQuantity > 0 && (
        <div className="mb-6 p-4 bg-[#982598]/5 rounded-xl border border-[#982598]/20">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Total:</span>
            <span className="font-bold text-lg">{finalQuantity} pcs</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[#6B7280]">Estimasi:</span>
            <span className="font-bold text-xl text-[#982598]">
              Rp {estimatedPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-[#982598] text-[#982598] font-semibold py-3 px-6 rounded-lg hover:bg-[#982598] hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleNext} disabled={isBelowMin}
          className="flex items-center gap-2 flex-1 justify-center bg-[#982598] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#7a1f7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}