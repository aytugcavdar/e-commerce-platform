import { apiSlice } from '../../app/apiSlice';
import { Category, ApiResponse } from '../../types';

export const categoryApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getCategories: builder.query<ApiResponse<Category[]>, void>({
            // '/categories' olan query'yi '/categories?includeChildren=true' olarak değiştirin
            query: () => '/categories?includeChildren=true', 
            providesTags: (result) =>
                result?.data
                ? [...result.data.map(({ _id }) => ({ type: 'Category' as const, id: _id })), { type: 'Category', id: 'LIST' }]
                : [{ type: 'Category', id: 'LIST' }],
        }),
        createCategory: builder.mutation<ApiResponse<Category>, Partial<Category>>({
            query: (newCategory) => ({
                url: '/categories',
                method: 'POST',
                body: newCategory,
            }),
            invalidatesTags: [{ type: 'Category', id: 'LIST' }]
        }),
        updateCategory: builder.mutation<ApiResponse<Category>, Partial<Category>>({
            query: ({ _id, ...patch }) => ({
                url: `/categories/${_id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: (result, error, { _id }) => [{ type: 'Category', id: _id }, { type: 'Category', id: 'LIST' }]
        }),
        deleteCategory: builder.mutation<{ success: boolean; id: string }, string>({
            query: (id) => ({
                url: `/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Category', id }, { type: 'Category', id: 'LIST' }]
        }),
    })
});

export const {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} = categoryApiSlice;