export function formatRupiah(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + num.toLocaleString('id-ID');
}

export function getMinPrice(service) {
  if (service?.pricing_type !== 'tiered') return null;
  const config = service.pricing_config || {};
  let min = Infinity;
  for (const type of Object.values(config)) {
    if (type.lusin_2_6 && Number(type.lusin_2_6) < min) min = Number(type.lusin_2_6);
    if (type.lusin_1 && Number(type.lusin_1) < min) min = Number(type.lusin_1);
    if (type.satuan && Number(type.satuan) < min) min = Number(type.satuan);
  }
  return min === Infinity ? null : min;
}
