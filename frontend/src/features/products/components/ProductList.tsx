// frontend/src/features/products/components/ProductList.tsx

import ProductCard from './ProductCard';
import type { Product } from '../types/product.types';

/**
 * 🎓 ÖĞREN: Component Props Pattern
 * 
 * Props interface ile component'e ne gönderebileceğimizi tanımlarız.
 * TypeScript sayesinde yanlış prop gönderemeyiz.
 * 
 * ❓ Neden Interface Kullanıyoruz?
 * - Type safety (hata yakalama)
 * - Auto-complete (IDE otomatik tamamlama)
 * - Documentation (props'lar self-documenting)
 * 
 * ❓ Optional Props (?) Ne Zaman Kullanılır?
 * - loading?: Bazı yerlerde loading göstermeyebiliriz
 * - onAddToCart?: Sepete ekleme her zaman gerekmeyebilir
 */
interface ProductListProps {
  products: Product[];              // Zorunlu: Ürün listesi
  loading?: boolean;                // Opsiyonel: Yüklenme durumu
  onAddToCart?: (product: Product) => void; // Opsiyonel: Sepete ekle callback
}

/**
 * 🎓 ÖĞREN: Conditional Rendering
 * 
 * React'te 3 durumu render ediyoruz:
 * 1. Loading State (Yüklenirken)
 * 2. Empty State (Ürün yoksa)
 * 3. Success State (Ürünler varsa)
 */
const ProductList = ({ products, loading = false, onAddToCart }: ProductListProps) => {
  
  /**
   * 🔄 DURUM 1: LOADING STATE
   * 
   * ❓ Neden Skeleton Loader Kullanıyoruz?
   * - Kullanıcı beklerken boş ekran görmemeli
   * - Sayfanın yapısını önceden gösterir (Layout Shift önlenir)
   * - UX açısından daha profesyonel
   * 
   * 💡 Teknik Detaylar:
   * - [...Array(8)]: 8 elemanlı boş array oluştur
   * - .map((_, i)): Her eleman için skeleton render et
   * - animate-pulse: Tailwind CSS animasyonu (yanıp söner)
   * - bg-gray-200: Placeholder rengi
   */
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            {/* Resim placeholder */}
            <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
            {/* Başlık placeholder */}
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            {/* Fiyat placeholder (daha kısa) */}
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  /**
   * 🔄 DURUM 2: EMPTY STATE
   * 
   * ❓ Neden Önemli?
   * - Kullanıcı "Bu sayfa bozuk mu?" diye düşünmemeli
   * - Net mesaj: "Aradığın ürün yok" veya "Filtreni değiştir"
   * 
   * 💡 İyileştirmeler (Gelişmiş Versiyonda):
   * - Emoji ekle (😕)
   * - "Filtreleri Temizle" butonu
   * - "Popüler Ürünleri Gör" butonu
   */
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-500 text-lg font-medium mb-2">Ürün Bulunamadı</p>
        <p className="text-gray-400 text-sm">Arama kriterlerini değiştirmeyi deneyin</p>
      </div>
    );
  }

  /**
   * 🔄 DURUM 3: SUCCESS STATE
   * 
   * ❓ Grid System Nasıl Çalışır?
   * - grid-cols-1: Mobilde 1 sütun
   * - md:grid-cols-3: Tablet'te 3 sütun
   * - lg:grid-cols-4: Desktop'ta 4 sütun
   * - gap-6: Aralarındaki boşluk (1.5rem = 24px)
   * 
   * ❓ Key Prop Neden Önemli?
   * - React'in performans optimizasyonu için
   * - Hangi ürünün değiştiğini anlar
   * - ASLA index kullanma! (ürün sırası değişirse bug)
   * 
   * 💡 Pro Tip: Key Seçimi
   * ✅ İYİ: product._id (unique ID)
   * ❌ KÖTÜ: index (sıralama değişirse hatalı render)
   */
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product._id}        // ✅ Unique ID kullan
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

export default ProductList;

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // 1. Basit Kullanım (Sadece Göster)
 * <ProductList products={products} />
 * 
 * // 2. Loading State ile
 * <ProductList 
 *   products={products} 
 *   loading={isLoading} 
 * />
 * 
 * // 3. Sepete Ekle Fonksiyonu ile
 * <ProductList 
 *   products={products}
 *   onAddToCart={(product) => {
 *     dispatch(addToCart(product));
 *     toast.success('Ürün sepete eklendi!');
 *   }}
 * />
 */

/**
 * 💡 PRO TIP: Performance Optimization
 * 
 * Binlerce ürün varsa?
 * 1. Virtualization kullan (react-window veya react-virtualized)
 * 2. Pagination ekle (20'şer 20'şer göster)
 * 3. Lazy loading (scroll'da yükle)
 * 
 * Örnek:
 * import { FixedSizeGrid } from 'react-window';
 * 
 * <FixedSizeGrid
 *   columnCount={4}
 *   rowCount={Math.ceil(products.length / 4)}
 *   ...
 * >
 *   {Cell}
 * </FixedSizeGrid>
 */

/**
 * 🔥 BEST PRACTICE: Accessibility (A11y)
 * 
 * ✅ Eklenebilecek İyileştirmeler:
 * 
 * 1. Semantic HTML:
 * <section role="region" aria-label="Ürün Listesi">
 * 
 * 2. Loading Announcement:
 * <div aria-live="polite" aria-busy={loading}>
 * 
 * 3. Empty State için:
 * <p role="status">Ürün bulunamadı</p>
 * 
 * 4. Keyboard Navigation:
 * ProductCard'a focusable yapı ekle
 */