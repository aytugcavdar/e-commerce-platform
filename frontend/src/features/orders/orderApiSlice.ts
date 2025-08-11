// frontend/src/features/orders/orderApiSlice.ts
import { apiSlice } from '../../app/apiSlice';
import { Order, ApiResponse, ShippingAddress } from '../../types';

interface CreateOrderArg {
    shippingAddress: ShippingAddress;
    paymentMethod: string;
}


interface UpdateOrderStatusArg {
    orderId: string;
    status: string;
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
        // YENİ EKlenen ENDPOINT'LER
        getAllOrders: builder.query<ApiResponse<Order[]>, void>({
            query: () => '/orders',
            providesTags: (result) =>
                result?.data
                ? [...result.data.map(({ _id }) => ({ type: 'Order' as const, id: _id })), { type: 'Order', id: 'LIST' }]
                : [{ type: 'Order', id: 'LIST' }],
        }),
        updateOrderStatus: builder.mutation<ApiResponse<Order>, UpdateOrderStatusArg>({
            query: ({ orderId, status }) => ({
                url: `/orders/${orderId}/status`,
                method: 'PUT',
                body: { status }
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Order', id: arg.orderId }, { type: 'Order', id: 'LIST' }]
        })
    })
});


export const {
    useCreateOrderMutation,
    useGetMyOrdersQuery,
    useGetOrderByIdQuery,
    // YENİ hook'ları export et
    useGetAllOrdersQuery,
    useUpdateOrderStatusMutation
} = orderApiSlice;