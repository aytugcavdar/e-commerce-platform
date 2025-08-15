// frontend/src/components/ProductForm.tsx

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Product } from '../types/Product';
import { useGetCategoriesQuery } from '../features/categories/categoryApiSlice';
import { Category } from '../types/Category';

interface IFormInput {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    images: FileList;
}

interface ProductFormProps {
    onSubmit: (data: any) => void;
    product?: Product;
    isLoading: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, product, isLoading }) => {
    const { register, handleSubmit, setValue } = useForm<IFormInput>();
    const { data: categoriesData } = useGetCategoriesQuery({});
    // Eklendi: Attributes state'leri
    const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
    const [attrKey, setAttrKey] = useState('');
    const [attrValue, setAttrValue] = useState('');

    useEffect(() => {
        if (product) {
            setValue('name', product.name);
            setValue('description', product.description);
            setValue('price', product.price);
            setValue('category', product.category._id);
            setValue('stock', product.stock);
            // Eklendi: Düzenleme modunda mevcut attribute'ları yükle
            if (product.attributes) {
                setAttributes(product.attributes);
            }
        }
    }, [product, setValue]);

    // Eklendi: Yeni attribute ekleme fonksiyonu
    const handleAddAttribute = () => {
        if (attrKey.trim() !== '' && attrValue.trim() !== '') {
            setAttributes([...attributes, { key: attrKey, value: attrValue }]);
            setAttrKey('');
            setAttrValue('');
        }
    };

    // Eklendi: Attribute silme fonksiyonu
    const handleRemoveAttribute = (index: number) => {
        setAttributes(attributes.filter((_, i) => i !== index));
    };

    const handleFormSubmit: SubmitHandler<IFormInput> = (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price.toString());
        formData.append('category', data.category);
        formData.append('stock', data.stock.toString());
        
        // Eklendi: Attributes'ları form verisine ekle
        formData.append('attributes', JSON.stringify(attributes));

        if (data.images) {
            for (let i = 0; i < data.images.length; i++) {
                formData.append('images', data.images[i]);
            }
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* ... diğer form alanları (name, description, price, stock) ... */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Ad</label>
                <input {...register('name')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                <textarea {...register('description')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                <input type="number" {...register('price')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Stok</label>
                <input type="number" {...register('stock')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Kategori</label>
                <select {...register('category')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                    {categoriesData?.data.map((category: Category) => (
                        <option key={category._id} value={category._id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Resimler</label>
                <input type="file" {...register('images')} multiple className="mt-1 block w-full" />
            </div>

            {/* Eklendi: Attributes Yönetim Arayüzü */}
            <div className="space-y-2 pt-4">
                <h3 className="text-lg font-medium">Ürün Özellikleri</h3>
                {attributes.map((attr, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <input type="text" value={attr.key} readOnly className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100" />
                        <input type="text" value={attr.value} readOnly className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100" />
                        <button type="button" onClick={() => handleRemoveAttribute(index)} className="bg-red-500 text-white px-3 py-1 rounded">
                            Sil
                        </button>
                    </div>
                ))}
                <div className="flex items-center space-x-2 pt-2">
                    <input
                        type="text"
                        placeholder="Özellik Adı (örn: Renk)"
                        value={attrKey}
                        onChange={(e) => setAttrKey(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md p-2"
                    />
                    <input
                        type="text"
                        placeholder="Özellik Değeri (örn: Kırmızı)"
                        value={attrValue}
                        onChange={(e) => setAttrValue(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md p-2"
                    />
                    <button type="button" onClick={handleAddAttribute} className="bg-green-500 text-white px-3 py-1 rounded">
                        Ekle
                    </button>
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300">
                {isLoading ? 'Kaydediliyor...' : (product ? 'Ürünü Güncelle' : 'Ürünü Oluştur')}
            </button>
        </form>
    );
};

export default ProductForm;