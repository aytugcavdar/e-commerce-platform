// frontend/src/features/products/types/product.types.ts

/**
 * 🎓 ÖĞREN: Product Type System
 * 
 * E-ticaret'te ürün veri yapısı çok önemli!
 * Backend'den gelen data ile frontend state'i aynı olmalı.
 */

/**
 * 🖼️ PRODUCT IMAGE - Ürün Resmi
 */
export interface ProductImage {
  _id?: string;
  url: string;                // Cloudinary URL
  public_id: string;          // Cloudinary ID (silmek için)
  isMain: boolean;            // Ana resim mi?
}

/**
 * 📦 PRODUCT - Ana Ürün Yapısı
 */
export interface Product {
  _id: string;
  name: string;
  slug: string;               // URL için (iphone-15-pro)
  description: string;
  price: number;              // Normal fiyat
  discountPrice?: number;     // İndirimli fiyat (varsa)
  
  // İlişkiler
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  brand: {
    _id: string;
    name: string;
    slug: string;
    logo?: {
      url: string;
    };
  };
  
  // Medya
  images: ProductImage[];
  
  // Envanter
  stock: number;              // Stok adedi
  
  // Özellikler
  specifications?: Record<string, string>; // { "Ekran": "6.1 inch", "RAM": "8GB" }
  tags?: string[];            // ["iphone", "apple", "smartphone"]
  
  // Kargo
  shipping?: {
    weight?: number;          // kg
    dimensions?: {
      length?: number;        // cm
      width?: number;
      height?: number;
    };
    freeShipping?: boolean;
    shippingCost?: number;
  };
  
  // SEO
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  };
  
  // Durum
  status: 'active' | 'inactive' | 'out-of-stock' | 'discontinued';
  isFeatured: boolean;        // Öne çıkan ürün mü?
  
  // Virtual Fields (Backend'den hesaplanır)
  finalPrice?: number;        // discountPrice || price
  discountPercentage?: number; // İndirim yüzdesi
  isInStock?: boolean;        // stock > 0
  
  // Tarihler
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 🔍 PRODUCT FILTERS - Ürün Filtreleme
 */
export interface ProductFilters {
  // Arama
  search?: string;            // Ürün adı, açıklama
  
  // Kategori
  category?: string;          // Kategori ID
  subcategory?: string;       // Alt kategori ID
  brand?: string;             // Marka ID
  
  // Fiyat Aralığı
  minPrice?: number;
  maxPrice?: number;
  
  // Stok
  inStock?: boolean;          // Sadece stokta olanlar
  
  // Özellikler
  isFeatured?: boolean;       // Sadece öne çıkanlar
  status?: string;            // active, inactive vb.
  tags?: string[];            // Tag'lere göre filtrele
  
  // Sıralama
  sort?: ProductSortOption;
  
  // Sayfalama
  page?: number;
  limit?: number;
}

/**
 * 📊 PRODUCT SORT OPTIONS - Sıralama Seçenekleri
 */
export type ProductSortOption = 
  | 'newest'           // En yeni (createdAt: -1)
  | 'oldest'           // En eski (createdAt: 1)
  | 'price-asc'        // Fiyat: Düşükten yükseğe (price: 1)
  | 'price-desc'       // Fiyat: Yüksekten düşüğe (price: -1)
  | 'name-asc'         // İsim: A-Z (name: 1)
  | 'name-desc'        // İsim: Z-A (name: -1)
  | 'popular';         // En popüler (salesCount: -1)

/**
 * 📄 PAGINATION INFO - Sayfalama Bilgisi
 */
export interface PaginationInfo {
  total: number;              // Toplam ürün sayısı
  page: number;               // Mevcut sayfa
  limit: number;              // Sayfa başına ürün
  totalPages: number;         // Toplam sayfa sayısı
  hasNextPage: boolean;       // Sonraki sayfa var mı?
  hasPrevPage: boolean;       // Önceki sayfa var mı?
}

/**
 * 🗂️ PRODUCTS STATE - Redux State Yapısı
 */
export interface ProductsState {
  // Ürün Listesi
  items: Product[];           // Mevcut sayfalardaki ürünler
  
  // Seçili Ürün (Detay sayfası için)
  selectedProduct: Product | null;
  
  // Filtreleme
  filters: ProductFilters;
  activeFilters: ProductFilters; // Aktif filtreler (uygulanmış)
  
  // Sayfalama
  pagination: PaginationInfo;
  
  // Loading States
  loading: boolean;           // Genel loading
  loadingProduct: boolean;    // Tek ürün loading
  
  // Error States
  error: string | null;
  productError: string | null;
  
  // Cache (Performans için)
  featuredProducts: Product[]; // Öne çıkan ürünler (cache)
  relatedProducts: Product[];  // İlgili ürünler (cache)
}

/**
 * 📥 FETCH PRODUCTS RESPONSE - API Cevabı
 */
export interface FetchProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: PaginationInfo;
  };
  message?: string;
}

/**
 * 📥 FETCH PRODUCT RESPONSE - Tek Ürün API Cevabı
 */
export interface FetchProductResponse {
  success: boolean;
  data: Product;
  message?: string;
}



/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // Component'te
 * const product: Product = useAppSelector(state => state.products.selectedProduct);
 * 
 * // Filtreleme
 * const filters: ProductFilters = {
 *   category: '507f1f77bcf86cd799439011',
 *   minPrice: 1000,
 *   maxPrice: 5000,
 *   inStock: true,
 *   sort: 'price-asc',
 *   page: 1,
 *   limit: 20
 * };
 * 
 * // Thunk'ta
 * const response = await apiClient.get<FetchProductsResponse>('/products', {
 *   params: filters
 * });
 */

/**
 * 💡 PRO TIP: Optional Chaining
 * 
 * Backend'den gelen data'da bazı alanlar olmayabilir.
 * Optional chaining kullan:
 * 
 * ✅ DOĞRU:
 * const categoryName = product.category?.name || 'Kategori Yok';
 * const discount = product.discountPrice ?? product.price;
 * 
 * ❌ YANLIŞ:
 * const categoryName = product.category.name; // Crash!
 */

/**
 * 🔥 BEST PRACTICE: Normalization
 * 
 * Çok sayıda ürün varsa normalize et:
 * 
 * interface NormalizedProductsState {
 *   byId: Record<string, Product>;    // { "id1": {...}, "id2": {...} }
 *   allIds: string[];                  // ["id1", "id2", "id3"]
 * }
 * 
 * Avantajları:
 * - O(1) lookup (ID ile ürün bul)
 * - Tekrar eden data yok
 * - Update performansı yüksek
 * 
 * Örnek:
 * const product = state.products.byId[productId]; // Çok hızlı!
 */

/**
 * 📝 SPECIFICATION TYPES
 * 
 * Ürün özelliklerini tip güvenli yapmak için:
 * 
 * type PhoneSpecs = {
 *   "Ekran Boyutu": string;
 *   "RAM": string;
 *   "Depolama": string;
 *   "Kamera": string;
 * };
 * 
 * type LaptopSpecs = {
 *   "İşlemci": string;
 *   "RAM": string;
 *   "Ekran Kartı": string;
 * };
 * 
 * Kategori bazlı specifications!
 */