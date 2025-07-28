import React from 'react';
import { useForm } from 'react-hook-form';
import { useLoginMutation } from './authApiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { register, handleSubmit } = useForm();
    const [login, { isLoading }] = useLoginMutation(); // Otomatik oluşturulan hook
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            const userData = await login(data).unwrap(); // .unwrap() ile direkt sonucu al
            dispatch(setCredentials(userData.data));
            navigate('/');
        } catch (err) {
            alert('Giriş Başarısız: ' + (err.data?.error || 'Sunucu Hatası'));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Giriş Yap</h2>
            <input {...register('email', { required: true })} placeholder="E-posta" />
            <input type="password" {...register('password', { required: true })} placeholder="Şifre" />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
        </form>
    );
};

export default LoginPage;