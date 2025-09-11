import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetCategoryQuery } from '../features/categories/categoryApiSlice';
import { useGetProductsByCategoryQuery } from '../features/products/productsApiSlice';
import { Category, Product } from '../types';
import Card from '../components/common/Card';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  console.log('CategoryPage render - categoryId:', categoryId);
  
  // Kategori ve alt kategori bilgilerini çek
  const { 
    data: categoryData, 
    isLoading: isCategoryLoading,
    error: categoryError 
  } = useGetCategoryQuery(categoryId!, {
    skip: !categoryId
  });

  // Kategori ve alt kategorilerin ID'lerini topla
  const allCategoryIds = React.useMemo(() => {
    if (!categoryData?.data) {
      console.log('Kategori data yok');
      return [];
    }
    
    const ids = [categoryData.data._id];
    if (categoryData.data.children && categoryData.data.children.length > 0) {
      categoryData.data.children.forEach((child: Category) => ids.push(child._id));
      console.log('Alt kategoriler de eklendi:', categoryData.data.children.length);
    }
    
    console.log('Toplam kategori IDs:', ids);
    return ids;
  }, [categoryData]);

  // Ürünleri toplanan ID'lere göre çek
  const { 
    data: productsData, 
    isLoading: areProductsLoading,
    error: productsError 
  } = useGetProductsByCategoryQuery(allCategoryIds, {
    skip: allCategoryIds.length === 0,
  });

  console.log('Products data:', productsData);
  console.log('Products error:', productsError);

  if (isCategoryLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (categoryError) {
    console.error('Category error:', categoryError);
    return <div className="text-center text-red-500">Kategori yüklenirken hata oluştu.</div>;
  }

  if (!categoryData?.data) {
    return <div className="text-center text-red-500">Kategori bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{categoryData.data.name}</h1>
        {categoryData.data.description && (
          <p className="text-lg text-gray-600">{categoryData.data.description}</p>
        )}
        
        {/* Alt kategorileri göster */}
        {categoryData.data.children && categoryData.data.children.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Bu kategori {categoryData.data.children.length} alt kategoriye sahip
            </p>
          </div>
        )}
      </div>

      {/* Yükleme durumu */}
      {areProductsLoading && (
        <div className="flex justify-center items-center min-h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Hata durumu */}
      {productsError && (
        <div className="text-center text-red-500 mb-8">
          Ürünler yüklenirken hata oluştu: {JSON.stringify(productsError)}
        </div>
      )}

      {/* Ürün listesi */}
      {!areProductsLoading && !productsError && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            Ürünler ({productsData?.count || 0})
          </h2>
          
          {productsData?.data && productsData.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productsData.data.map((product: Product) => (
                <Link key={product._id} to={`/products/${product._id}`} className="hover:shadow-lg transition-shadow">
                  <Card>
                    <figure className="aspect-video">
                      <img 
                        src={product.images && product.images[0]?.url || 'https://via.placeholder.com/400x225'} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </figure>
                    <div className="card-body p-4">
                      <h3 className="card-title text-lg font-semibold line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xl font-bold text-primary">
                          {product.price} TL
                        </span>
                        {product.stock <= 0 && (
                          <span className="badge badge-error text-white">Stok Yok</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Bu kategoride henüz ürün bulunmuyor
              </h3>
              <p className="text-gray-500">
                Yakında bu kategoriye ürünler eklenecek.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;