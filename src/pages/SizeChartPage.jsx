import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
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
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="graffiti-deco">SIZE CHART</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; panduan ukuran</div>
              <h1 className="section-title">SIZE<br/>CHART</h1>
              <div className="divider mx-auto"></div>
              <p className="section-sub mx-auto">Pastikan ukuran yang dipilih sesuai untuk hasil terbaik</p>
            </ScrollReveal>
          </div>

          {/* Size Table */}
          <ScrollReveal direction="up" delay={200}>
            <div className="bg-card border border-border rounded-xl overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink border-b border-border">
                      <th className="text-center p-4 text-fire font-medium text-[11px] tracking-[1px] uppercase">Ukuran</th>
                      <th className="text-center p-4 text-fire font-medium text-[11px] tracking-[1px] uppercase">Lingkar Dada</th>
                      <th className="text-center p-4 text-fire font-medium text-[11px] tracking-[1px] uppercase">Panjang</th>
                      <th className="text-center p-4 text-fire font-medium text-[11px] tracking-[1px] uppercase">Lebar Bahu</th>
                      <th className="text-center p-4 text-fire font-medium text-[11px] tracking-[1px] uppercase">Panjang Lengan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeData.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-ink/50 transition-colors">
                        <td className="p-4 text-center">
                          <span className="bg-fire text-ink font-bold px-3 py-1 rounded-lg text-[14px]">{row.size}</span>
                        </td>
                        <td className="p-4 text-center text-white font-medium">{row.chest} cm</td>
                        <td className="p-4 text-center text-white font-medium">{row.length} cm</td>
                        <td className="p-4 text-center text-white font-medium">{row.shoulder} cm</td>
                        <td className="p-4 text-center text-white font-medium">{row.sleeve} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>

          {/* Measurement Guide */}
          <div className="mb-12">
            <ScrollReveal direction="up" delay={300}>
              <h2 className="font-heading text-[24px] text-fire tracking-[1px] mb-6 text-center">Cara Mengukur</h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {measureGuide.map((item, i) => (
                <ScrollReveal key={i} direction="up" delay={400 + i * 100}>
                  <div className="bg-card border border-border rounded-xl p-5 text-center hover:border-fire/30 transition-colors group">
                    <div className="w-14 h-14 bg-fire/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                      <Icon name={item.icon} size={28} className="text-fire" />
                    </div>
                    <p className="text-white font-medium mb-1">{item.label}</p>
                    <p className="text-gray text-[13px] leading-relaxed">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Tips */}
          <ScrollReveal direction="blur">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-[20px] text-white tracking-[1px] mb-4">Tips Memilih Ukuran</h3>
              <ul className="space-y-3 text-gray-light text-[14px]">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-fire/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="check" size={14} className="text-fire" />
                  </div>
                  Ukur baju yang sudah nyaman dipakai sebagai referensi
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-fire/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="check" size={14} className="text-fire" />
                  </div>
                  Jika di antara dua ukuran, pilih yang lebih besar
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-fire/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="check" size={14} className="text-fire" />
                  </div>
                  Cotton Combed 24s cenderung mengalami penyusutan 3-5% setelah pencucian pertama
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-fire/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="check" size={14} className="text-fire" />
                  </div>
                  Untuk pesanan custom size, silakan hubungi admin
                </li>
              </ul>
            </div>
          </ScrollReveal>

        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
