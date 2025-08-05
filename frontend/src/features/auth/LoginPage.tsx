import React from 'react';
import { useForm } from 'react-hook-form';
import { useLoginMutation } from './authApiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { register, handleSubmit } = useForm();
    const [login, { isLoading }] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            const userData = await login(data).unwrap();
            dispatch(setCredentials(userData.data));
            navigate('/');
        } catch (err) {
            alert('Giriş Başarısız: ' + (err.data?.error || 'Sunucu Hatası'));
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-base-200">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title justify-center">Giriş Yap</h2>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">E-posta</span>
                            </label>
                            <input
                                type="email"
                                placeholder="eposta@adresiniz.com"
                                className="input input-bordered"
                                {...register('email', { required: true })}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Şifre</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Şifreniz"
                                className="input input-bordered"
                                {...register('password', { required: true })}
                            />
                        </div>
                        <div className="form-control mt-6">
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? <span className="loading loading-spinner"></span> : 'Giriş Yap'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;