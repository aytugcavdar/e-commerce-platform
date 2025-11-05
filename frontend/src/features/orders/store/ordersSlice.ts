// frontend/src/features/orders/store/ordersSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrdersState, Order, OrderStatus } from '../types/order.types';
import {
  createOrder,
  fetchOrders,
  fetchOrderById,
  cancelOrder,
} from './ordersThunks';

/**
 * 🎓 ÖĞREN: Orders Slice
 * 
 * Sipariş state'ini yöneten Redux slice.
 * 
 * Sorumlulukları:
 * 1. Sipariş oluşturma (createOrder)
 * 2. Siparişleri listeleme (fetchOrders)
 * 3. Sipariş detayı (fetchOrderById)
 * 4. Sipariş iptal (cancelOrder)
 * 5. Sipariş filtreleme (status, tarih)
 */

/**
 * 🏁 INITIAL STATE
 */
const initialState: OrdersState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  loadingDetails: false,
  creatingOrder: false,
  error: null,
  orderError: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  filters: {},
};

/**
 * 🎯 ORDERS SLICE
 */
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    /**
     * 🔍 SET FILTERS - Filtreleri Ayarla
     */
    setFilters: (state, action: PayloadAction<OrdersState['filters']>) => {
      state.filters = action.payload;
    },

    /**
     * ❌ CLEAR ERROR - Hata Temizle
     */
    clearError: (state) => {
      state.error = null;
      state.orderError = null;
    },

    /**
     * 🗑️ CLEAR SELECTED ORDER - Seçili Siparişi Temizle
     */
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
      state.orderError = null;
    },
  },

  /**
   * 🔄 EXTRA REDUCERS - Async Thunks
   */
  extraReducers: (builder) => {
    /**
     * 🛒 CREATE ORDER - Sipariş Oluştur
     */
    builder
      .addCase(createOrder.pending, (state) => {
        state.creatingOrder = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.creatingOrder = false;
        state.orders.unshift(action.payload); // En başa ekle
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.creatingOrder = false;
        state.error = action.payload as string || 'Sipariş oluşturulamadı';
      });

    /**
     * 📋 FETCH ORDERS - Siparişleri Listele
     */
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Siparişler yüklenemedi';
      });

    /**
     * 🔍 FETCH ORDER BY ID - Sipariş Detayı
     */
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.loadingDetails = true;
        state.orderError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loadingDetails = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loadingDetails = false;
        state.orderError = action.payload as string || 'Sipariş yüklenemedi';
      });

    /**
     * 🚫 CANCEL ORDER - Sipariş İptal
     */
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        
        // Listede güncelle
        const index = state.orders.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        
        // Seçili siparişi güncelle
        if (state.selectedOrder?._id === action.payload._id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Sipariş iptal edilemedi';
      });
  },
});

/**
 * 📤 EXPORT ACTIONS
 */
export const {
  setFilters,
  clearError,
  clearSelectedOrder,
} = ordersSlice.actions;

/**
 * 📤 EXPORT REDUCER
 */
export default ordersSlice.reducer;

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // Sipariş oluştur
 * dispatch(createOrder(orderData));
 * 
 * // Siparişleri listele
 * dispatch(fetchOrders({ page: 1, limit: 10 }));
 * 
 * // Sipariş detayı
 * dispatch(fetchOrderById(orderId));
 * 
 * // Sipariş iptal
 * dispatch(cancelOrder(orderId));
 * 
 * // Filtre uygula
 * dispatch(setFilters({ status: 'shipped' }));
 */