import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCreateProductMutation } from '../features/products/productsApiSlice';
import { useGetCategoriesQuery } from '../features/categories/categoryApiSlice';
import { Category, Product } from '../types';

interface IFormInput {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    images: FileList;
}

const ProductForm: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>();
    const navigate = useNavigate();

    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
    const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesQuery();

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', String(data.price));
        formData.append('stock', String(data.stock));
        formData.append('category', data.category);

        if (data.images) {
            for (let i = 0; i < data.images.length; i++) {
                formData.append('images', data.images[i]);
            }
        }

        try {
            await createProduct(formData).unwrap();
            toast.success('Ürün başarıyla oluşturuldu!');
            navigate('/admin/products'); 
        } catch (err) {
            toast.error('Ürün oluşturulurken bir hata oluştu.');
            console.error(err);
        }
    };

    return (
        <div className="card bg-base-200 shadow-xl p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="form-control">
                    <label className="label"><span className="label-text">Ürün Adı</span></label>
                    <input type="text" {...register('name', { required: 'Ürün adı zorunludur' })} className="input input-bordered w-full" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Açıklama</span></label>
                    <textarea {...register('description', { required: 'Açıklama zorunludur' })} className="textarea textarea-bordered w-full" />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Fiyat (TL)</span></label>
                        <input type="number" step="0.01" {...register('price', { required: 'Fiyat zorunludur', valueAsNumber: true })} className="input input-bordered w-full" />
                         {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                    </div>
                     <div className="form-control">
                        <label className="label"><span className="label-text">Stok Adedi</span></label>
                        <input type="number" {...register('stock', { required: 'Stok zorunludur', valueAsNumber: true })} className="input input-bordered w-full" />
                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                    </div>
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Kategori</span></label>
                    <select {...register('category', { required: 'Kategori seçimi zorunludur' })} className="select select-bordered w-full" disabled={isLoadingCategories}>
                        <option value="">Kategori Seçin</option>
                        {categoriesData?.data?.map((cat: Category) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                     {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                </div>

                 <div className="form-control">
                    <label className="label"><span className="label-text">Ürün Resimleri</span></label>
                    <input type="file" {...register('images')} multiple accept="image/*" className="file-input file-input-bordered w-full" />
                </div>


                <div className="flex justify-end pt-4">
                     <button type="submit" className="btn btn-primary" disabled={isCreating}>
                        {isCreating ? <span className="loading loading-spinner"></span> : 'Ürünü Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;