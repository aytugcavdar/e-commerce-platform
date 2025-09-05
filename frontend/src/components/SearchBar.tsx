import React, { useState, useEffect, useRef } from 'react';
import { useLazySearchProductsQuery } from '../features/products/productsApiSlice';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { Search, X, Filter, Clock, TrendingUp, Star } from 'lucide-react';

const SearchBar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [triggerSearch, { data, isLoading, isError }] = useLazySearchProductsQuery();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // LocalStorage'dan son aramaları al
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        if (data) {
            if (Array.isArray(data)) {
                setResults(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setResults(data.data);
            } else {
                setResults([]);
            }
        }
    }, [data]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setIsExpanded(false);
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveRecentSearch = (term: string) => {
        if (term.length < 2) return;
        
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            triggerSearch(term);
            setIsDropdownOpen(true);
        } else {
            setResults([]);
            if (term.length === 0) {
                setIsDropdownOpen(isExpanded);
            }
        }
    };

    const handleFocus = () => {
        setIsExpanded(true);
        setIsDropdownOpen(true);
    };

    const handleClear = () => {
        setSearchTerm('');
        setResults([]);
        setSelectedCategory('');
        setPriceRange({ min: '', max: '' });
        inputRef.current?.focus();
    };

    const handleProductClick = () => {
        saveRecentSearch(searchTerm);
        setIsDropdownOpen(false);
        setIsExpanded(false);
        setShowFilters(false);
    };

    const handleRecentSearchClick = (term: string) => {
        setSearchTerm(term);
        triggerSearch(term);
        saveRecentSearch(term);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const filteredResults = results.filter(product => {
        let matches = true;
        
        if (selectedCategory && product.categoryInfo?.name !== selectedCategory) {
            matches = false;
        }
        
        if (priceRange.min && product.price < parseFloat(priceRange.min)) {
            matches = false;
        }
        
        if (priceRange.max && product.price > parseFloat(priceRange.max)) {
            matches = false;
        }
        
        return matches;
    });

    const categories = [...new Set(results.map(p => p.categoryInfo?.name).filter(Boolean))];
    const popularSearches = ['iPhone', 'Samsung', 'Laptop', 'Kulaklık', 'Kamera'];

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Ana Arama Kutusu */}
            <div className={`relative transition-all duration-300 ease-in-out ${
                isExpanded ? 'transform scale-105' : ''
            }`}>
                <div className={`form-control relative w-full transition-all duration-300 ${
                    isExpanded ? 'shadow-2xl ring-2 ring-blue-500 ring-opacity-50' : 'shadow-md'
                }`}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ürün, kategori veya marka ara..."
                        className={`input input-bordered w-full pr-20 pl-12 transition-all duration-300 ${
                            isExpanded ? 'input-lg py-4 text-lg' : 'py-3'
                        } bg-white/90 backdrop-blur-sm`}
                        value={searchTerm}
                        onChange={handleSearch}
                        onFocus={handleFocus}
                    />
                    
                    {/* Arama İkonu */}
                    <div className="absolute left-0 top-0 h-full flex items-center pl-4">
                        <Search className={`transition-all duration-300 text-gray-400 ${
                            isExpanded ? 'w-6 h-6' : 'w-5 h-5'
                        }`} />
                    </div>
                    
                    {/* Sağ Taraf Kontrolleri */}
                    <div className="absolute right-0 top-0 h-full flex items-center gap-2 pr-3">
                        {isLoading && (
                            <span className="loading loading-spinner loading-sm text-blue-500"></span>
                        )}
                        
                        {searchTerm && (
                            <button
                                onClick={handleClear}
                                className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        
                        {isExpanded && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`btn btn-ghost btn-sm btn-circle hover:bg-gray-100 ${
                                    showFilters ? 'bg-blue-100 text-blue-600' : ''
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtre Paneli */}
                {showFilters && isExpanded && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="label label-text font-medium">Kategori</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="select select-bordered select-sm w-full"
                                >
                                    <option value="">Tüm Kategoriler</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label label-text font-medium">Min Fiyat</label>
                                <input
                                    type="number"
                                    placeholder="₺0"
                                    className="input input-bordered input-sm w-full"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange(prev => ({...prev, min: e.target.value}))}
                                />
                            </div>
                            <div>
                                <label className="label label-text font-medium">Max Fiyat</label>
                                <input
                                    type="number"
                                    placeholder="₺999999"
                                    className="input input-bordered input-sm w-full"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange(prev => ({...prev, max: e.target.value}))}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dropdown İçeriği */}
            {isDropdownOpen && (
                <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-[80vh]' : 'max-h-96'
                }`}>
                    <div className="overflow-y-auto max-h-full">
                        {/* Arama Sonuçları Yokken Gösterilecekler */}
                        {searchTerm.length <= 2 && (
                            <div className="p-4 space-y-4">
                                {/* Son Aramalar */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <Clock className="w-4 h-4" />
                                                Son Aramalar
                                            </h3>
                                            <button
                                                onClick={clearRecentSearches}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Temizle
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {recentSearches.map(term => (
                                                <button
                                                    key={term}
                                                    onClick={() => handleRecentSearchClick(term)}
                                                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Popüler Aramalar */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                                        <TrendingUp className="w-4 h-4" />
                                        Popüler Aramalar
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {popularSearches.map(term => (
                                            <button
                                                key={term}
                                                onClick={() => handleRecentSearchClick(term)}
                                                className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hata Durumu */}
                        {isError && (
                            <div className="p-4 text-center text-red-500 bg-red-50">
                                <p className="text-sm">Arama sırasında bir hata oluştu.</p>
                                <button 
                                    onClick={() => triggerSearch(searchTerm)}
                                    className="text-xs text-red-600 hover:text-red-800 mt-1"
                                >
                                    Tekrar dene
                                </button>
                            </div>
                        )}
                        
                        {/* Sonuç Bulunamadı */}
                        {!isLoading && !isError && searchTerm.length > 2 && filteredResults.length === 0 && (
                             <div className="p-6 text-center text-gray-500">
                                <div className="text-4xl mb-4">🔍</div>
                                <p className="text-sm">"{searchTerm}" için sonuç bulunamadı.</p>
                                <p className="text-xs text-gray-400 mt-2">Farklı anahtar kelimeler deneyin</p>
                            </div>
                        )}

                        {/* Arama Sonuçları */}
                        {filteredResults.length > 0 && (
                            <div>
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                                    <p className="text-xs text-gray-600">
                                        {filteredResults.length} sonuç bulundu
                                        {searchTerm && ` "${searchTerm}" için`}
                                    </p>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {filteredResults.map(product => (
                                        <Link
                                            key={product._id}
                                            to={`/products/${product._id}`}
                                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                                            onClick={handleProductClick}
                                        >
                                            <div className="avatar">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                    <img 
                                                        src={product.images?.[0]?.url || 'https://via.placeholder.com/100'} 
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {product.categoryInfo?.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        ₺{product.price?.toLocaleString()}
                                                    </span>
                                                    {product.averageRating > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                                            <span className="text-xs text-gray-600">
                                                                {product.averageRating.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                                                {product.stock > 0 ? `${product.stock} stokta` : 'Tükendi'}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                
                                {/* Daha Fazla Sonuç Bağlantısı */}
                                {filteredResults.length >= 10 && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <Link
                                            to={`/search?q=${encodeURIComponent(searchTerm)}`}
                                            className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={handleProductClick}
                                        >
                                            Tüm sonuçları görüntüle →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;