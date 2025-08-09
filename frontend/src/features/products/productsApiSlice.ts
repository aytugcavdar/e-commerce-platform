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
        }),
        // YENİ EKlenen MUTATION'LAR
        createProduct: builder.mutation<ApiResponse<Product>, FormData>({
            query: (productData) => ({
                url: '/products',
                method: 'POST',
                body: productData,
                // FormData olduğu için header otomatik ayarlanır
            }),
            invalidatesTags: [{ type: 'Product', id: 'LIST' }]
        }),
        updateProduct: builder.mutation<ApiResponse<Product>, { id: string, productData: FormData }>({
            query: ({ id, productData }) => ({
                url: `/products/${id}`,
                method: 'PUT',
                body: productData,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Product', id: arg.id }, { type: 'Product', id: 'LIST' }]
        }),
        deleteProduct: builder.mutation<{ success: boolean; id: string }, string>({
            query: (id) => ({
                url: `/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }]
        }),
    })
});

export const { 
    useGetProductsQuery, 
    useGetProductQuery,
    // YENİ hook'ları export et
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productsApiSlice;