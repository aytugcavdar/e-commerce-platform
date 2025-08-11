import React from 'react';
import { useParams } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useGetProductQuery } from '../features/products/productsApiSlice';
import { ApiResponse, Product } from '../types';

const EditProductPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const { data: productData, isLoading, isError } = useGetProductQuery<ApiResponse<Product>>(productId!, {
        skip: !productId,
    });

    if (isLoading) {
        return <div className="text-center"><span className="loading loading-lg"></span></div>;
    }

    if (isError || !productData?.data) {
        return <div className="text-center text-red-500">Ürün bilgileri yüklenemedi.</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Ürünü Düzenle</h1>
            <ProductForm existingProduct={productData.data} />
        </div>
    );
};

export default EditProductPage;