import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetProductQuery } from '../features/products/productsApiSlice';
import { useAddToCartMutation } from '../features/cart/cartApiSlice';
import { toast } from 'react-toastify';
import { ApiResponse, Product } from '../../types';

const ProductDetailPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const { data: productData, isLoading, isError } = useGetProductQuery<ApiResponse<Product>>(productId!);
    const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

    const handleAddToCart = async () => {
        if (!productId) return;
        try {
            await addToCart({ productId, quantity: 1 }).unwrap();
            toast.success('Ürün sepete eklendi!');
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

    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content flex-col lg:flex-row">
                <img src={product.images[0]?.url || 'https://via.placeholder.com/400'} className="max-w-sm rounded-lg shadow-2xl" alt={product.name} />
                <div>
                    <h1 className="text-5xl font-bold">{product.name}</h1>
                    <p className="py-6">{product.description}</p>
                    <p className="text-3xl font-bold text-primary mb-4">{product.price} TL</p>
                    <button 
                        className="btn btn-primary"
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                    >
                        {isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;