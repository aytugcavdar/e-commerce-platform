import React, { useState, useMemo } from 'react';
import { 
    useGetCategoriesQuery, 
    useCreateCategoryMutation, 
    useDeleteCategoryMutation 
} from '../features/categories/categoryApiSlice';
import { useNotify } from '../hooks/useNotify';
import { Category } from '../types/Category';
import { FaTrash, FaPlus, FaSpinner, FaAngleDown, FaAngleRight } from 'react-icons/fa';

// Kategori ağacını oluşturan yardımcı fonksiyon
const buildCategoryTree = (categories: Category[]): Category[] => {
    // Çocukları da içerecek şekilde genişletilmiş bir tip tanımı
    type CategoryWithChildren = Category & { children: CategoryWithChildren[] };
    
    const categoryMap: { [key: string]: CategoryWithChildren } = {};
    const tree: CategoryWithChildren[] = [];

    categories.forEach(category => {
        categoryMap[category._id] = { ...category, children: [] };
    });

    categories.forEach(category => {
        if (category.parent?._id) {
            const parent = categoryMap[category.parent._id];
            if (parent) {
                parent.children.push(categoryMap[category._id]);
            }
        } else {
            tree.push(categoryMap[category._id]);
        }
    });

    return tree;
};

// Kategori listesini hiyerarşik olarak render eden bileşen
const CategoryTree: React.FC<{ 
    categories: (Category & { children?: Category[] })[], 
    onDelete: (id: string) => void, 
    isLoadingDelete: boolean,
    level?: number
}> = ({ categories, onDelete, isLoadingDelete, level = 0 }) => {
    
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
                                <button 
                                    onClick={() => toggleCategory(category._id)} 
                                    className="btn btn-ghost btn-xs mr-2 text-base-content/60"
                                >
                                    {openCategories[category._id] ? <FaAngleDown /> : <FaAngleRight />}
                                </button>
                            )}
                            <span className="font-medium text-base-content">{category.name}</span>
                        </div>
                        <button
                            onClick={() => onDelete(category._id)}
                            disabled={isLoadingDelete}
                            className="btn btn-ghost btn-sm text-error hover:text-error hover:bg-error/10"
                            aria-label={`${category.name} kategorisini sil`}
                        >
                            <FaTrash />
                        </button>
                    </div>
                    {category.children && category.children.length > 0 && openCategories[category._id] && (
                        <CategoryTree 
                            categories={category.children} 
                            onDelete={onDelete} 
                            isLoadingDelete={isLoadingDelete}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </>
    );
};

// Ana Sayfa Bileşeni
const CategoryAdminPage = () => {
    const { data: categoryResponse, isLoading, isError, refetch } = useGetCategoriesQuery();
    const [createCategory, { isLoading: isLoadingCreate }] = useCreateCategoryMutation();
    const [deleteCategory, { isLoadingDelete }] = useDeleteCategoryMutation();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedParent, setSelectedParent] = useState<string | null>(null);
    
    useNotify({
        isSuccess: !isLoadingCreate && !isLoadingDelete,
        isError: isError,
        successMessage: 'İşlem başarıyla tamamlandı!',
        errorMessage: 'Bir hata oluştu, lütfen tekrar deneyin.'
    });

    const categoryTree = useMemo(() => {
        if (categoryResponse && Array.isArray(categoryResponse.data)) {
            return buildCategoryTree(categoryResponse.data);
        }
        return [];
    }, [categoryResponse]);
    
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') return;
        
        try {
            await createCategory({ name: newCategoryName, parent: selectedParent }).unwrap();
            setNewCategoryName('');
            setSelectedParent(null);
        } catch (err) {
            console.error('Kategori oluşturulamadı:', err);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm('Bu kategoriyi silmek istediğinize emin misiniz? Alt kategorileri varsa onlar da silinecektir.')) {
            try {
                await deleteCategory(id).unwrap();
            } catch (err) {
                 console.error('Kategori silinemedi:', err);
            }
        }
    };
    
    const renderCategoryOptions = (categories: (Category & { children?: Category[] })[], level = 0): JSX.Element[] => {
        return categories.flatMap(category => [
            <option key={category._id} value={category._id}>
                {'—'.repeat(level)} {category.name}
            </option>,
            ...(category.children && category.children.length > 0
                ? renderCategoryOptions(category.children, level + 1)
                : [])
        ]);
    };

    return (
        <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Yeni Kategori Ekleme Kartı */}
            <div className="lg:col-span-1">
                 <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">Yeni Kategori Ekle</h2>
                        <form onSubmit={handleCreateCategory}>
                            <div className="form-control mb-4">
                                <label className="label" htmlFor="categoryName">
                                    <span className="label-text font-medium">Kategori Adı</span>
                                </label>
                                <input
                                    type="text"
                                    id="categoryName"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder="Örn: Elektronik"
                                    required
                                />
                            </div>
                            <div className="form-control mb-6">
                                <label className="label" htmlFor="parentCategory">
                                    <span className="label-text font-medium">Üst Kategori (İsteğe bağlı)</span>
                                </label>
                                <select
                                    id="parentCategory"
                                    value={selectedParent || ''}
                                    onChange={(e) => setSelectedParent(e.target.value || null)}
                                    className="select select-bordered w-full"
                                >
                                    <option value="">— Ana Kategori Olarak Ekle —</option>
                                    {renderCategoryOptions(categoryTree)}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoadingCreate}
                                className="btn btn-primary w-full"
                            >
                                {isLoadingCreate ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Ekleniyor...
                                    </>
                                ) : (
                                    <>
                                        <FaPlus className="mr-2" />
                                        Ekle
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Kategori Listesi Kartı */}
            <div className="lg:col-span-2">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">Kategori Listesi</h2>
                        {isLoading && (
                            <div className="flex items-center justify-center p-8">
                                <FaSpinner className="animate-spin text-2xl text-primary mr-3" />
                                <span className="text-lg">Yükleniyor...</span>
                            </div>
                        )}
                        {isError && (
                            <div className="alert alert-error">
                                <span>Kategoriler yüklenirken bir hata oluştu.</span>
                            </div>
                        )}
                        {!isLoading && !isError && categoryTree.length === 0 && (
                            <div className="alert alert-info">
                                <span>Henüz hiç kategori eklenmemiş.</span>
                            </div>
                        )}
                        {!isLoading && !isError && categoryTree.length > 0 && (
                             <CategoryTree 
                                 categories={categoryTree} 
                                 onDelete={handleDeleteCategory} 
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