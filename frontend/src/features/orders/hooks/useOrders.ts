// frontend/src/features/orders/hooks/useOrders.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  createOrder,
  fetchOrders,
  fetchOrderById,
  cancelOrder,
} from '../store/ordersThunks';
import {
  setFilters,
  clearError,
  clearSelectedOrder,
} from '../store/ordersSlice';
import type { CreateOrderRequest, OrderStatus } from '../types/order.types';

/**
 * 🎓 ÖĞREN: useOrders Hook
 * 
 * Sipariş işlemlerini kolaylaştıran custom hook.
 */

interface UseOrdersReturn {
  // State
  orders: ReturnType<typeof useAppSelector>['orders']['orders'];
  selectedOrder: ReturnType<typeof useAppSelector>['orders']['selectedOrder'];
  loading: boolean;
  loadingDetails: boolean;
  creatingOrder: boolean;
  error: string | null;
  orderError: string | null;
  pagination: ReturnType<typeof useAppSelector>['orders']['pagination'];
  filters: ReturnType<typeof useAppSelector>['orders']['filters'];
  
  // Functions
  createNewOrder: (orderData: CreateOrderRequest) => Promise<any>;
  loadOrders: (params?: { page?: number; limit?: number; status?: string }) => Promise<any>;
  loadOrderDetails: (orderId: string) => Promise<any>;
  cancelOrderById: (orderId: string) => Promise<any>;
  updateFilters: (filters: { status?: OrderStatus; search?: string }) => void;
  clearOrderError: () => void;
  clearOrder: () => void;
}

/**
 * 🎯 USE ORDERS HOOK
 */
export const useOrders = (): UseOrdersReturn => {
  const dispatch = useAppDispatch();
  
  const {
    orders,
    selectedOrder,
    loading,
    loadingDetails,
    creatingOrder,
    error,
    orderError,
    pagination,
    filters,
  } = useAppSelector((state) => state.orders);
  
  /**
   * 🛒 CREATE NEW ORDER - Sipariş Oluştur
   */
  const createNewOrder = useCallback(
    async (orderData: CreateOrderRequest) => {
      const result = await dispatch(createOrder(orderData));
      return createOrder.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
    },
    [dispatch]
  );
  
  /**
   * 📋 LOAD ORDERS - Siparişleri Yükle
   */
  const loadOrders = useCallback(
    async (params = {}) => {
      const result = await dispatch(fetchOrders(params));
      return fetchOrders.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
    },
    [dispatch]
  );
  
  /**
   * 🔍 LOAD ORDER DETAILS - Sipariş Detayı Yükle
   */
  const loadOrderDetails = useCallback(
    async (orderId: string) => {
      const result = await dispatch(fetchOrderById(orderId));
      return fetchOrderById.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
    },
    [dispatch]
  );
  
  /**
   * 🚫 CANCEL ORDER BY ID - Sipariş İptal
   */
  const cancelOrderById = useCallback(
    async (orderId: string) => {
      const result = await dispatch(cancelOrder(orderId));
      return cancelOrder.fulfilled.match(result)
        ? { success: true, data: result.payload }
        : { success: false, error: result.payload as string };
    },
    [dispatch]
  );
  
  /**
   * 🔍 UPDATE FILTERS - Filtreleri Güncelle
   */
  const updateFilters = useCallback(
    (newFilters: { status?: OrderStatus; search?: string }) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );
  
  /**
   * ❌ CLEAR ERROR - Hata Temizle
   */
  const clearOrderError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  /**
   * 🗑️ CLEAR ORDER - Seçili Siparişi Temizle
   */
  const clearOrder = useCallback(() => {
    dispatch(clearSelectedOrder());
  }, [dispatch]);
  
  return {
    // State
    orders,
    selectedOrder,
    loading,
    loadingDetails,
    creatingOrder,
    error,
    orderError,
    pagination,
    filters,
    
    // Functions
    createNewOrder,
    loadOrders,
    loadOrderDetails,
    cancelOrderById,
    updateFilters,
    clearOrderError,
    clearOrder,
  };
};

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // CheckoutPage
 * const { createNewOrder, creatingOrder } = useOrders();
 * 
 * const handleCheckout = async () => {
 *   const result = await createNewOrder(orderData);
 *   if (result.success) {
 *     toast.success('Sipariş oluşturuldu!');
 *     navigate(`/orders/${result.data._id}`);
 *   }
 * };
 * 
 * // OrdersPage
 * const { orders, loading, loadOrders } = useOrders();
 * 
 * useEffect(() => {
 *   loadOrders({ page: 1, limit: 10 });
 * }, []);
 * 
 * // OrderDetailPage
 * const { selectedOrder, loadOrderDetails } = useOrders();
 * 
 * useEffect(() => {
 *   loadOrderDetails(orderId);
 * }, [orderId]);
 */