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
    const { 
        register, 
        handleSubmit, 
        setValue, 
        formState: { errors },
        watch 
    } = useForm<IFormInput>();
    
    const { data: categories, isLoading: areCategoriesLoading, error: categoriesError } = useGetCategoriesQuery();
    const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
    const [attrKey, setAttrKey] = useState('');
    const [attrValue, setAttrValue] = useState('');

    // Form alanlarını izle
    const watchedCategory = watch('category');

    useEffect(() => {
        if (product) {
            setValue('name', product.name);
            setValue('description', product.description);
            setValue('price', product.price);
            setValue('category', product.category?._id || product.categoryId || '');
            setValue('stock', product.stock);
            if (product.attributes) {
                setAttributes(product.attributes);
            }
        }
    }, [product, setValue]);

    const handleAddAttribute = () => {
        const trimmedKey = attrKey.trim();
        const trimmedValue = attrValue.trim();
        
        if (trimmedKey && trimmedValue) {
            // Aynı key'e sahip özellik var mı kontrol et
            const existingIndex = attributes.findIndex(attr => attr.key.toLowerCase() === trimmedKey.toLowerCase());
            
            if (existingIndex !== -1) {
                // Mevcut özelliği güncelle
                const updatedAttributes = [...attributes];
                updatedAttributes[existingIndex] = { key: trimmedKey, value: trimmedValue };
                setAttributes(updatedAttributes);
            } else {
                // Yeni özellik ekle
                setAttributes([...attributes, { key: trimmedKey, value: trimmedValue }]);
            }
            
            setAttrKey('');
            setAttrValue('');
        }
    };

    const handleRemoveAttribute = (index: number) => {
        setAttributes(attributes.filter((_, i) => i !== index));
    };

    const handleFormSubmit: SubmitHandler<IFormInput> = (data) => {
        const formData = new FormData();
        formData.append('name', data.name.trim());
        formData.append('description', data.description.trim());
        formData.append('price', data.price.toString());
        formData.append('category', data.category); // Backend'e uygun field name
        formData.append('stock', data.stock.toString());
        
        if (attributes.length > 0) {
            formData.append('attributes', JSON.stringify(attributes));
        }

        if (data.images && data.images.length > 0) {
            Array.from(data.images).forEach((file, index) => {
                formData.append('images', file);
            });
        }
        
        onSubmit(formData);
    };

    // Hiyerarşik kategori listesi oluşturma fonksiyonu
    const renderCategoryOptions = () => {
        if (!categories || categories.length === 0) {
            return <option value="" disabled>Kategori bulunamadı</option>;
        }

        const options: JSX.Element[] = [];
        
        categories.forEach((category: Category) => {
            // Ana kategoriyi ekle
            options.push(
                <option 
                    key={`main-${category._id}`} 
                    value={category._id}
                    className="font-medium text-gray-900"
                >
                    {category.name}
                </option>
            );

            // Alt kategorileri ekle (girinti ile)
            if (category.children && category.children.length > 0) {
                category.children.forEach((subCategory: Category) => {
                    options.push(
                        <option 
                            key={`sub-${subCategory._id}`} 
                            value={subCategory._id}
                            className="text-gray-700 pl-4"
                        >
                            &nbsp;&nbsp;└─ {subCategory.name}
                        </option>
                    );
                });
            }
        });

        return options;
    };

    // Seçilen kategori bilgisini göster
    const getSelectedCategoryInfo = () => {
        if (!watchedCategory || !categories) return null;
        
        for (const category of categories) {
            if (category._id === watchedCategory) {
                return { name: category.name, isMain: true };
            }
            if (category.children) {
                const subCategory = category.children.find(sub => sub._id === watchedCategory);
                if (subCategory) {
                    return { name: `${category.name} > ${subCategory.name}`, isMain: false };
                }
            }
        }
        return null;
    };

    const selectedCategoryInfo = getSelectedCategoryInfo();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-slate-800/95 to-gray-900/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-purple-500/20">
                    <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-6 text-white">
                        <h2 className="text-2xl font-bold">
                            {product ? 'Ürünü Güncelle' : 'Yeni Ürün Ekle'}
                        </h2>
                        <p className="text-purple-100 mt-1">
                            Ürün bilgilerini doldurun ve kaydedin.
                        </p>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

                {/* Temel Bilgiler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ürün Adı <span className="text-red-500">*</span>
                        </label>
                        <input 
                            {...register('name', { 
                                required: 'Ürün adı zorunludur',
                                minLength: { value: 2, message: 'En az 2 karakter olmalıdır' },
                                maxLength: { value: 100, message: 'En fazla 100 karakter olmalıdır' }
                            })} 
                            className={`w-full px-4 py-3 bg-slate-800/70 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 text-white placeholder-gray-400 ${
                                errors.name ? 'border-red-400 bg-red-900/30' : 'border-slate-600 hover:border-slate-500'
                            }`}
                            placeholder="Ürün adını girin"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Stok Adedi <span className="text-red-400">*</span>
                        </label>
                        <input 
                            type="number" 
                            min="0"
                            {...register('stock', { 
                                required: 'Stok adedi zorunludur',
                                min: { value: 0, message: 'Stok negatif olamaz' }
                            })} 
                            className={`w-full px-4 py-3 bg-slate-800/70 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 text-white placeholder-gray-400 ${
                                errors.stock ? 'border-red-400 bg-red-900/30' : 'border-slate-600 hover:border-slate-500'
                            }`}
                            placeholder="0"
                        />
                        {errors.stock && (
                            <p className="mt-1 text-sm text-red-400">{errors.stock.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fiyat (TL) <span className="text-red-400">*</span>
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            {...register('price', { 
                                required: 'Fiyat zorunludur',
                                min: { value: 0, message: 'Fiyat negatif olamaz' }
                            })} 
                            className={`w-full px-4 py-3 bg-slate-800/70 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 text-white placeholder-gray-400 ${
                                errors.price ? 'border-red-400 bg-red-900/30' : 'border-slate-600 hover:border-slate-500'
                            }`}
                            placeholder="0.00"
                        />
                        {errors.price && (
                            <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Kategori <span className="text-red-400">*</span>
                        </label>
                        <select 
                            {...register('category', { required: 'Kategori seçimi zorunludur' })}
                            className={`w-full px-4 py-3 bg-slate-800/70 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 text-white ${
                                errors.category ? 'border-red-400 bg-red-900/30' : 'border-slate-600 hover:border-slate-500'
                            }`}
                            disabled={areCategoriesLoading}
                        >
                            <option value="" className="bg-slate-800">Kategori Seçiniz</option>
                            {areCategoriesLoading ? (
                                <option disabled className="bg-slate-800">Yükleniyor...</option>
                            ) : categoriesError ? (
                                <option disabled className="bg-slate-800">Kategoriler yüklenemedi</option>
                            ) : (
                                renderCategoryOptions()
                            )}
                        </select>
                        {errors.category && (
                            <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
                        )}
                        {selectedCategoryInfo && (
                            <p className="mt-1 text-sm text-emerald-400">
                                Seçilen: {selectedCategoryInfo.name}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ürün Açıklaması <span className="text-red-400">*</span>
                    </label>
                    <textarea 
                        {...register('description', { 
                            required: 'Ürün açıklaması zorunludur',
                            minLength: { value: 10, message: 'En az 10 karakter olmalıdır' },
                            maxLength: { value: 1000, message: 'En fazla 1000 karakter olmalıdır' }
                        })} 
                        rows={4}
                        className={`w-full px-4 py-3 bg-slate-800/70 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 resize-none text-white placeholder-gray-400 ${
                            errors.description ? 'border-red-400 bg-red-900/30' : 'border-slate-600 hover:border-slate-500'
                        }`}
                        placeholder="Ürün hakkında detaylı bilgi verin..."
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ürün Resimleri
                    </label>
                    <input 
                        type="file" 
                        {...register('images')} 
                        multiple 
                        accept="image/*"
                        className="w-full px-4 py-3 bg-slate-800/70 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600"
                    />
                    <p className="mt-1 text-sm text-gray-400">
                        PNG, JPG veya JPEG formatında, en fazla 5 resim seçebilirsiniz.
                    </p>
                </div>

                {/* Ürün Özellikleri */}
                <div className="bg-gradient-to-r from-slate-800/50 to-purple-900/30 border border-purple-500/20 p-6 rounded-xl shadow-inner">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Ürün Özellikleri
                    </h3>
                    
                    {/* Mevcut Özellikler */}
                    {attributes.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {attributes.map((attr, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-slate-600/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex-1">
                                        <span className="text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full">{attr.key}</span>
                                        <span className="text-sm text-gray-300 ml-3">{attr.value}</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveAttribute(index)} 
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-full transition-all duration-200"
                                        title="Özelliği sil"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Yeni Özellik Ekleme */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            type="text"
                            placeholder="Özellik Adı (örn: Renk)"
                            value={attrKey}
                            onChange={(e) => setAttrKey(e.target.value)}
                            className="px-4 py-3 bg-slate-800/80 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 placeholder-gray-400 text-white"
                        />
                        <input
                            type="text"
                            placeholder="Özellik Değeri (örn: Kırmızı)"
                            value={attrValue}
                            onChange={(e) => setAttrValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddAttribute()}
                            className="px-4 py-3 bg-slate-800/80 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 placeholder-gray-400 text-white"
                        />
                        <button 
                            type="button" 
                            onClick={handleAddAttribute} 
                            disabled={!attrKey.trim() || !attrValue.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                        >
                            + Ekle
                        </button>
                    </div>
                </div>

                {/* Form Butonları */}
                <div className="flex justify-end space-x-4 pt-8">
                    <button 
                        type="button" 
                        className="px-8 py-3 border-2 border-slate-600 text-gray-300 rounded-xl hover:bg-slate-800/50 hover:border-slate-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                        onClick={() => window.history.back()}
                    >
                        İptal
                    </button>
                    <button 
                        type="submit" 
                        disabled={isFormLoading || areCategoriesLoading} 
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                    >
                        {isFormLoading && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        <span>{isFormLoading ? 'Kaydediliyor...' : (product ? 'Güncelle' : 'Kaydet')}</span>
                    </button>
                </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductForm;