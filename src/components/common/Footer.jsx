import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#FF6B35] rounded-lg flex items-center justify-center">
                <Icon name="scissors" size={20} className="text-white" />
              </div>
              <span className="font-bold text-xl">Dreamcatcher<span className="text-[#FF6B35]">.id</span></span>
            </Link>
            <p className="text-gray-400 text-sm">
              Solusi sablon dan printing dengan teknologi AI modern.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Layanan</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/layanan" className="hover:text-[#FF6B35] transition-colors flex items-center gap-2"><Icon name="chevron-right" size={16} /> Sablon Kaos</Link></li>
              <li><Link to="/layanan" className="hover:text-[#FF6B35] transition-colors flex items-center gap-2"><Icon name="chevron-right" size={16} /> Printing Banner</Link></li>
              <li><Link to="/layanan" className="hover:text-[#FF6B35] transition-colors flex items-center gap-2"><Icon name="chevron-right" size={16} /> Cetak Stiker</Link></li>
              <li><Link to="/layanan" className="hover:text-[#FF6B35] transition-colors flex items-center gap-2"><Icon name="chevron-right" size={16} /> Bordir</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <Icon name="map-pin" size={16} className="mt-1 flex-shrink-0" />
                <span>Jl. Sudirman No. 123, Jakarta Selatan</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="phone" size={16} className="flex-shrink-0" />
                <span>+62 812 3456 7890</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="mail" size={16} className="flex-shrink-0" />
                <span>info@dreamcatcher.id</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Jam Operasional</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center gap-2"><Icon name="clock" size={16} /> Senin - Jumat: 09.00 - 18.00</li>
              <li className="flex items-center gap-2"><Icon name="clock" size={16} /> Sabtu: 09.00 - 15.00</li>
              <li className="flex items-center gap-2"><Icon name="clock" size={16} /> Minggu: Tutup</li>
            </ul>
            <a href="https://instagram.com/dreamcatcher.id" className="inline-flex items-center gap-2 mt-4 text-[#FF6B35] hover:text-[#FF8C5A] transition-colors">
              <Icon name="instagram" size={16} /> @dreamcatcher.id
            </a>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Dreamcatcher.id. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}