import { useState } from 'react';
import { Truck, MapPin, ZoomIn, ExternalLink, Sparkles, Upload, Palette, XCircle, Package } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import CopyId from './CopyId';
import OptimizedImage from '../ui/OptimizedImage';

export default function OrderDetailSection({ order }) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const items = order.items || [];

  const renderItemDetails = (item) => [
    item.size && `Ukuran: ${item.size}`,
    item.selected_color && `Warna: ${item.selected_color}`,
    item.sablon_type && `Sablon: ${item.sablon_type}`,
    item.print_area && `Posisi: ${item.print_area.replace(/_/g, ' ')}`,
    item.print_size && `Dimensi: ${item.print_size}`,
  ].filter(Boolean);

  return (
    <div className="mt-5 space-y-5">
      {/* Customer Information */}
      <div>
        <h4 className="text-white/50 text-[11px] tracking-wider uppercase mb-3 font-bold">Detail Pemesan</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 sm:p-4">
            <p className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1.5">Nama Customer</p>
            <p className="text-white font-medium truncate">{order.customer_name || '-'}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 sm:p-4">
            <p className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1.5">No. WhatsApp</p>
            <p className="text-white font-medium truncate">{order.phone || '-'}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 sm:p-4 col-span-2 sm:col-span-1">
            <p className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1.5">Pengiriman</p>
            <p className="text-white font-medium flex items-center gap-1.5 truncate">
              {order.delivery_method === 'pickup' ? (
                <><MapPin size={13} className="text-cyan-400 shrink-0" /> Ambil di Workshop</>
              ) : (
                <><Truck size={13} className="text-purple-400 shrink-0" /> Dikirim Kurir</>
              )}
            </p>
          </div>
          {order.address && (
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 sm:p-4 col-span-2 sm:col-span-3">
              <p className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1.5">Alamat Pengiriman</p>
              <p className="text-white/90 font-medium text-xs sm:text-[13px] leading-relaxed">{order.address}</p>
            </div>
          )}
        </div>
      </div>

      {order.description && (
        <div>
          <h4 className="text-white/50 text-[11px] tracking-wider uppercase mb-3 font-bold">Catatan Pesanan</h4>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 sm:p-4">
            <p className="text-white/80 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">{order.description}</p>
          </div>
        </div>
      )}

      {/* Order Items Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white/50 text-[11px] tracking-wider uppercase font-bold">Item Pesanan ({items.length})</h4>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => {
            const rawImg = item.design?.image_url || item.product?.images?.[0]?.image_url;
            const itemImg = rawImg ? getImageUrl(rawImg) : null;
            const thumbImg = item.design?.thumbnail_url || item.product?.images?.[0]?.thumbnail_url || itemImg;
            const isSablon = Boolean(item.service_id || item.sablon_type || item.design_type || item.design_id);
            const isAi = item.design_type === 'ai_generated' || item.design?.design_type === 'ai_generated';
            const details = renderItemDetails(item);
            const itemName = item.product?.name || item.service?.name || item.product_name || 'Item Sablon';
            const itemPrice = item.unit_price || item.price || 0;
            const itemSubtotal = item.subtotal || (item.quantity * itemPrice);

            return (
              <div key={idx} className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-4 sm:p-4.5 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {itemImg ? (
                      <div className="relative group/img flex-shrink-0 cursor-zoom-in w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black/50 border border-white/10 p-1 group-hover/img:border-primary transition-all">
                        <OptimizedImage
                          src={itemImg}
                          thumbnailSrc={thumbImg}
                          variant="thumbnail"
                          alt={itemName}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain"
                          onClick={() => setLightboxImage(itemImg)}
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxImage(itemImg)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity z-10"
                          title="Perbesar Desain"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isSablon ? (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center flex-shrink-0 text-white/40">
                        <Palette className="w-5 h-5 text-primary/70 mb-1" />
                        <span className="text-[9px]">Sablon</span>
                      </div>
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-white/40">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <p className="text-white text-xs sm:text-sm font-semibold truncate">{itemName}</p>
                        {isSablon && (
                          <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                            isAi ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' : 'text-primary bg-primary/10 border border-primary/20'
                          }`}>
                            {isAi ? <Sparkles size={10} /> : <Upload size={10} />}
                            {isAi ? 'Desain AI' : 'Upload File'}
                          </span>
                        )}
                      </div>

                      {item.product?.id && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-white/40 text-[10px] font-mono">ID: #{item.product.id}</span>
                          <CopyId id={item.product.id} />
                        </div>
                      )}

                      {item.design?.prompt && (
                        <p className="text-white/70 text-[11px] italic line-clamp-2 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 mb-2 leading-relaxed">
                          &ldquo;{item.design.prompt}&rdquo;
                        </p>
                      )}

                      {details.length > 0 && (
                        <div className="flex items-center gap-2 text-[11px] text-white/60 flex-wrap mb-2">
                          {details.map((det, dIdx) => (
                            <span key={dIdx} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-white/80">
                              {det}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3.5 mt-2.5">
                        <span className="text-white/50 text-[11px] font-mono">
                          {item.quantity} pcs &times; {formatRupiah(itemPrice)}
                        </span>
                        {itemImg && (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(itemImg)}
                            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium ml-1"
                          >
                            <ZoomIn className="w-3 h-3" /> Preview
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 flex sm:block items-center justify-between">
                    <span className="sm:hidden text-white/40 text-[11px]">Subtotal:</span>
                    <p className="text-primary font-bold text-sm sm:text-base font-mono">{formatRupiah(itemSubtotal)}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-4">
            <span className="text-white font-semibold text-xs sm:text-[13px] uppercase tracking-wider">Total Biaya Pesanan</span>
            <span className="text-primary font-bold text-lg sm:text-xl font-mono bg-gradient-to-r from-primary via-[#ff8ac8] to-purple-300 bg-clip-text text-transparent">
              {formatRupiah(order.total_price)}
            </span>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            aria-label="Tutup"
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2.5 backdrop-blur-sm"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Preview Desain"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20 bg-[#120c16]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}