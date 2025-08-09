import React from 'react';
import ProductForm from '../components/ProductForm';

const AddProductPage: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Yeni Ürün Ekle</h1>
            <ProductForm />
        </div>
    );
};

export default AddProductPage;