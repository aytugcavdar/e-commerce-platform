// frontend/src/shared/components/layout/Footer.tsx

import { Link } from 'react-router-dom';
import Container from './Container';
import { env } from '@/config/env';

/**
 * 🎓 ÖĞREN: Footer Component
 *
 * Sorumlulukları:
 * 1. Marka/Logo ve kısa açıklama.
 * 2. Hızlı Bağlantılar (Sitedeki önemli sayfalar).
 * 3. İletişim Bilgileri (Adres, tel, email).
 * 4. Sosyal Medya İkonları.
 * 5. Telif Hakkı (Copyright) ve yasal linkler (Gizlilik, Kullanım Koşulları).
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <Container>
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & About */}
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 text-white rounded-lg p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">{env.appName}</span>
              </Link>
              <p className="text-sm leading-relaxed">
                Modern e-ticaret platformu. Binlerce ürünü keşfedin,
                güvenli alışverişin keyfini çıkarın.
              </p>
              {/* Sosyal Medya İkonları */}
              <div className="flex space-x-4 mt-4">
                {/* ... (Sosyal medya ikonları - değişiklik yok) ... */}
              </div>
            </div>

            {/* Hızlı Bağlantılar (E-ticarete göre güncellendi) */}
            <div>
              <h3 className="text-white font-semibold mb-4">Hızlı Bağlantılar</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/products" className="hover:text-blue-400 transition-colors">
                    Ürünler
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-blue-400 transition-colors">
                    Sepetim
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-blue-400 transition-colors">
                    Hakkımızda
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-blue-400 transition-colors">
                    İletişim
                  </Link>
                </li>
              </ul>
            </div>

            {/* İletişim Bilgileri */}
            <div>
              <h3 className="text-white font-semibold mb-4">İletişim</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  {/* ... (Tel ikonu) ... */}
                  <span>+90 (212) 123 45 67</span>
                </li>
                <li className="flex items-start">
                  {/* ... (Mail ikonu) ... */}
                  <span>info@ecommerce.com</span>
                </li>
                <li className="flex items-start">
                  {/* ... (Adres ikonu) ... */}
                  <span>İstanbul, Türkiye</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Alt Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>© {currentYear} {env.appName}. Tüm hakları saklıdır.</p>
            <div className="flex justify-center space-x-4 mt-2">
              <Link to="/privacy" className="hover:text-blue-400 transition-colors">
                Gizlilik Politikası
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-blue-400 transition-colors">
                Kullanım Koşulları
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;