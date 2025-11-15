// frontend/src/features/products/hooks/useProductFilters.ts

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductFilters, ProductSortOption } from '../types/product.types';

/**
 * 🎓 ÖĞREN: useProductFilters Hook (Düzeltilmiş)
 * 
 * Bu hook, ürün filtreleme işlemlerini yönetir ve URL ile senkronize eder.
 * 
 * Düzeltmeler:
 * 1. ✅ updateFilter fonksiyonu sayfa değişikliğinde page'i 1'e sıfırlamıyor
 * 2. ✅ URL güncelleme daha hassas
 * 3. ✅ Console log'lar eklendi (debug için)
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
    console.log('📖 URL Filters parsed:', urlFilters);
    setFilters(urlFilters);
  }, [searchParams]);

  /**
   * 📝 Filtreleri URL'e Yaz
   * 
   * Filters state'i değiştiğinde URL'i güncelle
   */
  useEffect(() => {
    const params = buildURLParams(filters);
    console.log('📝 Updating URL with filters:', filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  /**
   * 🔄 Tek Bir Filtreyi Güncelle
   * 
   * ✅ FİX: Pagination için page değişikliğinde sayfa 1'e sıfırlamıyoruz
   */
  const updateFilter = useCallback((key: keyof ProductFilters, value: any) => {
    console.log(`🔄 Updating filter: ${key} = ${value}`);
    
    setFilters(prev => {
      // Özel durum: page değişikliği
      if (key === 'page') {
        return {
          ...prev,
          page: value,
        };
      }
      
      // Diğer filtreler değişince sayfa 1'e dön
      return {
        ...prev,
        [key]: value,
        page: 1,
      };
    });
  }, []);

  /**
   * 🔄 Birden Fazla Filtreyi Güncelle
   */
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    console.log('🔄 Updating multiple filters:', newFilters);
    
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
    console.log('❌ Clearing all filters');
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * ❌ Tek Bir Filtreyi Temizle
   */
  const clearFilter = useCallback((key: keyof ProductFilters) => {
    console.log(`❌ Clearing filter: ${key}`);
    
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
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * const ProductsPage = () => {
 *   const { filters, updateFilter, clearFilters } = useProductFilters();
 *   
 *   // Kategori değiştir
 *   <select onChange={(e) => updateFilter('category', e.target.value)} />
 *   
 *   // Sayfa değiştir
 *   <button onClick={() => updateFilter('page', 2)}>Sayfa 2</button>
 *   
 *   // Filtreleri temizle
 *   <button onClick={clearFilters}>Temizle</button>
 * };
 */