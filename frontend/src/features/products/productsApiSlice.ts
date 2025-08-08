import { apiSlice } from '../../app/apiSlice';
import { Product, ApiResponse } from '../../types';

export const productsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getProducts: builder.query<ApiResponse<Product[]>, void>({
            query: () => '/products',
            providesTags: (result) => 
                result?.data 
                ? [...result.data.map(({ _id }) => ({ type: 'Product' as const, id: _id })), { type: 'Product', id: 'LIST' }]
                : [{ type: 'Product', id: 'LIST' }],
        }),
        getProduct: builder.query<ApiResponse<Product>, string>({
            query: (id) => `/products/${id}`,
            providesTags: (result, error, id) => [{ type: 'Product', id }],
        })
    })
});

export const { useGetProductsQuery, useGetProductQuery } = productsApiSlice;