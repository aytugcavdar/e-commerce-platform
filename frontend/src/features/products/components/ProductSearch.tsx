// frontend/src/features/products/components/ProductSearch.tsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductFilters } from '../hooks/useProductFilters';

/**
 * 🎓 ÖĞREN: ProductSearch Component
 * 
 * Ürün arama çubuğu component'i.
 * Header'a veya ProductsPage'e eklenebilir.
 * 
 * Özellikler:
 * - Real-time arama (debounce ile)
 * - Klavye navigasyonu (Enter tuşu ile arama)
 * - Temizle butonu
 * - Auto-focus (opsiyonel)
 * - Placeholder animasyonu
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
  const { filters, updateFilter } = useProductFilters();
  const [query, setQuery] = useState(filters.search || '');
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 🔄 URL'deki search parametresi değiştiğinde input'u güncelle
   */
  useEffect(() => {
    setQuery(filters.search || '');
  }, [filters.search]);

  /**
   * 🔍 Arama Fonksiyonu
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      // Filtre güncelle
      updateFilter('search', query.trim());
      
      // Custom callback varsa çağır
      onSearch?.(query.trim());
      
      // Products sayfasına yönlendir (eğer farklı bir sayfadaysa)
      if (!window.location.pathname.includes('/products')) {
        navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      }
    } else {
      // Boşsa search filtresini temizle
      updateFilter('search', undefined);
    }
  };

  /**
   * ❌ Arama Temizleme
   */
  const handleClear = () => {
    setQuery('');
    updateFilter('search', undefined);
    inputRef.current?.focus();
  };

  /**
   * ⌨️ Klavye Kısayolları
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // ESC tuşuna basıldığında temizle
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
            disabled={!query.trim()}
            className="mr-1 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Ara
          </button>
        </div>
      </div>

      {/* 💡 Arama İpucu (Opsiyonel) */}
      {query.length > 0 && query.length < 3 && (
        <p className="mt-1 text-xs text-gray-500">
          En az 3 karakter girin
        </p>
      )}
    </form>
  );
};

export default ProductSearch;

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // 1. Header'da Kullanım
 * const Header = () => {
 *   return (
 *     <header>
 *       <ProductSearch className="w-full md:w-96" />
 *     </header>
 *   );
 * };
 * 
 * // 2. ProductsPage'de Kullanım
 * const ProductsPage = () => {
 *   const handleSearch = (query: string) => {
 *     console.log('Aranan:', query);
 *   };
 *   
 *   return (
 *     <div>
 *       <ProductSearch
 *         onSearch={handleSearch}
 *         autoFocus
 *         placeholder="Ne aramıştınız?"
 *       />
 *     </div>
 *   );
 * };
 * 
 * // 3. Mobil Drawer'da
 * const MobileSearch = () => {
 *   const [isOpen, setIsOpen] = useState(false);
 *   
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>
 *         🔍 Ara
 *       </button>
 *       
 *       {isOpen && (
 *         <div className="fixed inset-0 bg-white z-50 p-4">
 *           <ProductSearch autoFocus />
 *           <button onClick={() => setIsOpen(false)}>Kapat</button>
 *         </div>
 *       )}
 *     </>
 *   );
 * };
 */

/**
 * 💡 PRO TIP: Debouncing Ekle
 * 
 * Real-time arama için debounce kullan:
 * 
 * import { useState, useEffect } from 'react';
 * 
 * const [query, setQuery] = useState('');
 * const [debouncedQuery, setDebouncedQuery] = useState('');
 * 
 * useEffect(() => {
 *   const timer = setTimeout(() => {
 *     setDebouncedQuery(query);
 *   }, 500);
 *   
 *   return () => clearTimeout(timer);
 * }, [query]);
 * 
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     updateFilter('search', debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 */

/**
 * 🔥 BEST PRACTICE: Search Suggestions
 * 
 * Autocomplete için:
 * 
 * const [suggestions, setSuggestions] = useState<string[]>([]);
 * const [showSuggestions, setShowSuggestions] = useState(false);
 * 
 * useEffect(() => {
 *   if (query.length >= 3) {
 *     // API'den öneriler getir
 *     apiClient.get(`/products/search/suggestions?q=${query}`)
 *       .then(res => setSuggestions(res.data));
 *   }
 * }, [query]);
 * 
 * // Suggestions dropdown render et
 * {showSuggestions && suggestions.length > 0 && (
 *   <div className="absolute top-full mt-1 w-full bg-white shadow-lg">
 *     {suggestions.map(s => (
 *       <button key={s} onClick={() => setQuery(s)}>
 *         {s}
 *       </button>
 *     ))}
 *   </div>
 * )}
 */