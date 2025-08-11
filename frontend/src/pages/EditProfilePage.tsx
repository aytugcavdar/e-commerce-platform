import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { RootState } from '../../app/store';
import { useUpdateMeMutation } from '../../features/auth/authApiSlice';
import { setCredentials } from '../../features/auth/authSlice';
// Değişiklik: Merkezi tipleri import ediyoruz
import { User, ProfileUpdateFormData } from '../../types';


const EditProfilePage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [updateMe, { isLoading }] = useUpdateMeMutation();

    const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileUpdateFormData>({
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            username: user?.username || '',
        }
    });

    const onSubmit: SubmitHandler<ProfileUpdateFormData> = async (data) => {
        const formData = new FormData();

        // Sadece değişen alanları form verisine ekle
        if (data.firstName !== user?.firstName) formData.append('firstName', data.firstName);
        if (data.lastName !== user?.lastName) formData.append('lastName', data.lastName);
        if (data.username !== user?.username) formData.append('username', data.username);
        if (data.avatar && data.avatar[0]) {
            formData.append('avatar', data.avatar[0]);
        }
        
        // Güncellenecek bir şey yoksa işlemi durdur
        if (!isDirty && !(data.avatar && data.avatar.length > 0)) {
             toast.info('Değişiklik yapılmadı.');
             return;
        }

        try {
            const result = await updateMe(formData).unwrap();
            const updatedUser: User = result.data.user;

            dispatch(setCredentials({ user: updatedUser, token: 'token_from_cookie' }));
            toast.success('Profil başarıyla güncellendi!');
            navigate('/profile');
        } catch (err) {
            toast.error('Profil güncellenirken bir hata oluştu.');
            console.error(err);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Profili Düzenle</h1>
            <div className="max-w-lg mx-auto card bg-base-100 shadow-xl p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Ad</span></label>
                        <input type="text" {...register('firstName', { required: 'Ad zorunludur' })} className="input input-bordered w-full" />
                        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                    </div>
                     <div className="form-control">
                        <label className="label"><span className="label-text">Soyad</span></label>
                        <input type="text" {...register('lastName', { required: 'Soyad zorunludur' })} className="input input-bordered w-full" />
                        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                    </div>
                     <div className="form-control">
                        <label className="label"><span className="label-text">Kullanıcı Adı</span></label>
                        <input type="text" {...register('username', { required: 'Kullanıcı adı zorunludur' })} className="input input-bordered w-full" />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                    </div>
                     <div className="form-control">
                        <label className="label"><span className="label-text">Profil Fotoğrafını Değiştir</span></label>
                        <input type="file" {...register('avatar')} accept="image/*" className="file-input file-input-bordered w-full" />
                    </div>

                    <div className="flex justify-end pt-4 gap-2">
                         <button type="button" onClick={() => navigate('/profile')} className="btn btn-ghost">İptal</button>
                         <button type="submit" className="btn btn-primary" disabled={isLoading || !isDirty}>
                            {isLoading ? <span className="loading loading-spinner"></span> : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;