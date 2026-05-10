import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';

const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'];

export default function Step2ProductDetail() {
  const { selectedService, productDetail, setProductDetail, nextStep, prevStep } = useOrderStore();
  const [localSizes, setLocalSizes] = useState(productDetail.sizes.length > 0 ? productDetail.sizes : []);
  const [notes, setNotes] = useState(productDetail.notes || '');

  const totalQuantity = localSizes.reduce((sum, s) => sum + s.quantity, 0);
  const estimatedPrice = totalQuantity * (selectedService?.price_per_unit || 0);

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
  const isBelowMin = totalQuantity < minOrder;

  const handleNext = () => {
    if (isBelowMin) {
      alert(`Minimum order adalah ${minOrder} pcs`);
      return;
    }
    setProductDetail({ sizes: localSizes, notes, quantity: totalQuantity });
    nextStep();
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Detail Produk</h2>

      <div className="bg-[#F8F9FA] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center text-2xl">
            <Icon name="box" size={24} className="text-[#FF6B35]" />
          </div>
          <div>
            <h3 className="font-semibold">{selectedService?.name}</h3>
            <p className="text-[#6B7280] text-sm">
              Rp {(selectedService?.price_per_unit || 0).toLocaleString('id-ID')}/pcs
            </p>
          </div>
        </div>
      </div>

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

      <div className="mb-6">
        <label className="font-medium mb-2 block">Catatan (opsional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Font tebal, warna merah tua"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 min-h-[80px] resize-none"
        />
      </div>

      {totalQuantity > 0 && (
        <div className="mb-6 p-4 bg-[#FF6B35]/5 rounded-xl border border-[#FF6B35]/20">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Total:</span>
            <span className="font-bold text-lg">{totalQuantity} pcs</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[#6B7280]">Estimasi:</span>
            <span className="font-bold text-xl text-[#FF6B35]">
              Rp {estimatedPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-[#FF6B35] text-[#FF6B35] font-semibold py-3 px-6 rounded-lg hover:bg-[#FF6B35] hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button
          onClick={handleNext}
          disabled={isBelowMin}
          className="flex items-center gap-2 flex-1 justify-center bg-[#FF6B35] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#E55A26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}