import React, { useState } from 'react';
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from '../features/categories/categoryApiSlice';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Category, ApiResponse } from '../types';

type FormValues = {
    name: string;
    description: string;
};

const CategoryAdminPage: React.FC = () => {
    const { data: categoriesResponse, isLoading: isLoadingCategories } = useGetCategoriesQuery<ApiResponse<Category[]>>();
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const { register, handleSubmit, reset, setValue } = useForm<FormValues>();

    const handleEditClick = (category: Category) => {
        setEditingCategory(category);
        setValue('name', category.name);
        setValue('description', category.description || '');
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        reset();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            try {
                await deleteCategory(id).unwrap();
                toast.success('Kategori silindi.');
            } catch {
                toast.error('Kategori silinemedi.');
            }
        }
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            if (editingCategory) {
                await updateCategory({ _id: editingCategory._id, ...data }).unwrap();
                toast.success('Kategori güncellendi.');
            } else {
                await createCategory(data).unwrap();
                toast.success('Kategori oluşturuldu.');
            }
            handleCancelEdit();
        } catch (err) {
            toast.error(editingCategory ? 'Güncelleme başarısız.' : 'Oluşturma başarısız.');
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Kategori Yönetimi</h1>

            {/* Form */}
            <div className="card bg-base-200 shadow-xl p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <input {...register('name', { required: true })} placeholder="Kategori Adı" className="input input-bordered w-full" />
                    <textarea {...register('description')} placeholder="Açıklama (opsiyonel)" className="textarea textarea-bordered w-full" />
                    <div className="flex justify-end space-x-2">
                        {editingCategory && <button type="button" onClick={handleCancelEdit} className="btn btn-ghost">İptal</button>}
                        <button type="submit" className="btn btn-primary" disabled={isCreating || isUpdating}>
                            {editingCategory ? 'Güncelle' : 'Ekle'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Kategori Listesi */}
            <div className="overflow-x-auto">
                {isLoadingCategories ? <p>Yükleniyor...</p> : (
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Ad</th>
                                <th>Açıklama</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoriesResponse?.data?.map((cat) => (
                                <tr key={cat._id}>
                                    <td>{cat.name}</td>
                                    <td>{cat.description}</td>
                                    <td className="space-x-2">
                                        <button onClick={() => handleEditClick(cat)} className="btn btn-sm btn-outline">Düzenle</button>
                                        <button onClick={() => handleDelete(cat._id)} className="btn btn-sm btn-outline btn-error">Sil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CategoryAdminPage;