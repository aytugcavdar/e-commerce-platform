// frontend/src/features/products/hooks/useProductFilters.ts

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductFilters, ProductSortOption } from '../types/product.types';

/**
 * 🎓 ÖĞREN: useProductFilters Hook
 * 
 * Bu hook, ürün filtreleme işlemlerini yönetir ve URL ile senkronize eder.
 * 
 * Sorumlulukları:
 * 1. Filtreleri state'te tut
 * 2. URL parametrelerini oku ve filtrelerle senkronize et
 * 3. Filtre değişikliklerini URL'e yaz
 * 4. Filtre temizleme ve uygulama fonksiyonları sağla
 * 
 * Neden useProducts'tan ayrı?
 * - Separation of Concerns (Sorumlulukların ayrılması)
 * - useProducts API çağrıları yapar
 * - useProductFilters sadece filtre mantığını yönetir
 * - Daha test edilebilir ve yeniden kullanılabilir
 */

interface UseProductFiltersReturn {
  // State
  filters: ProductFilters;
  
  // Functions
  updateFilter: (key: keyof ProductFilters, value: any) => void;
  updateFilters: (newFilters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof ProductFilters) => void;
  
  // Computed
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

/**
 * 🏁 Default Filters - Başlangıç Değerleri
 */
const DEFAULT_FILTERS: ProductFilters = {
  page: 1,
  limit: 20,
  sort: 'newest',
};

/**
 * 🎯 USE PRODUCT FILTERS HOOK
 */
export const useProductFilters = (): UseProductFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>(() => 
    parseFiltersFromURL(searchParams)
  );

  /**
   * 📖 URL'den Filtreleri Oku
   * 
   * Component mount olduğunda veya URL değiştiğinde çalışır
   */
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(searchParams);
    setFilters(urlFilters);
  }, [searchParams]);

  /**
   * 📝 Filtreleri URL'e Yaz
   * 
   * Filters state'i değiştiğinde URL'i güncelle
   */
  useEffect(() => {
    const params = buildURLParams(filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  /**
   * 🔄 Tek Bir Filtreyi Güncelle
   */
  const updateFilter = useCallback((key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Filtre değişince sayfa 1'e dön
    }));
  }, []);

  /**
   * 🔄 Birden Fazla Filtreyi Güncelle
   */
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Filtre değişince sayfa 1'e dön
    }));
  }, []);

  /**
   * ❌ Tüm Filtreleri Temizle
   */
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * ❌ Tek Bir Filtreyi Temizle
   */
  const clearFilter = useCallback((key: keyof ProductFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return {
        ...DEFAULT_FILTERS,
        ...newFilters,
        page: 1, // Sayfa 1'e dön
      };
    });
  }, []);

  /**
   * 📊 Computed Values
   */
  const hasActiveFilters = Object.keys(filters).some(
    key => !['page', 'limit', 'sort'].includes(key) && filters[key as keyof ProductFilters]
  );

  const activeFilterCount = Object.keys(filters).filter(
    key => !['page', 'limit', 'sort'].includes(key) && filters[key as keyof ProductFilters]
  ).length;

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
  };
};

/**
 * 🔧 Helper: URL'den Filtreleri Parse Et
 */
function parseFiltersFromURL(searchParams: URLSearchParams): ProductFilters {
  const filters: ProductFilters = { ...DEFAULT_FILTERS };

  // String parametreler
  const stringParams: (keyof ProductFilters)[] = [
    'search',
    'category',
    'subcategory',
    'brand',
    'status',
  ];
  stringParams.forEach(key => {
    const value = searchParams.get(key);
    if (value) filters[key] = value as any;
  });

  // Number parametreler
  const numberParams: (keyof ProductFilters)[] = [
    'page',
    'limit',
    'minPrice',
    'maxPrice',
  ];
  numberParams.forEach(key => {
    const value = searchParams.get(key);
    if (value) {
      const num = parseFloat(value);
      if (!isNaN(num)) filters[key] = num as any;
    }
  });

  // Boolean parametreler
  const booleanParams: (keyof ProductFilters)[] = ['inStock', 'isFeatured'];
  booleanParams.forEach(key => {
    const value = searchParams.get(key);
    if (value === 'true') filters[key] = true as any;
  });

  // Sort
  const sort = searchParams.get('sort');
  if (sort) filters.sort = sort as ProductSortOption;

  // Tags (Array)
  const tags = searchParams.get('tags');
  if (tags) filters.tags = tags.split(',');

  return filters;
}

/**
 * 🔧 Helper: Filtreleri URL Parametrelerine Çevir
 */
function buildURLParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'page' && value === 1) return; // Sayfa 1'i yazma
    if (key === 'limit' && value === 20) return; // Default limit'i yazma
    if (key === 'sort' && value === 'newest') return; // Default sort'u yazma

    if (Array.isArray(value)) {
      // Array değerler (tags)
      params.set(key, value.join(','));
    } else {
      // Diğer değerler
      params.set(key, String(value));
    }
  });

  return params;
}

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // 1. Basit Kullanım
 * const ProductFiltersComponent = () => {
 *   const { filters, updateFilter, clearFilters } = useProductFilters();
 *   
 *   return (
 *     <div>
 *       <input
 *         value={filters.search || ''}
 *         onChange={(e) => updateFilter('search', e.target.value)}
 *       />
 *       <button onClick={clearFilters}>Temizle</button>
 *     </div>
 *   );
 * };
 * 
 * // 2. Birden Fazla Filtre
 * const handlePriceChange = () => {
 *   updateFilters({
 *     minPrice: 100,
 *     maxPrice: 500,
 *   });
 * };
 * 
 * // 3. Aktif Filtre Göstergesi
 * const FilterBadge = () => {
 *   const { activeFilterCount, hasActiveFilters } = useProductFilters();
 *   
 *   if (!hasActiveFilters) return null;
 *   
 *   return <span>{activeFilterCount} filtre aktif</span>;
 * };
 * 
 * // 4. useProducts ile Birlikte Kullanım
 * const ProductsPage = () => {
 *   const { filters } = useProductFilters();
 *   const { loadProducts, loading } = useProducts();
 *   
 *   useEffect(() => {
 *     loadProducts(filters);
 *   }, [filters, loadProducts]);
 *   
 *   // ...
 * };
 */

/**
 * 💡 PRO TIP: URL Senkronizasyonu
 * 
 * Bu hook sayesinde:
 * - Kullanıcı filtreleri değiştirince URL güncellenir
 * - Kullanıcı back/forward tuşuna basınca filtreler değişir
 * - URL paylaşılabilir (deep linking)
 * - Sayfa yenilenince filtreler kaybolmaz
 * 
 * Örnek URL:
 * /products?category=electronics&minPrice=1000&maxPrice=5000&sort=price-asc
 */

/**
 * 🔥 BEST PRACTICE: Debouncing
 * 
 * Search input için debounce ekleyebilirsin:
 * 
 * import { useDebounce } from '@/shared/hooks/ui/useDebounce';
 * 
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearch = useDebounce(searchQuery, 500);
 * 
 * useEffect(() => {
 *   updateFilter('search', debouncedSearch);
 * }, [debouncedSearch]);
 * 
 * Bu sayede her tuş vuruşunda API çağrısı yapılmaz!
 */