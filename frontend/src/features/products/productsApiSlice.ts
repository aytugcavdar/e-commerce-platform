import { apiSlice } from '../../app/apiSlice';

export const productsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        // 'getProducts' isminde bir query endpoint'i oluşturuyoruz
        getProducts: builder.query({
            query: () => '/products', // API Gateway'deki /api/products adresine istek atacak
            providesTags: ['Product'] // Cache etiketlemesi
        })
    })
});

// RTK Query, endpoint'e göre bizim için otomatik olarak hook oluşturur:
export const { useGetProductsQuery } = productsApiSlice;