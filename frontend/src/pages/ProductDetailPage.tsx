import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetProductWithCategoryQuery } from '../features/products/productsApiSlice';
import { useGetCategoryWithAncestorsQuery } from '../features/categories/categoryApiSlice';
import { ChevronRight, Star, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { useAddToCartMutation } from '../features/cart/cartApiSlice';
import { useNotify } from '../hooks/useNotify';
interface Breadcrumb {
  name: string;
  slug?: string;
  _id?: string;
}




const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
   const notify = useNotify();
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  
  const {
    data: productResponse,
    isLoading: productLoading,
    error: productError
  } = useGetProductWithCategoryQuery(id!);

  const handleAddToCart = async () => { // Eklendi
    if (!product) return;
    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      notify.success('Ürün sepete eklendi!');
    } catch (err) {
      notify.error('Ürün sepete eklenemedi!');
      console.error('Sepete eklenemedi:', err);
    }
  };
  const product = productResponse?.data;

  // Eğer ürün bilgisi geldi ve categoryId varsa, category ancestors'ları al
  const {
    data: categoryWithAncestors,
    isLoading: categoryLoading
  } = useGetCategoryWithAncestorsQuery(product?.categoryId || '', {
    skip: !product?.categoryId
  });

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ürün Bulunamadı</h2>
          <p className="text-gray-600">Aradığınız ürün bulunamadı veya kaldırılmış olabilir.</p>
          <Link 
            to="/products" 
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Ürünlere Dön
          </Link>
        </div>
      </div>
    );
  }

  // Breadcrumb oluştur
  const breadcrumbs: Breadcrumb[] = [
    { name: 'Ana Sayfa' },
    { name: 'Ürünler' }
  ];

  // Category ancestors'ları breadcrumb'a ekle
  if (categoryWithAncestors && !categoryLoading) {
    // Önce ancestors'ları ekle
    if (categoryWithAncestors.ancestors) {
      categoryWithAncestors.ancestors.forEach(ancestor => {
        breadcrumbs.push({
          name: ancestor.name,
          slug: ancestor.slug,
          _id: ancestor._id
        });
      });
    }
    
    // Son olarak mevcut kategoriyi ekle
    breadcrumbs.push({
      name: categoryWithAncestors.name,
      slug: categoryWithAncestors.slug,
      _id: categoryWithAncestors._id
    });
  }

  // Son olarak ürün adını ekle
  breadcrumbs.push({ name: product.name });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${
            i <= rating 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-500 font-medium">
                    {crumb.name}
                  </span>
                ) : crumb.slug ? (
                  <Link 
                    to={`/categories/${crumb._id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <Link 
                    to={index === 1 ? "/products" : "/"}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            
            {/* Ürün Resimleri */}
            <div className="space-y-4">
              {product.images && product.images.length > 0 ? (
                <div>
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {product.images.slice(1, 5).map((image, index) => (
                        <img
                          key={index}
                          src={image.url}
                          alt={`${product.name} ${index + 2}`}
                          className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-75"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Resim Yok</span>
                </div>
              )}
            </div>

            {/* Ürün Bilgileri */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                
                {/* Ürün Değerlendirmesi */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex">
                    {renderStars(product.averageRating || 0)}
                  </div>
                  <span className="text-gray-600">
                    ({product.reviewCount || 0} değerlendirme)
                  </span>
                </div>

                {/* Fiyat */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ₺{product.price?.toLocaleString('tr-TR')}
                  </span>
                </div>

                {/* Stok Durumu */}
                <div className="mb-6">
                  {product.stock && product.stock > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Stokta ({product.stock} adet)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      Stokta Yok
                    </span>
                  )}
                </div>
              </div>

              {/* Ürün Açıklaması */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Ürün Açıklaması
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Ürün Özellikleri */}
              {product.attributes && product.attributes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Ürün Özellikleri
                  </h3>
                  <div className="space-y-2">
                    {product.attributes.map((attr, index) => (
                      <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">{attr.key}:</span>
                        <span className="text-gray-600">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aksiyon Butonları */}
              <div className="space-y-4">
                 <button
                  onClick={handleAddToCart} // Eklendi
                  disabled={!product.stock || product.stock === 0 || isAddingToCart} // isAddingToCart eklendi
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}</span> {/* Yüklenme durumu eklendi */}
                </button>

                <div className="flex space-x-4">
                  <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center space-x-2">
                    <Heart className="w-5 h-5" />
                    <span>Favorilere Ekle</span>
                  </button>
                  
                  <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center space-x-2">
                    <Share2 className="w-5 h-5" />
                    <span>Paylaş</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;