export function formatRupiah(value) {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

export function getMinPrice(service) {
  if (!service) return 0;
  const base = parseFloat(service.base_price || service.price_per_unit) || 0;
  if (service.pricing_type !== 'tiered') return base;
  const config = service.pricing_config || {};
  let min = Infinity;
  for (const type of Object.values(config)) {
    if (!type || typeof type !== 'object') continue;
    if (type.lusin_2_6 && Number(type.lusin_2_6) > 0 && Number(type.lusin_2_6) < min) min = Number(type.lusin_2_6);
    if (type.lusin_1 && Number(type.lusin_1) > 0 && Number(type.lusin_1) < min) min = Number(type.lusin_1);
    if (type.satuan && Number(type.satuan) > 0 && Number(type.satuan) < min) min = Number(type.satuan);
  }
  if (base > 0 && (min === Infinity || base < min)) {
    return base;
  }
  return min === Infinity ? base : min;
}
