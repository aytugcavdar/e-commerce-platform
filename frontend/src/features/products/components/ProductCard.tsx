// frontend/src/features/products/components/ProductCard.tsx

import { Link } from 'react-router-dom';
import type { Product } from '../types/product.types';

/**
 * 🎓 ÖĞREN: Component Props Pattern
 * 
 * Props interface'i ile component'e ne gönderebileceğimizi tanımlarız.
 * TypeScript sayesinde yanlış prop gönderemeyiz.
 */
interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;  // Opsiyonel
  onQuickView?: (product: Product) => void;  // Opsiyonel
}

const ProductCard = ({ product, onAddToCart, onQuickView }: ProductCardProps) => {
  /**
   * 💰 Price Calculation
   * 
   * İndirimli fiyat varsa onu göster, yoksa normal fiyat.
   */
  const finalPrice = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;

  /**
   * 📊 Discount Percentage
   * 
   * İndirim yüzdesi hesapla
   */
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  /**
   * 🖼️ Main Image
   * 
   * Ana resmi bul, yoksa ilk resmi kullan
   */
  const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];

  /**
   * 📦 Stock Status
   */
  const isOutOfStock = product.stock === 0 || product.status === 'out-of-stock';
  const isLowStock = product.stock > 0 && product.stock <= 5;

  /**
   * 🎨 Format Price
   * 
   * Türk Lirası formatında göster
   */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* 🏷️ Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
        {/* İndirim Badge */}
        {hasDiscount && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            -{discountPercentage}%
          </span>
        )}
        
        {/* Yeni Badge (son 7 gün) */}
        {(() => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const productDate = new Date(product.createdAt);
          return productDate > sevenDaysAgo ? (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
              YENİ
            </span>
          ) : null;
        })()}
        
        {/* Öne Çıkan Badge */}
        {product.isFeatured && (
          <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            ⭐ ÖNE ÇIKAN
          </span>
        )}
      </div>

      {/* 🖼️ Image Container */}
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">STOKTA YOK</span>
            </div>
          )}
        </div>
      </Link>

      {/* 📝 Product Info */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <Link
            to={`/products?brand=${product.brand._id}`}
            className="text-xs text-gray-500 hover:text-blue-600 font-medium uppercase tracking-wide"
          >
            {product.brand.name}
          </Link>
        )}

        {/* Product Name */}
        <Link to={`/products/${product.slug}`}>
          <h3 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Category */}
        {product.category && (
          <Link
            to={`/products?category=${product.category._id}`}
            className="text-xs text-gray-400 hover:text-blue-600 mt-1 inline-block"
          >
            {product.category.name}
          </Link>
        )}

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {!isOutOfStock && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {isLowStock ? (
              <>
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-orange-600 font-medium">
                  Son {product.stock} ürün!
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-600 font-medium">Stokta var</span>
              </>
            )}
          </div>
        )}

        {/* 🛒 Actions */}
        <div className="mt-4 flex gap-2">
          {/* Add to Cart Button */}
          {!isOutOfStock && onAddToCart && (
            <button
              onClick={() => onAddToCart?.(product)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Sepete Ekle
            </button>
          )}

          {/* Quick View Button */}
          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Hızlı Görüntüle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 💚 Wishlist Button (Üstte sağda) */}
      <button
        className="absolute top-2 right-2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-colors"
        title="Favorilere Ekle"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>
  );
};

export default ProductCard;

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * import ProductCard from '@/features/products/components/ProductCard';
 * 
 * const ProductList = ({ products }) => {
 *   const { addItem } = useCart();
 *   
 *   const handleAddToCart = (product: Product) => {
 *     addItem(product);
 *     toast.success('Ürün sepete eklendi!');
 *   };
 *   
 *   return (
 *     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
 *       {products.map((product) => (
 *         <ProductCard
 *           key={product._id}
 *           product={product}
 *           onAddToCart={handleAddToCart}
 *         />
 *       ))}
 *     </div>
 *   );
 * };
 */

/**
 * 💡 PRO TIP: Line Clamp
 * 
 * Uzun metinleri kesmek için Tailwind'in line-clamp utility'sini kullan:
 * 
 * line-clamp-1  → 1 satır
 * line-clamp-2  → 2 satır
 * line-clamp-3  → 3 satır
 * 
 * CSS:
 * .line-clamp-2 {
 *   display: -webkit-box;
 *   -webkit-line-clamp: 2;
 *   -webkit-box-orient: vertical;
 *   overflow: hidden;
 * }
 */

/**
 * 🔥 BEST PRACTICE: Image Optimization
 * 
 * 1. Lazy Loading:
 *    <img loading="lazy" />
 * 
 * 2. Responsive Images:
 *    <img srcSet="small.jpg 500w, large.jpg 1000w" />
 * 
 * 3. Next.js Image:
 *    <Image src="..." width={300} height={300} />
 * 
 * 4. Cloudinary Transformation:
 *    url.replace('/upload/', '/upload/w_300,h_300,c_fill/')
 */

/**
 * 🎨 VARIANTS: Farklı Görünümler
 * 
 * interface ProductCardProps {
 *   variant?: 'grid' | 'list' | 'compact';
 * }
 * 
 * Grid: Kare kart (yukarıdaki)
 * List: Yatay kart (mobil için)
 * Compact: Küçük kart (sidebar için)
 */