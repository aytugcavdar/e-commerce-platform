// frontend/src/pages/NotFoundPage.tsx

import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/base';

/**
 * 🎓 ÖĞREN: 404 Not Found Page
 * 
 * Kullanıcı olmayan bir URL'e girdiğinde gösterilir.
 * 
 * Özellikler:
 * - Kullanıcı dostu mesaj
 * - Ana sayfaya dönüş butonu
 * - Geri gitme butonu
 * - Popüler sayfalara linkler
 * - Arama önerisi
 */

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          {/* 🎨 404 Animasyonu */}
          <div className="mb-8 relative">
            {/* Büyük 404 Yazısı */}
            <h1 className="text-9xl font-bold text-gray-200 select-none">
              404
            </h1>
            
            {/* Üzgün Emoji */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl animate-bounce">😕</span>
            </div>
          </div>

          {/* 📝 Başlık ve Açıklama */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Aradığınız sayfa mevcut değil, taşınmış veya silinmiş olabilir.
          </p>

          {/* 🔍 Arama Çubuğu (Opsiyonel) */}
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Ne aramıştınız?"
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query) {
                      navigate(`/products?search=${encodeURIComponent(query)}`);
                    }
                  }
                }}
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* 🔗 Ana Butonlar */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="lg"
            >
              ← Geri Git
            </Button>

            <Button
              as={Link}
              to="/"
              size="lg"
            >
              🏠 Ana Sayfa
            </Button>
          </div>

          {/* 📌 Popüler Sayfalar */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Popüler Sayfalar
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { to: '/products', icon: '🛍️', label: 'Ürünler' },
                { to: '/cart', icon: '🛒', label: 'Sepetim' },
                { to: '/orders', icon: '📦', label: 'Siparişlerim' },
                { to: '/profile', icon: '👤', label: 'Profilim' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* 💡 Yardım Metni */}
          <div className="mt-8 text-sm text-gray-500">
            <p>
              Sorun devam ediyorsa{' '}
              <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                destek ekibimizle
              </Link>
              {' '}iletişime geçebilirsiniz.
            </p>
          </div>
        </div>
      </Container>

      {/* 🎨 Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>
    </div>
  );
};

export default NotFoundPage;

/**
 * 🎯 ROUTE YAPISI:
 * 
 * // routes/index.tsx
 * <Route path="/404" element={<NotFoundPage />} />
 * <Route path="*" element={<Navigate to="/404" replace />} />
 */

/**
 * 💡 PRO TIP: Custom 404 Messages
 * 
 * URL'e göre özel mesajlar:
 * 
 * const location = useLocation();
 * 
 * const getMessage = () => {
 *   if (location.pathname.includes('/products')) {
 *     return 'Bu ürün bulunamadı veya stoktan kaldırıldı.';
 *   }
 *   if (location.pathname.includes('/orders')) {
 *     return 'Bu sipariş bulunamadı.';
 *   }
 *   return 'Aradığınız sayfa bulunamadı.';
 * };
 */

/**
 * 🔥 BEST PRACTICE: Analytics
 * 
 * useEffect(() => {
 *   // 404 olayını track et
 *   gtag('event', 'page_not_found', {
 *     page_path: location.pathname,
 *     referrer: document.referrer,
 *   });
 * }, [location.pathname]);
 * 
 * Bu sayede hangi sayfalara 404 hatası verildiğini görebilirsin!
 */

/**
 * 🎨 CSS ANIMATION (tailwind.config.js):
 * 
 * module.exports = {
 *   theme: {
 *     extend: {
 *       animation: {
 *         blob: "blob 7s infinite",
 *       },
 *       keyframes: {
 *         blob: {
 *           "0%": { transform: "translate(0px, 0px) scale(1)" },
 *           "33%": { transform: "translate(30px, -50px) scale(1.1)" },
 *           "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
 *           "100%": { transform: "translate(0px, 0px) scale(1)" },
 *         },
 *       },
 *     },
 *   },
 * }
 */