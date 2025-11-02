// frontend/src/pages/HomePage.tsx

import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Container from '@/shared/components/layout/Container';
import { Button } from '@/shared/components/ui/base';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="py-20">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {isAuthenticated ? (
                <>Hoş Geldiniz, {user?.firstName}! 👋</>
              ) : (
                <>E-Ticaret Dünyasına Hoş Geldiniz! 🛍️</>
              )}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Binlerce üründen oluşan geniş ürün yelpazemizde size en uygun olanı bulun.
              Hızlı kargo, güvenli ödeme ve 7/24 müşteri desteği.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link to="/products">
                    <Button size="lg">
                      Ürünlere Göz At
                    </Button>
                  </Link>
                  <Link to="/orders">
                    <Button variant="outline" size="lg">
                      Siparişlerim
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg">
                      Hemen Başla
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg">
                      Giriş Yap
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Güvenli Ödeme</h3>
              <p className="text-gray-600">
                256-bit SSL şifreleme ile güvenli ödeme. Kredi kartı, banka kartı ve havale seçenekleri.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Hızlı Kargo</h3>
              <p className="text-gray-600">
                Aynı gün kargo imkanı. Ücretsiz kargo 200 TL ve üzeri alışverişlerde.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">7/24 Destek</h3>
              <p className="text-gray-600">
                Canlı destek ekibimiz her zaman yanınızda. Soru ve sorunlarınız için bize ulaşın.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Mutlu Müşteri</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Ürün Çeşidi</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-blue-100">Marka</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99%</div>
              <div className="text-blue-100">Müşteri Memnuniyeti</div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Hemen Alışverişe Başlayın!
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Ücretsiz hesap oluşturun ve kampanyalardan haberdar olun.
              </p>
              <Link to="/register">
                <Button size="lg">
                  Ücretsiz Kayıt Ol
                </Button>
              </Link>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
};

export default HomePage;