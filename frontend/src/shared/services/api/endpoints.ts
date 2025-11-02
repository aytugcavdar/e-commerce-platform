// frontend/src/shared/services/api/endpoints.ts

/**
 * 🎓 ÖĞREN: API Endpoints Nedir?
 * 
 * Endpoint, API'nin bir kaynağa erişmek için kullanılan URL yoludur.
 * 
 * Örnek:
 * - GET  /api/products       -> Tüm ürünleri listele
 * - GET  /api/products/123   -> ID'si 123 olan ürünü getir
 * - POST /api/products       -> Yeni ürün ekle
 * - PUT  /api/products/123   -> ID'si 123 olan ürünü güncelle
 * - DELETE /api/products/123 -> ID'si 123 olan ürünü sil
 * 
 * ❓ NEDEN TEK DOSYADA TOPLUYORUZ?
 * 
 * ✅ Merkezi yönetim - Tüm URL'ler tek yerde
 * ✅ Değişiklik kolay - URL değişince tek yerden düzelt
 * ✅ Tip güvenliği - TypeScript ile otomatik tamamlama
 * ✅ Tekrar kullanılabilir - Her yerde aynı URL string'i yazma
 */

/**
 * 🔐 AUTH ENDPOINTS - Kimlik Doğrulama
 * 
 * Kullanıcı kayıt, giriş, çıkış, şifre sıfırlama vb.
 */
export const AUTH_ENDPOINTS = {
  // Kayıt
  REGISTER: '/auth/register',
  
  // Giriş
  LOGIN: '/auth/login',
  
  // Çıkış
  LOGOUT: '/auth/logout',
  
  // Token yenileme
  REFRESH_TOKEN: '/auth/refresh-token',
  
  // E-posta doğrulama
  VERIFY_EMAIL: '/auth/verify-email',
  
  // Doğrulama e-postasını yeniden gönder
  RESEND_VERIFICATION: '/auth/resend-verification-email',
  
  // Şifremi unuttum
  FORGOT_PASSWORD: '/auth/forgot-password',
  
  // Şifre sıfırlama
  RESET_PASSWORD: '/auth/reset-password',
  
  // Şifre değiştirme (giriş yapmışken)
  CHANGE_PASSWORD: '/auth/change-password',
} as const;

/**
 * 🛍️ PRODUCT ENDPOINTS - Ürün İşlemleri
 */
export const PRODUCT_ENDPOINTS = {
  // Tüm ürünler (filtreleme, sayfalama)
  LIST: '/products',
  
  // Ürün detayı (ID ile)
  DETAIL: (id: string) => `/products/${id}`,
  
  // Ürün detayı (slug ile)
  BY_SLUG: (slug: string) => `/products/slug/${slug}`,
  
  // Öne çıkan ürünler
  FEATURED: '/products/featured',
  
  // İlgili ürünler
  RELATED: (id: string) => `/products/${id}/related`,
  
  // Ürün arama
  SEARCH: '/products/search',
  
  // Admin: Ürün oluştur
  CREATE: '/products',
  
  // Admin: Ürün güncelle
  UPDATE: (id: string) => `/products/${id}`,
  
  // Admin: Ürün sil
  DELETE: (id: string) => `/products/${id}`,
  
  // Admin: Stok güncelle
  UPDATE_STOCK: (id: string) => `/products/${id}/stock`,
  
  // Admin: Resim sil
  DELETE_IMAGE: (productId: string, imageId: string) => 
    `/products/${productId}/images/${imageId}`,
  
  // Admin: Ana resmi ayarla
  SET_MAIN_IMAGE: (productId: string, imageId: string) => 
    `/products/${productId}/images/${imageId}/main`,
} as const;

/**
 * 📁 CATEGORY ENDPOINTS - Kategori İşlemleri
 */
export const CATEGORY_ENDPOINTS = {
  // Tüm kategoriler
  LIST: '/categories',
  
  // Kategori ağacı (hiyerarşik)
  TREE: '/categories/tree',
  
  // Kategori detayı (ID ile)
  DETAIL: (id: string) => `/categories/${id}`,
  
  // Kategori detayı (slug ile)
  BY_SLUG: (slug: string) => `/categories/slug/${slug}`,
  
  // Admin: Kategori oluştur
  CREATE: '/categories',
  
  // Admin: Kategori güncelle
  UPDATE: (id: string) => `/categories/${id}`,
  
  // Admin: Kategori sil
  DELETE: (id: string) => `/categories/${id}`,
  
  // Admin: Kategori sıralaması güncelle
  UPDATE_ORDER: '/categories/order',
} as const;

/**
 * 🏷️ BRAND ENDPOINTS - Marka İşlemleri
 */
export const BRAND_ENDPOINTS = {
  // Tüm markalar
  LIST: '/brands',
  
  // Marka detayı (ID ile)
  DETAIL: (id: string) => `/brands/${id}`,
  
  // Marka detayı (slug ile)
  BY_SLUG: (slug: string) => `/brands/slug/${slug}`,
  
  // Admin: Marka oluştur
  CREATE: '/brands',
  
  // Admin: Marka güncelle
  UPDATE: (id: string) => `/brands/${id}`,
  
  // Admin: Marka sil
  DELETE: (id: string) => `/brands/${id}`,
} as const;

