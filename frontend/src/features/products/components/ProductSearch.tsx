// frontend/src/features/products/components/ProductSearch.tsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// 'useProductFilters' hook'u kaldırıldı, 'useSearchParams' eklendi.

/**
 * 🎓 ÖĞREN: ProductSearch Component
 *
 * Ürün arama çubuğu component'i.
 * Header'a veya başka bir sayfaya eklenebilir.
 *
 * Sorumluluğu:
 * - Kullanıcıdan arama metnini almak.
 * - Submit edildiğinde kullanıcıyı arama sonuçları sayfasına
 * (ProductsPage) yönlendirmek.
 * - URL'deki 'search' parametresi ile senkronize çalışmak.
 */

interface ProductSearchProps {
  autoFocus?: boolean;
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const ProductSearch = ({
  autoFocus = false,
  placeholder = 'Ürün ara... (iPhone, Samsung, Laptop)',
  onSearch,
  className = '',
}: ProductSearchProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // URL'i okumak için
  const inputRef = useRef<HTMLInputElement>(null);

  // Başlangıç state'ini global filter hook'u yerine URL'den al
  const [query, setQuery] = useState(searchParams.get('search') || '');

  /**
   * 🔄 URL'deki search parametresi değiştiğinde input'u güncelle
   * (Örn: kullanıcı filtrelerden aramayı temizlerse veya tarayıcıda ileri/geri yaparsa)
   */
  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  /**
   * 🔍 Arama Fonksiyonu (Basitleştirildi)
   * Form submit edildiğinde çalışır.
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = query.trim();

    // Custom callback varsa çağır (opsiyonel)
    onSearch?.(searchQuery);

    if (searchQuery) {
      // Her zaman /products sayfasına yönlendir.
      // Bu sayfa zaten URL'deki 'search' parametresini okuyup
      // filtrelemeyi yapacaktır.
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else {
      // Boşsa (veya sadece boşluk varsa) ve arama yapmaya çalışırsa
      // arama parametresi olmadan /products'a gitsin (tüm ürünler)
      navigate('/products');
    }
  };

  /**
   * ❌ Arama Temizleme
   * Input'u temizler ve tüm ürünler sayfasına yönlendirir.
   */
  const handleClear = () => {
    setQuery('');
    // Filtre hook'u yerine, arama parametresi olmayan /products'a git
    navigate('/products');
    inputRef.current?.focus();
  };

  /**
   * ⌨️ Klavye Kısayolları
   * ESC tuşuna basıldığında aramayı temizle
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative">
        {/* 🔍 Arama İkonu (Sol) */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 📝 Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />

        {/* 🗑️ Temizle & Ara Butonları (Sağ) */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Temizle (ESC)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            // Boş arama "tüm ürünleri göster" anlamına geldiği için
            // 'disabled' özelliğini kaldırdık.
            className="mr-1 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Ara
          </button>
        </div>
      </div>

      {/* 💡 Arama İpucu (Opsiyonel) */}
      {query.length > 0 && query.length < 3 && (
        <p className="mt-1 text-xs text-gray-500 absolute">
          Aramak için Enter'a basın
        </p>
      )}
    </form>
  );
};

export default ProductSearch;