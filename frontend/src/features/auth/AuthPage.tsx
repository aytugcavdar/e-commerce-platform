import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLoginMutation, useRegisterUserMutation } from './authApiSlice';
import { setCredentials } from './authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginSchema, registerSchema, LoginFormValues, RegisterFormValues } from './authSchema'; // Bu dosyayı oluşturduğunuzdan emin olun

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerUser, { isLoading: isRegisterLoading }] = useRegisterUserMutation();

  // React Hook Form kurulumu
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Formu temizlemek için
  } = useForm<LoginFormValues | RegisterFormValues>({
    // isLogin state'ine göre dinamik olarak doğru validasyon şemasını seçiyoruz
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    // Varsayılan değerler, form değiştirildiğinde hataları temizlemek için
    defaultValues: {
      name: '',
      email: '',
      password: '',
    }
  });

  // Form gönderildiğinde react-hook-form tarafından çağrılacak fonksiyon
  const onSubmit = async (data: LoginFormValues | RegisterFormValues) => {
    try {
      if (isLogin) {
        const userData = await login(data as LoginFormValues).unwrap();
        dispatch(setCredentials({ ...userData }));
        navigate('/');
        toast.success('Başarıyla giriş yapıldı!');
      } else {
        await registerUser(data as RegisterFormValues).unwrap();
        toast.success('Kayıt başarılı! Lütfen giriş yapın.');
        setIsLogin(true); // Kayıttan sonra giriş ekranına yönlendir
      }
      reset(); // Formu temizle
    } catch (err: any) {
      toast.error(err.data?.message || 'Bir hata oluştu');
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    reset(); // Form modunu değiştirirken hataları ve inputları temizle
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <div className="card w-full max-w-sm shrink-0 bg-base-100 shadow-2xl">
        {/* handleSubmit fonksiyonu önce Zod validasyonunu çalıştırır.
            Eğer validasyon başarılı olursa, bizim onSubmit fonksiyonumuzu çağırır. */}
        <form onSubmit={handleSubmit(onSubmit)} className="card-body">
          <h2 className="card-title text-2xl font-bold text-center mb-4">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </h2>

          {!isLogin && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">İsim</span>
              </label>
              <input
                type="text"
                placeholder="İsminizi girin"
                className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                {...register('name')}
              />
              {errors.name && <span className="text-error text-xs mt-1">{errors.name.message}</span>}
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
              {...register('email')}
            />
            {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Şifre</span>
            </label>
            <input
              type="password"
              placeholder="******"
              className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            {errors.password && <span className="text-error text-xs mt-1">{errors.password.message}</span>}
          </div>
          
          <div className="form-control mt-6">
            <button className="btn btn-primary" type="submit" disabled={isLoginLoading || isRegisterLoading}>
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="link link-hover text-sm"
            >
              {isLogin ? 'Hesabınız yok mu? Kayıt Olun' : 'Zaten bir hesabınız var mı? Giriş Yapın'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;