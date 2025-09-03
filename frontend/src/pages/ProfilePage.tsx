import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { Link } from 'react-router-dom';
import { Address } from '../types';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import {
    useAddAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
    useSetDefaultAddressMutation,
} from '../features/users/usersApiSlice';
import { useForm } from 'react-hook-form';
import { useNotify } from '../hooks/useNotify';

type AddressFormData = {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    isDefault: boolean;
};

const ProfilePage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const notify = useNotify();

    console.log('Kullanıcı verisi:', user); // Kullanıcı verisini konsola yazdır

    const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
    const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
    const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();
    const [setDefaultAddress, { isLoading: isSettingDefault }] = useSetDefaultAddressMutation();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<AddressFormData>();

    const openModal = (address: Address | null = null) => {
        setEditingAddress(address);
        if (address) {
            setValue('name', address.name);
            setValue('street', address.street);
            setValue('city', address.city);
            setValue('zipCode', address.zipCode);
            setValue('isDefault', address.isDefault);
        } else {
            reset({
                name: '',
                street: '',
                city: '',
                zipCode: '',
                isDefault: user?.addresses?.length === 0, // İlk adres ise varsayılan yap
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAddress(null);
        reset();
    };

    const onSubmit = async (data: AddressFormData) => {
        try {
            if (editingAddress) {
                await updateAddress({ addressId: editingAddress._id, ...data }).unwrap();
                notify.success('Adres başarıyla güncellendi');
            } else {
                await addAddress(data).unwrap();
                notify.success('Adres başarıyla eklendi');
            }
            closeModal();
        } catch (error) {
            notify.error('İşlem sırasında bir hata oluştu.');
        }
    };

    const handleDelete = async (addressId: string) => {
        if (window.confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
            try {
                await deleteAddress(addressId).unwrap();
                notify.success('Adres başarıyla silindi');
            } catch (error) {
                notify.error('Adres silinirken bir hata oluştu.');
            }
        }
    };

    const handleSetDefault = async (addressId: string) => {
        try {
            await setDefaultAddress(addressId).unwrap();
            notify.success('Varsayılan adres olarak ayarlandı');
        } catch (error) {
            notify.error('Varsayılan adres ayarlanamadı.');
        }
    };

    const isLoadingAction = isAdding || isUpdating || isDeleting || isSettingDefault;

    return (
        <div className="container mx-auto p-4 sm:p-8 bg-base-200 min-h-screen rounded-2xl">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <h1 className="text-4xl font-bold text-base-content">Profilim</h1>
                <Link to="/profile/edit" className="btn btn-outline btn-primary">
                    <FaEdit className="mr-2" /> Profili Düzenle
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sol Taraf: Profil Kartı */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-xl p-6 text-center">
                        <div className="avatar mx-auto mb-4 placeholder">
                            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 bg-neutral-focus text-neutral-content">
                                {user?.avatar?.url ? (
                                    <img src={user.avatar.url} alt={user.username} />
                                ) : (
                                    <span className="text-3xl">{user?.firstName?.charAt(0)}</span>
                                )}
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold">{user?.fullName}</h2>
                        <p className="text-base-content/70">{user?.email}</p>
                    </div>
                </div>

                {/* Sağ Taraf: Adresler */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                                <h2 className="card-title text-2xl">Adreslerim</h2>
                                <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                                    <FaPlus className="mr-2" /> Yeni Adres Ekle
                                </button>
                            </div>

                            <div className="space-y-4">
                                {user?.addresses?.map((address) => (
                                    <div key={address._id} className={`p-4 rounded-lg border-2 transition-all ${address.isDefault ? 'border-primary bg-primary/5' : 'bg-base-200 border-transparent'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{address.name}</h3>
                                                <p className="text-base-content/80">{address.street}</p>
                                                <p className="text-base-content/80">{address.city}, {address.zipCode}</p>
                                            </div>
                                            <div className="flex items-center space-x-1 sm:space-x-2">
                                                {address.isDefault ? (
                                                    <span className="badge badge-primary gap-1"><FaMapMarkerAlt /> Varsayılan</span>
                                                ) : (
                                                    <button onClick={() => handleSetDefault(address._id)} className="btn btn-xs btn-outline" disabled={isLoadingAction}>Varsayılan Yap</button>
                                                )}
                                                <button onClick={() => openModal(address)} className="btn btn-xs btn-ghost" disabled={isLoadingAction}><FaEdit /></button>
                                                <button onClick={() => handleDelete(address._id)} className="btn btn-xs btn-ghost text-error" disabled={isLoadingAction}><FaTrash /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!user?.addresses || user.addresses.length === 0) && (
                                    <div className="text-center text-base-content/60 py-8">
                                        <p>Henüz kayıtlı bir adresiniz bulunmuyor.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Adres Ekleme/Düzenleme Modalı */}
            {isModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                            {/* Form Alanları */}
                            <div className="form-control">
                                <label className="label"><span className="label-text">Adres Başlığı (Ev, İş vb.)</span></label>
                                <input type="text" {...register('name', { required: 'Adres başlığı zorunludur' })} className="input input-bordered w-full" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Sokak/Cadde</span></label>
                                <input type="text" {...register('street', { required: 'Sokak zorunludur' })} className="input input-bordered w-full" />
                                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Şehir</span></label>
                                    <input type="text" {...register('city', { required: 'Şehir zorunludur' })} className="input input-bordered w-full" />
                                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Posta Kodu</span></label>
                                    <input type="text" {...register('zipCode', { required: 'Posta kodu zorunludur' })} className="input input-bordered w-full" />
                                    {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="cursor-pointer label">
                                    <span className="label-text">Varsayılan adres olarak ayarla</span>
                                    <input type="checkbox" {...register('isDefault')} className="checkbox checkbox-primary" />
                                </label>
                            </div>
                            {/* Modal Butonları */}
                            <div className="modal-action">
                                <button type="button" className="btn" onClick={closeModal}>İptal</button>
                                <button type="submit" className="btn btn-primary" disabled={isAdding || isUpdating}>
                                    {(isAdding || isUpdating) && <FaSpinner className="animate-spin" />}
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;