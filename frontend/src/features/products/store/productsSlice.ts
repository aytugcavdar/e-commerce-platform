// frontend/src/features/products/store/productsSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ProductsState, Product, ProductFilters, PaginationInfo } from '../types/product.types';
import {
  fetchProducts,
  fetchProductById,
  fetchProductBySlug,
  fetchFeaturedProducts,
  fetchRelatedProducts,
} from './productsThunks';

/**
 * 🏁 INITIAL STATE
 */
const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  filters: {
    page: 1,
    limit: 20,
    sort: 'newest',
  },
  activeFilters: {
    page: 1,
    limit: 20,
    sort: 'newest',
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  loading: false,
  loadingProduct: false,
  error: null,
  productError: null,
  featuredProducts: [],
  relatedProducts: [],
};

/**
 * 🎯 PRODUCTS SLICE
 */
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    /**
     * 🔍 SET FILTERS - Filtreleri Ayarla
     * 
     * Kullanıcı filtreleri değiştirdiğinde çağrılır.
     * Henüz API'ye gönderilmez, sadece state'te tutulur.
     */
    setFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    /**
     * 🔄 APPLY FILTERS - Filtreleri Uygula
     * 
     * "Filtrele" butonuna basıldığında çağrılır.
     * filters -> activeFilters'a kopyalanır.
     */
    applyFilters: (state) => {
      state.activeFilters = { ...state.filters };
      // Sayfa 1'e dön (yeni filtre = yeni arama)
      state.activeFilters.page = 1;
    },

    /**
     * ❌ CLEAR FILTERS - Filtreleri Temizle
     */
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 20,
        sort: 'newest',
      };
      state.activeFilters = { ...state.filters };
    },

    /**
     * 📄 SET PAGE - Sayfa Değiştir
     */
    setPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
      state.activeFilters.page = action.payload;
    },

    /**
     * 📊 SET SORT - Sıralama Değiştir
     */
    setSort: (state, action: PayloadAction<ProductFilters['sort']>) => {
      state.filters.sort = action.payload;
      state.activeFilters.sort = action.payload;
    },

    /**
     * ❌ CLEAR ERROR - Hata Temizle
     */
    clearError: (state) => {
      state.error = null;
      state.productError = null;
    },

    /**
     * 🗑️ CLEAR SELECTED PRODUCT - Seçili Ürünü Temizle
     */
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
      state.productError = null;
    },
  },

  /**
   * 🔄 EXTRA REDUCERS - Async Thunks
   */
  extraReducers: (builder) => {
    /**
     * 📋 FETCH PRODUCTS - Ürün Listesi
     */
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Ürünler yüklenirken hata oluştu';
      });

    /**
     * 🔍 FETCH PRODUCT BY ID - ID ile Ürün Getir
     */
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.loadingProduct = true;
        state.productError = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loadingProduct = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loadingProduct = false;
        state.productError = action.payload as string || 'Ürün yüklenirken hata oluştu';
      });

    /**
     * 🔗 FETCH PRODUCT BY SLUG - Slug ile Ürün Getir
     */
    builder
      .addCase(fetchProductBySlug.pending, (state) => {
        state.loadingProduct = true;
        state.productError = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.loadingProduct = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.loadingProduct = false;
        state.productError = action.payload as string || 'Ürün bulunamadı';
      });

    /**
     * ⭐ FETCH FEATURED PRODUCTS - Öne Çıkan Ürünler
     */
    builder
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredProducts = action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Öne çıkan ürünler yüklenemedi';
      });

    /**
     * 🔗 FETCH RELATED PRODUCTS - İlgili Ürünler
     */
    builder
      .addCase(fetchRelatedProducts.pending, (state) => {
        // Loading gösterme (background'da yüklensin)
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.relatedProducts = action.payload;
      })
      .addCase(fetchRelatedProducts.rejected, (state) => {
        // Hata gösterme (critical değil)
        state.relatedProducts = [];
      });
  },
});

/**
 * 📤 EXPORT ACTIONS
 */
export const {
  setFilters,
  applyFilters,
  clearFilters,
  setPage,
  setSort,
  clearError,
  clearSelectedProduct,
} = productsSlice.actions;

/**
 * 📤 EXPORT REDUCER
 */
export default productsSlice.reducer;

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * // Component içinde:
 * import { useAppDispatch, useAppSelector } from '@/app/hooks';
 * import { setFilters, applyFilters } from '@/features/products/store/productsSlice';
 * 
 * const ProductsPage = () => {
 *   const dispatch = useAppDispatch();
 *   const { items, loading, filters } = useAppSelector(state => state.products);
 *   
 *   // Kategori filtresi değiştir
 *   const handleCategoryChange = (categoryId: string) => {
 *     dispatch(setFilters({ category: categoryId }));
 *   };
 *   
 *   // Filtreleri uygula
 *   const handleApplyFilters = () => {
 *     dispatch(applyFilters());
 *     dispatch(fetchProducts(filters)); // Thunk'ı çağır
 *   };
 *   
 *   return (
 *     <div>
 *       <CategoryFilter onChange={handleCategoryChange} />
 *       <button onClick={handleApplyFilters}>Filtrele</button>
 *       {loading ? <Loading /> : <ProductList products={items} />}
 *     </div>
 *   );
 * };
 */

/**
 * 💡 PRO TIP: Selector Pattern
 * 
 * Sık kullanılan selector'ları ayrı dosyada tut:
 * 
 * // productsSelectors.ts
 * export const selectProducts = (state: RootState) => state.products.items;
 * export const selectLoading = (state: RootState) => state.products.loading;
 * export const selectFilters = (state: RootState) => state.products.filters;
 * 
 * // Component'te
 * const products = useAppSelector(selectProducts);
 */

/**
 * 🔥 BEST PRACTICE: Normalized State
 * 
 * Redux Toolkit'in createEntityAdapter kullan:
 * 
 * import { createEntityAdapter } from '@reduxjs/toolkit';
 * 
 * const productsAdapter = createEntityAdapter<Product>({
 *   selectId: (product) => product._id,
 *   sortComparer: (a, b) => a.name.localeCompare(b.name),
 * });
 * 
 * const initialState = productsAdapter.getInitialState({
 *   loading: false,
 *   error: null,
 * });
 * 
 * // Otomatik CRUD metodları:
 * productsAdapter.addOne(state, product);
 * productsAdapter.addMany(state, products);
 * productsAdapter.updateOne(state, { id, changes });
 * productsAdapter.removeOne(state, id);
 * 
 * Çok hızlı ve kolay!
 */