// frontend/src/pages/AddProductPage.tsx

import React from 'react';
import ProductForm from '../components/ProductForm';
import { useCreateProductMutation, useUploadProductImagesMutation } from '../features/products/productsApiSlice';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../hooks/useNotify';
import { Product } from '../types';

const AddProductPage: React.FC = () => {
    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
    const [uploadProductImages, { isLoading: isUploading }] = useUploadProductImagesMutation();
    const navigate = useNavigate();
    const notify = useNotify();

    const handleSubmit = async (productData: Partial<Product>, imageFiles: File[]) => {
        try {
            // Adım 1: Ürün verilerini gönder ve yanıtı al
            const createdProductResponse = await createProduct(productData).unwrap();
            const productId = createdProductResponse.data._id;

            // Adım 2: Resim varsa, resimleri yükle
            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach(file => {
                    formData.append('images', file);
                });
                await uploadProductImages({ id: productId, formData }).unwrap();
            }

            notify.success('Ürün başarıyla eklendi.');
            navigate('/admin/products');
        } catch (error) {
            notify.error('Ürün eklenirken bir hata oluştu.');
            console.error(error);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Yeni Ürün Ekle</h1>
            <ProductForm onSubmit={handleSubmit} isLoading={isCreating || isUploading} />
        </div>
    );
};

export default AddProductPage;