import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
// import { useCreateOrderMutation } from '../features/orders/orderApiSlice'; // Bu slice'ı bir sonraki adımda oluşturacağız
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface IFormInput {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: string;
}

const CheckoutPage: React.FC = () => {
    const { register, handleSubmit } = useForm<IFormInput>();
    // const [createOrder, { isLoading }] = useCreateOrderMutation();
    const navigate = useNavigate();
    
    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        console.log("Sipariş Bilgileri:", data);
        toast.info("Ödeme ve sipariş altyapısı henüz hazır değil.");
        navigate('/');
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-4xl font-bold text-center mb-12">Sipariş Bilgileri</h1>
            <div className="max-w-lg mx-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <h2 className="text-2xl font-semibold">Teslimat Adresi</h2>
                    <input {...register('address', { required: true })} placeholder="Adres" className="input input-bordered w-full" />
                    <input {...register('city', { required: true })} placeholder="Şehir" className="input input-bordered w-full" />
                    <input {...register('postalCode', { required: true })} placeholder="Posta Kodu" className="input input-bordered w-full" />
                    <input {...register('country', { required: true })} placeholder="Ülke" className="input input-bordered w-full" />

                    <h2 className="text-2xl font-semibold mt-8">Ödeme Yöntemi</h2>
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text">Kredi Kartı</span> 
                            <input {...register('paymentMethod')} type="radio" value="Credit Card" className="radio checked:bg-blue-500" defaultChecked />
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-8">
                        Siparişi Tamamla
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;