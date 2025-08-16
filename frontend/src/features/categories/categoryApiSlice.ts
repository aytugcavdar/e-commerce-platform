import { apiSlice } from '../../app/apiSlice';
import { Category } from '../../types/Category';

// Sunucudan gelen genel yanıt tipini tanımlayalım
interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
}

export const categoryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL CATEGORIES - DÜZELTİLDİ
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      // API'den gelen yanıtı dönüştürerek sadece kategori dizisini döndür
      transformResponse: (res: ApiResponse<Category[]>) => res.data,
      providesTags: (result = []) => [
        'Category',
        ...result.map(({ _id }) => ({ type: 'Category' as const, id: _id })),
      ],
    }),

    // GET SUB-CATEGORIES - DÜZELTİLDİ
    getSubCategories: builder.query<Category[], string>({
        query: (parentId) => `/categories/${parentId}/subcategories`,
        // API'den gelen yanıtı dönüştürerek sadece alt kategori dizisini döndür
        transformResponse: (res: ApiResponse<Category[]>) => res.data,
        providesTags: (result = [], _error, arg) => [
            { type: 'Category', id: arg },
            ...result.map(({ _id }) => ({ type: 'Category' as const, id: _id })),
        ]
    }),

    // ADD CATEGORY
    addCategory: builder.mutation<Category, Partial<Category>>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),

    // UPDATE CATEGORY
    updateCategory: builder.mutation<Category, Partial<Category>>({
      query: (data) => ({
        url: `/categories/${data._id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Category', id: arg._id }],
    }),

    // DELETE CATEGORY
    deleteCategory: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Category', id: arg }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApiSlice;