import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation } from '../features/orders/orderApiSlice';
import { ApiResponse, Order } from '../types';
import { Link } from 'react-router-dom';

const ManageOrdersPage: React.FC = () => {
    const { data: ordersResponse, isLoading, isError } = useGetAllOrdersQuery<ApiResponse<Order[]>>();
    const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus({ orderId, status: newStatus }).unwrap();
            toast.success(`Sipariş #${orderId.substring(0, 8)}... durumu güncellendi.`);
        } catch (err) {
            toast.error('Sipariş durumu güncellenirken bir hata oluştu.');
            console.error('Güncelleme hatası:', err);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (isLoading) return <div className="text-center"><span className="loading loading-lg"></span></div>;
    if (isError) return <div className="text-center text-red-500">Siparişler yüklenirken bir hata oluştu.</div>;

    const orderStatusOptions = ['Ödeme Bekliyor', 'Hazırlanıyor', 'Kargoda', 'Teslim Edildi', 'İptal Edildi'];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Sipariş Yönetimi</h1>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Sipariş No</th>
                            <th>Müşteri</th>
                            <th>Tarih</th>
                            <th>Toplam Tutar</th>
                            <th>Ödeme Durumu</th>
                            <th>Sipariş Durumu</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordersResponse?.data?.map((order) => (
                            <tr key={order._id}>
                                <td>#{order._id.substring(0, 8)}...</td>
                                <td>{order.userId|| 'Bilinmiyor'}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                                <td>{order.totalPrice.toFixed(2)} TL</td>
                                <td>
                                    <span className={`badge ${order.isPaid ? 'badge-success' : 'badge-warning'}`}>
                                        {order.isPaid ? 'Ödendi' : 'Bekliyor'}
                                    </span>
                                </td>
                                <td>
                                    <select
                                        className="select select-bordered select-sm w-full max-w-xs"
                                        value={order.orderStatus}
                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        disabled={isUpdating && updatingOrderId === order._id}
                                    >
                                        {orderStatusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <Link to={`/profile/orders/${order._id}`} className="btn btn-sm btn-outline">
                                        Detay
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageOrdersPage;