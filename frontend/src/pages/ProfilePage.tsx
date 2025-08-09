// frontend/src/pages/ProfilePage.tsx (Güncellenmiş Hali)
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useGetMyOrdersQuery } from '../features/orders/orderApiSlice';
import { Link } from 'react-router-dom';
import { Order } from '../types';

const ProfilePage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: ordersResponse, isLoading: isLoadingOrders } = useGetMyOrdersQuery();

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Profilim</h1>
            <div className="card bg-base-100 shadow-xl p-6 mb-8">
                <h2 className="text-xl font-semibold">Kullanıcı Bilgileri</h2>
                <p><strong>Kullanıcı Adı:</strong> {user?.username}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Ad Soyad:</strong> {user?.firstName} {user?.lastName}</p>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Siparişlerim</h2>
            <div className="overflow-x-auto">
                {isLoadingOrders ? (
                    <p>Siparişler yükleniyor...</p>
                ) : (
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Sipariş No</th>
                                <th>Tarih</th>
                                <th>Toplam Tutar</th>
                                <th>Durum</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordersResponse?.data?.map((order: Order) => (
                                <tr key={order._id}>
                                    <td>#{order._id.substring(0, 8)}...</td>
                                    <td>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                                    <td>{order.totalPrice.toFixed(2)} TL</td>
                                    <td><span className="badge badge-primary">{order.orderStatus}</span></td>
                                    <td>
                                        <Link to={`/profile/orders/${order._id}`} className="btn btn-sm btn-outline">
                                            Detaylar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;