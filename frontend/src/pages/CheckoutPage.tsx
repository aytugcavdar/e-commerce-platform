// frontend/src/pages/CheckoutPage.tsx (Güncellenmiş Hali)
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useCreateOrderMutation } from '../features/orders/orderApiSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShippingAddress } from '../types';

interface IFormInput extends ShippingAddress {
  paymentMethod: string;
}

const CheckoutPage: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>();
    const [createOrder, { isLoading }] = useCreateOrderMutation();
    const navigate = useNavigate();

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
            const orderData = {
                shippingAddress: {
                    address: data.address,
                    city: data.city,
                    postalCode: data.postalCode,
                    country: data.country,
                },
                paymentMethod: data.paymentMethod,
            };
            const result = await createOrder(orderData).unwrap();
            toast.success('Siparişiniz başarıyla oluşturuldu. Ödemeye yönlendiriliyorsunuz.');
            navigate(`/payment/${result.data._id}`);
        } catch (err) {
            toast.error('Sipariş oluşturulurken bir hata oluştu.');
            console.error(err);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-4xl font-bold text-center mb-12">Sipariş Bilgileri</h1>
            <div className="max-w-lg mx-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <h2 className="text-2xl font-semibold">Teslimat Adresi</h2>
                    <input {...register('address', { required: true })} placeholder="Adres" className="input input-bordered w-full" />
                    {errors.address && <p className="text-red-500 text-xs">Adres zorunludur.</p>}
                    <input {...register('city', { required: true })} placeholder="Şehir" className="input input-bordered w-full" />
                     {errors.city && <p className="text-red-500 text-xs">Şehir zorunludur.</p>}
                    <input {...register('postalCode', { required: true })} placeholder="Posta Kodu" className="input input-bordered w-full" />
                    {errors.postalCode && <p className="text-red-500 text-xs">Posta Kodu zorunludur.</p>}
                    <input {...register('country', { required: true })} placeholder="Ülke" className="input input-bordered w-full" />
                     {errors.country && <p className="text-red-500 text-xs">Ülke zorunludur.</p>}

                    <h2 className="text-2xl font-semibold mt-8">Ödeme Yöntemi</h2>
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text">Kredi Kartı (Simülasyon)</span>
                            <input {...register('paymentMethod')} type="radio" value="Credit Card" className="radio checked:bg-blue-500" defaultChecked />
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-8" disabled={isLoading}>
                        {isLoading ? <span className="loading loading-spinner"></span> : 'Ödemeye İlerle'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;