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

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, product, isLoading: isFormLoading }) => {
    const { register, handleSubmit, setValue } = useForm<IFormInput>();
    // Değişiklik: 'data'yı 'categories' olarak yeniden adlandırdık ve yüklenme durumunu aldık.
    const { data: categories, isLoading: areCategoriesLoading } = useGetCategoriesQuery();
    const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
    const [attrKey, setAttrKey] = useState('');
    const [attrValue, setAttrValue] = useState('');

    useEffect(() => {
        if (product) {
            setValue('name', product.name);
            setValue('description', product.description);
            setValue('price', product.price);
            // Kategori ID'sinin string olduğundan emin olalım
            setValue('category', product.category?._id || '');
            setValue('stock', product.stock);
            if (product.attributes) {
                setAttributes(product.attributes);
            }
        }
    }, [product, setValue]);

    const handleAddAttribute = () => {
        if (attrKey.trim() !== '' && attrValue.trim() !== '') {
            setAttributes([...attributes, { key: attrKey, value: attrValue }]);
            setAttrKey('');
            setAttrValue('');
        }
    };

    const handleRemoveAttribute = (index: number) => {
        setAttributes(attributes.filter((_, i) => i !== index));
    };

    const handleFormSubmit: SubmitHandler<IFormInput> = (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price.toString());
        formData.append('categoryId', data.category); // Backend'in beklediği alan adı 'categoryId' olabilir
        formData.append('stock', data.stock.toString());
        formData.append('attributes', JSON.stringify(attributes));

        if (data.images && data.images.length > 0) {
            for (let i = 0; i < data.images.length; i++) {
                formData.append('images', data.images[i]);
            }
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
                <input type="number" step="0.01" {...register('price')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Stok</label>
                <input type="number" {...register('stock')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Kategori</label>
                <select {...register('category')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                    {areCategoriesLoading ? (
                        <option>Yükleniyor...</option>
                    ) : (
                        // Değişiklik: Artık doğrudan 'categories' dizisini map'liyoruz.
                        categories?.map((category: Category) => (
                            <option key={category._id} value={category._id}>
                                {category.name}
                            </option>
                        ))
                    )}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Resimler</label>
                <input type="file" {...register('images')} multiple className="mt-1 block w-full" />
            </div>

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

            <button type="submit" disabled={isFormLoading} className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300">
                {isFormLoading ? 'Kaydediliyor...' : (product ? 'Ürünü Güncelle' : 'Ürünü Oluştur')}
            </button>
        </form>
    );
};

export default ProductForm;
