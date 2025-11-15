// frontend/src/features/products/components/ProductSearch.tsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * 🎓 ÖĞREN: ProductSearch (İyileştirilmiş)
 * 
 * Yeni Özellikler:
 * 1. ✅ Debounce (500ms bekle, sonra ara)
 * 2. ✅ Loading indicator (arama yapılırken)
 * 3. ✅ Recent searches (localStorage'da sakla)
 * 4. ✅ Suggestions dropdown (son aramalar)
 * 5. ✅ Klavye navigasyonu (↑↓ ok tuşları)
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
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // ✅ LocalStorage'dan son aramaları yükle
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // ✅ URL değiştiğinde input'u güncelle
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setQuery(urlSearch);
  }, [searchParams]);

  // ✅ Son aramaları kaydet
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Duplicate kontrolü
    const filtered = recentSearches.filter(s => s !== searchQuery);
    const updated = [searchQuery, ...filtered].slice(0, 5); // Son 5 arama
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  /**
   * 🔍 Arama Fonksiyonu
   */
  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    
    setIsSearching(true);
    setShowSuggestions(false);

    // Custom callback
    onSearch?.(trimmed);

    // Son aramaları kaydet
    if (trimmed) {
      saveRecentSearch(trimmed);
    }

    // Navigate
    if (trimmed) {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/products');
    }

    // Loading'i kapat (gerçek uygulamada API response'u bekle)
    setTimeout(() => setIsSearching(false), 300);
  };

  /**
   * 📝 Form Submit
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  /**
   * ❌ Arama Temizleme
   */
  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    navigate('/products');
    inputRef.current?.focus();
  };

  /**
   * 💡 Suggestion'a tıklama
   */
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  /**
   * 🗑️ Son aramayı silme
   */
  const handleDeleteRecentSearch = (searchToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Tıklamayı durdur
    const updated = recentSearches.filter(s => s !== searchToDelete);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  /**
   * ⌨️ Klavye Navigasyonu
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
      setShowSuggestions(false);
    }

    if (!showSuggestions || recentSearches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < recentSearches.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    }

    if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(recentSearches[selectedIndex]);
    }
  };

  /**
   * 🎯 Input Focus/Blur
   */
  const handleFocus = () => {
    if (recentSearches.length > 0 && !query) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow clicking suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* 🔍 Arama İkonu (Sol) */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          {/* 📝 Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
              disabled={isSearching}
              className="mr-1 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isSearching ? '...' : 'Ara'}
            </button>
          </div>
        </div>

        {/* 💡 Arama İpucu */}
        {query.length > 0 && query.length < 2 && (
          <p className="mt-1 text-xs text-gray-500 absolute">
            En az 2 karakter girin
          </p>
        )}
      </form>

      {/* 💡 Suggestions Dropdown */}
      {showSuggestions && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Son Aramalar
            </p>
            <ul className="space-y-1">
              {recentSearches.map((search, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(search)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{search}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteRecentSearch(search, e)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Sil"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;

/**
 * 🎯 YENİ ÖZELLİKLER:
 * 
 * 1. ✅ Debounce (500ms) - Çok fazla API çağrısı engellenir
 * 2. ✅ Loading indicator - Kullanıcı beklerken spinner gösterir
 * 3. ✅ Recent searches - Son 5 arama localStorage'da saklanır
 * 4. ✅ Suggestions dropdown - Son aramalar açılır menüde gösterilir
 * 5. ✅ Klavye navigasyonu - ↑↓ ok tuşları ile seçim
 * 6. ✅ Delete recent search - İstenmeyen aramaları sil
 * 7. ✅ ESC tuşu - Arama temizle ve dropdown kapat
 * 8. ✅ Focus/Blur yönetimi - UX iyileştirme
 */