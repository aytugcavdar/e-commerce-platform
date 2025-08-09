import { apiSlice } from '../../app/apiSlice';
import { Order, ApiResponse, ShippingAddress } from '../../types';

interface CreateOrderArg {
    shippingAddress: ShippingAddress;
    paymentMethod: string;
}

export const orderApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        createOrder: builder.mutation<ApiResponse<Order>, CreateOrderArg>({
            query: orderData => ({
                url: '/orders',
                method: 'POST',
                body: orderData
            }),
            invalidatesTags: ['Cart'] 
        }),
        getMyOrders: builder.query<ApiResponse<Order[]>, void>({
            query: () => '/orders/myorders',
            providesTags: (result) => 
                result?.data 
                ? [...result.data.map(({ _id }) => ({ type: 'Order' as const, id: _id })), { type: 'Order', id: 'LIST' }]
                : [{ type: 'Order', id: 'LIST' }],
        }),
        getOrderById: builder.query<ApiResponse<Order>, string>({
            query: (id) => `/orders/${id}`,
            providesTags: (result, error, id) => [{ type: 'Order', id }],
        }),
    
        
    })
});


export const { useCreateOrderMutation, useGetMyOrdersQuery, useGetOrderByIdQuery } = orderApiSlice;