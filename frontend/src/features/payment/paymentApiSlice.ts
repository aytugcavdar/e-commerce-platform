// frontend/src/features/payment/paymentApiSlice.ts
import { apiSlice } from '../../app/apiSlice';
import { Order, ApiResponse } from '../../types';

interface PaymentArgs {
    orderId: string;
    paymentMethod: string;
}

export const paymentApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        processPayment: builder.mutation<ApiResponse<Order>, PaymentArgs>({
            query: (paymentData) => ({
                url: '/payments/charge',
                method: 'POST',
                body: paymentData
            }),
            // Ödeme sonrası ilgili siparişin verilerini ve listeyi geçersiz kıl
            invalidatesTags: (result, error, arg) => [
                { type: 'Order', id: arg.orderId },
                { type: 'Order', id: 'LIST' }
            ]
        })
    })
});

export const { useProcessPaymentMutation } = paymentApiSlice;