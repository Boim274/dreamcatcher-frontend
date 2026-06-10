import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import Icon from '../components/ui/Icon';

const sizeData = [
  { size: 'S', chest: '94', length: '68', shoulder: '44', sleeve: '20' },
  { size: 'M', chest: '98', length: '70', shoulder: '46', sleeve: '21' },
  { size: 'L', chest: '102', length: '72', shoulder: '48', sleeve: '22' },
  { size: 'XL', chest: '106', length: '74', shoulder: '50', sleeve: '23' },
  { size: 'XXL', chest: '110', length: '76', shoulder: '52', sleeve: '24' },
];

const measureGuide = [
  { label: 'Lingkar Dada', desc: 'Ukur dari ketiak ke ketiak, lingkarkan penuh', icon: 'maximize' },
  { label: 'Panjang', desc: 'Dari bahu hingga ujung baju', icon: 'arrow-down' },
  { label: 'Lebar Bahu', desc: 'Dari ujung bahu kiri ke ujung bahu kanan', icon: 'arrow-left' },
  { label: 'Panjang Lengan', desc: 'Dari sambungan bahu ke ujung lengan', icon: 'arrow-right' },
];

export default function SizeChartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-tag">&mdash; panduan ukuran</div>
            <h1 className="section-title">SIZE CHART</h1>
            <div className="divider mx-auto"></div>
            <p className="section-sub mx-auto">Pastikan ukuran yang dipilih sesuai untuk hasil terbaik</p>
          </div>

          {/* Size Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink border-b border-border">
                    <th className="text-center p-4 text-fire font-medium">Ukuran</th>
                    <th className="text-center p-4 text-fire font-medium">Lingkar Dada (cm)</th>
                    <th className="text-center p-4 text-fire font-medium">Panjang (cm)</th>
                    <th className="text-center p-4 text-fire font-medium">Lebar Bahu (cm)</th>
                    <th className="text-center p-4 text-fire font-medium">Panjang Lengan (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeData.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-card transition-colors">
                      <td className="p-4 text-center">
                        <span className="bg-fire text-ink font-bold px-3 py-1 rounded-lg text-[14px]">{row.size}</span>
                      </td>
                      <td className="p-4 text-center text-white">{row.chest}</td>
                      <td className="p-4 text-center text-white">{row.length}</td>
                      <td className="p-4 text-center text-white">{row.shoulder}</td>
                      <td className="p-4 text-center text-white">{row.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Measurement Guide */}
          <div className="mb-12">
            <h2 className="font-heading text-[24px] text-fire tracking-[1px] mb-6 text-center">Cara Mengukur</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {measureGuide.map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 text-center">
                  <Icon name={item.icon} size={32} className="mx-auto text-fire mb-3" />
                  <p className="text-white font-medium mb-1">{item.label}</p>
                  <p className="text-gray text-[13px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading text-[20px] text-white tracking-[1px] mb-4">Tips Memilih Ukuran</h3>
            <ul className="space-y-2 text-gray text-[14px]">
              <li className="flex items-start gap-2"><Icon name="check-circle" size={16} className="text-fire mt-0.5" /> Ukur baju yang sudah nyaman dipakai sebagai referensi</li>
              <li className="flex items-start gap-2"><Icon name="check-circle" size={16} className="text-fire mt-0.5" /> Jika di antara dua ukuran, pilih yang lebih besar</li>
              <li className="flex items-start gap-2"><Icon name="check-circle" size={16} className="text-fire mt-0.5" /> Cotton Combed 24s cenderung mengalami penyusutan 3-5% setelah pencucian pertama</li>
              <li className="flex items-start gap-2"><Icon name="check-circle" size={16} className="text-fire mt-0.5" /> Untuk pesanan custom size, silakan hubungi admin</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
