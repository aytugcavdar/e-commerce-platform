// frontend/src/features/products/components/ProductFilters.tsx

import { useProducts } from '../hooks/useProducts';
import { Select, Button, Input } from '@/shared/components/ui/base';

/**
 * 🎓 ÖĞREN: Filters Component Pattern
 * 
 * Bu component'in sorumluluğu:
 * 1. Kullanıcıdan filtre bilgisi almak (kategori, fiyat, marka)
 * 2. useProducts hook'una iletmek
 * 3. "Filtrele" butonuna basınca uygulamak
 * 
 * ❓ Neden Hemen Filtrelemiyoruz?
 * - Her tuş vuruşunda API çağrısı YAPMAMALIYIZ (performans)
 * - Kullanıcı birden fazla filtre seçebilmeli
 * - "Filtrele" butonuna basınca tek seferde API'ye git
 * 
 * 💡 Alternatif Yaklaşım:
 * - Debounce kullan (500ms bekle, sonra filtrele)
 * - URL params'a yaz (tarayıcı geri butonu çalışsın)
 */
const ProductFilters = () => {
  /**
   * 🎯 Custom Hook Kullanımı
   * 
   * useProducts hook'undan ne aldık?
   * - filters: Mevcut filtre değerleri (state)
   * - updateFilters: Filtreleri güncelleme fonksiyonu
   * - applyFilters: Filtreleri uygula (API çağrısı yap)
   * - resetFilters: Tüm filtreleri temizle
   */
  const { 
    filters,        // Mevcut filtre state'i
    updateFilters,  // Filtre değerini değiştir
    applyFilters,   // API'ye gönder
    resetFilters    // Sıfırla
  } = useProducts();

  /**
   * 🎓 ÖĞREN: Controlled Input Pattern
   * 
   * React'te input yönetiminin 2 yolu var:
   * 
   * 1. CONTROLLED (Tercih Edilen):
   *    - value={filters.category}
   *    - onChange={(e) => updateFilters({ category: e.target.value })}
   *    - React state'i kontrol eder
   * 
   * 2. UNCONTROLLED (Önerilmez):
   *    - ref={inputRef}
   *    - DOM'dan değeri okur
   * 
   * ✅ Controlled Avantajları:
   * - Değer her zaman senkron
   * - Validation kolay
   * - Reset kolay (state'i değiştir, UI otomatik güncellenir)
   */
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ 
      category: e.target.value || undefined  // Boşsa undefined (API'ye gönderme)
    });
  };

  /**
   * 🎓 ÖĞREN: Fiyat Aralığı Mantığı
   * 
   * ❓ Neden 2 Input?
   * - Kullanıcı min ve max değer girebilmeli
   * - Backend'e "minPrice=100&maxPrice=500" şeklinde gider
   * 
   * 💡 Validation (İyileştirme):
   * - Min > Max olamaz
   * - Negatif değer olamaz
   * - Decimal değer formatla (1000.50 → 1,000.50)
   */
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFilters({
      minPrice: value ? Number(value) : undefined
    });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFilters({
      maxPrice: value ? Number(value) : undefined
    });
  };

  /**
   * 🎓 ÖĞREN: Checkbox Pattern (Stok Kontrolü)
   * 
   * Checkbox için özel mantık:
   * - Checked ise: inStock = true gönder
   * - Unchecked ise: inStock = undefined (API'ye gönderme)
   */
  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({
      inStock: e.target.checked ? true : undefined
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        {/* Aktif filtre sayısı (opsiyonel) */}
        {Object.keys(filters).length > 2 && ( // page ve limit hariç
          <span className="text-sm text-blue-600 font-medium">
            {Object.keys(filters).length - 2} filtre aktif
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
            // Örnek:
            // categories.map(cat => ({ 
            //   value: cat._id, 
            //   label: cat.name 
            // }))
          ]}
          fullWidth
        />
      </div>

      {/* Fiyat Aralığı */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fiyat Aralığı (TRY)
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
        {/* Hızlı Fiyat Filtreleri (Opsiyonel) */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { label: '0-100', min: 0, max: 100 },
            { label: '100-500', min: 100, max: 500 },
            { label: '500+', min: 500, max: undefined }
          ].map(range => (
            <button
              key={range.label}
              onClick={() => updateFilters({ minPrice: range.min, maxPrice: range.max })}
              className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 transition"
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
          onChange={(e) => updateFilters({ sort: e.target.value as any })}
          options={[
            { value: 'newest', label: 'En Yeni' },
            { value: 'price-asc', label: 'Fiyat: Düşük → Yüksek' },
            { value: 'price-desc', label: 'Fiyat: Yüksek → Düşük' },
            { value: 'name-asc', label: 'İsim: A → Z' }
          ]}
          fullWidth
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {/**
         * 🎓 ÖĞREN: Filtrele vs Temizle
         * 
         * Filtrele Butonu:
         * - applyFilters() çağırır
         * - API'ye istek gönderir
         * - Sayfa 1'e dönülür
         * 
         * Temizle Butonu:
         * - resetFilters() çağırır
         * - Tüm filtreleri sıfırlar
         * - Varsayılan filtrelerle API'ye gider
         */}
        <Button 
          onClick={applyFilters} 
          fullWidth
          className="mb-2"
        >
          Filtrele
        </Button>
        
        <Button 
          onClick={resetFilters} 
          variant="outline" 
          fullWidth
        >
          Filtreleri Temizle
        </Button>
      </div>

      {/* Aktif Filtre Göstergesi (Opsiyonel) */}
      {filters.category && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Aktif Filtreler:</p>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Kategori: {filters.category}
                <button 
                  onClick={() => updateFilters({ category: undefined })}
                  className="ml-2 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.minPrice && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Min: {filters.minPrice} ₺
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
 * 🎯 GELİŞMİŞ ÖZELLİKLER (İlerisi İçin):
 * 
 * 1. URL Senkronizasyonu:
 * const [searchParams, setSearchParams] = useSearchParams();
 * useEffect(() => {
 *   setSearchParams(filters);
 * }, [filters]);
 * 
 * 2. Filtreleri Kaydet (LocalStorage):
 * localStorage.setItem('savedFilters', JSON.stringify(filters));
 * 
 * 3. Mobil için Drawer:
 * <Drawer open={isOpen}>
 *   <ProductFilters />
 * </Drawer>
 * 
 * 4. Kategori Ağacı (Multi-level):
 * <TreeSelect 
 *   data={categories} 
 *   onChange={...} 
 * />
 */