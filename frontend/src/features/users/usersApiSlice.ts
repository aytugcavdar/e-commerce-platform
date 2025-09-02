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
        addAddress: builder.mutation({
            query: (address) => ({
                url: '/users/address',
                method: 'POST',
                body: address,
            }),
            invalidatesTags: [{ type: 'User', id: 'ME' }],
        }),
        updateAddress: builder.mutation({
            query: ({ addressId, ...address }) => ({
                url: `/users/address/${addressId}`,
                method: 'PUT',
                body: address,
            }),
            invalidatesTags: [{ type: 'User', id: 'ME' }],
        }),
        deleteAddress: builder.mutation({
            query: (addressId) => ({
                url: `/users/address/${addressId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'User', id: 'ME' }],
        }),
        setDefaultAddress: builder.mutation({
            query: (addressId) => ({
                url: `/users/address/default/${addressId}`,
                method: 'PUT',
            }),
            invalidatesTags: [{ type: 'User', id: 'ME' }],
        }),
    })
    
});
console.log('usersApiSlice loaded');
console.log(usersApiSlice.endpoints.getUsers);


export const { useGetUsersQuery, useUpdateUserMutation, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation, useSetDefaultAddressMutation } = usersApiSlice;