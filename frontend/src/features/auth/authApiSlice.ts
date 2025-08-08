import { apiSlice } from '../../app/apiSlice';
import { User, ApiResponse } from '../../types';
export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        login: builder.mutation({ // Veri değiştiren işlemler (POST, PUT, DELETE) 'mutation' olur
            query: credentials => ({
                url: '/auth/login',
                method: 'POST',
                body: { ...credentials }
            })
        }),
        register: builder.mutation({
            query: userData => ({
                url: '/auth/register',
                method: 'POST',
                body: userData // form-data olacağı için header'lar otomatik ayarlanır
            })
        }),
        getMe: builder.query<ApiResponse<{ user: User }>, void>({
            query: () => '/auth/me',
            providesTags: ['User']
        }),
    })
});

// RTK Query, bizim için otomatik olarak hook'lar oluşturur:
export const { useLoginMutation, useRegisterMutation, useGetMeQuery } = authApiSlice;