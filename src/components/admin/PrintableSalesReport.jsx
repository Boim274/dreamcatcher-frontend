import { useRef } from 'react';
import { Printer, Download, X, Building2, Calendar, FileText, CheckCircle2, DollarSign, TrendingUp, Package } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

export default function PrintableSalesReport({
  stats,
  dateFrom,
  dateTo,
  chartTitle,
  onClose,
  onExportCSV,
}) {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const totalRevenue = stats?.stats?.total_revenue ?? stats?.stats?.month_revenue ?? 0;
  const totalOrders = stats?.stats?.period_orders ?? stats?.stats?.today_orders ?? 0;
  const completedOrders = stats?.stats?.completed_orders ?? stats?.status_counts?.completed ?? 0;
  const aov = stats?.stats?.avg_order_value ?? (totalOrders > 0 ? Math.round(totalRevenue / Math.max(1, completedOrders || totalOrders)) : 0);
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const chartLabels = stats?.chart_data?.labels || [];
  const chartOrders = stats?.chart_data?.datasets?.[0]?.data || [];
  const chartCompleted = stats?.chart_data?.datasets?.[1]?.data || [];
  const chartRevenues = stats?.chart_data?.daily_revenues || stats?.chart_data?.datasets?.[2]?.data || [];

  const ordersList = stats?.orders_list || [];

  const statusLabelMap = {
    pending: 'Pesanan Diterima',
    waiting_payment: 'Menunggu Bayar',
    waiting_verification: 'Menunggu Verifikasi',
    ready_to_process: 'Siap Diproses',
    processing: 'Sedang Diproses',
    ready_for_pickup: 'Siap Diambil/Kirim',
    completed: 'Selesai',
    cancel_requested: 'Permintaan Batal',
    cancelled: 'Dibatalkan',
  };

  const paymentStatusMap = {
    pending: 'Belum Bayar',
    waiting_verification: 'Verifikasi',
    dp: 'DP 50%',
    paid: 'Lunas',
    rejected: 'Ditolak',
  };

  const currentDateFormatted = new Date().toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl my-6 bg-zinc-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar (No Print) */}
        <div className="no-print p-4 bg-black/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-heading text-lg text-white tracking-wide">
                Pratinjau Dokumen Laporan Penjualan
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Periode: {chartTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-[#ff60a8] hover:brightness-110 active:scale-95 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/30 transition-all cursor-pointer border-none"
              title="Cetak Laporan ke Printer atau Simpan sebagai PDF"
            >
              <Printer size={15} />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={onExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
              title="Unduh File CSV / Excel"
            >
              <Download size={14} className="text-emerald-400" />
              <span>Unduh CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Paper Canvas */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-zinc-950/60 flex justify-center">
          <div
            ref={printRef}
            className="printable-report-wrapper w-full max-w-[210mm] bg-white text-slate-900 p-6 sm:p-10 shadow-2xl rounded-2xl transition-all font-sans text-xs"
          >
            {/* Kop Surat Resmi Studio */}
            <div className="border-b-4 border-double border-slate-900 pb-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-heading text-2xl font-bold tracking-wider">
                    DC
                  </div>
                  <div>
                    <h1 className="font-heading text-2xl sm:text-3xl tracking-[1.5px] uppercase font-bold text-slate-900 leading-tight">
                      DREAMCATCHER CUSTOM APPAREL
                    </h1>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Workshop Sablon Kaos Kustom, DTF, Rubber & Merchandise Studio
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Jl. Percetakan Kreatif No. 12, Bekasi · WhatsApp: 0812-3456-7890 · www.dreamcatcher.id
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 font-bold text-[10px] uppercase tracking-widest text-slate-800">
                    LAPORAN RESMI
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    No. Ref: REP-{new Date().getTime().toString().slice(-6)}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Title & Meta Box */}
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl sm:text-2xl tracking-wide uppercase font-bold text-slate-900">
                LAPORAN KEUANGAN & REKAPITULASI PENJUALAN
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-600 mt-1">
                <span><strong>PERIODE:</strong> {chartTitle}</span>
                <span>•</span>
                <span><strong>WAKTU CETAK:</strong> {currentDateFormatted} WIB</span>
                <span>•</span>
                <span><strong>OTORISASI:</strong> Administrator Studio</span>
              </div>
            </div>

            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Total Pendapatan Riil
                </span>
                <p className="font-mono text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {formatRupiah(totalRevenue)}
                </p>
                <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
                  ✓ Pesanan Valid & Terverifikasi
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Volume Pesanan Masuk
                </span>
                <p className="font-mono text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {totalOrders} <span className="text-xs font-normal text-slate-500">Order</span>
                </p>
                <span className="text-[9px] text-slate-600 block mt-0.5">
                  Dalam periode terpilih
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Pesanan Selesai
                </span>
                <p className="font-mono text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {completedOrders} <span className="text-xs font-normal text-slate-500">Order ({completionRate}%)</span>
                </p>
                <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
                  Tingkat keberhasilan
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Rata-rata Order (AOV)
                </span>
                <p className="font-mono text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {formatRupiah(aov)}
                </p>
                <span className="text-[9px] text-slate-600 block mt-0.5">
                  Nilai rata-rata per transaksi
                </span>
              </div>
            </div>

            {/* Daily Breakdown Table */}
            {chartLabels.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-300">
                  <h3 className="font-heading text-sm uppercase font-bold tracking-wider text-slate-800">
                    Rekapitulasi Histori Harian
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    {chartLabels.length} Periode Hari
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-slate-200 border-collapse">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="px-3 py-2 border-r border-slate-200">Tanggal</th>
                        <th className="px-3 py-2 border-r border-slate-200 text-center">Volume Order</th>
                        <th className="px-3 py-2 border-r border-slate-200 text-center">Order Selesai</th>
                        <th className="px-3 py-2 text-right">Pendapatan Riil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px] font-mono">
                      {chartLabels.map((date, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="px-3 py-1.5 border-r border-slate-200 font-semibold">{date}</td>
                          <td className="px-3 py-1.5 border-r border-slate-200 text-center">{chartOrders[idx] || 0}</td>
                          <td className="px-3 py-1.5 border-r border-slate-200 text-center text-emerald-700 font-semibold">
                            {chartCompleted[idx] || 0}
                          </td>
                          <td className="px-3 py-1.5 text-right font-bold">
                            {formatRupiah(chartRevenues[idx] || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-[11px] font-mono border-t-2 border-slate-300">
                      <tr>
                        <td className="px-3 py-2 border-r border-slate-200 uppercase">TOTAL PERIODE</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center">{chartOrders.reduce((a, b) => a + b, 0)}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center text-emerald-700">
                          {chartCompleted.reduce((a, b) => a + b, 0)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-900 font-bold">
                          {formatRupiah(totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Orders Transaction Table */}
            {ordersList.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-300">
                  <h3 className="font-heading text-sm uppercase font-bold tracking-wider text-slate-800">
                    Daftar Rincian Transaksi Pesanan
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    Total {ordersList.length} Transaksi
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-slate-200 border-collapse">
                    <thead className="bg-slate-100 text-[9px] uppercase font-bold text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="px-2 py-2 border-r border-slate-200">No</th>
                        <th className="px-2 py-2 border-r border-slate-200">Kode & Tanggal</th>
                        <th className="px-2 py-2 border-r border-slate-200">Pelanggan</th>
                        <th className="px-2 py-2 border-r border-slate-200">Layanan & Item</th>
                        <th className="px-2 py-2 border-r border-slate-200 text-center">Status</th>
                        <th className="px-2 py-2 border-r border-slate-200 text-center">Bayar</th>
                        <th className="px-2 py-2 text-right">Nilai Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[10px] font-mono">
                      {ordersList.map((ord, idx) => (
                        <tr key={ord.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="px-2 py-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="px-2 py-2 border-r border-slate-200 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{ord.order_code}</span>
                            <span className="text-[9px] text-slate-500">{ord.created_at?.slice(0, 16)}</span>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-200 font-sans">
                            <span className="font-bold text-slate-800 block truncate max-w-[130px]">{ord.customer_name}</span>
                            <span className="text-[9px] text-slate-500">{ord.phone || '-'}</span>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-200 font-sans text-[10px] leading-tight">
                            {ord.items_summary || `${ord.items_count || 1} item pakaian`}
                          </td>
                          <td className="px-2 py-2 border-r border-slate-200 text-center whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 border border-slate-300">
                              {statusLabelMap[ord.status] || ord.status}
                            </span>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-200 text-center whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 border border-slate-300">
                              {paymentStatusMap[ord.payment_status] || ord.payment_status || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right font-bold whitespace-nowrap">
                            {formatRupiah(ord.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-[10px] font-mono border-t-2 border-slate-300">
                      <tr>
                        <td colSpan="6" className="px-2 py-2 text-right uppercase border-r border-slate-200">
                          GRAND TOTAL TAGIHAN
                        </td>
                        <td className="px-2 py-2 text-right text-slate-900 text-xs font-bold">
                          {formatRupiah(ordersList.reduce((acc, it) => acc + Number(it.total_price || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Legal Signatures / Pengesahan Box */}
            <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs font-sans">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Dibuat & Disiapkan Oleh:</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[10px] text-slate-400 italic">( Tanda Tangan Digital )</span>
                </div>
                <p className="font-bold text-slate-800 border-t border-dashed border-slate-400 pt-1 mt-1 inline-block min-w-[160px]">
                  Admin Operasional & Finansial
                </p>
                <p className="text-[10px] text-slate-500">Dreamcatcher Studio</p>
              </div>

              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Mengetahui & Menyetujui:</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[10px] text-slate-400 italic">( Cap & Verifikasi )</span>
                </div>
                <p className="font-bold text-slate-800 border-t border-dashed border-slate-400 pt-1 mt-1 inline-block min-w-[160px]">
                  Owner / Pimpinan Usaha
                </p>
                <p className="text-[10px] text-slate-500">Dreamcatcher Custom Apparel</p>
              </div>
            </div>

            {/* Document Footnote */}
            <div className="text-center text-[9px] font-mono text-slate-400 pt-6 mt-4 border-t border-slate-200">
              Dokumen ini dicetak otomatis dari Sistem Administrasi Dreamcatcher Apparel. Sah dan berlaku tanpa cap basah jika dicetak resmi dari aplikasi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
