import { apiSlice } from '../../app/apiSlice';
import { User, ApiResponse } from '../../types';
export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    // Endpoint adını 'registerUser' olarak değiştiriyoruz
    registerUser: builder.mutation({ 
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
        getMe: builder.query<ApiResponse<{ user: User }>, void>({
            query: () => '/auth/me',
            providesTags: ['User']
        }),
         updateMe: builder.mutation<ApiResponse<{ user: User }>, FormData>({
            query: (formData) => ({
                url: '/users/updateme', // DİKKAT: Yeni rotayı kullanıyoruz
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: ['User'] // Kullanıcı verisini geçersiz kıl ve yeniden çekilmesini sağla
        }),
    })
});

// RTK Query, bizim için otomatik olarak hook'lar oluşturur:
export const { useLoginMutation, useRegisterUserMutation, useLogoutMutation, useGetMeQuery, useUpdateMeMutation } = authApiSlice;