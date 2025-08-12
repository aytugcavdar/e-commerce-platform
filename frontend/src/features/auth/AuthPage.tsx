import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLoginMutation, useRegisterMutation } from './authApiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../../hooks/useNotify';



const notify = useNotify();

interface LoginFormData {
    email: string;
    password: string;
}

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar?: FileList;
}

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    
    const { register: registerField, handleSubmit, reset, watch } = useForm();
    const [login, { isLoading: loginLoading }] = useLoginMutation();
    const [register, { isLoading: registerLoading }] = useRegisterMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const watchedAvatar = watch('avatar');

    // Avatar önizleme
    React.useEffect(() => {
        if (watchedAvatar && watchedAvatar[0]) {
            const file = watchedAvatar[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setAvatarPreview(null);
        }
    }, [watchedAvatar]);

   const onSubmit = async (data: any) => {
        try {
            if (isLogin) {
                const userData = await login(data).unwrap();
                dispatch(setCredentials(userData.data));
                notify.success('Başarıyla giriş yapıldı!');
                navigate('/');
            } else {
                const formData = new FormData();
                // ... (formData'ya ekleme işlemleri aynı kalıyor)
                
                await register(formData).unwrap();
                notify.info('Kayıt başarılı! Lütfen hesabınızı doğrulamak için e-posta adresinizi kontrol edin.');
                setIsLogin(true);
                reset();
                setAvatarPreview(null);
            }
        } catch (err: any) {
            notify.error((isLogin ? 'Giriş' : 'Kayıt') + ' başarısız: ' + (err.data?.message || 'Sunucu Hatası'));
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        reset();
        setAvatarPreview(null);
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    {/* Header */}
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold">
                            {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
                        </h2>
                        <p className="text-base-content/70 text-sm mt-1">
                            {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Register Only Fields */}
                        {!isLogin && (
                            <>
                                {/* Avatar Upload */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Profil Fotoğrafı</span>
                                        <span className="label-text-alt text-xs">(Opsiyonel)</span>
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <div className="avatar">
                                            <div className="w-16 h-16 rounded-full bg-base-300">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="Preview" className="rounded-full" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-base-content/50">
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="file-input file-input-sm file-input-bordered flex-1"
                                            {...registerField('avatar')}
                                        />
                                    </div>
                                </div>

                                {/* Name Fields */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Ad</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Adınız"
                                            className="input input-bordered input-sm"
                                            {...registerField('firstName', { required: !isLogin })}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Soyad</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Soyadınız"
                                            className="input input-bordered input-sm"
                                            {...registerField('lastName', { required: !isLogin })}
                                        />
                                    </div>
                                </div>

                                {/* Username */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Kullanıcı Adı</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="kullanici_adi"
                                        className="input input-bordered"
                                        {...registerField('username', { required: !isLogin })}
                                    />
                                </div>
                            </>
                        )}

                        {/* Email */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">E-posta</span>
                            </label>
                            <input
                                type="email"
                                placeholder="eposta@adresiniz.com"
                                className="input input-bordered"
                                {...registerField('email', { required: true })}
                            />
                        </div>

                        {/* Password */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Şifre</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Şifreniz"
                                className="input input-bordered"
                                {...registerField('password', { required: true, minLength: 6 })}
                            />
                            {!isLogin && (
                                <label className="label">
                                    <span className="label-text-alt text-xs">En az 6 karakter</span>
                                </label>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="form-control mt-6">
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={loginLoading || registerLoading}
                            >
                                {(loginLoading || registerLoading) ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        {isLogin ? 'Giriş yapılıyor...' : 'Kayıt oluşturuluyor...'}
                                    </>
                                ) : (
                                    isLogin ? 'Giriş Yap' : 'Hesap Oluştur'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Toggle Mode */}
                    <div className="divider text-xs">VEYA</div>
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="btn btn-ghost btn-sm"
                        >
                            {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
                        </button>
                    </div>

                    {/* Forgot Password Link (only for login) */}
                    {isLogin && (
                        <div className="text-center mt-2">
                            <button type="button" className="btn btn-ghost btn-xs text-base-content/70">
                                Şifremi Unuttum
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;