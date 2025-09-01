import { apiSlice } from '../../app/apiSlice';
import { User, ApiResponse } from '../../types';

export const usersApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getUsers: builder.query<ApiResponse<User[]>, void>({
            query: () => '/users',
            
            providesTags: (result) =>
                result?.data
                ? [...result.data.map(({ id }) => ({ type: 'User' as const, id })), { type: 'User', id: 'LIST' }]
                : [{ type: 'User', id: 'LIST' }],
        }),
        updateUser: builder.mutation<ApiResponse<User>, Partial<User> & { id: string }>({
            query: ({ id, ...patch }) => ({
                url: `/users/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }]
        }),
        updateProfile: builder.mutation<User, Partial<User>>({
        query: (initialProfileData) => ({
            url: '/users/profile',
            method: 'PUT',
            body: { ...initialProfileData },
        }),
        invalidatesTags: ['User'],
    }),
    updateFavorites: builder.mutation<{ success: boolean; data: string[] }, { productId: string }>({
        query: ({ productId }) => ({
            url: '/users/favorites',
            method: 'PUT',
            body: { productId },
        }),
        invalidatesTags: ['User'],
    }),
    })
    
});
console.log('usersApiSlice loaded');
console.log(usersApiSlice.endpoints.getUsers);


export const { useGetUsersQuery, useUpdateUserMutation, useUpdateProfileMutation, useUpdateFavoritesMutation } = usersApiSlice;