import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetProductQuery } from '../features/products/productsApiSlice';
import { useAddToCartMutation } from '../features/cart/cartApiSlice';
import { toast } from 'react-toastify';
import { ApiResponse, Product } from '../../types';

const ProductDetailPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const { data: productData, isLoading, isError } = useGetProductQuery<ApiResponse<Product>>(productId!);
    const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = async () => {
        if (!productId || !productData?.data || productData.data.stock === 0) return;
        try {
            await addToCart({ productId, quantity }).unwrap();
            toast.success(`${quantity} adet ürün sepete eklendi!`);
        } catch (err) {
            toast.error('Ürün sepete eklenemedi.');
        }
    };

    if (isLoading) {
        return <div className="text-center"><span className="loading loading-lg"></span></div>;
    }

    if (isError || !productData?.data) {
        return <div className="text-center text-red-500">Ürün yüklenirken bir hata oluştu.</div>;
    }

    const product = productData.data;
    const isOutOfStock = product.stock === 0;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="hero bg-base-200 rounded-lg">
                <div className="hero-content flex-col lg:flex-row gap-8">
                    <img src={product.images[0]?.url || 'https://via.placeholder.com/400'} className="max-w-sm rounded-lg shadow-2xl" alt={product.name} />
                    <div className="lg:w-1/2">
                        <h1 className="text-4xl md:text-5xl font-bold">{product.name}</h1>
                        <p className="py-6 text-base">{product.description}</p>
                        <p className="text-4xl font-bold text-primary mb-4">{product.price.toFixed(2)} TL</p>
                        
                        <div className="divider"></div>

                        {/* Stok Durumu */}
                        <div className="mb-4">
                            <span className={`badge ${isOutOfStock ? 'badge-error' : 'badge-success'}`}>
                                {isOutOfStock ? 'Tükendi' : `Stok: ${product.stock} adet`}
                            </span>
                        </div>
                        
                        {/* Sepete Ekleme Alanı */}
                        <div className="card-actions items-center">
                             <div className="form-control">
                                <input 
                                    type="number" 
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    max={product.stock}
                                    className="input input-bordered w-24"
                                    disabled={isOutOfStock}
                                />
                            </div>
                            <button 
                                className="btn btn-primary flex-grow"
                                onClick={handleAddToCart}
                                disabled={isAddingToCart || isOutOfStock}
                            >
                                {isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yorumlar Bölümü (Placeholder) */}
            <div className="mt-12">
                <h2 className="text-3xl font-bold mb-6">Ürün Değerlendirmeleri</h2>
                <div className="card bg-base-200 p-6">
                    <p>Yakında burada ürün yorumları ve puanlamaları yer alacak.</p>
                    {/* Yorum ekleme formu ve yorum listesi gelecekte buraya eklenecek */}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;