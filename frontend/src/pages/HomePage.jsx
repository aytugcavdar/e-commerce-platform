import React from 'react';
import { useGetProductsQuery } from '../features/products/productsApiSlice';
import { useAddToCartMutation } from '../features/cart/cartApiSlice'; // Yeni hook'u import et

const HomePage = () => {
  const { data: productsData, isLoading, isSuccess, isError, error } = useGetProductsQuery();
  
  // Sepete ekleme işlemi için mutation'ı ve onun yüklenme durumunu al
const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  const handleAddToCart = async (productId) => {
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      toast.success('Ürün sepete eklendi!'); // <-- Başarı bildirimi
    } catch (err) {
      toast.error('Ürün sepete eklenemedi!'); // <-- Hata bildirimi
      console.error('Sepete eklenemedi:', err);
    }
  };
  let content;

  if (isLoading) {
    content = <div className="flex justify-center items-center h-full"><span className="loading loading-lg"></span></div>;
  } else if (isSuccess) {
    const products = productsData.data;
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product._id} className="card bg-base-100 shadow-xl">
            <figure>
              <img src={product.images[0]?.url || 'https://via.placeholder.com/400x225'} alt={product.name} className="h-60 w-full object-cover" />
            </figure>
            <div className="card-body">
              <h2 className="card-title">{product.name}</h2>
              <p>{product.description.substring(0, 100)}...</p>
              <div className="card-actions justify-between items-center mt-4">
                <span className="text-2xl font-bold">{product.price} TL</span>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddToCart(product._id)} // Butona tıklama olayı eklendi
                  disabled={isAddingToCart} // Ekleme işlemi sırasında butonu devre dışı bırak
                >
                  {isAddingToCart ? <span className="loading loading-spinner"></span> : 'Sepete Ekle'}
                </button>
              </div>
            </div>
          </div>
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