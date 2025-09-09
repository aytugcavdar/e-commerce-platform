import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetCategoryQuery } from '../features/categories/categoryApiSlice';
import { useGetProductsByCategoryQuery } from '../features/products/productsApiSlice';
import { Category, Product, ApiResponse } from '../types';
import Card from '../components/common/Card';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  // Kategori ve alt kategori bilgilerini çek
  const { data: categoryData, isLoading: isCategoryLoading } = useGetCategoryQuery(categoryId!);

  // Kategori ve alt kategorilerin ID'lerini topla
  const allCategoryIds = React.useMemo(() => {
    if (!categoryData?.data) return [];
    const ids = [categoryData.data._id];
    if (categoryData.data.children) {
      categoryData.data.children.forEach((child: Category) => ids.push(child._id));
    }
    return ids;
  }, [categoryData]);

  // Ürünleri toplanan ID'lere göre çek
  const { data: productsData, isLoading: areProductsLoading } = useGetProductsByCategoryQuery(allCategoryIds, {
    skip: allCategoryIds.length === 0,
  });

  if (isCategoryLoading) {
    return <div className="text-center"><span className="loading loading-lg"></span></div>;
  }

  if (!categoryData?.data) {
    return <div className="text-center text-red-500">Kategori bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-2">{categoryData.data.name}</h1>
      <p className="mb-8 text-lg text-gray-600">{categoryData.data.description}</p>

      {areProductsLoading ? (
         <div className="text-center"><span className="loading loading-lg"></span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsData?.data?.map((product: Product) => (
            <Link key={product._id} to={`/products/${product._id}`}>
              <Card>
                <figure><img src={product.images[0]?.url || 'https://via.placeholder.com/400x225'} alt={product.name} /></figure>
                <div className="card-body">
                  <h2 className="card-title">{product.name}</h2>
                  <p>{product.price} TL</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;