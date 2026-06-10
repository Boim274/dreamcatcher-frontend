import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

export default function Footer() {
  return (
    <footer className="bg-ink border-t border-dark">
      <div className="max-w-7xl mx-auto px-[5%] py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 no-underline">
              <img src="/logo.png" alt="Dreamcatcher" className="h-10" />
              <span className="font-heading text-[22px] text-primary tracking-[2px]">
                Dream<span className="text-[#ef69a9]">catcher</span>
              </span>
            </Link>
            <p className="text-gray text-[13px] mt-4 leading-relaxed">
              Solusi sablon kaos custom dengan teknologi AI modern. Kaos, Hoodie, Polo, Jaket — Plastisol, DTF, Polyflex, Sublim.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-[18px] text-chrome tracking-[1px] mb-4">NAVIGASI</h3>
            <ul className="space-y-2 list-none">
              <li><Link to="/layanan" className="text-gray hover:text-primary transition-colors text-[13px] no-underline tracking-[1px]">Layanan</Link></li>
              <li><Link to="/design-studio" className="text-gray hover:text-primary transition-colors text-[13px] no-underline tracking-[1px]">Design Studio</Link></li>
              <li><Link to="/pricelist" className="text-gray hover:text-primary transition-colors text-[13px] no-underline tracking-[1px]">Daftar Harga</Link></li>
              <li><Link to="/size-chart" className="text-gray hover:text-primary transition-colors text-[13px] no-underline tracking-[1px]">Size Chart</Link></li>
              <li><Link to="/about" className="text-gray hover:text-primary transition-colors text-[13px] no-underline tracking-[1px]">Tentang Kami</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-[18px] text-chrome tracking-[1px] mb-4">KONTAK</h3>
            <ul className="space-y-3 list-none">
              <li className="flex items-start gap-2 text-gray text-[13px]">
                <Icon name="map-pin" size={14} className="mt-1 flex-shrink-0" />
                <span>Perum. Mutiara Bekasi Jaya Blok A2 No.6, RT 001/RW 008, Kec. Cibarusah, Kab. Bekasi, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-2 text-gray text-[13px]">
                <Icon name="phone" size={14} className="flex-shrink-0" />
                <span>+62 878-7729-4587</span>
              </li>
              <li className="flex items-center gap-2 text-gray text-[13px]">
                <Icon name="mail" size={14} className="flex-shrink-0" />
                <span>hello@dreamcatcherprint.co.id</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-[18px] text-chrome tracking-[1px] mb-4">JAM OPERASIONAL</h3>
            <ul className="space-y-2 list-none">
              <li className="flex items-center gap-2 text-gray text-[13px]">
                <Icon name="clock" size={14} /> Senin–Sabtu: 08.00–18.00 WIB
              </li>
              <li className="flex items-center gap-2 text-gray text-[13px]">
                <Icon name="clock" size={14} /> Minggu: Tutup
              </li>
            </ul>
            <a target="_blank" href="https://www.instagram.com/dcservice.png/"  className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary-light transition-colors text-[13px] no-underline">
              <Icon name="instagram" size={14} /> @dcservice.png
            </a>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-gray text-[11px] tracking-[1px]">
          &copy; {new Date().getFullYear()} Dreamcatcher.id. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
