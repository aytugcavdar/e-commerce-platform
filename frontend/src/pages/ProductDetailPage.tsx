import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useGetProductWithCategoryQuery } from '../features/products/productsApiSlice';
import { useAddToCartMutation } from '../features/cart/cartApiSlice';
import { useNotify } from '../hooks/useNotify';
import { FaShoppingCart, FaHeart, FaShare, FaStar, FaBox, FaCheckCircle, FaTimesCircle, FaPlus, FaMinus } from 'react-icons/fa';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  
  // Sepete ekleme hook'u ve notification hook'u eklendi
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const notify = useNotify();

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useGetProductWithCategoryQuery(id || '');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Hata: {(error as any)?.data?.message || 'Ürün yüklenemedi.'}</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4">
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Ürün bulunamadı.</span>
        </div>
      </div>
    );
  }

  const productData = product.data;
  const isInStock = productData.stock > 0;

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= productData.stock) {
      setQuantity(newQuantity);
    }
  };

  // Sepete ekleme fonksiyonu düzeltildi
  const handleAddToCart = async () => {
    try {
      await addToCart({ productId: productData._id, quantity }).unwrap();
      notify.success(`${quantity} adet ${productData.name} sepete eklendi!`);
    } catch (err) {
      notify.error('Ürün sepete eklenemedi!');
      console.error('Sepete eklenemedi:', err);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="breadcrumbs text-sm mb-6">
          <ul>
            <li>
              <Link to="/" className="link link-hover">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 mr-1 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9l-7-7-7 7v11a2 2 0 002 2h4.586a2 2 0 01.707.293l.707.707H19a2 2 0 002-2V9z" />
                </svg>
                Anasayfa
              </Link>
            </li>
            {product.category?.ancestors?.map((ancestor) => (
              <li key={ancestor._id}>
                <Link to={`/category/${ancestor._id}`} className="link link-hover">
                  {ancestor.name}
                </Link>
              </li>
            ))}
            {product.category && (
              <li>
                <Link to={`/category/${product.category._id}`} className="link link-hover">
                  {product.category.name}
                </Link>
              </li>
            )}
            <li className="text-base-content font-medium">{productData.name}</li>
          </ul>
        </div>

        {/* Ana İçerik */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ürün Görseli */}
          <div className="space-y-4">
            <div className="card bg-base-200 shadow-lg">
              <figure className="px-4 pt-4">
                <img
                  src={productData.images?.[0]?.url || 'https://via.placeholder.com/600x600'}
                  alt={productData.name}
                  className="rounded-xl w-full h-96 object-cover"
                />
              </figure>
            </div>
            
            {/* Küçük görseller (eğer birden fazla varsa) */}
            {productData.images && productData.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {productData.images.map((image, index) => (
                  <div key={index} className="flex-shrink-0">
                    <img
                      src={image.url}
                      alt={`${productData.name} ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ürün Bilgileri */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-base-content mb-2">
                {productData.name}
              </h1>
              
              {/* Fiyat ve Stok Durumu */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold text-primary">
                  {productData.price.toLocaleString('tr-TR')} ₺
                </div>
                
                <div className="flex items-center gap-2">
                  {isInStock ? (
                    <div className="badge badge-success gap-2">
                      <FaCheckCircle className="w-3 h-3" />
                      Stokta
                    </div>
                  ) : (
                    <div className="badge badge-error gap-2">
                      <FaTimesCircle className="w-3 h-3" />
                      Tükendi
                    </div>
                  )}
                </div>
              </div>

              {/* Stok Adedi */}
              {isInStock && (
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <FaBox className="w-4 h-4" />
                  <span>{productData.stock} adet stokta</span>
                </div>
              )}
            </div>

            {/* Ürün Açıklaması */}
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-3">Ürün Açıklaması</h3>
              <p className="text-base-content/80 leading-relaxed">
                {productData.description}
              </p>
            </div>

            {/* Aksiyon Butonları */}
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body">
                {/* Miktar Seçimi */}
                {isInStock && (
                  <div className="mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Adet</span>
                      <span className="label-text-alt text-xs">
                        Maksimum {productData.stock} adet
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="btn btn-outline btn-sm btn-circle"
                      >
                        <FaMinus className="w-3 h-3" />
                      </button>
                      
                      <div className="form-control w-20">
                        <input
                          type="number"
                          min="1"
                          max={productData.stock}
                          value={quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= productData.stock) {
                              setQuantity(value);
                            }
                          }}
                          className="input input-bordered input-sm text-center"
                        />
                      </div>
                      
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= productData.stock}
                        className="btn btn-outline btn-sm btn-circle"
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleAddToCart}
                    className={`btn btn-primary flex-1 gap-2 ${!isInStock || isAddingToCart ? 'btn-disabled' : ''}`}
                    disabled={!isInStock || isAddingToCart}
                  >
                    {isAddingToCart ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Ekleniyor...
                      </>
                    ) : (
                      <>
                        <FaShoppingCart />
                        {isInStock ? `Sepete Ekle (${quantity} adet)` : 'Stokta Yok'}
                      </>
                    )}
                  </button>
                  
                  <button className="btn btn-outline btn-secondary gap-2">
                    <FaHeart />
                    Favorile
                  </button>
                  
                  <button className="btn btn-outline btn-accent gap-2">
                    <FaShare />
                    Paylaş
                  </button>
                </div>

                {/* Toplam Fiyat */}
                {isInStock && quantity > 1 && (
                  <div className="mt-4 p-3 bg-base-300 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Toplam Fiyat:</span>
                      <span className="text-lg font-bold text-primary">
                        {(productData.price * quantity).toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ürün Özellikleri */}
            {productData.attributes && productData.attributes.length > 0 && (
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-lg mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ürün Özellikleri
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <tbody>
                        {productData.attributes.map((attr, index) => (
                          <tr key={index}>
                            <td className="font-medium w-1/3">{attr.key}</td>
                            <td>{attr.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Güvenlik ve Garanti Bilgileri */}
            <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-sm">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-12 h-12">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">Güvenli Alışveriş</h4>
                    <ul className="text-sm text-base-content/70 mt-2 space-y-1">
                      <li>• 14 gün içinde ücretsiz iade</li>
                      <li>• Güvenli ödeme seçenekleri</li>
                      <li>• Hızlı ve güvenli kargo</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benzer Ürünler Bölümü (Placeholder) */}
        <div className="mt-12">
          <div className="divider divider-start">
            <h2 className="text-2xl font-bold">Benzer Ürünler</h2>
          </div>
          
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Benzer ürünler yakında eklenecek!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;