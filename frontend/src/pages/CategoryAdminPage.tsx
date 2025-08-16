import React, { useState, useMemo, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { FaTrash, FaPlus, FaSpinner, FaAngleDown, FaAngleRight, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useDeleteCategoryMutation,
    useUpdateCategoryMutation,
} from '../features/categories/categoryApiSlice'; // <-- HATA BURADAYDI, DÜZELTİLDİ
import { Category } from '../types/Category';
import { ApiResponse } from '../types/İndex';

interface IFormInput {
    name: string;
    parent?: string;
}

const buildCategoryTree = (categories: Category[], parentId: string | null = null): (Category & { children?: Category[] })[] => {
    const tree: (Category & { children?: Category[] })[] = [];
    categories.forEach(category => {
        if (category.parent === parentId) {
            const children = buildCategoryTree(categories, category._id);
            if (children.length > 0) {
                category.children = children;
            }
            tree.push(category);
        }
    });
    return tree;
};

const CategoryTree: React.FC<{
    categories: (Category & { children?: Category[] })[];
    onDelete: (id: string) => void;
    onEdit: (category: Category) => void;
    isLoadingDelete: boolean;
    level?: number;
}> = ({ categories, onDelete, onEdit, isLoadingDelete, level = 0 }) => {
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (id: string) => {
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <>
            {categories.map(category => (
                <div key={category._id} style={{ paddingLeft: `${level * 1}rem` }}>
                    <div className="flex items-center justify-between p-3 my-2 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
                        <div className="flex items-center">
                            {category.children && category.children.length > 0 && (
                                <button onClick={() => toggleCategory(category._id)} className="btn btn-ghost btn-sm mr-2">
                                    {openCategories[category._id] ? <FaAngleDown /> : <FaAngleRight />}
                                </button>
                            )}
                            <span className="font-semibold">{category.name}</span>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => onEdit(category)}
                                className="btn btn-ghost btn-sm text-info hover:text-info hover:bg-info/10 mr-2"
                                aria-label={`${category.name} kategorisini düzenle`}
                            >
                                <FaEdit />
                            </button>
                            <button
                                onClick={() => onDelete(category._id)}
                                disabled={isLoadingDelete}
                                className="btn btn-ghost btn-sm text-error hover:text-error hover:bg-error/10"
                                aria-label={`${category.name} kategorisini sil`}
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                    {category.children && category.children.length > 0 && openCategories[category._id] && (
                        <CategoryTree
                            categories={category.children}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            isLoadingDelete={isLoadingDelete}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </>
    );
};

const CategoryAdminPage = () => {
    const { data: categoryData, isLoading, isError, error } = useGetCategoriesQuery();
    const [addCategory, { isLoading: isLoadingCreate }] = useAddCategoryMutation();
    const [deleteCategory, { isLoading: isLoadingDelete }] = useDeleteCategoryMutation();
    const [updateCategory, { isLoading: isLoadingUpdate }] = useUpdateCategoryMutation();

    const { register, handleSubmit, reset, setValue } = useForm<IFormInput>();
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const categoryTree = useMemo(() => {
        if (categoryData?.data) {
            return buildCategoryTree(categoryData.data);
        }
        return [];
    }, [categoryData]);

    useEffect(() => {
        if (editingCategory) {
            setValue('name', editingCategory.name);
            setValue('parent', editingCategory.parent || '');
        } else {
            reset({ name: '', parent: '' });
        }
    }, [editingCategory, setValue, reset]);

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
            const payload = { ...data, parent: data.parent || null };
            if (editingCategory) {
                await updateCategory({ _id: editingCategory._id, ...payload }).unwrap();
                toast.success('Kategori başarıyla güncellendi!');
                setEditingCategory(null);
            } else {
                await addCategory(payload).unwrap();
                toast.success('Kategori başarıyla eklendi!');
            }
            reset();
        } catch (err) {
            const errorMessage = (err as any)?.data?.message || 'Bir hata oluştu';
            toast.error(errorMessage);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            try {
                await deleteCategory(id).unwrap();
                toast.success('Kategori başarıyla silindi!');
            } catch (err) {
                const errorMessage = (err as any)?.data?.message || 'Kategori silinirken bir hata oluştu.';
                toast.error(errorMessage);
            }
        }
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
    };

    const cancelEdit = () => {
        setEditingCategory(null);
        reset();
    };

    return (
        <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">{editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</h2>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Kategori Adı</span></label>
                                <input type="text" {...register('name', { required: true })} className="input input-bordered w-full" />
                            </div>
                            <div className="form-control mt-4">
                                <label className="label"><span className="label-text">Üst Kategori (İsteğe Bağlı)</span></label>
                                <select {...register('parent')} className="select select-bordered w-full">
                                    <option value="">Ana Kategori</option>
                                    {categoryData?.data?.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="card-actions justify-end mt-6">
                                {editingCategory && (
                                    <button type="button" onClick={cancelEdit} className="btn btn-ghost">İptal</button>
                                )}
                                <button type="submit" className="btn btn-primary" disabled={isLoadingCreate || isLoadingUpdate}>
                                    {(isLoadingCreate || isLoadingUpdate) && <FaSpinner className="animate-spin mr-2" />}
                                    {editingCategory ? 'Güncelle' : 'Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">Kategoriler</h2>
                        {isLoading && <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-4xl" /></div>}
                        {isError && <div className="alert alert-error">Hata: {(error as any)?.data?.message || 'Kategoriler yüklenemedi.'}</div>}
                        {!isLoading && !isError && categoryTree.length === 0 && <p>Henüz kategori eklenmemiş.</p>}
                        {!isLoading && !isError && categoryTree.length > 0 && (
                            <CategoryTree
                                categories={categoryTree}
                                onDelete={handleDeleteCategory}
                                onEdit={handleEditCategory}
                                isLoadingDelete={isLoadingDelete}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryAdminPage;