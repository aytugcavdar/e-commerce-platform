import { apiSlice } from '../../app/apiSlice';
import { Cart, ApiResponse } from '../../types';

export const cartApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
       getCart: builder.query<ApiResponse<Cart>, void>({
            query: () => '/cart',
            providesTags: ['Cart'],
        }),
        addToCart: builder.mutation<ApiResponse<Cart>, { productId: string, quantity: number }>({
            query: ({ productId, quantity }) => ({
                url: '/cart',
                method: 'POST',
                body: { productId, quantity }
            }),
            invalidatesTags: ['Cart']
        }),
        removeFromCart: builder.mutation<ApiResponse<Cart>, { productId: string }>({
            query: ({ productId }) => ({
                url: `/cart/${productId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart']
        }),
        updateCartItem: builder.mutation({
            query: ({ productId, quantity }) => ({
                url: `/cart/${productId}`,
                method: 'PUT',
                body: { quantity },
            }),
            invalidatesTags: ['Cart'],
        }),
        clearCart: builder.mutation<void, void>({
            query: () => ({
                url: '/cart/clear',
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart'],
        }),
    })
});

export const { useGetCartQuery, useAddToCartMutation, useClearCartMutation, useRemoveFromCartMutation, useUpdateCartItemMutation } = cartApiSlice;