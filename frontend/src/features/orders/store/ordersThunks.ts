// frontend/src/features/orders/store/ordersThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/shared/services/api/client';
import { ORDER_ENDPOINTS } from '@/shared/services/api/endpoints';
import type {
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
} from '../types/order.types';

/**
 * 🎓 ÖĞREN: Orders Thunks
 * 
 * Sipariş ile ilgili async işlemler (API çağrıları).
 */

/**
 * 🛒 CREATE ORDER - Sipariş Oluştur
 * 
 * Checkout sonrası sipariş oluşturur.
 */
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: CreateOrderRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<CreateOrderResponse>(
        ORDER_ENDPOINTS.CREATE,
        orderData
      );

      return data.data.order;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Sipariş oluşturulamadı';
      return rejectWithValue(message);
    }
  }
);

/**
 * 📋 FETCH ORDERS - Kullanıcının Siparişlerini Getir
 */
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (
    params: { page?: number; limit?: number; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.get(ORDER_ENDPOINTS.LIST, { params });

      return {
        orders: data.data.orders as Order[],
        pagination: data.data.pagination,
      };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Siparişler yüklenemedi';
      return rejectWithValue(message);
    }
  }
);

/**
 * 🔍 FETCH ORDER BY ID - Sipariş Detayı
 */
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(ORDER_ENDPOINTS.DETAIL(orderId));

      return data.data as Order;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Sipariş yüklenemedi';
      return rejectWithValue(message);
    }
  }
);

/**
 * 🚫 CANCEL ORDER - Sipariş İptal
 */
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch(ORDER_ENDPOINTS.CANCEL(orderId));

      return data.data as Order;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Sipariş iptal edilemedi';
      return rejectWithValue(message);
    }
  }
);

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * // CheckoutPage'de
 * const handleCheckout = async () => {
 *   const orderData: CreateOrderRequest = {
 *     items: cartItems.map(item => ({
 *       productId: item.productId,
 *       quantity: item.quantity
 *     })),
 *     shippingAddress: selectedAddress,
 *     paymentMethod: selectedPayment,
 *     couponCode: coupon?.code,
 *   };
 *   
 *   const result = await dispatch(createOrder(orderData));
 *   
 *   if (createOrder.fulfilled.match(result)) {
 *     toast.success('Sipariş oluşturuldu!');
 *     navigate('/orders');
 *   }
 * };
 */