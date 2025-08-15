// frontend/src/pages/CategoryAdminPage.tsx

import { useState } from 'react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../features/categories/categoryApiSlice';
import { Category } from '../types/Category';

const CategoryAdminPage = () => {
  const { data: categories, isLoading, isError } = useGetCategoriesQuery({});
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [newCategoryName, setNewCategoryName] = useState('');
  
  // --- Değişiklik Başlangıcı: State yönetimini refactor ediyoruz ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  // --- Değişiklik Sonu ---

  const [selectedParent, setSelectedParent] = useState('');

  const handleCreateCategory = async () => {
    if (newCategoryName.trim() !== '') {
      const parent = selectedParent === '' ? null : selectedParent;
      await createCategory({ name: newCategoryName, parent });
      setNewCategoryName('');
      setSelectedParent('');
    }
  };

  // --- Değişiklik Başlangıcı: Güncelleme fonksiyonu yeni state'lere göre düzenlendi ---
  const handleUpdateCategory = async () => {
    if (editingId && editingName.trim() !== '') {
      const parent = selectedParent === '' ? null : selectedParent;
      await updateCategory({
        id: editingId, // Artık ID'yi buradan güvenle alıyoruz
        updatedCategory: { name: editingName, parent },
      });
      // Formu temizle
      setEditingId(null);
      setEditingName('');
      setSelectedParent('');
    }
  };
  // --- Değişiklik Sonu ---

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
  };
  
  // --- Değişiklik Başlangıcı: Formu temizleme/iptal fonksiyonu ---
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setSelectedParent('');
  };
  // --- Değişiklik Sonu ---

  if (isLoading) return <div>Yükleniyor...</div>;
  if (isError) return <div>Hata oluştu.</div>;

  const isEditing = editingId !== null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Kategorileri Yönet</h1>
      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl mb-2">
          {isEditing ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
        </h2>
        <input
          type="text"
          className="border p-2 w-full mb-2"
          placeholder="Kategori Adı"
          // --- Değişiklik: value ve onChange yeni state'lere bağlandı ---
          value={isEditing ? editingName : newCategoryName}
          onChange={(e) => {
            if (isEditing) {
              setEditingName(e.target.value);
            } else {
              setNewCategoryName(e.target.value);
            }
          }}
        />
        <select
          className="border p-2 w-full mb-2"
          value={selectedParent}
          onChange={(e) => setSelectedParent(e.target.value)}
        >
          <option value="">Ana Kategori (Üst Kategorisi Yok)</option>
          {categories?.data.map((category: Category) => (
             // Düzenleme modunda kategorinin kendisini parent olarak seçmesini engelle
            (editingId !== category._id) && (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            )
          ))}
        </select>
        {isEditing ? (
          <div>
            <button
              onClick={handleUpdateCategory}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Güncelle
            </button>
            <button
              onClick={cancelEditing} // İptal butonu eklendi
              className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
            >
              İptal
            </button>
          </div>
        ) : (
          <button
            onClick={handleCreateCategory}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Ekle
          </button>
        )}
      </div>

      <h2 className="text-xl mb-2">Mevcut Kategoriler</h2>
      <ul>
        {categories?.data.map((category: Category) => (
          <li
            key={category._id}
            className="flex justify-between items-center p-2 border-b"
          >
            <div>
              <span>{category.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                {category.parent ? `(${categories.data.find((c: Category) => c._id === category.parent)?.name})` : ''}
              </span>
            </div>
            <div>
              <button
                // --- Değişiklik: Düzenleme state'lerini ayarla ---
                onClick={() => {
                  setEditingId(category._id);
                  setEditingName(category.name);
                  setSelectedParent(category.parent || '');
                }}
                className="bg-yellow-500 text-white px-2 py-1 rounded"
              >
                Düzenle
              </button>
              <button
                onClick={() => handleDeleteCategory(category._id)}
                className="bg-red-500 text-white px-2 py-1 rounded ml-2"
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryAdminPage;