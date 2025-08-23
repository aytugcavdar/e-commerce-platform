import React from 'react';
import { useGetProductsQuery } from '../features/products/productsApiSlice';
import { useAddToCartMutation } from '../features/cart/cartApiSlice';
import { Product, ApiResponse } from '../types';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../hooks/useNotify';
import Card from '../components/common/Card';

const HomePage: React.FC = () => {
  const { data: productsData, isLoading, isSuccess, isError, error } = useGetProductsQuery<ApiResponse<Product[]>>(undefined);
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  
  const navigate = useNavigate();
  const notify = useNotify();

  console.log('Products data:', productsData?.data);

  const handleClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
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
    content = (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-base-content/70">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  } else if (isSuccess && productsData?.data) {
    const products = productsData.data;
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card 
            key={product._id} 
            onClick={() => handleClick(product._id)}
            className="hover:scale-105 transition-transform duration-200"
          >
            <figure className="px-4 pt-4">
              <img 
                src={product.images[0]?.url || 'https://via.placeholder.com/400x225'} 
                alt={product.name} 
                className="rounded-xl h-48 w-full object-cover shadow-lg" 
              />
            </figure>
            <div className="card-body items-center text-center p-4">
              <h2 className="card-title text-lg font-bold line-clamp-2">{product.name}</h2>
              <p className="text-base-content/70 text-sm flex-grow line-clamp-3">
                {product.description.substring(0, 100)}...
              </p>
              <div className="card-actions justify-between items-center w-full mt-4">
                <div className="text-left">
                  <span className="text-2xl font-bold text-primary">{product.price} TL</span>
                  {product.stock > 0 ? (
                    <div className="text-xs text-success">Stokta var</div>
                  ) : (
                    <div className="text-xs text-error">Stokta yok</div>
                  )}
                </div>
                <button
                  className={`btn btn-primary btn-sm ${product.stock === 0 ? 'btn-disabled' : ''}`}
                  onClick={(e) => handleAddToCart(e, product._id)}
                  disabled={isAddingToCart || product.stock === 0}
                >
                  {isAddingToCart ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : product.stock === 0 ? (
                    'Stokta Yok'
                  ) : (
                    'Sepete Ekle'
                  )}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  } else if (isError) {
    content = (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="text-error text-6xl">⚠️</div>
        <h3 className="text-xl font-semibold text-error">Bir Hata Oluştu</h3>
        <p className="text-base-content/70">Ürünler yüklenirken bir sorun yaşandı.</p>
        <div className="text-sm text-base-content/50">Hata: {error?.toString()}</div>
        <button 
          className="btn btn-outline btn-primary"
          onClick={() => window.location.reload()}
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero bg-gradient-to-r from-primary to-secondary text-primary-content py-16 mb-12">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">Hoş Geldiniz</h1>
            <p className="mb-5 text-xl">En kaliteli ürünleri keşfedin</p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Öne Çıkan Ürünler</h2>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
        </div>
        {content}
      </div>
    </div>
  );
};

export default HomePage;