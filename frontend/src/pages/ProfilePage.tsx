import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    console.log('User data:', user);

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Profilim</h1>
            <div className="card bg-base-100 shadow-xl p-6 mb-8">
                <h2 className="text-xl font-semibold">Kullanıcı Bilgileri</h2>
                <p><strong>Kullanıcı Adı:</strong> {user?.username}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Ad Soyad:</strong> {user?.firstName} {user?.lastName}</p>
            </div>
            {user?.role === 'admin' && (
                <div className="card bg-base-100 shadow-xl p-6 mb-8">
                    <h2 className="text-xl font-semibold">Yönetici Paneli</h2>
                    <div className="mt-4 flex space-x-2">
                        <Link to="/admin/add-product" className="btn btn-primary">
                            Yeni Ürün Ekle
                        </Link>
                        <Link to="/admin/categories" className="btn btn-secondary">
                            Kategorileri Yönet
                        </Link>
                    </div>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4">Siparişlerim</h2>
            <div>
              <p>Sipariş geçmişi özelliği yakında eklenecektir.</p>
            </div>
        </div>
    );
};

export default ProfilePage;