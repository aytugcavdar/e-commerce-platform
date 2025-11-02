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
 * 🎯 USE PRODUCTS HOOK
 * 
 * Products feature için tüm işlemleri yöneten custom hook.
 * Component'lerde kullanımı kolaylaştırır.
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
   * Aktif filtrelerle ürünleri getirir.
   */
  const loadProducts = useCallback(
    async (customFilters?: ProductFilters) => {
      const filtersToUse = customFilters || activeFilters;
      const result = await dispatch(fetchProducts(filtersToUse));
      return fetchProducts.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
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
   * 
   * Kullanıcı filtreleri değiştirdiğinde çağrılır.
   */
  const updateFilters = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  /**
   * 🔄 APPLY FILTERS - Filtreleri Uygula ve Ürünleri Getir
   * 
   * "Filtrele" butonuna basıldığında çağrılır.
   */
  const apply = useCallback(async () => {
    dispatch(applyFilters());
    return loadProducts(filters);
  }, [dispatch, filters, loadProducts]);

  /**
   * ❌ RESET FILTERS - Filtreleri Sıfırla
   */
  const reset = useCallback(() => {
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
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * // ProductsPage içinde:
 * import { useProducts } from '@/features/products/hooks/useProducts';
 * 
 * const ProductsPage = () => {
 *   const {
 *     products,
 *     loading,
 *     filters,
 *     pagination,
 *     updateFilters,
 *     applyFilters,
 *     changePage,
 *   } = useProducts();
 *   
 *   // İlk yüklemede ürünleri getir
 *   useEffect(() => {
 *     applyFilters();
 *   }, []);
 *   
 *   // Kategori değiştir
 *   const handleCategoryChange = (categoryId: string) => {
 *     updateFilters({ category: categoryId });
 *   };
 *   
 *   // Filtreleri uygula
 *   const handleApply = () => {
 *     applyFilters();
 *   };
 *   
 *   // Sayfa değiştir
 *   const handlePageChange = (page: number) => {
 *     changePage(page);
 *   };
 *   
 *   return (
 *     <div>
 *       <Filters onChange={handleCategoryChange} />
 *       <button onClick={handleApply}>Filtrele</button>
 *       {loading ? <Loading /> : <ProductList products={products} />}
 *       <Pagination {...pagination} onChange={handlePageChange} />
 *     </div>
 *   );
 * };
 * 
 * // ProductDetailPage içinde:
 * const ProductDetailPage = () => {
 *   const { slug } = useParams();
 *   const {
 *     selectedProduct,
 *     loadingProduct,
 *     relatedProducts,
 *     loadProductBySlug,
 *     loadRelated,
 *   } = useProducts();
 *   
 *   useEffect(() => {
 *     if (slug) {
 *       loadProductBySlug(slug).then((result) => {
 *         if (result.success) {
 *           loadRelated(result.data._id);
 *         }
 *       });
 *     }
 *   }, [slug]);
 *   
 *   if (loadingProduct) return <Loading />;
 *   if (!selectedProduct) return <NotFound />;
 *   
 *   return (
 *     <div>
 *       <ProductDetail product={selectedProduct} />
 *       <RelatedProducts products={relatedProducts} />
 *     </div>
 *   );
 * };
 */

/**
 * 💡 PRO TIP: Custom Hooks Composition
 * 
 * Birden fazla hook birleştirilebilir:
 * 
 * const ProductsPageLogic = () => {
 *   const products = useProducts();
 *   const cart = useCart();
 *   const auth = useAuth();
 *   
 *   const handleAddToCart = (product: Product) => {
 *     if (!auth.isAuthenticated) {
 *       toast.error('Lütfen giriş yapın');
 *       return;
 *     }
 *     cart.addItem(product);
 *   };
 *   
 *   return { ...products, handleAddToCart };
 * };
 */