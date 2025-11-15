// frontend/src/features/products/components/ProductFilters.tsx

import { useProductFilters } from '../hooks/useProductFilters'; // ✅ DOĞRU HOOK
import { Select, Button, Input } from '@/shared/components/ui/base';

/**
 * 🎓 ÖĞREN: ProductFilters (Düzeltilmiş Versiyon)
 * 
 * Değişiklikler:
 * 1. useProducts yerine useProductFilters kullanıyor
 * 2. Filtreler direkt URL'e yazılıyor
 * 3. "Filtrele" butonu kaldırıldı (gereksiz)
 * 4. Her değişiklik otomatik uygulanıyor
 */
const ProductFilters = () => {
  const { 
    filters,        
    updateFilter,   // ✅ Tek bir filtreyi güncelle
    updateFilters,  // ✅ Birden fazla filtreyi güncelle
    clearFilters,   // ✅ Tüm filtreleri temizle
    hasActiveFilters,
    activeFilterCount,
  } = useProductFilters();

  /**
   * 🎨 Kategori Değişikliği
   * 
   * ✅ updateFilter kullanarak URL otomatik güncellenir
   */
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateFilter('category', value || undefined);
  };

  /**
   * 💰 Fiyat Aralığı Değişiklikleri
   */
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFilter('minPrice', value ? Number(value) : undefined);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFilter('maxPrice', value ? Number(value) : undefined);
  };

  /**
   * ✅ Stok Durumu
   */
  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter('inStock', e.target.checked ? true : undefined);
  };

  /**
   * 🎨 Hızlı Fiyat Filtreleri
   */
  const handleQuickPriceFilter = (min: number, max?: number) => {
    updateFilters({ 
      minPrice: min, 
      maxPrice: max 
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        {hasActiveFilters && (
          <span className="text-sm text-blue-600 font-medium">
            {activeFilterCount} filtre aktif
          </span>
        )}
      </div>

      {/* Kategori Seçimi */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kategori
        </label>
        <Select
          value={filters.category || ''}
          onChange={handleCategoryChange}
          options={[
            { value: '', label: 'Tüm Kategoriler' },
            // 💡 TODO: Backend'den kategori listesi çek
            // API çağrısı ile dinamik olarak doldurulmalı
          ]}
          fullWidth
        />
      </div>

      {/* Fiyat Aralığı */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fiyat Aralığı (₺)
        </label>
        <div className="flex gap-3">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={handleMinPriceChange}
            min={0}
          />
          <span className="flex items-center text-gray-500">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={handleMaxPriceChange}
            min={0}
          />
        </div>
        
        {/* Hızlı Fiyat Filtreleri */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { label: '0-100', min: 0, max: 100 },
            { label: '100-500', min: 100, max: 500 },
            { label: '500-1000', min: 500, max: 1000 },
            { label: '1000+', min: 1000, max: undefined }
          ].map(range => (
            <button
              key={range.label}
              onClick={() => handleQuickPriceFilter(range.min, range.max)}
              className={`px-3 py-1 text-sm border rounded-full transition ${
                filters.minPrice === range.min && filters.maxPrice === range.max
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-gray-100 border-gray-300'
              }`}
            >
              {range.label} ₺
            </button>
          ))}
        </div>
      </div>

      {/* Stok Durumu */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={handleInStockChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Sadece Stokta Olanlar</span>
        </label>
      </div>

      {/* Sıralama */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sıralama
        </label>
        <Select
          value={filters.sort || 'newest'}
          onChange={(e) => {
            const newSort = e.target.value;
            console.log('🔄 Sort filter changed to:', newSort);
            updateFilter('sort', newSort as any);
          }}
          options={[
            { value: 'newest', label: 'En Yeni' },
            { value: 'oldest', label: 'En Eski' },
            { value: 'price-asc', label: 'Fiyat: Düşük → Yüksek' },
            { value: 'price-desc', label: 'Fiyat: Yüksek → Düşük' },
            { value: 'name-asc', label: 'İsim: A → Z' },
            { value: 'name-desc', label: 'İsim: Z → A' },
            { value: 'popular', label: 'En Popüler' }
          ]}
          fullWidth
        />
      </div>

      {/* Filtreleri Temizle Butonu */}
      {hasActiveFilters && (
        <Button 
          onClick={clearFilters} 
          variant="outline" 
          fullWidth
        >
          Filtreleri Temizle ({activeFilterCount})
        </Button>
      )}

      {/* Aktif Filtre Göstergesi */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Aktif Filtreler:</p>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Kategori
                <button 
                  onClick={() => updateFilter('category', undefined)}
                  className="ml-2 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.minPrice && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Min: {filters.minPrice} ₺
                <button 
                  onClick={() => updateFilter('minPrice', undefined)}
                  className="ml-2 hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.maxPrice && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Max: {filters.maxPrice} ₺
                <button 
                  onClick={() => updateFilter('maxPrice', undefined)}
                  className="ml-2 hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.inStock && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Stokta Var
                <button 
                  onClick={() => updateFilter('inStock', undefined)}
                  className="ml-2 hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;

/**
 * 🎯 NASIL ÇALIŞIYOR?
 * 
 * 1. Kullanıcı kategori seçer → updateFilter('category', 'electronics')
 * 2. useProductFilters → URL'i günceller: /products?category=electronics
 * 3. ProductsPage useEffect tetiklenir (filters dependency)
 * 4. loadProducts(filters) API çağrısı yapar
 * 5. Ürünler güncellenir ✅
 * 
 * 💡 Artık "Filtrele" butonuna gerek yok!
 * Her değişiklik otomatik uygulanıyor.
 */