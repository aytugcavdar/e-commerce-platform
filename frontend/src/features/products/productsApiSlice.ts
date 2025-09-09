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
        createProduct: builder.mutation<ApiResponse<Product>, Partial<Product>>({
            query: (productData) => ({
                url: '/products',
                method: 'POST',
                body: productData,
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
        uploadProductImages: builder.mutation<ApiResponse<Product>, { id: string; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `/products/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Product', id: arg.id }]
        }),
        getProductWithCategory: builder.query<ApiResponse<Product>, string>({
            query: (id) => `/products/${id}/with-category`,
            providesTags: (result, error, id) => [{ type: 'Product', id }],
        }),
        // Search endpoint'i - backend direkt array döndürdüğü için Product[] tipini kullan
        searchProducts: builder.query<Product[], string>({
            query: (searchTerm) => `/search?q=${encodeURIComponent(searchTerm)}`,
            providesTags: (result) =>
                result
                ? [...result.map(({ _id }) => ({ type: 'Product' as const, id: _id })), { type: 'Product', id: 'SEARCH' }]
                : [{ type: 'Product', id: 'SEARCH' }],
        }),
        getProductsByCategory: builder.query<ApiResponse<Product[]>, string[]>({
            query: (categoryIds) => `/products?categoryId[in]=${categoryIds.join(',')}`,
            providesTags: (result, error, categoryIds) =>
                result ? [{ type: 'Product', id: 'LIST' }] : [],
        }),
    })
});

export const { 
    useGetProductsQuery, 
    useGetProductQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useUploadProductImagesMutation,
    useGetProductWithCategoryQuery,
    useLazySearchProductsQuery,
    useGetProductsByCategoryQuery
} = productsApiSlice;