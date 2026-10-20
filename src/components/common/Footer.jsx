import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { NAV_LINKS } from '../../constants/nav';
import { scrollToTop } from '../../utils/scrollToTop';
import { useLanguageStore } from '../../store/languageStore';

export default function Footer() {
  const { t, language } = useLanguageStore();

  const getTranslatedNavLabel = (link) => {
    switch (link.to) {
      case '/': return t('nav.home');
      case '/services': return t('nav.services');
      case '/products': return t('nav.products');
      case '/design-studio': return t('nav.designStudio');
      case '/pricelist': return t('nav.pricelist');
      case '/size-chart': return t('nav.sizeChart');
      case '/portfolio': return t('nav.portfolio');
      case '/about': return t('nav.about');
      case '/contact': return t('nav.contact');
      default: return link.label;
    }
  };

  return (
    <footer className="relative bg-[#0d0711] border-t border-white/10 overflow-hidden text-zinc-300">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-[5%] py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* BRAND COL */}
          <div className="space-y-4">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5 no-underline">
              <img src="/logo.png" alt="Dreamcatcher" className="h-9 w-auto" />
              <span className="font-heading text-[26px] text-white tracking-[2px] leading-none">
                Dream<span className="text-primary">catcher</span>
              </span>
            </Link>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xs">
              {t('footer.aboutText')}
            </p>
          </div>

          {/* NAVIGASI */}
          <div>
            <h3 className="font-heading text-[18px] text-white tracking-[1.5px] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {t('footer.navTitle')}
            </h3>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={scrollToTop}
                    className="text-zinc-400 hover:text-primary transition-colors text-xs font-medium no-underline tracking-wider uppercase inline-block py-0.5"
                  >
                    {getTranslatedNavLabel(link)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* KONTAK */}
          <div>
            <h3 className="font-heading text-[18px] text-white tracking-[1.5px] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {t('footer.contactTitle')}
            </h3>
            <ul className="space-y-3.5 list-none p-0 m-0 text-xs">
              <li className="flex items-start gap-3 text-zinc-400 leading-relaxed">
                <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-primary/20">
                  <Icon name="map-pin" size={14} />
                </div>
                <span className="flex-1">Perum. Mutiara Bekasi Jaya Blok A2 No.6, RT 001/RW 008, Kec. Cibarusah, Kab. Bekasi, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-400">
                <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
                  <Icon name="phone" size={14} />
                </div>
                <span className="font-mono flex-1">+62 878-7729-4587</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-400">
                <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
                  <Icon name="mail" size={14} />
                </div>
                <span className="flex-1">hello@dreamcatcherprint.co.id</span>
              </li>
            </ul>
          </div>

          {/* JAM OPERASIONAL & SOSIAL */}
          <div>
            <h3 className="font-heading text-[18px] text-white tracking-[1.5px] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {t('footer.opTitle')}
            </h3>
            <ul className="space-y-2.5 list-none p-0 m-0 text-xs">
              <li className="flex items-center gap-2.5 text-zinc-400">
                <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name="clock" size={13} />
                </div>
                <span>{t('footer.opDays')}</span>
              </li>
              <li className="flex items-center gap-2.5 text-zinc-400">
                <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 text-zinc-500 flex items-center justify-center shrink-0">
                  <Icon name="clock" size={13} />
                </div>
                <span className="text-zinc-500">{t('footer.opSunday')}</span>
              </li>
            </ul>

            <div className="mt-5 pt-4 border-t border-white/5">
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.instagram.com/dcservice.png/"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 text-zinc-300 hover:text-white transition-all text-xs no-underline"
              >
                <Icon name="instagram" size={15} className="text-primary shrink-0" />
                <span>@dcservice.png</span>
              </a>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px]">
          <p>&copy; {new Date().getFullYear()} Dreamcatcher.id. {t('footer.copyright')}</p>
          <div className="flex items-center gap-4">
            <Link to="/about" onClick={scrollToTop} className="hover:text-primary transition-colors no-underline">{t('footer.aboutUs')}</Link>
            <span>•</span>
            <Link to="/pricelist" onClick={scrollToTop} className="hover:text-primary transition-colors no-underline">{t('footer.pricelist')}</Link>
            <span>•</span>
            <Link to="/size-chart" onClick={scrollToTop} className="hover:text-primary transition-colors no-underline">{t('footer.sizeChart')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
