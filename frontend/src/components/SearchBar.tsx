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
        <div className="dropdown w-full" ref={dropdownRef}>
            <div className="form-control relative w-full">
                <input
                    type="text"
                    placeholder="Ürün, kategori veya marka ara..."
                    className="input input-bordered w-full pr-10"
                    value={searchTerm}
                    onChange={handleSearch}
                    onFocus={() => searchTerm.length > 2 && setIsDropdownOpen(true)}
                />
                <div className="absolute top-0 right-0 h-full flex items-center pr-3">
                    {isLoading ? (
                         <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </div>
            </div>

            {isDropdownOpen && searchTerm.length > 2 && (
                <div className="dropdown-content z-[1000] menu p-2 shadow-2xl bg-base-100 rounded-box w-full mt-2 border border-base-200 max-h-96 overflow-y-auto">
                    {isError && (
                        <div className="p-4 text-center text-error">Arama sırasında bir hata oluştu.</div>
                    )}
                    
                    {!isLoading && !isError && results.length === 0 && (
                         <div className="p-4 text-center text-base-content/60">Sonuç bulunamadı.</div>
                    )}

                    {results.length > 0 && results.map(product => (
                        <li key={product._id}>
                            <Link 
                                to={`/products/${product._id}`}
                                className="flex items-center gap-3 p-3 hover:bg-base-200 transition-colors rounded-lg"
                                onClick={handleProductClick}
                            >
                                <div className="avatar">
                                    <div className="w-10 rounded">
                                        <img src={product.images?.[0]?.url || 'https://via.placeholder.com/100'} alt={product.name} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm truncate">{product.name}</div>
                                    <div className="text-xs text-base-content/60">{product.price} TL</div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;