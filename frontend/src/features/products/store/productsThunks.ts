// frontend/src/features/products/store/productsThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../../shared/services/api/client';
import { PRODUCT_ENDPOINTS } from '../../../shared/services/api/endpoints';
import type {
  Product,
  ProductFilters,
  FetchProductsResponse,
  FetchProductResponse,
} from '../types/product.types';

/**
 * 📋 FETCH PRODUCTS - Ürün Listesi Getir
 * 
 * Filtreleme, sıralama ve sayfalama ile ürünleri getirir.
 * 
 * @param filters - Filtre parametreleri
 * @returns { products, pagination }
 */
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters: ProductFilters, { rejectWithValue }) => {
    try {
      // API çağrısı yap
      const { data } = await apiClient.get<FetchProductsResponse>(
        PRODUCT_ENDPOINTS.LIST,
        {
          params: {
            // Filtreler
            search: filters.search,
            category: filters.category,
            subcategory: filters.subcategory,
            brand: filters.brand,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            inStock: filters.inStock,
            isFeatured: filters.isFeatured,
            status: filters.status,
            tags: filters.tags?.join(','), // Array -> string
            
            // Sıralama & Sayfalama
            sort: filters.sort || 'newest',
            page: filters.page || 1,
            limit: filters.limit || 20,
          },
        }
      );

      return data.data; // { products, pagination }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Ürünler yüklenirken hata oluştu';
      return rejectWithValue(message);
    }
  }
);

/**
 * 🔍 FETCH PRODUCT BY ID - ID ile Ürün Getir
 * 
 * Tek bir ürünün detayını getirir.
 * 
 * @param productId - Ürün ID
 * @returns Product
 */
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<FetchProductResponse>(
        PRODUCT_ENDPOINTS.DETAIL(productId)
      );

      return data.data; // Product
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Ürün yüklenirken hata oluştu';
      return rejectWithValue(message);
    }
  }
);

/**
 * 🔗 FETCH PRODUCT BY SLUG - Slug ile Ürün Getir
 * 
 * SEO-friendly URL'ler için slug kullanılır.
 * Örnek: /products/iphone-15-pro
 * 
 * @param slug - Ürün slug'ı
 * @returns Product
 */
export const fetchProductBySlug = createAsyncThunk(
  'products/fetchProductBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<FetchProductResponse>(
        PRODUCT_ENDPOINTS.BY_SLUG(slug)
      );

      return data.data; // Product
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Ürün bulunamadı';
      return rejectWithValue(message);
    }
  }
);

/**
 * ⭐ FETCH FEATURED PRODUCTS - Öne Çıkan Ürünler
 * 
 * Ana sayfada gösterilecek öne çıkan ürünler.
 * 
 * @param limit - Kaç ürün getirileceği (varsayılan: 10)
 * @returns Product[]
 */
export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<FetchProductsResponse>(
        PRODUCT_ENDPOINTS.FEATURED,
        {
          params: { limit },
        }
      );

      return data.data.products; // Product[]
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Öne çıkan ürünler yüklenemedi';
      return rejectWithValue(message);
    }
  }
);

/**
 * 🔗 FETCH RELATED PRODUCTS - İlgili Ürünler
 * 
 * Ürün detay sayfasında gösterilecek ilgili ürünler.
 * Aynı kategorideki diğer ürünler.
 * 
 * @param productId - Ürün ID
 * @param limit - Kaç ürün getirileceği (varsayılan: 6)
 * @returns Product[]
 */
export const fetchRelatedProducts = createAsyncThunk(
  'products/fetchRelatedProducts',
  async ({ productId, limit = 6 }: { productId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<FetchProductsResponse>(
        PRODUCT_ENDPOINTS.RELATED(productId),
        {
          params: { limit },
        }
      );

      return data.data.products; // Product[]
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'İlgili ürünler yüklenemedi';
      return rejectWithValue(message);
    }
  }
);

/**
 * 🔎 SEARCH PRODUCTS - Ürün Ara
 * 
 * Ürün arama (fetchProducts ile aynı ama sadece search param)
 * 
 * @param query - Arama sorgusu
 * @returns { products, pagination }
 */
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<FetchProductsResponse>(
        PRODUCT_ENDPOINTS.LIST,
        {
          params: {
            search: query,
            page: 1,
            limit: 20,
          },
        }
      );

      return data.data; // { products, pagination }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Arama yapılırken hata oluştu';
      return rejectWithValue(message);
    }
  }
);

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // ProductsPage içinde:
 * import { useAppDispatch } from '@/app/hooks';
 * import { fetchProducts } from '@/features/products/store/productsThunks';
 * 
 * const ProductsPage = () => {
 *   const dispatch = useAppDispatch();
 *   const { filters } = useAppSelector(state => state.products);
 *   
 *   useEffect(() => {
 *     dispatch(fetchProducts(filters));
 *   }, [dispatch, filters]);
 * };
 * 
 * // ProductDetailPage içinde:
 * import { fetchProductBySlug, fetchRelatedProducts } from './productsThunks';
 * 
 * const ProductDetailPage = () => {
 *   const { slug } = useParams();
 *   const dispatch = useAppDispatch();
 *   
 *   useEffect(() => {
 *     if (slug) {
 *       dispatch(fetchProductBySlug(slug)).then((result) => {
 *         if (fetchProductBySlug.fulfilled.match(result)) {
 *           // İlgili ürünleri getir
 *           dispatch(fetchRelatedProducts({ 
 *             productId: result.payload._id 
 *           }));
 *         }
 *       });
 *     }
 *   }, [slug, dispatch]);
 * };
 * 
 * // HomePage içinde:
 * import { fetchFeaturedProducts } from './productsThunks';
 * 
 * const HomePage = () => {
 *   const dispatch = useAppDispatch();
 *   
 *   useEffect(() => {
 *     dispatch(fetchFeaturedProducts(10));
 *   }, [dispatch]);
 * };
 */

/**
 * 💡 PRO TIP: Optimistic Updates
 * 
 * Kullanıcı deneyimini iyileştirmek için optimistic update yapabilirsin:
 * 
 * // Sepete ekle (hemen UI'ı güncelle)
 * dispatch(addToCartOptimistic(product));
 * 
 * // API'ye gönder (arka planda)
 * try {
 *   await apiClient.post('/cart', { productId });
 * } catch (error) {
 *   // Hata olursa geri al
 *   dispatch(removeFromCart(product._id));
 *   toast.error('Ürün eklenemedi');
 * }
 */

/**
 * 🔥 BEST PRACTICE: Debounce Search
 * 
 * Arama için debounce kullan (her tuş vuruşunda API çağırma):
 * 
 * import { debounce } from 'lodash';
 * 
 * const debouncedSearch = debounce((query: string) => {
 *   dispatch(searchProducts(query));
 * }, 500); // 500ms bekle
 * 
 * const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   debouncedSearch(e.target.value);
 * };
 */

/**
 * 📊 CACHE STRATEGY
 * 
 * Aynı ürünü tekrar getirmemek için cache kullan:
 * 
 * export const fetchProductByIdCached = createAsyncThunk(
 *   'products/fetchProductByIdCached',
 *   async (productId: string, { getState, rejectWithValue }) => {
 *     const state = getState() as RootState;
 *     
 *     // Cache'de var mı kontrol et
 *     const cached = state.products.items.find(p => p._id === productId);
 *     if (cached) {
 *       return cached; // Cache'den dön
 *     }
 *     
 *     // Yoksa API'den getir
 *     // ...
 *   }
 * );
 */