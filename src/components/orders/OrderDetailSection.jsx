import { Truck, MapPin } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import CopyId from './CopyId';

export default function OrderDetailSection({ order }) {
  const items = order.items || [];

  const renderItemDetails = (item) => [
    item.size && `Ukuran ${item.size}`,
    item.selected_color && `Warna ${item.selected_color}`,
    item.sablon_type && `Sablon ${item.sablon_type}`,
    item.print_area && `Posisi ${item.print_area.replace(/_/g, ' ')}`,
    item.print_size && item.print_size,
    item.quantity && `${item.quantity} pcs`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="mt-4 space-y-4">
      <div>
        <h4 className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Detail Pemesan</h4>
        <div className="grid grid-cols-2 gap-2 text-[13px]">
          <div className="bg-ink rounded-lg p-3">
            <p className="text-gray text-[11px] mb-0.5">Nama</p>
            <p className="text-white font-medium">{order.customer_name}</p>
          </div>
          <div className="bg-ink rounded-lg p-3">
            <p className="text-gray text-[11px] mb-0.5">Telepon</p>
            <p className="text-white font-medium">{order.phone}</p>
          </div>
          <div className="bg-ink rounded-lg p-3">
            <p className="text-gray text-[11px] mb-0.5">Pengiriman</p>
            <p className="text-white font-medium flex items-center gap-1.5">
              {order.delivery_method === 'pickup' ? <><MapPin size={12} /> Ambil Sendiri</> : <><Truck size={12} /> Dikirim</>}
            </p>
          </div>
          {order.address && (
            <div className="bg-ink rounded-lg p-3 col-span-2">
              <p className="text-gray text-[11px] mb-0.5">Alamat</p>
              <p className="text-white font-medium">{order.address}</p>
            </div>
          )}
        </div>
      </div>

      {order.description && (
        <div>
          <h4 className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Deskripsi Pesanan</h4>
          <div className="bg-ink rounded-lg p-3">
            <p className="text-gray-light text-[13px] leading-relaxed whitespace-pre-wrap">{order.description}</p>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Item Pesanan</h4>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="bg-ink rounded-lg p-3">
              <div className="flex items-start gap-3">
                {item.product ? (
                  <>
                    {item.product.images?.[0]?.image_url && (
                      <img
                        src={item.product.images[0].image_url}
                        alt={item.product.name}
                        className="w-14 h-14 object-contain bg-ink rounded-lg border border-border flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-medium leading-snug mb-1">{item.product.name || item.product_name}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray text-[10px] font-mono">ID Produk: #{item.product.id}</span>
                        <CopyId id={item.product.id} />
                      </div>
                      <p className="text-gray-light text-[11px] leading-relaxed">{renderItemDetails(item)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    {item.design?.image_url && (
                      <img
                        src={getImageUrl(item.design.image_url)}
                        alt="Desain"
                        className="w-14 h-14 object-contain bg-ink rounded-lg border border-border flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-medium mb-1">{item.service?.name || item.product_name || '-'}</p>
                      <p className="text-gray-light text-[11px] leading-relaxed">{renderItemDetails(item)}</p>
                    </div>
                  </>
                )}
                <p className="text-primary font-semibold text-[13px] whitespace-nowrap flex-shrink-0">{formatRupiah(item.subtotal)}</p>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-white font-semibold text-[13px]">Total</span>
            <span className="text-primary font-bold text-lg">{formatRupiah(order.total_price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}