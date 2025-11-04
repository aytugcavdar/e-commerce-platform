// frontend/src/features/user/pages/ProfilePage.tsx

import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Container } from '@/shared/components/layout';
import { Loading } from '@/shared/components/ui/feedback';

/**
 * 🎓 ÖĞREN: Profil Görüntüleme Sayfası
 *
 * Sorumlulukları:
 * 1. `useAuth` hook'u aracılığıyla mevcut kullanıcı verilerini almak.
 * 2. `isLoading` durumunu yönetmek, veri yüklenirken bir 'Loading' göstermek.
 * 3. Kullanıcı verisi yoksa (örn. token geçersizse) bir hata mesajı ve giriş sayfasına yönlendirme göstermek.
 * 4. Kullanıcı bilgilerini (avatar, ad, soyad, e-posta) ekranda sergilemek.
 * 5. Profili düzenleme sayfasına bir `Link` sağlamak.
 */
const ProfilePage = () => {
  // 🎯 KULLANIM ÖRNEĞİ: useAuth hook'u ile global state'den kullanıcı verisi çekilir.
  const { user, isLoading } = useAuth();

  // 🔥 BEST PRACTICE: Veri yüklenirken (örn. sayfa yenilendiğinde checkAuth çalışırken)
  // kullanıcıya bir yüklenme göstergesi sunmak.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  // 💡 PRO TIP: ProtectedRoute bu senaryoyu yakalasa da,
  // bileşen içinde de bir yedek kontrol (fallback) olması iyidir.
  if (!user) {
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Erişim Hatası</h2>
          <p className="text-gray-600 mb-6">
            Kullanıcı bilgileri yüklenemedi. Lütfen tekrar giriş yapmayı deneyin.
          </p>
          <Link
            to="/login"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Giriş Yap
          </Link>
        </div>
      </Container>
    );
  }

  // Kullanıcı bilgileri yüklendiğinde
  return (
    <Container>
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white shadow-xl rounded-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">Profilim</h1>

        {/* Avatar ve İsim */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl font-bold border-4 border-blue-200">
            {/* 💡 TODO: Gerçek avatar URL'si gelince burası <img /> ile değiştirilebilir. */}
            {user.firstName?.charAt(0).toUpperCase()}
            {user.lastName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* Profil Detayları */}
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-gray-500">Ad</span>
            <p className="text-lg text-gray-900">{user.firstName}</p>
          </div>
          <hr />
          <div>
            <span className="block text-sm font-medium text-gray-500">Soyad</span>
            <p className="text-lg text-gray-900">{user.lastName}</p>
          </div>
          <hr />
          <div>
            <span className="block text-sm font-medium text-gray-500">E-posta Adresi</span>
            <p className="text-lg text-gray-900">{user.email}</p>
          </div>
          <hr />
          <div>
            <span className="block text-sm font-medium text-gray-500">Kullanıcı Rolü</span>
            <p className="text-lg text-gray-900 capitalize px-3 py-1 bg-gray-100 rounded-full inline-block">
              {user.role}
            </p>
          </div>
        </div>

        {/* Düzenle Butonu */}
        <div className="mt-10 text-right">
          <Link
            to="/profile/edit"
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
              />
            </svg>
            Profili Düzenle
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default ProfilePage;