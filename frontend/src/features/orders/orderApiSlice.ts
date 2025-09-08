import { apiSlice } from '../../app/apiSlice';
import { ApiResponse } from '../../types';

// Order tipini tanımlayalım
export interface Order {
  _id: string;
  userId: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderItems: Array<{
    productId: string;
    quantity: number;
    price: number;
    productName?: string;
  }>;
  paymentMethod?: string;
  paymentStatus?: string;
  trackingNumber?: string;
}

export const ordersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL ORDERS
    getOrders: builder.query<ApiResponse<Order[]>, void>({
      query: () => '/orders',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Order' as const, id: _id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),

    // GET SINGLE ORDER
    getOrder: builder.query<ApiResponse<Order>, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    // GET USER ORDERS (kullanıcının kendi siparişleri)
    getUserOrders: builder.query<ApiResponse<Order[]>, string>({
      query: (userId) => `/orders/user/${userId}`,
      providesTags: (result, error, userId) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Order' as const, id: _id })),
              { type: 'Order', id: `USER_${userId}` },
            ]
          : [{ type: 'Order', id: `USER_${userId}` }],
    }),

    // CREATE ORDER
    createOrder: builder.mutation<ApiResponse<Order>, Partial<Order>>({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    // UPDATE ORDER STATUS
    updateOrderStatus: builder.mutation<
      ApiResponse<Order>,
      { orderId: string; status: string }
    >({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Order', id: arg.orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // UPDATE ORDER
    updateOrder: builder.mutation<ApiResponse<Order>, Partial<Order> & { _id: string }>({
      query: ({ _id, ...orderData }) => ({
        url: `/orders/${_id}`,
        method: 'PUT',
        body: orderData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Order', id: arg._id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // DELETE ORDER
    deleteOrder: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // GET ORDER STATISTICS
    getOrderStats: builder.query<
      ApiResponse<{
        totalOrders: number;
        totalRevenue: number;
        pendingOrders: number;
        completedOrders: number;
        cancelledOrders: number;
      }>,
      void
    >({
      query: () => '/orders/stats',
      providesTags: [{ type: 'Order', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetUserOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useGetOrderStatsQuery,
} = ordersApiSlice;