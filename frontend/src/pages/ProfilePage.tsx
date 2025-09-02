import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { Link } from 'react-router-dom';
import { Address } from '../types';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import {
    useAddAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
    useSetDefaultAddressMutation,
} from '../features/users/usersApiSlice';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

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

    const [addAddress] = useAddAddressMutation();
    const [updateAddress] = useUpdateAddressMutation();
    const [deleteAddress] = useDeleteAddressMutation();
    const [setDefaultAddress] = useSetDefaultAddressMutation();

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
                isDefault: false,
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
                toast.success('Address updated successfully');
            } else {
                await addAddress(data).unwrap();
                toast.success('Address added successfully');
            }
            closeModal();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleDelete = async (addressId: string) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                await deleteAddress(addressId).unwrap();
                toast.success('Address deleted successfully');
            } catch (error) {
                toast.error('An error occurred');
            }
        }
    };

    const handleSetDefault = async (addressId: string) => {
        try {
            await setDefaultAddress(addressId).unwrap();
            toast.success('Default address has been set');
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    return (
        <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Profilim</h1>
                <Link to="/profile/edit" className="btn btn-outline btn-primary">
                    Profili Düzenle
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-xl p-6 text-center">
                        <div className="avatar mx-auto mb-4">
                            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                <img src={user?.avatar?.url} alt={user?.username} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold">{user?.fullName}</h2>
                        <p className="text-gray-500">{user?.email}</p>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title text-2xl">Adreslerim</h2>
                                <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                                    <FaPlus className="mr-2" /> Yeni Adres Ekle
                                </button>
                            </div>

                            <div className="space-y-4">
                                {user?.addresses?.map((address) => (
                                    <div key={address._id} className={`p-4 rounded-lg border ${address.isDefault ? 'border-primary bg-primary-light' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{address.name}</h3>
                                                <p>{address.street}</p>
                                                <p>{address.city}, {address.zipCode}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {address.isDefault ? (
                                                    <span className="badge badge-primary"><FaMapMarkerAlt className="mr-1" /> Varsayılan</span>
                                                ) : (
                                                    <button onClick={() => handleSetDefault(address._id)} className="btn btn-xs btn-outline">Varsayılan Yap</button>
                                                )}
                                                <button onClick={() => openModal(address)} className="btn btn-xs btn-ghost"><FaEdit /></button>
                                                <button onClick={() => handleDelete(address._id)} className="btn btn-xs btn-ghost text-red-500"><FaTrash /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {user?.addresses?.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">Henüz adres eklemediniz.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">Adres Adı</span></label>
                                <input type="text" {...register('name', { required: 'Address name is required' })} className="input input-bordered w-full" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Sokak/Cadde</span></label>
                                <input type="text" {...register('street', { required: 'Street is required' })} className="input input-bordered w-full" />
                                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Şehir</span></label>
                                    <input type="text" {...register('city', { required: 'City is required' })} className="input input-bordered w-full" />
                                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Posta Kodu</span></label>
                                    <input type="text" {...register('zipCode', { required: 'Zip code is required' })} className="input input-bordered w-full" />
                                    {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="cursor-pointer label">
                                    <span className="label-text">Varsayılan adres olarak ayarla</span>
                                    <input type="checkbox" {...register('isDefault')} className="checkbox checkbox-primary" />
                                </label>
                            </div>
                            <div className="modal-action">
                                <button type="button" className="btn" onClick={closeModal}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;