import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetOrderByIdQuery } from '../features/orders/orderApiSlice';
import { ApiResponse, Order } from '../types';

const OrderDetailPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { data: orderResponse, isLoading, isError } = useGetOrderByIdQuery(orderId!, {
        skip: !orderId,
    });

    if (isLoading) {
        return <div className="text-center"><span className="loading loading-lg"></span></div>;
    }

    if (isError || !orderResponse?.data) {
        return <div className="text-center text-red-500">Sipariş bilgileri yüklenirken bir hata oluştu.</div>;
    }

    const order = orderResponse.data;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Sipariş Detayı</h1>
            <div className="card bg-base-100 shadow-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h2 className="text-xl font-semibold">Sipariş Bilgileri</h2>
                        <p><strong>Sipariş No:</strong> #{order._id}</p>
                        <p><strong>Tarih:</strong> {formatDate(order.createdAt)}</p>
                        <p><strong>Durum:</strong> <span className="badge badge-primary">{order.orderStatus}</span></p>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Ödeme Bilgileri</h2>
                        <p><strong>Ödeme Yöntemi:</strong> {order.paymentMethod}</p>
                        <p><strong>Ödendi mi:</strong> {order.isPaid ? `Evet (${formatDate(order.paidAt)})` : 'Hayır'}</p>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Teslimat Adresi</h2>
                        <p>{order.shippingAddress.address}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                        <p>{order.shippingAddress.country}</p>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Sipariş Edilen Ürünler</h2>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Ürün</th>
                            <th>Fiyat</th>
                            <th>Adet</th>
                            <th>Toplam</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.orderItems.map((item) => (
                            <tr key={item.productId}>
                                <td>
                                    <div className="flex items-center space-x-3">
                                        <div className="avatar">
                                            <div className="mask mask-squircle w-12 h-12">
                                                <img src={item.image} alt={item.name} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold">{item.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{item.price.toFixed(2)} TL</td>
                                <td>{item.quantity}</td>
                                <td>{(item.price * item.quantity).toFixed(2)} TL</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end mt-8 items-center bg-base-200 p-4 rounded-lg">
                <div className="text-right">
                    <p><strong>Ara Toplam:</strong> {order.itemsPrice.toFixed(2)} TL</p>
                    <p><strong>Kargo:</strong> {order.shippingPrice.toFixed(2)} TL</p>
                    <p><strong>Vergi:</strong> {order.taxPrice.toFixed(2)} TL</p>
                    <p className="text-2xl font-bold"><strong>Genel Toplam:</strong> {order.totalPrice.toFixed(2)} TL</p>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;