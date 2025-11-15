// frontend/src/features/products/hooks/useProducts.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  setFilters,
  applyFilters,
  clearFilters,
  setPage,
  setSort,
  clearError,
  clearSelectedProduct,
} from '../store/productsSlice';
import {
  fetchProducts,
  fetchProductById,
  fetchProductBySlug,
  fetchFeaturedProducts,
  fetchRelatedProducts,
} from '../store/productsThunks';
import type { ProductFilters, ProductSortOption } from '../types/product.types';

/**
 * 🎯 USE PRODUCTS HOOK (Debug Ekli)
 * 
 * Değişiklikler:
 * 1. ✅ Console log'lar eklendi
 * 2. ✅ Error handling iyileştirildi
 */
export const useProducts = () => {
  const dispatch = useAppDispatch();

  // Redux state'inden products verilerini al
  const {
    items,
    selectedProduct,
    filters,
    activeFilters,
    pagination,
    loading,
    loadingProduct,
    error,
    productError,
    featuredProducts,
    relatedProducts,
  } = useAppSelector((state) => state.products);

  /**
   * 📋 LOAD PRODUCTS - Ürünleri Yükle
   * 
   * ✅ FİX: Console log eklendi
   */
  const loadProducts = useCallback(
    async (customFilters?: ProductFilters) => {
      const filtersToUse = customFilters || activeFilters;
      
      console.log('📋 Loading products with filters:', filtersToUse);
      
      try {
        const result = await dispatch(fetchProducts(filtersToUse));
        
        if (fetchProducts.fulfilled.match(result)) {
          console.log('✅ Products loaded:', result.payload.products.length, 'items');
          return { success: true, data: result.payload };
        } else {
          console.error('❌ Products loading failed:', result.payload);
          return { success: false, error: result.payload as string };
        }
      } catch (error) {
        console.error('❌ Products loading exception:', error);
        return { success: false, error: 'Beklenmeyen bir hata oluştu' };
      }
    },
    [dispatch, activeFilters]
  );

  /**
   * 🔍 LOAD PRODUCT - Tek Ürün Yükle (ID ile)
   */
  const loadProduct = useCallback(
    async (productId: string) => {
      const result = await dispatch(fetchProductById(productId));
      return fetchProductById.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
    },
    [dispatch]
  );

  /**
   * 🔗 LOAD PRODUCT BY SLUG - Tek Ürün Yükle (Slug ile)
   */
  const loadProductBySlug = useCallback(
    async (slug: string) => {
      const result = await dispatch(fetchProductBySlug(slug));
      return fetchProductBySlug.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
    },
    [dispatch]
  );

  /**
   * ⭐ LOAD FEATURED - Öne Çıkan Ürünler Yükle
   */
  const loadFeatured = useCallback(
    async (limit: number = 10) => {
      const result = await dispatch(fetchFeaturedProducts(limit));
      return fetchFeaturedProducts.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
    },
    [dispatch]
  );

  /**
   * 🔗 LOAD RELATED - İlgili Ürünler Yükle
   */
  const loadRelated = useCallback(
    async (productId: string, limit: number = 6) => {
      const result = await dispatch(fetchRelatedProducts({ productId, limit }));
      return fetchRelatedProducts.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
    },
    [dispatch]
  );

  /**
   * 🔍 UPDATE FILTERS - Filtreleri Güncelle
   */
  const updateFilters = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      console.log('🔍 Updating Redux filters:', newFilters);
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  /**
   * 🔄 APPLY FILTERS - Filtreleri Uygula ve Ürünleri Getir
   */
  const apply = useCallback(async () => {
    console.log('🔄 Applying filters and loading products');
    dispatch(applyFilters());
    return loadProducts(filters);
  }, [dispatch, filters, loadProducts]);

  /**
   * ❌ RESET FILTERS - Filtreleri Sıfırla
   */
  const reset = useCallback(() => {
    console.log('❌ Resetting filters');
    dispatch(clearFilters());
    loadProducts({
      page: 1,
      limit: 20,
      sort: 'newest',
    });
  }, [dispatch, loadProducts]);

  /**
   * 📄 CHANGE PAGE - Sayfa Değiştir
   */
  const changePage = useCallback(
    async (page: number) => {
      console.log('📄 Changing page to:', page);
      dispatch(setPage(page));
      return loadProducts({ ...activeFilters, page });
    },
    [dispatch, activeFilters, loadProducts]
  );

  /**
   * 📊 CHANGE SORT - Sıralama Değiştir
   */
  const changeSort = useCallback(
    async (sort: ProductSortOption) => {
      console.log('📊 Changing sort to:', sort);
      dispatch(setSort(sort));
      return loadProducts({ ...activeFilters, sort, page: 1 });
    },
    [dispatch, activeFilters, loadProducts]
  );

  /**
   * ❌ CLEAR ERROR - Hataları Temizle
   */
  const clear = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * 🗑️ CLEAR PRODUCT - Seçili Ürünü Temizle
   */
  const clearProduct = useCallback(() => {
    dispatch(clearSelectedProduct());
  }, [dispatch]);

  // Hook'tan döndürülecek değerler
  return {
    // State
    products: items,
    selectedProduct,
    filters,
    activeFilters,
    pagination,
    loading,
    loadingProduct,
    error,
    productError,
    featuredProducts,
    relatedProducts,

    // Computed values
    hasProducts: items.length > 0,
    totalProducts: pagination.total,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,

    // Functions
    loadProducts,
    loadProduct,
    loadProductBySlug,
    loadFeatured,
    loadRelated,
    updateFilters,
    applyFilters: apply,
    resetFilters: reset,
    changePage,
    changeSort,
    clearError: clear,
    clearProduct,
  };
};

/**
 * 💡 DEBUG TİPLERİ:
 * 
 * Console'da şunları göreceksin:
 * 
 * 📋 Loading products with filters: { page: 1, limit: 20, search: "iPhone" }
 * ✅ Products loaded: 15 items
 * 
 * Veya hata varsa:
 * ❌ Products loading failed: "Network error"
 */