/**
 * 🛒 CART ENDPOINTS - Sepet İşlemleri
 * 
 * Not: Sepet genellikle frontend'de (Redux) yönetilir.
 * Backend'e sadece checkout'ta gönderilir.
 */
export const CART_ENDPOINTS = {
  // Sepet öğelerini doğrula (stok kontrolü)
  VALIDATE: '/cart/validate',
  
  // Kupon kodu uygula
  APPLY_COUPON: '/cart/apply-coupon',
} as const;

/**
 * 📦 ORDER ENDPOINTS - Sipariş İşlemleri
 */
export const ORDER_ENDPOINTS = {
  // Kullanıcının siparişleri
  LIST: '/orders',
  
  // Sipariş detayı
  DETAIL: (id: string) => `/orders/${id}`,
  
  // Sipariş oluştur (checkout)
  CREATE: '/orders',
  
  // Sipariş iptal et
  CANCEL: (id: string) => `/orders/${id}/cancel`,
  
  // Admin: Tüm siparişler
  ADMIN_LIST: '/orders/admin/all',
  
  // Admin: Sipariş durumu güncelle
  ADMIN_UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
  
  // Admin: Sipariş istatistikleri
  ADMIN_STATS: '/orders/admin/stats',
} as const;

/**
 * 👤 USER ENDPOINTS - Kullanıcı İşlemleri
 */
export const USER_ENDPOINTS = {
  // Profil bilgisi
  PROFILE: '/users/profile',
  
  // Profil güncelle
  UPDATE_PROFILE: '/users/profile',
  
  // Avatar yükle
  UPDATE_AVATAR: '/users/avatar',
  
  // Adresler
  ADDRESSES: '/users/addresses',
  
  // Adres ekle
  ADD_ADDRESS: '/users/addresses',
  
  // Adres güncelle
  UPDATE_ADDRESS: (id: string) => `/users/addresses/${id}`,
  
  // Adres sil
  DELETE_ADDRESS: (id: string) => `/users/addresses/${id}`,
  
  // Varsayılan adres ayarla
  SET_DEFAULT_ADDRESS: (id: string) => `/users/addresses/${id}/default`,
  
  // Admin: Tüm kullanıcılar
  ADMIN_LIST: '/users/admin/all',
  
  // Admin: Kullanıcı detayı
  ADMIN_DETAIL: (id: string) => `/users/admin/${id}`,
  
  // Admin: Kullanıcı engelle/aktif et
  ADMIN_TOGGLE_BLOCK: (id: string) => `/users/admin/${id}/toggle-block`,
} as const;

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * import apiClient from './client';
 * import { PRODUCT_ENDPOINTS, ORDER_ENDPOINTS } from './endpoints';
 * 
 * // Ürünleri listele
 * const { data } = await apiClient.get(PRODUCT_ENDPOINTS.LIST, {
 *   params: { page: 1, limit: 20 }
 * });
 * 
 * // Ürün detayı
 * const productId = '123';
 * const { data } = await apiClient.get(PRODUCT_ENDPOINTS.DETAIL(productId));
 * 
 * // Sipariş oluştur
 * const { data } = await apiClient.post(ORDER_ENDPOINTS.CREATE, {
 *   items: [...],
 *   shippingAddress: {...}
 * });
 * 
 * // Sipariş iptal et
 * const orderId = '456';
 * const { data } = await apiClient.patch(ORDER_ENDPOINTS.CANCEL(orderId), {
 *   reason: 'Yanlış ürün'
 * });
 */

/**
 * 💡 PRO TIP: Generic API Service
 * 
 * Tekrar eden kod yazmamak için generic servis oluşturabilirsin:
 * 
 * class ApiService {
 *   static async get<T>(endpoint: string, params?: any): Promise<T> {
 *     const { data } = await apiClient.get(endpoint, { params });
 *     return data;
 *   }
 *   
 *   static async post<T>(endpoint: string, body: any): Promise<T> {
 *     const { data } = await apiClient.post(endpoint, body);
 *     return data;
 *   }
 *   
 *   // ... put, delete
 * }
 * 
 * // Kullanımı:
 * const products = await ApiService.get<Product[]>(PRODUCT_ENDPOINTS.LIST);
 */

/**
 * 🔥 BEST PRACTICE: Endpoint Fonksiyonları
 * 
 * Endpoint'leri fonksiyon olarak tanımla:
 * 
 * ✅ İYİ: DETAIL: (id: string) => `/products/${id}`
 * ❌ KÖTÜ: DETAIL: '/products/:id' (manuel replace gerekir)
 * 
 * Bu sayede:
 * - Type-safe (tip güvenli)
 * - IDE otomatik tamamlama
 * - Hata yapma şansı düşük
 */