import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetOrderByIdQuery } from '../features/orders/orderApiSlice';
import { useProcessPaymentMutation } from '../features/payment/paymentApiSlice';
import { useNotify } from '../hooks/useNotify';
const PaymentPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const notify = useNotify();
    // Sipariş detaylarını al
    const { data: orderData, isLoading: isLoadingOrder, isError } = useGetOrderByIdQuery(orderId!);
    // Ödeme işlemini tetikleyecek mutation
    const [processPayment, { isLoading: isProcessingPayment }] = useProcessPaymentMutation();

    const handlePayment = async () => {
        if (!orderData?.data) return;

        try {
            await processPayment({
                orderId: orderData.data._id,
                paymentMethod: orderData.data.paymentMethod
            }).unwrap();

            notify.success('Ödeme başarıyla tamamlandı!');
            navigate(`/profile/orders/${orderId}`);
        } catch (err) {
            notify.error('Ödeme sırasında bir hata oluştu.');
            console.error('Ödeme hatası:', err);
        }
    };
    if (isLoadingOrder) return <div className="text-center"><span className="loading loading-lg"></span></div>;
    if (isError || !orderData?.data) return <div className="text-center text-red-500">Sipariş detayları yüklenemedi.</div>;

    const order = orderData.data;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Ödeme Ekranı</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card bg-base-100 shadow-xl p-6">
                    <h2 className="text-xl font-semibold">Sipariş Özeti</h2>
                    <p><strong>Sipariş No:</strong> #{order._id}</p>
                    <p><strong>Toplam Tutar:</strong> {order.totalPrice} TL</p>
                    <div className="divider"></div>
                    <h3 className="font-bold">Teslimat Adresi</h3>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                </div>
                <div className="card bg-base-100 shadow-xl p-6 flex justify-center items-center">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Ödeme Bilgileri (Simülasyon)</h2>
                        <p className="mb-6">Bu ekranda normalde kredi kartı formu yer alır. Simülasyon olduğu için doğrudan ödemeyi onaylayabilirsiniz.</p>
                        <button
                            className="btn btn-primary w-full"
                            onClick={handlePayment}
                            disabled={isProcessingPayment}
                        >
                            {isProcessingPayment ? <span className="loading loading-spinner"></span> : `${order.totalPrice} TL Öde`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;