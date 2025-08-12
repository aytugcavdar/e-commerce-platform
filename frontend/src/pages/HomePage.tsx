import React from 'react';
import { useGetProductsQuery } from '../features/products/productsApiSlice';
import { useAddToCartMutation } from '../features/cart/cartApiSlice';
import { Product, ApiResponse } from '../types';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../hooks/useNotify'; // Yeni hook'u import ediyoruz
import Card from '../components/common/Card'; // Card bileşenini de burada kullanalım

const HomePage: React.FC = () => {
  const { data: productsData, isLoading, isSuccess, isError, error } = useGetProductsQuery<ApiResponse<Product[]>>(undefined);
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const navigate = useNavigate();
  const notify = useNotify(); // Hook'u çağırıyoruz

  const handleClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // Card'ın tıklama olayını tetiklemesini engelle
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      notify.success('Ürün sepete eklendi!');
    } catch (err) {
      notify.error('Ürün sepete eklenemedi!');
      console.error('Sepete eklenemedi:', err);
    }
  };

  let content;

  if (isLoading) {
    content = <div className="flex justify-center items-center h-full"><span className="loading loading-lg"></span></div>;
  } else if (isSuccess && productsData?.data) {
    const products = productsData.data;
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <Card key={product._id} onClick={() => handleClick(product._id)}>
            <figure>
              <img src={product.images[0]?.url || 'https://via.placeholder.com/400x225'} alt={product.name} className="h-60 w-full object-cover rounded-t-lg" />
            </figure>
            <h2 className="card-title mt-4">{product.name}</h2>
            <p className="text-sm text-gray-500 flex-grow">{product.description.substring(0, 100)}...</p>
            <div className="card-actions justify-between items-center w-full mt-4">
              <span className="text-2xl font-bold">{product.price} TL</span>
              <button
                className="btn btn-primary"
                onClick={(e) => handleAddToCart(e, product._id)}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? <span className="loading loading-spinner"></span> : 'Sepete Ekle'}
              </button>
            </div>
          </Card>
        ))}
      </div>
    );
  } else if (isError) {
    content = <div className="text-center text-red-500">Hata: {error.toString()}</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-12">Öne Çıkan Ürünler</h1>
      {content}
    </div>
  );
};

export default HomePage;