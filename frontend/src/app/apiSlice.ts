import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Tüm API'mizin ana tanımı. Diğer slice'lar buraya kendi endpoint'lerini "inject" edecekler.
export const apiSlice = createApi({
    reducerPath: 'api', // Redux store'daki ismi
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:5000/api', // API Gateway adresimiz
        credentials: 'include' // Cookie'lerin gönderilmesi için
    }),
    tagTypes: ['Product', 'User', 'Order', 'Cart'], // Cache invalidation için etiketler
    endpoints: builder => ({}) // Başlangıçta boş, diğer slice'lar dolduracak
});