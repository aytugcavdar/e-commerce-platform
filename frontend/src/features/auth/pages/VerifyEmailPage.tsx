// frontend/src/features/auth/pages/VerifyEmailPage.tsx

import { useEffect, useState, useCallback } from 'react';
// 🎓 ÖĞREN: 'useLocation'ı sildik çünkü artık e-postayı state'den almıyoruz.
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Loading, ErrorMessage, SuccessMessage } from '@/shared/components/ui/feedback';
import { Button } from '@/shared/components/ui/base';

/**
 * 🎓 ÖĞREN: E-posta Doğrulama Sayfası (VerifyEmailPage)
 *
 * Bu sayfa, kullanıcı e-postasındaki doğrulama linkine tıkladığında açılır.
 * Link (örn: /verify-email?token=abc123xyz) yeni bir sekmede açılsa bile
 * çalışacak şekilde tasarlanmıştır.
 *
 * Sorumlulukları:
 * 1. URL'den 'token' parametresini almak.
 * 2. 'token' ile 'verify' (doğrulama) API isteğini tetiklemek.
 * 3. Kullanıcıya yüklenme (loading), başarı (success) veya hata (error) durumunu göstermek.
 */
const VerifyEmailPage = () => {
  /**
   * 🎯 KULLANILAN HOOK'LAR:
   *
   * - useAuth: 'verify' fonksiyonunu ve 'loading' durumunu almak için.
   * - useSearchParams: URL'deki query parametrelerini (?token=...) okumak için.
   * - useState: Sayfanın kendi iç durumunu (loading, success, error) yönetmek için.
   * - useEffect: Component yüklendiğinde SADECE BİR KEZ doğrulama isteğini tetiklemek için.
   * - useCallback: 'Tekrar Dene' butonu için API isteğini tekrar tetikleyebilmek için.
   */
  const { verify } = useAuth();
  const [searchParams] = useSearchParams();

  // 🎓 DEĞİŞİKLİK: 'useLocation' hook'u kaldırıldı.
  // const location = useLocation();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // URL'den sadece token'ı al
  const token = searchParams.get('token');
  
  // 🎓 DEĞİŞİKLİK: 'email' bilgisi location.state'den alınmıyor.
  // const email = location.state?.email;

  /**
   * 🔥 BEST PRACTICE: API İsteğini useCallback ile Sarmalamak
   */
  const handleVerification = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    // 1. 🎓 DEĞİŞİKLİK: Sadece token'ın varlığını kontrol et
    if (!token) {
      setErrorMessage('Geçersiz veya eksik doğrulama bilgisi. Lütfen linki kontrol edin.');
      setStatus('error');
      return;
    }

    // 2. 🎓 DEĞİŞİKLİK: useAuth hook'u üzerinden API isteğini SADECE token ile yap
    const result = await verify({ token });

    // 3. Sonucu değerlendir
    if (result.success) {
      toast.success('E-posta adresiniz başarıyla doğrulandı!');
      setStatus('success');
      // Not: useAuth hook'u başarılı olduğunda kullanıcıyı otomatik olarak
      // /login sayfasına yönlendirecek.
    } else {
      toast.error(result.error || 'Doğrulama sırasında bir hata oluştu.');
      setErrorMessage(result.error || 'Doğrulama başarısız. Lütfen tekrar deneyin veya yeni bir doğrulama e-postası isteyin.');
      setStatus('error');
    }
  // 🎓 DEĞİŞİKLİK: 'email' bağımlılıklardan kaldırıldı.
  }, [verify, token]);

  /**
   * 🎓 ÖĞREN: useEffect ile "Mount" Anında Veri Çekme
   *
   * Component ilk yüklendiğinde (mount olduğunda) SADECE BİR KEZ
   * 'handleVerification' fonksiyonunu çalıştırır.
   */
  useEffect(() => {
    handleVerification();
  }, [handleVerification]);

  // Duruma göre farklı arayüzler göster
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <Loading message="E-posta adresiniz doğrulanıyor..." />;
      
      case 'success':
        return (
          <div className="text-center">
            <SuccessMessage
              title="Doğrulama Başarılı!"
              message="Hesabınız başarıyla doğrulandı. Giriş sayfasına yönlendiriliyorsunuz..."
            />
            <Button
              as={Link}
              to="/login"
              fullWidth
              className="mt-6"
            >
              Giriş Yap Sayfasına Git
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <ErrorMessage
              title="Doğrulama Başarısız"
              message={errorMessage || 'Bilinmeyen bir hata oluştu.'}
            />
            <Button
              onClick={handleVerification}
              fullWidth
              className="mt-6"
              variant="secondary"
            >
              Tekrar Dene
            </Button>
            <Link
              to="/register"
              className="block mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              Yeniden kayıt olmayı dene
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">
          E-posta Doğrulama
        </h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default VerifyEmailPage;