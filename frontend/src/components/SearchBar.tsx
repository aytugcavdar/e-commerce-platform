import React, { useState, useEffect, useRef } from 'react';
import { useLazySearchProductsQuery } from '../features/products/productsApiSlice';
import { Product } from '../types';
import { Link } from 'react-router-dom';

const SearchBar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [triggerSearch, { data, isLoading, isError }] = useLazySearchProductsQuery();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (data) {
            // Backend'den gelen veri formatını kontrol et
            console.log('Search API Response:', data);
            
            // Eğer data bir array ise direkt kullan, değilse data.data'yı kullan
            if (Array.isArray(data)) {
                setResults(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setResults(data.data);
            } else {
                console.warn('Beklenmeyen veri formatı:', data);
                setResults([]);
            }
        }
    }, [data]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            triggerSearch(term);
            setIsDropdownOpen(true);
        } else {
            setResults([]);
            setIsDropdownOpen(false);
        }
    };

    const handleClear = () => {
        setSearchTerm('');
        setResults([]);
        setIsDropdownOpen(false);
    };

    const handleProductClick = () => {
        setIsDropdownOpen(false);
        setSearchTerm('');
        setResults([]);
    };

    return (
        <div className="dropdown dropdown-end w-full max-w-md mx-auto" ref={dropdownRef}>
            <div className="form-control w-full">
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Ürün, kategori veya marka ara..."
                        className="input input-bordered input-primary w-full focus:outline-offset-0"
                        value={searchTerm}
                        onChange={handleSearch}
                        onFocus={() => searchTerm.length > 2 && setIsDropdownOpen(true)}
                    />
                    <button 
                        className="btn btn-square btn-primary"
                        onClick={() => searchTerm.length > 2 && triggerSearch(searchTerm)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    {searchTerm && (
                        <button 
                            className="btn btn-square btn-ghost"
                            onClick={handleClear}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {isDropdownOpen && searchTerm.length > 2 && (
                <div className="dropdown-content z-[1000] menu p-0 shadow-2xl bg-base-100 rounded-box w-full mt-2 border border-base-200 max-h-96 overflow-y-auto">
                    {isLoading && (
                        <li className="p-4">
                            <div className="flex items-center gap-2">
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>Aranıyor...</span>
                            </div>
                        </li>
                    )}
                    
                    {isError && (
                        <li className="p-4">
                            <div className="alert alert-error">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Arama sırasında hata oluştu</span>
                            </div>
                        </li>
                    )}
                    
                    {results.length > 0 && results.map(product => (
                        <li key={product._id}>
                            <Link 
                                to={`/products/${product._id}`}
                                className="flex items-center gap-3 p-3 hover:bg-base-200 transition-colors"
                                onClick={handleProductClick}
                            >
                                <div className="avatar placeholder">
                                    <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                                        <span className="text-xs">{product.name?.charAt(0) || 'P'}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm truncate">{product.name}</div>
                                    {product.category && (
                                        <div className="text-xs text-base-content/60">{product.category}</div>
                                    )}
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </li>
                    ))}
                    
                    {results.length === 0 && !isLoading && !isError && searchTerm.length > 2 && (
                        <li className="p-4">
                            <div className="text-center text-base-content/60">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-3v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm">"{searchTerm}" için sonuç bulunamadı</p>
                                <p className="text-xs mt-1">Farklı bir terim deneyin</p>
                            </div>
                        </li>
                    )}
                    
                    {results.length > 0 && (
                        <li className="border-t border-base-200">
                            <div className="text-center text-xs text-base-content/50 p-2">
                                {results.length} sonuç gösteriliyor
                            </div>
                        </li>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;