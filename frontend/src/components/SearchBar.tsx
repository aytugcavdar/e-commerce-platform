import React, { useState, useEffect } from 'react';
import { useLazySearchProductsQuery } from '../features/products/productsApiSlice';
import { Product } from '../types';
import { Link } from 'react-router-dom';

const SearchBar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [triggerSearch, { data, isLoading, isError }] = useLazySearchProductsQuery();

    useEffect(() => {
        if (data?.data) {
            setResults(data.data);
        }
    }, [data]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            triggerSearch(term);
        } else {
            setResults([]);
        }
    };

    return (
        <div className="dropdown">
            <input
                type="text"
                placeholder="Ürün Ara..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={handleSearch}
            />
            {searchTerm.length > 2 && (
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
                    {isLoading && <li><a>Yükleniyor...</a></li>}
                    {isError && <li><a>Hata oluştu</a></li>}
                    {results.length > 0 && results.map(product => (
                        <li key={product._id}>
                            <Link to={`/products/${product._id}`}>{product.name}</Link>
                        </li>
                    ))}
                    {results.length === 0 && !isLoading && <li><a>Sonuç bulunamadı</a></li>}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;