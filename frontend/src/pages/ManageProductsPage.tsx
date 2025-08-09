import React from 'react';
import { Link } from 'react-router-dom';
import { useGetProductsQuery, useDeleteProductMutation } from '../features/products/productsApiSlice';
import { toast } from 'react-toastify';
import { Product, ApiResponse } from '../types';

const ManageProductsPage: React.FC = () => {
    const { data: productsData, isLoading, isError } = useGetProductsQuery<ApiResponse<Product[]>>();
    const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            try {
                await deleteProduct(id).unwrap();
                toast.success('Ürün başarıyla silindi.');
            } catch (err) {
                toast.error('Ürün silinirken bir hata oluştu.');
                console.error('Silme hatası:', err);
            }
        }
    };

    if (isLoading) return <div className="text-center"><span className="loading loading-lg"></span></div>;
    if (isError) return <div className="text-center text-red-500">Ürünler yüklenirken bir hata oluştu.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Ürünleri Yönet</h1>
                <Link to="/admin/products/add" className="btn btn-primary">
                    Yeni Ürün Ekle
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Resim</th>
                            <th>Ürün Adı</th>
                            <th>Kategori</th>
                            <th>Fiyat</th>
                            <th>Stok</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productsData?.data?.map((product) => (
                            <tr key={product._id}>
                                <td>
                                    <div className="avatar">
                                        <div className="w-16 rounded">
                                            <img src={product.images[0]?.url || 'https://via.placeholder.com/100'} alt={product.name} />
                                        </div>
                                    </div>
                                </td>
                                <td>{product.name}</td>
                                <td>{product.category?.name || 'Belirtilmemiş'}</td>
                                <td>{product.price} TL</td>
                                <td>{product.stock}</td>
                                <td className="space-x-2">
                                    <button className="btn btn-sm btn-outline btn-info" disabled>Düzenle</button>
                                    <button 
                                        className="btn btn-sm btn-outline btn-error"
                                        onClick={() => handleDelete(product._id)}
                                        disabled={isDeleting}
                                    >
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageProductsPage;